import { getConnection } from './driver'

const database = getConnection()
class Cypher {
  constructor (stmt = '') {
    this.clean(stmt)
  }

  clean (stmt = '') {
    this.nodes = []
    this.matchs = []
    this.wheres = []
    this.whereString = ''
    this.sets = []
    this.setString = ''
    this.return = {}
    this.returnString = ''
    this.distinct = ''
    this.stmt = stmt
  }

  addWhere ({ attr, operator = '=', value }) {
    const whereString = `${attr} ${operator} ${Number.isInteger(value) ? value : `'${value}'`}`
    this.wheres.push(whereString)
  }

  writeWhere () {
    if (this.wheres.length > 0) {
      this.whereString = ` WITH ${this.nodes.join(', ')}`
      this.whereString = ` WHERE ${this.wheres.join(' AND ')}`
    }
  }

  match (node, previousAlias = false, relationship = false, targetModel = false) {
    if (targetModel) {
      const relationName = `${node.getAliasName()}_${previousAlias}${relationship}`

      let filterRelationship = ''
      if (targetModel.filter_relationship) {
        filterRelationship = '{' + Object.entries(targetModel.filter_relationship).map(([key, value]) => `${key}:'${value}'`).join(', ') + '}'
      }
      this.matchs.push(`OPTIONAL MATCH (${node.getCypherName()})-[${relationName} ${filterRelationship}]-(${targetModel.getCypherName(previousAlias)})`)
      this.nodes.push(previousAlias)
    } else {
      this.matchs.push(`MATCH (${node.getCypherName()})`)
      this.nodes.push(node.getAliasName())
      this.return[node.getAliasName()] = node
    }
  }

  addSet (attr, value) {
    if (value) {
      this.sets.push(`${attr} = '${value}'`)
    }
  }

  writeSets () {
    if (this.sets.length > 0) {
      this.setString = `SET ${this.sets.join(' AND ')}`
    }
  }

  isDistinct (bool = true) {
    this.distinct = bool ? 'DISTINCT' : ''
  }

  writeReturn (nodes, isFind = true) {
    this.isFind = isFind
    for (const [alias, model] of Object.entries(nodes)) {
      this.actualModel = model
      this.modelReturn(alias, model, model.getAliasName())
    }
  }

  modelReturn (alias, model, attributeID, level = 0, isModel = false, isArray = true, wasCollected = false) {
    this.returnString += `${alias} {`

    const attrs = []
    let willCollect = false
    attrs.push(`id:id(${attributeID})`)

    for (const [attr, field] of Object.entries(model._attributes)) {
      if (field.isModel) {
        if (model.checkWith(level, attr, this.actualModel._with) && this.isFind) {
          if (field.isModel && level < 1) {
            willCollect = true
          }
          this.modelReturn(`${attr}:${willCollect ? 'collect(' + attr : attr}`, new field.target(), attr, level + 1, field.isModel, field.isArray, willCollect)
        }
      } else {
        attrs.push(`.${attr}`)
      }
    }

    this.returnString += `${attrs.join(', ')} }`

    if (wasCollected) {
      if (isArray) {
        this.returnString += ') '
      } else {
        this.returnString += ')[0] '
      }
    }

    if (level > 0) {
      this.returnString += ','
    }
  }

  async create (nodeAlias) {
    this.writeSets()
    this.writeReturn(this.return, false)
    const stmt = `CREATE (${nodeAlias}) ${this.whereString} ${this.setString} RETURN ${this.returnString}`

    const session = await database.session()

    let result
    try {
      result = await session.run(stmt)
      result = result.records[0]._fields[0].id
    } catch (e) {
      result = false
    }

    session.close()
    this.clean()
    return result
  }

  async update () {
    this.writeWhere()
    this.writeSets()
    this.writeReturn(this.return, false)
    const stmt = `${this.matchs.join(' ')} ${this.whereString} ${this.setString} RETURN ${this.returnString}`

    const session = await database.session()

    let result
    try {
      result = await session.run(stmt)
      result = result.records[0]._fields[0].id
    } catch (e) {
      result = false
    }

    session.close()
    this.clean()
    return result
  }

  async delete (alias) {
    this.writeWhere()

    const stmt = `${this.matchs.join(' ')} ${this.whereString} DELETE ${alias}`
    console.log(stmt)
    const session = await database.session()

    let result
    try {
      await session.run(stmt)
      result = true
    } catch (e) {
      result = false
    }

    session.close()
    this.clean()
    return result
  }

  async find () {
    this.writeWhere()
    this.writeReturn(this.return)
    const stmt = `${this.matchs.join(' ')} ${this.whereString} ${this.setString} RETURN ${this.distinct} ${this.returnString}`
    const session = database.session()
    console.log(stmt)
    const result = await session.run(stmt)
    session.close()
    this.clean()
    return result.records
  }
}

export { Cypher }
