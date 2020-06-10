import { Cypher } from './cypher'
import { Collection } from './collection'
import { createGetterAndSetter, convertID } from './utils'
import { hydrate, checkWith, setWith } from './hydrate'

const ORDER_BY_FUNCTIONS_ALLOWED = [
  'toUpper',
  'toLower',
  'left',
  'lTrim',
  'replace',
  'right',
  'rTrim',
  'trim',
  'substring',
  'toString',
]

class Model {
  /**
   * Constructor
   *
   * @param {Object} values
   */
  constructor(values = {}, labels = [], attributes = {}) {
    this._with = []
    this._values = values
    this._labels = labels
    this._attributes = attributes
    this._alias = null
    this.filter_attributes = []
    this.errors = {}
    Object.entries(attributes).forEach(([key, field]) => {
      createGetterAndSetter(this, key, field.set, field.get)
    })
    Object.entries(values).forEach(([key, value]) => {
      this[key] = value
    })
  }

  /**
   * Start the retrieve Info based on actual Node
   */
  toJSON() {
    return this.retriveInfo(this)
  }

  /**
   * Retrieve Info from Node as a JSON, only with clean data
   *
   * @param {Object} model
   */
  retriveInfo(model, previous) {
    const data = {}
    data.id = model.id

    //attributes of relations
    if (previous) {
      for (const [relKey] of Object.entries(previous.attributes)) {
        if (model._values[relKey]) data[relKey] = model._values[relKey]
      }
    }

    Object.entries(model._attributes).forEach(([key, field]) => {
      switch (field.type) {
        case 'hash':
          break
        case 'relationship':
          if (model._values[key]) data[key] = this.retriveInfo(model._values[key], field)
          break
        case 'relationships':
          if (model._values[key]) {
            data[key] = Object.values(model._values[key]).map(item => this.retriveInfo(item, field))
          }
          break
        default:
          data[key] = model[key]
      }
    })

    return data
  }

  getAliasName() {
    return this._alias ?? this._labels.join('').toLowerCase()
  }

  getNodeName() {
    return this._labels.join(':')
  }

  getCypherName(aliasName = false) {
    if (aliasName) {
      return aliasName + ':' + this.getNodeName()
    }

    return this.getAliasName() + ':' + this.getNodeName()
  }

  getAttributes() {
    return Object.entries(this._attributes)
  }

  writeFilter(forNode, relationAlias = undefined) {
    // FILTERS WITH LOCATION
    this.filter_attributes
      .filter(item => item.for === forNode || item.for === relationAlias)
      .forEach(({ attr, operator, value }) => {
        this.cypher.addWhere({ attr, operator, value })
      })
    this.cypher.matchs.push(this.cypher.writeWhere())
  }

  writeOrderBy() {
    // FILTERS WITH LOCATION
    this.order_by.forEach(({ attr, direction }) => {
      this.cypher.addOrderBy(attr, direction)
    })
  }

  doMatchs(node, relation, level = 0) {
    if (relation) {
      this.cypher.match(relation.previousNode, relation.previousAlias, relation.relationship, node)
      this.cypher.modelReturn(relation.previousAlias, node)
    } else {
      this.cypher.match(node)
      this.cypher.modelReturn(node.getAliasName(), node)
    }

    this.writeFilter(node.getAliasName(), `${relation?.previousNode?.getAliasName()}_${relation?.previousAlias}`)

    Object.keys(node._attributes).forEach(key => {
      const field = node._attributes[key]
      if (field.isModel) {
        const [found_condition, isOptional] = checkWith(level, key, this._with)
        if (found_condition) {
          const newNode = new field.target()
          this.cypher.modelReturnRelation(`${node.getAliasName()}_${key}`, field)
          newNode.filter_relationship = field.filter_relationship
          newNode._alias = key
          newNode.isOptional = isOptional
          this.doMatchs(
            newNode,
            {
              relationship: `:${field.labels.join(':')}`,
              previousNode: node,
              previousAlias: key,
            },
            level + 1
          )
        }
      }
    })

    return true
  }

  addMatchs(node, field) {
    this.cypher.match(node, false, false, false, field.attr)
    this.cypher.modelReturn(field.attr, node)
    this.cypher.modelReturnRelation(field.relationName, field)
    this.writeFilter(field.attr, `${node.getAliasName()}_${field.attr}`)
  }

