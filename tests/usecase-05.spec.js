import chai, { expect } from 'chai'
import { User } from './models'
import asserttype from 'chai-asserttype'

chai.use(asserttype)

describe('Use Cases - 05', () => {
  describe('::specials fields', () => {
    it('datetime', done => {
      const user = new User({
        name: 'User for check datetime',
        email: 'datetime@email.com',
        language: 'pt_BR',
        password: 12345
      })

      user.save().then(() => {
        expect(user.created_at).to.be.date()
      }).then(() => done(), done)
    })
  })
})
