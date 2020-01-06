import { Model, Field } from '../build'

class Text extends Model {
  _labels = ['Text']
  _attributes = {
    value: {
      type: Field.String()
    }
  }
}

class Role extends Model {
  _labels = ['Role']
  _attributes = {
    key: Field.String({
      required: true,
      set: (value) => {
        return value.toUpperCase()
      },
      get: (value) => {
        return `key-${value}`
      }
    }),
    name: Field.Relationship({
      with: true,
      labels: ['TRANSLATE'],
      target: Text,
      filter_relationship: {
        language: 'en_US'
      }
    })
  }
}

class User extends Model {
  _labels = ['User']
  _attributes = {
    name: Field.String(),
    email: Field.String({
      max_length: 255
    }),
    password: Field.Hash(),
    created_at: Field.DateTime({
      default: 'NOW',
    }),
    role: Field.Relationship({
      labels: ['HAS_ROLE'],
      target: Role,
    }), // role : { label: 'HAS_ROLE': children: Node }
    friends: Field.Relationships({
      labels: ['FRIENDSHIP'],
      target: this,
      attributes: {
        intimacy: Field.String()
      }
    }) // friends : { label: 'FRIENDSHIP': children: [Node, ...] }
  }
}

export { User, Role, Text }
