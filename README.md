# Mongoose-cycle
Mongoose.js driver for [Cycle.js](http://cycle.js.org/). Tested and ready.

###  (Almost) real world example: 
```js
import {run} from '@cycle/core'
import {makeMongooseDriver} from '@cycle-drivers/mongoose'
import {from, merge} from 'rx-factory'

const SendVerificationEmails = ({db, emails, schedule}) => {
  // pool database every 30 seconds
  let dbRequestSchedule$ = schedule.get('*/30 * * * * *').startWith('')
  return {
    // send emails for found records
    emails: db.select('find', _ => _)
        .success(found => from(found)).mergeAll()
      .map(({email, id}) => ({
        id,
        to: email,
        template: 'verify',
        params: {
          verifyLink: process.env.VERIFICATION_URL + '/' + id
        }
      })),
    db: merge([
      // find verification records not sent
      dbRequestSchedule$.map(({
        Model: 'Verification',
        find: {sent: {$exists: false}}
      })),
      // update verificaiton record in db after send
      emails.success((_, {id}) => ({
        Model: 'Verification',
        findByIdAndUpdate: [id, {sent: new Date()}]
      }))
    ]),
    log: db.select('find', _ => _)
      .success(found => `Found ${found.length} verification records to send`)
  }
}

run(SendVerificationEmails, {
  schedule: scheduleDriver,
  emails: emailsDriver,
  db: makeMongooseDriver(MONGO_URL, /* connection options */),
  log: (message$) => message$.forEach(::console.log) 
})
```

For other query methods [see tests](/test/index.js/).

```bash
npm install cycle-mongoose -S
```