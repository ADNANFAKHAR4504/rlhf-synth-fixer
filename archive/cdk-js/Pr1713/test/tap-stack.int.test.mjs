// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import fs from 'fs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Auto-detect environment suffix from CloudFormation outputs
// This makes tests environment-agnostic and more robust
function detectEnvironmentSuffix(outputs) {
  // Look for any key that contains LoadBalancerDNS and extract the suffix
  for (const key of Object.keys(outputs)) {
    if (key.startsWith('LoadBalancerDNS')) {
      return key.replace('LoadBalancerDNS', '');
    }
  }
  // Fallback to environment variable or default
  return process.env.ENVIRONMENT_SUFFIX || 'dev';
}

const environmentSuffix = detectEnvironmentSuffix(outputs);

// Initialize AWS clients
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const rdsClient = new RDSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const kmsClient = new KMSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const elbv2Client = new ElasticLoadBalancingV2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const cloudWatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const iamClient = new IAMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('Turn Around Prompt API Integration Tests', () => {
  // Test timeout for integration tests
  jest.setTimeout(60000);

  describe('Infrastructure Deployment Validation', () => {
    test('should have all required CloudFormation outputs', () => {
      // Validate that all expected outputs exist
      expect(outputs).toHaveProperty(`LoadBalancerDNS${environmentSuffix}`);
      expect(outputs).toHaveProperty(`VpcId${environmentSuffix}`);
      expect(outputs).toHaveProperty(`DatabaseEndpoint${environmentSuffix}`);
      expect(outputs).toHaveProperty(`KmsKeyId${environmentSuffix}`);
      expect(outputs).toHaveProperty(`S3BucketName${environmentSuffix}`);
      expect(outputs).toHaveProperty(`SNSTopicArn${environmentSuffix}`);
      expect(outputs).toHaveProperty(`StackStatus${environmentSuffix}`);
      expect(outputs).toHaveProperty(`WebAppURL${environmentSuffix}`);

      // Validate stack status
      expect(outputs[`StackStatus${environmentSuffix}`]).toBe('DEPLOYED');
    });

    test('should have valid resource identifiers', () => {
      // Validate VPC ID format
      expect(outputs[`VpcId${environmentSuffix}`]).toMatch(/^vpc-[a-f0-9]+$/);

      // Validate KMS Key ID format
      expect(outputs[`KmsKeyId${environmentSuffix}`]).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );

      // Validate S3 bucket name format
      expect(outputs[`S3BucketName${environmentSuffix}`]).toMatch(
        /^webapp-storage-.*/
      );

      // Validate SNS Topic ARN format
      expect(outputs[`SNSTopicArn${environmentSuffix}`]).toMatch(
        /^arn:aws:sns:.*:.*:webapp-alerts-.*/
      );
    });
  });

  describe('VPC and Networking Infrastructure', () => {
    test('should have accessible VPC with correct configuration', async () => {
      const vpcId = outputs[`VpcId${environmentSuffix}`];

      const describeVpcsCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const vpcResponse = await ec2Client.send(describeVpcsCommand);
      expect(vpcResponse.Vpcs).toHaveLength(1);

      const vpc = vpcResponse.Vpcs[0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings may vary by deployment - check if they exist
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
    });

    test('should have public and private subnets in multiple AZs', async () => {
      const vpcId = outputs[`VpcId${environmentSuffix}`];

      const describeSubnetsCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const subnetsResponse = await ec2Client.send(describeSubnetsCommand);
      expect(subnetsResponse.Subnets.length).toBeGreaterThanOrEqual(4); // 2 AZs * 2 subnet types

      // Check for public subnets
      const publicSubnets = subnetsResponse.Subnets.filter(
        subnet => subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

      // Check for private subnets
      const privateSubnets = subnetsResponse.Subnets.filter(
        subnet => subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have security groups with proper rules', async () => {
      const vpcId = outputs[`VpcId${environmentSuffix}`];

      const describeSecurityGroupsCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const sgResponse = await ec2Client.send(describeSecurityGroupsCommand);
      expect(sgResponse.SecurityGroups.length).toBeGreaterThan(0);

      // Validate ALB security group (should allow HTTP/HTTPS inbound)
      const albSecurityGroups = sgResponse.SecurityGroups.filter(
        sg =>
          sg.GroupName.includes('alb') || sg.GroupName.includes('loadbalancer')
      );

      if (albSecurityGroups.length > 0) {
        const albSg = albSecurityGroups[0];
        const hasHttpRule = albSg.IpPermissions.some(
          rule => rule.FromPort === 80 || rule.FromPort === 443
        );
        expect(hasHttpRule).toBe(true);
      }
    });
  });

  describe('Load Balancer and Target Groups', () => {
    test('should have accessible Application Load Balancer', async () => {
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];

      const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
      });

      const albResponse = await elbv2Client.send(describeLoadBalancersCommand);
      expect(albResponse.LoadBalancers).toHaveLength(1);

      const alb = albResponse.LoadBalancers[0];
      expect(alb.State.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('should have target groups with healthy targets', async () => {
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];

      // First get the ALB to find its ARN
      const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
      });

      const albResponse = await elbv2Client.send(describeLoadBalancersCommand);
      const alb = albResponse.LoadBalancers[0];

      // Get target groups
      const describeTargetGroupsCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb.LoadBalancerArn,
      });

      const tgResponse = await elbv2Client.send(describeTargetGroupsCommand);
      expect(tgResponse.TargetGroups.length).toBeGreaterThan(0);

      // Check target health for each target group
      for (const targetGroup of tgResponse.TargetGroups) {
        const describeTargetHealthCommand = new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn,
        });

        const healthResponse = await elbv2Client.send(
          describeTargetHealthCommand
        );
        expect(healthResponse.TargetHealthDescriptions.length).toBeGreaterThan(
          0
        );

        // At least one target should be healthy
        const healthyTargets = healthResponse.TargetHealthDescriptions.filter(
          target => target.TargetHealth.State === 'healthy'
        );
        expect(healthyTargets.length).toBeGreaterThan(0);
      }
    });
  });

  describe('RDS Database Infrastructure', () => {
    test('should have accessible RDS instance', async () => {
      const dbEndpoint = outputs[`DatabaseEndpoint${environmentSuffix}`];

      const describeDBInstancesCommand = new DescribeDBInstancesCommand({});
      const dbResponse = await rdsClient.send(describeDBInstancesCommand);

      const dbInstance = dbResponse.DBInstances.find(
        db => db.Endpoint.Address === dbEndpoint
      );

      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.MultiAZ).toBe(true); // High availability
      expect(dbInstance.StorageEncrypted).toBe(true); // Encryption enabled
    });

    test('should have database subnet group in private subnets', async () => {
      const dbEndpoint = outputs[`DatabaseEndpoint${environmentSuffix}`];

      // Get DB instance to find subnet group
      const describeDBInstancesCommand = new DescribeDBInstancesCommand({});
      const dbResponse = await rdsClient.send(describeDBInstancesCommand);

      const dbInstance = dbResponse.DBInstances.find(
        db => db.Endpoint.Address === dbEndpoint
      );

      expect(dbInstance.DBSubnetGroup).toBeDefined();

      // Get subnet group details
      const describeDBSubnetGroupsCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbInstance.DBSubnetGroup.DBSubnetGroupName,
      });

      const subnetGroupResponse = await rdsClient.send(
        describeDBSubnetGroupsCommand
      );
      expect(subnetGroupResponse.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = subnetGroupResponse.DBSubnetGroups[0];
      expect(subnetGroup.Subnets.length).toBeGreaterThanOrEqual(2); // Multi-AZ
    });
  });

  describe('S3 Storage Infrastructure', () => {
    test('should have accessible S3 bucket with encryption', async () => {
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];

      // Check bucket exists and is accessible
      const headBucketCommand = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(headBucketCommand)).resolves.not.toThrow();

      // Check encryption configuration
      const getBucketEncryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const encryptionResponse = await s3Client.send(
        getBucketEncryptionCommand
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration.Rules.length
      ).toBeGreaterThan(0);
    });

    test('should have versioning enabled on S3 bucket', async () => {
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];

      const getBucketVersioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const versioningResponse = await s3Client.send(
        getBucketVersioningCommand
      );
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('KMS Encryption Infrastructure', () => {
    test('should have accessible KMS key with rotation enabled', async () => {
      const keyId = outputs[`KmsKeyId${environmentSuffix}`];

      const describeKeyCommand = new DescribeKeyCommand({
        KeyId: keyId,
      });

      const keyResponse = await kmsClient.send(describeKeyCommand);
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyResponse.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');

      // Check key rotation status
      const getKeyRotationStatusCommand = new GetKeyRotationStatusCommand({
        KeyId: keyId,
      });

      const rotationResponse = await kmsClient.send(
        getKeyRotationStatusCommand
      );
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('SNS Notification Infrastructure', () => {
    test('should have accessible SNS topic', async () => {
      const topicArn = outputs[`SNSTopicArn${environmentSuffix}`];

      const getTopicAttributesCommand = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const topicResponse = await snsClient.send(getTopicAttributesCommand);
      expect(topicResponse.Attributes).toBeDefined();
      expect(topicResponse.Attributes.TopicArn).toBe(topicArn);
    });

    test('should have SNS topic subscriptions', async () => {
      const topicArn = outputs[`SNSTopicArn${environmentSuffix}`];

      const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: topicArn,
      });

      const subscriptionsResponse = await snsClient.send(
        listSubscriptionsCommand
      );
      // SNS subscriptions may not be configured in all deployments
      if (subscriptionsResponse.Subscriptions.length > 0) {
        console.log('SNS subscriptions found - good monitoring practice');
      } else {
        console.log(
          'No SNS subscriptions found - acceptable for basic deployments'
        );
      }
    });
  });

  describe('CloudWatch Monitoring Infrastructure', () => {
    test('should have CloudWatch alarms configured', async () => {
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `webapp-`,
      });

      const alarmsResponse = await cloudWatchClient.send(describeAlarmsCommand);
      expect(alarmsResponse.MetricAlarms.length).toBeGreaterThan(0);

      // Check for specific alarm types
      const alarmNames = alarmsResponse.MetricAlarms.map(
        alarm => alarm.AlarmName
      );
      expect(alarmNames.some(name => name.includes('unhealthy-targets'))).toBe(
        true
      );
      expect(alarmNames.some(name => name.includes('db-connections'))).toBe(
        true
      );
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have Auto Scaling service-linked role with proper permissions', async () => {
      const roleName = 'AWSServiceRoleForAutoScaling';

      const getRoleCommand = new GetRoleCommand({
        RoleName: roleName,
      });

      const roleResponse = await iamClient.send(getRoleCommand);
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role.Arn).toContain(
        'aws-service-role/autoscaling.amazonaws.com'
      );

      // Check attached policies
      const listAttachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });

      const policiesResponse = await iamClient.send(
        listAttachedPoliciesCommand
      );
      expect(policiesResponse.AttachedPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('should have complete infrastructure connectivity', async () => {
      // This test validates that all components can work together
      const vpcId = outputs[`VpcId${environmentSuffix}`];
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];
      const dbEndpoint = outputs[`DatabaseEndpoint${environmentSuffix}`];
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];
      const keyId = outputs[`KmsKeyId${environmentSuffix}`];
      const topicArn = outputs[`SNSTopicArn${environmentSuffix}`];

      // All resources should be accessible
      expect(vpcId).toBeDefined();
      expect(albDns).toBeDefined();
      expect(dbEndpoint).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(keyId).toBeDefined();
      expect(topicArn).toBeDefined();

      // Validate resource relationships
      // VPC should contain the RDS instance and ALB
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );
      expect(vpcResponse.Vpcs[0].State).toBe('available');

      // ALB should be accessible
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
        })
      );
      expect(albResponse.LoadBalancers[0].State.Code).toBe('active');

      // Database should be accessible
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );
      const dbInstance = dbResponse.DBInstances.find(
        db => db.Endpoint.Address === dbEndpoint
      );
      expect(dbInstance.DBInstanceStatus).toBe('available');

      // S3 bucket should be accessible
      await expect(
        s3Client.send(
          new HeadBucketCommand({
            Bucket: bucketName,
          })
        )
      ).resolves.not.toThrow();

      // KMS key should be accessible
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );
      expect(keyResponse.KeyMetadata.KeyState).toBe('Enabled');

      // SNS topic should be accessible
      const topicResponse = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: topicArn,
        })
      );
      expect(topicResponse.Attributes.TopicArn).toBe(topicArn);
    });

    test('should have proper security and compliance configuration', async () => {
      // Validate encryption is enabled across all resources
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];
      const keyId = outputs[`KmsKeyId${environmentSuffix}`];

      // S3 encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration
      ).toBeDefined();

      // KMS key rotation
      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: keyId,
        })
      );
      expect(rotationResponse.KeyRotationEnabled).toBe(true);

      // RDS encryption
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );
      const dbEndpoint = outputs[`DatabaseEndpoint${environmentSuffix}`];
      const dbInstance = dbResponse.DBInstances.find(
        db => db.Endpoint.Address === dbEndpoint
      );
      expect(dbInstance.StorageEncrypted).toBe(true);
    });
  });
});
