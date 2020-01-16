import { expect } from 'chai'
import md5 from 'crypto-js/md5'
import { User, Role, Text } from './models'
import { getConnection } from '../build'

describe('Use Cases - 01', () => {
  describe('::clean database', () => {
    it('users', done => {
      // CLEAN DATABASE
      const database = getConnection()
      const session = database.session()
      session.run('MATCH (all) DETACH DELETE all').then(() => {
        session.close()
        done()
      })
    })
  })
  describe('::create', () => {
    it('create a simple user', done => {
      const user = new User({
        name: 'User UseCase Test',
        password: 12345
      })
      user.email = 'email@domain.com'

      const user2 = new User({
        name: 'User UseCase Test',
        email: 'email2@domain.com',
        password: 12345
      })
      const p1 = user.save()
      const p2 = user2.save()

      Promise.all([p1, p2]).then(() => {
        expect(user.id).to.be.a('number')
        expect(user.name).to.be.equal('User UseCase Test')
        expect(user.email).to.be.equal('email@domain.com')
        expect(user.password).to.be.equal(md5('12345').toString())
      }).then(() => done(), done)
    })

    it('create a simple role', done => {
      const role = new Role({
        key: 'admin'
      })

      role.save().then(() => {
        expect(role.key).to.be.equal('key-ADMIN')
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
