test('VPC is created with correct properties', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const vpc = synthesized.resource.aws_vpc['main-vpc'];
  expect(vpc.cidrBlock).toBe('10.0.0.0/16');
  expect(vpc.enableDnsHostnames).toBe(true);
});

test('Internet Gateway is created and associated', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const igw = synthesized.resource.aws_internet_gateway['main-igw'];
  expect(igw.vpcId).toBeDefined();
});

test('DbSubnetGroup is created with correct subnets', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const dbSubnetGroup = synthesized.resource.aws_db_subnet_group['db-subnet-group'];
  expect(dbSubnetGroup.subnetIds.length).toBe(2);
});

test('Elastic Beanstalk application has correct name and description', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const ebApp = synthesized.resource.aws_elastic_beanstalk_application['webapp'];
  expect(ebApp.name).toMatch(/webapp-/);
  expect(ebApp.description).toBe('Web application with failover');
});

test('Route53 zone has correct name', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const zone = synthesized.resource.aws_route53_zone['hosted-zone'];
  expect(zone.name).toBe('mytestapp-demo.com');
});

test('S3 bucket has correct name', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const bucket = synthesized.resource.aws_s3_bucket['failover-bucket'];
  expect(bucket.bucket).toMatch(/failover-bucket-/);
});

test('SNS topic has correct name', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const topic = synthesized.resource.aws_sns_topic['alert-topic'];
  expect(topic.name).toMatch(/alerts-/);
});
test('Creates public subnets with correct properties', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const publicSubnet1 = synthesized.resource.aws_subnet['public-subnet-1'];
  const publicSubnet2 = synthesized.resource.aws_subnet['public-subnet-2'];
  expect(publicSubnet1.cidrBlock).toBe('10.0.1.0/24');
  expect(publicSubnet1.mapPublicIpOnLaunch).toBe(true);
  expect(publicSubnet2.cidrBlock).toBe('10.0.2.0/24');
  expect(publicSubnet2.mapPublicIpOnLaunch).toBe(true);
});

test('Creates private subnets with correct properties', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const privateSubnet1 = synthesized.resource.aws_subnet['private-subnet-1'];
  const privateSubnet2 = synthesized.resource.aws_subnet['private-subnet-2'];
  expect(privateSubnet1.cidrBlock).toBe('10.0.3.0/24');
  expect(privateSubnet2.cidrBlock).toBe('10.0.4.0/24');
  expect(privateSubnet1.mapPublicIpOnLaunch).toBeUndefined();
  expect(privateSubnet2.mapPublicIpOnLaunch).toBeUndefined();
});

test('Security groups have correct ingress/egress', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const ebSg = synthesized.resource.aws_security_group['eb-sg'];
  expect(ebSg.ingress[0].fromPort).toBe(80);
  expect(ebSg.ingress[0].toPort).toBe(80);
  expect(ebSg.ingress[0].cidrBlocks).toContain('0.0.0.0/0');
  expect(ebSg.egress[0].protocol).toBe('-1');
  expect(ebSg.egress[0].cidrBlocks).toContain('0.0.0.0/0');
});

test('RDS instance is created with correct engine and version', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  const rds = synthesized.resource.aws_db_instance['postgres-db'];
  expect(rds.engine).toBe('postgres');
  expect(rds.engineVersion).toBe('15.13');
  expect(rds.multiAz).toBe(true);
  expect(rds.storageEncrypted).toBe(true);
});

test('Elastic Beanstalk application is created', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  expect(synthesized.resource.aws_elastic_beanstalk_application['webapp']).toBeDefined();
});

test('Route53 zone and S3 bucket are created', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  expect(synthesized.resource.aws_route53_zone['hosted-zone']).toBeDefined();
  expect(synthesized.resource.aws_s3_bucket['failover-bucket']).toBeDefined();
});

test('SNS topic is created', () => {
  const app = new App();
  const stack = new TapStack(app, 'TestStack', { env: { region: 'us-east-2' } });
  const synthesized = JSON.parse(Testing.synth(stack));
  expect(synthesized.resource.aws_sns_topic['alert-topic']).toBeDefined();
});
import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack CDKTF Tests', () => {
  test('Stack synthesis works', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      env: { region: 'us-east-2' }
    });

    const synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized).toBeDefined();
    expect(synthesized.resource).toBeDefined();
    expect(synthesized.resource.aws_vpc).toBeDefined();
  });

  test('Stack synthesis with custom config', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStackCustom', {
      env: { region: 'us-east-2' },
      environmentSuffix: 'test',
      stateBucket: 'custom-bucket',
      stateBucketRegion: 'us-east-2',
      defaultTags: { tags: { Project: 'TestProject' } }
    });

    const synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized).toBeDefined();
    expect(synthesized.resource).toBeDefined();
    expect(synthesized.resource.aws_vpc).toBeDefined();
    // Check that tags are set
    expect(
      synthesized.resource.aws_vpc['main-vpc'].tags.Name
    ).toMatch(/us-east-2-tap-test-vpc-/);
  });

  test('Stack synthesis with missing optional config', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStackMissingOptional', {
      env: { region: 'us-east-2' }
      // No optional config
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.resource.aws_vpc['main-vpc'].cidrBlock).toBe('10.0.0.0/16');
  });

  test('Stack synthesis with different region', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStackRegion', {
      env: { region: 'us-west-2' },
      environmentSuffix: 'prod',
      defaultTags: { tags: { Owner: 'DevOps' } }
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.resource.aws_vpc['main-vpc'].tags.Name).toMatch(/us-west-2-tap-prod-vpc-/);
  });

  test('Stack synthesis with custom tags', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStackTags', {
      env: { region: 'us-east-2' },
      defaultTags: { tags: { Team: 'Platform', CostCenter: 'Engineering' } }
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.resource.aws_vpc['main-vpc'].tags.Name).toMatch(/us-east-2-tap-dev-vpc-/);
  });
});
