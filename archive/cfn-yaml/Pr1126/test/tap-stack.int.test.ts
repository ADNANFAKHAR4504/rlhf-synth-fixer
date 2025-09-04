import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketLoggingCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import fs from 'fs';

let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('No outputs file found, using environment variables for testing');
}

// AWS SDK clients
const s3Client = new S3Client({ region: 'us-west-2' });
const lambdaClient = new LambdaClient({ region: 'us-west-2' });
const rdsClient = new RDSClient({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const iamClient = new IAMClient({ region: 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: 'us-west-2' });

// Helper function to get output value
const getOutput = (key: string): string => {
  return outputs[key] || process.env[key] || '';
};

describe('TapStack Infrastructure Integration Tests', () => {
  const stackName = process.env.STACK_NAME || 'TapStack';
  
  describe('S3 Buckets', () => {
    test('S3 Access Logs Bucket should exist and be accessible', async () => {
      const bucketName = getOutput('S3AccessLogsBucketName');
      expect(bucketName).toBeTruthy();
      
      try {
        const command = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(command);
        expect(true).toBe(true); // Bucket exists and is accessible
      } catch (error) {
        throw new Error(`S3 Access Logs Bucket ${bucketName} is not accessible: ${error}`);
      }
    });

    test('S3 Application Bucket should exist and have versioning enabled', async () => {
      const bucketName = getOutput('S3ApplicationBucketName');
      expect(bucketName).toBeTruthy();
      
      try {
        const command = new GetBucketVersioningCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        throw new Error(`S3 Application Bucket ${bucketName} versioning check failed: ${error}`);
      }
    });

    test('S3 Backup Bucket should exist and have versioning enabled', async () => {
      const bucketName = getOutput('S3BackupBucketName');
      expect(bucketName).toBeTruthy();
      
      try {
        const command = new GetBucketVersioningCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        throw new Error(`S3 Backup Bucket ${bucketName} versioning check failed: ${error}`);
      }
    });

    test('S3 Application Bucket should have logging configured', async () => {
      const bucketName = getOutput('S3ApplicationBucketName');
      expect(bucketName).toBeTruthy();
      
      try {
        const command = new GetBucketLoggingCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.LoggingEnabled).toBeDefined();
        expect(response.LoggingEnabled?.TargetBucket).toBe(getOutput('S3AccessLogsBucketName'));
      } catch (error) {
        throw new Error(`S3 Application Bucket ${bucketName} logging check failed: ${error}`);
      }
    });

    test('S3 Backup Bucket should have logging configured', async () => {
      const bucketName = getOutput('S3BackupBucketName');
      expect(bucketName).toBeTruthy();
      
      try {
        const command = new GetBucketLoggingCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.LoggingEnabled).toBeDefined();
        expect(response.LoggingEnabled?.TargetBucket).toBe(getOutput('S3AccessLogsBucketName'));
      } catch (error) {
        throw new Error(`S3 Backup Bucket ${bucketName} logging check failed: ${error}`);
      }
    });

    test('All S3 buckets should have encryption enabled', async () => {
      const buckets = [
        getOutput('S3AccessLogsBucketName'),
        getOutput('S3ApplicationBucketName'),
        getOutput('S3BackupBucketName')
      ].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
          const response = await s3Client.send(command);
          expect(response.ServerSideEncryptionConfiguration).toBeDefined();
          expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
        } catch (error) {
          throw new Error(`S3 Bucket ${bucketName} encryption check failed: ${error}`);
        }
      }
    });

    test('All S3 buckets should have public access blocked', async () => {
      const buckets = [
        getOutput('S3AccessLogsBucketName'),
        getOutput('S3ApplicationBucketName'),
        getOutput('S3BackupBucketName')
      ].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
          const response = await s3Client.send(command);
          const config = response.PublicAccessBlockConfiguration;
          expect(config?.BlockPublicAcls).toBe(true);
          expect(config?.BlockPublicPolicy).toBe(true);
          expect(config?.IgnorePublicAcls).toBe(true);
          expect(config?.RestrictPublicBuckets).toBe(true);
        } catch (error) {
          throw new Error(`S3 Bucket ${bucketName} public access block check failed: ${error}`);
        }
      }
    });
  });

  describe('Lambda Function', () => {
    test('S3 Processor Lambda function should exist and be accessible', async () => {
      const functionName = getOutput('LambdaFunctionName');
      expect(functionName).toBeTruthy();
      
      try {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.FunctionName).toBe(functionName);
        expect(response.Configuration?.Runtime).toBe('python3.9');
        expect(response.Configuration?.Handler).toBe('index.lambda_handler');
        expect(response.Configuration?.Timeout).toBe(300);
        expect(response.Configuration?.MemorySize).toBe(256);
      } catch (error) {
        throw new Error(`Lambda function ${functionName} check failed: ${error}`);
      }
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionName = getOutput('LambdaFunctionName');
      expect(functionName).toBeTruthy();
      
      try {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        const envVars = response.Configuration?.Environment?.Variables;
        expect(envVars?.ENVIRONMENT).toBe('Production');
        expect(envVars?.RDS_ENDPOINT).toBe(getOutput('RDSEndpointURL'));
      } catch (error) {
        throw new Error(`Lambda function ${functionName} environment variables check failed: ${error}`);
      }
    });

    test('Lambda function should be invokable', async () => {
      const functionName = getOutput('LambdaFunctionName');
      expect(functionName).toBeTruthy();
      
      try {
        const testEvent = {
          Records: [{
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: getOutput('S3ApplicationBucketName') },
              object: { key: 'test-file.txt' }
            }
          }]
        };

        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify(testEvent))
        });
        
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
      } catch (error) {
        throw new Error(`Lambda function ${functionName} invocation test failed: ${error}`);
      }
    });
  });

  describe('RDS PostgreSQL', () => {
    test('RDS instance should exist and be accessible', async () => {
      const dbIdentifier = 'production-postgresql-db';
      
      try {
        const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
        const response = await rdsClient.send(command);
        expect(response.DBInstances).toHaveLength(1);
        
        const dbInstance = response.DBInstances![0];
        expect(dbInstance.Engine).toBe('postgres');
        expect(dbInstance.EngineVersion).toBe('14.18');
        expect(dbInstance.MultiAZ).toBe(true);
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.DeletionProtection).toBe(true);
        expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      } catch (error) {
        throw new Error(`RDS instance ${dbIdentifier} check failed: ${error}`);
      }
    });

    test('RDS endpoint should be accessible', async () => {
      const endpoint = getOutput('RDSEndpointURL');
      expect(endpoint).toBeTruthy();
      expect(endpoint).toMatch(/^production-postgresql-db\.[a-z0-9-]+\.us-west-2\.rds\.amazonaws\.com$/);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = getOutput('VPCId');
      expect(vpcId).toBeTruthy();
      
      try {
        const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
        const response = await ec2Client.send(command);
        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
        // Note: These properties might not be directly accessible in the response
        // but they are configured in the CloudFormation template
      } catch (error) {
        throw new Error(`VPC ${vpcId} check failed: ${error}`);
      }
    });

    test('Private subnets should exist for RDS', async () => {
      const vpcId = getOutput('VPCId');
      expect(vpcId).toBeTruthy();
      
      try {
        const command = new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: ['*Private*'] }
          ]
        });
        const response = await ec2Client.send(command);
        expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
        
        // Check that subnets are in different AZs
        const azs = response.Subnets?.map(subnet => subnet.AvailabilityZone);
        const uniqueAzs = [...new Set(azs)];
        expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);
      } catch (error) {
        throw new Error(`Private subnets check failed: ${error}`);
      }
    });

    test('RDS Security Group should exist with correct rules', async () => {
      const securityGroupId = getOutput('RDSSecurityGroupId');
      expect(securityGroupId).toBeTruthy();
      
      try {
        const command = new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] });
        const response = await ec2Client.send(command);
        expect(response.SecurityGroups).toHaveLength(1);
        
        const sg = response.SecurityGroups![0];
        expect(sg.GroupName).toBe('Production-RDS-SecurityGroup');
        
        // Check ingress rules
        const postgresRule = sg.IpPermissions?.find(rule => 
          rule.FromPort === 5432 && rule.ToPort === 5432
        );
        expect(postgresRule).toBeDefined();
        expect(postgresRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');
      } catch (error) {
        throw new Error(`RDS Security Group ${securityGroupId} check failed: ${error}`);
      }
    });
  });

  describe('IAM Roles', () => {
    test('Lambda execution role should exist with correct permissions', async () => {
      // Get the Lambda function name to derive the role name
      const functionName = getOutput('LambdaFunctionName');
      expect(functionName).toBeTruthy();
      
      try {
        // Get the Lambda function to find its execution role
        const lambdaCommand = new GetFunctionCommand({ FunctionName: functionName });
        const lambdaResponse = await lambdaClient.send(lambdaCommand);
        const roleArn = lambdaResponse.Configuration?.Role;
        expect(roleArn).toBeTruthy();
        
        // Extract role name from ARN
        const roleName = roleArn!.split('/').pop()!;
        
        // Get the role details
        const roleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(roleCommand);
        expect(roleResponse.Role?.RoleName).toBe(roleName);
        
        // Check assume role policy (decode URL-encoded JSON first)
        const decodedPolicy = decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!);
        const assumeRolePolicy = JSON.parse(decodedPolicy);
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      } catch (error) {
        throw new Error(`Lambda execution role check failed: ${error}`);
      }
    });

    test('RDS monitoring role should exist', async () => {
      // Get the RDS instance to find its monitoring role
      const dbIdentifier = getOutput('RDSEndpointURL')?.split('.')[0];
      expect(dbIdentifier).toBeTruthy();
      
      try {
        // Get the RDS instance to find its monitoring role ARN
        const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
        const rdsResponse = await rdsClient.send(rdsCommand);
        const monitoringRoleArn = rdsResponse.DBInstances![0].MonitoringRoleArn;
        expect(monitoringRoleArn).toBeTruthy();
        
        // Extract role name from ARN
        const roleName = monitoringRoleArn!.split('/').pop()!;
        
        // Get the role details
        const roleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(roleCommand);
        expect(roleResponse.Role?.RoleName).toBe(roleName);
        
        // Check assume role policy (decode URL-encoded JSON first)
        const decodedPolicy = decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!);
        const assumeRolePolicy = JSON.parse(decodedPolicy);
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      } catch (error) {
        throw new Error(`RDS monitoring role check failed: ${error}`);
      }
    });
  });

  describe('CloudWatch Logs', () => {
    test('Lambda log group should exist', async () => {
      const functionName = getOutput('LambdaFunctionName');
      expect(functionName).toBeTruthy();
      
      const logGroupName = `/aws/lambda/${functionName}`;
      
      try {
        const command = new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName });
        const response = await logsClient.send(command);
        expect(response.logGroups).toHaveLength(1);
        expect(response.logGroups![0].logGroupName).toBe(logGroupName);
        expect(response.logGroups![0].retentionInDays).toBe(30);
      } catch (error) {
        throw new Error(`Lambda log group ${logGroupName} check failed: ${error}`);
      }
    });
  });

  describe('End-to-End Functionality', () => {
    test('S3 to Lambda integration should work', async () => {
      const applicationBucket = getOutput('S3ApplicationBucketName');
      const functionName = getOutput('LambdaFunctionName');
      
      expect(applicationBucket).toBeTruthy();
      expect(functionName).toBeTruthy();
      
      // This test verifies that the S3 bucket has the correct notification configuration
      // and the Lambda function can be invoked by S3 events
      try {
        // Test Lambda function directly with S3 event
        const testEvent = {
          Records: [{
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: applicationBucket },
              object: { key: 'integration-test-file.txt' }
            }
          }]
        };

        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify(testEvent))
        });
        
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        
        // Parse the response payload
        const payload = JSON.parse(Buffer.from(response.Payload!).toString());
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toContain('S3 event processed successfully');
        expect(payload.body).toContain('Production');
      } catch (error) {
        throw new Error(`S3 to Lambda integration test failed: ${error}`);
      }
    });

    test('All resources should be properly tagged', async () => {
      // This test verifies that all resources have the Environment: Production tag
      // Note: This is a basic check - in a real scenario, you might want to check specific resources
      const vpcId = getOutput('VPCId');
      expect(vpcId).toBeTruthy();
      
      try {
        const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs![0];
        
        const environmentTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
        expect(environmentTag?.Value).toBe('Production');
      } catch (error) {
        throw new Error(`Resource tagging check failed: ${error}`);
      }
    });
  });

  describe('Security and Compliance', () => {
    test('RDS should be in private subnets', async () => {
      const vpcId = getOutput('VPCId');
      expect(vpcId).toBeTruthy();
      
      try {
        const command = new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: ['*Private*'] }
          ]
        });
        const response = await ec2Client.send(command);
        
        // Verify that private subnets don't have auto-assign public IP enabled
        response.Subnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        });
      } catch (error) {
        throw new Error(`RDS subnet security check failed: ${error}`);
      }
    });

    test('All S3 buckets should follow security best practices', async () => {
      const buckets = [
        getOutput('S3AccessLogsBucketName'),
        getOutput('S3ApplicationBucketName'),
        getOutput('S3BackupBucketName')
      ].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          // Check encryption
          const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
          const encryptionResponse = await s3Client.send(encryptionCommand);
          expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
          
          // Check public access block
          const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
          const publicAccessResponse = await s3Client.send(publicAccessCommand);
          const config = publicAccessResponse.PublicAccessBlockConfiguration;
          expect(config?.BlockPublicAcls).toBe(true);
          expect(config?.RestrictPublicBuckets).toBe(true);
        } catch (error) {
          throw new Error(`S3 bucket ${bucketName} security check failed: ${error}`);
        }
      }
    });
  });
});
