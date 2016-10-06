# connect-datacache

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]

NodeJS express-session storage for IBM DataCache service. 

## Setup

```
npm install connect-datacache
```

Using the DataCache storage connector:

```javascript
var session = require('express-session');
var DataCacheStore = require('connect-datacache')(session);

app.use(session({
    store: new DataCacheStore(options),
    secret: 'keyboard cat'
}));
```

Standard usage for Bluemix environment/dev environment - with fallback on MemoryStore:

```javascript
dcStore = null;
try { 
    // by default is looking into bluemix cfenv services
    dcStore = new DataCacheStore();
} catch (err) {
    // log fallback on memory store for no DataCache service linked to app
}

app.use(session({
    store: dcStore,
    secret: 'keyboard cat'
}));
```

## Storage Options

Bellow is an example with the full list of parameters - default values for optional ones:

```javascript
var store = new DataCacheStore(
    // required parameters when no custom client provided
    restResource: 'http://dcsdomain.bluemix.net/resources/datacaches/{gridName}',
    restResourceSecure: 'https://dcsdomain.bluemix.net/resources/datacaches/{gridName}',
    gridName: '{gridName}',
    username: '{username}',
    password: '{password}',
    // optional parameters - default values
    mapName: '{gridName}',
    eviction: 'LUT',
    locking: 'optimistic',
    contentType: 'application/json',
    secure: true,
    ttl: 3600,
    client: null
);

```

### Bluemix environment

The datacache client is looking first for DataCache service cfenv values. For the Bluemix NodeJS app with a DataCache service associated the required parameters are read from ENV variables (credentials): 

Environment Variables > VCAP_SERVICES

```json
{
    "system_env_json": {
      "VCAP_SERVICES": {
         "DataCache-dedicated": [
            {
               "credentials": {
                 "catalogEndPoint": "...",
                 "restResource": "http://ip-numeric/resources/datacaches/SYS_GENERATED_GRIDNAME",
                 "restResourceSecure": "https://sdomain.bluemix.net/resources/datacaches/SYS_GENERATED_GRIDNAME",
                 "gridName": "SYS_GENERATED_GRIDNAME",
                 "username": "sysGeneratedUsername",
                 "password": "sysGeneratedPass"
               },
               "name": "datacache-service-name",
               "tags": []
            }
         ]
      }
   },
}
```

### restResources/restResourceSecure
defaults: VCAP_SERVICES credentials values

Depending on the "secure" value, one of them is required if not found in ENV variables by cfenv.


### mapName
For a Bluemix application it is required to have the same value as for "gridName". A resource is identified with a complete URI as:

http://secure.domain/resources/datacaches/SYS_GENERATED_GRIDNAME/MAP_NAME.EVICTION.LOCK/SESSION_KEY

ex:
https://ecaas3.w3ibm.bluemix.net/resources/datacaches/Ae7hjz7tQjuxF44ncLAvuQGH/Ae7hjz7tQjuxF44ncLAvuQGH.LUT.O/sess:t7OQGXZ3x8TNp269-lf-wsdnUBx5OcU6

For non-Bluemix environments can be customized as a namespace for data.

### eviction
- 'LUT' - default
- 'NONE'
- 'LAT'

### locking
- 'optimistic' - default
- 'pessimistic'

### contentType
- 'application/json' - default - turns on the JSON encoder/decoder for session data
- other - saves session data as plain text

### secure
- true - default - uses 'restResourceSecure' as store entrypoint
- false  - uses 'restResource' as store entrypoint

### ttl
- session/storage time to live - overrides the cookie maxAge value if present

### client
- offers option to pass an instance of DataCacheClient or inteface matching object -> turns optional all the required parameters/credentials

## Contributing

- PR code needs to pass the lint check and unit test

```
npm test
```
- PR code should be covered by UT

```
npm run coverage
```

### Resources

- http://www.ibm.com/support/knowledgecenter/SSTVLU_8.6.0/com.ibm.websphere.extremescale.doc/tdevrest.html
- https://console.ng.bluemix.net/docs/services/DataCache/index.html#datac001

### Attributions
- The connect-datacache code is based on implementation from other express-session storages as: connect-redis

[npm-image]: https://img.shields.io/npm/v/connect-datacache.svg
[npm-url]: https://npmjs.org/package/connect-datacache
[travis-image]: https://img.shields.io/travis/adriantanasa/connect-datacache/master.svg
[travis-url]: https://travis-ci.org/adriantanasa/connect-datacache
[downloads-image]: https://img.shields.io/npm/dm/connect-datacache.svg
[downloads-url]: https://npmjs.org/package/connect-datacache