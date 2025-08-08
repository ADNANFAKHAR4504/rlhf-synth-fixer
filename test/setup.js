// test/setup.js

// Give async tests a bit more time (CDKTF synth can be slow on CI)
jest.setTimeout(60000);

// Keep test output readable
const origError = console.error;
console.error = (...args) => {
  // ignore noisy deprecation warnings etc. if you want
  if (String(args[0] || '').includes('DeprecationWarning')) return;
  origError(...args);
};

// If your tests rely on env defaults, set them here
process.env.AWS_REGION = process.env.AWS_REGION || 'us-west-2';
process.env.ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
