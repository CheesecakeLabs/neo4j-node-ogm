import { expect } from 'chai'
import { Text } from './models'

describe('Use Cases - 03', () => {
  describe('::deleting collection', () => {
    it('deleting', done => {
      Text.findAll().then(texts => {
        texts.deleteAll(true).then(() => done(), done)
      })
    })

    it('checking', done => {
      Text.findAll().then(texts => {
        expect(texts).to.have.lengthOf(0)
      }).then(() => done(), done)
    })
  })
})
