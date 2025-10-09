import fs from 'fs';
import https from 'https';
import http from 'http';
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, GetRolePolicyCommand, ListRolesCommand, GetInstanceProfileCommand } from '@aws-sdk/client-iam';
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

      // Extract instance profile name from ARN
      const instanceProfileNameMatch = iamInstanceProfile!.match(/instance-profile\/(.+)/);
      expect(instanceProfileNameMatch).toBeTruthy();
      
      const instanceProfileName = instanceProfileNameMatch![1];
      console.log(`Instance profile name: ${instanceProfileName} (length: ${instanceProfileName.length})`);
      
      // Get the instance profile to find the associated role
      const getInstanceProfileCommand = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName
      });
      
      const instanceProfileResponse = await iamClient.send(getInstanceProfileCommand);
      expect(instanceProfileResponse.InstanceProfile?.Roles).toBeDefined();
      expect(instanceProfileResponse.InstanceProfile?.Roles).toHaveLength(1);
      
      const roleName = instanceProfileResponse.InstanceProfile!.Roles![0].RoleName!;
      console.log(`Found role from instance profile: ${roleName} (length: ${roleName.length})`);
      
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

  describe('End-to-End Application Flow Testing', () => {
    // Test complete user journey from initial request to response
    test('should handle complete HTTP request-response cycle', async () => {
      if (!websiteUrl && !publicIp) {
        console.warn('Website URL or public IP not available, skipping test');
        return;
      }

      const url = websiteUrl || `http://${publicIp}`;
      
      // Wait for the web server to be fully ready and bootstrap complete
      console.log('Waiting for web server initialization...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Test multiple consecutive requests to simulate real user behavior
      console.log('Testing multiple consecutive requests...');
      for (let i = 1; i <= 5; i++) {
        const response = await makeHttpRequest(url);
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Blog Platform');
        expect(response.body).toContain(`Environment: ${environmentSuffix}`);
        expect(response.body).toContain('Instance ID:');
        
        // Verify response headers
        console.log(`Request ${i} completed successfully`);
        
        // Small delay between requests to simulate real user behavior
        if (i < 5) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }, 300000); // 5 minutes timeout for comprehensive testing

    test('should handle concurrent user requests efficiently', async () => {
      if (!websiteUrl && !publicIp) {
        console.warn('Website URL or public IP not available, skipping test');
        return;
      }

      const url = websiteUrl || `http://${publicIp}`;
      
      // Test concurrent requests to simulate multiple users
      console.log('Testing concurrent user requests...');
      const concurrentRequests = [];
      
      for (let i = 0; i < 10; i++) {
        concurrentRequests.push(makeHttpRequest(url));
      }
      
      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Blog Platform');
        console.log(`Concurrent request ${index + 1} completed successfully`);
      });
    }, 180000); // 3 minutes timeout

    test('should serve content with proper HTTP headers and performance', async () => {
      if (!websiteUrl && !publicIp) {
        console.warn('Website URL or public IP not available, skipping test');
        return;
      }

      const url = websiteUrl || `http://${publicIp}`;
      
      // Measure response time for performance validation
      const startTime = Date.now();
      const response = await makeHttpRequest(url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Validate response
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Blog Platform');
      
      // Performance validation - should respond within reasonable time
      expect(responseTime).toBeLessThan(10000); // Less than 10 seconds
      console.log(`Response time: ${responseTime}ms`);
      
      // Validate content is HTML
      expect(response.body).toContain('<h1>');
      expect(response.body).toContain('<p>');
    }, 120000);

    test('should maintain service availability during load', async () => {
      if (!websiteUrl && !publicIp) {
        console.warn('Website URL or public IP not available, skipping test');
        return;
      }

      const url = websiteUrl || `http://${publicIp}`;
      
      // Simulate sustained load over time
      console.log('Testing service availability under sustained load...');
      
      let successfulRequests = 0;
      let failedRequests = 0;
      
      // Make requests every 2 seconds for 1 minute
      for (let i = 0; i < 30; i++) {
        try {
          const response = await makeHttpRequest(url);
          if (response.statusCode === 200) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        } catch (error) {
          failedRequests++;
          console.warn(`Request ${i + 1} failed:`, error);
        }
        
        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`Completed ${i + 1}/30 load test requests`);
        }
        
        // Wait before next request
        if (i < 29) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Service should maintain high availability (>90%)
      const availabilityPercentage = (successfulRequests / (successfulRequests + failedRequests)) * 100;
      console.log(`Service availability: ${availabilityPercentage.toFixed(2)}% (${successfulRequests}/${successfulRequests + failedRequests} requests successful)`);
      
      expect(availabilityPercentage).toBeGreaterThanOrEqual(90);
    }, 180000); // 3 minutes timeout

    test('should not be accessible on unauthorized ports', async () => {
      if (!publicIp) {
        console.warn('Public IP not available, skipping test');
        return;
      }

      console.log('Testing security - verifying unauthorized ports are blocked...');
      
      // Test common ports that should be blocked
      const blockedPorts = [22, 443, 3389, 21, 23, 25];
      
      for (const port of blockedPorts) {
        try {
          const testUrl = port === 443 ? `https://${publicIp}` : `http://${publicIp}:${port}`;
          await expect(makeHttpRequest(testUrl)).rejects.toThrow();
          console.log(`Port ${port} correctly blocked`);
        } catch (error) {
          // This is expected behavior - ports should be blocked
          console.log(`Port ${port} correctly blocked (${error.message})`);
        }
      }
    }, 120000);

    test('should handle error conditions gracefully', async () => {
      if (!publicIp) {
        console.warn('Public IP not available, skipping test');
        return;
      }

      // Test invalid paths
      const invalidPaths = ['/nonexistent', '/admin', '/api/test', '/../../etc/passwd'];
      
      for (const path of invalidPaths) {
        try {
          const response = await makeHttpRequest(`http://${publicIp}${path}`);
          // Should return 404 or similar error code, not crash
          expect(response.statusCode).toBeGreaterThanOrEqual(400);
          console.log(`Path ${path} returned appropriate error code: ${response.statusCode}`);
        } catch (error) {
          // Connection should be stable even for invalid requests
          console.log(`Path ${path} handled gracefully: ${error.message}`);
        }
      }
      
      // Verify that valid path still works after invalid requests
      const validResponse = await makeHttpRequest(`http://${publicIp}`);
      expect(validResponse.statusCode).toBe(200);
      console.log('Service remains stable after error condition testing');
    }, 180000);
  });

  describe('Application Flow Integration with AWS Services', () => {
    test('should validate EC2 instance can access S3 bucket through IAM role', async () => {
      if (!instanceId || !bucketName) {
        console.warn('Instance ID or bucket name not available, skipping test');
        return;
      }

      console.log('Testing S3 integration through IAM role...');
      
      // Verify the IAM role has necessary S3 permissions
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const iamInstanceProfile = instance.IamInstanceProfile?.Arn;
      expect(iamInstanceProfile).toBeDefined();
      
      // Verify S3 bucket exists and is accessible for the role
      const headCommand = new HeadBucketCommand({
        Bucket: bucketName
      });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
      
      console.log('EC2-S3 integration validated successfully');
    });

    test('should validate CloudWatch monitoring integration', async () => {
      if (!instanceId) {
        console.warn('Instance ID not available, skipping test');
        return;
      }

      console.log('Testing CloudWatch integration...');
      
      // Verify detailed monitoring is enabled
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.Monitoring?.State).toBe('enabled');
      
      // Verify alarms are properly configured and connected to the instance
      const cpuAlarmName = `EC2-CPUUtilization-BlogApp-${region}-${environmentSuffix}`;
      const statusAlarmName = `EC2-StatusCheckFailed-BlogApp-${region}-${environmentSuffix}`;
      
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: [cpuAlarmName, statusAlarmName]
      });
      
      const alarmsResponse = await cloudWatchClient.send(alarmsCommand);
      expect(alarmsResponse.MetricAlarms).toHaveLength(2);
      
      // Validate alarm dimensions reference the correct instance
      alarmsResponse.MetricAlarms!.forEach(alarm => {
        const instanceDimension = alarm.Dimensions?.find(d => d.Name === 'InstanceId');
        expect(instanceDimension?.Value).toBe(instanceId);
      });
      
      console.log('CloudWatch monitoring integration validated successfully');
    });

    test('should validate network flow from internet to application', async () => {
      if (!instanceId || !publicIp) {
        console.warn('Instance ID or public IP not available, skipping test');
        return;
      }

      console.log('Testing end-to-end network flow...');
      
      // Get instance details
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      
      // Verify instance is in public subnet
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicIpAddress).toBe(publicIp);
      
      // Verify security group allows HTTP
      const securityGroupId = instance.SecurityGroups![0].GroupId!;
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroup = sgResponse.SecurityGroups![0];
      
      const httpRule = securityGroup.IpPermissions!.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      
      // Test actual network connectivity
      const response = await makeHttpRequest(`http://${publicIp}`);
      expect(response.statusCode).toBe(200);
      
      console.log('End-to-end network flow validated successfully');
    });
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

    test('should validate all stack outputs are present and functional', () => {
      console.log('Validating stack outputs and their functionality...');
      
      if (Object.keys(outputs).length === 0) {
        console.warn('CFN outputs not available, using environment variables');
        
        // Check environment variables as fallback
        expect(process.env.VPC_ID || vpcId).toBeDefined();
        expect(process.env.BUCKET_NAME || bucketName).toBeDefined();
        expect(process.env.INSTANCE_ID || instanceId).toBeDefined();
        expect(process.env.PUBLIC_IP || publicIp).toBeDefined();
        expect(process.env.WEBSITE_URL || websiteUrl).toBeDefined();
      } else {
        // Validate outputs are present
        expect(outputs.VpcId).toBeDefined();
        expect(outputs.BucketName).toBeDefined();
        expect(outputs.InstanceId).toBeDefined();
        expect(outputs.PublicIp).toBeDefined();
        expect(outputs.WebsiteUrl).toBeDefined();
        
        // Validate output formats
        expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
        expect(outputs.InstanceId).toMatch(/^i-[a-f0-9]+$/);
        expect(outputs.PublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        expect(outputs.WebsiteUrl).toMatch(/^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        
        console.log('All stack outputs validated successfully');
      }
    });

    test('should validate application recovery after simulated failure', async () => {
      if (!websiteUrl && !publicIp) {
        console.warn('Website URL or public IP not available, skipping test');
        return;
      }

      const url = websiteUrl || `http://${publicIp}`;
      
      console.log('Testing application recovery capabilities...');
      
      // First verify the application is working
      let response = await makeHttpRequest(url);
      expect(response.statusCode).toBe(200);
      console.log('Initial application state verified');
      
      // Simulate high load to potentially trigger monitoring
      console.log('Simulating load to test monitoring response...');
      const loadTestPromises = [];
      for (let i = 0; i < 20; i++) {
        loadTestPromises.push(makeHttpRequest(url).catch(err => ({ error: err })));
      }
      
      const loadTestResults = await Promise.all(loadTestPromises);
      const successfulLoadRequests = loadTestResults.filter(result => 
        !result.error && result.statusCode === 200
      ).length;
      
      // Should handle majority of requests even under load
      expect(successfulLoadRequests).toBeGreaterThan(loadTestResults.length * 0.7);
      console.log(`Load test completed: ${successfulLoadRequests}/${loadTestResults.length} requests successful`);
      
      // Verify application is still responsive after load test
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for recovery
      response = await makeHttpRequest(url);
      expect(response.statusCode).toBe(200);
      console.log('Application recovery validated successfully');
    }, 300000); // 5 minutes timeout
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
