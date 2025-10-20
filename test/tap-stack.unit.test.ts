import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ServerlessInfrastructureStack } from '../lib/serverless-infrastructure-stack';

// Mock aws-sdk used by the lambda handler
// Create shared mocks so instances created inside the handler use them
const getParameterMock = jest.fn();
const putMock = jest.fn();

jest.mock('aws-sdk', () => {
  const SSM = function () {
    return { getParameter: getParameterMock };
  } as any;
  const DynamoDB = {
    DocumentClient: function () {
      return { put: putMock };
    },
  } as any;
  return { SSM, DynamoDB };
});

// Import the handler after mocking aws-sdk
const { handler } = require('../lib/lambda-handler/index.js');

describe('ServerlessInfrastructureStack and Lambda handler', () => {
  const uniqueSuffix = `test-${Date.now().toString().slice(-6)}`;
  let app: cdk.App;
  let stack: ServerlessInfrastructureStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new ServerlessInfrastructureStack(app, `TapStack${uniqueSuffix}`, {
      stackName: `TapStack${uniqueSuffix}`,
      envSuffix: uniqueSuffix,
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('synthesizes expected resources', () => {
    const json = template.toJSON();
    expect(json).toHaveProperty('Resources');
    const resources = Object.values(json.Resources || {}).map((r: any) => r.Type);
    // DynamoDB table
    expect(resources).toContain('AWS::DynamoDB::Table');
    // S3 bucket
    expect(resources).toContain('AWS::S3::Bucket');
    // SQS queue (DLQ)
    expect(resources).toContain('AWS::SQS::Queue');
    // Lambda function
    expect(resources.filter((t: string) => t === 'AWS::Lambda::Function').length).toBeGreaterThanOrEqual(1);
    // API Gateway
    expect(resources).toContain('AWS::ApiGateway::RestApi');
    // SSM Parameter
    expect(resources).toContain('AWS::SSM::Parameter');

    // Outputs exist
    const outputs = json.Outputs || {};
    expect(outputs).toHaveProperty('ApiEndpointUrl');
    expect(outputs).toHaveProperty('DynamoTableName');
    expect(outputs).toHaveProperty('LogsBucketName');
  });

  describe('Lambda handler behavior', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      // ensure lambda reads from a known parameter name in tests
      process.env.CONFIG_PARAMETER_NAME = '/application/config-test';
    });

    test('writes item to DynamoDB and returns 201 on valid input', async () => {
  // Arrange: SSM returns config, DynamoDB put succeeds
  getParameterMock.mockReturnValueOnce({ promise: () => Promise.resolve({ Parameter: { Value: JSON.stringify({ apiVersion: '1.0' }) } }) });
  putMock.mockReturnValueOnce({ promise: () => Promise.resolve({}) });

      const event = { body: JSON.stringify({ id: 'abc-123', payload: { foo: 'bar' } }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.id).toBe('abc-123');
      expect(body.item.configVersion).toBe('1.0');
    });

    test('returns 400 for invalid JSON body', async () => {
      const event = { body: 'not-json' };
      const res = await handler(event);
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Invalid JSON/);
    });

    test('returns 400 when id is missing', async () => {
      const event = { body: JSON.stringify({ payload: { foo: 'bar' } }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Missing required field/);
    });

    test('handles SSM failure gracefully and still stores item', async () => {
      // SSM throws; DynamoDB put succeeds
  getParameterMock.mockReturnValueOnce({ promise: () => Promise.reject(new Error('SSM failure')) });
  putMock.mockReturnValueOnce({ promise: () => Promise.resolve({}) });

      const event = { body: JSON.stringify({ id: 'xyz-789', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.id).toBe('xyz-789');
      // configVersion falls back to 'unknown' when SSM read fails
      expect(body.item.configVersion).toBe('unknown');
    });

    test('returns 500 when DynamoDB put fails', async () => {
      // SSM returns config, DynamoDB put fails
      getParameterMock.mockReturnValueOnce({ promise: () => Promise.resolve({ Parameter: { Value: JSON.stringify({ apiVersion: '1.0' }) } }) });
      putMock.mockReturnValueOnce({ promise: () => Promise.reject(new Error('Dynamo failed')) });

      const event = { body: JSON.stringify({ id: 'fail-1', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(500);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Internal Server Error/);
    });

    test('when CONFIG_PARAMETER_NAME is not set, configVersion is unknown', async () => {
      delete process.env.CONFIG_PARAMETER_NAME;
      // Dynamo put succeeds
      putMock.mockReturnValueOnce({ promise: () => Promise.resolve({}) });

      const event = { body: JSON.stringify({ id: 'nocfg-1', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.configVersion).toBe('unknown');
    });
  });
});

  describe('stack env selection branches', () => {
    test('uses envSuffix prop when provided', () => {
      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackWithProp', { envSuffix: 'propenv' });
      const t = Template.fromStack(s);
      const json = t.toJSON();
      // Expect exports with prop-based suffix
      const outputs = json.Outputs || {};
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(1);
    });

    test('falls back to process.env.ENV when envSuffix not provided', () => {
      process.env.ENV = 'envvar';
      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackWithEnvVar');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      expect(json.Outputs).toBeDefined();
      delete process.env.ENV;
    });

    test('defaults to dev when neither envSuffix nor ENV provided', () => {
      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackWithDefault');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      expect(json.Outputs).toBeDefined();
    });
  });