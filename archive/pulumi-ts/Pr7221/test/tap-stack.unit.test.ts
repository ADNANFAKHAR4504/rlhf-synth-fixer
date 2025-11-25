import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs = { ...args.inputs };

    // Set specific outputs for resources
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
      outputs.id = 'vpc-mock-id';
    } else if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.id = `subnet-mock-${args.name}`;
      outputs.vpcId = 'vpc-mock-id';
      outputs.cidrBlock = args.inputs.cidrBlock;
      outputs.availabilityZone = 'us-east-1a';
    } else if (args.type === 'aws:ec2/internetGateway:InternetGateway') {
      outputs.id = 'igw-mock-id';
    } else if (args.type === 'aws:ec2/eip:Eip') {
      outputs.id = 'eip-mock-id';
      outputs.publicIp = '1.2.3.4';
    } else if (args.type === 'aws:ec2/natGateway:NatGateway') {
      outputs.id = 'nat-mock-id';
    } else if (args.type === 'aws:ec2/routeTable:RouteTable') {
      outputs.id = `rt-mock-${args.name}`;
    } else if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.id = `sg-mock-${args.name}`;
    } else if (args.type === 'aws:kms/key:Key') {
      outputs.id = 'kms-mock-id';
      outputs.arn = 'arn:aws:kms:us-east-1:123456789012:key/mock-key-id';
      outputs.keyId = 'mock-key-id';
    } else if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.id = `bucket-mock-${args.name}`;
      outputs.arn = `arn:aws:s3:::bucket-mock-${args.name}`;
      outputs.bucket = args.inputs.bucket || `bucket-mock-${args.name}`;
    } else if (args.type === 'aws:secretsmanager/secret:Secret') {
      outputs.id = `secret-mock-${args.name}`;
      outputs.arn = `arn:aws:secretsmanager:us-east-1:123456789012:secret:${args.name}`;
    } else if (args.type === 'aws:secretsmanager/secretVersion:SecretVersion') {
      outputs.id = 'secret-version-mock-id';
      outputs.secretString = 'mock-password';
    } else if (args.type === 'aws:rds/subnetGroup:SubnetGroup') {
      outputs.id = 'db-subnet-group-mock-id';
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:rds/cluster:Cluster') {
      outputs.id = 'cluster-mock-id';
      outputs.clusterIdentifier = args.inputs.clusterIdentifier;
      outputs.endpoint = 'mock-cluster.region.rds.amazonaws.com';
      outputs.readerEndpoint = 'mock-cluster-ro.region.rds.amazonaws.com';
      outputs.port = 5432;
    } else if (args.type === 'aws:rds/clusterInstance:ClusterInstance') {
      outputs.id = `instance-mock-${args.name}`;
      outputs.endpoint = 'mock-instance.region.rds.amazonaws.com:5432';
    } else if (args.type === 'aws:ecs/cluster:Cluster') {
      outputs.id = 'ecs-cluster-mock-id';
      outputs.name = args.inputs.name;
      outputs.arn = `arn:aws:ecs:us-east-1:123456789012:cluster/${args.inputs.name}`;
    } else if (args.type === 'aws:ecr/repository:Repository') {
      outputs.id = 'ecr-mock-id';
      outputs.name = args.inputs.name;
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.id = `role-mock-${args.name}`;
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:ecs/taskDefinition:TaskDefinition') {
      outputs.id = 'task-def-mock-id';
      outputs.arn = 'arn:aws:ecs:us-east-1:123456789012:task-definition/mock:1';
      outputs.family = args.inputs.family;
      outputs.revision = 1;
    } else if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.id = 'alb-mock-id';
      outputs.arn = 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock-alb/mock-id';
      outputs.dnsName = 'mock-alb-123456.us-east-1.elb.amazonaws.com';
    } else if (args.type === 'aws:lb/targetGroup:TargetGroup') {
      outputs.id = `tg-mock-${args.name}`;
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}/mock-id`;
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:lb/listener:Listener') {
      outputs.id = 'listener-mock-id';
      outputs.arn = 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/mock-alb/mock-id/mock-listener';
    } else if (args.type === 'aws:ecs/service:Service') {
      outputs.id = 'service-mock-id';
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:cloudfront/distribution:Distribution') {
      outputs.id = 'cloudfront-mock-id';
      outputs.domainName = 'mock123.cloudfront.net';
      outputs.arn = 'arn:aws:cloudfront::123456789012:distribution/MOCK123';
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.id = `lambda-mock-${args.name}`;
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.id = 'topic-mock-id';
      outputs.arn = 'arn:aws:sns:us-east-1:123456789012:mock-topic';
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.id = 'dashboard-mock-id';
      outputs.dashboardName = args.inputs.dashboardName;
    } else if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      outputs.id = `alarm-mock-${args.name}`;
      outputs.arn = `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${args.name}`;
    } else {
      outputs.id = `${args.name}-id`;
    }

    return {
      id: outputs.id || `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (
      args.token === 'aws:secretsmanager/getRandomPassword:getRandomPassword'
    ) {
      return { randomPassword: 'mock-random-password-32chars' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    stack = new TapStack('test-tap-stack', {
      environmentSuffix: 'test',
      tags: { TestTag: 'TestValue' },
    });
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.databaseEndpoint).toBeDefined();
      expect(stack.databaseConnectionString).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should resolve vpcId output', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBe('vpc-mock-id');
    });
  });

  describe('ALB Configuration', () => {
    it('should resolve ALB DNS name', async () => {
      const albDns = await stack.albDnsName.promise();
      expect(albDns).toContain('elb.amazonaws.com');
    });
  });

  describe('CloudFront Configuration', () => {
    it('should resolve CloudFront distribution URL', async () => {
      const distributionUrl = await stack.distributionUrl.promise();
      expect(distributionUrl).toContain('cloudfront.net');
    });
  });

  describe('Database Configuration', () => {
    it('should resolve database endpoint', async () => {
      const dbEndpoint = await stack.databaseEndpoint.promise();
      expect(dbEndpoint).toContain('rds.amazonaws.com');
    });

    it('should create database connection string', async () => {
      const connString = await stack.databaseConnectionString.promise();
      expect(connString).toContain('postgresql://');
      expect(connString).toContain('paymentdb');
    });
  });

  describe('Stack with default values', () => {
    it('should create stack with default environment suffix', () => {
      const defaultStack = new TapStack('test-default-stack', {});
      expect(defaultStack).toBeDefined();
      expect(defaultStack.vpcId).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should apply environment suffix to resources', () => {
      const customStack = new TapStack('test-custom-env', {
        environmentSuffix: 'prod',
      });
      expect(customStack).toBeDefined();
      expect(customStack.vpcId).toBeDefined();
    });

    it('should use dev as default environment suffix', () => {
      const devStack = new TapStack('test-dev-stack', {});
      expect(devStack).toBeDefined();
    });
  });

  describe('Tag Configuration', () => {
    it('should apply custom tags', () => {
      const taggedStack = new TapStack('test-tagged-stack', {
        environmentSuffix: 'test',
        tags: { CustomTag: 'CustomValue', Project: 'TestProject' },
      });
      expect(taggedStack).toBeDefined();
    });

    it('should apply default tags', () => {
      const defaultTagStack = new TapStack('test-default-tag-stack', {
        environmentSuffix: 'test',
      });
      expect(defaultTagStack).toBeDefined();
    });
  });

  describe('Output Types', () => {
    it('should have Output type for vpcId', () => {
      expect(stack.vpcId).toBeInstanceOf(pulumi.Output);
    });

    it('should have Output type for albDnsName', () => {
      expect(stack.albDnsName).toBeInstanceOf(pulumi.Output);
    });

    it('should have Output type for distributionUrl', () => {
      expect(stack.distributionUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should have Output type for databaseEndpoint', () => {
      expect(stack.databaseEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('should have Output type for databaseConnectionString', () => {
      expect(stack.databaseConnectionString).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Resource Creation', () => {
    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      expect((stack as any).__pulumiType).toBe('tap:stack:TapStack');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty tags object', () => {
      const noTagsStack = new TapStack('test-no-tags', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(noTagsStack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const undefinedTagsStack = new TapStack('test-undefined-tags', {
        environmentSuffix: 'test',
      });
      expect(undefinedTagsStack).toBeDefined();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should create multiple independent stacks', () => {
      const stack1 = new TapStack('test-stack-1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new TapStack('test-stack-2', {
        environmentSuffix: 'env2',
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });
  });

  describe('Output Promise Resolution', () => {
    it('should resolve all outputs without errors', async () => {
      await expect(stack.vpcId.promise()).resolves.toBeDefined();
      await expect(stack.albDnsName.promise()).resolves.toBeDefined();
      await expect(stack.distributionUrl.promise()).resolves.toBeDefined();
      await expect(stack.databaseEndpoint.promise()).resolves.toBeDefined();
      await expect(
        stack.databaseConnectionString.promise()
      ).resolves.toBeDefined();
    });
  });
});
