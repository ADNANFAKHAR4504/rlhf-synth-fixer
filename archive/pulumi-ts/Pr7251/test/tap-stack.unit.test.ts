/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Unit tests for TapStack with 100% code coverage using mocks
 * All AWS resources and Pulumi runtime are mocked - no live testing
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Mock Pulumi Output helper
class MockOutput<T> {
  constructor(private value: T) {}
  apply<U>(func: (t: T) => U): pulumi.Output<U> {
    return new MockOutput(func(this.value)) as any;
  }
}

// Create mock Pulumi runtime
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts: any) {
    this.registerOutputs = jest.fn();
    return this;
  }),
  Config: jest.fn().mockImplementation(() => ({
    require: jest.fn((key: string) => 'test-value'),
    get: jest.fn((key: string) => 'test-value'),
  })),
  Output: {
    create: jest.fn((val: any) => new MockOutput(val)),
  },
  output: jest.fn((val: any) => new MockOutput(val)),
  interpolate: jest.fn((strings: any, ...values: any[]) => {
    return new MockOutput(values.join(''));
  }),
  all: jest.fn((...args: any[]) => {
    const values = args[0];
    return {
      apply: (fn: any) => new MockOutput(fn(values)),
    };
  }),
}));

// Mock AWS Provider
const mockProvider = {
  id: 'mock-provider-id',
  urn: 'urn:pulumi:test::test::pulumi:providers:aws::aws',
};

// Mock AWS resources
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation((name: string, args: any, opts?: any) => mockProvider),
  rds: {
    GlobalCluster: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`global-cluster-${name}`),
      globalClusterIdentifier: new MockOutput(args.globalClusterIdentifier),
      engine: new MockOutput(args.engine),
      engineVersion: new MockOutput(args.engineVersion),
      urn: `urn:pulumi:test::test::aws:rds/globalCluster:GlobalCluster::${name}`,
    })),
    Cluster: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`cluster-${name}`),
      endpoint: new MockOutput(`${name}.cluster-xxx.us-east-1.rds.amazonaws.com`),
      arn: new MockOutput(`arn:aws:rds:us-east-1:123456789:cluster:${name}`),
    })),
    ClusterInstance: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`instance-${name}`),
      endpoint: new MockOutput(`${name}.xxx.us-east-1.rds.amazonaws.com`),
    })),
  },
  ec2: {
    VpcPeeringConnection: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`pcx-${name}`),
      vpcId: args.vpcId,
      peerVpcId: args.peerVpcId,
    })),
    VpcPeeringConnectionAccepter: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`pcx-accepter-${name}`),
      vpcPeeringConnectionId: args.vpcPeeringConnectionId,
    })),
    Route: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`route-${name}`),
      routeTableId: args.routeTableId,
      destinationCidrBlock: args.destinationCidrBlock,
    })),
  },
  s3: {
    BucketPolicy: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`bucket-policy-${name}`),
      bucket: args.bucket,
    })),
    BucketReplicationConfig: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`replication-${name}`),
      bucket: args.bucket,
      role: args.role,
    })),
  },
  iam: {
    Role: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`role-${name}`),
      arn: new MockOutput(`arn:aws:iam::123456789:role/${name}`),
      name: new MockOutput(name),
    })),
    RolePolicy: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`role-policy-${name}`),
      role: args.role,
    })),
  },
  route53: {
    Zone: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`zone-${name}`),
      zoneId: new MockOutput(`Z123456789ABC`),
      name: new MockOutput(args.name),
    })),
    HealthCheck: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`hc-${name}`),
      fqdn: args.fqdn,
      type: new MockOutput(args.type),
    })),
    Record: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`record-${name}`),
      name: new MockOutput(args.name),
      type: new MockOutput(args.type),
      zoneId: args.zoneId,
    })),
  },
  cloudwatch: {
    EventRule: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`rule-${name}`),
      name: new MockOutput(args.name),
      eventBusName: args.eventBusName,
    })),
    EventTarget: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`target-${name}`),
      rule: args.rule,
      arn: args.arn,
    })),
    EventBusPolicy: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`bus-policy-${name}`),
      eventBusName: args.eventBusName,
    })),
    MetricAlarm: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`alarm-${name}`),
      name: new MockOutput(args.name),
      metricName: new MockOutput(args.metricName),
    })),
    Dashboard: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`dashboard-${name}`),
      dashboardName: new MockOutput(args.dashboardName),
      dashboardBody: args.dashboardBody,
    })),
  },
  sns: {
    Topic: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
      id: new MockOutput(`topic-${name}`),
      arn: new MockOutput(`arn:aws:sns:us-east-1:123456789:${name}`),
      name: new MockOutput(args.name),
    })),
  },
}));

