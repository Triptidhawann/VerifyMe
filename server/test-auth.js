const test = async () => {
  const baseUrl = 'http://localhost:5000/api';
  
  const req = async (endpoint, method, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  console.log('--- SIGNUP TESTS ---');
  // 1. Valid signup
  let res = await req('/auth/signup', 'POST', { name: 'Test User', email: 'test@example.com', password: 'password123' });
  console.log('Valid signup:', res.status === 201 ? 'Pass' : 'Fail', res.data);
  const validToken = res.data.token;

  // 2. Duplicate email
  res = await req('/auth/signup', 'POST', { name: 'Test User 2', email: 'test@example.com', password: 'password123' });
  console.log('Duplicate email:', res.status === 400 ? 'Pass' : 'Fail', res.data.message);

  // 3. Invalid email
  res = await req('/auth/signup', 'POST', { name: 'Test User', email: 'invalid-email', password: 'password123' });
  console.log('Invalid email:', res.status === 400 ? 'Pass' : 'Fail', res.data.message);

  // 4. Missing fields
  res = await req('/auth/signup', 'POST', { email: 'missing@example.com' });
  console.log('Missing fields:', res.status === 400 ? 'Pass' : 'Fail', res.data.message);

  // 5. Short password
  res = await req('/auth/signup', 'POST', { name: 'Test', email: 'short@example.com', password: '123' });
  console.log('Short password:', res.status === 400 ? 'Pass' : 'Fail', res.data.message);

  // 6. Attempt admin signup
  res = await req('/auth/signup', 'POST', { name: 'Fake Admin', email: 'fakeadmin@example.com', password: 'password123', role: 'admin' });
  console.log('Attempt admin signup role:', res.data.user?.role === 'user' ? 'Pass (Forced to user)' : 'Fail', res.data.user);

  console.log('\n--- LOGIN TESTS ---');
  // 1. Correct credentials
  res = await req('/auth/login', 'POST', { email: 'test@example.com', password: 'password123' });
  console.log('Correct credentials:', res.status === 200 ? 'Pass' : 'Fail', 'Token exists:', !!res.data.token);

  // 2. Wrong password
  res = await req('/auth/login', 'POST', { email: 'test@example.com', password: 'wrongpassword' });
  console.log('Wrong password:', res.status === 401 ? 'Pass' : 'Fail', res.data.message);

  // 3. Nonexistent account
  res = await req('/auth/login', 'POST', { email: 'nobody@example.com', password: 'password123' });
  console.log('Nonexistent account:', res.status === 401 ? 'Pass' : 'Fail', res.data.message);

  // 4. Missing fields
  res = await req('/auth/login', 'POST', { email: 'test@example.com' });
  console.log('Missing fields:', res.status === 400 ? 'Pass' : 'Fail', res.data.message);

  console.log('\n--- PROTECTED ROUTE TESTS (/users/me) ---');
  // 1. No token
  res = await req('/users/me', 'GET');
  console.log('No token:', res.status === 401 ? 'Pass' : 'Fail', res.data.message);

  // 2. Invalid token
  res = await req('/users/me', 'GET', null, 'invalid_token_string');
  console.log('Invalid token:', res.status === 401 ? 'Pass' : 'Fail', res.data.message);

  // 3. Valid token
  res = await req('/users/me', 'GET', null, validToken);
  console.log('Valid token:', res.status === 200 ? 'Pass' : 'Fail', res.data.user.email);
  console.log('Password hash present in /users/me?:', res.data.user.password ? 'Yes (FAIL)' : 'No (PASS)');
};

test();
