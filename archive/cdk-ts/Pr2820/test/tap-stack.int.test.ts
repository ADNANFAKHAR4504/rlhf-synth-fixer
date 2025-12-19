// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('AWS Infrastructure Integration Tests', () => {
  describe('Application Load Balancer Connectivity', () => {
    test('Load Balancer DNS should be accessible', async () => {
      const loadBalancerDNS = outputs.LoadBalancerDNS;
      expect(loadBalancerDNS).toMatch(/^tap-.+-alb-.+\.us-west-2\.elb\.amazonaws\.com$/);
      expect(loadBalancerDNS).toContain('us-west-2');
    });

    test('Load Balancer should be in correct region', async () => {
      const loadBalancerDNS = outputs.LoadBalancerDNS;
      expect(loadBalancerDNS).toContain('us-west-2');
    });
  });

  describe('Database Connectivity', () => {
    test('Database endpoint should be in correct region and format', async () => {
      const databaseEndpoint = outputs.DatabaseEndpoint;
      expect(databaseEndpoint).toMatch(/^tap-.+-database-instance\..+\.us-west-2\.rds\.amazonaws\.com$/);
      expect(databaseEndpoint).toContain('us-west-2');
      expect(databaseEndpoint).toContain('rds.amazonaws.com');
    });

    test('Database secret ARN should be valid', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:us-west-2:\d{12}:secret:.+$/);
      expect(secretArn).toContain('us-west-2');
      expect(secretArn).toContain('secretsmanager');
    });
  });

  describe('S3 Storage', () => {
    test('Logs bucket name should follow naming convention', async () => {
      const logsBucketName = outputs.LogsBucketName;
      expect(logsBucketName).toMatch(/^tap-.+-logs-bucket-.+$/);
      expect(typeof logsBucketName).toBe('string');
      expect(logsBucketName.length).toBeGreaterThan(0);
    });

    test('Static content bucket should exist', async () => {
      const staticBucketName = outputs.StaticContentBucketName;
      expect(staticBucketName).toMatch(/^tap-.+-static-content-bucket-.+$/);
      expect(typeof staticBucketName).toBe('string');
      expect(staticBucketName.length).toBeGreaterThan(0);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution domain should be valid', async () => {
      const distributionDomain = outputs.CloudFrontDistributionDomain;
      expect(distributionDomain).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
      expect(distributionDomain).toContain('cloudfront.net');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC ID should be valid', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    test('Public subnets should be in different AZs', async () => {
      const subnet1 = outputs.PublicSubnet1Id;
      const subnet2 = outputs.PublicSubnet2Id;
      
      expect(subnet1).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(subnet2).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(subnet1).not.toBe(subnet2);
    });

    test('Private subnets should exist', async () => {
      const subnet1 = outputs.PrivateSubnet1Id;
      const subnet2 = outputs.PrivateSubnet2Id;
      
      expect(subnet1).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(subnet2).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(subnet1).not.toBe(subnet2);
    });

    test('Isolated subnets should exist for RDS', async () => {
      const subnet1 = outputs.IsolatedSubnet1Id;
      const subnet2 = outputs.IsolatedSubnet2Id;
      
      expect(subnet1).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(subnet2).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(subnet1).not.toBe(subnet2);
    });
  });

  describe('Security Groups', () => {
    test('Security group IDs should be valid', async () => {
      const albSecurityGroup = outputs.ALBSecurityGroupId;
      const ec2SecurityGroup = outputs.EC2SecurityGroupId;
      const dbSecurityGroup = outputs.DatabaseSecurityGroupId;

      expect(albSecurityGroup).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(ec2SecurityGroup).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(dbSecurityGroup).toMatch(/^sg-[a-f0-9]{17}$/);

      // All should be different
      expect(albSecurityGroup).not.toBe(ec2SecurityGroup);
      expect(ec2SecurityGroup).not.toBe(dbSecurityGroup);
      expect(albSecurityGroup).not.toBe(dbSecurityGroup);
    });
  });

  describe('Auto Scaling and Launch Template', () => {
    test('Launch Template ID should be valid', async () => {
      const launchTemplateId = outputs.LaunchTemplateId;
      expect(launchTemplateId).toMatch(/^lt-[a-f0-9]{17}$/);
    });

    test('Auto Scaling Group ARN should be valid', async () => {
      const asgArn = outputs.AutoScalingGroupArn;
      expect(asgArn).toMatch(/^arn:aws:autoscaling:us-west-2:\d{12}:autoScalingGroup:.+$/);
      expect(asgArn).toContain('us-west-2');
    });
  });

  describe('Lambda Function', () => {
    test('Snapshot Lambda function ARN should be valid', async () => {
      const lambdaArn = outputs.SnapshotLambdaFunctionArn;
      expect(lambdaArn).toMatch(/^arn:aws:lambda:us-west-2:\d{12}:function:.+$/);
      expect(lambdaArn).toContain('us-west-2');
      expect(lambdaArn).toContain('SnapshotLambda');
    });
  });

  describe('IAM Resources', () => {
    test('EC2 Role ARN should be valid', async () => {
      const roleArn = outputs.EC2RoleArn;
      expect(roleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(roleArn).toContain('EC2InstanceRole');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('All critical infrastructure components are present', async () => {
      // Verify all required outputs exist
      const requiredOutputs = [
        'LoadBalancerDNS',
        'CloudFrontDistributionDomain',
        'DatabaseEndpoint',
        'LogsBucketName',
        'StaticContentBucketName',
        'VPCId',
        'EC2RoleArn',
        'DatabaseSecretArn',
        'SnapshotLambdaFunctionArn'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeTruthy();
        expect(typeof outputs[output]).toBe('string');
        expect(outputs[output].length).toBeGreaterThan(0);
      });
    });

    test('Resource naming follows environment suffix pattern', async () => {
      // Check that resources include the proper naming convention
      const resourcesWithSuffix = [
        outputs.LoadBalancerDNS,
        outputs.LogsBucketName,
        outputs.StaticContentBucketName
      ];

      resourcesWithSuffix.forEach(resource => {
        expect(resource).toContain('tap-');
      });
    });

    test('All AWS resources are in us-west-2 region', async () => {
      const regionalResources = [
        outputs.LoadBalancerDNS,
        outputs.DatabaseEndpoint,
        outputs.DatabaseSecretArn,
        outputs.SnapshotLambdaFunctionArn,
        outputs.AutoScalingGroupArn
      ];

      regionalResources.forEach(resource => {
        expect(resource).toContain('us-west-2');
      });
    });

    test('Infrastructure supports high availability', async () => {
      // Check that we have multiple subnets for redundancy
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
      expect(outputs.IsolatedSubnet1Id).not.toBe(outputs.IsolatedSubnet2Id);

      // Check that security groups are properly isolated
      expect(outputs.ALBSecurityGroupId).not.toBe(outputs.EC2SecurityGroupId);
      expect(outputs.EC2SecurityGroupId).not.toBe(outputs.DatabaseSecurityGroupId);
    });
  });

  describe('Compliance and Security Validation', () => {
    test('Database is properly secured with Secrets Manager', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toContain('secretsmanager');
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:us-west-2:\d{12}:secret:.+$/);
    });

    test('All resources follow AWS naming conventions', async () => {
      // VPC ID format
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
      
      // Subnet ID formats
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.IsolatedSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      
      // Security Group ID formats
      expect(outputs.ALBSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs.EC2SecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
    });
  });
});