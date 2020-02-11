import { Cypher } from './cypher'
import { Collection } from './collection'
import { createOnlyGetter, createGetterAndSetter, convertID } from './utils'

class Model {
  /**
   * Constructor
   *
   * @param {Object} values
  */
  constructor (values = {}, labels = [], attributes = {}) {
    this._with = []
    this._values = values
    this._labels = labels
    this._attributes = attributes
    Object.entries(attributes).forEach(([key, field]) => {
      createGetterAndSetter(this, key, field.set, field.get)
    })
    Object.entries(values).forEach(([key, value]) => {
      this[key] = value
    })
  }

  toJSON () {
    return this.retriveInfo(this._values)
  }

  retriveInfo (modelValues) {
    Object.entries(modelValues).forEach(([key, value]) => {
      if (value && value._values) {
        modelValues[key] = this.retriveInfo(value._values)
      } else {
        modelValues[key] = value
      }
    })

    return modelValues
  }

  getAliasName () {
    return this._labels.join('').toLowerCase()
  }

  getNodeName () {
    return this._labels.join(':')
  }

  getCypherName (aliasName = false) {
    if (aliasName) {
      return aliasName + ':' + this.getNodeName()
    }

    return this.getAliasName() + ':' + this.getNodeName()
  }

  getAttributes () {
    return Object.entries(this._attributes)
  }

  /**
   * Check the wih_related if have permission at determined level
   *
   * @param {Integer} level
   * @param {String} nodeName
   * @param {Boolean} overwriteWith
   */
  checkWith (level, nodeName, overwriteWith = false) {
    let ret = false
    // by default the with_related is on this._with
    if (!overwriteWith) overwriteWith = this._with
    overwriteWith.forEach(item => {
      // found the attr named as model attribute
      // console.log('checking', item[level], nodeName)
      if (item[level] === nodeName) {
        ret = true
      }
    })
    return ret
  }

  doMatchs (node, relation, level = 0, onlyRelation = false) {
    if (relation) {
      this.cypher.match(
        relation.previousNode,
        relation.previousAlias,
        relation.relationship,
        node
      )
    } else if (onlyRelation) {
      this.cypher.addReturn(node.getAliasName(), node)
    } else {
      this.cypher.match(node)
    }
    Object.keys(node._attributes).forEach(key => {
      const field = node._attributes[key]
      if (field.isModel) {
        if (this.checkWith(level, key)) {
          const newNode = new field.target()
          newNode.filter_relationship = field.filter_relationship
          this.doMatchs(
            newNode,
            {
              relationship: `:${field.labels.join(':')}`,
              previousNode: node,
              previousAlias: key
            },
            level + 1
          )
        }
      }
    })

    return true
  }

  addMatchs (node, attr) {
    this.cypher.match(node, false, false, false, attr)
  }

  /**
   * Hydrate the model with the values of database
   *
   * @param {Model} model
   * @param {JSON} dataJSON
   * @param {Boolean} isArray
   * @param {Integer} level
   * @param {Boolean} onlyRelation
   */
  hydrate (model, dataJSON, level = 0, onlyRelation = false, previous) {
    if (dataJSON) {
      if (!onlyRelation && !model.id) {
        // create only getter for id
        model._values.id = dataJSON.id
        createOnlyGetter(model, 'id', convertID)
      }
      // hydrate relationship Fields
      if (previous) {
        // THE RELATION HAS ATTRIBUTES
        for (const [relKey, relAttr] of Object.entries(previous.attributes)) {
          // create getter and setter for that attribute inside _values
          createGetterAndSetter(model, relKey, relAttr.set, relAttr.get)
          // if not array should be linked at _values directed
          model._values[relKey] = dataJSON[relKey]
        }
      }
      // hydrate node fields
      Object.entries(model._attributes).forEach(([key, field]) => {
        // if is model should hydrate with the right class
        if (field.isModel && this.checkWith(level, key)) {
          // with_related is ok, so there is information to hydrate
          if (field.isArray) {
            // create getter and setter for that attribute inside _values
            createGetterAndSetter(model, key, field.set, field.get)
            // if is array should create the key as array and push for each record
            model[key] = new Collection()
            dataJSON[key].forEach(data => {
              const targetModel = new field.target()
              const hydrated = this.hydrate(targetModel, data, level + 1, false, field)
              // array should be pushed
              model._values[key].push(hydrated)
            })
          } else {
            // hydrate the model
            const targetModel = new field.target()
            const hydrated = this.hydrate(targetModel, dataJSON[key], level + 1, false, field)
            // create getter and setter for that attribute inside _values
            createGetterAndSetter(model, key, field.set, field.get)
            // if not array should be linked at _values directed
            model._values[key] = hydrated
          }
        } else if (!onlyRelation) {
          // create getter and setter for that attribute inside _values
          createGetterAndSetter(model, key, field.set, field.get, field.checkHash)
          // just a value of the model
          model._values[key] = dataJSON[key]
        }
      })
    }

    return model
  }

