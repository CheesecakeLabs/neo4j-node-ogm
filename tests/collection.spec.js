import { expect } from 'chai'
// INSTANCES
import { Collection } from '../build'

describe('Collection', () => {
  const collection = new Collection()

  describe('::constructor', () => {
    it('should construct', () => {
      expect(collection).to.be.an.instanceOf(Collection)
    })

    it('should have an empty array', () => {
      expect(collection.toJSON()).to.deep.equal([])
    })
  })
})
