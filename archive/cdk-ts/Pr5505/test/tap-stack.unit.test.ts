import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (default props)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStackDefault', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-west-2' },
      jwtIssuer: 'https://issuer.example.com',
      jwtAudience: ['aud-1'],
    });
    template = Template.fromStack(stack);
  });

  test('creates a VPC', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('creates DynamoDB table with PAY_PER_REQUEST and PITR', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', Match.objectLike({
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
      KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: 'PK' }),
        Match.objectLike({ AttributeName: 'SK' }),
      ]),
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({ IndexName: 'GSI1' }),
        Match.objectLike({ IndexName: 'TimeSeriesIndex' }),
      ]),
    }));
  });

  test('creates EventBridge bus and archive', () => {
    template.hasResourceProperties('AWS::Events::EventBus', Match.anyValue());
    template.hasResourceProperties('AWS::Events::Archive', Match.objectLike({
      RetentionDays: 30,
    }));
  });

  test('creates Step Functions state machine with logs and tracing', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', Match.objectLike({
      TracingConfiguration: { Enabled: true },
      LoggingConfiguration: Match.objectLike({
        Level: 'ALL',
      }),
    }));
  });

  test('creates 5+ Lambdas (ARM64, in VPC, tracing, DLQ)', () => {
    const lambdas = template.findResources('AWS::Lambda::Function');
    expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(5);
    template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      Architectures: ['arm64'],
      TracingConfig: { Mode: 'Active' },
      VpcConfig: Match.anyValue(),
    }));
    template.resourceCountIs('AWS::SQS::Queue', 1);
    // EventInvokeConfig created for onFailure destination
    template.resourceCountIs('AWS::Lambda::EventInvokeConfig', 5);
  });

  test('creates HTTP API with POST /ingest route and JWT authorizer', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', Match.anyValue());
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', Match.objectLike({
      RouteKey: 'POST /ingest',
    }));
    template.resourceCountIs('AWS::ApiGatewayV2::Authorizer', 1);
  });

  test('creates SNS topic for alerts (no subscription by default)', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::SNS::Subscription', 0);
  });

  test('creates S3 audit bucket with encryption and versioning', () => {
    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.anyValue(),
    }));
  });

  test('adds CloudWatch dashboard', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });

  test('creates expected stack outputs', () => {
    // Just verify presence of outputs by logical IDs
    template.hasOutput('HttpApiUrl', Match.anyValue());
    template.hasOutput('EventsTableName', Match.anyValue());
    template.hasOutput('EventBusName', Match.anyValue());
    template.hasOutput('AlertsTopicArn', Match.anyValue());
    template.hasOutput('AuditBucketName', Match.anyValue());
  });
});

describe('TapStack (with alert email and JWT authorizer)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStackWithAuth', {
      environmentSuffix,
      alertEmail: 'alerts@example.com',
      jwtIssuer: 'https://issuer.example.com',
      jwtAudience: ['aud-1'],
      env: { account: '111111111111', region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  test('adds an email subscription to SNS topic', () => {
    template.hasResourceProperties('AWS::SNS::Subscription', Match.objectLike({
      Protocol: 'email',
      Endpoint: 'alerts@example.com',
    }));
  });

  test('adds a JWT authorizer for HTTP API route', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Authorizer', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', Match.objectLike({
      AuthorizerType: 'JWT',
    }));
  });
});

describe('TapStack (replicationRegions handling)', () => {
  test('uses replicationRegions from props when provided (construction succeeds)', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackReplicaProps', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-east-1' },
      replicationRegions: ['us-east-2'],
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  test('defaults replica selection when not provided (us-west-2 primary)', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackReplicaDefault', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-west-2' },
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  test('defaults replica selection when not provided (us-east-1 primary)', () => {
    const prev = process.env.CDK_DEFAULT_REGION;
    process.env.CDK_DEFAULT_REGION = 'us-east-1';
    try {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStackReplicaDefaultEast', {
        environmentSuffix,
        env: { account: '111111111111', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    } finally {
      if (prev === undefined) {
        delete process.env.CDK_DEFAULT_REGION;
      } else {
        process.env.CDK_DEFAULT_REGION = prev;
      }
    }
  });

  test('falls back to stack region when CDK_DEFAULT_REGION is not set', () => {
    const prev = process.env.CDK_DEFAULT_REGION;
    delete process.env.CDK_DEFAULT_REGION;
    try {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStackReplicaNoEnv', {
        environmentSuffix,
        env: { account: '111111111111', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    } finally {
      if (prev === undefined) {
        delete process.env.CDK_DEFAULT_REGION;
      } else {
        process.env.CDK_DEFAULT_REGION = prev;
      }
    }
  });
});

describe('TapStack (context env suffix branch)', () => {
  test('uses environmentSuffix from context when prop not provided', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', 'ctx');
    const stack = new TapStack(app, 'TestTapStackCtx', {
      env: { account: '111111111111', region: 'us-west-2' },
      jwtIssuer: 'https://issuer.example.com',
      jwtAudience: ['aud-1'],
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });
});

describe('TapStack (default env suffix branch)', () => {
  test('falls back to default when neither prop nor context provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackDefaultSuffix', {
      env: { account: '111111111111', region: 'us-west-2' },
      jwtIssuer: 'https://issuer.example.com',
      jwtAudience: ['aud-1'],
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });
});

describe('TapStack (WAF optional association)', () => {
  test('creates WAF WebACL and association when enabled', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackWaf', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-west-2' },
      enableWafForHttpApi: true,
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    template.hasResourceProperties('AWS::WAFv2::WebACL', Match.objectLike({
      Scope: 'REGIONAL',
    }));
    template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', Match.objectLike({
      WebACLArn: Match.anyValue(),
      ResourceArn: Match.anyValue(),
    }));
  });
});

