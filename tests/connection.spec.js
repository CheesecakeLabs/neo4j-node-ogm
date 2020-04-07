import { assert, expect } from 'chai'
import { getConnection } from '../build'

describe('Neo4j Driver Connection', () => {
  describe('::constructor', () => {
    it('should connect by env vars', () => {
      const database = getConnection()
      expect(database).to.not.be.null
    })

    it('should create session', () => {
      const database = getConnection()
      const session = database.session()
      expect(session._open).to.be.true
    })

    it('should destroy session', () => {
      const database = getConnection()
      const session = database.session()
      session.close()
      expect(session._open).to.be.false
    })
  })
})
