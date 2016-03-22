import { Observable as O } from 'rx';
import { createDriver } from 'cycle-async-driver';
import mongoose from 'mongoose';

export function makeMongooseDriver(url, options) {
  if (typeof url === 'object') {
    options = url;
    url = options.url || options.db;
  }
  var db;
  options = options || {};

  if (typeof url === 'string') {
    db = mongoose.createConnection(url, options);
  } else {
    db = url;
  }

  return createDriver(request => O.create(observer => {
    var modelName = request.Model;
    var Model;
    if (typeof modelName == 'string') {
      Model = db.model(modelName);
    } else {
      modelName = '';
      Model = modelName;
    }

    if (!Model) {
      throw new Error(`Could get Model ${ modelName }`);
    }

    var callback = (err, data) => err ? observer.onError(err) : observer.onNext(data);

    if (typeof request.create == 'object') {
      Model.create(request.create, callback);
    } else if (typeof request.remove == 'object') {
      Model.remove(request.remove, callback);
    } else if (typeof request.query == 'function' || typeof request.exec == 'function') {
      let q = (request.query || request.exec)(Model);
      // check if promise returned
      if (q.then) {
        q.then(result => {
          callback(null, result);
        }, callback);
      } else if (q.exec) {
        q.exec(callback);
      } else {
        throw new Error(`Illegal mongoose query for model ${ modelName }`);
      }
    } else {
      // TODO: this probably should be removed
      // if no query, look for method
      let method = Object.keys(query).filter(key => Model[key])[0];
      var params = query[method];
      params = Array.isArray(params) ? params : [params];
      params = params.concat(callback);

      if (!Model[method]) {
        throw new Error(`Could not find method ${ method } for Model ${ modelName }`);
      }
      Model[method].apply(Model, params);
    }
  }));
}
