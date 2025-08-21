import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { NetworkingConstruct } from '../lib/constructs/networking';
import { SecurityConstruct } from '../lib/constructs/security';
import { StorageConstruct } from '../lib/constructs/storage';
import { DatabaseConstruct } from '../lib/constructs/database';
import { ComputeConstruct } from '../lib/constructs/compute';
import { CdnConstruct } from '../lib/constructs/cdn';
import { MonitoringConstruct } from '../lib/constructs/monitoring';
import { config } from '../lib/config/variables';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('terraform');
      expect(synthesized).toContain('provider');
      expect(synthesized).toContain('aws');
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('"region": "us-east-1"');
    });

    test('TapStack configures AWS provider correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "us-west-2"');
      expect(synthesized).toContain('"source": "aws"');
    });

    test('TapStack configures S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        stateBucket: 'my-terraform-state',
        stateBucketRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"s3": {');
      expect(synthesized).toContain('"bucket": "my-terraform-state"');
      expect(synthesized).toContain('"region": "us-east-1"');
      expect(synthesized).toContain('"encrypt": true');
    });
  });

  describe('Infrastructure Components', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('includes VPC and networking resources', () => {
      expect(synthesized).toContain('"aws_vpc"');
      expect(synthesized).toContain('"aws_subnet"');
      expect(synthesized).toContain('"aws_internet_gateway"');
      expect(synthesized).toContain('"aws_nat_gateway"');
      expect(synthesized).toContain('"aws_route_table"');
    });

    test('includes security groups and IAM resources', () => {
      expect(synthesized).toContain('"aws_security_group"');
      expect(synthesized).toContain('"aws_iam_role"');
      expect(synthesized).toContain('"aws_iam_instance_profile"');
      expect(synthesized).toContain('"aws_ssm_parameter"');
    });

    test('includes RDS database resources', () => {
      expect(synthesized).toContain('"aws_db_instance"');
      expect(synthesized).toContain('"aws_db_subnet_group"');
      expect(synthesized).toContain('"aws_db_parameter_group"');
    });

    test('includes compute resources (ALB, ASG, Launch Template)', () => {
      expect(synthesized).toContain('"aws_lb"');
      expect(synthesized).toContain('"aws_lb_target_group"');
      expect(synthesized).toContain('"aws_autoscaling_group"');
      expect(synthesized).toContain('"aws_launch_template"');
    });

    test('includes S3 storage resources', () => {
      expect(synthesized).toContain('"aws_s3_bucket"');
      expect(synthesized).toContain('"aws_s3_bucket_server_side_encryption_configuration"');
      expect(synthesized).toContain('"aws_s3_bucket_lifecycle_configuration"');
    });

    test('includes CloudFront CDN resources', () => {
      expect(synthesized).toContain('"aws_cloudfront_distribution"');
    });

    test('includes monitoring resources', () => {
      expect(synthesized).toContain('"aws_cloudwatch_metric_alarm"');
      expect(synthesized).toContain('"aws_sns_topic"');
      expect(synthesized).toContain('"aws_cloudwatch_dashboard"');
    });

    test('includes WAF security resources', () => {
      expect(synthesized).toContain('"aws_wafv2_web_acl"');
      expect(synthesized).toContain('"aws_wafv2_ip_set"');
    });
  });

  describe('Configuration and Tagging', () => {
    test('applies consistent tagging across resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestTagStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(config.tags.Project);
      expect(synthesized).toContain(config.tags.Environment);
      expect(synthesized).toContain(config.tags.Owner);
      expect(synthesized).toContain(config.tags.ManagedBy);
    });

    test('uses correct project naming convention', () => {
      app = new App();
      stack = new TapStack(app, 'TestNamingStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(config.projectName);
      expect(synthesized).toContain(`${config.projectName}-vpc`);
      expect(synthesized).toContain(`${config.projectName}-alb`);
    });
  });

  describe('Resource Dependencies', () => {
    test('VPC is created before subnets', () => {
      app = new App();
      stack = new TapStack(app, 'TestDependencyStack');
      synthesized = Testing.synth(stack);

      const vpcIndex = synthesized.indexOf('"aws_vpc"');
      const subnetIndex = synthesized.indexOf('"aws_subnet"');
      
      expect(vpcIndex).toBeGreaterThan(-1);
      expect(subnetIndex).toBeGreaterThan(-1);
      expect(subnetIndex).toBeLessThan(vpcIndex);
    });

    test('security groups are created before compute resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestSecurityStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('security_groups');
      expect(synthesized).toContain('source_security_group_id');
    });
  });

  describe('High Availability Configuration', () => {
    test('creates resources across multiple availability zones', () => {
      app = new App();
      stack = new TapStack(app, 'TestHAStack');
      synthesized = Testing.synth(stack);

      config.availabilityZones.forEach(az => {
        expect(synthesized).toContain(az);
      });
    });

    test('creates NAT gateways in each public subnet', () => {
      app = new App();
      stack = new TapStack(app, 'TestNATStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_nat_gateway"');
      expect(synthesized).toContain('"aws_eip"');
    });
  });
});

