import { expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases - 03', () => {
  describe('::relationship', () => {
    let role
    let user
    let user2
    it('selecting role and user', done => {
      Role.findBy([
        { key: 'key', value: 'ADMIN' }
      ]).then(roles => {
        role = roles[0]
        User.findAll().then(users => {
          user = users[0]
          user2 = users[1]
        }).then(() => done(), done)
      })
    })

    it('relating', done => {
      user.createRelationship('role', role).then(() => {
        expect(user.role.key).to.be.equal('key-ADMIN')
      }).then(() => done(), done)
    })

    it('relating with attributes', done => {
      user.createRelationship('friends', user2, { intimacy: 'normal' }).then(() => {
        expect(user.friends[0].intimacy).to.be.equal('normal')
      }).then(() => done(), done)
    })

    it('update a relationship', done => {
      user.updateRelationship('friends', user2, { intimacy: 'close' }).then(() => {
        expect(user.friends[0].intimacy).to.be.equal('close')
      }).then(() => done(), done)
    })
  })
})
