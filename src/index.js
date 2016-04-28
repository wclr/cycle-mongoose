import {makeAsyncDriver} from 'cycle-async-driver'
import mongoose from 'mongoose'

const objToCall = (context, obj) => {
  let method = Object.keys(obj)[0]
  if (!context[method]){
    throw new Error(`Object has no method ${method}`)
  }
  let args = Array.isArray(obj[method]) ? obj[method] : [obj[method]]
  return context[method].apply(context, args)
}

export const makeMongooseDriver = (db, options) => {
  if (typeof db === 'string'){
    db  = mongoose.createConnection(db, options)
  } else if (!db || typeof db.model !== 'function'){
    throw new Error(`You should provide either url with` +
      `connection options, or already created connection object`)
  }

  return makeAsyncDriver((request, cb) => {
    let modelName = request.Model
    let Model
    if (typeof modelName == 'string'){
      Model = db.model(modelName)
    } else {
      modelName = ''
      Model = modelName
    }

    if (!Model){
      throw Error(`Unknown model ${modelName}`)
    }

    let requestQuery = request.query || request.exec
    let queryChain

    if (typeof requestQuery === 'object') {
      if (!Array.isArray(requestQuery)){
        requestQuery = [requestQuery]
      }
      queryChain = requestQuery.reduce(objToCall, Model)
    } else if (typeof requestQuery === 'function') {
      queryChain = requestQuery.call(null, Model)
    }

    if (queryChain){
      if (queryChain.then){
        return queryChain
      } else if (typeof queryChain.exec === 'function'){
        queryChain.exec()
      } else {
        throw Error(`Request for model ${modelName} contains illegal chain query`)
      }
    }

    let cbMethod = Object.keys(request)
      .filter(key => typeof Model[key] === 'function')[0]

    if (cbMethod){
      let cbObj = {[cbMethod]:
        [].concat(request[cbMethod]).concat(cb)}
      return objToCall(Model, cbObj)
    }

    throw new Error(`Request for model ${modelName} does not contain valid instructions`)
  })
}