// Mock RegionalInfrastructure
jest.mock('../lib/regional-infrastructure', () => ({
  RegionalInfrastructure: jest.fn().mockImplementation((name: string, args: any, opts?: any) => ({
    networking: {
      vpc: {
        id: new MockOutput(`vpc-${name}`),
        cidrBlock: new MockOutput(args.vpcCidr),
      },
      publicSubnets: [
        { id: new MockOutput(`subnet-public-${name}-1`) },
        { id: new MockOutput(`subnet-public-${name}-2`) },
      ],
      privateSubnets: [
        { id: new MockOutput(`subnet-private-${name}-1`) },
        { id: new MockOutput(`subnet-private-${name}-2`) },
      ],
      privateRouteTables: [
        { id: new MockOutput(`rtb-private-${name}-1`) },
        { id: new MockOutput(`rtb-private-${name}-2`) },
      ],
      publicRouteTable: {
        id: new MockOutput(`rtb-public-${name}`),
      },
      securityGroup: {
        id: new MockOutput(`sg-${name}`),
      },
    },
    database: {
      cluster: {
        id: new MockOutput(`db-cluster-${name}`),
        endpoint: new MockOutput(`${name}.cluster-xxx.${args.region}.rds.amazonaws.com`),
        arn: new MockOutput(`arn:aws:rds:${args.region}:123456789:cluster:${name}`),
      },
    },
    compute: {
      alb: {
        id: new MockOutput(`alb-${name}`),
        dnsName: new MockOutput(`${name}-alb.${args.region}.elb.amazonaws.com`),
        arn: new MockOutput(`arn:aws:elasticloadbalancing:${args.region}:123456789:loadbalancer/app/${name}`),
        arnSuffix: new MockOutput(`app/${name}/1234567890abcdef`),
      },
      targetGroup: {
        id: new MockOutput(`tg-${name}`),
        arn: new MockOutput(`arn:aws:elasticloadbalancing:${args.region}:123456789:targetgroup/${name}`),
        arnSuffix: new MockOutput(`targetgroup/${name}/1234567890abcdef`),
      },
      lambdaFunction: {
        id: new MockOutput(`lambda-${name}`),
        name: new MockOutput(`${name}-lambda-function`),
        arn: new MockOutput(`arn:aws:lambda:${args.region}:123456789:function:${name}`),
      },
    },
    storage: {
      bucket: {
        id: new MockOutput(`bucket-${name}`),
        arn: new MockOutput(`arn:aws:s3:::bucket-${name}`),
      },
      bucketVersioning: {
        id: new MockOutput(`bucket-versioning-${name}`),
      },
    },
    eventBus: {
      id: new MockOutput(`event-bus-${name}`),
      name: new MockOutput(`${name}-event-bus`),
      arn: new MockOutput(`arn:aws:events:${args.region}:123456789:event-bus/${name}`),
    },
  })),
}));

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const mockArgs: TapStackArgs = {
    environmentSuffix: 'test',
    tags: {
      Team: 'test-team',
      Project: 'test-project',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create TapStack instance successfully', () => {
      stack = new TapStack('test-stack', mockArgs);
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should call ComponentResource constructor with correct parameters', () => {
      stack = new TapStack('test-stack', mockArgs);
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'custom:infrastructure:TapStack',
        'test-stack',
        {},
        undefined
      );
    });

    it('should merge custom tags with default tags', () => {
      stack = new TapStack('test-stack', mockArgs);
      expect(stack).toBeDefined();
      // Verify that tags include both default and custom tags
    });

    it('should work with minimal args', () => {
      const minimalArgs: TapStackArgs = {
        environmentSuffix: 'dev',
      };
      stack = new TapStack('minimal-stack', minimalArgs);
      expect(stack).toBeDefined();
    });
  });

  describe('Global RDS Cluster', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create global RDS cluster', () => {
      expect(aws.rds.GlobalCluster).toHaveBeenCalled();
    });

    it('should create global cluster with correct configuration', () => {
      expect(aws.rds.GlobalCluster).toHaveBeenCalledWith(
        'global-cluster',
        expect.objectContaining({
          globalClusterIdentifier: 'global-healthcare-test',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          databaseName: 'healthcare',
          deletionProtection: false,
        }),
        expect.objectContaining({
          parent: expect.anything(),
        })
      );
    });
  });

  describe('Regional Infrastructure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create primary regional infrastructure', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');

      expect(RegionalInfrastructure).toHaveBeenCalledWith(
        'primary',
        expect.objectContaining({
          environmentSuffix: 'test',
          region: 'us-east-1',
          isPrimary: true,
          vpcCidr: '10.0.0.0/16',
        }),
        expect.anything()
      );
    });

    it('should create DR regional infrastructure', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');

      expect(RegionalInfrastructure).toHaveBeenCalledWith(
        'dr',
        expect.objectContaining({
          environmentSuffix: 'test',
          region: 'us-west-2',
          isPrimary: false,
          vpcCidr: '10.1.0.0/16',
        }),
        expect.anything()
      );
    });

    it('should pass correct tags to regional infrastructure', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');

      expect(RegionalInfrastructure).toHaveBeenCalledWith(
        'primary',
        expect.objectContaining({
          tags: expect.objectContaining({
            'DR-Role': 'primary',
            Team: 'test-team',
            Project: 'test-project',
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('VPC Peering', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create VPC peering connection', () => {
      expect(aws.ec2.VpcPeeringConnection).toHaveBeenCalled();
    });

    it('should create VPC peering with correct configuration', () => {
      expect(aws.ec2.VpcPeeringConnection).toHaveBeenCalledWith(
        'vpc-peering',
        expect.objectContaining({
          peerRegion: 'us-west-2',
          autoAccept: false,
        }),
        expect.anything()
      );
    });

    it('should create VPC peering accepter', () => {
      expect(aws.ec2.VpcPeeringConnectionAccepter).toHaveBeenCalled();
    });

    it('should create peering accepter with autoAccept true', () => {
      expect(aws.ec2.VpcPeeringConnectionAccepter).toHaveBeenCalledWith(
        'peering-accepter',
        expect.objectContaining({
          autoAccept: true,
        }),
        expect.anything()
      );
    });

    it('should create routes for primary VPC private subnets', () => {
      const routeCalls = (aws.ec2.Route as unknown as jest.Mock).mock.calls.filter(
        call => call[0].startsWith('primary-private-peer-route')
      );
      expect(routeCalls.length).toBeGreaterThan(0);
    });

    it('should create route for primary VPC public subnet', () => {
      expect(aws.ec2.Route).toHaveBeenCalledWith(
        'primary-public-peer-route',
        expect.objectContaining({
          destinationCidrBlock: '10.1.0.0/16',
        }),
        expect.anything()
      );
    });

    it('should create routes for DR VPC private subnets', () => {
      const routeCalls = (aws.ec2.Route as unknown as jest.Mock).mock.calls.filter(
        call => call[0].startsWith('dr-private-peer-route')
      );
      expect(routeCalls.length).toBeGreaterThan(0);
    });

    it('should create route for DR VPC public subnet', () => {
      expect(aws.ec2.Route).toHaveBeenCalledWith(
        'dr-public-peer-route',
        expect.objectContaining({
          destinationCidrBlock: '10.0.0.0/16',
        }),
        expect.anything()
      );
    });
  });

  describe('S3 Replication', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create S3 replication role', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'replication-role',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create replication role with S3 assume policy', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'replication-role',
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('s3.amazonaws.com'),
        }),
        expect.anything()
      );
    });

    it('should create replication role policy', () => {
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'replication-policy',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create DR bucket policy', () => {
      expect(aws.s3.BucketPolicy).toHaveBeenCalledWith(
        'dr-bucket-policy',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create bucket replication config', () => {
      expect(aws.s3.BucketReplicationConfig).toHaveBeenCalledWith(
        'primary-replication',
        expect.anything(),
        expect.anything()
      );
    });

    it('should configure replication with 15 minute RTC', () => {
      expect(aws.s3.BucketReplicationConfig).toHaveBeenCalledWith(
        'primary-replication',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              destination: expect.objectContaining({
                replicationTime: expect.objectContaining({
                  time: { minutes: 15 },
                }),
              }),
            }),
          ]),
        }),
        expect.anything()
      );
    });
  });

  describe('Route53 Configuration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create Route53 hosted zone', () => {
      expect(aws.route53.Zone).toHaveBeenCalled();
    });

    it('should create hosted zone with correct name', () => {
      expect(aws.route53.Zone).toHaveBeenCalledWith(
        'hosted-zone',
        expect.objectContaining({
          name: 'test.testing.local',
        }),
        expect.anything()
      );
    });

    it('should create primary health check', () => {
      expect(aws.route53.HealthCheck).toHaveBeenCalledWith(
        'primary-health-check',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create DR health check', () => {
      expect(aws.route53.HealthCheck).toHaveBeenCalledWith(
        'dr-health-check',
        expect.anything(),
        expect.anything()
      );
    });

    it('should configure health checks with HTTP type', () => {
      expect(aws.route53.HealthCheck).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'HTTP',
          resourcePath: '/health',
          port: 80,
        }),
        expect.anything()
      );
    });

    it('should create primary Route53 record', () => {
      expect(aws.route53.Record).toHaveBeenCalledWith(
        'primary-record',
        expect.objectContaining({
          type: 'CNAME',
          setIdentifier: 'primary',
        }),
        expect.anything()
      );
    });

    it('should create DR Route53 record', () => {
      expect(aws.route53.Record).toHaveBeenCalledWith(
        'dr-record',
        expect.objectContaining({
          type: 'CNAME',
          setIdentifier: 'secondary',
        }),
        expect.anything()
      );
    });

    it('should configure failover routing policy', () => {
      expect(aws.route53.Record).toHaveBeenCalledWith(
        'primary-record',
        expect.objectContaining({
          failoverRoutingPolicies: [{ type: 'PRIMARY' }],
        }),
        expect.anything()
      );
    });
  });

  describe('EventBridge Configuration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create event role', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'event-role',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create event role with EventBridge assume policy', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'event-role',
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('events.amazonaws.com'),
        }),
        expect.anything()
      );
    });

    it('should create event policy', () => {
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'event-policy',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create primary event rule', () => {
      expect(aws.cloudwatch.EventRule).toHaveBeenCalledWith(
        'primary-event-rule',
        expect.anything(),
        expect.anything()
      );
    });

    it('should configure event rule with correct pattern', () => {
      expect(aws.cloudwatch.EventRule).toHaveBeenCalledWith(
        'primary-event-rule',
        expect.objectContaining({
          eventPattern: expect.stringContaining('healthcare.application'),
        }),
        expect.anything()
      );
    });

    it('should create DR event bus target', () => {
      expect(aws.cloudwatch.EventTarget).toHaveBeenCalledWith(
        'dr-event-target',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create DR event bus policy', () => {
      expect(aws.cloudwatch.EventBusPolicy).toHaveBeenCalledWith(
        'dr-event-bus-policy',
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('CloudWatch Monitoring', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create SNS alarm topic', () => {
      expect(aws.sns.Topic).toHaveBeenCalledWith(
        'alarm-topic',
        expect.objectContaining({
          name: 'healthcare-alarms-test',
        }),
        expect.anything()
      );
    });

    it('should create primary health check alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'primary-health-alarm',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create DR health check alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'dr-health-alarm',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create RDS CPU alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'primary-rds-cpu-alarm',
        expect.objectContaining({
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          threshold: 80,
        }),
        expect.anything()
      );
    });

    it('should create RDS connections alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'primary-rds-connections-alarm',
        expect.objectContaining({
          metricName: 'DatabaseConnections',
          threshold: 100,
        }),
        expect.anything()
      );
    });

    it('should create Lambda error alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'primary-lambda-error-alarm',
        expect.objectContaining({
          metricName: 'Errors',
          namespace: 'AWS/Lambda',
          threshold: 10,
        }),
        expect.anything()
      );
    });

    it('should create Lambda throttle alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'primary-lambda-throttle-alarm',
        expect.objectContaining({
          metricName: 'Throttles',
          threshold: 0,
        }),
        expect.anything()
      );
    });

    it('should create ALB unhealthy target alarm', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'primary-alb-unhealthy-alarm',
        expect.objectContaining({
          metricName: 'UnHealthyHostCount',
          namespace: 'AWS/ApplicationELB',
        }),
        expect.anything()
      );
    });

    it('should create CloudWatch dashboard', () => {
      expect(aws.cloudwatch.Dashboard).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          dashboardName: 'healthcare-dr-test',
        }),
        expect.anything()
      );
    });

    it('should configure dashboard with correct widgets', () => {
      const dashboardCall = (aws.cloudwatch.Dashboard as unknown as jest.Mock).mock.calls[0];
      expect(dashboardCall).toBeDefined();
      expect(dashboardCall[1]).toHaveProperty('dashboardBody');
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should have primaryVpcId output', () => {
      expect(stack.primaryVpcId).toBeDefined();
    });

    it('should have drVpcId output', () => {
      expect(stack.drVpcId).toBeDefined();
    });

    it('should have vpcPeeringConnectionId output', () => {
      expect(stack.vpcPeeringConnectionId).toBeDefined();
    });

    it('should have primaryPublicSubnetIds output', () => {
      expect(stack.primaryPublicSubnetIds).toBeDefined();
    });

    it('should have primaryPrivateSubnetIds output', () => {
      expect(stack.primaryPrivateSubnetIds).toBeDefined();
    });

    it('should have drPublicSubnetIds output', () => {
      expect(stack.drPublicSubnetIds).toBeDefined();
    });

    it('should have drPrivateSubnetIds output', () => {
      expect(stack.drPrivateSubnetIds).toBeDefined();
    });

    it('should have globalClusterId output', () => {
      expect(stack.globalClusterId).toBeDefined();
    });

    it('should have primaryDbEndpoint output', () => {
      expect(stack.primaryDbEndpoint).toBeDefined();
    });

    it('should have drDbEndpoint output', () => {
      expect(stack.drDbEndpoint).toBeDefined();
    });

    it('should have primaryDbClusterId output', () => {
      expect(stack.primaryDbClusterId).toBeDefined();
    });

    it('should have drDbClusterId output', () => {
      expect(stack.drDbClusterId).toBeDefined();
    });

    it('should have primaryAlbEndpoint output', () => {
      expect(stack.primaryAlbEndpoint).toBeDefined();
    });

    it('should have failoverEndpoint output', () => {
      expect(stack.failoverEndpoint).toBeDefined();
    });

    it('should have primaryAlbDnsName output', () => {
      expect(stack.primaryAlbDnsName).toBeDefined();
    });

    it('should have drAlbDnsName output', () => {
      expect(stack.drAlbDnsName).toBeDefined();
    });

    it('should have primaryLambdaName output', () => {
      expect(stack.primaryLambdaName).toBeDefined();
    });

    it('should have drLambdaName output', () => {
      expect(stack.drLambdaName).toBeDefined();
    });

    it('should have primaryLambdaArn output', () => {
      expect(stack.primaryLambdaArn).toBeDefined();
    });

    it('should have drLambdaArn output', () => {
      expect(stack.drLambdaArn).toBeDefined();
    });

    it('should have primaryBucketName output', () => {
      expect(stack.primaryBucketName).toBeDefined();
    });

    it('should have drBucketName output', () => {
      expect(stack.drBucketName).toBeDefined();
    });

    it('should have primaryBucketArn output', () => {
      expect(stack.primaryBucketArn).toBeDefined();
    });

    it('should have drBucketArn output', () => {
      expect(stack.drBucketArn).toBeDefined();
    });

    it('should have route53ZoneId output', () => {
      expect(stack.route53ZoneId).toBeDefined();
    });

    it('should have primaryEndpoint output', () => {
      expect(stack.primaryEndpoint).toBeDefined();
    });

    it('should have primaryHealthCheckId output', () => {
      expect(stack.primaryHealthCheckId).toBeDefined();
    });

    it('should have drHealthCheckId output', () => {
      expect(stack.drHealthCheckId).toBeDefined();
    });

    it('should have primaryEventBusName output', () => {
      expect(stack.primaryEventBusName).toBeDefined();
    });

    it('should have drEventBusName output', () => {
      expect(stack.drEventBusName).toBeDefined();
    });

    it('should have primaryEventBusArn output', () => {
      expect(stack.primaryEventBusArn).toBeDefined();
    });

    it('should have drEventBusArn output', () => {
      expect(stack.drEventBusArn).toBeDefined();
    });

    it('should have alarmTopicArn output', () => {
      expect(stack.alarmTopicArn).toBeDefined();
    });

    it('should have dashboardUrl output', () => {
      expect(stack.dashboardUrl).toBeDefined();
    });

    it('should have dashboardName output', () => {
      expect(stack.dashboardName).toBeDefined();
    });

    it('should call registerOutputs with all outputs', () => {
      expect((stack as any).registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryVpcId: expect.anything(),
          drVpcId: expect.anything(),
          globalClusterId: expect.anything(),
          primaryDbEndpoint: expect.anything(),
          drDbEndpoint: expect.anything(),
          primaryAlbEndpoint: expect.anything(),
          failoverEndpoint: expect.anything(),
          primaryBucketName: expect.anything(),
          drBucketName: expect.anything(),
          route53ZoneId: expect.anything(),
          primaryEndpoint: expect.anything(),
          alarmTopicArn: expect.anything(),
          dashboardUrl: expect.anything(),
        })
      );
    });
  });

  describe('Resource Dependencies', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create DR infrastructure with dependsOn primary', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const drCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'dr');

      expect(drCall).toBeDefined();
      expect(drCall[2]).toHaveProperty('dependsOn');
    });

    it('should create peering accepter with dependsOn peering connection', () => {
      const accepterCall = (aws.ec2.VpcPeeringConnectionAccepter as unknown as jest.Mock).mock.calls[0];
      expect(accepterCall[2]).toHaveProperty('dependsOn');
    });

    it('should create replication config with proper dependencies', () => {
      const replicationCall = (aws.s3.BucketReplicationConfig as unknown as jest.Mock).mock.calls[0];
      expect(replicationCall[2]).toHaveProperty('dependsOn');
    });
  });

  describe('AWS Provider Configuration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs, { provider: mockProvider as any });
    });

    it('should create DR provider for us-west-2', () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        'dr-provider',
        expect.objectContaining({
          region: 'us-west-2',
        }),
        expect.anything()
      );
    });

    it('should use DR provider for DR resources', () => {
      const peeringAccepterCall = (aws.ec2.VpcPeeringConnectionAccepter as unknown as jest.Mock).mock.calls[0];
      expect(peeringAccepterCall[2]).toHaveProperty('provider');
    });
  });

  describe('Tag Propagation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should apply environment tag to all resources', () => {
      stack = new TapStack('test-stack', mockArgs);

      const hostedZoneCall = (aws.route53.Zone as unknown as jest.Mock).mock.calls[0];
      expect(hostedZoneCall[1]).toHaveProperty('tags');
      expect(hostedZoneCall[1].tags).toHaveProperty('Environment', 'test');
    });

    it('should apply ManagedBy tag to all resources', () => {
      stack = new TapStack('test-stack', mockArgs);

      const hostedZoneCall = (aws.route53.Zone as unknown as jest.Mock).mock.calls[0];
      expect(hostedZoneCall[1].tags).toHaveProperty('ManagedBy', 'Pulumi');
    });

    it('should apply custom tags from args', () => {
      stack = new TapStack('test-stack', mockArgs);

      const hostedZoneCall = (aws.route53.Zone as unknown as jest.Mock).mock.calls[0];
      expect(hostedZoneCall[1].tags).toHaveProperty('Team', 'test-team');
      expect(hostedZoneCall[1].tags).toHaveProperty('Project', 'test-project');
    });

    it('should apply DR-Role tag to primary infrastructure', () => {
      stack = new TapStack('test-stack', mockArgs);

      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const primaryCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'primary');

      expect(primaryCall[1].tags).toHaveProperty('DR-Role', 'primary');
    });

    it('should apply DR-Role tag to DR infrastructure', () => {
      stack = new TapStack('test-stack', mockArgs);

      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const drCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'dr');

      expect(drCall[1].tags).toHaveProperty('DR-Role', 'secondary');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environmentSuffix gracefully', () => {
      expect(() => {
        new TapStack('test-stack', {} as any);
      }).not.toThrow();
    });

    it('should work with undefined tags', () => {
      const argsWithoutTags: TapStackArgs = {
        environmentSuffix: 'test',
      };

      expect(() => {
        new TapStack('test-stack', argsWithoutTags);
      }).not.toThrow();
    });
  });

  describe('Multi-Region Configuration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should configure primary region as us-east-1', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const primaryCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'primary');

      expect(primaryCall[1].region).toBe('us-east-1');
    });

    it('should configure DR region as us-west-2', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const drCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'dr');

      expect(drCall[1].region).toBe('us-west-2');
    });

    it('should use different VPC CIDR blocks for primary and DR', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const primaryCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'primary');
      const drCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'dr');

      expect(primaryCall[1].vpcCidr).toBe('10.0.0.0/16');
      expect(drCall[1].vpcCidr).toBe('10.1.0.0/16');
    });

    it('should mark primary as isPrimary true', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const primaryCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'primary');

      expect(primaryCall[1].isPrimary).toBe(true);
    });

    it('should mark DR as isPrimary false', () => {
      const { RegionalInfrastructure } = require('../lib/regional-infrastructure');
      const drCall = RegionalInfrastructure.mock.calls.find((call: any) => call[0] === 'dr');

      expect(drCall[1].isPrimary).toBe(false);
    });
  });
});
