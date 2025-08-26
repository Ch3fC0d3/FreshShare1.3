// Temporary configuration for Fastify backend
process.env.PORT = '8080';
process.env.DATABASE_URL = 'postgres://localhost:5432/freshshare';

// Additional debugging information
console.log('=========================================');
console.log('Fastify backend temporary configuration loaded');
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('=========================================');
