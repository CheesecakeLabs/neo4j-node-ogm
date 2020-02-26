class Collection extends Array {
  getJSON () {
    return this.map(item => item.toJSON())
  }

  async deleteAll (detach = false) {
    return Promise.all(this.map(item => item.delete(detach)))
  }

  async asyncForEach (callback) {
    for (let index = 0; index < this.length; index++) {
      await callback(this[index], index)
    }
  }

  async relate (attr, node, attributes) {
    this.forEach(item => {
      item.relate(attr, node, attributes)
    })
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