  async fetch (with_related = []) {
    return this.constructor.findAll({
      filterAttributes: [
        { key: `id(${this.getAliasName()})`, value: this.id }
      ],
      with_related,
      parent: this,
      onlyRelation: true
    })
  }

  async delete (detach = false) {
    this.cypher = new Cypher()
    this.doMatchs(this, false)
    this.cypher.addWhere({
      attr: `id(${this.getAliasName()})`,
      value: this.id
    })
    const data = await this.cypher.delete(this.getAliasName(), detach)
    return data
  }

  async save () {
    this.cypher = new Cypher()
    if (this.id) {
      // update
      this.cypher.addWhere({
        attr: `id(${this.getAliasName()})`,
        value: this.id
      })
      this.cypher.isDistinct()
      this.doMatchs(this, false)
      Object.entries(this._attributes).forEach(([key, field]) => {
        this._values[key] = field.checkValidation(key, this._values[key])
        if (field.isModel === false) {
          this.cypher.addSet(this.getAliasName() + '.' + key, this._values[key])
        } else {
          // TODO: add the relation
        }
      })
      const data = await this.cypher.update()
      const fields = data._fields[0] // JSON from database

      this.hydrate(this, fields)
    } else {
      // create
      this.doMatchs(this, false)
      Object.entries(this._attributes).forEach(([key, field]) => {
        this._values[key] = field.checkValidation(key, this._values[key])
        if (field.isModel === false) {
          this.cypher.addSet(this.getAliasName() + '.' + key, this._values[key])
        }
      })
      const data = await this.cypher.create(this.getCypherName())

      const fields = data._fields[0] // JSON from database
      this.hydrate(this, fields)
    }
  }

  /**
  * Relate nodes
  *
  * @param {String} attr
  * @param {Model} node
  * @param {JSON} attributes
  */
  async relate (attr, node, attributes = {}, create = true) {
    // CLEAN OLD _WITHS TO NOT INTERFERE
    this._with = []
    this.cypher = new Cypher()
    this.doMatchs(this)
    this.addMatchs(node, attr)
    // ADD TO _WITH TO RETURN THE RELATION
    this._with = [[attr]]
    this.cypher.addWhere({
      attr: `id(${this.getAliasName()})`,
      value: this.id
    })
    this.cypher.addWhere({
      attr: `id(${attr})`,
      value: node.id
    })
    // ADD THE ATTRIBUTES ON RELATION
    Object.entries(attributes).forEach(([key, value]) => {
      this.cypher.addSet(this.getAliasName() + '_' + attr + '.' + key, value)
    })
    // CREATE THE RELATION
    const field = this._attributes[attr]
    field.attr = attr
    const data = await this.cypher.relate(this, field, node, create)
    const fields = data._fields[0] // JSON from database
    this.hydrate(this, fields)
  }

  /**
  * Update a relation between the nodes
  *
  * @param {String} attr
  * @param {Model} node
  * @param {JSON} attributes
  */
  async updateRelationship (attr, node, attributes = {}) {
    return this.relate(attr, node, attributes, false)
  }

  /**
  * Create a relation between the nodes
  *
  * @param {String} attr
  * @param {Model} node
  * @param {JSON} attributes
  */
  async createRelationship (attr, node, attributes = {}) {
    return this.relate(attr, node, attributes, true)
  }

  static async findByID (id, with_related = []) {
    const self = new this()

    const config = {
      with_related,
      filterAttributes: [{
        key: `id(${self.getAliasName()})`,
        value: id
      }]
    }

    const data = await this.findAll(config)

    return data[0]
  }

  static async findBy (filterAttributes = [], config = {}) {
    config.filterAttributes = filterAttributes
    return this.findAll(config)
  }

  static async findAll (config = {}) {
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
    config = Object.assign({
      with_related: [],
      filterAttributes: [],
      onlyRelation: false,
      order_by: [],
      skip: '',
      limit: ''
    },
    config)

    config.with_related.forEach(item => {
      const w = item.split('__')
      self._with.push(w)
    })

    self.cypher = new Cypher()
    self.cypher.isDistinct()
    self.cypher.skip = config.skip
    self.cypher.limit = config.limit
    self.doMatchs(self, false, 0, config.onlyRelation)
    // FILTERS
    config.filterAttributes.forEach(({ key, operator, value }) => {
      const attr = key.indexOf('.') > 0 || key.indexOf('(') > 0 ? key : self.getAliasName() + '.' + key
      self.cypher.addWhere({ attr, operator, value })
    })

    config.order_by.forEach(([key, direction]) => {
      const attr = key.indexOf('.') > 0 || key.indexOf('(') > 0 ? key : self.getAliasName() + '.' + key
      self.cypher.addOrderBy(attr, direction || 'ASC')
    })

    const data = await self.cypher.find()

    const result = new Collection()
    data.forEach(record => {
      let model = new this()
      if (config.parent) {
        model = config.parent
      }
      const fields = record._fields[0] // JSON from database
      const hydrated = self.hydrate(model, fields, 0, config.onlyRelation)

      result.push(hydrated)
    })

    return result
  }
}

export { Model }
