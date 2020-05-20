import { expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases - 02', () => {
  describe('::manage user', () => {
    let user
    let user_id
    it('findBy', done => {
      User.findBy([{ key: 'email', value: 'email2@domain.com' }])
        .then(users => {
          user = users.toValues()[0]
          user_id = user.id
          expect(user.email).to.be.equal('email2@domain.com')
        })
        .then(() => done(), done)
    })

    it('update', done => {
      user.email = 'emailupdated@domain.com'
      user
        .save()
        .then(() => {
          expect(user.email).to.be.equal('emailupdated@domain.com')
        })
        .then(() => done(), done)
    })
  })

  describe('::findAll', () => {
    it('get all users', done => {
      User.findAll({
        order_by: [{ key: 'email' }],
      })
        .then(users => {
          expect(users.first().email).to.be.equal('email@domain.com')
        })
        .then(() => done(), done)
    })

    it('get all users inverse orderby', done => {
      User.findAll({
        order_by: [{ key: 'email', direction: 'DESC' }],
      })
        .then(users => {
          expect(users.first().email).to.be.equal('emailupdated@domain.com')
        })
        .then(() => done(), done)
    })

    it('get all roles', done => {
      Role.findAll()
        .then(roles => {
          expect(roles.toJSON()).to.have.lengthOf.at.least(1)
        })
        .then(() => done(), done)
    })

    it('get all texts', done => {
      Text.findAll()
        .then(texts => {
          expect(texts.toJSON()).to.have.lengthOf.at.least(1)
        })
        .then(() => done(), done)
    })
  })
})
