"use strict"

// npm
const { AbstractLevelDOWN, AbstractIterator } = require("abstract-leveldown")
const LevelUp = require("levelup")
const leveldown = require("leveldown")
const levelErrors = require("level-errors")
const encode = require("encoding-down")
const IteratorStream = require("level-iterator-stream")

const itKeys = ["gt", "gte", "lt", "lte", "start", "end"]

class MyIterator extends AbstractIterator {
  constructor(db, options) {
    // istanbul ignore next
    if (!db || !db instanceof Table)
      throw new Error("db must be of type Table.")

    // istanbul ignore next
    if (options && typeof options !== "object")
      throw new Error("options must be an object.")

    super(new AbstractLevelDOWN())
    // istanbul ignore next
    if (!options) options = {}
    itKeys.forEach((k) => {
      if (options[k]) options[k] = db.prefixed(options[k])
    })
    // istanbul ignore next
    if (!options.gte) options.gte = db.prefixed()
    // istanbul ignore next
    if (!options.lte) options.lte = db.prefixed("\ufff0")

    this.it = db.container.iterator(options)
    this.table = db
  }

  next() {
    return new Promise((resolve, reject) =>
      this.it.next((err, k, value) =>
        // istanbul ignore next
        err ? reject(err) : resolve({ key: this.table.isOwn(k) || k, value })
      )
    )
  }

  end() {
    return new Promise((resolve, reject) =>
      this.it.end((err) =>
        // istanbul ignore next
        err ? reject(err) : resolve()
      )
    )
  }
}

class Table extends LevelUp {
  constructor(container, prefix, schema) {
    // istanbul ignore next
    if (!prefix || typeof prefix !== "string" || prefix.indexOf(":") !== -1)
      throw new Error("Malformed prefix.")
    // istanbul ignore next
    if (!container instanceof LevelUp)
      throw new Error("Container must be an instance of LevelUp.")
    // istanbul ignore next
    if (schema && typeof schema !== "object")
      throw new Error("Schema must be an object.")

    super(new AbstractLevelDOWN())
    this.container = container
    this.prefix = prefix
    this.schema = schema
    this.container.on("put", (k, v) => {
      const key = this.isOwn(k)
      if (key) this.emit("put", key, v)
    })
  }

  iterator(options) {
    console.log("ITERATOR", options)
    return new MyIterator(this, options)
  }

  // iteratorStream
  createReadStream(options) {
    console.log("createReadStream", options)
    return new IteratorStream(this.iterator(options), options)
  }

  /*
  _iterator(options) {
    console.log('_ITERATOR', options)
    return super._iterator(options)
    // return new MyIterator(this, options)
  }
  */

  isOwn(k) {
    if (!k) return false
    const [prefix, key] = k.split(":")
    return prefix === this.prefix && key
  }

  prefixed(key) {
    // istanbul ignore next
    return `${this.prefix}:${key || ""}`
  }

  get(key) {
    return this.container.get(this.prefixed(key))
  }

  put(key, value) {
    return this.container.put(this.prefixed(key), value)
  }
}

class Oy extends LevelUp {
  constructor(location, options) {
    let levelOptions
    let ajvOptions
    // istanbul ignore next
    if (options) {
      const { level, ajv, ...rest } = options
      // istanbul ignore next
      if (!level && !ajv) levelOptions = rest
      // istanbul ignore next
      if (level) levelOptions = level
      // istanbul ignore next
      if (ajv) ajvOptions = ajv
    }

    super(
      encode(leveldown(location), { valueEncoding: "json" }),
      levelOptions,
      (err) => err && this.emit("error", err)
    )
    this.location = location
  }

  /*
  iterator(options) {
    console.log('ITERATOR-OY', options)
    return new MyIterator(this, options)
  }

  _iterator(options) {
    console.log('_ITERATOR-OY', options)
    return super._iterator(options)
    // return new MyIterator(this, options)
  }
  */

  ready() {
    return new Promise((resolve, reject) => {
      this.once("ready", resolve)
      this.once("error", reject)
    })
  }

  destroy() {
    return this.close()
      .then(
        () =>
          new Promise((resolve, reject) =>
            leveldown.destroy(this.location, (err) =>
              // istanbul ignore next
              err ? reject(err) : resolve()
            )
          )
      )
      .catch((err) => {
        // istanbul ignore next
        throw err
      })
  }

  formOk(key) {
    if (
      !key ||
      typeof key !== "string" ||
      key.split(":").filter(Boolean).length < 2
    )
      throw new Error("Malformed key.")
  }

  async get(key) {
    this.formOk(key)
    return super.get(key)
  }

  async put(key, value) {
    this.formOk(key)
    return super.put(key, value)
  }

  // get tableNames() {
  // return Array.from(this.tables.keys())
  // }

  table(prefix) {
    return this.get(`_table:${prefix}`).then(
      (schema) => new Table(this, prefix, schema)
    )
  }

  createTable(prefix, schema) {
    return this.table(prefix)
      .then(() => {
        // istanbul ignore next
        throw new Error("Table already exists.")
      })
      .catch((e) => {
        // istanbul ignore next
        if (e instanceof levelErrors.NotFoundError) {
          return this.put(`_table:${prefix}`, schema || false)
        }
        // istanbul ignore next
        throw e
      })
      .then(() => new Table(this, prefix, schema))
  }
}

module.exports = Oy
