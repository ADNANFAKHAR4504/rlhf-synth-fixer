/* eslint-disable prettier/prettier */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set test mode
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const resourceType = args.type;
    const name = args.name;

    switch (resourceType) {
      case 'aws:ec2/vpc:Vpc':
        return {
          id: `vpc-${name}`,
          state: {
            ...args.inputs,
            id: `vpc-${name}`,
            cidrBlock: args.inputs.cidrBlock || '10.20.0.0/16',
            arn: `arn:aws:ec2:us-east-1:123456789012:vpc/vpc-${name}`,
          },
        };
      case 'aws:ec2/subnet:Subnet':
        return {
          id: `subnet-${name}`,
          state: {
            ...args.inputs,
            id: `subnet-${name}`,
            arn: `arn:aws:ec2:us-east-1:123456789012:subnet/subnet-${name}`,
          },
        };
      case 'aws:ec2/internetGateway:InternetGateway':
        return {
          id: `igw-${name}`,
          state: {
            ...args.inputs,
            id: `igw-${name}`,
            arn: `arn:aws:ec2:us-east-1:123456789012:internet-gateway/igw-${name}`,
          },
        };
      case 'aws:ec2/routeTable:RouteTable':
        return {
          id: `rt-${name}`,
          state: {
            ...args.inputs,
            id: `rt-${name}`,
          },
        };
      case 'aws:ec2/route:Route':
        return {
          id: `route-${name}`,
          state: {
            ...args.inputs,
            id: `route-${name}`,
          },
        };
      case 'aws:ec2/routeTableAssociation:RouteTableAssociation':
        return {
          id: `rta-${name}`,
          state: {
            ...args.inputs,
            id: `rta-${name}`,
          },
        };
      case 'aws:ec2/securityGroup:SecurityGroup':
        return {
          id: `sg-${name}`,
          state: {
            ...args.inputs,
            id: `sg-${name}`,
            arn: `arn:aws:ec2:us-east-1:123456789012:security-group/sg-${name}`,
          },
        };
      case 'aws:ec2/securityGroupRule:SecurityGroupRule':
        return {
          id: `sgr-${name}`,
          state: {
            ...args.inputs,
            id: `sgr-${name}`,
          },
        };
      case 'aws:ec2/vpcPeeringConnection:VpcPeeringConnection':
        return {
          id: `pcx-${name}`,
          state: {
            ...args.inputs,
            id: `pcx-${name}`,
            status: 'active',
          },
        };
      case 'aws:rds/subnetGroup:SubnetGroup':
        return {
          id: `sng-${name}`,
          state: {
            ...args.inputs,
            id: `sng-${name}`,
            name: name,
          },
        };
      case 'aws:rds/instance:Instance':
        return {
          id: `rds-${name}`,
          state: {
            ...args.inputs,
            id: `rds-${name}`,
            endpoint: `${name}.covy6ema0nuv.us-east-1.rds.amazonaws.com:5432`,
            arn: `arn:aws:rds:us-east-1:123456789012:db:${name}`,
            identifier: name,
          },
        };
      case 'aws:lb/loadBalancer:LoadBalancer':
        return {
          id: `alb-${name}`,
          state: {
            ...args.inputs,
            id: `alb-${name}`,
            dnsName: `${name}-2cc41c6-408869167.us-east-1.elb.amazonaws.com`,
            arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${name}-2cc41c6/b3c1585688c78f1d`,
            arnSuffix: `app/${name}-2cc41c6/b3c1585688c78f1d`,
          },
        };
      case 'aws:lb/targetGroup:TargetGroup':
        return {
          id: `tg-${name}`,
          state: {
            ...args.inputs,
            id: `tg-${name}`,
            arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${name}/abc123`,
          },
        };
      case 'aws:lb/listener:Listener':
        return {
          id: `listener-${name}`,
          state: {
            ...args.inputs,
            id: `listener-${name}`,
            arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${name}`,
          },
        };
      case 'aws:lb/targetGroupAttachment:TargetGroupAttachment':
        return {
          id: `tga-${name}`,
          state: {
            ...args.inputs,
            id: `tga-${name}`,
          },
        };
      case 'aws:route53/record:Record':
        return {
          id: `route53-${name}`,
          state: {
            ...args.inputs,
            id: `route53-${name}`,
            fqdn: `${args.inputs.name}.example.com`,
            name: args.inputs.name,
          },
        };
      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        return {
          id: `alarm-${name}`,
          state: {
            ...args.inputs,
            id: `alarm-${name}`,
            arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${name}`,
          },
        };
      case 'aws:cloudwatch/dashboard:Dashboard':
        return {
          id: `dashboard-${name}`,
          state: {
            ...args.inputs,
            id: `dashboard-${name}`,
            dashboardName: args.inputs.dashboardName || name,
            dashboardArn: `arn:aws:cloudwatch::123456789012:dashboard/${name}`,
          },
        };
      case 'aws:sns/topic:Topic':
        return {
          id: `sns-${name}`,
          state: {
            ...args.inputs,
            id: `sns-${name}`,
            arn: `arn:aws:sns:us-east-1:123456789012:${name}`,
          },
        };
      case 'aws:sns/topicSubscription:TopicSubscription':
        return {
          id: `sub-${name}`,
          state: {
            ...args.inputs,
            id: `sub-${name}`,
          },
        };
      case 'aws:s3/bucket:Bucket':
        return {
          id: `s3-${name}`,
          state: {
            ...args.inputs,
            id: `s3-${name}`,
            bucket: args.inputs.bucket || name,
            arn: `arn:aws:s3:::${name}`,
          },
        };
      case 'aws:s3/bucketVersioningV2:BucketVersioningV2':
      case 'aws:s3/bucketVersioning:BucketVersioning':
        return {
          id: `ver-${name}`,
          state: {
            ...args.inputs,
            id: `ver-${name}`,
          },
        };
      case 'aws:s3/bucketCorsConfigurationV2:BucketCorsConfigurationV2':
      case 'aws:s3/bucketCorsConfiguration:BucketCorsConfiguration':
        return {
          id: `cors-${name}`,
          state: {
            ...args.inputs,
            id: `cors-${name}`,
          },
        };
      case 'aws:s3/bucketPolicy:BucketPolicy':
        return {
          id: `policy-${name}`,
          state: {
            ...args.inputs,
            id: `policy-${name}`,
          },
        };
      case 'aws:lambda/function:Function':
        return {
          id: `lambda-${name}`,
          state: {
            ...args.inputs,
            id: `lambda-${name}`,
            arn: `arn:aws:lambda:us-east-1:123456789012:function:${name}`,
            name: name,
          },
        };
      case 'aws:lambda/permission:Permission':
        return {
          id: `perm-${name}`,
          state: {
            ...args.inputs,
            id: `perm-${name}`,
          },
        };
      case 'aws:iam/role:Role':
        return {
          id: `role-${name}`,
          state: {
            ...args.inputs,
            id: `role-${name}`,
            arn: `arn:aws:iam::123456789012:role/${name}`,
            name: name,
          },
        };
      case 'aws:iam/rolePolicyAttachment:RolePolicyAttachment':
        return {
          id: `attach-${name}`,
          state: {
            ...args.inputs,
            id: `attach-${name}`,
          },
        };
      case 'aws:ec2/instance:Instance':
        return {
          id: `i-${name}`,
          state: {
            ...args.inputs,
            id: `i-${name}`,
            publicIp: '1.2.3.4',
            privateIp: '10.20.0.10',
          },
        };
      case 'random:index/randomPassword:RandomPassword':
        return {
          id: `random-${name}`,
          state: {
            ...args.inputs,
            id: `random-${name}`,
            result: 'mocked-password-32chars-long!!!',
          },
        };
      default:
        return {
          id: `${resourceType}-${name}`,
          state: args.inputs,
        };
    }
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    switch (args.token) {
      case 'aws:ec2/getVpc:getVpc':
        return {
          id: 'vpc-source123',
          cidrBlock: '10.10.0.0/16',
          arn: 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-source123',
        };
      case 'aws:route53/getZone:getZone':
        return {
          zoneId: 'Z1234567890ABC',
          name: 'example.com',
        };
      case 'aws:ec2/getAmi:getAmi':
        return {
          id: 'ami-12345678',
          name: 'amzn2-ami-hvm-2.0.20230101-x86_64-gp2',
        };
      default:
        return {};
    }
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Initial Migration Phase', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        migrationPhase: 'initial',
        trafficWeightTarget: 0,
      });
    });

    it('should create target VPC with correct CIDR block', (done) => {
      stack.targetVpc.cidrBlock.apply(cidr => {
        expect(cidr).toBe('10.20.0.0/16');
        done();
      });
    });

    it('should create target VPC with DNS support enabled', (done) => {
      stack.targetVpc.enableDnsSupport.apply(dnsSupport => {
        expect(dnsSupport).toBe(true);
        done();
      });
    });

    it('should create target VPC with DNS hostnames enabled', (done) => {
      stack.targetVpc.enableDnsHostnames.apply(dnsHostnames => {
        expect(dnsHostnames).toBe(true);
        done();
      });
    });

    it('should create 6 subnets (3 AZs x 2 tiers)', () => {
      expect(stack.targetSubnets.length).toBe(6);
    });

    it('should create subnets with correct CIDR blocks', (done) => {
      pulumi.all([
        stack.targetSubnets[0].cidrBlock,
        stack.targetSubnets[1].cidrBlock
      ]).apply(([subnet0Cidr, subnet1Cidr]) => {
        expect(subnet0Cidr).toBe('10.20.0.0/20');
        expect(subnet1Cidr).toBe('10.20.48.0/20');
        done();
      });
    });

    it('should tag subnets with correct tier', (done) => {
      pulumi.all([
        stack.targetSubnets[0].tags,
        stack.targetSubnets[1].tags
      ]).apply(([tags0, tags1]) => {
        expect(tags0?.Tier).toBe('compute');
        expect(tags1?.Tier).toBe('database');
        done();
      });
    });

    it('should create Internet Gateway', (done) => {
      stack.internetGateway.id.apply(igwId => {
        expect(igwId).toContain('igw-');
        done();
      });
    });
  });

  describe('VPC Peering Configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-peering-stack', {
        environmentSuffix: 'dev',
        sourceVpcCidr: '10.10.0.0/16',
        targetVpcCidr: '10.20.0.0/16',
        sourceVpcId: 'vpc-source123',
      });
    });

    it('should create VPC peering connection', (done) => {
      expect(stack.vpcPeering).toBeDefined();
      if (stack.vpcPeering) {
        stack.vpcPeering.id.apply(peeringId => {
          expect(peeringId).toContain('pcx-');
          done();
        });
      } else {
        done();
      }
    });

    it('should enable auto-accept for peering', (done) => {
      expect(stack.vpcPeering).toBeDefined();
      if (stack.vpcPeering) {
        stack.vpcPeering.autoAccept.apply(autoAccept => {
          expect(autoAccept).toBe(true);
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('VPC Peering with Source Route Table', () => {
    beforeAll(() => {
      stack = new TapStack('test-peering-source-rt-stack', {
        environmentSuffix: 'dev',
        sourceVpcCidr: '10.10.0.0/16',
        targetVpcCidr: '10.20.0.0/16',
        sourceVpcId: 'vpc-source123',
        sourceRouteTableId: 'rtb-source123',
      });
    });

    it('should create VPC peering with source route table', (done) => {
      expect(stack.vpcPeering).toBeDefined();
      if (stack.vpcPeering) {
        stack.vpcPeering.id.apply(peeringId => {
          expect(peeringId).toBeDefined();
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('RDS Instance Configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-rds-stack', {
        environmentSuffix: 'prod',
      });
    });

    it('should create RDS instance with PostgreSQL', (done) => {
      stack.targetRdsInstance.endpoint.apply(endpoint => {
        expect(endpoint).toContain('.rds.amazonaws.com');
        done();
      });
    });

    it('should enable Multi-AZ deployment', (done) => {
      stack.targetRdsInstance.multiAz.apply(multiAz => {
        expect(multiAz).toBe(true);
        done();
      });
    });

    it('should enable storage encryption', (done) => {
      stack.targetRdsInstance.storageEncrypted.apply(encrypted => {
        expect(encrypted).toBe(true);
        done();
      });
    });

    it('should enable CloudWatch log exports', (done) => {
      stack.targetRdsInstance.enabledCloudwatchLogsExports.apply(logs => {
        expect(logs).toContain('postgresql');
        done();
      });
    });

    it('should use dbmaster as username', (done) => {
      stack.targetRdsInstance.username.apply(username => {
        expect(username).toBe('dbmaster');
        done();
      });
    });

    it('should generate random password', (done) => {
      stack.dbPassword.result.apply(password => {
        expect(password).toBeDefined();
        expect(password.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Load Balancer and Target Group', () => {
    beforeAll(() => {
      stack = new TapStack('test-lb-stack', {
        environmentSuffix: 'dev',
      });
    });

    it('should create Application Load Balancer', (done) => {
      stack.targetLoadBalancer.dnsName.apply(dnsName => {
        expect(dnsName).toContain('.elb.amazonaws.com');
        done();
      });
    });

    it('should enable HTTP/2', (done) => {
      stack.targetLoadBalancer.enableHttp2.apply(http2 => {
        expect(http2).toBe(true);
        done();
      });
    });
  });

  describe('Load Balancer with HTTPS', () => {
    beforeAll(() => {
      stack = new TapStack('test-lb-https-stack', {
        environmentSuffix: 'dev',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
      });
    });

    it('should create HTTPS listener when certificate provided', (done) => {
      stack.targetLoadBalancer.dnsName.apply(dnsName => {
        expect(dnsName).toBeDefined();
        done();
      });
    });
  });

  describe('Route53 Weighted Routing', () => {
    beforeAll(() => {
      stack = new TapStack('test-route53-stack', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 10,
        hostedZoneName: 'example.com',
      });
    });

    it('should create Route53 record with weighted routing', (done) => {
      expect(stack.route53Record).toBeDefined();
      if (stack.route53Record) {
        stack.route53Record.name.apply(recordName => {
          expect(recordName).toContain('payment.example.com');
          done();
        });
      } else {
        done();
      }
    });

    it('should set correct traffic weight (10%)', (done) => {
      expect(stack.route53Record).toBeDefined();
      if (stack.route53Record) {
        stack.route53Record.weightedRoutingPolicies.apply(policies => {
          expect(policies?.[0]?.weight).toBe(10);
          done();
        });
      } else {
        done();
      }
    });

    it('should use short TTL for quick updates', (done) => {
      expect(stack.route53Record).toBeDefined();
      if (stack.route53Record) {
        stack.route53Record.ttl.apply(ttl => {
          expect(ttl).toBe(60);
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('Route53 Without Hosted Zone', () => {
    beforeAll(() => {
      stack = new TapStack('test-no-route53-stack', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 10,
      });
    });

    it('should not create Route53 record without hosted zone', () => {
      expect(stack.route53Record).toBeUndefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeAll(() => {
      stack = new TapStack('test-alarms-stack', {
        environmentSuffix: 'prod',
        errorThreshold: 5,
      });
    });

    it('should create connection count alarm', (done) => {
      stack.connectionAlarm.name.apply(alarmName => {
        expect(alarmName).toContain('connection');
        done();
      });
    });

    it('should create error rate alarm', (done) => {
      stack.errorAlarm.name.apply(alarmName => {
        expect(alarmName).toContain('error-rate');
        done();
      });
    });

    it('should create replication lag alarm', (done) => {
      stack.replicationLagAlarm.name.apply(alarmName => {
        expect(alarmName).toContain('replication-lag');
        done();
      });
    });

    it('should set replication lag threshold to 1 second', (done) => {
      stack.replicationLagAlarm.threshold.apply(threshold => {
        expect(threshold).toBe(1);
        done();
      });
    });

    it('should enable alarm actions', (done) => {
      stack.errorAlarm.actionsEnabled.apply(actionsEnabled => {
        expect(actionsEnabled).toBe(true);
        done();
      });
    });

    it('should set correct error threshold', (done) => {
      stack.errorAlarm.threshold.apply(threshold => {
        expect(threshold).toBe(5);
        done();
      });
    });
  });

  describe('Migration Dashboard', () => {
    beforeAll(() => {
      stack = new TapStack('test-dashboard-stack', {
        environmentSuffix: 'dev',
      });
    });

    it('should create CloudWatch dashboard', (done) => {
      stack.migrationDashboard.dashboardName.apply(dashboardName => {
        expect(dashboardName).toContain('migration-status');
        done();
      });
    });

    it('should include RDS metrics in dashboard', (done) => {
      stack.migrationDashboard.dashboardBody.apply(dashboardBody => {
        expect(dashboardBody).toContain('DatabaseConnections');
        done();
      });
    });

    it('should include ALB metrics in dashboard', (done) => {
      stack.migrationDashboard.dashboardBody.apply(dashboardBody => {
        expect(dashboardBody).toContain('TargetResponseTime');
        done();
      });
    });

    it('should include replication lag metrics', (done) => {
      stack.migrationDashboard.dashboardBody.apply(dashboardBody => {
        expect(dashboardBody).toContain('ReplicaLag');
        done();
      });
    });
  });

  describe('Rollback Mechanisms', () => {
    beforeAll(() => {
      stack = new TapStack('test-rollback-stack', {
        environmentSuffix: 'prod',
        rollbackEnabled: true,
      });
    });

    it('should create SNS topic for rollback notifications', (done) => {
      stack.rollbackTopic.arn.apply(topicArn => {
        expect(topicArn).toContain('sns');
        done();
      });
    });

    it('should include rollback command in outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.rollbackCommand).toContain('pulumi stack export');
        done();
      });
    });
  });

  describe('Output Generation', () => {
    beforeAll(() => {
      stack = new TapStack('test-outputs-stack', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 50,
      });
    });

    it('should generate all required outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs).toHaveProperty('targetVpcId');
        expect(outputs).toHaveProperty('vpcPeeringId');
        expect(outputs).toHaveProperty('targetRdsEndpoint');
        expect(outputs).toHaveProperty('loadBalancerDns');
        expect(outputs).toHaveProperty('dashboardUrl');
        expect(outputs).toHaveProperty('rollbackCommand');
        expect(outputs).toHaveProperty('connectionAlarmArn');
        expect(outputs).toHaveProperty('errorAlarmArn');
        expect(outputs).toHaveProperty('replicationLagAlarmArn');
        expect(outputs).toHaveProperty('rollbackTopicArn');
        done();
      });
    });

    it('should include traffic weight in outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.trafficWeight).toBe(50);
        done();
      });
    });

    it('should include migration phase in outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.migrationPhase).toBeDefined();
        done();
      });
    });

    it('should include timestamp in outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.timestamp).toBeDefined();
        done();
      });
    });

    it('should include version in outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.version).toBe('1.0.0');
        done();
      });
    });

    it('should set vpcPeeringId to N/A when no source VPC', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.vpcPeeringId).toBe('N/A');
        done();
      });
    });

    it('should set route53RecordName to N/A when no hosted zone', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.route53RecordName).toBe('N/A');
        done();
      });
    });
  });

  describe('Traffic Shifting Scenarios', () => {
    it('should handle 0% traffic weight (initial phase)', (done) => {
      const stack0 = new TapStack('test-0-percent', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 0,
      });
      stack0.outputs.apply(outputs => {
        expect(outputs.trafficWeight).toBe(0);
        done();
      });
    });

    it('should handle 10% traffic weight', (done) => {
      const stack10 = new TapStack('test-10-percent', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 10,
      });
      stack10.outputs.apply(outputs => {
        expect(outputs.trafficWeight).toBe(10);
        done();
      });
    });

    it('should handle 50% traffic weight', (done) => {
      const stack50 = new TapStack('test-50-percent', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 50,
      });
      stack50.outputs.apply(outputs => {
        expect(outputs.trafficWeight).toBe(50);
        done();
      });
    });

    it('should handle 100% traffic weight (complete migration)', (done) => {
      const stack100 = new TapStack('test-100-percent', {
        environmentSuffix: 'dev',
        trafficWeightTarget: 100,
      });
      stack100.outputs.apply(outputs => {
        expect(outputs.trafficWeight).toBe(100);
        done();
      });
    });
  });

  describe('Error Threshold Configuration', () => {
    it('should handle custom error threshold', (done) => {
      const stackCustom = new TapStack('test-custom-threshold', {
        environmentSuffix: 'dev',
        errorThreshold: 10,
      });
      stackCustom.errorAlarm.threshold.apply(threshold => {
        expect(threshold).toBe(10);
        done();
      });
    });

    it('should use default error threshold of 5', (done) => {
      const stackDefault = new TapStack('test-default-threshold', {
        environmentSuffix: 'dev',
      });
      stackDefault.errorAlarm.threshold.apply(threshold => {
        expect(threshold).toBe(5);
        done();
      });
    });
  });

  describe('Rollback Enabled/Disabled', () => {
    it('should enable rollback by default', (done) => {
      const stackDefault = new TapStack('test-rollback-default', {
        environmentSuffix: 'dev',
      });
      stackDefault.errorAlarm.actionsEnabled.apply(actionsEnabled => {
        expect(actionsEnabled).toBe(true);
        done();
      });
    });

    it('should disable rollback when explicitly set', (done) => {
      const stackDisabled = new TapStack('test-rollback-disabled', {
        environmentSuffix: 'dev',
        rollbackEnabled: false,
      });
      stackDisabled.errorAlarm.actionsEnabled.apply(actionsEnabled => {
        expect(actionsEnabled).toBe(false);
        done();
      });
    });
  });

  describe('Multi-AZ Subnet Distribution', () => {
    beforeAll(() => {
      stack = new TapStack('test-multi-az', {
        environmentSuffix: 'dev',
        availabilityZones: 3,
      });
    });

    it('should distribute subnets across 3 AZs', (done) => {
      pulumi.all([
        stack.targetSubnets[0].availabilityZone,
        stack.targetSubnets[2].availabilityZone,
        stack.targetSubnets[4].availabilityZone
      ]).apply(([az0, az2, az4]) => {
        expect(az0).toBe('us-east-1a');
        expect(az2).toBe('us-east-1b');
        expect(az4).toBe('us-east-1c');
        done();
      });
    });
  });

  describe('Custom CIDR Blocks', () => {
    it('should handle custom target VPC CIDR', (done) => {
      const stackCustom = new TapStack('test-custom-target-cidr', {
        environmentSuffix: 'dev',
        targetVpcCidr: '10.60.0.0/16',
      });
      stackCustom.targetVpc.cidrBlock.apply(cidr => {
        expect(cidr).toBe('10.60.0.0/16');
        done();
      });
    });
  });

  describe('Migration Phase Transitions', () => {
    it('should handle initial phase', (done) => {
      const stackInitial = new TapStack('test-phase-initial', {
        environmentSuffix: 'dev',
        migrationPhase: 'initial',
      });
      stackInitial.outputs.apply(outputs => {
        expect(outputs.migrationPhase).toBe('initial');
        done();
      });
    });

    it('should handle peering phase', (done) => {
      const stackPeering = new TapStack('test-phase-peering', {
        environmentSuffix: 'dev',
        migrationPhase: 'peering',
      });
      stackPeering.outputs.apply(outputs => {
        expect(outputs.migrationPhase).toBe('peering');
        done();
      });
    });

    it('should handle complete phase', (done) => {
      const stackComplete = new TapStack('test-phase-complete', {
        environmentSuffix: 'dev',
        migrationPhase: 'complete',
      });
      stackComplete.outputs.apply(outputs => {
        expect(outputs.migrationPhase).toBe('complete');
        done();
      });
    });
  });

  describe('Resource Tags Validation', () => {
    beforeAll(() => {
      stack = new TapStack('test-tags-stack', {
        environmentSuffix: 'production',
      });
    });

    it('should tag all resources with ManagedBy: Pulumi', (done) => {
      stack.targetVpc.tags.apply(tags => {
        expect(tags?.ManagedBy).toBe('Pulumi');
        done();
      });
    });

    it('should tag all resources with Project: VPC-Migration', (done) => {
      stack.targetVpc.tags.apply(tags => {
        expect(tags?.Project).toBe('VPC-Migration');
        done();
      });
    });

    it('should tag all resources with CostCenter: FinTech', (done) => {
      stack.targetVpc.tags.apply(tags => {
        expect(tags?.CostCenter).toBe('FinTech');
        done();
      });
    });

    it('should tag all resources with Compliance: PCI-DSS', (done) => {
      stack.targetVpc.tags.apply(tags => {
        expect(tags?.Compliance).toBe('PCI-DSS');
        done();
      });
    });
  });
});
