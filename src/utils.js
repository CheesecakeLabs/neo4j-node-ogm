const createOnlyGetter = (model, fieldName, fget = () => undefined) => {
  Object.defineProperty(model, fieldName, {
    configurable: true,
    get: function () {
      const value = fget(model._values[fieldName])
      return value
    },
    set: function (newValue) {
      return false
    }
  })
}

const createGetterAndSetter = (model, fieldName, fset = (value) => value, fget = (value) => value, checkHash = false) => {
  Object.defineProperty(model, fieldName, {
    configurable: true,
    get: function () {
      if (checkHash) {
        return { checkHash: (value) => checkHash(value, model._values[fieldName]) }
      } else {
        const value = fget(model._values[fieldName])
        return value
      }
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

const parseISOString = (s) => {
  const b = s.split(/\D+/)
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]))
}

export {
  createOnlyGetter,
  createGetterAndSetter,
  convertID,
  parseISOString
}
