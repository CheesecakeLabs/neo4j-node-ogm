import { expect } from 'chai'
import { User, Role, Company } from './models'

describe('Use Cases - 03', () => {
  describe('::skip and limit', () => {
    it('should select the first one', done => {
      User.findAll({ skip: 0, limit: 1, order_by: [{ key: 'toUpper(user.email)' }] })
        .then(users => {
          expect(users.toValues()[0].email).to.be.equal('email@domain.com')
          expect(users.toValues()).to.have.lengthOf(1)
        })
        .then(() => done(), done)
    })

    it('should select the second one', done => {
      User.findAll({ skip: 1, limit: 1, order_by: [{ key: 'email' }] })
        .then(users => {
          expect(users.first().email).to.be.equal('emailupdated@domain.com')
          expect(users.toValues()).to.have.lengthOf(1)
        })
        .then(() => done(), done)
    })
  })
  describe('::count', () => {
    it('should count', async () => {
        const expected = (await User.findAll()).length()
        const response = (await User.count())
        expect(response).to.be.eql(expected)
    })
  })
  describe('::relationship', () => {
    let role
    let user
    let user2

    it('selecting role and user', done => {
      Role.findAll().then(roles => {
        role = roles[0]
        User.findAll()
          .then(users => {
            user = users.toValues()[0]
            user2 = users.toValues()[1]
          })
          .then(() => done(), done)
      })
    })

    it('relating 1', done => {
      user
        .createRelationship('role', role)
        .then(() => {
          expect(user.role.key).to.be.equal('key-ADMIN')
        })
        .then(() => done(), done)
    })


    it('get filtering with nested filters relations', async () => {
      const query =  User.findAll({
        with_related: ['!role'],
        filter_attributes: [
          {
          $and: [
            { $and: [
              { key: 'active', value: true},
              { key: 'role.key', value: 'ADMIN' },
            ]},
            { key: 'id(user)', value: user.id},
          ]}
        ]
      })
      const users = await query
      expect(query.toString()).to.be.equal(`MATCH (user:User)   MATCH (user)-[user_role:HAS_ROLE ]-(role:Role)  WHERE (( user.active = $param1 AND  role.key = $param2) AND  id(user) = $param3) 
                  RETURN  user {id:id(user), .name, .language, .email, .active, .password, .created_at } , user_role { } , collect(role {id:id(role), .key, .active })[0] as role
                    `)
      expect(users.first().email).to.be.equal(user.email)
    })

    it('get filtering with nested filters relations - equal field names', async () => {
      const query =  User.findAll({
        with_related: ['!role'],
        filter_attributes: [
          {
          $and: [
            { $and: [
              { key: 'active', value: true},
              { key: 'role.active', value: true },
            ]},
            { key: 'id(user)', value: user.id},
          ]}
        ]
      })
      const users = await query
      expect(query.toString()).to.be.equal(`MATCH (user:User)   MATCH (user)-[user_role:HAS_ROLE ]-(role:Role)  WHERE (( user.active = $param1 AND  role.active = $param2) AND  id(user) = $param3) 
                  RETURN  user {id:id(user), .name, .language, .email, .active, .password, .created_at } , user_role { } , collect(role {id:id(role), .key, .active })[0] as role
                    `)
      expect(users.first().email).to.be.equal(user.email)
    })

    it('relating with attributes', done => {
      user
        .createRelationship('friends', user2, { intimacy: 'normal' })
        .then(() => {
          expect(user.toJSON().friends[0].intimacy).to.be.equal('normal')
        })
        .then(() => done(), done)
    })

    it('get filtering with nested filters relations - same model', async () => {
      const query = User.findAll({
        with_related: ['!friends'],
        filter_attributes: [{
          $and: [
            { $and: [
              { key: 'active', value: true},
              { key: 'friends.name', value: user2.name },
              
            ]},
            { key: 'id(user)', value: user.id},
          ]}
        ]
      })
      const users = await query
      expect(query.toString()).to.be.equal(`MATCH (user:User)   MATCH (user)-[user_friends:FRIENDSHIP ]-(friends:User)  WHERE (( user.active = $param1 AND  friends.name = $param2) AND  id(user) = $param3) 
                  RETURN  user {id:id(user), .name, .language, .email, .active, .password, .created_at } , user_friends {.intimacy } , friends {id:id(friends), .name, .language, .email, .active, .password, .created_at }
                    `)
      expect(users.length()).to.be.equal(1)
    })

    it('update a relationship', done => {
      user
        .updateRelationship('friends', user2, { intimacy: 'close' })
        .then(() => {
          expect(user.toJSON().friends[0].intimacy).to.be.equal('close')
        })
        .then(() => done(), done)
    })

    it('fetching a relationship', done => {
      user
        .fetch(['friends', 'role'])
        .then(() => {
          expect(user.role.key).to.be.equal('key-ADMIN')
        })
        .then(() => done(), done)
    })

    it('get all builds from company with_related 1 level', done => {
      Company.findAll({
        with_related: ['builds'],
      })
        .then(companies => {
          expect(companies[0].builds.length()).to.be.equal(2)
          expect(companies[0].builds[0].purchased_in).to.be.equal('may/2020')
          expect(companies[0].builds[1].purchased_in).to.be.equal('april/2020')
        })
        .then(() => done(), done)
    })

    it('get all users with_related 2 levels', done => {
      User.findAll({
        with_related: ['role__name', '!companies__builds'],
      })
        .then(users => {
          expect(users[0].companies[0].builds.length()).to.be.equal(2)
          expect(users[0].companies[0].builds[0].purchased_in).to.be.equal('may/2020')
          expect(users[0].companies[0].builds[1].purchased_in).to.be.equal('april/2020')
        })
        .then(() => done(), done)
    })
  })
})
