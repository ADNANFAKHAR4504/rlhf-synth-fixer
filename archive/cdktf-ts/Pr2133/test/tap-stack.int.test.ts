import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';

describe('Secure WebApp Stack Integration Checks', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'test-integration-stack');
    synthesized = Testing.synth(stack);
  });

  test('should create a least-privilege IAM policy for EC2', () => {
    const synthesizedJson = JSON.parse(synthesized);
    const iamPolicy = synthesizedJson.resource.aws_iam_policy.ec2Policy;
    const policyDocument = JSON.parse(iamPolicy.policy);

    const policyStatement = policyDocument.Statement[0];
    expect(policyStatement.Action).not.toContain('*');
    expect(policyStatement.Action).toEqual(['s3:PutObject']);
    expect(policyStatement.Resource).toContain('${aws_s3_bucket.logBucket.arn}/*');
  });

  test('should configure a 90-day lifecycle rule for the S3 bucket', () => {
    Testing.toHaveResourceWithProperties(synthesized, S3BucketLifecycleConfiguration.tfResourceType, {
      rule: [{
        id: 'log-retention',
        status: 'Enabled',
        expiration: {
          days: 90,
        },
      }],
    });
  });

  test('should create CloudWatch alarms for both EC2 and RDS', () => {
    Testing.toHaveResourceWithProperties(synthesized, CloudwatchMetricAlarm.tfResourceType, {
      namespace: 'AWS/EC2',
      metric_name: 'CPUUtilization',
    });

    Testing.toHaveResourceWithProperties(synthesized, CloudwatchMetricAlarm.tfResourceType, {
      namespace: 'AWS/RDS',
      metric_name: 'CPUUtilization',
    });
  });

  test('should place the RDS instance in a private subnet', () => {
    const synthesizedJson = JSON.parse(synthesized);
    const dbSubnetGroup = synthesizedJson.resource.aws_db_subnet_group.dbSubnetGroup;

    // Create tokens for both new private subnets
    const privateSubnetAToken = '${aws_subnet.privateSubnetA.id}';
    const privateSubnetBToken = '${aws_subnet.privateSubnetB.id}';

    // Check that the subnet group contains both new subnets
    expect(dbSubnetGroup.subnet_ids).toContain(privateSubnetAToken);
    expect(dbSubnetGroup.subnet_ids).toContain(privateSubnetBToken);
  });

  test('should create an SSM Parameter for the SSH IP address', () => {
    Testing.toHaveResourceWithProperties(synthesized, SsmParameter.tfResourceType, {
      type: 'String',
      value: '1.2.3.4/32',
    });
  });

  test('should create a secret in Secrets Manager for the DB password', () => {
    Testing.toHaveResource(synthesized, SecretsmanagerSecret.tfResourceType);
  });
});