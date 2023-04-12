import bcrypt from 'bcryptjs'
import { parseISOString } from './utils'

class Field {
  /**
   * Constructor
   *
   * @param {Object} config
   */
  constructor(config = {}) {
    // remove undefined configs to be overwrite by default config
    Object.keys(config).forEach((key) => {
      config[key] === undefined && delete config[key]
    })
    // create default configs
    config = Object.assign(
      {
        type: null,
        isModel: false,
        isArray: false,
        required: false,
        valid: false,
        filter_relationship: false,
        target: false,
        default: undefined,
        min_length: false,
        max_length: false,
        attributes: false,
        labels: [],
        set: (value) => value,
        get: (value) => value,
      },
      config
    )

    // put config on this
    Object.assign(this, config)
  }

  /**
   * Return the String for Label to use on Cypher
   *
   * @return {String}
   */
  getLabelName() {
    return this.labels.join(':').toUpperCase()
  }

  /**
   * Check if has Default value and return
   *
   * @param {String} value
   */
  getDefaultValue(value) {
    if (value !== undefined) {
      return value
    }

    if (this.default !== undefined) {
      return this.default instanceof Function ? this.default() : this.default
    }

    return undefined
  }

  /**
   * Check validations for each Field
   *
   * @param {String} key
   * @param {String} value
   */
  checkValidation(key, value) {
    // valid
    if (
      (this.required && this.valid && !this.valid.includes(value)) ||
      (value && this.valid && !this.valid.includes(value))
    ) {
      throw new Error(
        `{ "key": "${key}", "msg": "Field is not a valid option ${JSON.stringify(this.valid).replace(/"/g, "'")}" }`
      )
    }
    // max_length
    if (this.max_length && value && value.length > this.max_length) {
      throw new Error(`{ "key": "${key}", "msg": "Field has more than ${this.max_length} characters" }`)
    }
    // min_length
    if (this.min_length && value && value.length < this.min_length) {
      throw new Error(`{ "key": "${key}", "msg": "Field has less than ${this.min_length} characters" }`)
    }
    // required
    if (this.required && value === undefined) {
      throw new Error(`{ "key": "${key}", "msg": "Field is required" }`)
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
  static String(obj = {}) {
    const field = new this({
      type: 'string',
      set: obj.set,
      get: obj.get,
      required: obj.required,
      min_length: obj.min_length,
      max_length: obj.max_length,
      default: obj.default,
      valid: obj.valid,
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
  static Integer(obj = {}) {
    const field = new this({
      type: 'integer',
      set: obj.set,
      get: (value) => parseInt(value, 10),
      required: obj.required,
      default: obj.default,
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
  static Float(obj = {}) {
    const field = new this({
      type: 'float',
      set: obj.set,
      get: (value) => parseFloat(value, 10),
      required: obj.required,
      default: obj.default,
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
  static Hash(obj = {}) {
    const salt = bcrypt.genSaltSync(10)
    const field = new this({
      type: 'hash',
      required: obj.required,
      set: (value) => bcrypt.hashSync(`${value}`, salt),
      checkHash: (value, saved) => bcrypt.compareSync(`${value}`, `${saved}`),
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
  static JSON(obj = {}) {
    const field = new this({
      type: 'json',
      required: obj.required,
      default: obj.default,
      set: (value) => JSON.stringify(value),
      get: (value) => JSON.parse(value),
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
  static Boolean(obj = {}) {
    const field = new this({
      type: 'boolean',
      default: obj.default,
      set: obj.set,
      get: (value) => !!value,
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
  static DateTime(obj = {}) {
    const field = new this({
      type: 'datetime',
      required: obj.required,
      default: obj.default,
      set: (objDate) => objDate.toISOString(),
      get: (value) => parseISOString(value),
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
  static Date(obj = {}) {
    const field = new this({
      type: 'date',
      required: obj.required,
      default: obj.default,
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
  static Time(obj = {}) {
    const field = new this({
      type: 'time',
      required: obj.required,
      default: obj.default,
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
  static Relationship(obj = {}) {
    const field = new this({
      type: 'relationship',
      isModel: true,
      required: obj.required,
      target: obj.target,
      labels: obj.labels,
      filter_relationship: obj.filter_relationship,
      filter_node: obj.filter_node,
      attributes: obj.attributes,
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
  static Relationships(obj = {}) {
    const field = new this({
      type: 'relationships',
      isModel: true,
      isArray: true,
      required: obj.required,
      target: obj.target,
      labels: obj.labels,
      filter_relationship: obj.filter_relationship,
      filter_node: obj.filter_node,
      attributes: obj.attributes,
    })
    return field
  }
}

export { Field }
