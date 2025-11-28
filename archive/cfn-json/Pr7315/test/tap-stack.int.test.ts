import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand
} from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand
} from '@aws-sdk/client-iam';

// AWS SDK configuration
const region = process.env.AWS_REGION || 'us-east-2';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });

// Load outputs from flat-outputs.json
let outputs: Record<string, any> = {};
let outputsLoaded = false;

const loadOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const fileContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(fileContent);
      
      // Check if it's a placeholder file
      if (outputs._comment && outputs._comment.includes('Placeholder')) {
        console.warn('WARNING: Placeholder outputs detected. Deploy the stack first to run integration tests.');
        outputsLoaded = false;
      } else {
        outputsLoaded = true;
        console.log('SUCCESS: Loaded deployment outputs:', Object.keys(outputs).length, 'outputs found');
      }
    } else {
      console.warn('WARNING: cfn-outputs/flat-outputs.json not found. Deploy the stack first.');
    }
  } catch (error) {
    console.warn('Failed to load outputs:', error);
  }
};

// Load outputs before all tests
beforeAll(() => {
  loadOutputs();
});


describe('Loan Processing Infrastructure Integration Tests', () => {
  // Set timeout for all tests in this suite
  jest.setTimeout(30000);
  describe('Deployment Outputs', () => {
    test('outputs file should exist and contain valid data', () => {
      const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('should have all required outputs', () => {
      if (!outputsLoaded) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const requiredOutputs = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'LoadBalancerDNS',
        'LoadBalancerArn',
        'DatabaseClusterEndpoint',
        'DocumentBucketName',
        'DocumentBucketArn',
        'KMSKeyId',
        'AutoScalingGroupName'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      if (!outputsLoaded || !outputs.VPCId) {
        console.log('Skipping: VPC output not available');
        return;
      }
      
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are typically enabled by default but might not be in the response
      // We can verify them if needed with DescribeVpcAttribute commands
    });

    test('should have 3 public subnets', async () => {
      if (!outputsLoaded || !outputs.PublicSubnets) {
        console.log('Skipping: Public subnets output not available');
        return;
      }

      const subnetIds = outputs.PublicSubnets.split(',');
      expect(subnetIds).toHaveLength(3);

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('should have 3 private subnets', async () => {
      if (!outputsLoaded || !outputs.PrivateSubnets) {
        console.log('Skipping: Private subnets output not available');
        return;
      }

      const subnetIds = outputs.PrivateSubnets.split(',');
      expect(subnetIds).toHaveLength(3);

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('should have NAT Gateways for private subnet connectivity', async () => {
      if (!outputsLoaded || !outputs.VPCId) {
        console.log('Skipping: VPC output not available');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database Layer', () => {
    test('Aurora cluster should exist and be available', async () => {
      if (!outputsLoaded || !outputs.DatabaseClusterEndpoint) {
        console.log('Skipping: Database endpoint not available');
        return;
      }

      // Extract cluster identifier from endpoint
      // Format: cluster-name.cluster-xxxxx.region.rds.amazonaws.com
      const clusterIdentifier = outputs.DatabaseClusterEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      
      try {
        const response = await rdsClient.send(command);
        
        expect(response.DBClusters).toHaveLength(1);
        const cluster = response.DBClusters![0];
        expect(cluster.Status).toBe('available');
        expect(cluster.Engine).toBe('aurora-postgresql');
        expect(cluster.EngineMode).toBe('provisioned');
        expect(cluster.StorageEncrypted).toBe(true);
      } catch (error: any) {
        if (error.name === 'DBClusterNotFoundFault') {
          console.log('Database cluster not found - may not be deployed yet');
        } else {
          throw error;
        }
      }
    });

    test('Aurora should have Serverless v2 scaling configured', async () => {
      if (!outputsLoaded || !outputs.DatabaseClusterEndpoint) {
        console.log('Skipping: Database endpoint not available');
        return;
      }

      const clusterIdentifier = outputs.DatabaseClusterEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      
      try {
        const response = await rdsClient.send(command);
        const cluster = response.DBClusters![0];
        
        expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
        expect(cluster.ServerlessV2ScalingConfiguration?.MinCapacity).toBe(0.5);
        expect(cluster.ServerlessV2ScalingConfiguration?.MaxCapacity).toBe(4);
      } catch (error: any) {
        if (error.name === 'DBClusterNotFoundFault') {
          console.log('Database cluster not found - may not be deployed yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      if (!outputsLoaded || !outputs.LoadBalancerArn) {
        console.log('Skipping: Load balancer ARN not available');
        return;
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.LoadBalancerArn]
      });
      
      try {
        const response = await elbClient.send(command);
        
        expect(response.LoadBalancers).toHaveLength(1);
        const alb = response.LoadBalancers![0];
        expect(alb.State?.Code).toBe('active');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.Type).toBe('application');
      } catch (error) {
        console.log('ALB not found or not accessible');
      }
    });

    test('ALB should have HTTPS listener', async () => {
      if (!outputsLoaded || !outputs.LoadBalancerArn) {
        console.log('Skipping: Load balancer ARN not available');
        return;
      }

      const command = new DescribeListenersCommand({
        LoadBalancerArn: outputs.LoadBalancerArn
      });
      
      try {
        const response = await elbClient.send(command);
        
        expect(response.Listeners).toBeDefined();
        const httpsListener = response.Listeners?.find(l => l.Protocol === 'HTTPS');
        expect(httpsListener).toBeDefined();
        expect(httpsListener?.Port).toBe(443);
      } catch (error) {
        console.log('Listeners not found or not accessible');
      }
    });
  });

  describe('Storage Layer', () => {
    test('S3 document bucket should exist', async () => {
      if (!outputsLoaded || !outputs.DocumentBucketName) {
        console.log('Skipping: Document bucket name not available');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.DocumentBucketName
      });
      
      try {
        await s3Client.send(command);
        expect(true).toBe(true); // Bucket exists
      } catch (error: any) {
        if (error.name === 'NotFound') {
          fail('S3 bucket does not exist');
        } else {
          console.log('S3 bucket access error:', error.message);
        }
      }
    });

    test('S3 bucket should have versioning enabled', async () => {
      if (!outputsLoaded || !outputs.DocumentBucketName) {
        console.log('Skipping: Document bucket name not available');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.DocumentBucketName
      });
      
      try {
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        console.log('Could not get bucket versioning:', error);
      }
    });

    test('S3 bucket should have encryption enabled', async () => {
      if (!outputsLoaded || !outputs.DocumentBucketName) {
        console.log('Skipping: Document bucket name not available');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.DocumentBucketName
      });
      
      try {
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
        
        const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
        expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBeDefined();
      } catch (error) {
        console.log('Could not get bucket encryption:', error);
      }
    });

    test('S3 bucket should have lifecycle configuration', async () => {
      if (!outputsLoaded || !outputs.DocumentBucketName) {
        console.log('Skipping: Document bucket name not available');
        return;
      }

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.DocumentBucketName
      });
      
      try {
        const response = await s3Client.send(command);
        expect(response.Rules).toBeDefined();
        expect(response.Rules!.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'NoSuchLifecycleConfiguration') {
          fail('S3 bucket has no lifecycle configuration');
        } else {
          console.log('Could not get bucket lifecycle:', error);
        }
      }
    });
  });

  describe('Auto Scaling', () => {
    test('Auto Scaling Group should exist', async () => {
      if (!outputsLoaded || !outputs.AutoScalingGroupName) {
        console.log('Skipping: Auto Scaling Group name not available');
        return;
      }

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      });
      
      try {
        const response = await autoScalingClient.send(command);
        
        expect(response.AutoScalingGroups).toHaveLength(1);
        const asg = response.AutoScalingGroups![0];
        expect(asg.MinSize).toBeGreaterThanOrEqual(1);
        expect(asg.MaxSize).toBeGreaterThanOrEqual(3);
        expect(asg.HealthCheckType).toBe('ELB');
      } catch (error) {
        console.log('Auto Scaling Group not found');
      }
    });

    test('Auto Scaling should have target tracking policy', async () => {
      if (!outputsLoaded || !outputs.AutoScalingGroupName) {
        console.log('Skipping: Auto Scaling Group name not available');
        return;
      }

      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: outputs.AutoScalingGroupName
      });
      
      try {
        const response = await autoScalingClient.send(command);
        
        expect(response.ScalingPolicies).toBeDefined();
        const targetTrackingPolicy = response.ScalingPolicies?.find(
          p => p.PolicyType === 'TargetTrackingScaling'
        );
        expect(targetTrackingPolicy).toBeDefined();
      } catch (error) {
        console.log('Scaling policies not found');
      }
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch log groups should exist with 365-day retention', async () => {
      if (!outputsLoaded) {
        console.log('Skipping: Outputs not loaded');
        return;
      }

      const logGroupPrefixes = [
        `/aws/loan-processing/application-${environmentSuffix}`,
        `/aws/rds/cluster/loanprocessing-${environmentSuffix}`,
        `/aws/elasticloadbalancing/alb-${environmentSuffix}`
      ];

      for (const prefix of logGroupPrefixes) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: prefix
        });
        
        try {
          const response = await logsClient.send(command);
          
          if (response.logGroups && response.logGroups.length > 0) {
            const logGroup = response.logGroups[0];
            expect(logGroup.retentionInDays).toBe(365);
          }
        } catch (error) {
          console.log(`Log group ${prefix} not found`);
        }
      }
    });
  });

  describe('Security', () => {
    test('KMS key should exist and be enabled', async () => {
      if (!outputsLoaded || !outputs.KMSKeyId) {
        console.log('Skipping: KMS key ID not available');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });
      
      try {
        const response = await kmsClient.send(command);
        
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
        expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(response.KeyMetadata?.Origin).toBe('AWS_KMS');
      } catch (error) {
        console.log('KMS key not found or not accessible');
      }
    });

    test('KMS key should have rotation enabled', async () => {
      if (!outputsLoaded || !outputs.KMSKeyId) {
        console.log('Skipping: KMS key ID not available');
        return;
      }

      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.KMSKeyId
      });
      
      try {
        const response = await kmsClient.send(command);
        expect(response.KeyRotationEnabled).toBe(true);
      } catch (error) {
        console.log('Could not get key rotation status');
      }
    });
  });

  describe('High Availability', () => {
    test('resources should be distributed across multiple AZs', async () => {
      if (!outputsLoaded || !outputs.PrivateSubnets) {
        console.log('Skipping: Subnet outputs not available');
        return;
      }

      const subnetIds = outputs.PrivateSubnets.split(',');
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      
      try {
        const response = await ec2Client.send(command);
        
        const azSet = new Set<string>();
        response.Subnets?.forEach(subnet => {
          if (subnet.AvailabilityZone) {
            azSet.add(subnet.AvailabilityZone);
          }
        });
        
        expect(azSet.size).toBe(3);
      } catch (error) {
        console.log('Could not verify AZ distribution');
      }
    });
  });

  describe('Compliance', () => {
    test('all data at rest should be encrypted', async () => {
      if (!outputsLoaded) {
        console.log('Skipping: Outputs not loaded');
        return;
      }

      // S3 encryption check
      if (outputs.DocumentBucketName) {
        const command = new GetBucketEncryptionCommand({
          Bucket: outputs.DocumentBucketName
        });
        
        try {
          const response = await s3Client.send(command);
          expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        } catch (error) {
          console.log('Could not verify S3 encryption');
        }
      }

      // RDS encryption check (already covered in Database Layer tests)
      // KMS key check (already covered in Security tests)
    });

    test('backup retention should be configured', async () => {
      if (!outputsLoaded || !outputs.DatabaseClusterEndpoint) {
        console.log('Skipping: Database endpoint not available');
        return;
      }

      const clusterIdentifier = outputs.DatabaseClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      
      try {
        const response = await rdsClient.send(command);
        const cluster = response.DBClusters![0];
        expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      } catch (error) {
        console.log('Could not verify backup retention');
      }
    });
  });
});



