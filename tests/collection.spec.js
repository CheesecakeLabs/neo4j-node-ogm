import { assert, expect } from 'chai'
// INSTANCES
import { Collection } from '../build'

describe('Collection', () => {
  const values = [1, 2, 3, 4]
  const collection = new Collection()

  describe('::constructor', () => {
    it('should construct', () => {
      expect(collection).to.be.an.instanceOf(Collection)
    })

    it('should have an empty array', () => {
      expect(collection).to.deep.equal([])
    })

    it('should have values inside', () => {
      collection.pushAll(values)
      expect(collection).to.deep.equal(values)
    })
  })
})
