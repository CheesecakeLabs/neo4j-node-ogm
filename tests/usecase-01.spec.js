import { expect } from 'chai'
import { User, Role, Text, Company, Build } from './models'
import { getConnection, getInstance } from '../src/driver'

describe('Use Cases - 01', () => {
  let user1
  let company1
  let build1
  let build2
  describe('::clean database', () => {
    it('should clean the information on database', done => {
      // CLEAN DATABASE
      const database = getConnection()
      const session = database.session({ defaultAccessMode: getInstance().session.WRITE })
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
          user1 = user
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
      user.save().catch(() => {
        expect(user.errors.email).to.be.equal('Field is required')
        done()
      })
    })

    it('isValid function', done => {
      const user = new User({
        language: 'dsadasdasdas',
      })
      user.isValid()
      expect(user.isValid()).to.be.equal(false)
      done()
    })

    it('throw valid field', done => {
      const user = new User({
        name: 'User without valid language',
        email: 'email@test.com',
        language: 'pt_PT',
      })
      user.save().catch(() => {
        expect(user.errors.language).to.be.equal("Field is not a valid option ['pt_BR','en_US']")
        done()
      })
    })

    it('throw max_length field', done => {
      const user = new User({
        name: 'User max_length',
        email:
          'max_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_lengthmax_length@domain.com',
      })
      user.save().catch(() => {
        expect(user.errors.email).to.be.equal('Field has more than 255 characters')
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

    it('create a simple company', done => {
      const company = new Company({
        name: 'company 1',
      })

      company
        .save()
        .then(() => {
          company1 = company
          expect(company.name).to.be.equal('company 1')
        })
        .then(() => done(), done)
    })

    it('create a simple build 1', done => {
      const build = new Build({
        name: 'build 1',
      })

      build
        .save()
        .then(() => {
          build1 = build
          expect(build.name).to.be.equal('build 1')
        })
        .then(() => done(), done)
    })

    it('create a simple build 2', done => {
      const build = new Build({
        name: 'build 2',
      })

      build
        .save()
        .then(() => {
          build2 = build
          expect(build.name).to.be.equal('build 2')
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

    it('relating 2 levels', done => {
      user1.createRelationship('companies', company1).then(() => {
        company1.createRelationship('builds', build1, { purchased_in: 'april/2020' }).then(() => {
          company1
            .createRelationship('builds', build2, { purchased_in: 'may/2020' })
            .then(() => {
              expect(true).to.be.true
            })
            .then(() => done(), done)
        })
      })
    })
  })
})
