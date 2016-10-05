/**
 * Connect - DataCache
 * Copyright(c) 2016 Adrian Tanasa
 *
 * MIT Licensed
 *
 * This is an adaption from connect-redis, see:
 * https://github.com/visionmedia/connect-redis
 */

var debug = require('debug')('connect:datacache');
var util = require('util');
var DataCacheClient = require('./datacache-client');
var noop = function() {};

/**
 *
 * @callback sessCallback
 * @param {Object} error
 * @param {Object} responseObj
 */

/**
 * One day in seconds.
 */
var oneDay = 86400;

function getTTL(store, sess) {
    var maxAge = sess.cookie && sess.cookie.maxAge ? sess.cookie.maxAge : null;
    return store.ttl || (typeof maxAge === 'number' ? Math.floor(maxAge / 1000) : oneDay);
}

/**
 * Return the `DataCacheStore` extending `express`'s session Store.
 *
 * @param {object} express session
 * @return {Function}
 * @api public
 */
module.exports = function(session) {

    /**
     * Express's session Store.
     */
    var Store = session.Store;

    /**
     * Initialize DataCacheStore with the given `options`.
     *
     * @param {Object} options
     * @api public
     */
    function DataCacheStore(options) {
        if (!(this instanceof DataCacheStore)) {
            throw new TypeError('Cannot call DataCacheStore constructor as a function');
        }

        options = options || {};
        this.prefix = options.prefix || 'sess:';

        Store.call(this, options);
        this.ttl = options.ttl;
        if (options.client) {
            this.client = options.client;
        } else {
            this.client = new DataCacheClient(options);
        }
    }

    /**
     * Inherit from `Store`.
     */
    util.inherits(DataCacheStore, Store);

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {sessCallback} fn
     * @api public
     */
    DataCacheStore.prototype.get = function(sid, fn) {
        debug('GET "%s"', sid);
        fn = fn || noop;
        sid = this.prefix + sid;

        this.client.get(sid)
        .then(function(data) {
            return fn(null, data.body);
        })
        .catch(function(err) {
            debug('Error on GET', err);
            if (err.statusCode === 404) {
                return fn();
            } else {
                return fn(err);
            }
        });
    };

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {sessCallback} fn
     * @api public
     */
    DataCacheStore.prototype.set = function(sid, sess, fn) {
        debug('SET session "%s"', sid);
        fn = fn || noop;
        sid = this.prefix + sid;
        var ttl = getTTL(this, sess);
        this.client.put(sid, sess, ttl)
        .then(function() {
            fn(null, null);
        })
        .catch(function(err) {
            debug('Error on SET', err);
            return fn(err);
        });
    };

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @param {sessCallback} fn
     * @api public
     */
    DataCacheStore.prototype.destroy = function(sid, fn) {
        debug('DESTROY session "%s"', sid);
        fn = fn || noop;
        sid = this.prefix + sid;
        this.client.destroy(sid)
        .catch(function(err) {
            debug('Error on DESTROY', err);
            return fn(err);
        });
    };

    /**
     * Refresh the time-to-live for the session with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {sessCallback} fn
     * @api public
     */
    DataCacheStore.prototype.touch = function(sid, sess, fn) {
        // re-post data to refresh TTL
        debug('TOUCH session "%s"', sid);
        fn = fn || noop;
        sid = this.prefix + sid;
        var self = this;

        this.client.get(sid)
        .then(function(data) {
            // update TTL
            var currentSession = data.body;
            currentSession.cookie = sess.cookie;
            var ttl = getTTL(self, sess);
            // update
            self.client.put(sid, currentSession, ttl)
            .then(function() {
                fn(null, null);
            })
            .catch(function(err) {
                debug('Error on TOUCH - failed updating', err);
                return fn(err);
            });
        })
        .catch(function(err) {
            debug('Error on TOUCH - session not found', err);
            return fn(err);
        });
    };

    return DataCacheStore;
};
