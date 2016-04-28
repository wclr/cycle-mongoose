import {makeMongooseDriver} from '../lib'
import {run} from '@cycle/core'
import {of, merge} from 'rx-factory'
import test from 'tape'
import mongoose from 'mongoose'

const schema = mongoose.Schema({name: 'string'})
schema.statics.customFindById = function (id, cb) {
  this.findById(id, cb)
}
mongoose.model('TestModel', schema)

var db = makeMongooseDriver('mongodb://localhost/mongoose-cycle-driver-test')

test('Request API', {timeout: 1000}, (t) => {

  const main = ({db}) => {

    t.plan(8)

    let created$ = db.select({create: _ => _}).mergeAll()
    created$.subscribe(x => t.ok(x, 'create method'))

    db.select({findById: _ => _}).mergeAll()
      .subscribe(x => t.ok(x, 'request contains findById method returning promise'))

    db.select({customFindById: _ => _}).mergeAll()
      .subscribe(x => t.ok(x, 'request contains custom method (with callback)'))

    db.select('queryArray').mergeAll()
      .subscribe(x => t.ok(x, 'query is array (chain) of method calls'))

    db.select('queryObj').mergeAll()
      .subscribe(x => t.ok(x, 'query is an object (single method call)'))

    db.select('queryFuncToExec').mergeAll()
      .subscribe(x => t.ok(x, 'query is a function for exec()'))

    db.select('queryFuncPromise').mergeAll()
      .subscribe(x => t.ok(x, 'query is a function returning promise'))

    db.select({remove: _ => _}).mergeAll()
      .subscribe(x => {
        t.is(x.result.ok, 1, 'remove method')
        t.end()
      })

    return {

      db: merge([
        of({
          Model: 'TestModel',
          create: {
            name: 'John',
            age: '10'
          }
        }),
        created$.map(({id}) => ({
          Model: 'TestModel',
          findById: id
        })),
        created$.map(({id}) => ({
          Model: 'TestModel',
          customFindById: id
        })),
        created$.map(({id}) => ({
          Model: 'TestModel',
          category: 'queryArray',
          query: [{findById: id}, {select: 'name'}]
        })),
        created$.map(({id}) => ({
          Model: 'TestModel',
          category: 'queryObj',
          query: {findById: id}
        })),
        created$.map(({id}) => ({
          Model: 'TestModel',
          category: 'queryFuncToExec',
          query: (m) => m.findById(id)
        })),
        created$.map(({id}) => ({
          Model: 'TestModel',
          category: 'queryFuncPromise',
          query: (m) => m.findById(id).exec()
        })),
        created$.map(({_id}) => ({
          Model: 'TestModel',
          remove: {_id}
        })).delay(200)

      ])
    }
  }

  run(main, {db})
})


