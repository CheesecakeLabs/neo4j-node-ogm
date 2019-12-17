import { getConnection } from './driver'
import { Cypher } from './cypher'
import { Collection } from './collection'
import { createOnlyGetter, createGetterAndSetter } from './utils'

class Model {
  /**
   * Constructor
   *
   * @param {Object} values
  */
  constructor (values = {}) {
    this._with = []
    this._values = values
  }

  convertID ({ low, high }) {
    let res = high

    for (let i = 0; i < 32; i++) {
      res *= 2
    }

    return low + res
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
      if (item[level] === nodeName) {
        ret = true
      }
    })
    return ret
  }

  doMatchs (node, relation, level = 0) {
    if (relation) {
      this.cypher.match(
        relation.previousNode,
        relation.previousAlias,
        relation.relationship,
        node
      )
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

  hydrate (model, dataJSON, isArray = false, level = 0) {
    if (dataJSON) {
      Object.entries(model._attributes).forEach(([key, attr]) => {
        // if is model should hydrate with the right class
        if (attr.isModel) {
          // with_related is ok, so there is information to hydrate
          if (this.checkWith(level, key)) {
            if (Array.isArray(dataJSON[key])) {
              // create getter and setter for that attribute inside _values
              createGetterAndSetter(model, key, attr.set, attr.get)
              // if is array should create the key as array and push for each record
              model[key] = []
              dataJSON[key].forEach(data => {
                this.hydrate(model, data, true)
              })
            } else {
              // hydrate the model
              const targetModel = new attr.target()
              const hydrated = this.hydrate(targetModel, dataJSON[key], false, level + 1)
              if (attr.isArray) {
                // array should be pushed
                model._values[key].push(hydrated)
              } else {
                // create getter and setter for that attribute inside _values
                createGetterAndSetter(model, key, attr.set, attr.get)
                // if not array should be linked at _values directed
                model._values[key] = hydrated
              }
            }
          } else {
            // is not related, so we should hydrate with target model
            // that way the attribute is executed a match when accessed
            const functionToFind = (value) => {
              // hidrate _values?
              const data = attr.target.findAll()
              data.then(values => {
                model._values[key] = values
              })
              return data
            }
            createGetterAndSetter(model, key, (value) => value, functionToFind)
          }
        } else {
          // create getter and setter for that attribute inside _values
          createGetterAndSetter(model, key, attr.set, attr.get)
          // just a value of the model
          model._values[key] = dataJSON[key]
        }
      })
      // create only getter for id
      model._values.id = dataJSON.id
      createOnlyGetter(model, 'id', () => model.convertID(dataJSON.id))
    }

    return model
  }

  async delete () {
    this.cypher = new Cypher()
    this.doMatchs(this, false)
    this.cypher.addWhere({
      attr: `id(${this.getAliasName()})`,
      value: this.id
    })
    const data = await this.cypher.delete(this.getAliasName())
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
      Object.keys(this._attributes).forEach(key => {
        const field = this._attributes[key]
        if (field.isModel === false) {
          this.cypher.addSet(this.getAliasName() + '.' + key, this[key])
        }
      })
      const data = await this.cypher.update()
      return data
    } else {
      // create
      this.doMatchs(this, false)
      Object.keys(this._attributes).forEach(key => {
        const field = this._attributes[key]
        if (field.isModel === false) {
          this.cypher.addSet(this.getAliasName() + '.' + key, this[key])
        }
      })
      const data = await this.cypher.create(this.getCypherName())
      this.id = this.convertID(data)
    }
  }

  static async findByID (id, config = {}) {
    const self = new this()

    config = Object.assign({
      with_related: [],
      filterAttributes: [{
        key: `id(${self.getAliasName()})`,
        value: id
      }]
    },
    config)

    const data = await this.findAll(config)

    return data[0]
  }

  static async findBy (filterAttributes = [], config = {}) {
    config.filterAttributes = filterAttributes
    return this.findAll(config)
  }

  static async findAll (config = {}) {
    const self = new this()

    Object.keys(config).forEach(key => {
      config[key] === undefined && delete config[key]
    })
    config = Object.assign({
      with_related: [],
      filterAttributes: []
    },
    config)

    config.with_related.forEach(item => {
      const w = item.split('__')
      self._with.push(w)
    })

    self.cypher = new Cypher()
    self.doMatchs(self, false)
    // FILTERS
    config.filterAttributes.forEach(({ key, operator, value }) => {
      const attr = key.indexOf('.') > 0 || key.indexOf('(') > 0 ? key : self.getAliasName() + '.' + key
      self.cypher.addWhere({ attr, operator, value })
    })

    const data = await self.cypher.find()

    const result = new Collection()
    data.forEach(record => {
      const model = new this()
      const fields = record._fields[0] // JSON from database
      const hydrated = self.hydrate(model, fields)

      result.push(hydrated)
    })

    return result
  }
}

export { Model }