describe('Individual Construct Tests', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  test('NetworkingConstruct creates required VPC resources', () => {
    const testStack = new TapStack(app, 'TestNetworkStack');
    const networking = new NetworkingConstruct(testStack, 'TestNetworking', {
      config,
    });

    expect(networking.vpc).toBeDefined();
    expect(networking.publicSubnets).toHaveLength(config.publicSubnetCidrs.length);
    expect(networking.privateSubnets).toHaveLength(config.privateSubnetCidrs.length);
    expect(networking.dbSubnets).toHaveLength(config.dbSubnetCidrs.length);
    expect(networking.natGateways).toHaveLength(1);
  });

  test('SecurityConstruct creates required security resources', () => {
    const testStack = new TapStack(app, 'TestSecurityStack');
    const networking = new NetworkingConstruct(testStack, 'TestNetworking', {
      config,
    });
    const security = new SecurityConstruct(testStack, 'TestSecurity', {
      config,
      vpcId: networking.vpc.id,
    });

    expect(security.albSecurityGroup).toBeDefined();
    expect(security.ec2SecurityGroup).toBeDefined();
    expect(security.rdsSecurityGroup).toBeDefined();
    expect(security.ec2Role).toBeDefined();
    expect(security.ec2InstanceProfile).toBeDefined();
    expect(security.webAcl).toBeDefined();
  });

  test('StorageConstruct creates required S3 buckets', () => {
    const testStack = new TapStack(app, 'TestStorageStack');
    const storage = new StorageConstruct(testStack, 'TestStorage', {
      config,
    });

    expect(storage.logsBucket).toBeDefined();
    expect(storage.accessLogsBucket).toBeDefined();
  });

  test('DatabaseConstruct creates RDS instance with proper configuration', () => {
    const testStack = new TapStack(app, 'TestDatabaseStack');
    const networking = new NetworkingConstruct(testStack, 'TestNetworking', {
      config,
    });
    const security = new SecurityConstruct(testStack, 'TestSecurity', {
      config,
      vpcId: networking.vpc.id,
    });
    const database = new DatabaseConstruct(testStack, 'TestDatabase', {
      config,
      dbSubnetIds: networking.dbSubnets.map(subnet => subnet.id),
      securityGroupIds: [security.rdsSecurityGroup.id],
    });

    expect(database.dbInstance).toBeDefined();
    expect(database.dbSubnetGroup).toBeDefined();
  });

  test('ComputeConstruct creates ALB and ASG resources', () => {
    const testStack = new TapStack(app, 'TestComputeStack');
    const networking = new NetworkingConstruct(testStack, 'TestNetworking', {
      config,
    });
    const security = new SecurityConstruct(testStack, 'TestSecurity', {
      config,
      vpcId: networking.vpc.id,
    });
    const storage = new StorageConstruct(testStack, 'TestStorage', {
      config,
    });
    const compute = new ComputeConstruct(testStack, 'TestCompute', {
      config,
      vpcId: networking.vpc.id,
      publicSubnetIds: networking.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: networking.privateSubnets.map(subnet => subnet.id),
      albSecurityGroupId: security.albSecurityGroup.id,
      ec2SecurityGroupId: security.ec2SecurityGroup.id,
      instanceProfileName: security.ec2InstanceProfile.name,
      webAclArn: security.webAcl.arn,
      accessLogsBucket: storage.accessLogsBucket.bucket,
      accessLogsBucketPolicy: storage.accessLogsBucketPolicy,
    });

    expect(compute.launchTemplate).toBeDefined();
    expect(compute.autoScalingGroup).toBeDefined();
    expect(compute.applicationLoadBalancer).toBeDefined();
    expect(compute.targetGroup).toBeDefined();
  });
});
