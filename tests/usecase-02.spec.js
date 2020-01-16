import { expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases - 02', () => {
  describe('::manage user', () => {
    let user
    let user_id
    it('findBy', done => {
      User.findBy([
        { key: 'email', value: 'email2@domain.com' }
      ]).then(users => {
        user = users[0]
        user_id = user.id
        expect(user.email).to.be.equal('email2@domain.com')
      }).then(() => done(), done)
    })

    it('update', done => {
      user.email = 'emailupdated@domain.com'
      user.save().then(() => done(), done)
    })

    it('findByID to get updated user', done => {
      User.findByID(user_id).then(updatedUser => {
        expect(updatedUser.email).to.be.equal('emailupdated@domain.com')
      }).then(() => done(), done)
    })
  })

  describe('::findAll', () => {
    it('get all users', done => {
      User.findAll().then(users => {
        expect(users).to.have.lengthOf.at.least(1)
      }).then(() => done(), done)
    })

    it('get all roles', done => {
      Role.findAll().then(roles => {
        expect(roles).to.have.lengthOf.at.least(1)
      }).then(() => done(), done)
    })

    it('get all texts', done => {
      Text.findAll().then(texts => {
        expect(texts).to.have.lengthOf.at.least(1)
      }).then(() => done(), done)
    })

    it('get all users with_related', done => {
      User.findAll({
        with_related: ['role__name', 'friends']
      }).then(users => {
        expect(users).to.have.lengthOf.at.least(1)
      }).then(() => done(), done)
    })
  })
})
