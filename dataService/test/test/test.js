/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

const axios = require('axios');
const expect = require('chai').expect;
const assert = require('chai').assert

const zssPort = 8542;
const tcpip = "tcpip";
const userid = "user";
const password = "password";
const rootURL = 'http://localhost:' + zssPort + '/ZLUX/plugins/org.zowe.explorer-ip/services/ipExplorer/';


describe('Test explorer-ip', function () {

  instance = axios.create({
    baseURL: rootURL + tcpip,
    timeout: 30000,
    auth: {
      username: userid,
      password: password
    }
  });

  describe('Verify info endpoint', function () {

    it('Verify successful request', async function () {
      response = await instance.get('/info')
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('info');
      expect(response.data.info).to.not.be.empty;
      expect(response.data.info).to.have.all.keys('stackStartTime', 'IPv6Enabled');
    });
  });

  describe('Verify request failures', function () {

    it('Verify bad method', async function () {
      try {
        response = await instance.post('/info');
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(405);
        expect(e.response.data.error).to.equal('Only GET requests are supported');
      }
    });

    it('Verify invalid endpoint - 1', async function () {
      try {
        response = await instance.get('/notexists');
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data.error).to.equal('Endpoint not found.');
      }
    });

    it('Verify invalid endpoint - 2', async function () {
      try {
        response = await instance.get('');
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data.error).to.equal('Endpoint not found.');
      }
    });

    it('Verify invalid endpoint - 3', async function () {
      try {
        response = await instance.get('', { baseURL: rootURL });
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data.error).to.equal('Endpoint not found.');
      }
    });

    it('Verify unknown tcpip name', async function () {
      try {
        response = await instance.get('/info', { baseURL: rootURL + 'badTcpip' });
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(500);
        expect(e.response.data.error).to.equal('Check zssServer log for more details');
      }
    });

    it('Verify tcpip name too long', async function () {
      try {
        response = await instance.get('/info', { baseURL: rootURL + 'tcpiplong' });
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(400);
        expect(e.response.data.error).to.equal('Tcpip name is too long');
      }
    });
  });

  describe('Verify connections endpoint', function () {

    it('Verify successful request', async function () {
      response = await instance.get('/connections')
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      // examine a connection object
      expect(response.data.connections[0]).to.have.all.keys('asid', 'bytesIn', 'bytesOut', 'lastActivity',
        'localIPaddress', 'localPort', 'remoteIPaddress',
        'remotePort', 'resourceID', 'resourceName',
        'startTime', 'state', 'tcb');
    });

    it('Verify request with fLocalIp_1 parameters ', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fLocalIp_1: '127.0.0.1'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.localIPaddress).to.be.oneOf(['127.0.0.1', '::ffff:127.0.0.1']);
      });
    });

    it('Verify request with fLocalIp_1 parameters - empty response', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fLocalIp_1: '127.0.0.255'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.be.empty;
    });

    it('Verify request with fLocalIpPrefix_1 parameters', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fLocalIp_1: '127.0.0.255',
          fLocalIpPrefix_1: 24 // matches on first three octets
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.localIPaddress).to.contain.oneOf(['127.0.0.', '::ffff:127.0.0.']);
      });
    });

    it('Verify request with fLocalPort_1 parameters', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fLocalPort_1: zssPort,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.localPort).to.equal(zssPort);
      });
    });

    it('Verify request with fRemoteIp_1 parameters ', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fRemoteIp_1: '127.0.0.1'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.remoteIPaddress).to.be.oneOf(['127.0.0.1', '::ffff:127.0.0.1']);
      });
    });

    it('Verify request with fRemoteIp_1 parameters - empty response', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fRemoteIp_1: '127.0.0.255'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.be.empty;
    });

    it('Verify request with fRemoteIpPrefix_1 parameters', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fRemoteIp_1: '127.0.0.255',
          fRemoteIpPrefix_1: 24 // matches on first three octets
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.remoteIPaddress).to.contain.oneOf(['127.0.0.', '::ffff:127.0.0.']);
      });
    });

    it('Verify request with fRemotePort_1 parameters', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fRemotePort_1: zssPort,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.remotePort).to.equal(zssPort);
      });
    });

    it('Verify request with fResourceName_1 parameters', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fResourceName_1: 'SSH*',
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.resourceName).to.be.a('string').and.satisfy(str => str.startsWith('SSH'));
      });
    });

    it('Verify request with fAsid_1 parameters', async function () {
      // get some asid first
      tempResp = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fResourceName_1: 'SSH*',
        }
      })
      let asid = tempResp.data.connections[0].asid;

      // Use the obtained asid as a filter criterion
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fAsid_1: asid,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.asid).to.equal(asid);
      });
    });

    it('Verify request with fResourceId_1 parameters', async function () {
      // get some resourceID first
      tempResp = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fResourceName_1: 'SSH*',
        }
      })
      let resourceID = tempResp.data.connections[0].resourceID;

      // Use the obtained resourceID as a filter criterion
      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          fResourceId_1: resourceID,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el.resourceID).to.equal(resourceID);
      });
    });

  });

  describe('Verify listeners endpoint', function () {

    it('Verify successful request', async function () {
      response = await instance.get('/listeners')
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      // examine a listener object
      expect(response.data.listeners[0]).to.have.all.keys('asid', 'connsAccepted', 'connsDropped', 'connsInBacklog',
        'currentConns', 'estabConnsInBacklog', 'lastActivity',
        'lastReject', 'localIPaddress', 'localPort', 'maxBacklogAllow',
        'resourceID', 'resourceName', 'startTime', 'tcb', 'v6onlySocket');
    });

    it('Verify request with fLocalIp_1 parameters ', async function () {
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fLocalIp_1: '127.0.0.1'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.localIPaddress).to.be.oneOf(['127.0.0.1', '::ffff:127.0.0.1']);
      });
    });

    it('Verify request with fLocalIp_1 parameters - empty response', async function () {
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fLocalIp_1: '127.0.0.255'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.be.empty;
    });

    it('Verify request with fLocalIpPrefix_1 parameters', async function () {
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fLocalIp_1: '127.0.0.255',
          fLocalIpPrefix_1: 24 // matches on first three octets
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.localIPaddress).to.contain.oneOf(['127.0.0.', '::ffff:127.0.0.']);
      });
    });

    it('Verify request with fLocalPort_1 parameters', async function () {
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fLocalPort_1: zssPort,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.localPort).to.equal(zssPort);
      });
    });

    it('Verify request with fResourceName_1 parameters', async function () {
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fResourceName_1: 'SSH*',
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.resourceName).to.be.a('string').and.satisfy(str => str.startsWith('SSH'));
      });
    });

    it('Verify request with fAsid_1 parameters', async function () {
      // get some asid first
      tempResp = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fResourceName_1: 'SSH*',
        }
      })
      let asid = tempResp.data.listeners[0].asid;

      // Use the obtained asid as a filter criterion
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fAsid_1: asid,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.asid).to.equal(asid);
      });
    });

    it('Verify request with fResourceId_1 parameters', async function () {
      // get some resourceID first
      tempResp = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fResourceName_1: 'SSH*',
        }
      })
      let resourceID = tempResp.data.listeners[0].resourceID;

      // Use the obtained resourceID as a filter criterion
      response = await instance.get('/listeners', {
        params: {
          filterCount: 1,
          fResourceId_1: resourceID,
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.resourceID).to.equal(resourceID);
      });
    });
  });

  describe('Verify ports endpoint', function () {

    it('Verify successful request', async function () {
      response = await instance.get('/ports')
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('ports');
      assert.isArray(response.data.ports);
      expect(response.data.ports).to.not.be.empty;
      // examine a port object
      expect(response.data.ports[0]).to.have.all.keys('bindAddr', 'flags', 'jobname', 'portNumber',
        'portNumberEnd', 'rsvOptions', 'safname', 'unrsvOptions', 'useType');
      expect(response.data.ports[0].flags).to.have.all.keys('IPV6', 'RANGE', 'TCP', 'UNRSV');
      expect(response.data.ports[0].useType).to.have.all.keys('RESERVED', 'AUTHPORT', 'JOBNAME');
      expect(response.data.ports[0].rsvOptions).to.have.all.keys('AUTOLOG', 'DELAYACKS', 'SHAREPORT',
        'SHAREPORTWLM', 'BIND', 'SAF', 'NOSMC', 'NOSMCR');
      expect(response.data.ports[0].unrsvOptions).to.have.all.keys('DENY', 'SAF', 'WHENLISTEN', 'WHENBIND');

    });

    it('Verify request with parameters to find ftp (21) port', async function () {
      response = await instance.get('/ports', {
        params: {
          fPortMin: 21,
          fPortMax: 21
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('ports');
      assert.isArray(response.data.ports);
      expect(response.data.ports).to.not.be.empty;
      expect(response.data.ports).to.have.lengthOf(1);
      expect(response.data.ports[0].portNumber).to.equal(21);
    });

    it('Verify request with parameters returning empty array of ports', async function () {
      response = await instance.get('/ports', {
        params: {
          fPortMin: 22,
          fPortMax: 20
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('ports');
      assert.isArray(response.data.ports);
      expect(response.data.ports).to.be.empty;
    });

    it('Verify request with fPortMin parameter out of lower bound', async function () {
      try {
        response = await instance.get('/ports', {
          params: {
            fPortMin: -1
          }
        })
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data).to.equal('value -1 below acceptable value 1 for fPortMin');
      }
    });

    it('Verify request with fPortMin parameter out of upper bound', async function () {
      try {
        response = await instance.get('/ports', {
          params: {
            fPortMin: 65536
          }
        })
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data).to.equal('value 65536 above acceptable value 65535 for fPortMin');
      }
    });

    it('Verify request with fPortMax parameter out of lower bound', async function () {
      try {
        response = await instance.get('/ports', {
          params: {
            fPortMax: -1
          }
        })
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data).to.equal('value -1 below acceptable value 1 for fPortMax');
      }
    });

    it('Verify request with fPortMax parameter out of upper bound', async function () {
      try {
        response = await instance.get('/ports', {
          params: {
            fPortMax: 65536
          }
        })
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(404);
        expect(e.response.data).to.equal('value 65536 above acceptable value 65535 for fPortMax');
      }
    });

    it('Verify request with fPortRsvName parameter', async function () {
      response = await instance.get('/ports', {
        params: {
          fPortRsvName: 'FTP*'
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('ports');
      assert.isArray(response.data.ports);
      expect(response.data.ports).to.not.be.empty;
      expect(response.data.ports[0].jobname).to.be.a('string').and.satisfy(str => str.startsWith('FTP'));
    });

    it('Verify request with fPortRsvName parameter exceeding 8 char length', async function () {
      try {
        response = await instance.get('/ports', {
          params: {
            fPortRsvName: 'TooLongName'
          }
        })
        throw 'shouldFail'
      } catch (e) {
        // Assert fail when the request succeeds
        if (e === 'shouldFail') {
          expect.fail('The request should fail.');
        }
        expect(e.response.status).to.equal(500);
        expect(e.response.data.error).to.equal('fPortRsvName parameter exceeded the allowable length (8 chars).');
      }
    });

  });

  describe('Combine NMI filters', function () {

    it('Verify two filters are in logical OR relation ', async function () {
      response = await instance.get('/connections', {
        params: {
          filterCount: 2,
          // first filter
          fLocalIp_1: '127.0.0.1',
          fLocalPort_1: zssPort,
          // second filter
          fRemoteIp_2: '127.0.0.1',
          fRemotePort_2: zssPort
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections).to.not.be.empty;
      response.data.connections.forEach(el => {
        expect(el).to.satisfy(el => (el.localIPaddress == '127.0.0.1' && el.localPort == zssPort) ||
                                    (el.remoteIPaddress == '127.0.0.1' && el.remotePort == zssPort));
      });
    });

    it('Verify three filters when one of the filter is empty (returns all)', async function () {
      // return all connections
      tempResp = await instance.get('/connections');
      let connCount = tempResp.data.connections.length;

      response = await instance.get('/connections', {
        params: {
          filterCount: 3, // <-- three filters
          // first filter
          fLocalIp_1: '127.0.0.1',
          fLocalPort_1: zssPort,
          // second filter
          fRemoteIp_2: '127.0.0.1',
          fRemotePort_2: zssPort
          // third filter left empty
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections.length).to.be.closeTo(connCount,20);
    });

    it('Verify second filter is ignored when filterCount = 1', async function () {
      // return all connections
      tempResp = await instance.get('/connections');
      let connCount = tempResp.data.connections.length;

      response = await instance.get('/connections', {
        params: {
          filterCount: 1,
          // first filter
          fLocalIp_1: '127.0.0.1',
          fLocalPort_1: zssPort,
          // second filter - should be ignored
          fRemoteIp_2: '127.0.0.1',
          fRemotePort_2: zssPort
        }
      });
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connections');
      assert.isArray(response.data.connections);
      expect(response.data.connections.length).to.be.equal(1);
      expect(response.data.connections[0]).to.include({localIPaddress: '127.0.0.1', localPort: zssPort});
    });

    it('Verify three filters', async function () {
      response = await instance.get('/listeners', {
        params: {
          filterCount: 3,
          // first filter
          fResourceName_1: 'FTP*',
          // second filter
          fLocalPort_2: 22,
          // third filter
          fLocalPort_3: 23
        }
      })
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('listeners');
      assert.isArray(response.data.listeners);
      expect(response.data.listeners).to.not.be.empty;
      response.data.listeners.forEach(el => {
        expect(el.localPort).to.be.oneOf([21, 22, 23]);
      });
    });

  });
});

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
