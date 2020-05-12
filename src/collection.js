class Collection extends Object {
  toJSON() {
    return Object.values(this).map(item => item.toJSON())
  }

  toValues() {
    return Object.values(this)
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
