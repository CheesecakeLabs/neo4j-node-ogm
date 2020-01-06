const createOnlyGetter = (model, fieldName, fget = () => undefined) => {
  Object.defineProperty(model, fieldName, {
    get: function () {
      const value = fget(model._values[fieldName])
      return value
    },
    set: function (newValue) {
      return false
    }
  })
}

const createGetterAndSetter = (model, fieldName, fset = (value) => value, fget = (value) => value) => {
  Object.defineProperty(model, fieldName, {
    configurable: true,
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

const convertID = ({ low, high }) => {
  let res = high

  for (let i = 0; i < 32; i++) {
    res *= 2
  }

  return low + res
}

export {
  createOnlyGetter,
  createGetterAndSetter,
  convertID
}
