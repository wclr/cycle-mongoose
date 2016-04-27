# Mongoose-cycle
Mongoose.js driver for [Cycle.js](http://cycle.js.org/). Tested and ready.

```js
import {makeMongooseDriver} from 'cycle-mongoose'
import mongoose from 'mongoose'
import {just, merge} from 'rx-factory'

const schema = mongoose.Schema({name: 'string'})
schema.statics.customFindById = function (id, cb) {
  this.findById(id, cb)
}
var Model = mongoose.model('MyModel', schema)

var main = ({db}) => {
  return {
    db: merge([
      just('1234').map(id => ({
        Model: 'MyModel', 
        customFindById: id // simple method in query with param
      })),
      just('1234').map(id => ({
        Model: 'MyModel', 
        query: [{findById: id}, {select: 'name'}] // chain of methods
      }))
    ])
  }
}

run(main{
  db: makeMongooseDriver(MONGO__URL, /* connection options */)
})

```

For other query methods see tests.

```bash
npm install cycle-mongoose -S
```