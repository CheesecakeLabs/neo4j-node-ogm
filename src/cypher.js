import { getConnection, getInstance } from './driver'

const database = getConnection()
const OPERATORS = [
  '=',
  '=~',
  '<>',
  '<',
  '>',
  '<=',
  '>=',
  'IS NULL',
  'IS NOT NULL',
  'STARTS WITH',
  'ENDS WITH',
  'CONTAINS',
  'EXISTS',
  'IN',
]

class Cypher {
  constructor(stmt = '') {
    this.clean(stmt)
  }

  clean(stmt = '') {
    this.nodes = []
    this.matchs = []
    this.wheres = []
    this.sets = []
    this.setString = ''
    this.orders = []
    this.return = {}
    this.returnStrings = []
    this.distinct = ''
    this.skip = ''
    this.limit = ''
    this.stmt = stmt
  }

  addReturn(key, value) {
    this.return[key] = value
  }

  match(node, previousAlias = false, relationship = false, targetModel = false, dontPutOnReturn = false) {
    if (targetModel) {
      const relationName = `${node.getAliasName()}_${previousAlias}${relationship}`

      let filterRelationship = ''
      if (targetModel.filter_relationship) {
        filterRelationship =
          '{' +
          Object.entries(targetModel.filter_relationship)
            .map(([key, value]) => `${key}:'${value}'`)
            .join(', ') +
          '}'
      }

      this.matchs.push(
        `${
          targetModel.isOptional ? 'OPTIONAL' : ''
        } MATCH (${node.getAliasName()})-[${relationName} ${filterRelationship}]-(${targetModel.getCypherName(
          previousAlias
        )})`
      )
    } else {
      if (!dontPutOnReturn) {
        this.matchs.push(`MATCH (${node.getCypherName()})`)
      } else {
        this.matchs.push(`MATCH (${dontPutOnReturn}:${node.getNodeName()})`)
      }
    }
  }

  addSet(attr, value) {
    if (value !== undefined) {
      this.sets.push(`${attr} = '${value}'`)
    }
  }

  writeSets(CONCAT = ' AND ') {
    if (this.sets.length > 0) {
      this.setString = `SET ${this.sets.join(CONCAT)}`
    }
  }

  addWhere({ attr, operator, value }) {
    let whereString
    if (!OPERATORS.includes(operator)) operator = '='

    switch (operator) {
      case 'IN':
        if (!Array.isArray(value)) throw new Error('on IN operator, value must be an Array')
        value = value.map((v) => (Number.isInteger(v) ? v : `'${v}'`))
        whereString = `${attr} ${operator} [${value.join(',')}]`
        break
      default:
        whereString = `${attr} ${operator} ${Number.isInteger(value) ? value : `'${value}'`}`
    }

    this.wheres.push(whereString)
  }

  writeWhere() {
    if (this.wheres.length > 0) {
      const whereString = ` WHERE ${this.wheres.join(' AND ')}`
      this.wheres = []
      return whereString
    }

    return ''
  }

  addOrderBy(attr, direction = 'ASC') {
    this.orders.push(`${attr} ${direction}`)
  }

  writeOrderBy(CONCAT = ' , ') {
    if (this.orders.length > 0) {
      const orderString = ` ORDER BY ${this.orders.join(CONCAT)}`
      this.orders = []
      return orderString
    }

    return ''
  }

  isDistinct(bool = true) {
    this.distinct = bool ? 'DISTINCT' : ''
  }

  modelReturnRelation(alias, field) {
    let relationString = `${alias} {`
    const relAttrs = []
    for (const [relAttr] of Object.entries(field.attributes)) {
      relAttrs.push(`.${relAttr}`)
    }

    relationString += `${relAttrs.join(', ')} }`
    this.returnStrings.push(relationString)
  }

  modelReturn(alias, model) {
    let returnString = `${alias} {`
    const attrs = []

    attrs.push(`id:id(${alias})`)
    // LOOP ON MODEL ATTRIBUTES
    for (const [attr, field] of Object.entries(model._attributes)) {
      if (!field.isModel) {
        attrs.push(`.${attr}`)
      }
    }

    returnString += `${attrs.join(', ')} }`

    this.returnStrings.push(returnString)
  }

  async create(nodeAlias) {
    this.writeSets(' , ')
    const stmt = `CREATE (${nodeAlias}) ${this.setString} RETURN ${this.returnStrings.join(' , ')}`
    // console.log(stmt)
    const records = await this.session(stmt, 'write')
    return records[0]
  }

  async update() {
    this.writeWhere()
    this.writeSets(' , ')
    const stmt = `
    ${this.matchs.join(' ')}
    ${this.setString}
    RETURN ${this.returnStrings.join(' , ')}`
    // console.log(stmt)
    return this.session(stmt, 'write')
  }

  async delete(alias, detach = false) {
    const stmt = `${this.matchs.join(' ')} ${detach ? 'DETACH' : ''} DELETE ${alias}`
    // console.log(stmt)
    await this.session(stmt, 'write')
    return true
  }

  async relate(node1, relation, node2, create = true) {
    this.writeWhere()
    this.writeSets(' , ')
    const stmt = `${this.matchs.join(' ')}
                  ${create ? 'CREATE' : 'MATCH'}
                  (${node1.getAliasName()})-[${node1.getAliasName()}_${relation.attr}:${relation.getLabelName()}]
                  ${create ? '->' : '-'}(${relation.attr})
                  ${this.setString} RETURN ${this.returnStrings.join(' , ')}`

    return this.session(stmt, 'write')
  }

  async find() {
    const stmt = `${this.matchs.join(' ')} ${this.setString}
                  RETURN ${this.distinct} ${this.returnStrings.join(' , ')}
                  ${this.writeOrderBy()} ${this.skip ? `SKIP ${this.skip}` : ''} ${
      this.limit ? `LIMIT ${this.limit}` : ''
    }`

    return this.session(stmt)
  }

  session(stmt, mode = 'read') {
    return new Promise((resolve, reject) => {
      const session = database.session({
        defaultAccessMode: mode === 'read' ? getInstance().session.READ : getInstance().session.WRITE,
      })

      session
        .run(stmt)
        .then((result) => resolve(result.records))
        .catch((e) => reject(`Cypher ERROR: ${e.message}`))
        .then(() => {
          this.clean()
          session.close()
        })
    })
  }
}

export { Cypher }
