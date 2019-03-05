"use strict"

// npm
import test from "ava"

// self
// import { Oy, evs } from './lib/oy.js'
// import Oy from './lib/oy.js'
import { Oy } from "."

const evs = [
  "error",
  "put",
  "del",
  "batch",
  "opening",
  "open",
  "ready",
  "closing",
  "closed",
]

// test.cb('foo', (t) => {
test("foo", async (t) => {
  t.plan(6)
  const oy = new Oy("fabadoo")

  evs.forEach((ev) => {
    oy.on(ev, (a, b, c) => {
      console.log("oy:", ev.toUpperCase(), a, b, c)
    })
  })

  t.is(oy.tableNames.length, 0)
  oy.createTable("bob")
  t.is(oy.tableNames.length, 1)
  const a1 = oy.table("bob")

  evs.forEach((ev) => {
    a1.on(ev, function(a, b, c) {
      console.log("table:", this.prefix, ev.toUpperCase(), a, b, c)
    })
  })

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

  await za.next()
  t.pass()

  await za.next()
  t.pass()

  const { key } = await za.next()
  t.pass()
  if (!key) {
    await za.end()
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

/*
test('foo', (t) => {
	t.pass()
})

test('bar', async (t) => {
	const bar = Promise.resolve('bar')
	t.is(await bar, 'bar')
})
*/
