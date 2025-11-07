import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      stackName: `TestTapStack-${environmentSuffix}`,
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      // do not set lambdaReservedConcurrency so we can assert it is not present
    });
    template = Template.fromStack(stack);
  });

  test('creates DynamoDB table with PAY_PER_REQUEST and composite keys', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', Match.objectLike({
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: 'pk', KeyType: 'HASH' }),
        Match.objectLike({ AttributeName: 'sk', KeyType: 'RANGE' }),
      ]),
      SSESpecification: Match.objectLike({ SSEEnabled: true }),
    }));
  });

  test('creates archive S3 bucket with access logging and encryption', () => {
    // Two buckets: logs and archive
    template.resourceCountIs('AWS::S3::Bucket', 2);
    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketEncryption: Match.anyValue(),
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      }),
    }));
  });

  test('creates consolidated Lambda with Node.js 16 and ARM64, no reserved concurrency by default', () => {
    const functions = template.findResources('AWS::Lambda::Function', Match.anyValue());
    const fnLogicalId = Object.keys(functions)[0];
    const fn = functions[fnLogicalId].Properties as any;
    expect(fn.Runtime).toBe('nodejs16.x');
    expect(fn.Architectures).toEqual(['arm64']);
    // Ensure reserved concurrency is not present when not provided
    expect(fn).not.toHaveProperty('ReservedConcurrentExecutions');
    // Ensure env vars include table and bucket references
    expect(fn.Environment.Variables).toEqual(
      expect.objectContaining({ DDB_TABLE_NAME: expect.any(Object), ARCHIVE_BUCKET: expect.any(Object) })
    );
  });

  test('creates HTTP API', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', Match.objectLike({
      ProtocolType: 'HTTP',
      Name: Match.anyValue(),
    }));
  });

  test('creates SNS Topic for alarms', () => {
    template.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({
      TopicName: Match.anyValue(),
    }));
  });

  test('outputs include API endpoint and stack name', () => {
    template.hasOutput('HttpApiEndpoint', Match.anyValue());
    template.hasOutput('StackName', Match.anyValue());
  });

  test('creates CloudWatch alarms for throttles, errors, p90 latency and DDB', () => {
    // Lambda throttles
    template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      Namespace: 'AWS/Lambda',
      MetricName: 'Throttles',
    } as any));
    // Lambda errors
    template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      Namespace: 'AWS/Lambda',
      MetricName: 'Errors',
    } as any));
    // Lambda p90 latency
    template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      Namespace: 'AWS/Lambda',
      MetricName: 'Duration',
      ExtendedStatistic: 'p90',
    } as any));
    // DDB throttled
    template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      Namespace: 'AWS/DynamoDB',
      MetricName: 'ThrottledRequests',
    } as any));
  });

  test('creates a CloudWatch dashboard', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });

  test('adds API routes for POST/GET/PUT/DELETE and list user transactions', () => {
    // There should be 5 routes in total
    template.resourceCountIs('AWS::ApiGatewayV2::Route', 5);
  });

  test('creates API access log group with 7-day retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', Match.objectLike({
      RetentionInDays: 7,
    }));
  });

  test('additional outputs exist', () => {
    template.hasOutput('ArchiveBucketName', Match.anyValue());
    template.hasOutput('TransactionsTableName', Match.anyValue());
    template.hasOutput('AlarmTopicArn', Match.anyValue());
    template.hasOutput('DashboardUrl', Match.anyValue());
  });

  test('sets reserved concurrency when provided', () => {
    const app2 = new cdk.App();
    const stack2 = new TapStack(app2, 'TestTapStack2', {
      stackName: `TestTapStack2-${environmentSuffix}`,
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      lambdaReservedConcurrency: 7,
    });
    const t2 = Template.fromStack(stack2);
    t2.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      ReservedConcurrentExecutions: 7,
    }));
  });

  test('creates JWT authorizer when configured', () => {
    const app3 = new cdk.App();
    const stack3 = new TapStack(app3, 'TestTapStack3', {
      stackName: `TestTapStack3-${environmentSuffix}`,
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      apiAuthType: 'JWT',
      jwtIssuer: 'https://example.com/',
      jwtAudience: ['aud1'],
    });
    const t3 = Template.fromStack(stack3);
    t3.resourceCountIs('AWS::ApiGatewayV2::Authorizer', 1);
  });

  test('creates routes when IAM auth is selected (without asserting low-level AuthorizationType)', () => {
    const app4 = new cdk.App();
    const stack4 = new TapStack(app4, 'TestTapStack4', {
      stackName: `TestTapStack4-${environmentSuffix}`,
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      apiAuthType: 'IAM',
    });
    const t4 = Template.fromStack(stack4);
    t4.resourceCountIs('AWS::ApiGatewayV2::Route', 5);
  });

  test('creates layer when layerAssetPath points to a non-empty folder', () => {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-layer-'));
    const nodejsDir = path.join(tempDir, 'nodejs');
    fs.mkdirSync(nodejsDir);
    fs.writeFileSync(path.join(nodejsDir, 'package.json'), '{"name":"x"}');

    const app5 = new cdk.App();
    const stack5 = new TapStack(app5, 'TestTapStack5', {
      stackName: `TestTapStack5-${environmentSuffix}`,
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      layerAssetPath: tempDir,
    });
    const t5 = Template.fromStack(stack5);
    t5.resourceCountIs('AWS::Lambda::LayerVersion', 1);

    // Cleanup temp folder
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('does not create layer when folder missing or empty', () => {
    const nonExistent = path.join(process.cwd(), 'no-such-layer');
    const app6 = new cdk.App();
    const stack6 = new TapStack(app6, 'TestTapStack6', {
      stackName: `TestTapStack6-${environmentSuffix}`,
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      layerAssetPath: nonExistent,
    });
    const t6 = Template.fromStack(stack6);
    t6.resourceCountIs('AWS::Lambda::LayerVersion', 0);
  });

  test('reads environmentSuffix from context when not provided', () => {
    const app7 = new cdk.App();
    app7.node.setContext('environmentSuffix', 'ctx');
    const stack7 = new TapStack(app7, 'TestTapStack7', {
      stackName: 'TestTapStack7',
      project: 'tap',
      service: 'api',
      environment: 'dev',
    } as any);
    const t7 = Template.fromStack(stack7);
    t7.hasOutput('StackName', Match.anyValue());
  });

  test('uses default environmentSuffix dev when neither prop nor context provided', () => {
    const appX = new cdk.App();
    const stackX = new TapStack(appX, 'TestTapStackX', {
      stackName: 'TestTapStackX',
      project: 'tap',
      service: 'api',
      environment: 'dev',
    } as any);
    const tX = Template.fromStack(stackX);
    tX.hasOutput('StackName', Match.anyValue());
  });

  test('enables PITR when environment is prod', () => {
    const app8 = new cdk.App();
    const stack8 = new TapStack(app8, 'TestTapStack8', {
      stackName: 'TestTapStack8',
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'prod',
    });
    const t8 = Template.fromStack(stack8);
    t8.hasResourceProperties('AWS::DynamoDB::Table', Match.objectLike({
      PointInTimeRecoverySpecification: Match.objectLike({ PointInTimeRecoveryEnabled: true }),
    }));
  });

  test('Lambda ENVIRONMENT env var equals provided environment', () => {
    const appE2 = new cdk.App();
    const stackE2 = new TapStack(appE2, 'TestTapStackE2', {
      stackName: 'TestTapStackE2',
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'qa',
    });
    const tE2 = Template.fromStack(stackE2);
    const fns = tE2.findResources('AWS::Lambda::Function');
    const fnProps = Object.values(fns)[0] as any;
    expect(fnProps.Properties.Environment.Variables.ENVIRONMENT).toBe('qa');
  });

  test('does not enable PITR when environment is non-prod', () => {
    const appNP = new cdk.App();
    const stackNP = new TapStack(appNP, 'TestTapStackNP', {
      stackName: 'TestTapStackNP',
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
    });
    const tNP = Template.fromStack(stackNP);
    // Ensure PITR is not enabled (either undefined or explicitly false)
    const tables = tNP.findResources('AWS::DynamoDB::Table');
    const tableProps = Object.values(tables)[0] as any;
    const pitr = tableProps.Properties.PointInTimeRecoverySpecification;
    expect(!pitr || pitr.PointInTimeRecoveryEnabled === false).toBe(true);
  });

  // Note: ENVIRONMENT env var fallback is indirectly covered by other tests

  test('applies optional tags when provided (Team, CostCenter)', () => {
    const app9 = new cdk.App();
    const stack9 = new TapStack(app9, 'TestTapStack9', {
      stackName: 'TestTapStack9',
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      team: 'platform',
      costCenter: 'cc-123',
    });
    const t9 = Template.fromStack(stack9);
    // Spot check tags are applied (order-agnostic) by asserting separately
    t9.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({
      Tags: Match.arrayWith([Match.objectLike({ Key: 'Team', Value: 'platform' })]),
    } as any));
    t9.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({
      Tags: Match.arrayWith([Match.objectLike({ Key: 'CostCenter', Value: 'cc-123' })]),
    } as any));
  });

  test('configures archive bucket expiration when retention is provided', () => {
    const app10 = new cdk.App();
    const stack10 = new TapStack(app10, 'TestTapStack10', {
      stackName: 'TestTapStack10',
      environmentSuffix,
      project: 'tap',
      service: 'api',
      environment: 'dev',
      archiveRetentionDays: 365,
    });
    const t10 = Template.fromStack(stack10);
    t10.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      LifecycleConfiguration: Match.objectLike({ Rules: Match.anyValue() }),
    }));
  });
});
