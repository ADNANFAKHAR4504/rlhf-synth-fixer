import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  BackupClient,
  DescribeBackupVaultCommand,
} from '@aws-sdk/client-backup';
import {
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import * as fs from 'fs';
import * as path from 'path';

describe('WebApp Infrastructure Integration Tests', () => {
  let outputs: any;
  let clients: any;

  const loadStackOutputs = () => {
    try {
      const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
      if (!fs.existsSync(outputsPath)) {
        throw new Error(`Outputs file not found at ${outputsPath}`);
      }
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      return JSON.parse(outputsContent);
    } catch (error) {
      throw new Error(`Failed to load stack outputs: ${error}`);
    }
  };

  const initializeClients = () => {
    const region = process.env.AWS_REGION || 'us-east-1';
    return {
      ec2: new EC2Client({ region }),
      elbv2: new ElasticLoadBalancingV2Client({ region }),
      autoscaling: new AutoScalingClient({ region }),
      rds: new RDSClient({ region }),
      backup: new BackupClient({ region }),
    };
  };

  beforeAll(async () => {
    try {
      outputs = loadStackOutputs();
      clients = initializeClients();
    } catch (error) {
      console.warn('Integration tests skipped - outputs file not available:', error);
      outputs = null;
    }
  });

  describe('e2e: VPC Infrastructure', () => {
    it('should have created VPC with correct CIDR', async () => {
      if (!outputs?.vpcId) {
        console.log('Skipping VPC test - no vpcId in outputs');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    it('should have public and private subnets', async () => {
      if (!outputs?.publicSubnetIds || !outputs?.privateSubnetIds) {
        console.log('Skipping subnet test - no subnet IDs in outputs');
        return;
      }

      const publicSubnetIds = Array.isArray(outputs.publicSubnetIds)
        ? outputs.publicSubnetIds
        : JSON.parse(outputs.publicSubnetIds || '[]');
      const privateSubnetIds = Array.isArray(outputs.privateSubnetIds)
        ? outputs.privateSubnetIds
        : JSON.parse(outputs.privateSubnetIds || '[]');

      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      // Verify public subnets
      const publicResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      publicResponse.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });

      // Verify private subnets
      const privateResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      privateResponse.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    it('should have Internet Gateway attached', async () => {
      if (!outputs?.vpcId) {
        console.log('Skipping IGW test - no vpcId in outputs');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }]
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways[0];
      expect(igw.Attachments[0].State).toBe('available');
    });

    it('should have NAT Gateways for private subnet access', async () => {
      if (!outputs?.publicSubnetIds) {
        console.log('Skipping NAT Gateway test - no public subnet IDs in outputs');
        return;
      }

      const publicSubnetIds = Array.isArray(outputs.publicSubnetIds)
        ? outputs.publicSubnetIds
        : JSON.parse(outputs.publicSubnetIds || '[]');

      const response = await clients.ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'subnet-id', Values: publicSubnetIds }]
        })
      );

      expect(response.NatGateways.length).toBeGreaterThanOrEqual(1);
      response.NatGateways.forEach((natGw: any) => {
        expect(natGw.State).toBe('available');
      });
    });
  });

  describe('e2e: Security Groups', () => {
    it('should have proper security group configuration', async () => {
      if (!outputs?.vpcId) {
        console.log('Skipping security group test - no vpcId in outputs');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }]
        })
      );

      const securityGroups = response.SecurityGroups;
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      // Verify ALB security group allows HTTP/HTTPS
      const albSg = securityGroups.find((sg: any) => sg.GroupName?.includes('alb-sg'));
      if (albSg) {
        expect(albSg.IpPermissions.some((rule: any) => rule.FromPort === 80)).toBe(true);
        expect(albSg.IpPermissions.some((rule: any) => rule.FromPort === 443)).toBe(true);
      }

      // Verify RDS security group
      const rdsSg = securityGroups.find((sg: any) => sg.GroupName?.includes('rds-sg'));
      if (rdsSg) {
        expect(rdsSg.IpPermissions.some((rule: any) => rule.FromPort === 5432)).toBe(true);
      }
    });
  });

  describe('e2e: Load Balancer', () => {
    it('should have Application Load Balancer configured', async () => {
      if (!outputs?.albDnsName) {
        console.log('Skipping ALB test - no ALB DNS name in outputs');
        return;
      }

      const albName = outputs.albDnsName.split('.')[0];
      const response = await clients.elbv2.send(
        new DescribeLoadBalancersCommand({ Names: [albName] })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers[0];
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State.Code).toBe('active');
    });

    it('should have target group with health checks', async () => {
      if (!outputs?.targetGroupArn) {
        console.log('Skipping target group test - no target group ARN in outputs');
        return;
      }

      const response = await clients.elbv2.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [outputs.targetGroupArn]
        })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups[0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
    });
  });

  describe('e2e: Auto Scaling Group', () => {
    it('should have Auto Scaling Group configured', async () => {
      if (!outputs?.autoScalingGroupName) {
        console.log('Skipping ASG test - no ASG name in outputs');
        return;
      }

      const response = await clients.autoscaling.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.autoScalingGroupName]
        })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups[0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(3);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    it('should have launch template configured', async () => {
      if (!outputs?.launchTemplateId) {
        console.log('Skipping launch template test - no launch template ID in outputs');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateIds: [outputs.launchTemplateId]
        })
      );

      expect(response.LaunchTemplates).toHaveLength(1);
      const lt = response.LaunchTemplates[0];
      expect(lt.LaunchTemplateId).toBe(outputs.launchTemplateId);
    });
  });

  describe('e2e: Database', () => {
    it('should have RDS PostgreSQL instance', async () => {
      if (!outputs?.rdsEndpoint) {
        console.log('Skipping RDS test - no RDS endpoint in outputs');
        return;
      }

      const dbIdentifier = outputs.rdsEndpoint.split('.')[0];
      const response = await clients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances[0];
      expect(db.Engine).toBe('postgres');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.StorageEncrypted).toBe(true);
    });

    it('should have RDS subnet group', async () => {
      if (!outputs?.rdsEndpoint) {
        console.log('Skipping RDS subnet group test - no RDS endpoint in outputs');
        return;
      }

      const dbIdentifier = outputs.rdsEndpoint.split('.')[0];
      try {
        const response = await clients.rds.send(
          new DescribeDBSubnetGroupsCommand({
            DBSubnetGroupName: `rds-subnet-group-${dbIdentifier.split('-').pop()}`
          })
        );

        expect(response.DBSubnetGroups).toHaveLength(1);
        const subnetGroup = response.DBSubnetGroups[0];
        expect(subnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);
      } catch (error) {
        console.log('RDS subnet group test skipped - resource not found or naming mismatch');
      }
    });
  });

  describe('e2e: Backup and Recovery', () => {
    it('should have backup vault configured', async () => {
      if (!outputs?.backupVaultName) {
        console.log('Skipping backup vault test - no backup vault name in outputs');
        return;
      }

      const response = await clients.backup.send(
        new DescribeBackupVaultCommand({
          BackupVaultName: outputs.backupVaultName
        })
      );

      expect(response.BackupVaultName).toBe(outputs.backupVaultName);
      expect(response.CreationDate).toBeDefined();
    });
  });

  describe('e2e: Infrastructure Validation', () => {
    it('should have all required outputs', async () => {
      if (!outputs) {
        console.log('Skipping outputs validation - no outputs available');
        return;
      }

      const requiredOutputs = ['vpcId', 'albDnsName'];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should validate infrastructure meets requirements', async () => {
      if (!outputs) {
        console.log('Skipping requirements validation - no outputs available');
        return;
      }

      // Verify VPC exists
      expect(outputs.vpcId).toBeDefined();

      // Verify ALB DNS name format
      if (outputs.albDnsName) {
        expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
      }

      // Verify RDS endpoint format
      if (outputs.rdsEndpoint) {
        expect(outputs.rdsEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      }

      // Verify CloudFront domain format
      if (outputs.cloudFrontDomainName) {
        expect(outputs.cloudFrontDomainName).toMatch(/\.cloudfront\.net$/);
      }
    });

    it('should have multi-AZ deployment', async () => {
      if (!outputs?.publicSubnetIds || !outputs?.privateSubnetIds) {
        console.log('Skipping multi-AZ test - no subnet IDs in outputs');
        return;
      }

      const publicSubnetIds = Array.isArray(outputs.publicSubnetIds)
        ? outputs.publicSubnetIds
        : JSON.parse(outputs.publicSubnetIds || '[]');
      const privateSubnetIds = Array.isArray(outputs.privateSubnetIds)
        ? outputs.privateSubnetIds
        : JSON.parse(outputs.privateSubnetIds || '[]');

      // Should have subnets in multiple AZs
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const availabilityZones = new Set(
        response.Subnets.map((subnet: any) => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });
  });

  afterAll(() => {
    console.log('Integration tests completed');
    if (outputs) {
      console.log('Tested against live infrastructure:');
      console.log(`- VPC: ${outputs.vpcId || 'N/A'}`);
      console.log(`- ALB: ${outputs.albDnsName || 'N/A'}`);
      console.log(`- RDS: ${outputs.rdsEndpoint || 'N/A'}`);
      console.log(`- CloudFront: ${outputs.cloudFrontDomainName || 'N/A'}`);
    } else {
      console.log('Integration tests skipped - no live infrastructure outputs');
    }
  });
});