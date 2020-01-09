# Neo4j Node OGM
**THIS IS A WORK IN PROGRESS** not ready for production

Neo4j OGM for Node JS is designed to take care of the CRUD boilerplate involved with setting up a neo4j project with NodeJS. Just install, set up your models and go.
## Usage Instructions

By default the connection will be setted based in your env vars
```
NEO4J_PROTOCOL=bolt
NEO4J_HOST=localhost
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j
NEO4J_PORT=7687
```
## Cypher Builder
At first, you can only do raw cyphers
```
import { getConnection } from 'neo4j-node-ogm'

const database = getConnection()

try {
  const result = await database.cypher('MATCH (users:Users {name : $nameParam}) RETURN users', {
    nameParam: 'Natam'
  })
  result.records.forEach(record => {
    console.log(record.get('name'))
  })
} catch(e) {
  console.log(e)
}
```
#### Modeling
```
import { Model, Field } from 'neo4j-node-ogm'

class Text extends Model {
  _labels = ['Text']
  _attributes = {
    value: Field.String()
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
    }), // role : Role
    friends: Field.Relationships({
      labels: ['FRIENDSHIP'],
      target: User,
      attributes: {
        intimacy: Field.String()
      }
    }) // friends : [User]
  }
}
```

#### findAll
```
// return Collection of Nodes by default relations are not populated
const users = await User.findAll()

const data = users.toJSON()

// or feel free to iterable
await users.asyncForEach(async user => {
  // calling a relationship attribute will trigger an async function
  // that populate the key
  await user.fetch(['role__name'])
})
```

#### findAll with relations
```
// return Collection of Nodes with your relations already filled
const users = await User.findAll({
 with_related: ['role__name', 'friends']  
})

const data = users.toJSON()

// or feel free to iterable not synchronous
users.forEach(user => {
    console.log(user.friends)
    console.log(user.role.name.value)
})

// awaiting for results synchronous
await users.asyncForEach(async user => {
    console.log(user.friends)
    console.log(user.role.name.value)
})
```

#### findBy
```
//return Collection of Nodes with your relations already filled
const users = User.findBy([
  { key: 'name', operator: 'STARTS WITH', value: 'Na'},
  { key: 'role.key', value: 'admin'}
], {
  with: ['role__name']
})
```


#### Creating
```
const user = new User({
  email: 'natam.oliveira@ckl.io'
})
user.name = 'Natam Oliveira'
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

Model static async functions:
* findAll({ with_related, filterAttributes, skip, limit }) - return a Node's Collection
* findBy(filterAttributes, { with_related, skip, limit }) - return a Node's Collection
* findByID(Integer id) - return a Node

Model async functions:
* save() - return Integer ID/false
* merge(Array fields) - return true/false
* delete(Bool detach) - return true/false
* relate(Node from, Node to, Array labels, Object properties)
* fetch(Array attributes)

Fields type:
* **.String(Object args)**
  * min_length
  * max_length
  * required
  * valid
  * default
  * get
  * set
* **.Integer(Object args)** - Since Integers can be larger than can be represented as JavaScript numbers, it is only safe to convert to JavaScript numbers if you know that they will not exceed (2^53) in size.
  * required
  * default
  * get
  * set
* **.Float(Object args)**
  * required
  * default
  * get
  * set
* **.Hash(Object args)**
  * required
* **.JSON(Object args)**
  * required
  * default
* **.Boolean(Object args)**
  * default
* **.DateTime(Object args)**
  * required
  * default
* **.Date(Object args)**
  * required
  * default
* **.Time(Object args)**
  * required
  * default
* **.Relationship(Object args)**
  * target
  * labels
  * attributes
  * filter_relationship
  * filter_node
* **.Relationships(Object args)**
  * target
  * labels
  * attributes
  * filter_relationship
  * filter_node

#### Options description

| option | type | description | example |
| -- | -- | -- | -- |
| attributes | Object | Can be at Model (starts with _ ex: _attributes) or Field Relationship. Each item of the Array should be a name of one field in `String` format | `_attributes = { name: Field.String() }`  |
| default | Object/String/Integer | Default value for the attribute | ` default: 10 ` |
| filter_node | Object | This object is used to filter(where) at relations and will be applied at node | ` filter_node: { name: 'Natam' } ` |
| filter_relationship | Object | This object is used to filter(where) at relations and will be applied at relationship | ` filter_relationship: { language: 'en_US' } ` |
| get | Function | A function to override the get attribute of the Model | ```get: (value) => { return `key-${value}` }``` |
| labels | Array | This array can be at Model (starts with _ ex: _labels) or a Field Relationship to define the `:LABELS` at neo4j | `labels = ['Role']` |
| min_length | Integer | Define the min length of caracteres of the field | `min_length: 3` |
| max_length | Integer | Define the max length of caracteres of the field | `max_length: 255` |
| required | Boolean | Validation to force a attribute to be required ( != undefined/null/'' ) | `required: true` |
| set | Function | A function to override the set attribute of the Model | `set: (value) => { return value.toUpperCase() }` |
| target | Class | A reference of Model to relate Models, `this` is not accepted to refer to self Class | `target: Text` |
| valid | Array | A strict whitelist of valid options.  All others will be rejected. | `valid: ['A', 'B', 'C']` |
