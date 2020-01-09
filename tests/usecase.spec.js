import { expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases from README', () => {
  describe('::create', () => {
    it('create a simple user', done => {
      const user = new User({
        name: 'User UseCase Test'
      })
      user.email = 'email@domain.com'

      user.save().then(() => {
        expect(user.id).to.be.a('number')
        expect(user.name).to.be.equal('User UseCase Test')
        expect(user.email).to.be.equal('email@domain.com')
      }).then(() => done(), done)
    })

    it('create a simple role', done => {
      const role = new Role({
        key: 'admin'
      })

      role.save().then(() => {
        expect(role.key).to.be.equal('key-admin')
      }).then(() => done(), done)
    })

    it('create 2 simple text', done => {
      const text1 = new Text({
        value: 'Administrator'
      })

      const text2 = new Text({
        value: 'Administrador'
      })

      const p1 = text1.save()
      const p2 = text2.save()

      Promise.all([p1, p2]).then(() => {
        expect(text1.value).to.be.equal('Administrator')
        expect(text2.value).to.be.equal('Administrador')
      }).then(() => done(), done)
    })
  })

  describe('::findBy and update', () => {
    it('update user', done => {
      User.findBy([
        { key: 'email', value: 'email@domain.com' }
      ]).then(users => {
        expect(users[0].email).to.be.equal('email@domain.com')
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
