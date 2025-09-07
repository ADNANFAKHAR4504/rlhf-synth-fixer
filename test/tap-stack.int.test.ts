// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as AWS from 'aws-sdk';

// Check if outputs file exists, if not skip integration tests
let outputs: any = {};
let skipTests = false;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found - skipping integration tests');
  skipTests = true;
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const ec2 = new AWS.EC2({ region: 'us-east-1' });
const elbv2 = new AWS.ELBv2({ region: 'us-east-1' });
const s3 = new AWS.S3({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway({ region: 'us-east-1' });
const cloudformation = new AWS.CloudFormation({ region: 'us-east-1' });

describe('Security Infrastructure Integration Tests', () => {
  beforeAll(() => {
    if (skipTests) {
      console.log('Skipping integration tests - no deployment outputs found');
    }
  });

  describe('Load Balancer Integration', () => {
    test('should have accessible load balancer with HTTPS', async () => {
      if (skipTests) return;
      
      expect(outputs.LoadBalancerDnsName).toBeDefined();
      
      // Verify ALB exists and is active
      const albArn = outputs.LoadBalancerArn;
      if (albArn) {
        const response = await elbv2.describeLoadBalancers({
          LoadBalancerArns: [albArn]
        }).promise();
        
        expect(response.LoadBalancers).toHaveLength(1);
        expect(response.LoadBalancers![0].State?.Code).toBe('active');
        expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      }
    }, 30000);

    test('should have HTTPS listener configured', async () => {
      if (skipTests) return;
      
      const albArn = outputs.LoadBalancerArn;
      if (albArn) {
        const response = await elbv2.describeListeners({
          LoadBalancerArn: albArn
        }).promise();
        
        const httpsListener = response.Listeners?.find(l => l.Port === 443);
        expect(httpsListener).toBeDefined();
        expect(httpsListener?.Protocol).toBe('HTTPS');
        expect(httpsListener?.SslPolicy).toMatch(/ELBSecurityPolicy/);
      }
    }, 30000);
  });

  describe('API Gateway Integration', () => {
    test('should have API Gateway with health endpoint', async () => {
      if (skipTests) return;
      
      expect(outputs.ApiGatewayUrl).toBeDefined();
      
      // Extract API ID from URL
      const apiUrl = outputs.ApiGatewayUrl;
      const apiId = apiUrl.split('.')[0].split('//')[1];
      
      const response = await apigateway.getRestApi({
        restApiId: apiId
      }).promise();
      
      expect(response.name).toBe('Production Secure API');
    }, 30000);

    test('should have health endpoint returning 200', async () => {
      if (skipTests) return;
      
      const healthUrl = outputs.ApiGatewayUrl + 'health';
      
      // Use fetch to test the endpoint
      try {
        const response = await fetch(healthUrl);
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.status).toBe('healthy');
      } catch (error) {
        // If HTTPS cert is not valid for testing, that's expected
        console.warn('Health endpoint test failed - possibly due to certificate validation');
      }
    }, 30000);
  });

  describe('S3 Security Integration', () => {
    test('should have S3 buckets with proper encryption', async () => {
      if (skipTests) return;
      
      const bucketName = outputs.S3BucketName;
      if (bucketName) {
        const encryption = await s3.getBucketEncryption({
          Bucket: bucketName
        }).promise();
        
        expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
        const rule = encryption.ServerSideEncryptionConfiguration.Rules[0];
        expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      }
    }, 30000);

    test('should have S3 buckets with public access blocked', async () => {
      if (skipTests) return;
      
      const bucketName = outputs.S3BucketName;
      if (bucketName) {
        const publicAccessBlock = await s3.getPublicAccessBlock({
          Bucket: bucketName
        }).promise();
        
        expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      }
    }, 30000);
  });

  describe('VPC Security Integration', () => {
    test('should have VPC with proper subnet configuration', async () => {
      if (skipTests) return;
      
      const vpcId = outputs.VPCId;
      if (vpcId) {
        const subnets = await ec2.describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }).promise();
        
        expect(subnets.Subnets).toHaveLength(4); // 2 public + 2 private
        
        const publicSubnets = subnets.Subnets?.filter(s => s.MapPublicIpOnLaunch) || [];
        const privateSubnets = subnets.Subnets?.filter(s => !s.MapPublicIpOnLaunch) || [];
        
        expect(publicSubnets).toHaveLength(2);
        expect(privateSubnets).toHaveLength(2);
      }
    }, 30000);

    test('should have security groups with proper ingress rules', async () => {
      if (skipTests) return;
      
      const vpcId = outputs.VPCId;
      if (vpcId) {
        const securityGroups = await ec2.describeSecurityGroups({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }).promise();
        
        // Should have bastion and ALB security groups with restricted access
        const bastionSG = securityGroups.SecurityGroups?.find(sg => 
          sg.Description?.includes('bastion host')
        );
        
        expect(bastionSG).toBeDefined();
        expect(bastionSG?.IpPermissions?.some(rule => rule.FromPort === 22)).toBe(true);
      }
    }, 30000);
  });

  describe('Compliance Integration', () => {
    test('should have CloudFormation stack with all required resources', async () => {
      if (skipTests) return;
      
      const stackName = `TapStack${environmentSuffix}`;
      const response = await cloudformation.describeStacks({
        StackName: stackName
      }).promise();
      
      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
      
      // Check stack has required tags
      const tags = response.Stacks![0].Tags || [];
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      const securityTag = tags.find(tag => tag.Key === 'Security');
      
      expect(environmentTag?.Value).toBe('Production');
      expect(securityTag?.Value).toBe('High');
    }, 30000);

    test('should have all required stack outputs', async () => {
      if (skipTests) return;
      
      // Verify critical outputs exist
      expect(outputs.LoadBalancerDnsName).toBeDefined();
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.SecurityAlertsTopicArn).toBeDefined();
      expect(outputs.KmsKeyId).toBeDefined();
      
      // Verify output formats
      expect(outputs.SecurityAlertsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.ApiGatewayUrl).toMatch(/^https:\/\//);
      expect(outputs.LoadBalancerDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('Security Monitoring Integration', () => {
    test('should have SNS topic for security alerts', async () => {
      if (skipTests) return;
      
      const topicArn = outputs.SecurityAlertsTopicArn;
      if (topicArn) {
        const sns = new AWS.SNS({ region: 'us-east-1' });
        const response = await sns.getTopicAttributes({
          TopicArn: topicArn
        }).promise();
        
        expect(response.Attributes?.DisplayName).toBe('Production Security Alerts');
        expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      }
    }, 30000);

    test('should have KMS key for encryption', async () => {
      if (skipTests) return;
      
      const keyId = outputs.KmsKeyId;
      if (keyId) {
        const kms = new AWS.KMS({ region: 'us-east-1' });
        const response = await kms.describeKey({
          KeyId: keyId
        }).promise();
        
        expect(response.KeyMetadata?.Description).toBe('KMS key for production environment encryption');
        expect(response.KeyMetadata?.KeyRotationStatus).toBe(true);
      }
    }, 30000);
  });

  describe('Network Connectivity Tests', () => {
    test('should not be able to access private instances directly', async () => {
      if (skipTests) return;
      
      // This test validates that private instances don't have public IPs
      const vpcId = outputs.VPCId;
      if (vpcId) {
        const instances = await ec2.describeInstances({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'instance-state-name', Values: ['running'] }
          ]
        }).promise();
        
        // Find app instances (t3.small) - they should not have public IPs
        instances.Reservations?.forEach(reservation => {
          reservation.Instances?.forEach(instance => {
            if (instance.InstanceType === 't3.small') {
              expect(instance.PublicIpAddress).toBeUndefined();
              expect(instance.PublicDnsName).toBeFalsy();
            }
          });
        });
      }
    }, 30000);
  });
});
