import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TapStack instantiates with default props', () => {
    const app = new App();
    const stack = new TapStack(app, 'TapDefault');
    const synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toMatchSnapshot();
  });

  test('TapStack instantiates with custom props', () => {
    const app = new App();
    const stack = new TapStack(app, 'TapCustom', {
      environmentSuffix: 'prod',
      awsRegion: 'us-west-2',
      defaultTags: {
        tags: {
          Environment: 'prod',
          Owner: 'devops',
          Service: 'infra',
        },
      },
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('VPC and subnets are created', () => {
    const app = new App();
    const stack = new TapStack(app, 'VpcTest');
    const resources = Testing.synth(stack).resources;

    expect(resources.find(r => r.type === 'aws_vpc')).toBeDefined();
    expect(resources.filter(r => r.type === 'aws_subnet').length).toBeGreaterThanOrEqual(6);
    expect(resources.find(r => r.type === 'aws_internet_gateway')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_flow_log')).toBeDefined();
  });

  test('IAM resources are created', () => {
    const app = new App();
    const stack = new TapStack(app, 'IamTest');
    const resources = Testing.synth(stack).resources;

    expect(resources.find(r => r.type === 'aws_iam_role')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_iam_instance_profile')).toBeDefined();
  });

  test('EC2 instance and security group are created', () => {
    const app = new App();
    const stack = new TapStack(app, 'Ec2Test');
    const resources = Testing.synth(stack).resources;

    expect(resources.find(r => r.type === 'aws_instance')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_security_group')).toBeDefined();
  });

  test('S3 buckets and encryption config created', () => {
    const app = new App();
    const stack = new TapStack(app, 'S3Test');
    const resources = Testing.synth(stack).resources;

    expect(resources.filter(r => r.type === 'aws_s3_bucket').length).toBeGreaterThanOrEqual(2);
    expect(
      resources.filter(
        r => r.type === 'aws_s3_bucket_server_side_encryption_configuration'
      ).length
    ).toBeGreaterThanOrEqual(2);
    expect(
      resources.filter(r => r.type === 'aws_s3_bucket_public_access_block').length
    ).toBeGreaterThanOrEqual(2);
  });

  test('CloudWatch resources created', () => {
    const app = new App();
    const stack = new TapStack(app, 'CloudwatchTest');
    const resources = Testing.synth(stack).resources;

    expect(resources.find(r => r.type === 'aws_cloudwatch_dashboard')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_cloudwatch_metric_alarm')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_sns_topic')).toBeDefined();
  });
});