  async fetch(with_related = []) {
    // reset alias to default
    this._alias = this._labels.join('').toLowerCase()
    // return a hydrated findAll
    return this.constructor.findAll({
      filter_attributes: [{ key: `id(${this.getAliasName()})`, value: this.id }],
      with_related,
      parent: this,
    })
  }

  async delete(detach = false) {
    this.cypher = new Cypher()
    this.filter_attributes = [
      {
        key: `id(${this.getAliasName()})`,
        value: this.id,
      },
    ].map(fa => this.prepareFilter(fa, this))
    this.doMatchs(this, false)

    return this.cypher.delete(this.getAliasName(), detach)
  }

  setAttributes(create = true) {
    Object.entries(this._attributes).forEach(([key, field]) => {
      const defaultValue = field.hasDefaultValue(this._values[key])
      if (defaultValue) this[key] = defaultValue
      try {
        this._values[key] = field.checkValidation(key, this._values[key])
        if (field.isModel === false) {
          this.cypher.addSet(this.getAliasName() + '.' + key, this._values[key])
        } else if (create) {
          // TODO: add the relation
        }
      } catch (e) {
        const error = JSON.parse(e.message)
        this.errors[error.key] = error.msg
        throw new Error('Model invalid, check the .errors attribute')
      }
    })
  }

  isValid() {
    let ret = true
    this.errors = {}

    Object.entries(this._attributes).forEach(([key, field]) => {
      const data = field.hasDefaultValue(this._values[key]) || this._values[key]
      try {
        field.checkValidation(key, data)
      } catch (e) {
        const error = JSON.parse(e.message)
        this.errors[error.key] = error.msg
        ret = false
      }
    })

    return ret
  }

  async save() {
    this.cypher = new Cypher()
    if (this.id === undefined) {
      // create
      this.doMatchs(this, false)

      this.setAttributes(false)

      const record = await this.cypher.create(this.getCypherName())

      hydrate(this, record)
    } else {
      // update
      this.cypher.addWhere({
        attr: `id(${this.getAliasName()})`,
        value: this.id,
      })
      this.cypher.isDistinct()
      this.doMatchs(this, false)

      this.setAttributes()

      const record = await this.cypher.update()

      hydrate(this, record[0])
    }
  }

  /**
   * Relate nodes
   *
   * @param {String} attr
   * @param {Model} node
   * @param {JSON} attributes
   */
  async relate(attr, node, attributes = {}, create = true) {
    // ADD TO _WITH TO RETURN THE RELATION
    this._with = []
    this.cypher = new Cypher()
    this.filter_attributes = [
      {
        key: `id(${this.getAliasName()})`,
        value: this.id,
      },
      {
        key: `id(${attr})`,
        value: node.id,
      },
    ].map(fa => this.prepareFilter(fa, this))
    this.doMatchs(this)

    // CREATE THE RELATION FOR THIS ATTR
    const field = this._attributes[attr]
    if (!field) throw new Error(`Attribute "${attr}" does not exists on model "${this.getAliasName()}"`)
    field.attr = attr
    field.relationName = `${this.getAliasName()}_${attr}`

    this.addMatchs(node, field)
    // ADD TO _WITH TO RETURN THE RELATION
    this._with = [[attr]]
    setWith(this._with) // used on hydrate
    // ADD THE ATTRIBUTES ON RELATION
    Object.entries(attributes).forEach(([key, value]) => {
      this.cypher.addSet(this.getAliasName() + '_' + attr + '.' + key, value)
    })

    const data = await this.cypher.relate(this, field, node, create)
    data.forEach(record => {
      hydrate(this, record)
    })
  }

  /**
   * Update a relation between the nodes
   *
   * @param {String} attr
   * @param {Model} node
   * @param {JSON} attributes
   */
  async updateRelationship(attr, node, attributes = {}) {
    return this.relate(attr, node, attributes, false)
  }

  /**
   * Create a relation between the nodes
   *
   * @param {String} attr
   * @param {Model} node
   * @param {JSON} attributes
   */
  async createRelationship(attr, node, attributes = {}) {
    return this.relate(attr, node, attributes, true)
  }

  /**
   * Remove the relations about that attribute
   *
   * @param {String} attr
   */
  async removeAllRelationships(attr) {
    this.cypher = new Cypher()
    this._with = [[attr]]
    this.filter_attributes = [
      {
        key: `id(${this.getAliasName()})`,
        value: this.id,
      },
    ].map(fa => this.prepareFilter(fa, this))
    this.doMatchs(this)
    return this.cypher.delete(`${this.getAliasName()}_${attr}`)
  }

