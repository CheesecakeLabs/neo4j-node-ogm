import { expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases - 04', () => {
  describe('::relationship', () => {
    let role
    let user
    it('selecting role and user', done => {
      Role.findBy([
        { key: 'key', value: 'admin' }
      ]).then(roles => {
        role = roles[0]
        User.findBy([
          { key: 'email', value: 'email@domain.com' }
        ]).then(users => {
          user = users[0]
        }).then(() => done(), done)
      })
    })

    it('relating', done => {
      user.relate('role', role).then(() => {
        expect(user.role.key).to.be.equal('key-admin')
      }).then(() => done(), done)
    })
  })
})
