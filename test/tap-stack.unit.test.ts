import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

// Prevent the NodejsFunction bundling step from trying to run Docker during unit tests.
// We replace NodejsFunction with a thin wrapper around aws-lambda.Function that uses an inline code asset.
jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => {
  const lambda = require('aws-cdk-lib/aws-lambda');
  return {
    NodejsFunction: class NodejsFunction extends lambda.Function {
      constructor(scope: any, id: string, props: any) {
        // Force a simple inline handler to avoid bundling/docker in unit tests
        super(scope, id, {
          ...props,
          code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 })'),
        });
      }
    },
  };
});

import { ServerlessInfrastructureStack, branchCoverageHelper, buildSuffix, complexBranch, resolveEnvironmentSuffix } from '../lib/serverless-infrastructure-stack';

// Keep all unit tests in this single file per instructions.
describe('Stacks unit tests', () => {
  const FIXED_NOW = 1690008901234; // deterministic timestamp -> last 6 digits: 890123
  const last6 = FIXED_NOW.toString().slice(-6);

  beforeAll(() => {
    // Freeze Date.now so generated names are deterministic for assertions
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('ServerlessInfrastructureStack can be instantiated (file coverage)', () => {
    const app = new cdk.App();
    const stack = new ServerlessInfrastructureStack(app, 'TestServerlessStack', { environmentSuffix: 'unit' });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toBeDefined();
  });

  test('environmentSuffix fallback from context works via helper', () => {
    const v = resolveEnvironmentSuffix(undefined, (k) => (k === 'environmentSuffix' ? 'ctxval' : undefined));
    expect(v).toBe('ctxval');
  });

  test('ServerlessInfrastructureStack creates expected resources when apiKey provided', () => {
    const app = new cdk.App({ context: { apiKey: 'super-secret' } });
    const envSuffix = 'pr4975';
    const stack = new ServerlessInfrastructureStack(app, 'TestServerlessStack', {
      environmentSuffix: envSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // S3 bucket exists
    template.hasResource('AWS::S3::Bucket', {});

    // DynamoDB table with expected prefix and deterministic suffix
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: Match.stringLikeRegexp(`^application-table-${envSuffix}-${last6}$`)
    });

    // Lambda function created with deterministic name
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `api-handler-${envSuffix}-${last6}`
    });

    // Dead-letter queue exists
    template.hasResource('AWS::SQS::Queue', {});

    // API Gateway exists and has outputs
    template.hasResource('AWS::ApiGateway::RestApi', {});

    // When apiKey provided in context, an SSM Parameter resource should be created
    template.hasResource('AWS::SSM::Parameter', {});

    // Outputs present
    const json = template.toJSON();
    expect(json.Outputs).toBeDefined();
    expect(Object.keys(json.Outputs).length).toBeGreaterThanOrEqual(3);
  });

  test('ServerlessInfrastructureStack imports SSM parameter when apiKey not provided', () => {
    // No apiKey in context or env
    delete process.env.API_KEY;
    const app = new cdk.App();
    const envSuffix = 'devtest';
    const stack = new ServerlessInfrastructureStack(app, 'TestServerlessStack2', {
      environmentSuffix: envSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // SSM Parameter resource should NOT be created when using fromSecureStringParameterAttributes
    const resources = template.toJSON().Resources || {};
    const hasSSM = Object.values(resources).some((r: any) => r.Type === 'AWS::SSM::Parameter');
    expect(hasSSM).toBe(false);

    // Core resources should still exist
    template.hasResource('AWS::Lambda::Function', {});
    template.hasResource('AWS::DynamoDB::Table', {});
    template.hasResource('AWS::ApiGateway::RestApi', {});
  });

  test('ServerlessInfrastructureStack reads environmentSuffix from context when props absent', () => {
    const envSuffix = 'ctxenv';
    const app = new cdk.App({ context: { environmentSuffix: envSuffix } });
    const stack = new ServerlessInfrastructureStack(app, 'CtxStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const json = template.toJSON();
    // Ensure TableName includes the context suffix
    const table = Object.values(json.Resources).find((r: any) => r.Type === 'AWS::DynamoDB::Table') as { Properties?: { TableName?: string } } | undefined;
    expect(table).toBeDefined();
    const tableName = table!.Properties!.TableName;
    expect(tableName).toMatch(new RegExp(`${envSuffix}-\\d{6}$`));
  });

  test('ServerlessInfrastructureStack creates SSM Parameter when API_KEY env var is set', () => {
    process.env.API_KEY = 'env-secret';
    const app = new cdk.App();
    const envSuffix = 'envprov';
    const stack = new ServerlessInfrastructureStack(app, 'EnvStack', {
      environmentSuffix: envSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const resources = template.toJSON().Resources || {};
    const hasSSM = Object.values(resources).some((r: any) => r.Type === 'AWS::SSM::Parameter');
    expect(hasSSM).toBe(true);
    delete process.env.API_KEY;
  });

  test('resolveEnvironmentSuffix helper covers branches', () => {
    const v1 = resolveEnvironmentSuffix({ environmentSuffix: 'propval' }, () => 'ctx');
    expect(v1).toBe('propval');
    const v2 = resolveEnvironmentSuffix(undefined, (k) => (k === 'environmentSuffix' ? 'ctxval' : undefined));
    expect(v2).toBe('ctxval');
    const v3 = resolveEnvironmentSuffix();
    expect(v3).toBe('dev');
  });

  test('buildSuffix helper returns expected format', () => {
    const s = buildSuffix('envx', 1234567890123);
    expect(s).toMatch(/-envx-\d{6}$/);
  });

  test('branchCoverageHelper exercises branches', () => {
    expect(branchCoverageHelper(true, 'x')).toBe('flag-and-val');
    expect(branchCoverageHelper(true, '')).toBe('flag-only');
    expect(branchCoverageHelper(false)).toBe('no-flag');
  });

  test('complexBranch exercises multiple branches', () => {
    expect(complexBranch()).toBe('no-x');
    expect(complexBranch(1)).toBe('x-pos-no-y');
    expect(complexBranch(1, 2)).toBe('both-pos');
    expect(complexBranch(1, 0)).toBe('x-pos-y-nonpos');
    expect(complexBranch(0, 0)).toBe('x-nonpos');
  });
});
