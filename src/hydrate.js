import { createOnlyGetter, createGetterAndSetter, convertID } from './utils'
import { Collection } from './collection'

let _WITH = []
const setWith = with_related => {
  _WITH = with_related
}
/**
 * Hydrate the model with the values of database
 *
 * @param {Model} model
 * @param {JSON} record
 * @param {Boolean} isArray
 * @param {Integer} level
 * @param {Boolean} onlyRelation
 */
const hydrate = (model, record, fieldLookup, level = 0, relationFieldLookup = null, previous = null) => {
  const data = {
    ...record._fields[record._fieldLookup[fieldLookup]],
    ...record._fields[record._fieldLookup[relationFieldLookup]],
  }

  // empty data should return null
  if (Object.keys(data).length === 0) return null

  // save node ID
  model._values.id = data.id
  createOnlyGetter(model, 'id', convertID)
  // console.log('data', data)

  // the relations has attributes
  if (previous)
    for (const [relKey, relAttr] of Object.entries(previous.attributes)) {
      // create getter and setter for that attribute inside _values
      createGetterAndSetter(model, relKey, relAttr.set, relAttr.get)
      // if not array should be linked at _values directed
      if (data[relKey]) model._values[relKey] = data[relKey]
    }

  // hydrate node Fields
  for (const [key, field] of Object.entries(model._attributes)) {
    if (field.isModel) {
      // the information should be requested to be hydrated
      if (checkWith(level, key)) {
        if (field.isArray) {
          // should rehydrate
          // should return as Array (Object with key)
          // if is array should create the key as array and push for each record
          const next = record._fields[record._fieldLookup[key]]
          if (next?.id) {
            // create getter and setter for that attribute inside _values
            createGetterAndSetter(model, key, field.set, field.get)

            const id = convertID(next.id)
            if (model._values[key] === undefined) {
              model._values[key] = new Collection()
              model._values[`${key}_ids`] = []
            }

            if (!model._values[`${key}_ids`].includes(id)) {
              model._values[`${key}_ids`].push(id)
            }
            // console.log('hidratando array', model.getAliasName(), key, model[`${key}_ids`].indexOf(id), record)
            model._values[key][model._values[`${key}_ids`].indexOf(id)] = hydrate(
              new field.target(),
              record,
              key,
              level + 1,
              `${model.getAliasName()}_${key}`,
              field
            )
          }
        } else {
          // should return as Object
          // hydrate the model
          // console.log('hidratando object', model.getAliasName(), key, record)
          const hydrated = hydrate(new field.target(), record, key, level + 1)
          // create getter and setter for that attribute inside _values
          createGetterAndSetter(model, key, field.set, field.get)
          // if not array should be linked at _values directed
          model._values[key] = hydrated
        }
      } // checkWith
    } else {
      // create getter and setter for that attribute inside _values
      createGetterAndSetter(model, key, field.set, field.get, field.checkHash)
      // just a value of the model
      if (data[key]) model._values[key] = data[key]
    }
  }

  return model
}

/**
 * Check the wih_related if have permission at determined level
 *
 * @param {Integer} level
 * @param {String} nodeName
 * @param {Boolean} overwriteWith
 */
const checkWith = (level, nodeName, overwriteWith) => {
  let ret = false
  // by default the with_related is on this._with
  const with_related = overwriteWith ?? _WITH
  with_related.forEach(item => {
    // found the attr named as model attribute
    if (item[level] === nodeName) {
      ret = true
    }
  })
  return ret
}

export { hydrate, checkWith, setWith }
