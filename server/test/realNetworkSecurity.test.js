const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const https = require('node:https');
const { checkHttp } = require('../src/services/intelligenceEngine');

// Self-signed test certificate for port 0 ephemeral HTTPS server testing
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUXyIudmMdmYDn5zBFy6zP5hRmv6cwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MTExNzEyMTE1NloXDTM2MTEx
NDEyMTE1NlowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAt3O9fyUPz/ObldC2qQsf6EHdZ8r1uBZ8W5u9LMb5frio
jWVJp7nreetpZWAJOMMId4VmH/6SsNbaf2EIwjrhtV0YWsflHv3O0dLLaFvwb3x5
Cyk2KA+pmvKK8aUtQLcyX0h/OMCdBAqeAnSccVvPfbl7koMgLt8RhB5yrsCm0cPj
HRgDo4/Al1Aw5784b4Rk4krry4MMnSVYqpNt4DEDZ19ZzhopyNS649YqY3Hn4dO/
7guXDv1aF2HoU1Whrq30V524DMoXN5gGbtAsarZt3/T7qIKiSoJCYPQoVNvCzuOn
YasOvv2bYA/KX0z3MTrZYdebh9pv5kprwXSyKNrl+wIDAQABo1MwUTAdBgNVHQ4E
FgQUdDDXL1TMbtzLNpWosFF9Yan/StAwHwYDVR0jBBgwFoAUdDDXL1TMbtzLNpWo
sFF9Yan/StAwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAC6G1
jOmJ6GtB9rPTbONfGjfz+p1Mb/XvDZnArXew3uNgCHxVaGb3fv0JsRwTV8kLApFV
fsohJmYTNaYH1XaA9SnVeoTfm6puK7tGt/LKxMFbLVtERf8koPBLNR9Ehheey+76
y54gmWnqye5WXjhR1urYDCbgFI++EzaUgMhnKs6L1qGdFwfBsxY4+63Lh/N/ZVOh
p93kp2WMamX68zowDCLyyxfZs/JKpOqJX4QLUqz6hKC1WqIuyzQDKMp8lwYShQM/
5uglt3wZntrwlxxvEsR8HdzPBpWU1TSIaZvPxIrvrDOUrwZyQvCjQgTeQabOfqrP
DR3/vGn+PB+KgcMt/Q==
-----END CERTIFICATE-----`;

const TEST_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3c71/JQ/P85uV
0LapCx/oQd1nyvW4Fnxbm70sxvl+uKiNZUmnuet562llYAk4wwh3hWYf/pKw1tp/
YQjCOuG1XRhax+Ue/c7R0stoW/BvfHkLKTYoD6ma8orxpS1AtzJfSH84wJ0ECp4C
dJxxW899uXuSgyAu3xGEHnKuwKbRw+MdGAOjj8CXUDDnvzhvhGTiSuvLgwydJViq
k23gMQNnX1nOGinI1Lrj1ipjcefh07/uC5cO/VoXYehTVaGurfRXnbgMyhc3mAZu
0Cxqtm3f9PuogqJKgkJg9ChU28LO46dhqw6+/ZtgD8pfTPcxOtlh15uH2m/mSmvB
dLIo2uX7AgMBAAECggEAAVxEXXsC4QHnd3byw9InTGugnrJsnA7eoTdIcdqP4xav
eUz0/N9uFZtfTrclmlwn5esBVN9oaxNMz4ECtZ4GKngkRBgTZOVw8TFk/MMhx1He
++w0UJu9ID8INL6K1V4Ga5p4Bw22nF8PyOjgeB68LSyA9Bcw1+gjkx0+sHkRQ6Dz
BFAtY/bzVv4619Yn54ny9JTatetaQHEYabKaMVAzfXm+1IAmHKh5DehDoGTJ4W1y
XB0aEuEpGrJ8lS3DImdWIwT5clc7GiNhpX/dlhOBEVRsL4RvrytHnmrNB25/6kk0
WaI+WDKaCDD7DyXe9XA1Sc+s8ffBI2PG3lMLRubA0QKBgQDyJkXcoexaa/G4jwxD
UW92aZ+yX8/Lafekwh8XoqeICUQIrxRnfnnIzUdDnSWTCuSU0SK033Dqinw5Qlb/
FYq2VGBnW4yLCgPajD/3QPISbx+MZv6xFFZBWdXrX4y0oOQvwB36shAho/35C67J
Ms9S8yt9dC1TvtrKZ9QU3laN/wKBgQDB8fpXZHzJOlg8QxpWMzqY28xBcO82xfVq
zIdbjWU9Yat8L1zgarSk+4a4Evwe/1JPKdXSZKB18j+cR5hH6PSaiHLMT/Y0BDzY
MdUqqKp4f9nnYuZWjihtsp4AyU9mQnpkOf7eFvbWBlWi56vRpl1yZ9f3SQk8NbP4
vLPJkRXgBQKBgQDMUWLtUWteuGoTMhBE1PfZ0DHBjnqExnsAeBNIHCSD8l2HfkMX
OG6F8j/JW1WTBsPslbJVL5vVKti6b7F8Nq7+PZ/CVkr2HpM12tU2SYR37W+PRnBs
9h35slV/7vWIi6E+cTpah9h4qijn9OWcOtUYxrnRdy+v1ABEfOtEWH5r/QKBgFKf
1BcHKGJSCOUjcUTn7j7Q5OO8SSz8iOFG4SOPyWGtCnGNe/PfgbYHsg0ZiW9rNpWj
LQTE+ddFrPPXTHjWNd7f4ohISItAgutXz4is8nMDhMGe0KJvTanuPoH3QWw/RgUM
8BeNkPr9F96e9AQM7CKhOtCOvPB5sIJ3YeCtfrRBAoGBAIHV/9JBJ/5qu7i6YOyI
IKcqSmufNzYzUaume2Cs3OxRRdbUwUSa79qA95bj4/dhKEYcAyztaESAvkDEv8kP
spG2+YnvPwpav4g8P/YvJTkNT/uksdub/rA92BxyAvXd0b+BInqsRzqRCMCanxuZ
kYICXgPJlMMJR62hmovgZ1gu
-----END PRIVATE KEY-----`;

