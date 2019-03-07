"use strict"

// npm
import test from "ava"
import levelErrors from "level-errors"

// self
import { Oy } from "."

test("create and destroy", async (t) => {
  const oy = new Oy("test-dbs/t1", { errorIfExists: true })
  await oy.ready()
  await oy.destroy()
  t.pass()
})

test("create (existing) and destroy", async (t) => {
  const oy = new Oy("test-dbs/t2", { errorIfExists: true })
  await oy.ready()
  await oy.close()

  const oy2 = new Oy("test-dbs/t2", { errorIfExists: true })
  t.throwsAsync(oy2.ready(), {
    instanceOf: levelErrors.OpenError,
    message: /^Invalid argument: .+: exists \(error_if_exists is true\)$/,
  })
  await oy.destroy()
  t.pass()
})

test("create (twice) and destroy", async (t) => {
  const oy = new Oy("test-dbs/t3", { errorIfExists: true })
  await oy.ready()

  const oy2 = new Oy("test-dbs/t3", { errorIfExists: true })
  t.throwsAsync(oy2.ready(), {
    instanceOf: levelErrors.OpenError,
    message: /^IO error: lock .+\/LOCK: already held by process$/,
  })
  await oy.destroy()
  t.pass()
})

test("put (root)", async (t) => {
  const oy = new Oy("test-dbs/t4", { errorIfExists: true })
  await oy.ready()
  t.throwsAsync(oy.put("this", "that"), {
    instanceOf: Error,
    message: "Malformed key.",
  })
  await oy.destroy()
  t.pass()
})

test("put (root, prefixed)", async (t) => {
  const oy = new Oy("test-dbs/t5", { errorIfExists: true })
  await oy.ready()
  await oy.put("more:this", "that")
  await oy.destroy()
  t.pass()
})

test("create table", async (t) => {
  const oy = new Oy("test-dbs/t6", { errorIfExists: true })
  await oy.ready()
  const table = await oy.createTable("more")

  await oy.close()

  const oy2 = new Oy("test-dbs/t6", { errorIfExists: false })

  await oy2.ready()

  const tableOne = oy2.table("more")

  await oy2.destroy()
  t.pass()
})

test("put (tables) and iterator", async (t) => {
  const oy = new Oy("test-dbs/t7", { errorIfExists: true })
  await oy.ready()
  const table = await oy.createTable("more")
  const table2 = await oy.createTable("more2")

  await table.put("it", "is")
  await table2.put("it2", "is2")

  const n1 = await table.get("it")
  const n2 = await table2.get("it2")

  t.is(n1, "is")
  t.is(n2, "is2")

  const za = table.iterator({ gte: "a" })

  let key
  let value
  let n = 0

  while (({ key, value } = await za.next())) {
    if (key === undefined && value === undefined) {
      await za.end()
      break
    }
    t.is(key, "it")
    t.is(value, "is")
    ++n
  }

  t.is(n, 1)
  await oy.destroy()
})

test("put (tables) and iterator (v2", async (t) => {
  t.plan(1)
  const oy = new Oy("test-dbs/t8", { errorIfExists: true })
  await oy.ready()
  const table = await oy.createTable("more")
  const table2 = await oy.createTable("more2")

  await table.put("it", "is")
  await table2.put("it2", "is2")

  const za = table.iterator({ gte: "j" })

  let key
  let value
  let n = 0

  while (({ key, value } = await za.next())) {
    if (key === undefined && value === undefined) {
      await za.end()
      break
    }
    t.is(key, "it")
    t.is(value, "is")
    ++n
  }

  t.is(n, 0)
  await oy.destroy()
})

test.only("put (tables) and stream", async (t) => {
  t.plan(3)
  const oy = new Oy("test-dbs/t9", { errorIfExists: true })
  await oy.ready()
  const table = await oy.createTable("more")
  const table2 = await oy.createTable("more2")

  await table.put("it", "is")
  await table2.put("it2", "is2")

  // const za = table.iterator({ gte: 'a' })
  let n = 0
  const str = table.createReadStream({ gte: "a" })
  console.log("STR", str)
  str.on("data", ({ key, value }) => {
    consoe.log("DATA", key, value)
    t.is(key, "it")
    t.is(value, "is")
    ++n
  })

  t.is(n, 1)

  /*
  let key
  let value
  let n = 0

  while (({ key, value } = await za.next())) {
    if (key === undefined && value === undefined) {
      await za.end()
      break
    }
    t.is(key, "it")
    t.is(value, "is")
    ++n
  }

  t.is(n, 1)
  */
  await oy.destroy()
})

test.skip("foo", async (t) => {
  t.plan(7)
  const oy = new Oy("fabadoo")

  t.is(oy.tableNames.length, 0)
  oy.createTable("bob")
  t.is(oy.tableNames.length, 1)
  const a1 = oy.table("bob")

  /*
  try {
    const it = await a1.put('al3', 'vroom3')
    console.log(it)
  } catch (e) {
    console.error('put', e)
  }
  */

  /*
a1.put('al3', 'vroom3')
  .then((it) => {
    console.log(it)
*/

  const za = a1.iterator()

  const t1 = await za.next()
  console.log("t1:", t1)
  t.pass()

  const t2 = await za.next()
  console.log("t2:", t2)
  t.pass()

  const { key } = await za.next()
  t.pass()
  if (!key) {
    await za.end()
    t.pass()
    await oy.destroy()
    t.pass()
  }

  /*
    za.next((a, b, c) => {
      console.log('it1', a, b, c)
      t.pass()
      za.next((a, b, c) => {
        console.log('it2', a, b, c)
        t.pass()
        // 3
        za.next((a, b, c) => {
          console.log('it3', a, b, c)
          t.pass()
          if (b) {
            t.end()
          } else {
            za.end((a, b, c) => {
              console.log('it4', a, b, c)
              t.pass()
              t.end()
            })
          }
        })
      })
    })
    */

  /*
  })
  .catch ((e) => {
    console.error('put', e)
    t.end()
  })
*/

  /*
  // const a2 = oy.table('joe')
  try {
    const it = await a1.get('al2')
    console.log(it)
  } catch (e) {
    console.error('get', e)
  }

  try {
    const it = await a1.put('al2', 'vroom2')
    console.log(it)
  } catch (e) {
    console.error('put', e)
  }

  try {
    const it = await a1.get('al2')
    console.log(it)
  } catch (e) {
    console.error('get2', e)
  }
  */

  // console.log(a2)
})
