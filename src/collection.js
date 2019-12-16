class Collection extends Array {
  toJSON () {
    const data = []
    this.forEach(item => {
      data.push(item.toJSON())
    })
    return data
  }

  async deleteAll () {
    return Promise.all(this.map(item => item.delete()))
  }

  pushAll (values) {
    values.forEach(item => {
      this.push(item)
    })
  }
}

export {
  Collection
}
