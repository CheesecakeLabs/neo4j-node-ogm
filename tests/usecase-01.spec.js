import { expect } from 'chai'
import { User, Role, Text } from './models'
import { getConnection } from '../src'

describe('Use Cases - 01', () => {
  describe('::clean database', () => {
    it('should clean the information on database', done => {
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
        language: 'pt_BR',
        password: 12345,
        active: true,
      })
      user.email = 'email@domain.com'

      const user2 = new User({
        name: 'User UseCase Test',
        email: 'email2@domain.com',
        language: 'pt_BR',
        password: 12345,
        active: false,
      })

      const p1 = user.save()
      const p2 = user2.save()

      Promise.all([p1, p2])
        .then(() => {
          expect(user.id).to.be.a('number')
          expect(user.name).to.be.equal('User UseCase Test')
          expect(user.email).to.be.equal('email@domain.com')
          expect(user.password.checkHash('12345')).to.be.true
          expect(user.password.checkHash(12345)).to.be.true
          expect(user.active).to.be.true
          expect(user2.active).to.be.false
          expect(user.created_at).to.not.be.null
          expect(user.isValid()).to.be.equal(true)
        })
        .then(() => done(), done)
    })

    it('throw required field', done => {
      const user = new User({
        name: 'User without email',
      })
      user.save().catch(error => {
        expect(error.message).to.be.equal('Field: email is required')
        done()
      })
    })

    it('isValid function', done => {
      const user = new User({
        language: 'dsadasdasdas',
      })
      expect(user.isValid()).to.be.equal(false)
      done()
    })

    it('throw valid field', done => {
      const user = new User({
        name: 'User without valid language',
        email: 'email@test.com',
        language: 'pt_PT',
      })
      user.save().catch(error => {
        expect(error.message).to.be.equal('Field: language is not a valid option ["pt_BR","en_US"]')
        done()
      })
    })

    it('throw max_length field', done => {
      const user = new User({
        name: 'User max_length',
        email:
          'max_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_length@domain.com',
      })
      user.save().catch(error => {
        expect(error.message).to.be.equal('Field: email has more than 255 characters')
        done()
      })
    })

    it('create a simple role', done => {
      const role = new Role({
        key: 'admin',
      })

      role
        .save()
        .then(() => {
          expect(role.key).to.be.equal('key-ADMIN')
        })
        .then(() => done(), done)
    })

    it('create 2 simple text', done => {
      const text1 = new Text({
        value: 'Administrator',
      })

      const text2 = new Text({
        value: 'Administrador',
      })

      const p1 = text1.save()
      const p2 = text2.save()

      Promise.all([p1, p2])
        .then(() => {
          expect(text1.value).to.be.equal('Administrator')
          expect(text2.value).to.be.equal('Administrador')
        })
        .then(() => done(), done)
    })
  })
})
