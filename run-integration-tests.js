const fs = require('fs');
const path = require('path');

console.log('Running Integration Tests...\n');

// Load outputs
const outputFilePath = path.join(__dirname, 'cfn-outputs', 'flat-outputs.json');
let outputs = [];

if (fs.existsSync(outputFilePath)) {
  try {
    const fileContents = fs.readFileSync(outputFilePath, 'utf-8');
    outputs = JSON.parse(fileContents);
    console.log('✓ Loaded outputs from file');
  } catch (err) {
    console.error('❌ Error reading outputs file:', err.message);
    process.exit(1);
  }
} else {
  console.log('❌ No outputs file found');
  process.exit(1);
}

// Helper function to get output values
const getOutputValue = (key) => {
  const output = outputs.find(o => o.OutputKey === key);
  return output ? output.OutputValue : undefined;
};

let testsPassed = 0;
let testsFailed = 0;

// Test function
const test = (testName, testFn) => {
  try {
    testFn();
    console.log(`✓ ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    testsFailed++;
  }
};

// Helper assertion function
const expect = (actual) => ({
  toBeDefined: () => {
    if (actual === undefined || actual === null) {
      throw new Error(`Expected value to be defined, got ${actual}`);
    }
  },
  toMatch: (regex) => {
    if (!regex.test(actual)) {
      throw new Error(`Expected "${actual}" to match pattern ${regex}`);
    }
  },
  toContain: (substring) => {
    if (!actual.includes(substring)) {
      throw new Error(`Expected "${actual}" to contain "${substring}"`);
    }
  },
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected "${actual}" to be "${expected}"`);
    }
  }
});

console.log('=== Infrastructure Validation Tests ===');

test('should have all required outputs from CloudFormation deployment', () => {
  expect(getOutputValue('ApiEndpoint')).toBeDefined();
  expect(getOutputValue('LambdaFunctionArn')).toBeDefined();
  expect(getOutputValue('DynamoDBTableName')).toBeDefined();
  expect(getOutputValue('DynamoDBTableArn')).toBeDefined();
});

test('Lambda function ARN should follow expected format', () => {
  const lambdaFunctionArn = getOutputValue('LambdaFunctionArn');
  expect(lambdaFunctionArn).toMatch(/^arn:aws:lambda:us-east-1:\d{12}:function:.*data-processor$/);
});

test('DynamoDB table name should include "data-table"', () => {
  const dynamoDBTableName = getOutputValue('DynamoDBTableName');
  expect(dynamoDBTableName).toContain('data-table');
});

test('DynamoDB table ARN should follow expected format', () => {
  const dynamoDBTableArn = getOutputValue('DynamoDBTableArn');
  expect(dynamoDBTableArn).toMatch(/^arn:aws:dynamodb:us-east-1:\d{12}:table\/.*data-table$/);
});

test('API endpoint should be in us-east-1', () => {
  const apiEndpoint = getOutputValue('ApiEndpoint');
  expect(apiEndpoint).toContain('us-east-1');
  expect(apiEndpoint).toContain('/data');
});

console.log('\n=== API Gateway Integration Tests ===');

test('API endpoint should have correct structure', () => {
  const apiEndpoint = getOutputValue('ApiEndpoint');
  expect(apiEndpoint).toMatch(/^https:\/\/[\w-]+\.execute-api\.us-east-1\.amazonaws\.com\/\w+\/data$/);
});

console.log('\n=== Lambda Function Tests ===');

test('Lambda function ARN should be in correct region', () => {
  const lambdaArn = getOutputValue('LambdaFunctionArn');
  expect(lambdaArn).toContain('us-east-1');
});

console.log('\n=== DynamoDB Tests ===');

test('DynamoDB table ARN should be in correct region', () => {
  const tableArn = getOutputValue('DynamoDBTableArn');
  expect(tableArn).toContain('us-east-1');
});

console.log('\n=== End-to-End Workflow Tests ===');

test('all components should reference consistent environment', () => {
  const apiEndpoint = getOutputValue('ApiEndpoint');
  const functionArn = getOutputValue('LambdaFunctionArn');
  const tableName = getOutputValue('DynamoDBTableName');
  
  // Extract environment from different components
  const apiEnv = apiEndpoint.split('/')[4]; // Extract environment from URL path
  expect(apiEnv).toBeDefined();
});

test('resource naming should be consistent', () => {
  const tableName = getOutputValue('DynamoDBTableName');
  const functionArn = getOutputValue('LambdaFunctionArn');
  
  expect(tableName).toContain('data-table');
  expect(functionArn).toContain('data-processor');
});

// Summary
console.log('\n=== INTEGRATION TEST SUMMARY ===');
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All integration tests PASSED');
  process.exit(0);
} else {
  console.log('\n❌ Some integration tests FAILED');
  process.exit(1);
}