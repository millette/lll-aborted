"use strict"

// npm
import test from "ava"
import levelErrors from "level-errors"

// self
import { Oy } from "."

test("create and destroy", async (t) => {
  t.plan(3)
  const oy = new Oy("test-dbs/t1", { errorIfExists: true })
  t.pass()
  await oy.ready()
  t.pass()
  await oy.destroy()
  t.pass()
})

test("create (existing) and destroy", async (t) => {
  t.plan(6)
  const oy = new Oy("test-dbs/t2", { errorIfExists: true })
  t.pass()
  await oy.ready()
  t.pass()

  await oy.close()
  t.pass()

  const oy2 = new Oy("test-dbs/t2", { errorIfExists: true })
  t.pass()

  t.throwsAsync(oy2.ready(), {
    instanceOf: levelErrors.OpenError,
    message: /^Invalid argument: .+: exists \(error_if_exists is true\)$/,
  })
  await oy.destroy()
  t.pass()
})

test("create (twice) and destroy", async (t) => {
  t.plan(5)
  const oy = new Oy("test-dbs/t3", { errorIfExists: true })
  t.pass()
  await oy.ready()
  t.pass()

  const oy2 = new Oy("test-dbs/t3", { errorIfExists: true })
  t.pass()

  t.throwsAsync(oy2.ready(), {
    instanceOf: levelErrors.OpenError,
    message: /^IO error: lock .+\/LOCK: already held by process$/,
  })
  await oy.destroy()
  t.pass()
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
