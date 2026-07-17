const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData ? Buffer.byteLength(postData) : 0
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function test() {
    console.log('=== Testing API ===\n');

    // 1. Register
    console.log('1. Register user...');
    const reg = await request('POST', '/api/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',
        full_name: 'Test User'
    });
    console.log(`   Status: ${reg.status}`);
    console.log(`   Response: ${JSON.stringify(reg.data, null, 2)}`);

    // 2. Login
    console.log('\n2. Login...');
    const login = await request('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'test123'
    });
    console.log(`   Status: ${login.status}`);
    console.log(`   Response: ${JSON.stringify(login.data, null, 2)}`);

    if (login.data && login.data.token) {
        const token = login.data.token;

        // 3. Get profile
        console.log('\n3. Get profile...');
        const profile = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/auth/me',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            };
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                    catch { resolve({ status: res.statusCode, data: body }); }
                });
            });
            req.on('error', reject);
            req.end();
        });
        console.log(`   Status: ${profile.status}`);
        console.log(`   Response: ${JSON.stringify(profile.data, null, 2)}`);

        // 4. Get recommended jobs
        console.log('\n4. Get recommended jobs...');
        const jobs = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/jobs/recommended',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            };
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                    catch { resolve({ status: res.statusCode, data: body }); }
                });
            });
            req.on('error', reject);
            req.end();
        });
        console.log(`   Status: ${jobs.status}`);
        console.log(`   Jobs found: ${jobs.data && jobs.data.jobs ? jobs.data.jobs.length : 0}`);

        // 5. Get stats
        console.log('\n5. Get application stats...');
        const stats = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/applications/stats',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            };
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                    catch { resolve({ status: res.statusCode, data: body }); }
                });
            });
            req.on('error', reject);
            req.end();
        });
        console.log(`   Status: ${stats.status}`);
        console.log(`   Response: ${JSON.stringify(stats.data, null, 2)}`);

        // 6. Search jobs
        console.log('\n6. Search jobs...');
        const search = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/jobs/search?q=software&page=1&limit=5',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            };
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                    catch { resolve({ status: res.statusCode, data: body }); }
                });
            });
            req.on('error', reject);
            req.end();
        });
        console.log(`   Status: ${search.status}`);
        console.log(`   Jobs found: ${search.data && search.data.jobs ? search.data.jobs.length : 0}`);
        if (search.data && search.data.jobs && search.data.jobs.length > 0) {
            console.log(`   First job: ${search.data.jobs[0].title} at ${search.data.jobs[0].company}`);
        }
    }

    console.log('\n=== All tests completed ===');
}

test().catch(console.error);
