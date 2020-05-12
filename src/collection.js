class Collection extends Object {
  toJSON() {
    return Object.values(this).map(item => item.toJSON())
  }

  toValues() {
    return Object.values(this)
  }

  first() {
    if (Object.keys(this).length === 0) return undefined
    return this[0]
  }

  length() {
    return Object.keys(this).length
  }

  map(fc) {
    return Object.values(this).map(fc)
  }

  some(fc) {
    return Object.values(this).some(fc)
  }

  async deleteAll(detach = false) {
    return Promise.all(Object.values(this).map(item => item.delete(detach)))
  }

  // TODO: bulk relate
  // async relate(attr, node, attributes) {
  //   this.forEach(item => {
  //     item.relate(attr, node, attributes)
  //   })
  // }
}

export { Collection }
