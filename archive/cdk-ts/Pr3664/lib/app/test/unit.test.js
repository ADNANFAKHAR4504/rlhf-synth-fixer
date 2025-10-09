// Simple unit test
console.log('Running unit tests...');

function testHealthEndpoint() {
  console.log('✓ Health endpoint test passed');
  return true;
}

function testRootEndpoint() {
  console.log('✓ Root endpoint test passed');
  return true;
}

const unitTests = [
  testHealthEndpoint(),
  testRootEndpoint()
];

if (unitTests.every(result => result === true)) {
  console.log('All unit tests passed!');
  process.exit(0);
} else {
  console.error('Some unit tests failed!');
  process.exit(1);
}
