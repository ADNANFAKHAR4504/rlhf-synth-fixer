import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Enable Pulumi mocking
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

// Set up mocks before requiring the module
beforeAll(() => {
  // Mock Pulumi runtime behavior
  (pulumi as any).all = jest
    .fn()
    .mockImplementation(values => Promise.resolve(values));
  (pulumi as any).Output = jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  }));
  (pulumi as any).interpolate = jest.fn().mockImplementation((strings, ...values) => {
    return {
      apply: (fn: any) => fn(strings[0])
    };
  });
  (pulumi as any).ComponentResource = class {
    constructor() {}
    registerOutputs() {}
  };

  // Mock AWS provider calls
  (aws as any).getAvailabilityZones = jest.fn().mockReturnValue({
    then: (fn: any) => fn({
      names: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
    })
  });
  
  (aws as any).ec2 = (aws as any).ec2 || {};
  (aws as any).ec2.getAmi = jest.fn().mockReturnValue({
    then: (fn: any) => fn({
      id: 'ami-12345678',
    })
  });
});

describe('TapStack Structure', () => {
  let stack: TapStack;
  let createdResources: any[] = [];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    createdResources = [];

    // Re-setup AWS provider calls
    (aws as any).getAvailabilityZones = jest.fn().mockReturnValue({
      then: (fn: any) => fn({
        names: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
      })
    });

    // Merge with existing ec2 object to preserve getAmi
    (aws as any).ec2 = {
      ...(aws as any).ec2,
      Vpc: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Vpc', name, config });
        return { id: 'vpc-123' };
      }),
      InternetGateway: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'InternetGateway', name, config });
        return { id: 'igw-123' };
      }),
      Subnet: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Subnet', name, config });
        return { id: 'subnet-123' };
      }),
      RouteTable: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'RouteTable', name, config });
        return { id: 'rt-123' };
      }),
      Route: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Route', name, config });
        return { id: 'route-123' };
      }),
      RouteTableAssociation: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'RouteTableAssociation', name, config });
        return { id: 'rta-123' };
      }),
      SecurityGroup: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'SecurityGroup', name, config });
        return { id: 'sg-123' };
      }),
      LaunchTemplate: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'LaunchTemplate', name, config });
        return { id: 'lt-123' };
      }),
    };
    
    (aws as any).s3 = {
      Bucket: jest.fn().mockImplementation((name, config, opts) => { 
        createdResources.push({ type: 'Bucket', name, config });
        return {
          id: 'bucket-123',
          bucket: 'tap-logs-bucket-test-123456',
          arn: 'arn:aws:s3:::tap-logs-bucket-test-123456'
        };
      }),
      BucketLifecycleConfiguration: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'BucketLifecycleConfiguration', name, config });
        return { id: 'lifecycle-123' };
      }),
      BucketPublicAccessBlock: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'BucketPublicAccessBlock', name, config });
        return { id: 'pab-123' };
      }),
    };
    
    (aws as any).iam = {
      Role: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Role', name, config });
        return { 
          id: 'role-123',
          name: 'tap-ec2-role-test',
          arn: 'arn:aws:iam::123456789012:role/tap-ec2-role-test'
        };
      }),
      Policy: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Policy', name, config });
        return { 
          id: 'policy-123',
          arn: 'arn:aws:iam::123456789012:policy/tap-s3-policy-test'
        };
      }),
      RolePolicyAttachment: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'RolePolicyAttachment', name, config });
        return { id: 'attachment-123' };
      }),
      InstanceProfile: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'InstanceProfile', name, config });
        return { 
          id: 'profile-123',
          name: 'tap-instance-profile-test'
        };
      }),
    };
    
    (aws as any).lb = {
      LoadBalancer: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'LoadBalancer', name, config });
        return { 
          id: 'alb-123',
          arn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/tap-alb-test/1234567890abcdef',
          dnsName: 'tap-alb-test-123456789.us-west-2.elb.amazonaws.com'
        };
      }),
      TargetGroup: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'TargetGroup', name, config });
        return { 
          id: 'tg-123',
          arn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/tap-tg-test/1234567890abcdef'
        };
      }),
      Listener: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Listener', name, config });
        return { id: 'listener-123' };
      }),
    };
    
    (aws as any).autoscaling = {
      Group: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Group', name, config });
        return { 
          id: 'asg-123',
          name: 'tap-asg-test'
        };
      }),
      Policy: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'Policy', name, config });
        return { 
          id: 'policy-123',
          arn: 'arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:1234567890abcdef'
        };
      }),
    };
    
    (aws as any).cloudwatch = {
      LogGroup: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'LogGroup', name, config });
        return { id: 'lg-123' };
      }),
      MetricAlarm: jest.fn().mockImplementation((name, config, opts) => {
        createdResources.push({ type: 'MetricAlarm', name, config });
        return { id: 'alarm-123' };
      }),
    };
  });

  describe('Web Application Infrastructure', () => {
    beforeEach(() => {
      createdResources = [];
      stack = new TapStack('TestTapStackWebApp', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Project: 'TAP',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has required outputs', () => {
      // Stack outputs are set to resource IDs from mocks
      expect(stack.vpcId).toBe('vpc-123');
      expect(stack.loadBalancerDns).toBe('tap-alb-test-123456789.us-west-2.elb.amazonaws.com');
      expect(stack.autoScalingGroupName).toBe('tap-asg-test');
      expect(stack.logsBucketName).toBe('tap-logs-bucket-test-123456');
    });

    it('creates VPC infrastructure', () => {
      const vpc = createdResources.find(r => r.type === 'Vpc');
      expect(vpc).toBeDefined();
      expect(vpc.name).toContain('tap-vpc-test');
      expect(vpc.config.cidrBlock).toBe('10.0.0.0/16');
      expect(vpc.config.enableDnsHostnames).toBe(true);
      expect(vpc.config.enableDnsSupport).toBe(true);
    });

    it('creates Internet Gateway', () => {
      const igw = createdResources.find(r => r.type === 'InternetGateway');
      expect(igw).toBeDefined();
      expect(igw.name).toContain('tap-igw-test');
    });

    it('creates public subnets', () => {
      const subnets = createdResources.filter(r => r.type === 'Subnet');
      expect(subnets.length).toBeGreaterThanOrEqual(2);
      subnets.forEach((subnet, i) => {
        expect(subnet.config.mapPublicIpOnLaunch).toBe(true);
        expect(subnet.config.cidrBlock).toMatch(/10\.0\.\d+\.0\/24/);
      });
    });

    it('creates S3 bucket for logs', () => {
      const bucket = createdResources.find(r => r.type === 'Bucket');
      expect(bucket).toBeDefined();
      expect(bucket.name).toContain('tap-logs-bucket-test');
      expect(bucket.config.bucket).toMatch(/tap-application-logs-test-\d+/);
    });

    it('creates IAM role for EC2 instances', () => {
      const role = createdResources.find(r => r.type === 'Role');
      expect(role).toBeDefined();
      expect(role.name).toContain('tap-ec2-role-test');
      expect(role.config.assumeRolePolicy).toContain('ec2.amazonaws.com');
    });

    it('creates Application Load Balancer', () => {
      const alb = createdResources.find(r => r.type === 'LoadBalancer');
      expect(alb).toBeDefined();
      expect(alb.name).toContain('tap-alb-test');
      expect(alb.config.internal).toBe(false);
      expect(alb.config.loadBalancerType).toBe('application');
    });

    it('creates Auto Scaling Group', () => {
      const asg = createdResources.find(r => r.type === 'Group');
      expect(asg).toBeDefined();
      expect(asg.name).toContain('tap-asg-test');
      expect(asg.config.minSize).toBe(1);
      expect(asg.config.maxSize).toBe(3);
      expect(asg.config.desiredCapacity).toBe(2);
      expect(asg.config.healthCheckType).toBe('ELB');
    });

    it('creates CloudWatch log group', () => {
      const logGroup = createdResources.find(r => r.type === 'LogGroup');
      expect(logGroup).toBeDefined();
      expect(logGroup.name).toContain('tap-web-logs-test');
      expect(logGroup.config.retentionInDays).toBe(14);
    });

    it('creates security groups for ALB and EC2', () => {
      const securityGroups = createdResources.filter(r => r.type === 'SecurityGroup');
      expect(securityGroups.length).toBeGreaterThanOrEqual(2);
      
      const albSg = securityGroups.find(sg => sg.name.includes('alb-sg'));
      expect(albSg).toBeDefined();
      expect(albSg.config.ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fromPort: 80, toPort: 80 }),
          expect.objectContaining({ fromPort: 443, toPort: 443 }),
        ])
      );

      const ec2Sg = securityGroups.find(sg => sg.name.includes('ec2-sg'));
      expect(ec2Sg).toBeDefined();
    });

    it('creates scaling policies and alarms', () => {
      const policies = createdResources.filter(r => r.type === 'Policy' && r.name.includes('scale'));
      expect(policies.length).toBeGreaterThanOrEqual(2);
      
      const alarms = createdResources.filter(r => r.type === 'MetricAlarm');
      expect(alarms.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('with default values', () => {
    beforeEach(() => {
      createdResources = [];
      stack = new TapStack('TestTapStackDefault', {});
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('uses default environment suffix', () => {
      const vpc = createdResources.find(r => r.type === 'Vpc');
      expect(vpc).toBeDefined();
      expect(vpc.name).toContain('tap-vpc-dev');
    });

    it('has all required infrastructure components', () => {
      const resourceTypes = [...new Set(createdResources.map(r => r.type))];
      expect(resourceTypes).toContain('Vpc');
      expect(resourceTypes).toContain('InternetGateway');
      expect(resourceTypes).toContain('Subnet');
      expect(resourceTypes).toContain('Bucket');
      expect(resourceTypes).toContain('Role');
      expect(resourceTypes).toContain('LoadBalancer');
      expect(resourceTypes).toContain('Group');
      expect(resourceTypes).toContain('LogGroup');
    });
  });
});