describe('Real Local Network Security & SSRF Tests (Port 0 Ephemeral Servers)', () => {
  let redirectServer;
  let redirectPort;
  let httpsServer;
  let httpsPort;

  before(async () => {
    // Start local ephemeral HTTP server
    redirectServer = http.createServer((req, res) => {
      if (req.url === '/redirect-to-localhost') {
        res.writeHead(302, { 'Location': 'http://127.0.0.1/admin' });
        res.end();
      } else if (req.url === '/redirect-to-private-ipv4') {
        res.writeHead(302, { 'Location': 'http://10.0.0.1/admin' });
        res.end();
      } else if (req.url === '/redirect-to-ipv6-loopback') {
        res.writeHead(302, { 'Location': 'http://[::1]/admin' });
        res.end();
      } else if (req.url === '/redirect-no-location') {
        res.writeHead(302);
        res.end();
      } else if (req.url === '/redirect-chain-1') {
        res.writeHead(302, { 'Location': `http://127.0.0.1:${redirectPort}/redirect-chain-2` });
        res.end();
      } else if (req.url === '/redirect-chain-2') {
        res.writeHead(302, { 'Location': `http://127.0.0.1:${redirectPort}/final` });
        res.end();
      } else if (req.url === '/final') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => redirectServer.listen(0, '127.0.0.1', resolve));
    redirectPort = redirectServer.address().port;

    // Start local ephemeral HTTPS server with self-signed certificate
    httpsServer = https.createServer({ key: TEST_KEY, cert: TEST_CERT }, (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('https response ok');
    });

    await new Promise((resolve) => httpsServer.listen(0, '127.0.0.1', resolve));
    httpsPort = httpsServer.address().port;
  });

  after(async () => {
    if (redirectServer) {
      await new Promise((resolve) => redirectServer.close(resolve));
    }
    if (httpsServer) {
      await new Promise((resolve) => httpsServer.close(resolve));
    }
  });

  it('REAL NETWORK: should block real HTTP server from redirecting to loopback / localhost (SSRF)', async () => {
    // We simulate target resolving to public, but server returning 302 to 127.0.0.1
    const mockDns = {
      lookup: async (hostname, opts) => {
        if (hostname === 'public-site.com') {
          return [{ address: '93.184.216.34', family: 4 }];
        }
        return [{ address: '127.0.0.1', family: 4 }];
      }
    };

    const mockHttp = {
      request: (url, opts, cb) => {
        // Send request to the real local ephemeral server
        return http.request(`http://127.0.0.1:${redirectPort}/redirect-to-localhost`, opts, cb);
      }
    };

    const res = await checkHttp('http://public-site.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.strictEqual(res.reachable, false);
    assert.strictEqual(res.blocked, true);
    assert.ok(res.reason.includes('blocked for security') || res.reason.includes('private/internal IP address'));
  });

  it('REAL NETWORK (Path B): should block real HTTP server from redirecting to private IPv4 (http://10.0.0.1/admin)', async () => {
    const mockDns = {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }]
    };

    const mockHttp = {
      request: (url, opts, cb) => {
        return http.request(`http://127.0.0.1:${redirectPort}/redirect-to-private-ipv4`, opts, cb);
      }
    };

    const res = await checkHttp('http://public-site.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.strictEqual(res.reachable, false);
    assert.strictEqual(res.blocked, true);
    assert.ok(res.reason.includes('private') || res.reason.includes('blocked for security'));
  });

  it('REAL NETWORK (Path C): should block real HTTP server from redirecting to IPv6 loopback (http://[::1]/admin)', async () => {
    const mockDns = {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }]
    };

    const mockHttp = {
      request: (url, opts, cb) => {
        return http.request(`http://127.0.0.1:${redirectPort}/redirect-to-ipv6-loopback`, opts, cb);
      }
    };

    const res = await checkHttp('http://public-site.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.strictEqual(res.reachable, false);
    assert.strictEqual(res.blocked, true);
    assert.ok(res.reason.includes('private') || res.reason.includes('blocked for security') || res.reason.includes('Internal IP'));
  });

  it('REAL NETWORK (Path F): should reject invalid / self-signed TLS certificate against real local HTTPS server on port 0', async () => {
    const mockDns = {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }]
    };

    const mockHttps = {
      request: (url, opts, cb) => {
        // Connect to the real local ephemeral HTTPS server
        return https.request(`https://127.0.0.1:${httpsPort}/`, opts, cb);
      }
    };

    const res = await checkHttp('https://untrusted-self-signed.com', {
      dnsModule: mockDns,
      httpsModule: mockHttps
    });

    assert.strictEqual(res.reachable, true); // Server is reachable on fallback retry
    assert.strictEqual(res.tlsValid, false); // But TLS certificate validation was strictly failed
    assert.ok(
      res.tlsError && (
        res.tlsError.includes('DEPTH_ZERO_SELF_SIGNED_CERT') ||
        res.tlsError.includes('self-signed') ||
        res.tlsError.includes('certificate')
      ),
      `Expected TLS error to indicate self-signed cert, got: ${res.tlsError}`
    );
  });

  it('REAL NETWORK: should handle real HTTP 302 response without Location header gracefully', async () => {
    const mockDns = {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }]
    };

    const mockHttp = {
      request: (url, opts, cb) => {
        return http.request(`http://127.0.0.1:${redirectPort}/redirect-no-location`, opts, cb);
      }
    };

    const res = await checkHttp('http://no-location.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.strictEqual(res.reachable, true);
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.redirectLocation, null);
  });

  it('SECURITY ENFORCEMENT: should reject arbitrary destination ports before socket creation', async () => {
    const blockedPorts = [22, 25, 3306, 6379, 8080, 8443];

    for (const port of blockedPorts) {
      const res = await checkHttp(`http://example.com:${port}/path`);
      assert.strictEqual(res.reachable, false, `Port ${port} was not rejected!`);
      assert.strictEqual(res.blocked, true);
      assert.ok(
        res.reason.includes(`Destination port ${port} is blocked`),
        `Expected port block reason for ${port}, got: ${res.reason}`
      );
    }
  });

  it('SECURITY ENFORCEMENT: should permit standard ports 80 and 443', async () => {
    const mockDns = {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }]
    };
    const mockHttp = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };
    const mockHttps = {
      request: (url, opts, cb) => {
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    const res80 = await checkHttp('http://example.com:80', { dnsModule: mockDns, httpModule: mockHttp });
    assert.strictEqual(res80.blocked, undefined);
    assert.strictEqual(res80.reachable, true);

    const res443 = await checkHttp('https://example.com:443', { dnsModule: mockDns, httpsModule: mockHttps });
    assert.strictEqual(res443.blocked, undefined);
    assert.strictEqual(res443.reachable, true);
  });

  it('SECURITY SIMULATION: should reject multi-address DNS answers if any address is private (Dual-Stack SSRF)', async () => {
    const mockDnsWithPrivateSecondary = {
      lookup: async (hostname, opts) => {
        // Returns both public IP and private loopback
        return [
          { address: '93.184.216.34', family: 4 },
          { address: '127.0.0.1', family: 4 }
        ];
      }
    };

    const res = await checkHttp('http://dual-homed-attack.com', {
      dnsModule: mockDnsWithPrivateSecondary
    });

    assert.strictEqual(res.reachable, false);
    assert.strictEqual(res.blocked, true);
    assert.ok(
      res.reason.includes('Domain resolves to private/internal IP address (127.0.0.1)'),
      `Expected private IP block reason, got: ${res.reason}`
    );
  });

  it('SOCKET PINNING: should verify socket pinned lookup callback adheres to Node contract', async () => {
    let capturedLookup = null;
    const mockDns = {
      lookup: async () => [{ address: '93.184.216.34', family: 4 }]
    };
    const mockHttp = {
      request: (url, opts, cb) => {
        capturedLookup = opts.lookup;
        const res = { statusCode: 200, headers: {}, resume: () => {} };
        setTimeout(() => cb(res), 5);
        return { on: () => {}, end: () => {} };
      }
    };

    await checkHttp('http://pinned-test.com', {
      dnsModule: mockDns,
      httpModule: mockHttp
    });

    assert.ok(typeof capturedLookup === 'function');

    // Test with options.all = true
    let resultAll = null;
    capturedLookup('rebound-target.com', { all: true }, (err, addresses) => {
      resultAll = addresses;
    });
    assert.deepStrictEqual(resultAll, [{ address: '93.184.216.34', family: 4 }]);

    // Test with options.all = false
    let resultSingle = null;
    capturedLookup('rebound-target.com', {}, (err, address, family) => {
      resultSingle = { address, family };
    });
    assert.deepStrictEqual(resultSingle, { address: '93.184.216.34', family: 4 });
  });
});
