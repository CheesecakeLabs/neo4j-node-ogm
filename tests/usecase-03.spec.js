import { expect } from 'chai'
import { User, Role } from './models'

describe('Use Cases - 03', () => {
  describe('::skip and limit', () => {
    it('should select the first one', done => {
      User.findAll({ skip: 0, limit: 1, order_by: [{ key: 'email' }] })
        .then(users => {
          expect(users.toValues()[0].email).to.be.equal('email@domain.com')
          expect(users.toValues()).to.have.lengthOf(1)
        })
        .then(() => done(), done)
    })

    it('should select the second one', done => {
      User.findAll({ skip: 1, limit: 1, order_by: [{ key: 'email' }] })
        .then(users => {
          expect(users.first().email).to.be.equal('emailupdated@domain.com')
          expect(users.toValues()).to.have.lengthOf(1)
        })
        .then(() => done(), done)
    })
  })
  describe('::relationship', () => {
    let role
    let user
    let user2
    it('selecting role and user', done => {
      Role.findBy([{ key: 'key', value: 'ADMIN' }]).then(roles => {
        role = roles[0]
        User.findAll()
          .then(users => {
            user = users.toValues()[0]
            user2 = users.toValues()[1]
          })
          .then(() => done(), done)
      })
    })

    it('relating', done => {
      user
        .createRelationship('role', role)
        .then(() => {
          expect(user.role.key).to.be.equal('key-ADMIN')
        })
        .then(() => done(), done)
    })

    it('relating with attributes', done => {
      user
        .createRelationship('friends', user2, { intimacy: 'normal' })
        .then(() => {
          expect(user.toJSON().friends[0].intimacy).to.be.equal('normal')
        })
        .then(() => done(), done)
    })

    it('update a relationship', done => {
      user
        .updateRelationship('friends', user2, { intimacy: 'close' })
        .then(() => {
          expect(user.toJSON().friends[0].intimacy).to.be.equal('close')
        })
        .then(() => done(), done)
    })

    it('fetching a relationship', done => {
      user
        .fetch(['role'])
        .then(() => {
          expect(user.role.key).to.be.equal('key-ADMIN')
        })
        .then(() => done(), done)
    })
  })
})
