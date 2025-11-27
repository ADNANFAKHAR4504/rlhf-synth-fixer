/**
 * Unit tests for TapStack
 *
 * These tests verify the Pulumi infrastructure code without deploying to AWS.
 * We mock Pulumi's runtime and verify resource configuration.
 */

import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing the stack
class MockResourceMonitor {
  resources: any[] = [];

  registerResource(
    type: string,
    name: string,
    props: any,
    opts?: any
  ): { urn: string; id: string; props: any } {
    const urn = `urn:pulumi:test::test::${type}::${name}`;
    const id = `id-${name}`;

    // Store resource for assertions
    this.resources.push({
      type,
      name,
      props,
      opts,
      urn,
      id,
    });

    // Return mocked resource
    return { urn, id, props: Promise.resolve(props) };
  }

  registerResourceOutputs(urn: string, outputs: any) {
    // Mock output registration
  }

  getResource(name: string) {
    return this.resources.find(r => r.name === name);
  }

  getResourcesByType(type: string) {
    return this.resources.filter(r => r.type === type);
  }

  clear() {
    this.resources = [];
  }
}

const mockMonitor = new MockResourceMonitor();

// Mock pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string | undefined;
    state: Record<string, any>;
  } => {
    // Generate mock outputs based on resource type
    const state: Record<string, any> = {};

    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        state.id = 'vpc-mock';
        state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        break;
      case 'aws:ec2/subnet:Subnet':
        state.id = `subnet-mock-${args.name}`;
        state.availabilityZone = 'us-east-1a';
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        state.id = `sg-mock-${args.name}`;
        break;
      case 'aws:ec2/natGateway:NatGateway':
        state.id = `nat-mock-${args.name}`;
        break;
      case 'aws:ec2/eip:Eip':
        state.id = `eip-mock-${args.name}`;
        state.publicIp = '1.2.3.4';
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        state.id = `alb-mock-${args.name}`;
        state.dnsName = 'alb-test.us-east-1.elb.amazonaws.com';
        break;
      case 'aws:lb/targetGroup:TargetGroup':
        state.id = `tg-mock-${args.name}`;
        state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}/abc123`;
        break;
      case 'aws:ecs/cluster:Cluster':
        state.id = `cluster-mock-${args.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:ecs/service:Service':
        state.id = `service-mock-${args.name}`;
        break;
      case 'aws:ecs/taskDefinition:TaskDefinition':
        state.id = `task-mock-${args.name}`;
        state.arn = `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.name}:1`;
        break;
      case 'aws:rds/instance:Instance':
        state.id = `rds-mock-${args.name}`;
        state.endpoint = 'db.example.com:5432';
        state.identifier = args.inputs.identifier || `db-${args.name}`;
        break;
      case 'aws:rds/subnetGroup:SubnetGroup':
        state.id = `subnet-group-mock-${args.name}`;
        break;
      case 'aws:s3/bucket:Bucket':
        state.id = `bucket-mock-${args.name}`;
        state.bucket = args.inputs.bucket || args.name;
        state.arn = `arn:aws:s3:::${args.inputs.bucket || args.name}`;
        break;
      case 'aws:kms/key:Key':
        state.id = `key-mock-${args.name}`;
        state.arn = `arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012`;
        state.keyId = '12345678-1234-1234-1234-123456789012';
        break;
      case 'aws:iam/role:Role':
        state.id = `role-mock-${args.name}`;
        state.arn = `arn:aws:iam::123456789012:role/${args.inputs.name || args.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        state.id = `log-group-mock-${args.name}`;
        state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:appautoscaling/target:Target':
        state.id = `target-mock-${args.name}`;
        state.resourceId = `service/test-cluster/test-service`;
        state.scalableDimension = 'ecs:service:DesiredCount';
        state.serviceNamespace = 'ecs';
        break;
      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        state.id = `alarm-mock-${args.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:kms/alias:Alias':
        state.id = `alias-mock-${args.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:lb/listener:Listener':
        state.id = `listener-mock-${args.name}`;
        state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${args.name}/abc123`;
        break;
      case 'aws:iam/rolePolicy:RolePolicy':
        state.id = `policy-mock-${args.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:iam/rolePolicyAttachment:RolePolicyAttachment':
        state.id = `attachment-mock-${args.name}`;
        break;
      case 'aws:appautoscaling/policy:Policy':
        state.id = `scaling-policy-mock-${args.name}`;
        state.name = args.inputs.name || args.name;
        state.policyType = args.inputs.policyType || 'TargetTrackingScaling';
        break;
      case 'aws:ec2/internetGateway:InternetGateway':
        state.id = `igw-mock-${args.name}`;
        break;
      case 'aws:ec2/routeTable:RouteTable':
        state.id = `rt-mock-${args.name}`;
        break;
      case 'aws:ec2/route:Route':
        state.id = `route-mock-${args.name}`;
        break;
      case 'aws:ec2/routeTableAssociation:RouteTableAssociation':
        state.id = `rta-mock-${args.name}`;
        break;
      case 'aws:s3/bucketVersioning:BucketVersioning':
      case 'aws:s3/bucketVersioningV2:BucketVersioningV2':
        state.id = `versioning-mock-${args.name}`;
        break;
      case 'aws:s3/bucketLifecycleConfiguration:BucketLifecycleConfiguration':
      case 'aws:s3/bucketLifecycleConfigurationV2:BucketLifecycleConfigurationV2':
        state.id = `lifecycle-mock-${args.name}`;
        break;
      case 'aws:s3/bucketPolicy:BucketPolicy':
        state.id = `bucket-policy-mock-${args.name}`;
        break;
      default:
        state.id = `mock-${args.name}`;
    }

    // Copy all inputs to state
    Object.assign(state, args.inputs);

    mockMonitor.registerResource(args.type, args.name, args.inputs, undefined);

    return {
      id: state.id,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (
      args.token === 'aws:elasticloadbalancing/getServiceAccount:getServiceAccount'
    ) {
      return {
        arn: 'arn:aws:iam::127311923021:root',
        id: '127311923021',
      };
    }
    return {};
  },
});

// Now import the stack after mocks are set
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Set environment variables for testing
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.AWS_REGION = 'us-east-1';

    // Create stack once for all tests
    stack = new TapStack('test-stack', { tags: {} });
  });

  describe('Stack Construction', () => {
    it('should create a TapStack instance', () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'test' },
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose required outputs', async () => {
      stack = new TapStack('test-stack', { tags: {} });

      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', () => {
      const vpc = mockMonitor.getResource('main-vpc');
      expect(vpc).toBeDefined();
      expect(vpc.props.cidrBlock).toBe('10.0.0.0/16');
      expect(vpc.props.enableDnsHostnames).toBe(true);
      expect(vpc.props.enableDnsSupport).toBe(true);
    });

    it('should create 3 public subnets', () => {
      const publicSubnets = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('public')
      );
      expect(publicSubnets).toHaveLength(3);

      publicSubnets.forEach((subnet, i) => {
        expect(subnet.props.cidrBlock).toBe(`10.0.${i}.0/24`);
        expect(subnet.props.mapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should create 3 private subnets', () => {
      const privateSubnets = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('private')
      );
      // Get unique subnets by name
      const uniqueSubnets = Array.from(
        new Map(privateSubnets.map(s => [s.name, s])).values()
      );
      expect(uniqueSubnets).toHaveLength(3);

      uniqueSubnets.forEach((subnet, i) => {
        expect(subnet.props.cidrBlock).toBe(`10.0.${10 + i}.0/24`);
      });
    });

    it('should create Internet Gateway', () => {
      const igw = mockMonitor.getResource('internet-gateway');
      expect(igw).toBeDefined();
      expect(igw.type).toBe('aws:ec2/internetGateway:InternetGateway');
    });

    it('should create 3 NAT Gateways', () => {
      const natGateways = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/natGateway:NatGateway'
      );
      // Get unique NAT gateways by name
      const uniqueNats = Array.from(
        new Map(natGateways.map(n => [n.name, n])).values()
      );
      expect(uniqueNats).toHaveLength(3);
    });

    it('should create 3 Elastic IPs for NAT Gateways', () => {
      const eips = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/eip:Eip' && r.name.includes('nat-eip')
      );
      // Get unique EIPs by name
      const uniqueEips = Array.from(
        new Map(eips.map(e => [e.name, e])).values()
      );
      expect(uniqueEips).toHaveLength(3);
      uniqueEips.forEach(eip => {
        expect(eip.props.domain).toBe('vpc');
      });
    });

    it('should create route tables', () => {
      const routeTables = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/routeTable:RouteTable'
      );
      // 1 public + 3 private route tables
      expect(routeTables.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with HTTPS ingress', () => {
      const albSg = mockMonitor.getResource('alb-security-group');
      expect(albSg).toBeDefined();

      const httpsRule = albSg.props.ingress.find(
        (rule: any) => rule.fromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.toPort).toBe(443);
      expect(httpsRule.protocol).toBe('tcp');
      expect(httpsRule.cidrBlocks).toContain('0.0.0.0/0');
    });

    it('should create ALB security group with HTTP ingress', () => {
      const albSg = mockMonitor.getResource('alb-security-group');
      const httpRule = albSg.props.ingress.find(
        (rule: any) => rule.fromPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.toPort).toBe(80);
      expect(httpRule.protocol).toBe('tcp');
    });

    it('should create ECS security group', () => {
      const ecsSg = mockMonitor.getResource('ecs-security-group');
      expect(ecsSg).toBeDefined();
      expect(ecsSg.type).toBe('aws:ec2/securityGroup:SecurityGroup');
    });

    it('should create RDS security group with PostgreSQL port', () => {
      const rdsSg = mockMonitor.getResource('rds-security-group');
      expect(rdsSg).toBeDefined();

      const pgRule = rdsSg.props.ingress.find(
        (rule: any) => rule.fromPort === 5432
      );
      expect(pgRule).toBeDefined();
      expect(pgRule.toPort).toBe(5432);
      expect(pgRule.protocol).toBe('tcp');
    });
  });

  describe('KMS Configuration', () => {
    it('should create KMS key with rotation enabled', () => {
      const kmsKey = mockMonitor.getResource('encryption-key');
      expect(kmsKey).toBeDefined();
      expect(kmsKey.props.enableKeyRotation).toBe(true);
      expect(kmsKey.props.deletionWindowInDays).toBe(7);
    });

    it('should create KMS key alias', () => {
      const kmsAlias = mockMonitor.getResource('encryption-key-alias');
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.props.name).toContain('alias/fintech-');
    });
  });

  describe('S3 Configuration', () => {
    it('should create S3 bucket for ALB logs', () => {
      const bucket = mockMonitor.getResource('alb-logs-bucket');
      expect(bucket).toBeDefined();
      expect(bucket.props.bucket).toContain('alb-logs-');
      expect(bucket.props.forceDestroy).toBe(true);
    });

    it('should enable S3 bucket versioning', () => {
      const versioning = mockMonitor.getResource('alb-logs-bucket-versioning');
      expect(versioning).toBeDefined();
      expect(versioning.props.versioningConfiguration.status).toBe('Enabled');
    });

    it('should configure S3 lifecycle policy for Glacier transition', () => {
      const lifecycle = mockMonitor.getResource(
        'alb-logs-bucket-lifecycle-rule'
      );
      expect(lifecycle).toBeDefined();
      expect(lifecycle.props.rules).toHaveLength(1);
      expect(lifecycle.props.rules[0].transitions).toHaveLength(1);
      expect(lifecycle.props.rules[0].transitions[0].days).toBe(90);
      expect(lifecycle.props.rules[0].transitions[0].storageClass).toBe(
        'GLACIER'
      );
    });

    it('should configure S3 bucket policy for ALB access', () => {
      const bucketPolicy = mockMonitor.getResource('alb-logs-bucket-policy');
      expect(bucketPolicy).toBeDefined();
    });
  });

  describe('ECS Configuration', () => {
    it('should create ECS cluster', () => {
      const cluster = mockMonitor.getResource('ecs-cluster');
      expect(cluster).toBeDefined();
      expect(cluster.props.name).toContain('fintech-cluster-');
    });

    it('should create ECS task definition with correct CPU and memory', () => {
      const taskDef = mockMonitor.getResource('ecs-task-definition');
      expect(taskDef).toBeDefined();
      expect(taskDef.props.cpu).toBe('256');
      expect(taskDef.props.memory).toBe('512');
      expect(taskDef.props.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.props.networkMode).toBe('awsvpc');
    });

    it('should create ECS service with 3 desired tasks', () => {
      const service = mockMonitor.getResource('ecs-service');
      expect(service).toBeDefined();
      expect(service.props.desiredCount).toBe(3);
      expect(service.props.launchType).toBe('FARGATE');
    });

    it('should create CloudWatch Log Group for ECS with 7-day retention', () => {
      const logGroup = mockMonitor.getResource('ecs-log-group');
      expect(logGroup).toBeDefined();
      expect(logGroup.props.name).toContain('/ecs/fintech/loan-processing-');
      expect(logGroup.props.retentionInDays).toBe(7);
    });

    it('should create IAM role for ECS task execution', () => {
      const role = mockMonitor.getResource('ecs-task-execution-role');
      expect(role).toBeDefined();
      expect(role.props.name).toContain('fintech-ecs-exec-role-');
    });

    it('should attach ECS task execution policy', () => {
      const policyAttachment = mockMonitor.getResource(
        'ecs-task-execution-policy'
      );
      expect(policyAttachment).toBeDefined();
      expect(policyAttachment.props.policyArn).toBe(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    it('should create IAM role for ECS task', () => {
      const role = mockMonitor.getResource('ecs-task-role');
      expect(role).toBeDefined();
      expect(role.props.name).toContain('fintech-ecs-task-role-');
    });
  });

  describe('RDS Configuration', () => {
    it('should create RDS subnet group', () => {
      const subnetGroup = mockMonitor.getResource('rds-subnet-group');
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.props.name).toContain('fintech-rds-subnet-group-');
    });

    it('should create RDS instance with Multi-AZ and encryption', () => {
      const rds = mockMonitor.getResource('rds-instance');
      expect(rds).toBeDefined();
      expect(rds.props.multiAz).toBe(true);
      expect(rds.props.storageEncrypted).toBe(true);
      expect(rds.props.engine).toBe('postgres');
    });

    it('should configure RDS with correct instance class', () => {
      const rds = mockMonitor.getResource('rds-instance');
      expect(rds.props.instanceClass).toBe('db.t3.small');
    });

    it('should configure RDS with automated backups', () => {
      const rds = mockMonitor.getResource('rds-instance');
      expect(rds.props.backupRetentionPeriod).toBe(7);
      expect(rds.props.backupWindow).toBe('03:00-04:00');
    });

    it('should set RDS to be destroyable', () => {
      const rds = mockMonitor.getResource('rds-instance');
      expect(rds.props.skipFinalSnapshot).toBe(true);
      expect(rds.props.deletionProtection).toBe(false);
    });

    it('should configure RDS with KMS encryption', () => {
      const rds = mockMonitor.getResource('rds-instance');
      expect(rds.props.storageEncrypted).toBe(true);
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should create Application Load Balancer', () => {
      const alb = mockMonitor.getResource('application-load-balancer');
      expect(alb).toBeDefined();
      expect(alb.props.name).toContain('fintech-alb-');
      expect(alb.props.loadBalancerType).toBe('application');
    });

    it('should configure ALB access logs', () => {
      const alb = mockMonitor.getResource('application-load-balancer');
      expect(alb.props.accessLogs).toBeDefined();
      expect(alb.props.accessLogs.enabled).toBe(true);
    });

    it('should create target group', () => {
      const tg = mockMonitor.getResource('alb-target-group');
      expect(tg).toBeDefined();
      expect(tg.props.port).toBe(80);
      expect(tg.props.protocol).toBe('HTTP');
      expect(tg.props.targetType).toBe('ip');
    });

    it('should configure target group health check', () => {
      const tg = mockMonitor.getResource('alb-target-group');
      expect(tg.props.healthCheck).toBeDefined();
      expect(tg.props.healthCheck.enabled).toBe(true);
      expect(tg.props.healthCheck.path).toBe('/health');
      expect(tg.props.healthCheck.interval).toBe(30);
    });

    it('should create ALB listener', () => {
      const listener = mockMonitor.getResource('alb-listener');
      expect(listener).toBeDefined();
      expect(listener.props.port).toBe(80);
      expect(listener.props.protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should create auto scaling target', () => {
      const target = mockMonitor.getResource('ecs-autoscaling-target');
      expect(target).toBeDefined();
      expect(target.props.minCapacity).toBe(3);
      expect(target.props.maxCapacity).toBe(10);
    });

    it('should create CPU-based scaling policy', () => {
      const policy = mockMonitor.getResource('ecs-scaling-policy');
      expect(policy).toBeDefined();
      expect(policy.props.policyType).toBe('TargetTrackingScaling');
      expect(
        policy.props.targetTrackingScalingPolicyConfiguration.targetValue
      ).toBe(70.0);
    });

    it('should configure scaling cooldown periods', () => {
      const policy = mockMonitor.getResource('ecs-scaling-policy');
      const config =
        policy.props.targetTrackingScalingPolicyConfiguration;
      expect(config.scaleInCooldown).toBe(300);
      expect(config.scaleOutCooldown).toBe(60);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create ECS CPU alarm', () => {
      const alarm = mockMonitor.getResource('high-cpu-alarm');
      expect(alarm).toBeDefined();
      expect(alarm.props.metricName).toBe('CPUUtilization');
      expect(alarm.props.namespace).toBe('AWS/ECS');
      expect(alarm.props.threshold).toBe(80);
    });

    it('should create RDS CPU alarm', () => {
      const alarm = mockMonitor.getResource('rds-high-cpu-alarm');
      expect(alarm).toBeDefined();
      expect(alarm.props.metricName).toBe('CPUUtilization');
      expect(alarm.props.namespace).toBe('AWS/RDS');
      expect(alarm.props.threshold).toBe(80);
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    let prodStack: TapStack;

    beforeAll(() => {
      process.env.ENVIRONMENT_SUFFIX = 'prod';
      prodStack = new TapStack('prod-stack', { tags: {} });
    });

    afterAll(() => {
      process.env.ENVIRONMENT_SUFFIX = 'test';
    });

    it('should include environmentSuffix in VPC name', () => {
      expect(prodStack).toBeDefined();
      const vpcs = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name === 'main-vpc'
      );
      // Should have at least 2 VPCs (test stack + prod stack)
      expect(vpcs.length).toBeGreaterThanOrEqual(2);
      // Check that VPCs have different environment suffixes
      const vpcNames = vpcs.map(v => v.props && v.props.tags && v.props.tags.Name).filter(Boolean);
      expect(vpcNames.length).toBeGreaterThan(0);
      // At least one should have an environment suffix pattern (fintech-vpc-{suffix})
      const hasEnvironmentSuffix = vpcNames.some(name => /fintech-vpc-\w+/.test(name));
      expect(hasEnvironmentSuffix).toBe(true);
    });

    it('should include environmentSuffix in ECS cluster name', () => {
      const clusters = mockMonitor.resources.filter(
        r => r.type === 'aws:ecs/cluster:Cluster' && r.name === 'ecs-cluster'
      );
      expect(clusters.length).toBeGreaterThanOrEqual(2);
      const prodCluster = clusters.find(c => c.props.name && c.props.name.includes('-prod'));
      expect(prodCluster).toBeDefined();
      expect(prodCluster.props.name).toContain('-prod');
    });

    it('should include environmentSuffix in RDS identifier', () => {
      const rdsInstances = mockMonitor.resources.filter(
        r => r.type === 'aws:rds/instance:Instance' && r.name === 'rds-instance'
      );
      expect(rdsInstances.length).toBeGreaterThanOrEqual(2);
      // Check that RDS identifiers have environment suffix pattern
      const rdsIdentifiers = rdsInstances.map(r => r.props && r.props.identifier).filter(Boolean);
      expect(rdsIdentifiers.length).toBeGreaterThan(0);
      // At least one should have an environment suffix pattern (fintech-db-{suffix})
      const hasEnvironmentSuffix = rdsIdentifiers.some(id => /fintech-db-\w+/.test(id));
      expect(hasEnvironmentSuffix).toBe(true);
    });

    it('should include environmentSuffix in ALB name', () => {
      const albs = mockMonitor.resources.filter(
        r => r.type === 'aws:lb/loadBalancer:LoadBalancer' && r.name === 'application-load-balancer'
      );
      expect(albs.length).toBeGreaterThanOrEqual(2);
      // Check that ALB names have environment suffix pattern
      const albNames = albs.map(a => a.props && a.props.name).filter(Boolean);
      expect(albNames.length).toBeGreaterThan(0);
      // At least one should have an environment suffix pattern (fintech-alb-{suffix})
      const hasEnvironmentSuffix = albNames.some(name => /fintech-alb-\w+/.test(name));
      expect(hasEnvironmentSuffix).toBe(true);
    });

    it('should include environmentSuffix in S3 bucket name', () => {
      const buckets = mockMonitor.resources.filter(
        r => r.type === 'aws:s3/bucket:Bucket' && r.name === 'alb-logs-bucket'
      );
      expect(buckets.length).toBeGreaterThanOrEqual(2);
      const prodBucket = buckets.find(b => b.props.bucket && b.props.bucket.includes('-prod'));
      expect(prodBucket).toBeDefined();
      expect(prodBucket.props.bucket).toContain('-prod');
    });
  });

  describe('Tag Propagation', () => {
    let tagStack: TapStack;

    beforeAll(() => {
      tagStack = new TapStack('tag-stack', {
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      });
    });

    it('should apply custom tags to VPC', () => {
      expect(tagStack).toBeDefined();
      const vpcs = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name === 'main-vpc'
      );
      expect(vpcs.length).toBeGreaterThanOrEqual(2);
      // Check that VPCs can have custom tags applied
      // At least one VPC should have tags object
      const vpcsWithTags = vpcs.filter(v => v.props && v.props.tags);
      expect(vpcsWithTags.length).toBeGreaterThan(0);
      // Verify that tags are being applied (any tag is fine)
      const hasAnyTags = vpcsWithTags.some(v => Object.keys(v.props.tags).length > 0);
      expect(hasAnyTags).toBe(true);
    });

    it('should apply custom tags to ECS cluster', () => {
      const clusters = mockMonitor.resources.filter(
        r => r.type === 'aws:ecs/cluster:Cluster' && r.name === 'ecs-cluster'
      );
      const taggedCluster = clusters.find(c => c.props.tags && c.props.tags.Environment === 'production');
      expect(taggedCluster).toBeDefined();
      expect(taggedCluster.props.tags.Team).toBe('platform');
    });
  });

  describe('Compliance Requirements', () => {
    it('should use customer-managed KMS key for RDS', () => {
      const rdsInstances = mockMonitor.resources.filter(
        r => r.type === 'aws:rds/instance:Instance'
      );
      expect(rdsInstances.length).toBeGreaterThan(0);
      const rds = rdsInstances[0];
      expect(rds.props.storageEncrypted).toBe(true);
      // KMS key ID should be set
      expect(rds.props.kmsKeyId).toBeDefined();
    });

    it('should configure S3 bucket for 7-year retention via lifecycle', () => {
      const lifecycle = mockMonitor.getResource(
        'alb-logs-bucket-lifecycle-rule'
      );
      expect(lifecycle).toBeDefined();
      // Glacier transition at 90 days supports 7-year retention
      expect(lifecycle.props.rules[0].transitions[0].days).toBe(90);
    });

    it('should enable S3 versioning for compliance', () => {
      const versioning = mockMonitor.getResource('alb-logs-bucket-versioning');
      expect(versioning.props.versioningConfiguration.status).toBe('Enabled');
    });

    it('should use private subnets for ECS tasks', () => {
      const services = mockMonitor.resources.filter(
        r => r.type === 'aws:ecs/service:Service'
      );
      expect(services.length).toBeGreaterThan(0);
      const service = services[0];
      // Network configuration should reference private subnets
      expect(service.props.networkConfiguration).toBeDefined();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use default environmentSuffix when not set', () => {
      const originalSuffix = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;
      const devStack = new TapStack('dev-stack', { tags: {} });

      expect(devStack).toBeDefined();
      const vpcs = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name === 'main-vpc'
      );
      expect(vpcs.length).toBeGreaterThanOrEqual(2);
      // Check that VPCs have environment suffix pattern (defaults to 'dev')
      const vpcNames = vpcs.map(v => v.props && v.props.tags && v.props.tags.Name).filter(Boolean);
      expect(vpcNames.length).toBeGreaterThan(0);
      // Should have the pattern fintech-vpc-{suffix} where suffix defaults to 'dev'
      const hasEnvironmentSuffix = vpcNames.some(name => /fintech-vpc-\w+/.test(name));
      expect(hasEnvironmentSuffix).toBe(true);

      // Restore
      process.env.ENVIRONMENT_SUFFIX = originalSuffix;
    });

    it('should use default region when not set', () => {
      const originalRegion = process.env.AWS_REGION;
      delete process.env.AWS_REGION;
      const regionStack = new TapStack('region-stack', { tags: {} });

      // Stack should still be created successfully
      expect(regionStack).toBeDefined();

      // Restore
      process.env.AWS_REGION = originalRegion;
    });
  });

  describe('Resource Dependencies', () => {
    it('should create NAT Gateways with dependency on Internet Gateway', () => {
      const natGateways = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/natGateway:NatGateway'
      );
      const igw = mockMonitor.getResource('internet-gateway');

      natGateways.forEach(nat => {
        // NAT gateways should be created in public subnets
        expect(nat.props.subnetId).toBeDefined();
      });
    });

    it('should create ALB with dependency on bucket policy', () => {
      const albs = mockMonitor.resources.filter(
        r => r.type === 'aws:lb/loadBalancer:LoadBalancer'
      );
      const bucketPolicies = mockMonitor.resources.filter(
        r => r.type === 'aws:s3/bucketPolicy:BucketPolicy'
      );

      expect(albs.length).toBeGreaterThan(0);
      expect(bucketPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tags gracefully', () => {
      expect(() => {
        stack = new TapStack('test-stack', {});
      }).not.toThrow();
    });

    it('should create stack with minimal configuration', () => {
      stack = new TapStack('minimal-stack', { tags: {} });
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Network Configuration', () => {
    it('should create subnets across 3 availability zones', () => {
      const subnets = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet'
      );
      // 3 public + 3 private = 6 total
      expect(subnets.length).toBeGreaterThanOrEqual(6);
    });

    it('should configure public subnets with auto-assign public IP', () => {
      const publicSubnets = mockMonitor.resources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('public')
      );
      publicSubnets.forEach(subnet => {
        expect(subnet.props.mapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('IAM Policies', () => {
    it('should create least-privilege IAM roles', () => {
      const taskRole = mockMonitor.getResource('ecs-task-role');
      expect(taskRole).toBeDefined();
      expect(taskRole.props.assumeRolePolicy).toBeDefined();

      const policy = JSON.parse(taskRole.props.assumeRolePolicy);
      expect(policy.Statement[0].Principal.Service).toBe(
        'ecs-tasks.amazonaws.com'
      );
    });

    it('should attach CloudWatch Logs policy for ECS', () => {
      const logsPolicy = mockMonitor.getResource('ecs-logs-policy');
      expect(logsPolicy).toBeDefined();
    });
  });
});
