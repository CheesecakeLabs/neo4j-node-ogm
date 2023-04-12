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
    this.parameters = []
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
            .map(([key, value]) => `${key}:${this.addParameter(value)}`)
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
    switch(true){
      case value instanceof Date:
        this.sets.push(`${attr} = ${this.addParameter(value.toISOString())}`)
        break
      case typeof value === "undefined":
        //IGNORE
        break
      default:
        this.sets.push(`${attr} = ${this.addParameter(value)}`)
    }
  }

  writeSets(CONCAT = ' AND ') {
    if (this.sets.length > 0) {
      this.setString = `SET ${this.sets.join(CONCAT)}`
    }
  }

  parseWhereToString({ attr, operator, value, not = false, $and = [], $or = [] }) {
    if ($and.length) return `(${$and.map(filter => this.parseWhereToString(filter)).join(' AND ')})`
    if ($or.length) return `(${$or.map(filter => this.parseWhereToString(filter)).join(' OR ')})`
    if (!OPERATORS.includes(operator)) operator = '='
    if (value === undefined) return 'true'
    if (operator === 'IN' && !Array.isArray(value)) {
      throw new Error('on IN operator, value must be an Array')
    }
    return `${not ? 'NOT' : ''} ${attr} ${operator} ${this.addParameter(value)}`
  }

  addParameter(value) {
    const parameterName = `$param${this.parameters.length + 1}`
    this.parameters.push(value)
    return parameterName
  }

  addWhere({ attr, operator, value, $and, $or, not = false }) {
    this.wheres.push(this.parseWhereToString({ attr, operator, value, $and, $or, not }))
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
    let returnString = model.collectFirst ? `collect(${alias} {` : `${alias} {`
    const attrs = []

    attrs.push(`id:id(${alias})`)
    // LOOP ON MODEL ATTRIBUTES
    for (const [attr, field] of Object.entries(model._attributes)) {
      if (!field.isModel) {
        attrs.push(`.${attr}`)
      }
    }
    returnString += attrs.join(', ')
    returnString += model.collectFirst ? ` })[0] as ${alias}` : ` }`

    this.returnStrings.push(returnString)
  }

  create(nodeAlias) {
    this.writeSets(' , ')
    const stmt = `CREATE (${nodeAlias}) ${this.setString} RETURN ${this.returnStrings.join(' , ')}`
    return new SessionPromise(stmt, (acc) =>
      this.session(stmt, 'write').then(records => acc(records[0]))
    )
  }

  update() {
    this.writeWhere()
    this.writeSets(' , ')
    const stmt = `
    ${this.matchs.join(' ')}
    ${this.setString}
    RETURN ${this.returnStrings.join(' , ')}`
    return this.session(stmt, 'write')
  }

  delete(alias, detach = false) {
    const stmt = `${this.matchs.join(' ')} ${detach ? 'DETACH' : ''} DELETE ${alias}`
    return new SessionPromise(stmt, (acc) =>
      this.session(stmt, 'write').then(() => acc(true))
    )
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

  find() {
    const stmt = `${this.matchs.join(' ')} ${this.setString}
                  RETURN ${this.count ? `COUNT(${this.count})` : `${this.distinct} ${this.returnStrings.join(' , ')}
                  ${this.writeOrderBy()} ${this.skip ? `SKIP ${this.skip}` : ''} ${
      this.limit ? `LIMIT ${this.limit}` : ''}`
    }`

    return this.session(stmt)
  }

  session(stmt, mode = 'read') {
    return new SessionPromise(stmt, (resolve, reject) => {
      const session = database.session({
        defaultAccessMode: mode === 'read' ? getInstance().session.READ : getInstance().session.WRITE,
      })
      const params = this.parameters.reduce((acc, value, index) => ({
        ...acc,
        [`param${index+1}`]: value,
      }), {})
      session
        .run(stmt, params)
        .then((result) => resolve(result.records))
        .catch((e) => reject(`Cypher ERROR: ${e.message}`))
        .then(() => {
          this.clean()
          session.close()
        })
    })
  }
}

class SessionPromise {
  constructor(stmt, executor) {
    this.executor = executor
    this.stmt = stmt
  }

  toString() {
    return this.stmt
  }

  then(...args) {
    return new Promise(this.executor).then(...args)
  }

  catch(...args) {
    return new Promise(this.executor).catch(...args)
  }
}

export { Cypher }
