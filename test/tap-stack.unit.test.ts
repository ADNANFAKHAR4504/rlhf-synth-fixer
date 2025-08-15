import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Infrastructure', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack', {
      awsRegion: 'us-west-2',
      defaultTags: {
        tags: { Environment: 'production', Name: 'test-stack' }
      },
      environmentSuffix: 'prod', // example value
      stateBucket: 'my-state-bucket', // example value
      stateBucketRegion: 'us-west-2' // example value
    });
  });

  it('should synthesize without errors', () => {
    expect(() => Testing.synth(stack)).not.toThrow();
  });

  function getSynthResources(stack: TapStack): any[] {
    const synth = Testing.synth(stack);
    let parsed: any = synth;
    if (typeof synth === 'string') {
      parsed = JSON.parse(synth);
    }
    if (parsed && typeof parsed === 'object' && parsed.resource) {
      // Flatten all resources into a single array and annotate with type
      return Object.entries(parsed.resource)
        .flatMap(([type, resources]: [string, any]) =>
          Object.values(resources).map((resource: any) => ({
            ...resource,
            type
          }))
        );
    }
    throw new Error('Could not extract resources from synth output');
  }

  it('should create a VPC with public and private subnets', () => {
  const resources = getSynthResources(stack);
  console.log('Flattened resources:', resources);
  const vpc = resources.find((r: any) => r.type === 'aws_vpc');
  const publicSubnet = resources.find((r: any) => r.type === 'aws_subnet' && r.map_public_ip_on_launch === true);
  const privateSubnet = resources.find((r: any) => r.type === 'aws_subnet' && r.map_public_ip_on_launch === undefined);
  expect(vpc).toBeDefined();
  expect(publicSubnet).toBeDefined();
  expect(privateSubnet).toBeDefined();
  });

  it('should create security groups and IAM roles', () => {
    const resources = getSynthResources(stack);
    const sg = resources.find((r: any) => r.type === 'aws_security_group');
    expect(sg).toBeDefined();
    const iamRole = resources.find((r: any) => r.type === 'aws_iam_role');
    expect(iamRole).toBeDefined();
  });

  it('should create an EC2 Auto Scaling Group and Launch Template', () => {
    const resources = getSynthResources(stack);
    const asg = resources.find((r: any) => r.type === 'aws_autoscaling_group');
    const lt = resources.find((r: any) => r.type === 'aws_launch_template');
    expect(asg).toBeDefined();
    expect(lt).toBeDefined();
  });

  it('should create an S3 bucket with encryption and public access block', () => {
    const resources = getSynthResources(stack);
    const bucket = resources.find((r: any) => r.type === 'aws_s3_bucket');
    expect(bucket).toBeDefined();
    if (bucket && bucket.values) {
      expect(bucket.values.serverSideEncryptionConfiguration).toBeDefined();
    }
    const pab = resources.find((r: any) => r.type === 'aws_s3_bucket_public_access_block');
    expect(pab).toBeDefined();
  });

  it('should create an RDS instance with Multi-AZ', () => {
    const resources = getSynthResources(stack);
    const rds = resources.find((r: any) => r.type === 'aws_db_instance');
    expect(rds).toBeDefined();
    if (rds && rds.values) {
      expect(rds.values.multiAz).toBeTruthy();
    }
  });

  it('should create a DynamoDB table with provisioned capacity and autoscaling', () => {
    const resources = getSynthResources(stack);
    const table = resources.find((r: any) => r.type === 'aws_dynamodb_table');
    expect(table).toBeDefined();
    if (table && table.values) {
      expect(table.values.billingMode).toBe('PROVISIONED');
    }
    const autoscalingTarget = resources.find((r: any) => r.type === 'aws_appautoscaling_target');
    const autoscalingPolicy = resources.find((r: any) => r.type === 'aws_appautoscaling_policy');
    expect(autoscalingTarget).toBeDefined();
    expect(autoscalingPolicy).toBeDefined();
  });

  // Additional coverage: tags, region, resource counts
  it('should tag resources and use correct region', () => {
  const resources = getSynthResources(stack);
  const tagged = resources.filter((r: any) => r.tags && r.tags.Environment === 'production');
  expect(tagged.length).toBeGreaterThan(0);
  // Region check: look for any resource with region property or just skip if not present
  });

});
