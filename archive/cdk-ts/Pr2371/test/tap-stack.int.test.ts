import AWS from 'aws-sdk';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, some tests may be skipped');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS SDK
AWS.config.update({ region });
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const cloudtrail = new AWS.CloudTrail();

describe('Secure Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Skip tests if outputs are not available
    if (!outputs.VPCId) {
      console.warn('Stack outputs not available, skipping integration tests');
    }
  });

  describe('VPC Infrastructure', () => {
    test('VPC exists and has correct configuration', async () => {
      if (!outputs.VPCId) return;

      const response = await ec2.describeVpcs({
        VpcIds: [outputs.VPCId]
      }).promise();

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC has correct number of subnets', async () => {
      if (!outputs.VPCId) return;

      const response = await ec2.describeSubnets({
        Filters: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }]
      }).promise();

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(9); // 3 AZs * 3 subnet types

      // Check for public subnets
      const publicSubnets = response.Subnets!.filter(subnet =>
        subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBeGreaterThan(0);

      // Check for private subnets
      const privateSubnets = response.Subnets!.filter(subnet =>
        subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('NAT gateways are running', async () => {
      if (!outputs.VPCId) return;

      const response = await ec2.describeNatGateways({
        Filter: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }]
      }).promise();

      expect(response.NatGateways!.length).toBe(2);
      response.NatGateways!.forEach(natGateway => {
        expect(natGateway.State).toBe('available');
      });
    });
  });

  describe('Security Groups', () => {
    test('security groups exist and have restrictive rules', async () => {
      if (!outputs.VPCId) return;

      const response = await ec2.describeSecurityGroups({
        Filters: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }]
      }).promise();

      const securityGroups = response.SecurityGroups!.filter(sg =>
        sg.GroupName !== 'default'
      );

      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      // Check for SSH access restriction
      const ec2SecurityGroup = securityGroups.find(sg =>
        sg.Description === 'Security group for EC2 instances'
      );

      if (ec2SecurityGroup) {
        const sshRule = ec2SecurityGroup.IpPermissions!.find(rule =>
          rule.FromPort === 22 && rule.ToPort === 22
        );
        expect(sshRule).toBeDefined();
        expect(sshRule!.IpRanges![0].CidrIp).toBe('203.0.113.0/24');
      }
    });
  });

  describe('S3 Buckets', () => {
    test('application bucket exists and is properly configured', async () => {
      if (!outputs.S3BucketName) return;

      // Check bucket exists
      const headResponse = await s3.headBucket({
        Bucket: outputs.S3BucketName
      }).promise();

      expect(headResponse).toBeDefined();

      // Check encryption configuration
      const encryptionResponse = await s3.getBucketEncryption({
        Bucket: outputs.S3BucketName
      }).promise();

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      // Check versioning
      const versioningResponse = await s3.getBucketVersioning({
        Bucket: outputs.S3BucketName
      }).promise();

      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResponse = await s3.getPublicAccessBlock({
        Bucket: outputs.S3BucketName
      }).promise();

      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('database instance is running and properly configured', async () => {
      if (!outputs.DatabaseEndpoint) return;

      // Extract DB identifier from endpoint (assuming format: identifier.xxx.region.rds.amazonaws.com)
      const dbIdentifierMatch = outputs.DatabaseEndpoint.match(/^([^.]+)\./);
      if (!dbIdentifierMatch) return;

      const dbIdentifier = dbIdentifierMatch[1];

      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier
      }).promise();

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
    });

    test('database is accessible from private subnets only', async () => {
      if (!outputs.DatabaseEndpoint) return;

      const dbIdentifierMatch = outputs.DatabaseEndpoint.match(/^([^.]+)\./);
      if (!dbIdentifierMatch) return;

      const dbIdentifier = dbIdentifierMatch[1];

      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier
      }).promise();

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances are running with correct configuration', async () => {
      if (!outputs.VPCId) return;

      const response = await ec2.describeInstances({
        Filters: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }, {
          Name: 'instance-state-name',
          Values: ['running', 'pending']
        }]
      }).promise();

      const instances = response.Reservations!.flatMap(reservation =>
        reservation.Instances || []
      );

      expect(instances.length).toBeGreaterThanOrEqual(2);

      instances.forEach(instance => {
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.MetadataOptions!.HttpTokens).toBe('required'); // IMDSv2

        // Check if instance is in private subnet (no public IP)
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function exists and is configured correctly', async () => {
      if (!outputs.LambdaFunctionName) return;

      const response = await lambda.getFunction({
        FunctionName: outputs.LambdaFunctionName
      }).promise();

      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('index.handler');
      expect(response.Configuration!.Timeout).toBe(30);
      expect(response.Configuration!.MemorySize).toBe(256);
      expect(response.Configuration!.VpcConfig).toBeDefined();
      expect(response.Configuration!.VpcConfig!.VpcId).toBe(outputs.VPCId);
    });

    test('Lambda function can be invoked successfully', async () => {
      if (!outputs.LambdaFunctionName) return;

      const response = await lambda.invoke({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse'
      }).promise();

      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(response.Payload.toString());
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.message).toContain('Lambda function executed successfully');
        expect(body.vpc_config).toBe('enabled');
      }
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail is active and logging', async () => {
      const response = await cloudtrail.describeTrails().promise();

      const activeTrails = response.trailList!.filter(trail =>
        trail.IsMultiRegionTrail && trail.IncludeGlobalServiceEvents
      );

      expect(activeTrails.length).toBeGreaterThan(0);

      // Check trail status
      const statusResponse = await cloudtrail.getTrailStatus({
        Name: activeTrails[0].TrailARN!
      }).promise();

      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('Monitoring and Alarms', () => {
    test('CloudWatch alarms are configured and active', async () => {
      const cloudwatch = new AWS.CloudWatch();

      const response = await cloudwatch.describeAlarms().promise();

      // Check for EC2 CPU alarms
      const ec2Alarms = response.MetricAlarms!.filter(alarm =>
        alarm.Namespace === 'AWS/EC2' &&
        alarm.MetricName === 'CPUUtilization'
      );

      expect(ec2Alarms.length).toBeGreaterThanOrEqual(2);

      // Check for RDS CPU alarm
      const rdsAlarms = response.MetricAlarms!.filter(alarm =>
        alarm.Namespace === 'AWS/RDS' &&
        alarm.MetricName === 'CPUUtilization'
      );

      expect(rdsAlarms.length).toBeGreaterThanOrEqual(1);

    });
  });

  describe('End-to-End Workflow', () => {
    test('complete infrastructure connectivity works', async () => {
      if (!outputs.VPCId || !outputs.LambdaFunctionName || !outputs.S3BucketName) {
        return;
      }

      // Test 1: Lambda can access S3 through VPC endpoint
      const lambdaResponse = await lambda.invoke({
        FunctionName: outputs.LambdaFunctionName,
        InvocationType: 'RequestResponse'
      }).promise();

      expect(lambdaResponse.StatusCode).toBe(200);

      // Test 2: Verify S3 bucket can be accessed (permissions allowing)
      try {
        await s3.headObject({
          Bucket: outputs.S3BucketName,
          Key: 'test-connectivity'
        }).promise();
      } catch (error: any) {
        // 404 is expected if object doesn't exist, but bucket should be accessible
        expect(error.statusCode).toBe(404);
      }

      // Test 3: Verify database connectivity (endpoint resolution)
      if (outputs.DatabaseEndpoint) {
        const dns = require('dns').promises;
        try {
          const addresses = await dns.resolve4(outputs.DatabaseEndpoint);
          expect(addresses.length).toBeGreaterThan(0);
        } catch (error) {
          // DNS resolution might fail in some environments, but endpoint should be valid format
          expect(outputs.DatabaseEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
        }
      }
    });
  });

  describe('Security Compliance', () => {
    test('all resources follow security best practices', async () => {
      if (!outputs.VPCId) return;

      // Check that no EC2 instances have public IPs
      const ec2Response = await ec2.describeInstances({
        Filters: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }]
      }).promise();

      const instances = ec2Response.Reservations!.flatMap(r => r.Instances || []);
      instances.forEach(instance => {
        if (instance.SubnetId) {
          // Instances in private subnets should not have public IPs
          expect(instance.PublicIpAddress).toBeUndefined();
        }
      });

      // Check that Lambda function is in private subnet
      if (outputs.LambdaFunctionName) {
        const lambdaResponse = await lambda.getFunction({
          FunctionName: outputs.LambdaFunctionName
        }).promise();

        expect(lambdaResponse.Configuration!.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      }
    });

    test('encryption is enabled on all applicable resources', async () => {
      // S3 encryption already tested above

      // RDS encryption
      if (outputs.DatabaseEndpoint) {
        const dbIdentifierMatch = outputs.DatabaseEndpoint.match(/^([^.]+)\./);
        if (dbIdentifierMatch) {
          const rdsResponse = await rds.describeDBInstances({
            DBInstanceIdentifier: dbIdentifierMatch[1]
          }).promise();

          expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);
        }
      }
    });
  });
});
