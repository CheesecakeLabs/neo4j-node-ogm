import { Model, Field } from '../src'

class Text extends Model {
  constructor(values) {
    const labels = ['Text']
    const attributes = {
      value: Field.String(),
    }
    super(values, labels, attributes)
  }
}

class Role extends Model {
  constructor(values, state = { language: 'en_US' }) {
    const labels = ['Role']
    const attributes = {
      key: Field.String({
        required: true,
        set: value => {
          return value.toUpperCase()
        },
        get: value => {
          return `key-${value}`
        },
      }),
      name: Field.Relationship({
        with: true,
        labels: ['TRANSLATE'],
        target: Text,
        filter_relationship: {
          language: state.language,
        },
      }),
    }
    super(values, labels, attributes)
  }
}

class User extends Model {
  constructor(values) {
    const labels = ['User']
    const attributes = {
      name: Field.String(),
      language: Field.String({
        valid: ['pt_BR', 'en_US'],
      }),
      email: Field.String({
        max_length: 255,
        required: true,
      }),
      active: Field.Boolean(),
      password: Field.Hash(),
      created_at: Field.DateTime({
        default: () => new Date(),
      }),
      role: Field.Relationship({
        labels: ['HAS_ROLE'],
        target: Role,
      }), // role : { label: 'HAS_ROLE': children: Node }
      companies: Field.Relationships({
        labels: ['HAS'],
        target: Company,
      }),
      friends: Field.Relationships({
        labels: ['FRIENDSHIP'],
        target: User,
        attributes: {
          intimacy: Field.String(),
        },
      }), // friends : { label: 'FRIENDSHIP': children: [Node, ...] }
    }
    super(values, labels, attributes)
  }
}

class Company extends Model {
  constructor(values) {
    const labels = ['Company']
    const attributes = {
      name: Field.String(),
      builds: Field.Relationships({
        labels: ['HAS'],
        target: Build,
        attributes: {
          purchased_in: Field.String(),
        },
      }),
    }
    super(values, labels, attributes)
  }
}

class Build extends Model {
  constructor(values) {
    const labels = ['Build']
    const attributes = {
      name: Field.String(),
    }
    super(values, labels, attributes)
  }
}

export { User, Role, Text, Company, Build }
