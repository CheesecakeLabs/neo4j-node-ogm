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
      expect(user.save().toString()).to.contain(`\n    MATCH (user:User)  WHERE  id(user) = $param1\n    SET user.name = $param2 , user.language = $param3 , user.email = $param4 , user.active = $param5 , user.password = $param6 , user.created_at = $param7\n    RETURN user {id:id(user), .name, .language, .email, .active, .password, .created_at }`)
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
    
    it('get filtering with nested filters', done => {
      User.findAll({
        filter_attributes: [{
          $or: [
            { $and: [
              { key: 'active', value: true},
              { key: 'email', value: 'email@domain.com'},
            ]},
            { key: 'id', value: -1},
          ]}
        ]
      })
        .then(users => {
          expect(users.first().email).to.be.equal('email@domain.com')
          done()
        })
      })

    it('get all users filter with special char', done => {
      User.findAll({
        filter_attributes: [
          { key: 'name', value: "'User special char test"}
        ]
      })
        .then(users => {
          expect(users.length()).to.equal(1)
          expect(users.first().email).to.be.equal('emailupdated@domain.com')
        })
        .then(() => done(), done)
    })

    it('get all users filter using IN operator', done => {
      User.findAll({
        filter_attributes: [
          { key: 'email', operator: 'IN', value: ['emailupdated@domain.com'] }
        ]
      })
        .then(users => {
          expect(users.length()).to.equal(1)
          expect(users.first().email).to.be.equal('emailupdated@domain.com')
        })
        .then(() => done(), done)
    })

    it('get all users filter using boolean = false', done => {
      User.findAll({
        filter_attributes: [
          { key: 'active', value: false }
        ]
      })
        .then(users => {
          expect(users.length()).to.equal(1)
          expect(users.first().email).to.be.equal('emailupdated@domain.com')
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
      expect(User.findByID(-1).toString()).to.be.eql('MATCH (user:User)  WHERE  id(user) = $param1 \n                  RETURN  user {id:id(user), .name, .language, .email, .active, .password, .created_at }\n                    ')
    })
  })
})
