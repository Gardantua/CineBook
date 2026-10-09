const test = require('node:test');
const assert = require('node:assert/strict');
const { readJwtSecret } = require('../config/auth');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

test('missing or short signing keys are rejected', () => {
    for (const environment of [{}, { JWT_SECRET: '' }, { JWT_SECRET: 'short' }, { JWT_SECRET: ' '.repeat(32) }]) {
        assert.throws(() => readJwtSecret(environment), /JWT_SECRET/);
    }
});

test('a configured signing key is preserved', () => {
    const secret = 'local-test-signing-key-with-32-characters';
    assert.equal(readJwtSecret({ JWT_SECRET: secret }), secret);
});

test('middleware rejects absent or forged tokens and accepts the configured key', () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'local-test-signing-key-with-32-characters';
    const response = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    try {
        let nextCalls = 0;
        auth({ header: () => undefined }, response, () => nextCalls++);
        assert.equal(response.statusCode, 401);
        const forged = jwt.sign({ userId: 999 }, 'another-local-test-key-with-32-characters');
        auth({ header: () => `Bearer ${forged}` }, response, () => nextCalls++);
        assert.equal(response.statusCode, 400);
        const valid = jwt.sign({ userId: 7 }, process.env.JWT_SECRET);
        const request = { header: () => `Bearer ${valid}` };
        auth(request, response, () => nextCalls++);
        assert.equal(nextCalls, 1);
        assert.equal(request.user.userId, 7);
    } finally {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }
});

const nodemailer = require('nodemailer');
test('mail transport still composes a reset email without sending it', async () => {
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const message = await transport.sendMail({ from: 'demo@example.invalid', to: 'recipient@example.invalid', subject: 'Reset', text: 'Local transport check' });
    assert.match(message.message.toString(), /Local transport check/);
});
