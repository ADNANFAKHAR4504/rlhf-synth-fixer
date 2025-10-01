import fs from 'fs';
import https from 'https';
import http from 'http';
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  }
} catch (error) {
  console.warn('CFN outputs file not found, using environment variables as fallback');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

// AWS SDK clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

// Helper function to make HTTP requests
const makeHttpRequest = (url: string): Promise<{ statusCode: number; body: string }> => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const request = client.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode || 0,
          body
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Helper function to wait for instance to be running
const waitForInstanceRunning = async (instanceId: string, maxWaitTime = 300000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      const response = await ec2Client.send(command);
      
      if (response.Reservations && response.Reservations[0]?.Instances) {
        const instance = response.Reservations[0].Instances[0];
        if (instance.State?.Name === 'running') {
          return true;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    } catch (error) {
      console.warn('Error checking instance status:', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  return false;
};

describe('Blog Platform Infrastructure Integration Tests', () => {
  // Extract values from outputs or environment variables
  const vpcId = outputs.VpcId || process.env.VPC_ID;
  const bucketName = outputs.BucketName || process.env.BUCKET_NAME;
  const instanceId = outputs.InstanceId || process.env.INSTANCE_ID;
  const publicIp = outputs.PublicIp || process.env.PUBLIC_IP;
  const websiteUrl = outputs.WebsiteUrl || process.env.WEBSITE_URL;

  beforeAll(async () => {
    // Skip tests if required outputs are not available
    if (!vpcId || !bucketName || !instanceId || !publicIp) {
      console.warn('Required CFN outputs not available. Some integration tests will be skipped.');
    }
  }, 30000);

  describe('VPC Infrastructure Validation', () => {
    test('should have VPC with correct CIDR block', async () => {
      if (!vpcId) {
        console.warn('VPC ID not available, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly available in the VPC response
      // They would need to be checked via DescribeVpcAttribute API calls if needed
    });

    test('should have public subnets in multiple AZs', async () => {
      if (!vpcId) {
        console.warn('VPC ID not available, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);
      
      const availabilityZones = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2); // Should span 2 AZs
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });
  });

  describe('S3 Bucket Security and Configuration', () => {
    test('should have S3 bucket with correct security settings', async () => {
      if (!bucketName) {
        console.warn('Bucket name not available, skipping test');
        return;
      }

      // Test bucket exists and is accessible
      const headCommand = new HeadBucketCommand({
        Bucket: bucketName
      });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      // Test encryption is enabled
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

      // Test public access is blocked
      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('should have correct bucket naming convention', () => {
      if (!bucketName) {
        console.warn('Bucket name not available, skipping test');
        return;
      }

      const expectedPattern = new RegExp(`^s3-blogapp-${region}-\\d{12}-${environmentSuffix}$`);
      expect(bucketName).toMatch(expectedPattern);
    });
  });

  describe('EC2 Instance Configuration and Health', () => {
    test('should have EC2 instance running with correct configuration', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.State?.Name).toBe('running');
      expect(instance.Monitoring?.State).toBe('enabled');
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.IamInstanceProfile).toBeDefined();
    });

    test('should wait for instance to be fully running and accessible', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      const isRunning = await waitForInstanceRunning(instanceId);
      expect(isRunning).toBe(true);
    }, 600000); // 10 minutes timeout

    test('should have correct security group configuration', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const securityGroupId = instance.SecurityGroups![0].GroupId!;

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroup = sgResponse.SecurityGroups![0];
      
      // Check inbound rules - should only allow HTTP on port 80
      expect(securityGroup.IpPermissions).toHaveLength(1);
      const inboundRule = securityGroup.IpPermissions![0];
      expect(inboundRule.IpProtocol).toBe('tcp');
      expect(inboundRule.FromPort).toBe(80);
      expect(inboundRule.ToPort).toBe(80);
      expect(inboundRule.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

      // Check outbound rules - should allow all outbound
      expect(securityGroup.IpPermissionsEgress).toHaveLength(1);
      const outboundRule = securityGroup.IpPermissionsEgress![0];
      expect(outboundRule.IpProtocol).toBe('-1');
      expect(outboundRule.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Role and Permissions Validation', () => {
    test('should have IAM role with correct policies', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      // Get instance to find IAM role
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const iamInstanceProfile = instance.IamInstanceProfile?.Arn;
      expect(iamInstanceProfile).toBeDefined();

      // Extract role name from instance profile ARN
      const roleNameMatch = iamInstanceProfile!.match(/instance-profile\/(.+)/);
      expect(roleNameMatch).toBeTruthy();
      
      // Get role details - the role name should match the instance profile name
      const roleName = roleNameMatch![1];
      const roleCommand = new GetRoleCommand({
        RoleName: roleName
      });
      
      const roleResponse = await iamClient.send(roleCommand);
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Check managed policies
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName
      });
      
      const attachedPoliciesResponse = await iamClient.send(attachedPoliciesCommand);
      const managedPolicies = attachedPoliciesResponse.AttachedPolicies?.map(p => p.PolicyName) || [];
      expect(managedPolicies).toContain('CloudWatchAgentServerPolicy');

      // Check inline policies
      const s3PolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadPolicy'
      });
      
      const s3PolicyResponse = await iamClient.send(s3PolicyCommand);
      expect(s3PolicyResponse.PolicyDocument).toBeDefined();

      const logsPolicy = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'CloudWatchLogsPolicy'
      });
      
      const logsPolicyResponse = await iamClient.send(logsPolicy);
      expect(logsPolicyResponse.PolicyDocument).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should have CPU utilization alarm configured', async () => {
      const alarmName = `EC2-CPUUtilization-BlogApp-${region}-${environmentSuffix}`;
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });
      
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.TreatMissingData).toBe('breaching');
    });

    test('should have status check alarm configured', async () => {
      const alarmName = `EC2-StatusCheckFailed-BlogApp-${region}-${environmentSuffix}`;
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });
      
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('StatusCheckFailed');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Statistic).toBe('Maximum');
      expect(alarm.Period).toBe(60);
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm.TreatMissingData).toBe('breaching');
    });
  });

  describe('End-to-End Web Server Functionality', () => {
    test('should serve HTTP content on port 80', async () => {
      if (!websiteUrl && !publicIp) {
        console.warn('Website URL or public IP not available, skipping test');
        return;
      }

      const url = websiteUrl || `http://${publicIp}`;
      
      // Wait a bit for the web server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      const response = await makeHttpRequest(url);
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Blog Platform');
      expect(response.body).toContain(`Environment: ${environmentSuffix}`);
      expect(response.body).toContain('Instance ID:');
    }, 120000); // 2 minutes timeout

    test('should not be accessible on other ports', async () => {
      if (!publicIp) {
        console.warn('Public IP not available, skipping test');
        return;
      }

      // Test that HTTPS (443) is not accessible
      await expect(makeHttpRequest(`https://${publicIp}`)).rejects.toThrow();
      
      // Test that SSH (22) is not accessible (this will timeout, which is expected)
      const sshTest = makeHttpRequest(`http://${publicIp}:22`);
      await expect(sshTest).rejects.toThrow();
    }, 60000);
  });

  describe('Infrastructure Resilience and Monitoring', () => {
    test('should have proper resource tagging', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      expect(instance.Tags).toBeDefined();
      const tags = instance.Tags || [];
      const tagNames = tags.map(tag => tag.Key);
      
      expect(tagNames).toContain('Environment');
      expect(tagNames).toContain('Repository');
      expect(tagNames).toContain('Author');
    });

    test('should validate all stack outputs are present', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('CFN outputs not available, using environment variables');
        
        // Check environment variables as fallback
        expect(process.env.VPC_ID || vpcId).toBeDefined();
        expect(process.env.BUCKET_NAME || bucketName).toBeDefined();
        expect(process.env.INSTANCE_ID || instanceId).toBeDefined();
        expect(process.env.PUBLIC_IP || publicIp).toBeDefined();
        expect(process.env.WEBSITE_URL || websiteUrl).toBeDefined();
      } else {
        expect(outputs.VpcId).toBeDefined();
        expect(outputs.BucketName).toBeDefined();
        expect(outputs.InstanceId).toBeDefined();
        expect(outputs.PublicIp).toBeDefined();
        expect(outputs.WebsiteUrl).toBeDefined();
      }
    });
  });

  describe('Cost Optimization Validation', () => {
    test('should use cost-effective instance type', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      // Verify t3.micro is used for cost optimization
      expect(instance.InstanceType).toBe('t3.micro');
      
      // Verify no unnecessary features that cost extra
      expect(instance.EbsOptimized).toBeFalsy();
      expect(instance.SriovNetSupport).not.toBe('simple'); // Enhanced networking not needed
    });

    test('should have minimal resource footprint', async () => {
      if (!vpcId) {
        console.warn('VPC ID not available, skipping test');
        return;
      }

      // Verify only necessary subnets are created (2 for HA)
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      expect(subnetResponse.Subnets).toHaveLength(2);

      // Verify single instance deployment
      const instanceCommand = new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const runningInstances = instanceResponse.Reservations?.flatMap(r => 
        r.Instances?.filter(i => i.State?.Name === 'running') || []
      ) || [];
      expect(runningInstances).toHaveLength(1);
    });
  });
});
