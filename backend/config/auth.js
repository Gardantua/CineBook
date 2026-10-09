function readJwtSecret(environment = process.env) {
    const jwtSecret = environment.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim().length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters');
    }
    return jwtSecret;
}

module.exports = { readJwtSecret };
