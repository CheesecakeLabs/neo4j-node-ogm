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
    it('update toString', () => {
      user.email = 'emailupdated@domain.com'
      expect(user.save().toString()).to.contain(`MATCH (user:User)  WHERE  id(user) = ${user.id}`)
      expect(user.save().toString()).to.contain(`SET user.name = \'User UseCase Test\' , user.language = \'pt_BR\' , user.email = \'emailupdated@domain.com\' , user.active = \'false\' , `)
      expect(user.save().toString()).to.contain(`RETURN user {id:id(user), .name, .language, .email, .active, .password, .created_at }`)
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

    it('get all users toString', () => {
      expect(User.findAll().toString()).to.be.eql(`MATCH (user:User)  \n                  RETURN  user {id:id(user), .name, .language, .email, .active, .password, .created_at }\n                    `)
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

    it('get all users with roles, state example', done => {
      User.findAll({ with_related: ['role__name'], state: { language: 'pt-BR' } })
        .then(users => {
          expect(users.toJSON()).to.have.lengthOf.at.least(1)
        })
        .then(() => done(), done)
    })
  })

  describe('::findById', () => {
    it('get user by id to string', () => {
      expect(User.findByID(-1).toString()).to.be.eql('MATCH (user:User)  WHERE  id(user) = -1 \n                  RETURN  user {id:id(user), .name, .language, .email, .active, .password, .created_at }\n                    ')
    })
  })
})
