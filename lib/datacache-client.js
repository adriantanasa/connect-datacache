/**
 * DataCache Client for Bluemix DataCache service
 * Copyright(c) 2016 Adrian Tanasa
 *
 * MIT Licensed
 *
 */

var debug = require('debug')('datacache-client');
var cfenv = require('cfenv');
var rp = require('request-promise');

/**
 * @param {Object} [options]
 */
function DataCacheClient(options) {
    // fall back on genenv
    options = options || {};
    var serviceURI = options.secure === false ? 'restResource' : 'restResourceSecure';
    options = Object.assign({}, this.getOptionsFromEnv(), options);
    // fail if minimal parameters are missing
    if (!options.username || !options.password || !options[serviceURI] || !options.gridName) {
        throw new TypeError('Missing mandatory options in parameters/ENV configuration');
    }

    this.options = options;
    this.restURI = options[serviceURI].replace('/' + this.options.gridName, '');
    this.restAuthHeader = 'Basic ' + (new Buffer(this.options.username + ':' + this.options.password)
    .toString('base64'));

    // mapName defaults to gridName in Bluemix
    this.options.mapName = this.options.mapName || this.options.gridName;
    this.options.eviction = this.options.eviction || 'LUT';
    this.options.locking = this.options.locking || 'optimistic';
    this.options.ttl = this.options.ttl || 3600;
    this.options.contentType = this.options.contentType || this.contentTypeOptions['json'];
}

DataCacheClient.prototype.evictionOptions = {
    'LUT': '.LUT',
    'NONE': '.NONE',
    'LAT': '.LAT'
};

DataCacheClient.prototype.lockingOptions = {
    'optimistic': '.O',
    'pessimistic': '.P'
};

DataCacheClient.prototype.contentTypeOptions = {
    'json': 'application/json'
};

/**
 * Builds the request options for the request-promise
 * @param {string} key - The key name to pe use for storage
 * @param {string} reqMethod - POST | GET | DELETE
 * @param {Numeric} [ttl] - force a time to live in seconds for stored data
 * @returns {Object}
 */
DataCacheClient.prototype.buildRequestOptions = function(key, reqMethod, ttl) {
    // add eviction and locking to mapName
    var mapName = this.options.mapName + this.evictionOptions[this.options.eviction] +
        this.lockingOptions[this.options.locking];
    var uri = [this.restURI, this.options.gridName, mapName, encodeURIComponent(key)].join('/');
    uri += (reqMethod === 'POST' ? '?ttl=' + (ttl || this.options.ttl) : '');

    var options = {
        'uri': uri,
        'method': reqMethod,
        'headers': {
            'Content-Type': this.options.contentType,
            'Authorization': this.restAuthHeader
        },
        'resolveWithFullResponse': true,
        'json': !!(this.options.contentType === this.contentTypeOptions['json'])
    };
    debug('buildRequestOptions', options);
    return options;
};

/**
 * Get data stored for the key
 * @param {string} key - Store key to be used
 * @returns {Promise}
 */
DataCacheClient.prototype.get = function(key) {
    debug('DataCache GET "%s"', key);
    return rp(this.buildRequestOptions(key, 'GET'));
};

/**
 * Store data to Data Cache
 * @param {string} key - Store key
 * @param {Object|String} data - Data to be stored
 * @param {Numeric} [ttl] - Time to live for stored data
 * @returns {Promise}
 */
DataCacheClient.prototype.put = function(key, data, ttl) {
    debug('DataCache POST "%s" TTL=%s', key, ttl);
    var reqOptions = this.buildRequestOptions(key, 'POST', ttl);
    reqOptions.body = data;
    return rp(reqOptions);
};

/**
 * Deletes data stored for a key
 * {string} key - Store key
 * @returns {Promise}
 */
DataCacheClient.prototype.destroy = function(key) {
    debug('DataCache DELETE "%s"', key);
    var reqOptions = this.buildRequestOptions(key, 'DELETE');
    return rp(reqOptions);
};

/**
 * Parses local CF ENV variables for a DataCache service and returns credentials
 * @returns {Object|null}
 */
DataCacheClient.prototype.getOptionsFromEnv = function() {
    var appEnv = cfenv.getAppEnv();
    var servicesEnv = appEnv.services || {};
    var serviceName =  Object.keys(servicesEnv).find(function(servName) { return servName.match(/^DataCache/); });

    if (serviceName && servicesEnv[serviceName][0] && servicesEnv[serviceName][0].credentials) {
        debug('DataCache service found in ENV: %s', serviceName);
        return servicesEnv[serviceName][0].credentials;
    }

    debug('No valid DataCache service found in ENV');
    return null;
};

module.exports = DataCacheClient;
