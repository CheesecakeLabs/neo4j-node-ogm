import { expect } from 'chai'
import { Text, User } from './models'

describe('Use Cases - 04', () => {
  let user
  let user_id
  describe('::deleting node', () => {
    it('get a user', done => {
      User.findBy([
        { key: 'email', value: 'email@domain.com' }
      ]).then(u => {
        user = u[0]
        user_id = user.id
        expect(user.id).to.be.a('number')
      }).then(() => done(), done)
    })
    it('delete the user', done => {
      user.delete(true).then(deletedUser => {
        expect(deletedUser).to.be.equal(true)
      }).then(() => done(), done)
    })
  })
  describe('::checking deleted node', () => {
    it('findByID to not return deleted user', done => {
      User.findByID(user_id).then(deletedUser => {
        expect(deletedUser).to.be.equal(undefined)
      }).then(() => done(), done)
    })
  })
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