  /**
   * Remove the one single relationship based on other node
   *
   * @param {String} attr
   */
  async removeRelationship(attr, node) {
    this.cypher = new Cypher()
    this._with = [[attr]]
    this.filter_attributes = [
      {
        key: `id(${this.getAliasName()})`,
        value: this.id,
      },
      {
        key: `id(${attr})`,
        value: node.id,
      },
    ].map(fa => this.prepareFilter(fa, this))

    this.doMatchs(this)

    return this.cypher.delete(`${this.getAliasName()}_${attr}`)
  }

  /**
   * Create a new relation and remove the older
   *
   * @param {String} attr
   * @param {Model} node
   * @param {JSON} attributes
   */
  async recreateRelationship(attr, node, attributes = {}) {
    try {
      await this.removeAllRelationships(attr)
    } catch (e) {
      // nothing
    }

    try {
      const data = await this.relate(attr, node, attributes, true)
      return data
    } catch (e) {
      throw new Error('new relation is not possible')
    }
  }

  static async findByID(id, config = {}) {
    const self = new this()

    config.filter_attributes = [
      {
        key: `id(${self.getAliasName()})`,
        value: parseInt(id, 10),
      },
    ].concat(config.filter_attributes)

    const data = await this.findAll(config)
    return data.first()
  }

  static async findBy(filter_attributes = [], config = {}) {
    config.filter_attributes = filter_attributes
    return this.findAll(config)
  }

  static async findAll(config = {}) {
    let self
    if (!config.parent) {
      self = new this()
    } else {
      self = config.parent
      self.parent = true
    }

    Object.keys(config).forEach(key => {
      config[key] === undefined && delete config[key]
    })
    config = Object.assign(
      {
        with_related: [],
        filter_attributes: [],
        onlyRelation: false,
        order_by: [],
        skip: '',
        limit: '',
        optional: true,
      },
      config
    )

    config.with_related.forEach(item => {
      const w = item.split('__')
      self._with.push(w)
    })
    setWith(self._with)

    self.cypher = new Cypher()
    // self.cypher.isDistinct()
    self.cypher.optional = config.optional
    self.cypher.skip = config.skip
    self.cypher.limit = config.limit
    self.filter_attributes = config.filter_attributes.map(fa => self.prepareFilter(fa, self))

    self.order_by = config.order_by.map(ob => {
      const isCypherFunction = /.+\(.+\)/.test(ob.key)
      if (isCypherFunction) {
        const regExp = /(.+)\(([^)]+)\)/
        const matches = regExp.exec(ob.key)

        if (!ORDER_BY_FUNCTIONS_ALLOWED.includes(matches[1]))
          throw new Error(`Function (${matches[1]}) are not allowed in order_by`)

        ob.for = matches[2]
        ob.attr = ob.key
      } else {
        ob.for = ob.key.split('.').length > 1 ? ob.key.split('.')[0] : self.getAliasName()
        ob.attr = ob.key.split('.').length > 1 ? ob.key : `${self.getAliasName()}.${ob.key}`
      }

      return ob
    })
    self.doMatchs(self, false, 0)
    self.writeOrderBy()

    const data = await self.cypher.find()

    const result = new Collection()
    const ids = []
    data.forEach(record => {
      let model = new this()
      const main = record._fields[record._fieldLookup[model.getAliasName()]]
      const id = convertID(main.id)

      if (config.parent) {
        model = config.parent
      } else {
        if (ids.includes(id)) {
          model = result[ids.indexOf(id)]
        } else {
          ids.push(id)
        }
      }

      result[ids.indexOf(id)] = hydrate(model, record)
    })

    return result
  }

  prepareFilter(fa, model) {
    if (!fa) return false
    const isCypherFunction = /.+\(.+\)/.test(fa.key)
    if (isCypherFunction) {
      const regExp = /\(([^)]+)\)/
      const matches = regExp.exec(fa.key)

      //matches[1] contains the value between the parentheses
      fa.for = matches[1]
      fa.attr = fa.key
    } else {
      fa.for = fa.key.split('.').length > 1 ? fa.key.split('.')[0] : model.getAliasName()
      fa.attr = fa.key.split('.').length > 1 ? fa.key : `${model.getAliasName()}.${fa.key}`
    }
    return fa
  }
}

export { Model }
