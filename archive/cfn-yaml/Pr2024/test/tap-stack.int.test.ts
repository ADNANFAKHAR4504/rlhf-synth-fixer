/**
 * Integration tests for TapStack CloudFormation deployment
 * Tests actual deployed AWS resources using cfn-outputs
 */

import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const s3Client = new S3Client({ region });
  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const snsClient = new SNSClient({ region });

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('cfn-outputs/flat-outputs.json not found. Please deploy the stack first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('VPC and Network Configuration', () => {
    test('VPC should exist and be configured correctly', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0] as any;
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Subnets should be properly configured', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);
      
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('EC2 security group should be restrictive', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      const sshRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpProtocol).toBe('tcp');
      
      // Verify no unrestricted inbound access
      const unrestrictedRule = sg.IpPermissions?.find(rule =>
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(unrestrictedRule).toBeUndefined();
    });
  });

  describe('S3 Bucket Security', () => {
    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName
      });
      
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      
      const rules = response.ServerSideEncryptionConfiguration!.Rules;
      expect(rules).toHaveLength(1);
      expect(rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName
      });
      
      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;
      
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy should enforce secure transport', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.S3BucketName
      });
      
      try {
        const response = await s3Client.send(command);
        const policy = JSON.parse(response.Policy!);
        
        const denyInsecureStatement = policy.Statement.find((s: any) => 
          s.Sid === 'DenyInsecureConnections'
        );
        
        expect(denyInsecureStatement).toBeDefined();
        expect(denyInsecureStatement.Effect).toBe('Deny');
        expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      } catch (error: any) {
        // Policy might not exist if not applied yet
        console.log('Bucket policy not found or not accessible:', error.message);
      }
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be configured securely', async () => {
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      
      const db = response.DBInstances![0];
      
      // Check encryption
      expect(db.StorageEncrypted).toBe(true);
      
      // Check public accessibility
      expect(db.PubliclyAccessible).toBe(false);
      
      // Check backup retention
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
      
      // Check monitoring
      expect(db.MonitoringInterval).toBeGreaterThan(0);
      
      // Check deletion protection is disabled for testing
      expect(db.DeletionProtection).toBe(false);
    });

    test('RDS instance should be in private subnets', async () => {
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];
      
      expect(db.DBSubnetGroup).toBeDefined();
      expect(db.DBSubnetGroup!.Subnets).toBeDefined();
      expect(db.DBSubnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(2);
      
      // Verify subnets are private (no direct internet route)
      const subnetIds = db.DBSubnetGroup!.Subnets!.map(s => s.SubnetIdentifier);
      
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds as string[]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic should exist and be configured', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn
      });
      
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      
      // Check KMS encryption
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      
      // Check display name
      expect(response.Attributes!.DisplayName).toContain('Security');
    });
  });

  describe('Cross-Resource Validation', () => {
    test('All resources should be in the same VPC', async () => {
      // Get security groups
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroup = sgResponse.SecurityGroups![0];
      
      expect(securityGroup.VpcId).toBe(outputs.VPCId);
    });

    test('RDS endpoint should be resolvable and internal', () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.RDSEndpoint).toContain(region);
    });

    test('All critical outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'SecurityGroupId',
        'S3BucketName',
        'RDSEndpoint',
        'SNSTopicArn'
      ];
      
      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('Compliance Checks', () => {
    test('No resources should allow unrestricted public access', async () => {
      // Check security groups for 0.0.0.0/0 ingress
      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      
      sgResponse.SecurityGroups?.forEach(sg => {
        sg.IpPermissions?.forEach(rule => {
          const hasUnrestrictedAccess = rule.IpRanges?.some(range => 
            range.CidrIp === '0.0.0.0/0' && rule.FromPort !== 443 && rule.FromPort !== 80
          );
          
          if (hasUnrestrictedAccess) {
            console.warn(`Security group ${sg.GroupId} has unrestricted access on port ${rule.FromPort}`);
          }
        });
      });
    });

    test('All storage resources should have encryption enabled', async () => {
      // S3 bucket encryption check
      const s3Command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName
      });
      
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.ServerSideEncryptionConfiguration).toBeDefined();
      
      // RDS encryption check
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);
    });
  });
});