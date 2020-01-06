import { assert, expect } from 'chai'
import { User, Role, Text } from './models'

describe('Use Cases from README', () => {
  // let user
  // let text
  // let role
  // before(() => {
  //   user = new User()
  //   text = new Text()
  //   role = new Role()
  // })

  describe('::findAll', () => {
    it('get all users with_related', done => {
      User.findAll({
        with_related: ['role__name', 'friends']
      }).then(users => {
        done()
      })
    })

    it('get all users', done => {
      User.findAll().then(users => {
        done()
      })
    })
  })
})
