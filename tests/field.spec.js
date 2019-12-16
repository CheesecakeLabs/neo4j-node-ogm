import { assert, expect } from 'chai'
// INSTANCES
import { Field } from '../src'


describe('Field', () => {
  let fieldString
  let fieldInteger
  let fieldFloat
  let fieldHash
  let fieldJSON
  let fieldBoolean
  let fieldDateTime
  let fieldDate
  let fieldTime
  let fieldRelationship
  let fieldRelationships

  before(() => {
    fieldString = Field.String()
    fieldInteger = Field.Integer()
    fieldFloat = Field.Float()
    fieldHash = Field.Hash()
    fieldJSON = Field.JSON()
    fieldBoolean = Field.Boolean()
    fieldDateTime = Field.DateTime()
    fieldDate = Field.Date()
    fieldTime = Field.Time()
    fieldRelationship = Field.Relationship()
    fieldRelationships = Field.Relationships()
  })

  it('should instantiate all types of fields', () => {
    expect(fieldString).to.be.an.instanceOf(Field)
    expect(fieldInteger).to.be.an.instanceOf(Field)
    expect(fieldFloat).to.be.an.instanceOf(Field)
    expect(fieldHash).to.be.an.instanceOf(Field)
    expect(fieldJSON).to.be.an.instanceOf(Field)
    expect(fieldBoolean).to.be.an.instanceOf(Field)
    expect(fieldDateTime).to.be.an.instanceOf(Field)
    expect(fieldDate).to.be.an.instanceOf(Field)
    expect(fieldTime).to.be.an.instanceOf(Field)
    expect(fieldRelationship).to.be.an.instanceOf(Field)
    expect(fieldRelationships).to.be.an.instanceOf(Field)
  })
})
