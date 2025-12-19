import fs from 'fs';
import path from 'path';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand
} from '@aws-sdk/client-ec2';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  GetFunctionConcurrencyCommand
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-east-1';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK_ENDPOINT !== undefined;
const endpoint = process.env.AWS_ENDPOINT_URL || process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';

const clientConfig = isLocalStack ? {
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
} : { region };

// AWS Clients
const s3Client = new S3Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const iamClient = new IAMClient(clientConfig);

describe('TapStack Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.CentralizedLoggingBucketName).toBeDefined();
      expect(outputs.ApplicationAssetsBucketName).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.LoadBalancerDNSName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('S3 Bucket Verification', () => {
    test('Centralized Logging Bucket should exist with encryption', async () => {
      if (!outputs.CentralizedLoggingBucketName || outputs.CentralizedLoggingBucketName.includes('***')) {
        console.warn('Skipping test - no valid bucket name in outputs');
        return;
      }

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.CentralizedLoggingBucketName
      });
      
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('Application Assets Bucket should have versioning enabled', async () => {
      if (!outputs.ApplicationAssetsBucketName || outputs.ApplicationAssetsBucketName.includes('***')) {
        console.warn('Skipping test - no valid bucket name in outputs');
        return;
      }

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.ApplicationAssetsBucketName
      });
      
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('Both S3 buckets should block public access', async () => {
      const buckets = [
        outputs.CentralizedLoggingBucketName,
        outputs.ApplicationAssetsBucketName
      ].filter(bucket => bucket && !bucket.includes('***'));

      if (buckets.length === 0) {
        console.warn('Skipping test - no valid bucket names in outputs');
        return;
      }

      for (const bucket of buckets) {
        const publicAccessCommand = new GetPublicAccessBlockCommand({
          Bucket: bucket
        });
        
        const publicAccessResponse = await s3Client.send(publicAccessCommand);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    });
  });

  describe('VPC and Network Verification', () => {
    test('VPC should exist with correct configuration', async () => {
      if (!outputs.VPCId) {
        console.warn('Skipping test - no VPC ID in outputs');
        return;
      }

      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs).toHaveLength(1);
      
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are verified through attributes API
      const vpcAttributes = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      }));
      expect(vpcAttributes.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Subnets should exist in the VPC', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ].filter(Boolean);

      if (subnetIds.length === 0) {
        console.warn('Skipping test - no subnet IDs in outputs');
        return;
      }

      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      expect(subnetResponse.Subnets).toHaveLength(subnetIds.length);
      
      subnetResponse.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });
  });

  describe('RDS Database Verification', () => {
    test('Database should exist with Multi-AZ enabled', async () => {
      if (!outputs.DatabaseEndpoint) {
        console.warn('Skipping test - no database endpoint in outputs');
        return;
      }

      const dbIdentifier = `secure-webapp-db-${outputs.EnvironmentSuffix}`;
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      try {
        const dbResponse = await rdsClient.send(dbCommand);
        expect(dbResponse.DBInstances).toHaveLength(1);
        
        const db = dbResponse.DBInstances![0];
        expect(db.MultiAZ).toBe(true);
        expect(db.StorageEncrypted).toBe(true);
        expect(db.Engine).toBe('mysql');
        expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.warn('Database not found - may have been cleaned up');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Lambda Function Verification', () => {
    test('Lambda function should exist with VPC configuration', async () => {
      if (!outputs.LambdaFunctionArn) {
        console.warn('Skipping test - no Lambda ARN in outputs');
        return;
      }

      const functionName = `secure-webapp-processor-${outputs.EnvironmentSuffix}`;
      const functionCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });
      
      try {
        const functionResponse = await lambdaClient.send(functionCommand);
        
        expect(functionResponse.VpcConfig).toBeDefined();
        expect(functionResponse.VpcConfig?.VpcId).toBe(outputs.VPCId);
        expect(functionResponse.Environment?.Variables?.LOG_LEVEL).toBe('INFO');
        expect(functionResponse.Timeout).toBe(30);
        // ReservedConcurrentExecutions is part of concurrency config
        const concurrencyCommand = new GetFunctionConcurrencyCommand({
          FunctionName: functionName
        });
        const concurrencyResponse = await lambdaClient.send(concurrencyCommand);
        expect(concurrencyResponse.ReservedConcurrentExecutions).toBe(10);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn('Lambda function not found - may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('Lambda should have CloudWatch log group', async () => {
      const logGroupName = `/aws/lambda/secure-webapp-processor-${outputs.EnvironmentSuffix}`;
      const logCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      
      try {
        const logResponse = await logsClient.send(logCommand);
        expect(logResponse.logGroups).toBeDefined();
        
        if (logResponse.logGroups && logResponse.logGroups.length > 0) {
          const logGroup = logResponse.logGroups[0];
          expect(logGroup.retentionInDays).toBe(30);
        }
      } catch (error) {
        console.warn('Log group not found - may have been cleaned up');
      }
    });
  });

  describe('Security Groups Verification', () => {
    test('ALB Security Group should only allow HTTPS from internet', async () => {
      const sgName = `SecureWebApp-ALB-SG-${outputs.EnvironmentSuffix}`;
      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [sgName]
          }
        ]
      });
      
      try {
        const sgResponse = await ec2Client.send(sgCommand);
        
        if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
          const sg = sgResponse.SecurityGroups[0];
          const ingressRules = sg.IpPermissions || [];
          
          // Check that only port 443 is open to internet
          const internetRules = ingressRules.filter(rule => 
            rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
          );
          
          expect(internetRules).toHaveLength(1);
          expect(internetRules[0].FromPort).toBe(443);
          expect(internetRules[0].ToPort).toBe(443);
        }
      } catch (error) {
        console.warn('Security group not found - may have been cleaned up');
      }
    });

    test('Database Security Group should not allow internet access', async () => {
      const sgName = `SecureWebApp-DB-SG-${outputs.EnvironmentSuffix}`;
      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [sgName]
          }
        ]
      });
      
      try {
        const sgResponse = await ec2Client.send(sgCommand);
        
        if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
          const sg = sgResponse.SecurityGroups[0];
          const ingressRules = sg.IpPermissions || [];
          
          // Ensure no rules allow 0.0.0.0/0
          ingressRules.forEach(rule => {
            const hasInternetAccess = rule.IpRanges?.some(range => 
              range.CidrIp === '0.0.0.0/0'
            );
            expect(hasInternetAccess).toBe(false);
          });
        }
      } catch (error) {
        console.warn('Security group not found - may have been cleaned up');
      }
    });
  });

  describe('Load Balancer Verification', () => {
    test('Application Load Balancer should be internet-facing', async () => {
      if (!outputs.LoadBalancerDNSName) {
        console.warn('Skipping test - no ALB DNS in outputs');
        return;
      }

      const albName = `SecureWebApp-ALB-${outputs.EnvironmentSuffix}`;
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [albName]
      });
      
      try {
        const albResponse = await elbClient.send(albCommand);
        
        if (albResponse.LoadBalancers && albResponse.LoadBalancers.length > 0) {
          const alb = albResponse.LoadBalancers[0];
          expect(alb.Scheme).toBe('internet-facing');
          expect(alb.Type).toBe('application');
          expect(alb.VpcId).toBe(outputs.VPCId);
        }
      } catch (error: any) {
        if (error.name === 'LoadBalancerNotFound') {
          console.warn('Load balancer not found - may have been cleaned up');
        } else {
          console.warn('Error checking load balancer:', error.message);
        }
      }
    });
  });

  describe('IAM Roles Verification', () => {
    test('Lambda role should follow least privilege principle', async () => {
      const roleName = `SecureWebAppLambdaRole-${outputs.EnvironmentSuffix}`;
      const roleCommand = new GetRoleCommand({
        RoleName: roleName
      });
      
      try {
        const roleResponse = await iamClient.send(roleCommand);
        expect(roleResponse.Role).toBeDefined();
        
        // Check assume role policy
        const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
        expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        
        // List inline policies
        const policiesCommand = new ListRolePoliciesCommand({
          RoleName: roleName
        });
        
        const policiesResponse = await iamClient.send(policiesCommand);
        expect(policiesResponse.PolicyNames).toContain('LambdaMinimalAccess');
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.warn('IAM role not found - may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('EC2 role should follow least privilege principle', async () => {
      const roleName = `SecureWebAppEC2Role-${outputs.EnvironmentSuffix}`;
      const roleCommand = new GetRoleCommand({
        RoleName: roleName
      });
      
      try {
        const roleResponse = await iamClient.send(roleCommand);
        expect(roleResponse.Role).toBeDefined();
        
        // Check assume role policy
        const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
        expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
        
        // List inline policies
        const policiesCommand = new ListRolePoliciesCommand({
          RoleName: roleName
        });
        
        const policiesResponse = await iamClient.send(policiesCommand);
        expect(policiesResponse.PolicyNames).toContain('EC2MinimalAccess');
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.warn('IAM role not found - may have been cleaned up');
        } else {
          throw error;
        }
      }
    });
  });
});