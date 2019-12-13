import md5 from 'crypto-js/md5'

class Field {
  constructor (config = {}) {
    // remove undefined configs to be overwrite by default config
    Object.keys(config).forEach(key => {
      config[key] === undefined && delete config[key]
    })
    config = Object.assign({
      isModel: false,
      isArray: false,
      required: false,
      filter_relationship: false,
      target: false,
      labels: [],
      set: (value) => value,
      get: (value) => value
    },
    config)

    // put config on this
    Object.assign(this, config)
  }

  static String (obj = {}) {
    const field = new this({
      set: obj.set,
      get: obj.get,
      required: obj.required
    })
    return field
  }

  static Hash (obj = {}) {
    const field = new this({
      set: (value) => md5(value)
    })
    return field
  }

  static DateTime (obj = {}) {
    const field = new this({
      required: obj.required
    })
    return field
  }

  static Relationship (obj = {}) {
    const field = new this({
      isModel: true,
      required: obj.required,
      target: obj.target,
      labels: obj.labels,
      filter_relationship: obj.filter_relationship
    })
    return field
  }

  static Relationships (obj = {}) {
    const field = new this({
      isModel: true,
      isArray: true,
      required: obj.required,
      target: obj.target,
      labels: obj.labels,
      filter_relationship: obj.filter_relationship
    })
    return field
  }
}

export {
  Field
}
