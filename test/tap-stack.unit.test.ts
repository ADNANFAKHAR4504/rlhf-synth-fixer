import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const baseContext = {
  serviceName: 'unit-platform',
  costCenter: 'QA-COST',
  deploymentDate: '2025-01-01',
  kmsAliasBase: 'alias/unit-platform',
  lambdaFamilies: ['processor', 'ingester'],
};

const synthStack = (overrides?: Record<string, unknown>) => {
  const app = new cdk.App();
  app.node.setContext('tapConfig', { ...baseContext, ...(overrides || {}) });
  const stack = new TapStack(app, 'TestTapStack', {
    environmentSuffix: 'unit',
  });
  const template = Template.fromStack(stack);
  return { stack, template };
};

describe('TapStack', () => {
  test('creates fully wired environments for prod, staging, and dev', () => {
    const { template } = synthStack();
    expect(Object.keys(template.findResources('AWS::EC2::VPC')).length).toBe(3);
    expect(
      Object.keys(template.findResources('AWS::RDS::DBCluster')).length
    ).toBe(3);

    const buckets = template.findResources('AWS::S3::Bucket');
    const replicationBuckets = Object.values(buckets).filter(
      (bucket: any) => bucket.Properties?.ReplicationConfiguration
    );
    expect(replicationBuckets.length).toBeGreaterThanOrEqual(2);
  });

  test('adds API Gateway stage variables with environment metadata', () => {
    const { template } = synthStack();
    template.hasResourceProperties(
      'AWS::ApiGateway::Stage',
      Match.objectLike({
        Variables: Match.objectLike({
          environment: Match.anyValue(),
          bucketName: Match.anyValue(),
          kmsAlias: Match.anyValue(),
        }),
      })
    );
  });

  test('exposes bucket, database, and API outputs for each environment', () => {
    const { template } = synthStack();
    ['Prod', 'Staging', 'Dev'].forEach(prefix => {
      template.hasOutput(`${prefix}DataBucketName`, Match.objectLike({}));
      template.hasOutput(`${prefix}AuroraClusterArn`, Match.objectLike({}));
      template.hasOutput(`${prefix}ApiEndpoint`, Match.objectLike({}));
    });
  });

  test('fails fast when configuration violates schema requirements', () => {
    const app = new cdk.App();
    app.node.setContext('tapConfig', {
      ...baseContext,
      serviceName: 'INVALID NAME!',
    });
    expect(
      () => new TapStack(app, 'InvalidStack', { environmentSuffix: 'bad' })
    ).toThrow(/serviceName/);
  });
});
