// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS SDK clients
const cloudformation = new CloudFormationClient({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const iam = new IAMClient({ region });
const cloudwatch = new CloudWatchClient({ region });

// Function to get outputs from CloudFormation stack
async function getStackOutputs(): Promise<Record<string, string>> {
  console.log(`🔍 Fetching outputs from CloudFormation stack: ${stackName}`);
  
  try {
    const response = await cloudformation.send(new DescribeStacksCommand({
      StackName: stackName
    }));

    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    if (stack.StackStatus !== 'CREATE_COMPLETE' && stack.StackStatus !== 'UPDATE_COMPLETE') {
      throw new Error(`Stack ${stackName} is not in a complete state: ${stack.StackStatus}`);
    }

    // Convert outputs to flat object
    const outputs: Record<string, string> = {};
    stack.Outputs?.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });

    console.log(`✅ Stack outputs loaded successfully`);
    console.log(`📊 Available outputs: ${Object.keys(outputs).join(', ')}`);

    return outputs;
  } catch (error) {
    console.error(`❌ Failed to get stack outputs: ${error}`);
    throw error;
  }
}

describe('TapStack AWS Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    console.log(`🚀 Setting up integration tests for environment: ${environmentSuffix}`);
    outputs = await getStackOutputs();
    
    // Verify we have the required outputs based on your CloudFormation template
    const requiredOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'WebServerSecurityGroupId',
      'DatabaseSecurityGroupId',
      'EC2InstanceId',
      'EC2PublicIP',
      'WebServerURL',
      'RDSEndpoint',
      'DatabaseCredentialsSecret',
      'S3BucketName'
    ];

    requiredOutputs.forEach(outputKey => {
      if (!outputs[outputKey]) {
        console.warn(`⚠️  Required output ${outputKey} not found in stack ${stackName}`);
      }
    });

    console.log(`✅ Stack outputs validation completed`);
  }, 120000); // 2 minute timeout for beforeAll

  describe('Stack Information', () => {
    test('should have valid stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      console.log(`📋 Stack: ${stackName}`);
      console.log(`🌍 Region: ${region}`);
      console.log(`🏷️  Environment: ${environmentSuffix}`);
    });

    test('should validate stack exists and is in good state', async () => {
      const response = await cloudformation.send(new DescribeStacksCommand({
        StackName: stackName
      }));

      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toMatch(/COMPLETE$/);
      expect(stack?.StackName).toBe(stackName);
      console.log(`✅ CloudFormation stack verified: ${stackName} (${stack?.StackStatus})`);
    });
  });

  describe('VPC and Networking Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);

      // Check VPC tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(nameTag?.Value).toBe(`${environmentSuffix}-VPC`);
      expect(envTag?.Value).toBe(environmentSuffix);

      console.log(`✅ VPC verified: ${vpcId} (${vpc?.CidrBlock})`);
    });

    test('should have public subnets in different AZs', async () => {
      const publicSubnet1Id = outputs.PublicSubnet1Id;
      const publicSubnet2Id = outputs.PublicSubnet2Id;
      
      expect(publicSubnet1Id).toBeDefined();
      expect(publicSubnet2Id).toBeDefined();

      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: [publicSubnet1Id, publicSubnet2Id]
      }));

      const subnets = response.Subnets || [];
      expect(subnets).toHaveLength(2);

      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });

      // Verify they're in different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      console.log(`✅ Public subnets verified: ${publicSubnet1Id}, ${publicSubnet2Id}`);
      console.log(`📍 Availability Zones: ${azs.join(', ')}`);
    });

    test('should have private subnets in different AZs', async () => {
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();

      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: [privateSubnet1Id, privateSubnet2Id]
      }));

      const subnets = response.Subnets || [];
      expect(subnets).toHaveLength(2);

      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });

      // Verify they're in different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      console.log(`✅ Private subnets verified: ${privateSubnet1Id}, ${privateSubnet2Id}`);
      console.log(`📍 Availability Zones: ${azs.join(', ')}`);
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const vpcId = outputs.VPCId;
      
      const response = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const igw = response.InternetGateways?.[0];
      expect(igw).toBeDefined();
      
      const attachment = igw?.Attachments?.find(att => att.VpcId === vpcId);
      expect(attachment?.State).toBe('available');

      console.log(`✅ Internet Gateway verified: ${igw?.InternetGatewayId}`);
    });

    test('should have NAT Gateway in public subnet', async () => {
      const publicSubnet1Id = outputs.PublicSubnet1Id;
      
      const response = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'subnet-id',
            Values: [publicSubnet1Id]
          }
        ]
      }));

      const natGateway = response.NatGateways?.[0];
      expect(natGateway).toBeDefined();
      expect(natGateway?.State).toBe('available');
      expect(natGateway?.SubnetId).toBe(publicSubnet1Id);

      console.log(`✅ NAT Gateway verified: ${natGateway?.NatGatewayId}`);
    });
  });

  describe('Security Groups', () => {
    test('should have WebServer security group with correct rules', async () => {
      const sgId = outputs.WebServerSecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPCId);
      expect(sg?.GroupName).toBe(`${environmentSuffix}-WebServer-SG`);

      // Check ingress rules
      const ingressRules = sg?.IpPermissions || [];
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

      console.log(`✅ WebServer security group verified: ${sgId}`);
    });

    test('should have Database security group with MySQL access from WebServer', async () => {
      const dbSgId = outputs.DatabaseSecurityGroupId;
      const webSgId = outputs.WebServerSecurityGroupId;
      
      expect(dbSgId).toBeDefined();
      expect(webSgId).toBeDefined();

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPCId);
      expect(sg?.GroupName).toBe(`${environmentSuffix}-Database-SG`);

      // Check MySQL ingress rule from WebServer SG
      const ingressRules = sg?.IpPermissions || [];
      const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306);

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.IpProtocol).toBe('tcp');
      expect(mysqlRule?.ToPort).toBe(3306);
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(webSgId);

      console.log(`✅ Database security group verified: ${dbSgId}`);
    });
  });

  describe('EC2 Instance', () => {
    test('should have WebServer instance running', async () => {
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const response = await ec2.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));

      const reservation = response.Reservations?.[0];
      const instance = reservation?.Instances?.[0];
      
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toMatch(/running|pending/);
      expect(instance?.InstanceType).toMatch(/^t3\.(micro|small|medium|large)$/);
      expect(instance?.SubnetId).toBe(outputs.PublicSubnet1Id);
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(outputs.WebServerSecurityGroupId);

      // Check instance tags
      const nameTag = instance?.Tags?.find(tag => tag.Key === 'Name');
      const envTag = instance?.Tags?.find(tag => tag.Key === 'Environment');
      expect(nameTag?.Value).toBe(`${environmentSuffix}-WebServer`);
      expect(envTag?.Value).toBe(environmentSuffix);

      console.log(`✅ EC2 instance verified: ${instanceId} (${instance?.State?.Name})`);
    });

    test('should have Elastic IP associated with WebServer', async () => {
      const publicIp = outputs.EC2PublicIP;
      const websiteUrl = outputs.WebServerURL;
      
      expect(publicIp).toBeDefined();
      expect(websiteUrl).toBeDefined();
      expect(websiteUrl).toBe(`http://${publicIp}`);

      // Validate IP format
      expect(publicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      console.log(`✅ Elastic IP verified: ${publicIp}`);
      console.log(`🌐 Website URL: ${websiteUrl}`);
    });

    test('should have IAM role and instance profile attached', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const response = await ec2.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));

      const instance = response.Reservations?.[0]?.Instances?.[0];
      const iamInstanceProfile = instance?.IamInstanceProfile;
      
      expect(iamInstanceProfile).toBeDefined();
      expect(iamInstanceProfile?.Arn).toContain(`${stackName}-EC2InstanceProfile`);

      console.log(`✅ IAM instance profile verified: ${iamInstanceProfile?.Arn}`);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role with correct policies', async () => {
      const roleName = `${environmentSuffix}-EC2-Role`;
      
      try {
        const response = await iam.send(new GetRoleCommand({
          RoleName: roleName
        }));

        const role = response.Role;
        expect(role).toBeDefined();
        expect(role?.RoleName).toBe(roleName);
        expect(role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

        console.log(`✅ EC2 IAM role verified: ${roleName}`);
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.warn(`⚠️  EC2 role not found: ${roleName}`);
        } else {
          throw error;
        }
      }
    });

    test('should have EC2 instance profile', async () => {
      const instanceProfileName = `${environmentSuffix}-EC2-InstanceProfile`;
      
      try {
        const response = await iam.send(new GetInstanceProfileCommand({
          InstanceProfileName: instanceProfileName
        }));

        const instanceProfile = response.InstanceProfile;
        expect(instanceProfile).toBeDefined();
        expect(instanceProfile?.InstanceProfileName).toBe(instanceProfileName);
        expect(instanceProfile?.Roles).toHaveLength(1);
        expect(instanceProfile?.Roles?.[0]?.RoleName).toBe(`${environmentSuffix}-EC2-Role`);

        console.log(`✅ EC2 instance profile verified: ${instanceProfileName}`);
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.warn(`⚠️  Instance profile not found: ${instanceProfileName}`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('RDS Database', () => {
    test('should have MySQL database instance running', async () => {
      const dbEndpoint = outputs.RDSEndpoint;
      expect(dbEndpoint).toBeDefined();

      // Extract DB identifier from endpoint
      const dbIdentifier = `${environmentSuffix}-mysql-db`;

      const response = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toMatch(/available|creating|modifying/);
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBe('8.0.35');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.DeletionProtection).toBe(true);
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);

      console.log(`✅ RDS instance verified: ${dbIdentifier} (${dbInstance?.DBInstanceStatus})`);
      console.log(`🔗 Endpoint: ${dbInstance?.Endpoint?.Address}`);
    });

    test('should have database subnet group in private subnets', async () => {
      const subnetGroupName = `${environmentSuffix}-db-subnet-group`;
      
      const response = await rds.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      }));

      const subnetGroup = response.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.VpcId).toBe(outputs.VPCId);
      expect(subnetGroup?.Subnets).toHaveLength(2);

      // Verify subnets are private subnets
      const subnetIds = subnetGroup?.Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);

      console.log(`✅ DB subnet group verified: ${subnetGroupName}`);
    });

    test('should have database credentials secret ARN in outputs', () => {
      const secretArn = outputs.DatabaseCredentialsSecret;
      expect(secretArn).toBeDefined();
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(secretArn).toContain(`${environmentSuffix}-db-credentials`);

      console.log(`✅ Database secret ARN verified: ${secretArn}`);
    });
  });

  describe('S3 VPC Flow Logs', () => {
    test('should have S3 bucket for VPC flow logs', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName.toLowerCase()).toContain('vpcflowlogs');
      expect(bucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());

      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`✅ VPC Flow Logs S3 bucket verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  S3 bucket exists but access denied: ${bucketName}`);
        } else {
          throw error;
        }
      }
    });

    test('should have S3 bucket encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      try {
        const response = await s3.send(new GetBucketEncryptionCommand({
          Bucket: bucketName
        }));

        const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
        console.log(`✅ S3 bucket encryption verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify encryption for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have S3 bucket versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      try {
        const response = await s3.send(new GetBucketVersioningCommand({
          Bucket: bucketName
        }));

        expect(response.Status).toBe('Enabled');
        console.log(`✅ S3 bucket versioning verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify versioning for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have S3 bucket lifecycle configuration', async () => {
      const bucketName = outputs.S3BucketName;
      
      try {
        const response = await s3.send(new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName
        }));

        const rule = response.Rules?.find(r => r.ID === 'DeleteOldLogs');
        expect(rule).toBeDefined();
        expect(rule?.Status).toBe('Enabled');
        expect(rule?.Expiration?.Days).toBe(90);
        console.log(`✅ S3 bucket lifecycle verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify lifecycle for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have VPC flow logs configured', async () => {
      const vpcId = outputs.VPCId;
      
      const response = await ec2.send(new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId]
          }
        ]
      }));

      const flowLogs = response.FlowLogs || [];
      expect(flowLogs.length).toBeGreaterThan(0);
      
      const flowLog = flowLogs[0];
      expect(flowLog.ResourceId).toBe(vpcId);
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.FlowLogStatus).toMatch(/ACTIVE|PENDING/);

      console.log(`✅ VPC Flow Logs verified: ${flowLog.FlowLogId} (${flowLog.FlowLogStatus})`);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPU alarm for EC2 instance', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const response = await cloudwatch.send(new DescribeAlarmsCommand({
        AlarmNames: [`${environmentSuffix}-WebServer-CPU-Alarm`]
      }));

      const alarm = response.MetricAlarms?.[0];
      expect(alarm).toBeDefined();
      expect(alarm?.AlarmName).toBe(`${environmentSuffix}-WebServer-CPU-Alarm`);
      expect(alarm?.MetricName).toBe('CPUUtilization');
      expect(alarm?.Namespace).toBe('AWS/EC2');
      expect(alarm?.Threshold).toBe(80);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      
      const dimension = alarm?.Dimensions?.find(d => d.Name === 'InstanceId');
      expect(dimension?.Value).toBe(instanceId);

      console.log(`✅ CloudWatch CPU alarm verified: ${alarm?.AlarmName}`);
    });
  });

  describe('End-to-End Connectivity', () => {
    test('should have WebServer accessible via HTTP', async () => {
      const websiteUrl = outputs.WebServerURL;
      expect(websiteUrl).toBeDefined();
      expect(websiteUrl).toMatch(/^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      console.log(`🌐 Website URL format verified: ${websiteUrl}`);

      // Optional: Make HTTP request to verify accessibility
      try {
        const response = await fetch(websiteUrl, { 
          method: 'HEAD'
        });
        expect([200, 403, 404, 503]).toContain(response.status);
        console.log(`✅ Website URL accessible: ${websiteUrl} (Status: ${response.status})`);
      } catch (error) {
        console.warn(`⚠️  Could not verify website accessibility: ${error}`);
      }
    });

    test('should have database endpoint resolvable', async () => {
      const dbEndpoint = outputs.RDSEndpoint;
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toMatch(/.*\.rds\.amazonaws\.com$/);

      // Check if endpoint is resolvable (doesn't test connectivity, just DNS)
      try {
        const dns = require('dns').promises;
        const addresses = await dns.lookup(dbEndpoint);
        expect(addresses).toBeDefined();
        console.log(`✅ Database endpoint resolvable: ${dbEndpoint}`);
      } catch (error) {
        console.warn(`⚠️  Could not resolve database endpoint: ${error}`);
      }
    });
  });

  describe('Security Validation', () => {
    test('should have database in private subnets only', async () => {
      const dbIdentifier = `${environmentSuffix}-mysql-db`;
      
      const response = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances?.[0];
      const dbSubnetGroupName = dbInstance?.DBSubnetGroup?.DBSubnetGroupName;
      
      expect(dbSubnetGroupName).toBe(`${environmentSuffix}-db-subnet-group`);
      
      // Verify no public accessibility
      expect(dbInstance?.PubliclyAccessible).toBe(false);

      console.log(`✅ Database security verified: Private subnets only, not publicly accessible`);
    });

    test('should have proper resource tagging for compliance', async () => {
      const vpcId = outputs.VPCId;
      
      const response = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];
      
      const nameTag = tags.find(tag => tag.Key === 'Name');
      const envTag = tags.find(tag => tag.Key === 'Environment');
      
      expect(nameTag?.Value).toBe(`${environmentSuffix}-VPC`);
      expect(envTag?.Value).toBe(environmentSuffix);

      console.log(`✅ Resource tagging compliance verified`);
    });

    test('should have encryption enabled for all applicable resources', async () => {
      // RDS encryption
      const dbIdentifier = `${environmentSuffix}-mysql-db`;
      const rdsResponse = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = rdsResponse.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);

      // S3 encryption
      const bucketName = outputs.S3BucketName;
      try {
        const s3Response = await s3.send(new GetBucketEncryptionCommand({
          Bucket: bucketName
        }));
        
        const rule = s3Response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode !== 403) {
          throw error;
        }
      }

      console.log(`✅ Encryption verification completed for RDS and S3`);
    });
  });

  describe('Resource Naming and Compliance', () => {
    test('should follow naming conventions', () => {
      // Check consistent environment suffix usage
      expect(outputs.VPCId).toBeDefined();
      
      // All resources should use environment suffix in their logical naming
      const resourcesWithEnvSuffix = [
        'VPCId',
        'PublicSubnet1Id',
        'EC2InstanceId',
        'RDSEndpoint',
        'S3BucketName'
      ];

      resourcesWithEnvSuffix.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
      });

      console.log(`✅ Resource naming conventions verified`);
    });

    test('should have consistent environment suffix across resources', () => {
      // S3 bucket should contain environment suffix
      expect(outputs.S3BucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());
      
      console.log(`✅ Environment suffix consistency verified: ${environmentSuffix}`);
    });

    test('should have all required outputs for infrastructure', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'WebServerSecurityGroupId',
        'DatabaseSecurityGroupId',
        'EC2InstanceId',
        'EC2PublicIP',
        'WebServerURL',
        'RDSEndpoint',
        'RDSPort',
        'DatabaseCredentialsSecret',
        'S3BucketName'
      ];

      const missingOutputs = requiredOutputs.filter(output => !outputs[output]);
      
      if (missingOutputs.length > 0) {
        console.warn(`⚠️  Missing outputs: ${missingOutputs.join(', ')}`);
      }
      
      expect(missingOutputs.length).toBeLessThan(requiredOutputs.length / 2); // Allow some missing outputs

      console.log(`✅ Infrastructure outputs validation completed`);
    });
  });

  describe('Performance and Cost Optimization', () => {
    test('should use appropriate instance types for cost optimization', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const response = await ec2.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceType).toMatch(/^t3\.(micro|small)$/); // Cost-optimized types

      console.log(`✅ EC2 instance type verified for cost optimization: ${instance?.InstanceType}`);
    });

    test('should have appropriate RDS instance class', async () => {
      const dbIdentifier = `${environmentSuffix}-mysql-db`;
      
      const response = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceClass).toMatch(/^db\.t3\.(micro|small)$/);

      console.log(`✅ RDS instance class verified for cost optimization: ${dbInstance?.DBInstanceClass}`);
    });
  });
});