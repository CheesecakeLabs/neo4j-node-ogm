import md5 from 'crypto-js/md5'

class Field {
  /**
   * Constructor
   *
   * @param {Object} config
   */
  constructor (config = {}) {
    // remove undefined configs to be overwrite by default config
    Object.keys(config).forEach(key => {
      config[key] === undefined && delete config[key]
    })
    // create default configs
    config = Object.assign({
      isModel: false,
      isArray: false,
      required: false,
      valid: false,
      filter_relationship: false,
      target: false,
      default: false,
      min_length: false,
      max_length: false,
      attributes: false,
      labels: [],
      set: (value) => value,
      get: (value) => value
    },
    config)

    // put config on this
    Object.assign(this, config)
  }

  /**
   * Return the String for Label to use on Cypher
   *
   * @return {String}
   */
  getLabelName () {
    return this.labels.join(':').toUpperCase()
  }

  /**
   * Check validations for each Field
   *
   * @param {String} key
   * @param {String} value
   */
  checkValidation (key, value) {
    // default
    if (!value && this.default) {
      return (this.default instanceof Function) ? this.default() : this.default
    }
    // valid
    if (
      (this.required && this.valid && !this.valid.includes(value)) ||
      (value && this.valid && !this.valid.includes(value))
    ) {
      throw new Error(`Field: ${key} is not a valid option ${JSON.stringify(this.valid)}`)
    }
    // required
    if (this.required && !value) {
      throw new Error(`Field: ${key} is required`)
    }

    return value
  }

  /**
   * @static
   * Generate Field instance
   * for string attributes
   *
   * @return {Field}
   */
  static String (obj = {}) {
    const field = new this({
      set: obj.set,
      get: obj.get,
      required: obj.required,
      min_length: obj.min_length,
      max_length: obj.max_length,
      default: obj.default,
      valid: obj.valid
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for integer attributes
   *
   * @return {Field}
   */
  static Integer (obj = {}) {
    const field = new this({
      set: obj.set,
      get: obj.get,
      required: obj.required,
      default: obj.default
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for float attributes
   *
   * @return {Field}
   */
  static Float (obj = {}) {
    const field = new this({
      set: obj.set,
      get: obj.get,
      required: obj.required,
      default: obj.default
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for hash attributes, automatic md5 to save
   *
   * @return {Field}
   */
  static Hash (obj = {}) {
    const field = new this({
      required: obj.required,
      set: (value) => md5(`${value}`)
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for json attributes
   *
   * @return {Field}
   */
  static JSON (obj = {}) {
    const field = new this({
      required: obj.required,
      default: obj.default,
      set: (value) => JSON.stringify(value),
      get: (value) => JSON.parse(value)
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for boolean attributes
   *
   * @return {Field}
   */
  static Boolean (obj = {}) {
    const field = new this({
      default: obj.default
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for datetime attributes
   *
   * @return {Field}
   */
  static DateTime (obj = {}) {
    const field = new this({
      required: obj.required,
      default: obj.default
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for date attributes
   *
   * @return {Field}
   */
  static Date (obj = {}) {
    const field = new this({
      required: obj.required,
      default: obj.default
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for time attributes
   *
   * @return {Field}
   */
  static Time (obj = {}) {
    const field = new this({
      required: obj.required,
      default: obj.default
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for relationship attributes
   *
   * @return {Field}
   */
  static Relationship (obj = {}) {
    const field = new this({
      isModel: true,
      required: obj.required,
      target: obj.target,
      labels: obj.labels,
      filter_relationship: obj.filter_relationship,
      filter_node: obj.filter_node,
      attributes: obj.attributes
    })
    return field
  }

  /**
   * @static
   * Generate Field instance
   * for relationships attributes
   *
   * @return {Field}
   */
  static Relationships (obj = {}) {
    const field = new this({
      isModel: true,
      isArray: true,
      required: obj.required,
      target: obj.target,
      labels: obj.labels,
      filter_relationship: obj.filter_relationship,
      filter_node: obj.filter_node,
      attributes: obj.attributes
    })
    return field
  }
}

export {
  Field
}
