"use strict"

// npm
const { AbstractLevelDOWN, AbstractIterator } = require("abstract-leveldown")
const LevelUp = require("levelup")
const leveldown = require("leveldown")
const encode = require("encoding-down")

const itKeys = ["gt", "gte", "lt", "lte", "start", "end"]

class MyIterator extends AbstractIterator {
  constructor(db, options) {
    if (!db || !db instanceof Table)
      throw new Error("db must be of type Table.")

    if (options && typeof options !== "object")
      throw new Error("options must be an object.")

    super(new AbstractLevelDOWN())
    if (!options) options = {}
    itKeys.forEach((k) => {
      if (options[k]) options[k] = db.prefixed(options[k])
    })
    if (!options.gte) options.gte = db.prefixed()
    if (!options.lte) options.lte = db.prefixed("\ufff0")

    this.it = db.container.iterator(options)
    this.table = db
  }

  next(callback) {
    if (!callback)
      return new Promise((resolve, reject) =>
        this.it.next((err, k, value) =>
          err ? reject(err) : resolve({ key: this.table.isOwn(k) || k, value })
        )
      )

    this.it.next((err, k, value) =>
      callback(err, this.table.isOwn(k) || k, value)
    )
  }

  end(callback) {
    if (!callback)
      return new Promise((resolve, reject) =>
        this.it.end((err) => (err ? reject(err) : resolve()))
      )
    this.it.end(callback)
  }
}

class Table extends LevelUp {
  constructor(container, prefix, schema) {
    if (!prefix || typeof prefix !== "string" || prefix.indexOf(":") !== -1)
      throw new Error("Malformed prefix.")
    if (!container instanceof LevelUp)
      throw new Error("Container must be an instance of LevelUp.")

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
    return new MyIterator(this, options)
  }

  isOwn(k) {
    if (!k) return false
    const [prefix, key] = k.split(":")
    return prefix === this.prefix && key
  }

  prefixed(key) {
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
    if (options) {
      const { level, ajv, ...rest } = options
      if (!level && !ajv) levelOptions = rest
      if (level) levelOptions = level
      if (ajv) ajvOptions = ajv
    }

    super(
      encode(leveldown(location), { valueEncoding: "json" }),
      levelOptions,
      (err) => err && this.emit("error", err)
    )
    this.location = location
    this.tables = new Map()
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.once("ready", resolve)
      this.once("error", reject)
    })
  }

  destroy(callback) {
    return this.close()
      .then(() => {
        if (!callback)
          return new Promise((resolve, reject) =>
            leveldown.destroy(this.location, (err) =>
              err ? reject(err) : resolve()
            )
          )
        leveldown.destroy(this.location, callback)
      })
      .catch((err) => {
        if (!callback) throw err
        callback(err)
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

  get tableNames() {
    return Array.from(this.tables.keys())
  }

  table(prefix) {
    const table = this.tables.get(prefix)
    if (!table) throw new Error("Table does not exist.")
    return table
  }

  createTable(prefix, schema) {
    if (this.tables.get(prefix)) throw new Error("Table already exists.")
    const table = new Table(this, prefix, schema)
    this.tables.set(prefix, table)

    return table
  }
}

module.exports = Oy
