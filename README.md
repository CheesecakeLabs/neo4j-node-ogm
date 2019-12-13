# Neo4j Node OGM
**THIS IS A WORK IN PROGRESS** not ready for use yet

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
try {
  const result = await neo4j.cypher('MATCH (users:Users {name : $nameParam}) RETURN users', {
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
      target: new Text(),
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
      target: new Role(),
    }), // role : { label: 'HAS_ROLE': children: Node }
    friends: Field.Relationships({
      labels: ['FRIENDSHIP'],
      target: new this(),
      attributes: {
        intimacy: Field.String()
      }
    }) // friends : { label: 'FRIENDSHIP': children: [Node, ...] }
  }
}
```

#### findAll
```
//return Collection of Nodes by default relations are not populated
const users = await User.findAll()

const data = users.toJSON()

//or feel free to iterable
users.forEach(user => {
    console.log(user)
})
```

#### findAll with relations
```
//return Collection of Nodes with your relations already filled
const users = await User.findAll({
 with_related: ['role__name', 'friends']  
})

const data = users.toJSON()

//or feel free to iterable
users.forEach(user => {
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

//or feel free to get the info
const users = User.findAll() //return Collection of Node
users.forEach(user => {
    const friends = user.friends.findAll()
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
const user = await User.findAll() //return Collection
await user.deleteAll()
```

## API
Model sync functions:
* with(Array fields)
  * the attributes that are Relationships are not selected by default so you can say what you wanted to be selected in that Match
  * the values can be concatenated with __ and that represents a children Relationship that should be added to that Match
* setValue(attribute, value) - return void, used to set a new value to Model

Model async functions:
* findAll({ with_related, filterAttributes, skip, limit }) - return a Node's Collection
* findBy(filterAttributes, { with_related, skip, limit }) - return a Node's Collection
* findByID(Integer id) - return a Node
* save() - return Integer ID/false
* merge(Array fields) - return true/false
* delete(Bool detach) - return true/false
* relate(Node from, Node to, Array labels, Object properties)

Fields type:
* **.String(Object args)**
  * max_length
  * required
  * valid
  * default
* **.Integer(Object args)** - Since Integers can be larger than can be represented as JavaScript numbers, it is only safe to convert to JavaScript numbers if you know that they will not exceed (2^53) in size.
  * required
  * default
* **.Hash(Object args)**
  * required
* **.JSON(Object args)**
  * required
  * default
* **.Boolean(Object args)**
  * default
* **.DateTime(Object args)**
  * default
* **.Date(Object args)**
  * default
* **.Time(Object args)**
  * default
* **.Relationship(Object args)**
  * target
  * labels
  * attributes
* **.Relationships(Object args)**
  * target
  * labels
  * attributes

#### Options description

| option | type | description | example |
| -- | -- | -- | -- |
| attributes | Object | Can be at Model (starts with _ ex: _attributes) or Field Relationship. Each item of the Array should be a name of one field in `String` format | `_attributes = { name: Field.String() }`  |
| default | Object/String/Integer | Default value for the attribute | ` default: 10 ` |
| filter_node | Object | This object is used to filter(where) at relations and will be applied at node | ` filter_node: { name: 'Natam' } ` |
| filter_relationship | Object | This object is used to filter(where) at relations and will be applied at relationship | ` filter_relationship: { language: 'en_US' } ` |
| get | Function | A function to override the get attribute of the Model | ```get: (value) => { return `key-${value}` }``` |
| labels | Array | This array can be at Model (starts with _ ex: _labels) or a Field Relationship to define the `:LABELS` at neo4j | `labels = ['Role']` |
| max_length | Integer | Define the max length of caracteres of the field | `max_length: 255` |
| required | Boolean | Validation to force a attribute to be required ( != undefined/null/'' ) | `required: true` |
| set | Function | A function to override the set attribute of the Model | `set: (value) => { return value.toUpperCase() }` |
| target | Class | A instance Model to relate Models, `this` is accepted to refer to self Class | `target: new Text()` |
| valid | Array | A strict whitelist of valid options.  All others will be rejected. | `valid: ['A', 'B', 'C']` |
