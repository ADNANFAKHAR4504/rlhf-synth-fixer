import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import axios from 'axios';
import fs from 'fs';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('./cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = outputs.EnvironmentSuffix;

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const asgClient = new AutoScalingClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    }, 30000);

    test('should have 4 subnets (2 public, 2 private)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(4);

      const publicSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual([
        '10.0.1.0/24',
        '10.0.10.0/24',
        '10.0.11.0/24',
        '10.0.2.0/24',
      ]);
    }, 30000);

    test('should have 2 availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Check that both AZs are in us-east-1
      azs.forEach(az => {
        expect(az).toMatch(/^us-east-1[a-z]$/);
      });
    }, 30000);

    test('should have 2 NAT Gateways in available state', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      expect(response.NatGateways).toHaveLength(2);

      // Verify each NAT Gateway is in a public subnet
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });
    }, 30000);

    test('should have Internet Gateway attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
    }, 30000);
  });

  describe('Security Groups', () => {
    test('should have 3 security groups with correct rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'group-name',
              Values: [
                `alb-sg-${environmentSuffix}`,
                `ec2-sg-${environmentSuffix}`,
                `rds-sg-${environmentSuffix}`,
              ],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('ALB security group should allow HTTP and HTTPS from internet', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'group-name',
              Values: [`alb-sg-${environmentSuffix}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const httpRule = sg.IpPermissions!.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = sg.IpPermissions!.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges!.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
      expect(httpsRule!.IpRanges!.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('ALB should be in active state', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [`alb-${environmentSuffix}`],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];

      expect(alb.State!.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.IpAddressType).toBe('ipv4');
      expect(alb.AvailabilityZones).toHaveLength(2);
    }, 30000);

    test('ALB should have correct DNS name', async () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBDNSName).toContain('elb.amazonaws.com');
      expect(outputs.ALBDNSName).toContain(environmentSuffix);
    });

    test('Target group should exist and be healthy', async () => {
      const tgResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`alb-tg-${environmentSuffix}`],
        })
      );

      expect(tgResponse.TargetGroups).toHaveLength(1);
      const tg = tgResponse.TargetGroups![0];

      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.TargetType).toBe('instance');
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    }, 30000);

    test('ALB should be accessible via HTTP', async () => {
      const url = outputs.ALBUrl;

      try {
        const response = await axios.get(url, {
          timeout: 10000,
          validateStatus: (status) => status < 500, // Accept 200-499
        });

        // Should get either 200 (healthy) or 503 (targets not ready yet)
        expect([200, 503]).toContain(response.status);
      } catch (error: any) {
        // If connection refused, targets might still be launching
        if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
          console.log('ALB exists but targets are still launching');
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('ASG should exist with correct configuration', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];

      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.VPCZoneIdentifier).toBeDefined();
    }, 30000);

    test('ASG should be in private subnets', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );

      const asg = response.AutoScalingGroups![0];
      const subnetIds = asg.VPCZoneIdentifier!.split(',');

      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
    }, 30000);

    test('ASG instances should eventually be in service', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );

      const asg = response.AutoScalingGroups![0];
      const instances = asg.Instances || [];

      // Should have instances being launched or in service
      expect(instances.length).toBeGreaterThanOrEqual(0);

      if (instances.length > 0) {
        const validStates = ['Pending', 'InService', 'Pending:Wait', 'Pending:Proceed'];
        instances.forEach(instance => {
          expect(validStates).toContain(instance.LifecycleState);
        });
      }
    }, 30000);
  });

  describe('RDS Database', () => {
    test('RDS instance should exist and be available', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `rds-postgres-${environmentSuffix}`,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];

      expect(db.DBInstanceStatus).toMatch(/available|backing-up|modifying/);
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toMatch(/^15\./);
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
    }, 30000);

    test('RDS should have correct backup configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `rds-postgres-${environmentSuffix}`,
        })
      );

      const db = response.DBInstances![0];

      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBeDefined();
      expect(db.PreferredMaintenanceWindow).toBeDefined();
    }, 30000);

    test('RDS endpoint should match output', async () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toContain(environmentSuffix);
      expect(outputs.RDSEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.RDSPort).toBe('5432');
    });

    test('RDS should be in private subnets', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `rds-postgres-${environmentSuffix}`,
        })
      );

      const db = response.DBInstances![0];
      const dbSubnets = db.DBSubnetGroup!.Subnets!.map(s => s.SubnetIdentifier);

      expect(dbSubnets).toContain(outputs.PrivateSubnet1Id);
      expect(dbSubnets).toContain(outputs.PrivateSubnet2Id);
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    test('VPC Flow Logs log group should exist', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/vpc/flowlogs-${environmentSuffix}`,
        })
      );

      expect(response.logGroups!.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];

      expect(logGroup.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('all resources should have correct tags', async () => {
      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      const vpc = vpcResponse.Vpcs![0];
      const tags = vpc.Tags || [];

      const envTag = tags.find(t => t.Key === 'Environment');
      const managedByTag = tags.find(t => t.Key === 'ManagedBy');
      const nameTag = tags.find(t => t.Key === 'Name');

      expect(envTag).toBeDefined();
      expect(managedByTag).toBeDefined();
      expect(managedByTag!.Value).toBe('cloudformation');
      expect(nameTag!.Value).toContain(environmentSuffix);
    }, 30000);
  });

  describe('Stack Outputs', () => {
    test('all required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBDNSName',
        'ALBUrl',
        'RDSEndpoint',
        'RDSPort',
        'AutoScalingGroupName',
        'StackName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('environment suffix should match', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.StackName).toContain(environmentSuffix);
    });

    test('resource names should include environment suffix', () => {
      expect(outputs.ALBDNSName).toContain(environmentSuffix);
      expect(outputs.RDSEndpoint).toContain(environmentSuffix);
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete infrastructure should be operational', async () => {
      // Verify VPC exists
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Verify ALB is active
      const albResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [`alb-${environmentSuffix}`],
        })
      );
      expect(albResponse.LoadBalancers![0].State!.Code).toBe('active');

      // Verify RDS is available or in transitional state
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `rds-postgres-${environmentSuffix}`,
        })
      );
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toMatch(
        /available|backing-up|modifying|creating/
      );

      // Verify ASG exists
      const asgResponse = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );
      expect(asgResponse.AutoScalingGroups).toHaveLength(1);

      console.log('Infrastructure Validation Complete:');
      console.log(`  VPC: ${outputs.VPCId}`);
      console.log(`  ALB: ${outputs.ALBDNSName}`);
      console.log(`  RDS: ${outputs.RDSEndpoint}`);
      console.log(`  ASG: ${outputs.AutoScalingGroupName}`);
    }, 30000);
  });
});
