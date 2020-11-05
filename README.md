# Neo4j Node OGM

Neo4j OGM for Node JS is designed to take care of the CRUD boilerplate involved with setting up a neo4j project with NodeJS. Just install, set up your models and go.

Neo4j support version: 4.X.X

## Usage Instructions

By default the connection will be setted based in your env vars

```
NEO4J_PROTOCOL=bolt
NEO4J_HOST=localhost
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j
NEO4J_PORT=7687
```

And you can use advanced configurations
```
NEO4J_ENCRYPTION
NEO4J_TRUST
NEO4J_TRUSTED_CERTIFICATES
NEO4J_KNOWN_HOSTS
NEO4J_MAX_CONNECTION_POOLSIZE
NEO4J_MAX_TRANSACTION_RETRY_TIME
NEO4J_LOAD_BALANCING_STRATEGY
NEO4J_MAX_CONNECTION_LIFETIME
NEO4J_CONNECTION_TIMEOUT
NEO4J_DISABLE_LOSSLESS_INTEGERS
NEO4J_LOGGING_LEVEL
```

## Cypher Builder

At first, you can only do raw cyphers

```
import { getConnection } from 'neo4j-node-ogm'

const database = getConnection()

try {
  const session = database.session()
  const result = await session.run('MATCH (users:Users {name : $nameParam}) RETURN users', {
    nameParam: 'Natam'
  })
  result.records.forEach(record => {
    console.log(record.get('name'))
  })
  session.close()
} catch(e) {
  console.log(e)
}
```

#### Modeling

```
import { Model, Field } from 'neo4j-node-ogm'

class Text extends Model {
  constructor (values) {
    const labels = ['Text']
    const attributes = {
      value: Field.String()
    }
    super(values, labels, attributes)
  }
}

class Role extends Model {
  constructor (values, state = { language: 'en_US' }) {
    const labels = ['Role']
    const attributes = {
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
          language: state.language
        }
      })
    }
    super(values, labels, attributes)
  }
}

class User extends Model {
  constructor (values) {
    const labels = ['User']
    const attributes = {
      name: Field.String(),
      language: Field.String({
        valid: ['pt_BR', 'en_US']
      }),
      email: Field.String({
        max_length: 255,
        required: true
      }),
      password: Field.Hash(),
      created_at: Field.DateTime({
        default: 'NOW'
      }),
      role: Field.Relationship({
        labels: ['HAS_ROLE'],
        target: Role
      }),
      friends: Field.Relationships({
        labels: ['FRIENDSHIP'],
        target: User,
        attributes: {
          intimacy: Field.String()
        }
      })
    }
    super(values, labels, attributes)
  }
}
```

#### findAll

```
// return Collection of Nodes by default relations are not populated
const users = await User.findAll() // the return is a Object

//feel free to iterable as Object
for (const user of users.toValues()) {
  await user.fetch(['!role__name']) // ! = force to have the relation
}

//or as Array (only data) -> users.toJSON()

```

#### findAll with relations

```
// return Collection of Nodes with your relations already filled
const users = await User.findAll({
 with_related: ['!role__name', 'friends'] // ! = force to have the relation
 state: { language: 'pt-BR'} // force the state inside all models
})

```

#### findBy

```
//return Collection of Nodes with your relations already filled
const users = User.findBy([
  { key: 'name', operator: 'STARTS WITH', value: 'Na', not: true}, //all users that name NOT starts with 'Na'
  { key: 'language', operator: 'IN', value: ['pt_BR', 'en_US']}
  { key: 'role.key', value: 'admin'}
], {
  with_related: ['role__name']
})
```

#### Creating

```
const user = new User({
  email: 'natam.oliveira@ckl.io'
})
user.name = 'Natam Oliveira'
if(!user.isValid()){
  // in user.errors will have the errors
}

await user.save()
```

#### Updating

```
const user = await User.findByID(100) //return Node
if(!user) return 'User not found'
user.name = 'Natam Oliveira 2'
await user.save()
```

#### Deleting Node

```
const user = await User.findByID(100) //return Node
if(user){
  await user.delete()
}
```

#### Deleting Collection

```
const users = await User.findAll() //return Collection
await users.deleteAll()
```

## API

**Collection functions:**

- toValues() - return a Node's Collection as Array
- toJSON() - return a Node's Collection as JSON
- first() - return the first Node or undefined
- length() - return a Integer with the size of Collection
- map(function)
- some(function)

