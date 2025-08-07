import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  test('TapStack instantiates with default props', () => {
    const stack = new TapStack(app, 'TapDefault');
    expect(stack).toBeDefined();
  });

  test('TapStack instantiates with custom props', () => {
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
    expect(stack).toBeDefined();
  });

  test('VPC and subnets are created', () => {
    const stack = new TapStack(app, 'VpcTest');
    const resources = Testing.fullSynth(stack).resources;

    expect(resources.find(r => r.type === 'aws_vpc')).toBeDefined();
    expect(resources.filter(r => r.type === 'aws_subnet').length).toBeGreaterThanOrEqual(6);
    expect(resources.find(r => r.type === 'aws_internet_gateway')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_flow_log')).toBeDefined();
  });

  test('IAM resources are created', () => {
    const stack = new TapStack(app, 'IamTest');
    const resources = Testing.fullSynth(stack).resources;

    expect(resources.find(r => r.type === 'aws_iam_role')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_iam_instance_profile')).toBeDefined();
  });

  test('EC2 and security group are created', () => {
    const stack = new TapStack(app, 'Ec2Test');
    const resources = Testing.fullSynth(stack).resources;

    expect(resources.find(r => r.type === 'aws_instance')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_security_group')).toBeDefined();
  });

  test('S3 buckets and encryption are created', () => {
    const stack = new TapStack(app, 'S3Test');
    const resources = Testing.fullSynth(stack).resources;

    expect(resources.filter(r => r.type === 'aws_s3_bucket').length).toBeGreaterThanOrEqual(1);
    expect(
      resources.filter(
        r => r.type === 'aws_s3_bucket_server_side_encryption_configuration'
      ).length
    ).toBeGreaterThanOrEqual(1);
  });

  test('CloudWatch dashboard and alarms are created', () => {
    const stack = new TapStack(app, 'CloudwatchTest');
    const resources = Testing.fullSynth(stack).resources;

    expect(resources.find(r => r.type === 'aws_cloudwatch_dashboard')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_cloudwatch_metric_alarm')).toBeDefined();
    expect(resources.find(r => r.type === 'aws_sns_topic')).toBeDefined();
  });
});
