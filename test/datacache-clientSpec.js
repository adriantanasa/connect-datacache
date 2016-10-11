'use strict';

/* global before, after*/
var expect = require('chai').expect,
    sinon = require('sinon'),
    cfenv = require('cfenv'),
    DataCacheClient = require('../lib/datacache-client');

describe('Testsuite - DataCacheClient', function() {
    var minimalParams = {
        username: 'usertest',
        password: 'passwordtest',
        restResourceSecure: 'https://restSecureDomain.tst/resources/datacaches/gridNameTest',
        gridName: 'gridNameTest'
    };

    var extraParams = {
        restResource: 'http://restDomain.tst/resources/datacaches/gridNameTest',
        mapName: 'mapNameTest',
        eviction: 'LAT',
        locking: 'pessimistic',
        contentType: 'text/plain',
        ttl: 300,
        secure: false
    };

    describe('TestSuite - DataCacheClient', function() {

        it('Testcase - failing constructor - required params missing', function() {
            var error = null;
            try {
                var dcClient = new DataCacheClient();
            } catch (err) {
                error = err;
            }
            expect(error).not.to.be.null;
            expect(dcClient).not.ok;
        });

        it('Testcase - success constructor - minimal params', function() {
            var dcClient = new DataCacheClient(minimalParams);
            // test default settings
            expect(dcClient).to.be.ok;
            expect(dcClient.restURI).to.equal('https://restSecureDomain.tst/resources/datacaches');
            expect(dcClient.restAuthHeader).to.equal(
                'Basic ' + (new Buffer(minimalParams.username + ':' + minimalParams.password)
                .toString('base64')));
            expect(dcClient.options.mapName).to.equal(minimalParams.gridName);
            expect(dcClient.options.eviction).to.equal('LUT');
            expect(dcClient.options.locking).to.equal('optimistic');
            expect(dcClient.options.ttl).to.equal(3600);
            expect(dcClient.options.contentType).to.equal('application/json');
        });

        it('Testcase - success constructor - all params', function() {
            var options = Object.assign({}, minimalParams, extraParams);
            var dcClient = new DataCacheClient(options);
            // test default settings
            expect(dcClient).to.be.ok;
            expect(dcClient.restURI).to.equal('http://restDomain.tst/resources/datacaches');
            expect(dcClient.restAuthHeader).to.equal(
                'Basic ' + (new Buffer(options.username + ':' + options.password)
                .toString('base64')));
            expect(dcClient.options.mapName).to.equal(options.mapName);
            expect(dcClient.options.eviction).to.equal('LAT');
            expect(dcClient.options.locking).to.equal('pessimistic');
            expect(dcClient.options.ttl).to.equal(300);
            expect(dcClient.options.contentType).to.equal('text/plain');
        });

        it('Testcase - buildRequestOptions GET - minimal params', function() {
            var dcClient = new DataCacheClient(minimalParams);
            var reqOptions = dcClient.buildRequestOptions('sessKey', 'GET');
            // test default settings
            expect(reqOptions.uri).to.equal(
                'https://restSecureDomain.tst/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey');
            expect(reqOptions.method).to.equal('GET');
            expect(reqOptions.headers['Authorization']).to.equal(dcClient.restAuthHeader);
            expect(reqOptions.headers['Content-Type']).to.equal(dcClient.options.contentType);
        });

        it('Testcase - buildRequestOptions POST - default TTL', function() {
            var dcClient = new DataCacheClient(minimalParams);
            var reqOptions = dcClient.buildRequestOptions('sessKey', 'POST');
            // test default settings
            expect(reqOptions.uri).to.equal(
                'https://restSecureDomain.tst/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey?ttl=3600');
            expect(reqOptions.method).to.equal('POST');
        });

        it('Testcase - buildRequestOptions POST - TTL', function() {
            var dcClient = new DataCacheClient(minimalParams);
            var reqOptions = dcClient.buildRequestOptions('sessKey', 'POST', 500);
            // test default settings
            expect(reqOptions.uri).to.equal(
                'https://restSecureDomain.tst/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey?ttl=500');
            expect(reqOptions.method).to.equal('POST');
        });

        it('Testcase - buildRequestOptions POST - TTL', function() {
            var dcClient = new DataCacheClient(minimalParams);
            var reqOptions = dcClient.buildRequestOptions('sessKey', 'POST', 500);
            // test default settings
            expect(reqOptions.uri).to.equal(
                'https://restSecureDomain.tst/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey?ttl=500');
            expect(reqOptions.method).to.equal('POST');
        });
    });

    describe('TestSuite - DataCacheClient - getEnv', function() {
        var cfStub;

        before(function() {
            cfStub = sinon.stub(cfenv, 'getAppEnv');
            cfStub.returns({
                services: {
                    'DataCache-custom': [
                        {
                            name: 'service-datacachename',
                            'credentials': minimalParams
                        }
                    ]
                },
                getServiceCreds: function(name) {
                    var servObj = this.services['DataCache-custom'].find(function(item) {
                        return item.name === name;
                    });
                    return servObj ? servObj.credentials : null;
                }
            });
        });

        after(function() {
            cfStub.restore();
        });

        it('Testcase - constructor from env - by service type', function() {
            var dcClient = new DataCacheClient();
            expect(dcClient).to.be.ok;
            expect(dcClient.restURI).to.equal('https://restSecureDomain.tst/resources/datacaches');
            expect(dcClient.restAuthHeader).to.equal(
                'Basic ' + (new Buffer(minimalParams.username + ':' + minimalParams.password)
                .toString('base64')));
            expect(dcClient.options.mapName).to.equal(minimalParams.gridName);
            expect(dcClient.options.eviction).to.equal('LUT');
            expect(dcClient.options.locking).to.equal('optimistic');
            expect(dcClient.options.ttl).to.equal(3600);
            expect(dcClient.options.contentType).to.equal('application/json');
        });

        it('Testcase - constructor from env - by service name', function() {
            var dcClient = new DataCacheClient({cfServiceName: 'service-datacachename'});
            expect(dcClient).to.be.ok;
            expect(dcClient.restURI).to.equal('https://restSecureDomain.tst/resources/datacaches');
            expect(dcClient.restAuthHeader).to.equal(
                'Basic ' + (new Buffer(minimalParams.username + ':' + minimalParams.password)
                .toString('base64')));
            expect(dcClient.options.mapName).to.equal(minimalParams.gridName);
        });

        it('Testcase - constructor from env - by service name - not present', function() {
            try {
                var dcClient = new DataCacheClient({cfServiceName: 'service-bad-datacachename'});
            } catch (err) {
                expect(err).to.be.ok;
            }

            expect(dcClient).not.to.be.ok;
        });
    });

    describe('TestSuite - DataCacheClient - rp requests', function() {
        var nock = require('nock'),
            nockScope;

        it('Testcase - PUT data to datacache', function() {
            nockScope = nock('https://restSecureDomain.tst');
            nockScope.matchHeader('Authorization',
                'Basic ' + (new Buffer(minimalParams.username + ':' + minimalParams.password).toString('base64')))
                .post('/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey?ttl=50')
                .reply(200, 'Success');
            var dcClient = new DataCacheClient(minimalParams);

            return dcClient.put('sessKey', {data: 'test'}, 50).then(function(resp) {
                expect(resp).to.be.ok;
                expect(resp.statusCode).to.equal(200);
                expect(resp.body).to.equal('Success');
            });
        });

        it('Testcase - GET data from datacache', function() {
            nockScope = nock('https://restSecureDomain.tst');
            nockScope.matchHeader('Authorization',
                'Basic ' + (new Buffer(minimalParams.username + ':' + minimalParams.password).toString('base64')))
                .get('/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey')
                .reply(200, {data: 'test'});
            var dcClient = new DataCacheClient(minimalParams);

            return dcClient.get('sessKey').then(function(resp) {
                expect(resp).to.be.ok;
                expect(resp.statusCode).to.equal(200);
                expect(resp.body).to.deep.equal({data: 'test'});
            });
        });

        it('Testcase - GET data from datacache', function() {
            nockScope = nock('https://restSecureDomain.tst');
            nockScope.matchHeader('Authorization',
                'Basic ' + (new Buffer(minimalParams.username + ':' + minimalParams.password).toString('base64')))
                .delete('/resources/datacaches/gridNameTest/gridNameTest.LUT.O/sessKey')
                .reply(200, 'Success');
            var dcClient = new DataCacheClient(minimalParams);

            return dcClient.destroy('sessKey').then(function(resp) {
                expect(resp).to.be.ok;
                expect(resp.statusCode).to.equal(200);
                expect(resp.body).to.deep.equal('Success');
            });
        });
    });
});
