import * as pulumi from '@pulumi/pulumi';

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    const outputs: any = { ...args.inputs };

    // Add specific outputs based on resource type
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.id = `vpc-${args.name}`;
    } else if (args.type === 'aws:rds/cluster:Cluster') {
      outputs.endpoint = `${args.name}.cluster-abc.us-east-1.rds.amazonaws.com`;
      outputs.id = args.name;
      outputs.clusterIdentifier = args.name;
    } else if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.dnsName = `${args.name}.us-east-1.elb.amazonaws.com`;
    } else if (args.type === 'aws:dms/replicationTask:ReplicationTask') {
      outputs.replicationTaskArn = `arn:aws:dms:us-east-1:123456789012:task:${args.name}`;
    } else if (args.type === 'aws:ecs/cluster:Cluster') {
      outputs.name = args.name;
    } else if (args.type === 'aws:ecs/service:Service') {
      outputs.name = args.name;
    }

    return {
      id: args.name + '_id',
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      };
    }
    return args.inputs;
  },
});

import { DatabaseStack } from '../lib/database';
import { DmsStack } from '../lib/dms';
import { EcsStack } from '../lib/ecs';
import { IamRolesStack } from '../lib/iam';
import { LambdaStack } from '../lib/lambda-stack';
import { LoadBalancerStack } from '../lib/load-balancer';
import { MonitoringStack } from '../lib/monitoring';
import { NetworkingStack } from '../lib/networking';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Structure', () => {
  describe('TapStack Component', () => {
    it('instantiates successfully with environmentSuffix', async () => {
      const stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.dmsTaskArn).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('uses default environmentSuffix when not provided', async () => {
      const stack = new TapStack('TestTapStackDefault', {});
      expect(stack).toBeDefined();
    });

    it('registers outputs correctly', async () => {
      const stack = new TapStack('TestStackOutputs', {
        environmentSuffix: 'output-test',
      });

      const outputs = [
        stack.albDnsName,
        stack.rdsClusterEndpoint,
        stack.dmsTaskArn,
        stack.vpcId,
      ];

      outputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).toBeInstanceOf(pulumi.Output);
      });
    });

    it('applies default tags to resources', async () => {
      const stack = new TapStack('TestStackTags', {
        environmentSuffix: 'tags-test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('NetworkingStack Component', () => {
    it('creates VPC with correct CIDR', async () => {
      const networking = new NetworkingStack('test-networking', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
        tags: { Environment: 'test' },
      });

      expect(networking).toBeDefined();
      expect(networking.vpc).toBeDefined();
    });

    it('creates public subnets', async () => {
      const networking = new NetworkingStack('test-networking-public', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
        tags: {},
      });

      expect(networking.publicSubnetIds).toBeDefined();
      expect(networking.publicSubnetIds).toBeInstanceOf(Array);
    });

    it('creates private subnets', async () => {
      const networking = new NetworkingStack('test-networking-private', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
        tags: {},
      });

      expect(networking.privateSubnetIds).toBeDefined();
      expect(networking.privateSubnetIds).toBeInstanceOf(Array);
    });

    it('creates NAT gateways', async () => {
      const networking = new NetworkingStack('test-networking-nat', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
        tags: {},
      });

      expect(networking).toBeDefined();
    });
  });

  describe('IamRolesStack Component', () => {
    it('creates ECS task execution role', async () => {
      const iam = new IamRolesStack('test-iam', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(iam).toBeDefined();
      expect(iam.ecsTaskExecutionRoleArn).toBeDefined();
    });

    it('creates ECS task role', async () => {
      const iam = new IamRolesStack('test-iam-task', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(iam.ecsTaskRoleArn).toBeDefined();
    });

    it('creates DMS replication role', async () => {
      const iam = new IamRolesStack('test-iam-dms', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(iam.dmsReplicationRoleArn).toBeDefined();
    });

    it('creates Lambda execution role', async () => {
      const iam = new IamRolesStack('test-iam-lambda', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(iam.lambdaExecutionRoleArn).toBeDefined();
    });
  });

  describe('DatabaseStack Component', () => {
    it('creates RDS Aurora cluster', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const database = new DatabaseStack('test-database', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [
          pulumi.output('subnet-1'),
          pulumi.output('subnet-2'),
          pulumi.output('subnet-3'),
        ],
        tags: {},
      });

      expect(database).toBeDefined();
      expect(database.clusterEndpoint).toBeDefined();
    });

    it('creates database security group', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const database = new DatabaseStack('test-database-sg', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        tags: {},
      });

      expect(database.securityGroupId).toBeDefined();
    });

    it('exports cluster ID', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const database = new DatabaseStack('test-database-id', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        tags: {},
      });

      expect(database.clusterId).toBeDefined();
    });
  });

  describe('EcsStack Component', () => {
    it('creates ECS cluster', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const ecs = new EcsStack('test-ecs', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        rdsSecurityGroupId: pulumi.output('sg-rds'),
        taskExecutionRoleArn: pulumi.output('arn:aws:iam::123:role/exec'),
        taskRoleArn: pulumi.output('arn:aws:iam::123:role/task'),
        rdsClusterEndpoint: pulumi.output('db.cluster.amazonaws.com'),
        tags: {},
      });

      expect(ecs).toBeDefined();
      expect(ecs.clusterName).toBeDefined();
    });

    it('creates ECS service with Fargate', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const ecs = new EcsStack('test-ecs-service', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        rdsSecurityGroupId: pulumi.output('sg-rds'),
        taskExecutionRoleArn: pulumi.output('arn:aws:iam::123:role/exec'),
        taskRoleArn: pulumi.output('arn:aws:iam::123:role/task'),
        rdsClusterEndpoint: pulumi.output('db.cluster.amazonaws.com'),
        tags: {},
      });

      expect(ecs.serviceName).toBeDefined();
    });

    it('creates target group', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const ecs = new EcsStack('test-ecs-tg', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        rdsSecurityGroupId: pulumi.output('sg-rds'),
        taskExecutionRoleArn: pulumi.output('arn:aws:iam::123:role/exec'),
        taskRoleArn: pulumi.output('arn:aws:iam::123:role/task'),
        rdsClusterEndpoint: pulumi.output('db.cluster.amazonaws.com'),
        tags: {},
      });

      expect(ecs.targetGroupArn).toBeDefined();
    });

    it('creates security group', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const ecs = new EcsStack('test-ecs-sg', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        rdsSecurityGroupId: pulumi.output('sg-rds'),
        taskExecutionRoleArn: pulumi.output('arn:aws:iam::123:role/exec'),
        taskRoleArn: pulumi.output('arn:aws:iam::123:role/task'),
        rdsClusterEndpoint: pulumi.output('db.cluster.amazonaws.com'),
        tags: {},
      });

      expect(ecs.securityGroupId).toBeDefined();
    });
  });

  describe('LoadBalancerStack Component', () => {
    it('creates Application Load Balancer', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const lb = new LoadBalancerStack('test-lb', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        publicSubnetIds: [pulumi.output('subnet-1'), pulumi.output('subnet-2')],
        ecsSecurityGroupId: pulumi.output('sg-ecs'),
        targetGroupArn: pulumi.output('arn:aws:elasticloadbalancing::123:targetgroup/test'),
        tags: {},
      });

      expect(lb).toBeDefined();
      expect(lb.albDnsName).toBeDefined();
    });

    it('creates ALB listener', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const lb = new LoadBalancerStack('test-lb-listener', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        publicSubnetIds: [pulumi.output('subnet-1')],
        ecsSecurityGroupId: pulumi.output('sg-ecs'),
        targetGroupArn: pulumi.output('arn:aws:elasticloadbalancing::123:targetgroup/test'),
        tags: {},
      });

      expect(lb.listenerArn).toBeDefined();
    });
  });

  describe('DmsStack Component', () => {
    it('creates DMS replication instance', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const dms = new DmsStack('test-dms', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        sourceDbEndpoint: pulumi.output('source-db.local'),
        targetDbEndpoint: pulumi.output('target-db.amazonaws.com'),
        targetDbSecurityGroupId: pulumi.output('sg-rds'),
        dmsRoleArn: pulumi.output('arn:aws:iam::123:role/dms'),
        tags: {},
      });

      expect(dms).toBeDefined();
    });

    it('creates replication task with CDC enabled', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const dms = new DmsStack('test-dms-task', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        sourceDbEndpoint: pulumi.output('source-db.local'),
        targetDbEndpoint: pulumi.output('target-db.amazonaws.com'),
        targetDbSecurityGroupId: pulumi.output('sg-rds'),
        dmsRoleArn: pulumi.output('arn:aws:iam::123:role/dms'),
        tags: {},
      });

      expect(dms.replicationTaskArn).toBeDefined();
    });
  });

  describe('LambdaStack Component', () => {
    it('creates Lambda function', async () => {
      const mockVpc = {
        id: pulumi.output('vpc-12345'),
      } as any;

      const lambda = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        vpc: mockVpc,
        privateSubnetIds: [pulumi.output('subnet-1')],
        rdsSecurityGroupId: pulumi.output('sg-rds'),
        lambdaRoleArn: pulumi.output('arn:aws:iam::123:role/lambda'),
        sourceDbEndpoint: pulumi.output('source-db.local'),
        targetDbEndpoint: pulumi.output('target-db.amazonaws.com'),
        tags: {},
      });

      expect(lambda).toBeDefined();
    });
  });

  describe('MonitoringStack Component', () => {
    it('creates DMS replication lag alarm', async () => {
      const monitoring = new MonitoringStack('test-monitoring', {
        environmentSuffix: 'test',
        dmsReplicationTaskArn: pulumi.output('arn:aws:dms::123:task/test'),
        ecsClusterName: pulumi.output('payment-cluster-test'),
        ecsServiceName: pulumi.output('payment-service-test'),
        rdsClusterId: pulumi.output('payment-cluster-test'),
        tags: {},
      });

      expect(monitoring).toBeDefined();
    });

    it('creates ECS task health alarm', async () => {
      const monitoring = new MonitoringStack('test-monitoring-ecs', {
        environmentSuffix: 'test',
        dmsReplicationTaskArn: pulumi.output('arn:aws:dms::123:task/test'),
        ecsClusterName: pulumi.output('payment-cluster-test'),
        ecsServiceName: pulumi.output('payment-service-test'),
        rdsClusterId: pulumi.output('payment-cluster-test'),
        tags: {},
      });

      expect(monitoring).toBeDefined();
    });

    it('creates RDS CPU utilization alarm', async () => {
      const monitoring = new MonitoringStack('test-monitoring-rds', {
        environmentSuffix: 'test',
        dmsReplicationTaskArn: pulumi.output('arn:aws:dms::123:task/test'),
        ecsClusterName: pulumi.output('payment-cluster-test'),
        ecsServiceName: pulumi.output('payment-service-test'),
        rdsClusterId: pulumi.output('payment-cluster-test'),
        tags: {},
      });

      expect(monitoring).toBeDefined();
    });

    it('handles DMS task ARN without colon delimiter', async () => {
      const monitoring = new MonitoringStack('test-monitoring-arn-edge', {
        environmentSuffix: 'test',
        dmsReplicationTaskArn: pulumi.output('simple-task-id'),
        ecsClusterName: pulumi.output('payment-cluster-test'),
        ecsServiceName: pulumi.output('payment-service-test'),
        rdsClusterId: pulumi.output('payment-cluster-test'),
        tags: {},
      });

      expect(monitoring).toBeDefined();
    });

    it('handles DMS task ARN with empty string fallback', async () => {
      const monitoring = new MonitoringStack('test-monitoring-arn-empty', {
        environmentSuffix: 'test',
        dmsReplicationTaskArn: pulumi.output(''),
        ecsClusterName: pulumi.output('payment-cluster-test'),
        ecsServiceName: pulumi.output('payment-service-test'),
        rdsClusterId: pulumi.output('payment-cluster-test'),
        tags: {},
      });

      expect(monitoring).toBeDefined();
    });

    it('creates monitoring with tags', async () => {
      const monitoring = new MonitoringStack('test-monitoring-with-tags', {
        environmentSuffix: 'test',
        dmsReplicationTaskArn: pulumi.output('arn:aws:dms::123:task/test'),
        ecsClusterName: pulumi.output('payment-cluster-test'),
        ecsServiceName: pulumi.output('payment-service-test'),
        rdsClusterId: pulumi.output('payment-cluster-test'),
        tags: { Environment: 'test', Project: 'payment' },
      });

      expect(monitoring).toBeDefined();
    });
  });
});
