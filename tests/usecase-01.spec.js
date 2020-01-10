import { expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases - 01', () => {
  describe('::deleting', () => {
    it('users', done => {
      User.findAll().then(users => {
        users.deleteAll(true).then(() => done(), done)
      })
    })
    it('roles', done => {
      Role.findAll().then(roles => {
        roles.deleteAll(true).then(() => done(), done)
      })
    })
    it('texts', done => {
      Text.findAll().then(texts => {
        texts.deleteAll(true).then(() => done(), done)
      })
    })
  })
  describe('::create', () => {
    it('create a simple user', done => {
      const user = new User({
        name: 'User UseCase Test'
      })
      user.email = 'email@domain.com'

      const user2 = new User({
        name: 'User UseCase Test',
        email: 'email2@domain.com'
      })
      const p1 = user.save()
      const p2 = user2.save()

      Promise.all([p1, p2]).then(() => {
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
})
