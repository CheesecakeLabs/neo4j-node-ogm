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

  async asyncForEach (callback) {
    for (let index = 0; index < this.length; index++) {
      await callback(this[index], index)
    }
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
