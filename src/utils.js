const createOnlyGetter = (model, fieldName, fget = () => undefined) => {
  Object.defineProperty(model, fieldName, {
    get: function () {
      return fget
    },
    set: function (newValue) {
      return false
    }
  })
}

const createGetterAndSetter = (model, fieldName, fset = (value) => value, fget = (value) => value) => {
  Object.defineProperty(model, fieldName, {
    get: function () {
      const value = fget(model._values[fieldName])
      return value
    },
    set: function (newValue) {
      const value = fset(newValue)
      model._values[fieldName] = value
    }
  })
}

export {
  createOnlyGetter,
  createGetterAndSetter
}
