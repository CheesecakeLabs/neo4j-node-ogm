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
    // this.forEach(item => {
    //   item.delete()
    // })
  }
}

export {
  Collection
}
