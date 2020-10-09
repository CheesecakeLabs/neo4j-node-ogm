import chai, { expect } from 'chai'
import { User, Role } from './models'
import asserttype from 'chai-asserttype'

chai.use(asserttype)

describe('Use Cases - 06', () => {
  before(async () => {
    const user = new User({
      name: 'User for check relationship',
      email: 'email321321@email.com',
      language: 'pt_BR',
      password: 12345,
    })
    await user.save()

    const role1 = new Role({ key: 'key1' })
    await role1.save()
    await user.createRelationship('role', role1)
    const role2 = new Role({ key: 'key2' })
    await role2.save()
    await user.createRelationship('role', role2)
  })

  describe('::ordering a 1-n case', () => {
    it('should have 1 role with the right value', async () => {
      const user = (
        await User.findBy(
          [
            {
              key: 'email',
              value: 'email321321@email.com',
            },
          ],
          {
            order_by: [{ key: 'role.key', direction: 'DESC' }],
            with_related: ['role'],
          }
        )
      )[0]
      expect(user.role.key).to.be.equal('key-KEY2')
    })
  })
})
