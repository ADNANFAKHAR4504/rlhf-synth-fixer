import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const environmentSuffix = 'dev';

  const synth = () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    return Template.fromStack(stack);
  };

  test('creates DynamoDB table with TTL, PAY_PER_REQUEST and PITR', () => {
    const template = synth();
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
      TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true },
      KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: 'configId' }),
        Match.objectLike({ AttributeName: 'version' }),
      ]),
      TableName: `${environmentSuffix}-config-tracking`,
    });
  });

  test('creates S3 bucket with versioning, encryption, lifecycle and auto-delete', () => {
    const template = synth();
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.anyValue(),
      LifecycleConfiguration: Match.anyValue(),
    });
    template.hasResource('Custom::S3AutoDeleteObjects', Match.anyValue());
  });

  test('creates ARM64 Node.js 20 Lambdas for drift, approval, promotion, compliance, rollback', () => {
    const template = synth();
    const fns = template.findResources('AWS::Lambda::Function');
    const ourFns = Object.entries(fns).filter(
      ([logicalId]) => !logicalId.includes('CustomS3AutoDeleteObjects')
    );
    expect(ourFns.length).toBeGreaterThanOrEqual(5);
    ourFns.forEach(([, fn]) => {
      expect(fn.Properties.Runtime).toBe('nodejs20.x');
      expect(fn.Properties.Architectures).toEqual(['arm64']);
    });
  });

  test('creates EventBridge rules for drift and rollback', () => {
    const template = synth();
    template.resourceCountIs('AWS::Events::Rule', 2);
  });

  test('creates SNS topic and subscription to approval handler', () => {
    const template = synth();
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::SNS::Subscription', 1);
  });

  test('creates CodeBuild project sourced from ECR image, with permissions', () => {
    const template = synth();
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.resourceCountIs('AWS::CodeBuild::Project', 1);
  });

  test('exports stack outputs with environment-prefixed names', () => {
    const template = synth();
    template.hasOutput('ConfigTableName', Match.objectLike({
      Export: Match.objectLike({ Name: `${environmentSuffix}-ConfigTableName` }),
    }));
    template.hasOutput('ReportsBucketName', Match.objectLike({
      Export: Match.objectLike({ Name: `${environmentSuffix}-ReportsBucketName` }),
    }));
    template.hasOutput('ApprovalTopicArn', Match.objectLike({
      Export: Match.objectLike({ Name: `${environmentSuffix}-ApprovalTopicArn` }),
    }));
  });
});
