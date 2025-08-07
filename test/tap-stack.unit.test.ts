import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Helper: flatten CDKTF synthesized "resource" map into a list of { type, ... }
function getSynthResources(stack: any) {
  const synth = Testing.fullSynth(stack);
  // synth.resource: { [resourceType: string]: { [resourceName: string]: {...} } }
  const resourceBlock = synth.resource || {};
  const resources: Array<{ type: string }> = [];
  Object.entries(resourceBlock).forEach(([type, instances]) => {
    Object.keys(instances).forEach(() => {
      resources.push({ type });
    });
  });
  return resources;
}

describe('TapStack', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  it('should synth without errors and define the stack', () => {
    const stack = new TapStack(app, 'TestStack');
    expect(stack).toBeDefined();
  });

  it('should create a VPC and at least 3 public/private/database subnets', () => {
    const stack = new TapStack(app, 'VpcStack');
    const resources = getSynthResources(stack);

    expect(resources.some(r => r.type === 'aws_vpc')).toBeTruthy();
    expect(
      resources.filter(r => r.type === 'aws_subnet').length
    ).toBeGreaterThanOrEqual(9);
    expect(resources.some(r => r.type === 'aws_internet_gateway')).toBeTruthy();
    expect(resources.some(r => r.type === 'aws_nat_gateway')).toBeTruthy();
    expect(resources.some(r => r.type === 'aws_flow_log')).toBeTruthy();
  });

  it('should create required IAM roles and instance profiles', () => {
    const stack = new TapStack(app, 'IamStack');
    const resources = getSynthResources(stack);

    expect(resources.some(r => r.type === 'aws_iam_role')).toBeTruthy();
    expect(
      resources.some(r => r.type === 'aws_iam_instance_profile')
    ).toBeTruthy();
  });

  it('should create EC2 instance and security group', () => {
    const stack = new TapStack(app, 'Ec2Stack');
    const resources = getSynthResources(stack);

    expect(resources.some(r => r.type === 'aws_instance')).toBeTruthy();
    expect(resources.some(r => r.type === 'aws_security_group')).toBeTruthy();
  });

  it('should create S3 buckets with encryption and access logs', () => {
    const stack = new TapStack(app, 'S3Stack');
    const resources = getSynthResources(stack);

    expect(
      resources.filter(r => r.type === 'aws_s3_bucket').length
    ).toBeGreaterThanOrEqual(2);
    expect(
      resources.some(
        r => r.type === 'aws_s3_bucket_server_side_encryption_configuration'
      )
    ).toBeTruthy();
    expect(
      resources.some(r => r.type === 'aws_s3_bucket_logging')
    ).toBeTruthy();
  });

  it('should create CloudWatch dashboard, alarms, SNS topic, and log group', () => {
    const stack = new TapStack(app, 'CloudwatchStack');
    const resources = getSynthResources(stack);

    expect(
      resources.some(r => r.type === 'aws_cloudwatch_dashboard')
    ).toBeTruthy();
    expect(
      resources.some(r => r.type === 'aws_cloudwatch_metric_alarm')
    ).toBeTruthy();
    expect(resources.some(r => r.type === 'aws_sns_topic')).toBeTruthy();
    expect(
      resources.some(r => r.type === 'aws_cloudwatch_log_group')
    ).toBeTruthy();
  });
});
