import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Integration Tests - Deployed Infrastructure', () => {
  let outputs: any;
  const region = 'us-east-1';

  const ec2Client = new EC2Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const asgClient = new AutoScalingClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    
    // Parse JSON-encoded array outputs from Terraform
    if (typeof outputs.public_subnet_ids === 'string') {
      outputs.public_subnet_ids = JSON.parse(outputs.public_subnet_ids);
    }
    if (typeof outputs.private_subnet_ids === 'string') {
      outputs.private_subnet_ids = JSON.parse(outputs.private_subnet_ids);
    }
  });

  describe('VPC and Networking', () => {
    it('should have VPC deployed with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have 2 public subnets deployed', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have 2 private subnets deployed', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB deployed and active', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State!.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.DNSName).toBe(outputs.alb_dns_name);
    });

    it('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.alb_arn,
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.VpcId).toBe(outputs.vpc_id);
    });
  });

  describe('Auto Scaling Group', () => {
    it('should have ASG deployed with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(1);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    it('should have instances in private subnets', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.VPCZoneIdentifier).toBeDefined();

      // Verify subnets are private
      const subnetIds = asg.VPCZoneIdentifier!.split(',');
      const privateSubnetIds = Array.isArray(outputs.private_subnet_ids) 
        ? outputs.private_subnet_ids 
        : JSON.parse(outputs.private_subnet_ids);
      expect(privateSubnetIds).toEqual(expect.arrayContaining(subnetIds));
    });
  });

  describe('RDS Database', () => {
    it('should have RDS instance deployed and available', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
      expect(db.DBName).toBe(outputs.rds_database_name);
    });

    it('should have encryption enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toContain(outputs.kms_key_id);
    });

    it('should have automated backups enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket', () => {
    it('should have S3 bucket deployed', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });
  });

  describe('DynamoDB Table', () => {
    it('should have DynamoDB table deployed', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('End-to-End Integration', () => {
    it('should have ALB accessible via DNS', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn],
      });
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers![0];
      expect(alb.DNSName).toBeTruthy();
      expect(alb.State!.Code).toBe('active');
    });

    it('should have all resources tagged correctly', async () => {
      // VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      expect(vpcTags.some(tag => tag.Key === 'Environment')).toBe(true);
      expect(vpcTags.some(tag => tag.Key === 'ManagedBy' && tag.Value === 'Terraform')).toBe(true);
    });
  });
});
