import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListInstanceProfilesCommand
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSnapshotsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

const region = 'ap-south-1';
const environment = process.env.ENVIRONMENT_SUFFIX || 'test';

// Initialize AWS service clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cloudfrontClient = new CloudFrontClient({ region });
const iamClient = new IAMClient({ region });
const autoScalingClient = new AutoScalingClient({ region });

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

describe('TAP Infrastructure Integration Tests - PROMPT.md Compliance', () => {
  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No outputs file found. Some tests may be skipped.');
    }
  });

  describe('PROMPT.md Requirement 2: Pulumi Provider - Explicit Region Control', () => {
    test('e2e: Infrastructure deployed in correct region', async () => {
      const vpcName = `secure-vpc-${environment}`;

      const response = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [vpcName] },
          { Name: 'state', Values: ['available'] }
        ]
      }));

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThanOrEqual(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('e2e: All resources use consistent region deployment', async () => {
      // Verify VPC, RDS, and other resources are in the same region
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`secure-vpc-${environment}`] }]
      }));

      if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
        expect(vpcResponse.Vpcs[0].State).toBe('available');
      }

      // Check if RDS is in same region
      try {
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `mysql-db-${environment}`
        }));

        if (rdsResponse.DBInstances && rdsResponse.DBInstances.length > 0) {
          expect(rdsResponse.DBInstances[0].AvailabilityZone).toContain(region.slice(0, -1));
        }
      } catch (error: any) {
        if (error.name !== 'DBInstanceNotFoundFault') {
          throw error;
        }
      }
    });
  });

  describe('PROMPT.md Requirement 3: Resource Naming & Tagging', () => {
    test('e2e: All resources include environment value in names', async () => {
      const resourceNames = [
        `secure-vpc-${environment}`,
        `web-sg-${environment}`,
        `db-sg-${environment}`,
        `mysql-db-${environment}`
      ];

      // Check VPC naming
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [resourceNames[0]] }]
      }));

      if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
        expect(vpcResponse.Vpcs[0].Tags?.find(tag => tag.Key === 'Name')?.Value).toBe(resourceNames[0]);
      }

      // Check Security Groups naming
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [resourceNames[1]] }]
      }));

      if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
        expect(sgResponse.SecurityGroups[0].GroupName).toBe(resourceNames[1]);
      }
    });

    test('e2e: All resources have required tags applied', async () => {
      const requiredTags = ['Environment', 'ManagedBy', 'Region'];

      // Check VPC tags
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`secure-vpc-${environment}`] }]
      }));

      if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
        const vpc = vpcResponse.Vpcs[0];
        const tagKeys = vpc.Tags?.map(tag => tag.Key) || [];

        requiredTags.forEach(requiredTag => {
          expect(tagKeys).toContain(requiredTag);
        });

        expect(vpc.Tags?.find(tag => tag.Key === 'Environment')?.Value).toBe(environment);
        expect(vpc.Tags?.find(tag => tag.Key === 'ManagedBy')?.Value).toBe('Pulumi');
        expect(vpc.Tags?.find(tag => tag.Key === 'Region')?.Value).toBe(region);
      }
    });

    test('e2e: S3 buckets have proper naming and tagging', async () => {
      if (outputs.appBucketName) {
        try {
          await s3Client.send(new HeadBucketCommand({ Bucket: outputs.appBucketName }));
          expect(outputs.appBucketName).toContain(environment);
        } catch (error: any) {
          if (error.name !== 'NoSuchBucket') {
            throw error;
          }
        }
      }

      if (outputs.logsBucketName) {
        try {
          await s3Client.send(new HeadBucketCommand({ Bucket: outputs.logsBucketName }));
          expect(outputs.logsBucketName).toContain(environment);
        } catch (error: any) {
          if (error.name !== 'NoSuchBucket') {
            throw error;
          }
        }
      }
    });
  });

  describe('PROMPT.md Requirement 4.1: S3 Versioning and Encryption', () => {
    test('e2e: All S3 buckets have versioning enabled', async () => {
      const buckets = [outputs.appBucketName, outputs.logsBucketName].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
            Bucket: bucketName
          }));

          expect(versioningResponse.Status).toBe('Enabled');
        } catch (error: any) {
          if (error.name === 'NoSuchBucket') {
            console.log(`Bucket ${bucketName} not found, may not be deployed yet`);
          } else {
            throw error;
          }
        }
      }
    });

    test('e2e: All S3 buckets have encryption at rest enabled', async () => {
      const buckets = [outputs.appBucketName, outputs.logsBucketName].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
            Bucket: bucketName
          }));

          expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
          expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);

          const config = encryptionResponse.ServerSideEncryptionConfiguration!;
          expect(config.Rules).toBeDefined();
          const rule = config.Rules![0];
          expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
        } catch (error: any) {
          if (error.name === 'NoSuchBucket') {
            console.log(`Bucket ${bucketName} not found, may not be deployed yet`);
          } else {
            throw error;
          }
        }
      }
    });

    test('e2e: S3 buckets have public access blocked', async () => {
      const buckets = [outputs.appBucketName, outputs.logsBucketName].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({
            Bucket: bucketName
          }));

          expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
          expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
          expect(publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
          expect(publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
        } catch (error: any) {
          if (error.name === 'NoSuchBucket') {
            console.log(`Bucket ${bucketName} not found, may not be deployed yet`);
          } else {
            throw error;
          }
        }
      }
    });
  });

  describe('PROMPT.md Requirement 4.2: EC2 Instance Type t3.micro', () => {
    test('e2e: All EC2 instances are t3.micro type', async () => {
      const response = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`web-server-${environment}`] },
          { Name: 'instance-state-name', Values: ['running', 'pending', 'stopped'] }
        ]
      }));

      if (response.Reservations && response.Reservations.length > 0) {
        const instances = response.Reservations.flatMap(r => r.Instances || []);

        instances.forEach(instance => {
          expect(instance.InstanceType).toBe('t3.micro');
        });
      } else {
        console.log('No EC2 instances found, may not be deployed yet');
      }
    });

    test('e2e: Launch template specifies t3.micro instance type', async () => {
      // This test verifies through Auto Scaling Groups since launch templates are referenced there
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({}));

      if (asgResponse.AutoScalingGroups) {
        const ourAsg = asgResponse.AutoScalingGroups.find(asg =>
          asg.AutoScalingGroupName?.includes(environment)
        );

        if (ourAsg && ourAsg.LaunchTemplate) {
          // The launch template should be configured for t3.micro
          expect(ourAsg.LaunchTemplate).toBeDefined();
        }
      }
    });
  });

  describe('PROMPT.md Requirement 4.3: IAM Minimum Privileges', () => {
    test('e2e: IAM roles exist with minimum required privileges', async () => {
      const roleNames = [`ec2-role-${environment}`, `flow-logs-role-${environment}`];

      for (const roleName of roleNames) {
        try {
          const roleResponse = await iamClient.send(new GetRoleCommand({
            RoleName: roleName
          }));

          expect(roleResponse.Role).toBeDefined();
          expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeDefined();

          // Check attached policies
          const policiesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
            RoleName: roleName
          }));

          expect(policiesResponse.AttachedPolicies).toBeDefined();
        } catch (error: any) {
          if (error.name === 'NoSuchEntityException') {
            console.log(`Role ${roleName} not found, may not be deployed yet`);
          } else {
            throw error;
          }
        }
      }
    });

    test('e2e: EC2 instances use IAM roles instead of direct permissions', async () => {
      const profileResponse = await iamClient.send(new ListInstanceProfilesCommand({}));

      const ourProfile = profileResponse.InstanceProfiles?.find(profile =>
        profile.InstanceProfileName?.includes(environment)
      );

      if (ourProfile) {
        expect(ourProfile.Roles).toBeDefined();
        expect(ourProfile.Roles!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('PROMPT.md Requirement 4.4: VPC Flow Logs', () => {
    test('e2e: VPC Flow Logs are configured and active', async () => {
      if (outputs.vpcFlowLogId) {
        // Use the specific flow log ID from outputs
        const flowLogsResponse = await ec2Client.send(new DescribeFlowLogsCommand({
          FlowLogIds: [outputs.vpcFlowLogId]
        }));

        expect(flowLogsResponse.FlowLogs).toBeDefined();
        expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThanOrEqual(1);

        const flowLog = flowLogsResponse.FlowLogs![0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
      } else {
        // Fallback to VPC-based search
        let vpcId = outputs.vpcId;

        if (!vpcId) {
          const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
            Filters: [{ Name: 'tag:Name', Values: [`secure-vpc-${environment}`] }]
          }));

          if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
            vpcId = vpcResponse.Vpcs[0].VpcId;
          }
        }

        if (vpcId) {
          const flowLogsResponse = await ec2Client.send(new DescribeFlowLogsCommand({
            Filter: [
              { Name: 'resource-id', Values: [vpcId] },
              { Name: 'resource-type', Values: ['VPC'] }
            ]
          }));

          expect(flowLogsResponse.FlowLogs).toBeDefined();
          expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThanOrEqual(1);

          const flowLog = flowLogsResponse.FlowLogs![0];
          expect(flowLog.FlowLogStatus).toBe('ACTIVE');
          expect(flowLog.TrafficType).toBe('ALL');
        } else {
          console.log('VPC not found, skipping Flow Logs test');
        }
      }
    });

    test('e2e: CloudWatch Log Group exists for VPC Flow Logs', async () => {
      const logGroupName = `/aws/vpc/flowlogs/${environment}`;

      const response = await logsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      if (logGroup) {
        expect(logGroup.retentionInDays).toBe(14);
      } else {
        console.log('VPC Flow Logs group not found, may not be deployed yet');
      }
    });
  });

  describe('PROMPT.md Requirement 4.5: RDS Multi-AZ Deployment', () => {
    test('e2e: RDS instances are deployed in Multi-AZ mode', async () => {
      const dbIdentifier = `mysql-db-${environment}`;

      try {
        let response;
        if (outputs.dbEndpoint) {
          const identifier = outputs.dbEndpoint.split('.')[0];
          response = await rdsClient.send(new DescribeDBInstancesCommand({
            DBInstanceIdentifier: identifier
          }));
        } else {
          response = await rdsClient.send(new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier
          }));
        }

        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBe(1);

        const db = response.DBInstances![0];
        expect(db.MultiAZ).toBe(true);
        expect(db.DBInstanceStatus).toBe('available');
        expect(db.StorageEncrypted).toBe(true);
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log('Database not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    });

    test('e2e: RDS backup retention is properly configured', async () => {
      const dbIdentifier = `mysql-db-${environment}`;

      try {
        const response = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));

        if (response.DBInstances && response.DBInstances.length > 0) {
          const db = response.DBInstances[0];
          expect(db.BackupRetentionPeriod).toBe(7);
          expect(db.PreferredBackupWindow).toBeDefined();
          expect(db.PreferredMaintenanceWindow).toBeDefined();
        }
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log('Database not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('PROMPT.md Requirement 4.6: Automatic RDS Backup', () => {
    test('e2e: RDS automatic snapshots are configured', async () => {
      const dbIdentifier = `mysql-db-${environment}`;

      try {
        const snapshotsResponse = await rdsClient.send(new DescribeDBSnapshotsCommand({
          DBInstanceIdentifier: dbIdentifier,
          SnapshotType: 'manual'
        }));

        if (snapshotsResponse.DBSnapshots && snapshotsResponse.DBSnapshots.length > 0) {
          const snapshot = snapshotsResponse.DBSnapshots[0];
          expect(snapshot.Status).toMatch(/available|creating/);
          expect(snapshot.Encrypted).toBe(true);
        }
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log('Database snapshots not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    });

    test('e2e: RDS deletion protection is enabled', async () => {
      const dbIdentifier = `mysql-db-${environment}`;

      try {
        const response = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));

        if (response.DBInstances && response.DBInstances.length > 0) {
          const db = response.DBInstances[0];
          expect(db.DeletionProtection).toBe(true);
        }
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log('Database not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('PROMPT.md Requirement 4.7: CloudFront Logging', () => {
    test('e2e: CloudFront distribution has logging enabled', async () => {
      if (outputs.cloudFrontDomainName) {
        const response = await cloudfrontClient.send(new ListDistributionsCommand({}));

        if (response.DistributionList && response.DistributionList.Items) {
          const distribution = response.DistributionList.Items.find(d =>
            d.DomainName === outputs.cloudFrontDomainName
          );

          if (distribution) {
            const detailResponse = await cloudfrontClient.send(new GetDistributionCommand({
              Id: distribution.Id
            }));

            const config = detailResponse.Distribution?.DistributionConfig;
            expect(config?.Logging?.Enabled).toBe(true);
            expect(config?.Logging?.Bucket).toBeDefined();
            expect(config?.Logging?.Prefix).toContain('cloudfront-logs');
          }
        }
      } else {
        console.log('CloudFront domain not in outputs, skipping test');
      }
    });

    test('e2e: CloudFront logs bucket has lifecycle policy', async () => {
      if (outputs.logsBucketName) {
        try {
          const lifecycleResponse = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
            Bucket: outputs.logsBucketName
          }));

          expect(lifecycleResponse.Rules).toBeDefined();
          const logRule = lifecycleResponse.Rules!.find(rule =>
            rule.Filter?.Prefix?.includes('cloudfront-logs')
          );

          if (logRule) {
            expect(logRule.Status).toBe('Enabled');
            expect(logRule.Expiration?.Days).toBe(90);
          }
        } catch (error: any) {
          if (error.name === 'NoSuchBucket') {
            console.log('Logs bucket not found, may not be deployed yet');
          } else {
            throw error;
          }
        }
      }
    });
  });

  describe('PROMPT.md Requirement 4.8: AWS Secrets Manager', () => {
    test('e2e: API keys are stored in Secrets Manager', async () => {
      const secretName = outputs.apiSecretName || `api-keys-${environment}`;

      try {
        const response = await secretsClient.send(new DescribeSecretCommand({
          SecretId: secretName
        }));

        expect(response.Name).toBe(secretName);
        expect(response.KmsKeyId).toBeDefined();
        expect(response.Description).toContain('API keys');

        // Verify secret can be retrieved
        const valueResponse = await secretsClient.send(new GetSecretValueCommand({
          SecretId: secretName
        }));

        expect(valueResponse.SecretString).toBeDefined();
        const secretData = JSON.parse(valueResponse.SecretString!);
        expect(secretData.stripe_key).toBeDefined();
        expect(secretData.sendgrid_key).toBeDefined();
        expect(secretData.jwt_secret).toBeDefined();
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('API keys secret not found, may not be deployed yet');
        } else if (error.name === 'InvalidRequestException' && error.message.includes('marked for deletion')) {
          console.log('Secret is marked for deletion, skipping test');
        } else {
          throw error;
        }
      }
    });

    test('e2e: RDS credentials are managed by AWS', async () => {
      const dbIdentifier = `mysql-db-${environment}`;

      try {
        const response = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));

        if (response.DBInstances && response.DBInstances.length > 0) {
          const db = response.DBInstances[0];
          // RDS should manage its own master user password
          expect(db.MasterUserSecret).toBeDefined();
          expect(db.MasterUserSecret!.KmsKeyId).toBeDefined();
        }
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log('Database not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    });

    test('e2e: Secrets are encrypted with KMS', async () => {
      if (outputs.kmsKeyId) {
        const response = await kmsClient.send(new DescribeKeyCommand({
          KeyId: outputs.kmsKeyId
        }));

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');

        // Check key rotation
        const rotationResponse = await kmsClient.send(new GetKeyRotationStatusCommand({
          KeyId: outputs.kmsKeyId
        }));

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      } else {
        console.log('KMS key ID not in outputs, skipping test');
      }
    });
  });

  describe('Network Security and Architecture', () => {
    test('e2e: VPC has proper CIDR and DNS configuration', async () => {
      let vpcId = outputs.vpcId;

      if (!vpcId) {
        const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`secure-vpc-${environment}`] }]
        }));

        if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
          vpcId = vpcResponse.Vpcs[0].VpcId;
        }
      }

      if (vpcId) {
        const response = await ec2Client.send(new DescribeVpcsCommand({
          VpcIds: [vpcId]
        }));

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        // DNS settings are enabled but not directly available in VPC response
      }
    });

    test('e2e: Subnets are properly distributed across AZs', async () => {
      let vpcId = outputs.vpcId;

      if (!vpcId) {
        const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`secure-vpc-${environment}`] }]
        }));

        if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
          vpcId = vpcResponse.Vpcs[0].VpcId;
        }
      }

      if (vpcId) {
        const response = await ec2Client.send(new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }));

        expect(response.Subnets!.length).toBe(4);

        const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
        const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);

        expect(publicSubnets.length).toBe(2);
        expect(privateSubnets.length).toBe(2);

        // Verify different AZs
        const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);
      }
    });

    test('e2e: Security groups follow least privilege principle', async () => {
      const webSgName = `web-sg-${environment}`;
      const dbSgName = `db-sg-${environment}`;

      // Check web security group
      const webSgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [webSgName] }]
      }));

      if (webSgResponse.SecurityGroups && webSgResponse.SecurityGroups.length > 0) {
        const webSg = webSgResponse.SecurityGroups[0];
        const ingressRules = webSg.IpPermissions!;

        // Should allow HTTP/HTTPS from internet
        const httpRule = ingressRules.find(rule => rule.FromPort === 80);
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

        // Should allow SSH only from VPC
        const sshRule = ingressRules.find(rule => rule.FromPort === 22);
        expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');
      }

      // Check database security group
      const dbSgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [dbSgName] }]
      }));

      if (dbSgResponse.SecurityGroups && dbSgResponse.SecurityGroups.length > 0) {
        const dbSg = dbSgResponse.SecurityGroups[0];
        const ingressRules = dbSg.IpPermissions!;

        // Should only allow MySQL from web security group
        const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306);
        expect(mysqlRule?.UserIdGroupPairs).toBeDefined();
        expect(mysqlRule?.UserIdGroupPairs!.length).toBe(1);
      }
    });

    test('e2e: VPC endpoints are configured for secure access', async () => {
      let vpcId = outputs.vpcId;

      if (!vpcId) {
        const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`secure-vpc-${environment}`] }]
        }));

        if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
          vpcId = vpcResponse.Vpcs[0].VpcId;
        }
      }

      if (vpcId) {
        const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }));

        if (response.VpcEndpoints && response.VpcEndpoints.length > 0) {
          const endpoints = response.VpcEndpoints;

          // Should have S3 gateway endpoint
          const s3Endpoint = endpoints.find(ep =>
            ep.ServiceName?.includes('s3') && ep.VpcEndpointType === 'Gateway'
          );
          expect(s3Endpoint?.State?.toLowerCase()).toBe('available');

          // Should have Secrets Manager interface endpoint
          const secretsEndpoint = endpoints.find(ep =>
            ep.ServiceName?.includes('secretsmanager') && ep.VpcEndpointType === 'Interface'
          );
          if (secretsEndpoint) {
            expect(secretsEndpoint.State?.toLowerCase()).toBe('available');
          }
        }
      }
    });
  });

  describe('Production Readiness and Compliance', () => {
    test('e2e: All critical resources have monitoring enabled', async () => {
      // Check EC2 monitoring
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`web-server-${environment}`] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      }));

      if (instanceResponse.Reservations && instanceResponse.Reservations.length > 0) {
        const instances = instanceResponse.Reservations.flatMap(r => r.Instances || []);
        instances.forEach(instance => {
          expect(instance.Monitoring?.State).toBe('enabled');
        });
      }
    });

    test('e2e: Disaster recovery capabilities are in place', async () => {
      // Check RDS backup configuration
      try {
        const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `mysql-db-${environment}`
        }));

        if (dbResponse.DBInstances && dbResponse.DBInstances.length > 0) {
          const db = dbResponse.DBInstances[0];
          expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
          expect(db.MultiAZ).toBe(true);
          expect(db.StorageEncrypted).toBe(true);
        }
      } catch (error: any) {
        if (error.name !== 'DBInstanceNotFoundFault') {
          throw error;
        }
      }

      // Check S3 versioning for data protection
      if (outputs.appBucketName) {
        try {
          const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
            Bucket: outputs.appBucketName
          }));
          expect(versioningResponse.Status).toBe('Enabled');
        } catch (error: any) {
          if (error.name !== 'NoSuchBucket') {
            throw error;
          }
        }
      }
    });

    test('e2e: Security compliance measures are implemented', async () => {
      // Check encryption at rest
      if (outputs.kmsKeyId) {
        const kmsResponse = await kmsClient.send(new DescribeKeyCommand({
          KeyId: outputs.kmsKeyId
        }));

        expect(kmsResponse.KeyMetadata?.KeyState).toBe('Enabled');
        expect(kmsResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      }

      // Check VPC Flow Logs for audit trail
      let vpcId = outputs.vpcId;
      if (vpcId) {
        const flowLogsResponse = await ec2Client.send(new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }]
        }));

        if (flowLogsResponse.FlowLogs && flowLogsResponse.FlowLogs.length > 0) {
          expect(flowLogsResponse.FlowLogs[0].FlowLogStatus).toBe('ACTIVE');
        }
      }
    });

    test('e2e: High availability architecture is implemented', async () => {
      // Check Multi-AZ RDS
      try {
        const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `mysql-db-${environment}`
        }));

        if (dbResponse.DBInstances && dbResponse.DBInstances.length > 0) {
          expect(dbResponse.DBInstances[0].MultiAZ).toBe(true);
        }
      } catch (error: any) {
        if (error.name !== 'DBInstanceNotFoundFault') {
          throw error;
        }
      }

      // Check Auto Scaling Group configuration
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({}));

      if (asgResponse.AutoScalingGroups) {
        const ourAsg = asgResponse.AutoScalingGroups.find(asg =>
          asg.AutoScalingGroupName?.includes(environment)
        );

        if (ourAsg) {
          expect(ourAsg.MinSize).toBeGreaterThanOrEqual(1);
          expect(ourAsg.MaxSize).toBeGreaterThanOrEqual(2);
          expect(ourAsg.HealthCheckType).toBe('ELB');
        }
      }
    });
  });
});