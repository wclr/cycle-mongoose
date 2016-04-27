# Mongoose-cycle
Mongoose.js driver for Cycle.js. Tested and ready.

```js
import mongoose from 'mongoose'

const schema = mongoose.Schema({name: 'string'})
schema.statics.customFindById = function (id, cb) {
  this.findById(id, cb)
}
var Model = mongoose.model('TestModel', schema)

var main = ({db}) => {
  return {
    db: merge([
      just('1234').map(id => ({
        Model: 'TestModel', findById: id // simple
      })),
      just('1234').map(id => ({
        Model: 'TestModel', 
        query: [{findById: id}, {select: 'name'}] // chain
      }))
    ])
  }
}

run(main{
  db: makeMongooseDriver('mongodb://localhost/mongoose-cycle-driver-test')
})

```

For other query methods see tests.

```bash
npm install cycle-mongoose -S
```