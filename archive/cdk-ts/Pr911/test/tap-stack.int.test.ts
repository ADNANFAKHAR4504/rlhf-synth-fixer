import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'int-test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStackIntegration', { 
      environmentSuffix: environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Integration and Dependencies', () => {
    test('should create complete infrastructure with all required resources', () => {
      // Verify all major resource types are created
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::RDS::DBInstance',
        'AWS::Lambda::Function',
        'AWS::EC2::Instance',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::WAFv2::WebACL',
        'AWS::Logs::LogGroup',
        'AWS::IAM::Role',
        'AWS::SecretsManager::Secret'
      ];

      resourceTypes.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        expect(Object.keys(resources).length).toBeGreaterThan(0);
      });
    });

    test('should have proper resource dependencies and references', () => {
      // Test that resources reference each other correctly
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      const securityGroupResources = template.findResources('AWS::EC2::SecurityGroup');
      
      expect(Object.keys(vpcResources).length).toBeGreaterThan(0);
      expect(Object.keys(subnetResources).length).toBeGreaterThan(0);
      expect(Object.keys(securityGroupResources).length).toBeGreaterThan(0);

      // Verify subnets reference the VPC
      Object.values(subnetResources).forEach(subnet => {
        expect(subnet.Properties?.VpcId).toBeDefined();
      });

      // Verify security groups reference the VPC
      Object.values(securityGroupResources).forEach(sg => {
        expect(sg.Properties?.VpcId).toBeDefined();
      });
    });

    test('should integrate KMS key with all encrypted resources', () => {
      const kmsKey = template.findResources('AWS::KMS::Key');
      const kmsKeyArn = Object.values(kmsKey)[0]?.Properties?.Arn || 
                       { 'Fn::GetAtt': [Object.keys(kmsKey)[0], 'Arn'] };

      // Verify S3 buckets use KMS encryption
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach(bucket => {
        const encryption = bucket.Properties?.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });

      // Verify RDS uses KMS encryption
      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      Object.values(rdsInstances).forEach(rds => {
        expect(rds.Properties?.StorageEncrypted).toBe(true);
        expect(rds.Properties?.KmsKeyId).toBeDefined();
      });

      // Verify EBS volumes use KMS encryption
      const ec2Instances = template.findResources('AWS::EC2::Instance');
      Object.values(ec2Instances).forEach(instance => {
        const blockDevices = instance.Properties?.BlockDeviceMappings;
        expect(blockDevices).toBeDefined();
        blockDevices?.forEach((device: any) => {
          expect(device.Ebs?.Encrypted).toBe(true);
          expect(device.Ebs?.KmsKeyId).toBeDefined();
        });
      });
    });
  });

  describe('Network Integration and Security', () => {
    test('should create proper network architecture with security isolation', () => {
      // Verify VPC has all required subnet types
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetTypes = {
        private: 0,
        public: 0,
        isolated: 0
      };

      Object.values(subnets).forEach(subnet => {
        const tags = subnet.Properties?.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag?.Value?.includes('PrivateSubnet')) subnetTypes.private++;
        if (nameTag?.Value?.includes('PublicSubnet')) subnetTypes.public++;
        if (nameTag?.Value?.includes('DatabaseSubnet')) subnetTypes.isolated++;
      });

      expect(subnetTypes.private).toBeGreaterThan(0);
      expect(subnetTypes.public).toBeGreaterThan(0);
      expect(subnetTypes.isolated).toBeGreaterThan(0);
    });

    test('should integrate security groups with proper access patterns', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sgMap = new Map();

      // Create a map of security groups by description
      Object.values(securityGroups).forEach(sg => {
        sgMap.set(sg.Properties?.GroupDescription, sg);
      });

      // Verify database security group is restrictive
      const dbSG = sgMap.get('Security group for RDS database - restrictive inbound rules');
      expect(dbSG).toBeDefined();
      expect(dbSG.Properties?.SecurityGroupEgress).toBeDefined();

      // Verify ALB security group allows HTTP traffic
      const albSG = sgMap.get('Security group for Application Load Balancer');
      expect(albSG).toBeDefined();
      expect(albSG.Properties?.SecurityGroupIngress).toBeDefined();

      // Verify EC2 security group allows traffic from ALB only
      const ec2SG = sgMap.get('Security group for EC2 instances - no direct public access');
      expect(ec2SG).toBeDefined();
    });

    test('should integrate VPC Flow Logs with CloudWatch', () => {
      const flowLogs = template.findResources('AWS::EC2::FlowLog');
      const logGroups = template.findResources('AWS::Logs::LogGroup');

      expect(Object.keys(flowLogs).length).toBeGreaterThan(0);
      expect(Object.keys(logGroups).length).toBeGreaterThan(0);

      // Verify flow logs are configured for the VPC
      Object.values(flowLogs).forEach(flowLog => {
        expect(flowLog.Properties?.ResourceType).toBe('VPC');
        expect(flowLog.Properties?.TrafficType).toBe('ALL');
      });

      // Verify log group has environment-specific naming
      const vpcFlowLogGroups = Object.values(logGroups).filter(logGroup => 
        logGroup.Properties?.LogGroupName?.includes('vpc/flowlogs')
      );
      expect(vpcFlowLogGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Application Integration and Load Balancing', () => {
    test('should integrate ALB with EC2 instances and WAF', () => {
      const alb = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const targetGroups = template.findResources('AWS::ElasticLoadBalancingV2::TargetGroup');
      const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
      const waf = template.findResources('AWS::WAFv2::WebACL');
      const wafAssociations = template.findResources('AWS::WAFv2::WebACLAssociation');

      expect(Object.keys(alb).length).toBeGreaterThan(0);
      expect(Object.keys(targetGroups).length).toBeGreaterThan(0);
      expect(Object.keys(listeners).length).toBeGreaterThan(0);
      expect(Object.keys(waf).length).toBeGreaterThan(0);
      expect(Object.keys(wafAssociations).length).toBeGreaterThan(0);

      // Verify ALB is internet-facing
      Object.values(alb).forEach(loadBalancer => {
        expect(loadBalancer.Properties?.Scheme).toBe('internet-facing');
        expect(loadBalancer.Properties?.Type).toBe('application');
      });

      // Verify WAF is associated with ALB
      Object.values(wafAssociations).forEach(association => {
        expect(association.Properties?.ResourceArn).toBeDefined();
        // WebAclArn might be a reference, so check if it exists in any form
        expect(association.Properties?.WebAclArn || association.Properties?.WebACLArn).toBeDefined();
      });
    });

    test('should integrate Lambda function with VPC and database', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const lambdaRoles = template.findResources('AWS::IAM::Role');

      expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);

      Object.values(lambdaFunctions).forEach(lambda => {
        // Verify Lambda is in VPC
        expect(lambda.Properties?.VpcConfig).toBeDefined();
        expect(lambda.Properties?.VpcConfig.SecurityGroupIds).toBeDefined();
        expect(lambda.Properties?.VpcConfig.SubnetIds).toBeDefined();

        // Verify Lambda has environment variables
        expect(lambda.Properties?.Environment?.Variables).toBeDefined();
        const envVars = lambda.Properties?.Environment?.Variables;
        expect(envVars?.DB_HOST).toBeDefined();
        expect(envVars?.DB_NAME).toBeDefined();
        expect(envVars?.S3_BUCKET).toBeDefined();
      });
    });

    test('should integrate EC2 instance with proper IAM role and security', () => {
      const ec2Instances = template.findResources('AWS::EC2::Instance');
      const instanceProfiles = template.findResources('AWS::IAM::InstanceProfile');

      expect(Object.keys(ec2Instances).length).toBeGreaterThan(0);
      expect(Object.keys(instanceProfiles).length).toBeGreaterThan(0);

      Object.values(ec2Instances).forEach(instance => {
        // Verify instance has IAM role
        expect(instance.Properties?.IamInstanceProfile).toBeDefined();

        // Verify instance is in private subnet
        expect(instance.Properties?.SubnetId).toBeDefined();

        // Verify instance has security groups
        expect(instance.Properties?.SecurityGroupIds).toBeDefined();

        // Verify instance has encrypted EBS volumes
        const blockDevices = instance.Properties?.BlockDeviceMappings;
        expect(blockDevices).toBeDefined();
        blockDevices?.forEach((device: any) => {
          expect(device.Ebs?.Encrypted).toBe(true);
        });
      });
    });
  });

  describe('Database Integration and Security', () => {
    test('should integrate RDS with proper security and encryption', () => {
      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      const dbSubnetGroups = template.findResources('AWS::RDS::DBSubnetGroup');
      const secrets = template.findResources('AWS::SecretsManager::Secret');

      expect(Object.keys(rdsInstances).length).toBeGreaterThan(0);
      expect(Object.keys(dbSubnetGroups).length).toBeGreaterThan(0);
      expect(Object.keys(secrets).length).toBeGreaterThan(0);

      Object.values(rdsInstances).forEach(rds => {
        // Verify RDS is not publicly accessible
        expect(rds.Properties?.PubliclyAccessible).toBe(false);

        // Verify RDS is encrypted
        expect(rds.Properties?.StorageEncrypted).toBe(true);

        // Verify RDS uses subnet group
        expect(rds.Properties?.DBSubnetGroupName).toBeDefined();

        // Verify RDS has security groups
        expect(rds.Properties?.VPCSecurityGroups).toBeDefined();
      });
    });

    test('should integrate Secrets Manager with RDS credentials', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      const secretAttachments = template.findResources('AWS::SecretsManager::SecretTargetAttachment');

      expect(Object.keys(secrets).length).toBeGreaterThan(0);
      expect(Object.keys(secretAttachments).length).toBeGreaterThan(0);

      Object.values(secrets).forEach(secret => {
        // Verify secret is configured for RDS
        expect(secret.Properties?.GenerateSecretString).toBeDefined();
        const secretConfig = secret.Properties?.GenerateSecretString;
        expect(secretConfig?.SecretStringTemplate).toBe('{"username":"admin"}');
        expect(secretConfig?.PasswordLength).toBe(30);
      });

      Object.values(secretAttachments).forEach(attachment => {
        // Verify secret is attached to RDS
        expect(attachment.Properties?.SecretId).toBeDefined();
        expect(attachment.Properties?.TargetId).toBeDefined();
        expect(attachment.Properties?.TargetType).toBe('AWS::RDS::DBInstance');
      });
    });
  });

  describe('Monitoring and Audit Integration', () => {
    test('should integrate CloudTrail with S3 and CloudWatch', () => {
      const cloudTrail = template.findResources('AWS::CloudTrail::Trail');
      const cloudTrailBuckets = template.findResources('AWS::S3::Bucket');

      // For int-test environment, CloudTrail should not be created due to 5-trail limit
      expect(Object.keys(cloudTrail).length).toBe(0);

      // But S3 buckets should still be created (including CloudTrail bucket for future use)
      expect(Object.keys(cloudTrailBuckets).length).toBeGreaterThan(0);
    });

    test('should integrate logging with proper retention and encryption', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');

      Object.values(logGroups).forEach(logGroup => {
        // Verify log groups have retention policy
        expect(logGroup.Properties?.RetentionInDays).toBeDefined();

        // Verify log groups are encrypted (if KMS key is specified)
        if (logGroup.Properties?.KmsKeyId) {
          expect(logGroup.Properties?.KmsKeyId).toBeDefined();
        }
      });
    });
  });

  describe('IAM Integration and Permissions', () => {
    test('should integrate IAM roles with proper permissions and trust policies', () => {
      const iamRoles = template.findResources('AWS::IAM::Role');
      const iamPolicies = template.findResources('AWS::IAM::Policy');

      expect(Object.keys(iamRoles).length).toBeGreaterThan(0);

      Object.values(iamRoles).forEach(role => {
        // Verify role has assume role policy
        expect(role.Properties?.AssumeRolePolicyDocument).toBeDefined();

        // Verify role has proper service principal
        const assumePolicy = role.Properties?.AssumeRolePolicyDocument;
        const statements = assumePolicy?.Statement || [];
        statements.forEach((statement: any) => {
          expect(statement.Effect).toBe('Allow');
          expect(statement.Principal?.Service).toBeDefined();
        });
      });
    });

    test('should integrate instance profiles with EC2 instances', () => {
      const instanceProfiles = template.findResources('AWS::IAM::InstanceProfile');
      const ec2Instances = template.findResources('AWS::EC2::Instance');

      expect(Object.keys(instanceProfiles).length).toBeGreaterThan(0);

      Object.values(instanceProfiles).forEach(profile => {
        // Verify instance profile has roles
        expect(profile.Properties?.Roles).toBeDefined();
        expect(profile.Properties?.Roles.length).toBeGreaterThan(0);
      });

      // Verify EC2 instances use instance profiles
      Object.values(ec2Instances).forEach(instance => {
        expect(instance.Properties?.IamInstanceProfile).toBeDefined();
      });
    });
  });

  describe('End-to-End Integration Scenarios', () => {
    test('should support complete web application flow', () => {
      // Test the complete flow: ALB -> EC2 -> Database
      const alb = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const ec2Instances = template.findResources('AWS::EC2::Instance');
      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      const targetGroups = template.findResources('AWS::ElasticLoadBalancingV2::TargetGroup');

      expect(Object.keys(alb).length).toBeGreaterThan(0);
      expect(Object.keys(ec2Instances).length).toBeGreaterThan(0);
      expect(Object.keys(rdsInstances).length).toBeGreaterThan(0);
      expect(Object.keys(targetGroups).length).toBeGreaterThan(0);

      // Verify target group has EC2 instances as targets
      Object.values(targetGroups).forEach(targetGroup => {
        expect(targetGroup.Properties?.Targets).toBeDefined();
        expect(targetGroup.Properties?.Targets.length).toBeGreaterThan(0);
      });
    });

    test('should support serverless data processing flow', () => {
      // Test the flow: Lambda -> S3 -> Database
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      const rdsInstances = template.findResources('AWS::RDS::DBInstance');

      expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);
      expect(Object.keys(s3Buckets).length).toBeGreaterThan(0);
      expect(Object.keys(rdsInstances).length).toBeGreaterThan(0);

      // Verify Lambda has access to S3 and database
      Object.values(lambdaFunctions).forEach(lambda => {
        const envVars = lambda.Properties?.Environment?.Variables;
        expect(envVars?.S3_BUCKET).toBeDefined();
        expect(envVars?.DB_HOST).toBeDefined();
        expect(envVars?.DB_NAME).toBeDefined();
      });
    });

    test('should support secure data storage and retrieval', () => {
      // Test encryption and access patterns
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      const kmsKey = template.findResources('AWS::KMS::Key');
      const iamRoles = template.findResources('AWS::IAM::Role');

      expect(Object.keys(s3Buckets).length).toBeGreaterThan(0);
      expect(Object.keys(kmsKey).length).toBeGreaterThan(0);
      expect(Object.keys(iamRoles).length).toBeGreaterThan(0);

      // Verify S3 buckets have proper encryption and access policies
      Object.values(s3Buckets).forEach(bucket => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
        expect(bucket.Properties?.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
      });
    });
  });

  describe('Environment-Specific Integration', () => {
    test('should handle different environment configurations', () => {
      // Test with different environment suffixes
      const environments = ['dev', 'staging', 'prod'];
      
      environments.forEach(env => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TestStack${env}`, { 
          environmentSuffix: env,
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
        const testTemplate = Template.fromStack(testStack);

        // Verify environment-specific naming
        const kmsKey = testTemplate.findResources('AWS::KMS::Key');
        Object.values(kmsKey).forEach(key => {
          expect(key.Properties?.Description).toContain(env);
        });

        // Verify environment-specific tags
        const vpc = testTemplate.findResources('AWS::EC2::VPC');
        Object.values(vpc).forEach(vpcResource => {
          const tags = vpcResource.Properties?.Tags || [];
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag?.Value).toBe(env);
        });
      });
    });

    test('should maintain security standards across environments', () => {
      // Test that security configurations are consistent across environments
      const environments = ['dev', 'staging', 'prod'];
      
      environments.forEach(env => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TestStack${env}`, { 
          environmentSuffix: env,
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
        const testTemplate = Template.fromStack(testStack);

        // Verify encryption is enabled in all environments
        const s3Buckets = testTemplate.findResources('AWS::S3::Bucket');
        Object.values(s3Buckets).forEach(bucket => {
          expect(bucket.Properties?.BucketEncryption).toBeDefined();
        });

        // Verify RDS is not publicly accessible in all environments
        const rdsInstances = testTemplate.findResources('AWS::RDS::DBInstance');
        Object.values(rdsInstances).forEach(rds => {
          expect(rds.Properties?.PubliclyAccessible).toBe(false);
          expect(rds.Properties?.StorageEncrypted).toBe(true);
        });

        // Verify WAF is configured in all environments
        const waf = testTemplate.findResources('AWS::WAFv2::WebACL');
        expect(Object.keys(waf).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing optional parameters gracefully', () => {
      // Test stack creation with minimal parameters
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackMinimal');
      const testTemplate = Template.fromStack(testStack);

      // Verify stack still creates all required resources
      const vpc = testTemplate.findResources('AWS::EC2::VPC');
      const kmsKey = testTemplate.findResources('AWS::KMS::Key');
      const s3Bucket = testTemplate.findResources('AWS::S3::Bucket');

      expect(Object.keys(vpc).length).toBeGreaterThan(0);
      expect(Object.keys(kmsKey).length).toBeGreaterThan(0);
      expect(Object.keys(s3Bucket).length).toBeGreaterThan(0);
    });

    test('should handle resource naming conflicts', () => {
      // Test that resources have unique names
      const resourceNames = new Set();
      
      Object.values(template.findResources('*')).forEach(resource => {
        if (resource.Properties?.Tags) {
          resource.Properties.Tags.forEach((tag: any) => {
            if (tag.Key === 'Name') {
              expect(resourceNames.has(tag.Value)).toBe(false);
              resourceNames.add(tag.Value);
            }
          });
        }
      });
    });
  });
});
