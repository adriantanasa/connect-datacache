'use strict';

var expect = require('chai').expect,
    sinon = require('sinon'),
    DataCacheClient = require('datacache-client'),
    session = require('express-session'),
    DataCacheStore = require('../lib/connect-datacache')(session);

describe('Testsuite - DataCacheClient', function() {
    var dcClientGetStub,
        dcClientPutStub,
        dcClientDestroyStub;

    var goodClientParams = {
        username: 'usertest',
        password: 'passwordtest',
        restResourceSecure: 'https://restSecureDomain.tst/resources/datacaches/gridNameTest',
        gridName: 'gridNameTest'
    };

    describe('TestSuite - DataCacheClient', function() {
        beforeEach(function() {
            dcClientGetStub = sinon.stub(DataCacheClient.prototype, 'get');
            dcClientPutStub = sinon.stub(DataCacheClient.prototype, 'put');
            dcClientDestroyStub = sinon.stub(DataCacheClient.prototype, 'destroy');
        });

        afterEach(function() {
            dcClientGetStub.restore();
            dcClientPutStub.restore();
            dcClientDestroyStub.restore();
        });

        it('Testcase - failing constructor - required params missing', function() {
            var error = null;
            try {
                var store = new DataCacheStore();
            } catch (err) {
                error = err;
            }
            expect(error).not.to.be.null;
            expect(store).not.to.be.ok;
        });

        it('Testcase - constructor - spy client', function() {
            var store = new DataCacheStore({
                client: sinon.spy()
            });

            expect(store).to.be.ok;
        });

        it('Testcase - constructor - passing params to client', function() {
            var store = new DataCacheStore(goodClientParams);
            expect(store).to.be.ok;
            expect(store.client).to.be.ok;
            expect(store.client.restURI).to.equal('https://restSecureDomain.tst/resources/datacaches');
        });

        it('Testcase - store get - success', function(done) {
            var goodData = {data: 'data'};
            var stubCallback = sinon.spy();
            dcClientGetStub.returns(Promise.resolve({body: goodData}));
            var store = new DataCacheStore(goodClientParams);
            store.get('key', stubCallback);

            setTimeout(function() {
                expect(dcClientGetStub.calledWith('sess:key')).to.be.true;
                expect(stubCallback.calledWith(null, {data: 'data'})).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store get - regular failure', function(done) {
            var error = {statusCode: 500};
            dcClientGetStub.returns(Promise.reject(error));
            var stubCallback = sinon.spy();
            var store = new DataCacheStore(goodClientParams);

            store.get('key', stubCallback);

            setTimeout(function() {
                expect(dcClientGetStub.calledWith('sess:key')).to.be.true;
                expect(stubCallback.calledWith(error)).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store get - 404 failure', function(done) {
            var error = {statusCode: 404};
            dcClientGetStub.returns(Promise.reject(error));
            var stubCallback = sinon.spy();
            var store = new DataCacheStore(goodClientParams);

            store.get('key', stubCallback);

            setTimeout(function() {
                expect(dcClientGetStub.calledWith('sess:key')).to.be.true;
                expect(stubCallback.called).to.equal(true);
                expect(stubCallback.calledWith(error)).to.equal(false);
                done();
            }, 0);
        });

        it('Testcase - store put - success', function(done) {
            var goodData = {data: 'data'};
            var stubCallback = sinon.spy();
            dcClientPutStub.returns(Promise.resolve({statusCode: 200, body: ''}));
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {ttl: 100}));
            store.set('key', goodData,  stubCallback);

            setTimeout(function() {
                expect(dcClientPutStub.calledWith('sess:key', goodData, 100)).to.be.true;
                expect(stubCallback.calledWith(null, null)).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store put - failure', function(done) {
            var goodData = {data: 'data'};
            var error = {statusCode: 500};
            var stubCallback = sinon.spy();
            dcClientPutStub.returns(Promise.reject(error));
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {ttl: 100}));
            store.set('key', goodData,  stubCallback);

            setTimeout(function() {
                expect(dcClientPutStub.calledWith('sess:key', goodData, 100)).to.be.true;
                expect(stubCallback.calledWith(error)).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store destroy - success', function(done) {
            var stubCallback = sinon.spy();
            dcClientDestroyStub.returns(Promise.resolve());
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {prefix: 'myprefix:'}));
            store.destroy('key',  stubCallback);

            setTimeout(function() {
                expect(dcClientDestroyStub.calledWith('myprefix:key')).to.be.true;
                // callback not called for successfull destroy of sess data
                expect(stubCallback.called).to.equal(false);
                done();
            }, 0);
        });

        it('Testcase - store destroy - failure', function(done) {
            var error = {statusCode: 500};
            var stubCallback = sinon.spy();
            dcClientDestroyStub.returns(Promise.reject(error));
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {prefix: 'myprefix:'}));
            store.destroy('key',  stubCallback);

            setTimeout(function() {
                expect(dcClientDestroyStub.calledWith('myprefix:key')).to.be.true;
                expect(stubCallback.calledWith(error)).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store touch - success', function(done) {
            var goodData = {data: 'data'};
            var stubCallback = sinon.spy();
            var session = {cookie: {}};
            dcClientGetStub.returns(Promise.resolve({body: goodData}));
            dcClientPutStub.returns(Promise.resolve({statusCode: 200, body: ''}));
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {ttl: 100}));
            store.touch('key', session, stubCallback);

            setTimeout(function() {
                expect(dcClientGetStub.calledWith('sess:key')).to.be.true;
                expect(dcClientPutStub.calledWith('sess:key', Object.assign({}, session, goodData), 100)).to.be.true;
                expect(stubCallback.calledWith(null, null)).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store touch - update error', function(done) {
            var error = {statusCode: 500};
            var goodData = {data: 'data'};
            var stubCallback = sinon.spy();
            var session = {cookie: {}};
            dcClientGetStub.returns(Promise.resolve({body: goodData}));
            dcClientPutStub.returns(Promise.reject(error));
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {ttl: 100}));
            store.touch('key', session, stubCallback);

            setTimeout(function() {
                expect(dcClientGetStub.calledWith('sess:key')).to.be.true;
                expect(dcClientPutStub.calledWith('sess:key', Object.assign({}, session, goodData), 100)).to.be.true;
                expect(stubCallback.calledWith(error)).to.equal(true);
                done();
            }, 0);
        });

        it('Testcase - store touch - get error', function(done) {
            var error = {statusCode: 500};
            var stubCallback = sinon.spy();
            var session = {cookie: {}};
            dcClientGetStub.returns(Promise.reject(error));
            dcClientPutStub.returns(Promise.reject(error));
            var store = new DataCacheStore(Object.assign({}, goodClientParams, {ttl: 100}));
            store.touch('key', session, stubCallback);

            setTimeout(function() {
                expect(dcClientGetStub.calledWith('sess:key')).to.be.true;
                expect(dcClientPutStub.calledWith('sess:key')).to.be.false;
                expect(stubCallback.calledWith(error)).to.equal(true);
                done();
            }, 0);
        });
    });
});
