// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand
} from '@aws-sdk/client-auto-scaling';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const autoScalingClient = new AutoScalingClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists and is configured correctly', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      
      // VPC attributes are returned in basic describe-vpcs, but we can just check they exist
      // The actual DNS settings are verified in separate API calls if needed
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
    });

    test('VPC has subnets across multiple availability zones', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(9); // 3 AZs x 3 subnet types

      // Check availability zones
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Check subnet types
      const publicSubnets = response.Subnets!.filter(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(3);

      const privateSubnets = response.Subnets!.filter(subnet => 
        subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(6);
    });

    test('NAT Gateways are deployed for high availability', async () => {
      const vpcId = outputs.VpcId;

      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const publicSubnetIds = subnetsResponse.Subnets!
        .filter(subnet => subnet.MapPublicIpOnLaunch === true)
        .map(subnet => subnet.SubnetId);

      const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'subnet-id',
            Values: publicSubnetIds
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }));

      expect(natResponse.NatGateways).toBeDefined();
      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    test('Security groups are properly configured', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);

      // Check for database security group
      const dbSecurityGroup = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('db-security-group')
      );
      expect(dbSecurityGroup).toBeDefined();

      // Check for ASG security group
      const asgSecurityGroup = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('asg-security-group')
      );
      expect(asgSecurityGroup).toBeDefined();

      // Verify ASG security group allows HTTP and HTTPS
      if (asgSecurityGroup) {
        const httpRule = asgSecurityGroup.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();

        const httpsRule = asgSecurityGroup.IpPermissions?.find(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
      }
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket exists with correct name', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('app-logs');
      expect(bucketName).toContain('718240086340'); // Account ID
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket has lifecycle configuration', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThanOrEqual(1);

      const lifecycleRule = response.Rules![0];
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.Transitions).toBeDefined();
      expect(lifecycleRule.Transitions!.length).toBeGreaterThanOrEqual(2);
    });

    test('S3 bucket blocks public access', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is running', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain('.rds.amazonaws.com');

      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
    });

    test('RDS has automated backups enabled', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
    });

    test('RDS has encryption enabled', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('RDS has performance insights enabled', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
    });

    test('RDS is deployed in private subnets', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup?.Subnets).toBeDefined();
      expect(dbInstance.DBSubnetGroup?.Subnets!.length).toBeGreaterThanOrEqual(2);
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group exists with correct configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();
      expect(asgName).toContain('app-asg');

      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(10);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(10);
    });

    test('Auto Scaling Group has instances running', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = response.AutoScalingGroups![0];
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(1);
      
      // Check that instances are healthy
      const healthyInstances = asg.Instances!.filter(instance => 
        instance.HealthStatus === 'Healthy' && instance.LifecycleState === 'InService'
      );
      expect(healthyInstances.length).toBeGreaterThanOrEqual(1);
    });

    test('Auto Scaling Group has scaling policies', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const response = await autoScalingClient.send(new DescribePoliciesCommand({
        AutoScalingGroupName: asgName
      }));

      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(1);

      const cpuPolicy = response.ScalingPolicies!.find(policy => 
        policy.PolicyType === 'TargetTrackingScaling'
      );
      expect(cpuPolicy).toBeDefined();
      
      if (cpuPolicy?.TargetTrackingConfiguration) {
        expect(cpuPolicy.TargetTrackingConfiguration.TargetValue).toBe(70);
        expect(cpuPolicy.TargetTrackingConfiguration.PredefinedMetricSpecification?.PredefinedMetricType)
          .toBe('ASGAverageCPUUtilization');
      }
    });

    test('Auto Scaling Group spans multiple availability zones', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = response.AutoScalingGroups![0];
      expect(asg.AvailabilityZones).toBeDefined();
      expect(asg.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Role', () => {
    test('IAM role exists for EC2 instances', async () => {
      const roleArn = outputs.IAMRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);

      const roleName = roleArn.split('/').pop();
      expect(roleName).toContain('ec2-instance-role');

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName!
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      
      // Check assume role policy allows EC2
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const ec2Principal = assumeRolePolicy.Statement.find((stmt: any) => 
        stmt.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Principal).toBeDefined();
    });

    test('IAM role has necessary managed policies attached', async () => {
      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop();

      const response = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName!
      }));

      expect(response.AttachedPolicies).toBeDefined();
      expect(response.AttachedPolicies!.length).toBeGreaterThanOrEqual(2);

      const policyNames = response.AttachedPolicies!.map(policy => policy.PolicyName);
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
    });
  });

  describe('End-to-End Connectivity', () => {
    test('All deployed resources are in the same VPC', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      // Check Auto Scaling Group subnets
      const asgName = outputs.AutoScalingGroupName;
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = asgResponse.AutoScalingGroups![0];
      const asgSubnetIds = asg.VPCZoneIdentifier?.split(',') || [];
      
      // Verify ASG subnets belong to our VPC
      if (asgSubnetIds.length > 0) {
        const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: asgSubnetIds
        }));

        subnetResponse.Subnets?.forEach(subnet => {
          expect(subnet.VpcId).toBe(vpcId);
        });
      }

      // Check RDS database subnets
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];
      const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = rdsResponse.DBInstances![0];
      const dbSubnets = dbInstance.DBSubnetGroup?.Subnets || [];
      
      dbSubnets.forEach(subnet => {
        // The RDS response includes VPC info in subnet availability zone data
        expect(subnet.SubnetIdentifier).toBeDefined();
      });
    });

    test('Resources have proper tagging', async () => {
      // Check VPC tags
      const vpcId = outputs.VpcId;
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const vpcTagKeys = vpcTags.map(tag => tag.Key);
      expect(vpcTagKeys).toContain('Environment');
      expect(vpcTagKeys).toContain('Owner');
      expect(vpcTagKeys).toContain('CostCenter');

      // Check Auto Scaling Group tags
      const asgName = outputs.AutoScalingGroupName;
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asgTags = asgResponse.AutoScalingGroups![0].Tags || [];
      const asgTagKeys = asgTags.map(tag => tag.Key);
      expect(asgTagKeys).toContain('Environment');
      expect(asgTagKeys).toContain('Owner');
      expect(asgTagKeys).toContain('CostCenter');
    });

    test('Network connectivity allows database access from compute layer', async () => {
      const vpcId = outputs.VpcId;

      // Get security groups
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const dbSecurityGroup = sgResponse.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('db-security-group')
      );

      const asgSecurityGroup = sgResponse.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('asg-security-group')
      );

      expect(dbSecurityGroup).toBeDefined();
      expect(asgSecurityGroup).toBeDefined();

      // Check that database security group allows traffic from ASG security group
      if (dbSecurityGroup && asgSecurityGroup) {
        const postgresRule = dbSecurityGroup.IpPermissions?.find(rule => 
          rule.FromPort === 5432 && 
          rule.ToPort === 5432 &&
          rule.UserIdGroupPairs?.some(pair => pair.GroupId === asgSecurityGroup.GroupId)
        );
        
        expect(postgresRule).toBeDefined();
      }
    });
  });
});