**Collection async functions:**

- deleteAll() - return an Array of true/false

**Model static async functions:**

- findAll({ with_related, filter_attributes, order_by, skip, limit }) - return a Node's Collection
- findBy(filter_attributes, { with_related, order_by, skip, limit }) - return a Node's Collection
- findByID(Integer id, { with_related, order_by }) - return a Node

**Model async functions:**

- save() - return Integer ID/false
- delete(Bool detach) - return true/false
- createRelationship(String attribute, Node to, Object properties)
- updateRelationship(String attribute, Node specificRelatedNode, Object properties) - used to changes relationships attributes
- recreateRelationship(String attribute, Node to, Object properties) - remove old relationships of that attribute
- removeRelationship(String attribute, Node specificRelatedNode)
- removeAllRelationships(String attribute)
- fetch(Array attributes)
- isValid() - return true/false if the field criteria match

Fields type:

- **.String(Object args)**
  - min_length
  - max_length
  - required
  - valid
  - default
  - get
  - set
- **.Integer(Object args)** - Since Integers can be larger than can be represented as JavaScript numbers, it is only safe to convert to JavaScript numbers if you know that they will not exceed (2^53) in size.
  - required
  - default
  - get
  - set
- **.Float(Object args)**
  - required
  - default
  - get
  - set
- **.Hash(Object args)**
  - required
    In this type of Field `const t = obj.attr` will always return a object with the method `checkHash(value)` for you check your string if is the same as saved but you still can set a new value normally `obj.attr = 123`
- **.JSON(Object args)**
  - required
  - default
- **.Boolean(Object args)**
  - default
- **.DateTime(Object args)**
  - required
  - default
- **.Date(Object args)**
  - required
  - default
- **.Time(Object args)**
  - required
  - default
- **.Relationship(Object args)**
  - target
  - labels
  - attributes
  - filter_relationship
  - filter_node
- **.Relationships(Object args)**
  - target
  - labels
  - attributes
  - filter_relationship
  - filter_node

#### Options description

| option              | type                    | description                                                                                                                                      | example                                                                 |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| attributes          | Object                  | Can be at Model (starts with \_ ex: \_attributes) or Field Relationship. Each item of the Array should be a name of one field in `String` format | `_attributes = { name: Field.String() }`                                |
| default             | Function/String/Integer | Default value for the attribute                                                                                                                  | `default: 10`                                                           |
| order_by            | Array of Objects        | Ordenation of the results , direction default is `ASC`                                                                                           | `order_by: [{ key: 'email', direction: 'DESC' }, { key: 'role.name' }]` |
| filter_node         | Object                  | This object is used to filter(where) at relations and will be applied at node                                                                    | `filter_node: { name: 'Natam' }`                                        |
| filter_relationship | Object                  | This object is used to filter(where) at relations and will be applied at relationship                                                            | `filter_relationship: { language: 'en_US' }`                            |
| filter_attributes | Array                  | This array of object is used to filter(where) one collection on FindBy/FindAll/... default operator is `=` and the key can be one relationship (`model1Attribute_model2` is the auto generated name for a relationship)                                                         | `[{ key: 'model.attr', operator: 'STARTS WITH', value: 'Na', not: true }]`                            |
| get                 | Function                | A function to override the get attribute of the Model                                                                                            | `` get: (value) => { return `key-${value}` } ``                         |
| labels              | Array                   | This array can be at Model (starts with \_ ex: \_labels) or a Field Relationship to define the `:LABELS` at neo4j                                | `labels = ['Role']`                                                     |
| min_length          | Integer                 | Define the min length of caracteres of the field                                                                                                 | `min_length: 3`                                                         |
| max_length          | Integer                 | Define the max length of caracteres of the field                                                                                                 | `max_length: 255`                                                       |
| required            | Boolean                 | Validation to force a attribute to be required ( != undefined/null/'' )                                                                          | `required: true`                                                        |
| set                 | Function                | A function to override the set attribute of the Model                                                                                            | `set: (value) => { return value.toUpperCase() }`                        |
| target              | Class                   | A reference of Model to relate Models, `this` is not accepted to refer to self Class                                                             | `target: Text`                                                          |
| valid               | Array                   | A strict whitelist of valid options. All others will be rejected.                                                                                | `valid: ['A', 'B', 'C']`                                                |
