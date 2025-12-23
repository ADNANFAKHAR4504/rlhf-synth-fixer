import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure, scalable, and cost-effective web application environment'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentName',
        'OwnerName',
        'LatestAmiId',
        'ExistingVPCId',
        'EnvironmentSuffix',
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.Description).toBe('Environment name for resource tagging');
    });

    test('LatestAmiId parameter should be correct type', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('ExistingVPCId parameter should be correct type', () => {
      const param = template.Parameters.ExistingVPCId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('EnvironmentSuffix parameter should be correct type', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
      expect(kmsKey.Properties.Description).toBe(
        'KMS key for encrypting S3 and RDS data'
      );
    });

    test('should have security groups for different tiers', () => {
      const securityGroups = [
        'WebServerSecurityGroup',
        'LoadBalancerSecurityGroup',
        'DatabaseSecurityGroup',
      ];
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC with correct CIDR', () => {
      const vpc = template.Resources.WebAppVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('172.16.0.0/16');
    });

    test('should have public and private subnets', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
      ];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have internet gateway and route table', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have EC2 key pair', () => {
      expect(template.Resources.EC2KeyPair).toBeDefined();
      expect(template.Resources.EC2KeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('should have VPC peering connection condition', () => {
      expect(template.Conditions.VPCIdProvided).toBeDefined();
      expect(template.Resources.VPCPeeringConnection).toBeDefined();
      expect(template.Resources.VPCPeeringConnection.Type).toBe('AWS::EC2::VPCPeeringConnection');
      expect(template.Resources.VPCPeeringConnection.Condition).toBe('VPCIdProvided');
    });
  });

  describe('Compute Resources', () => {
    test('should have launch template for EC2 instances', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toBe(
        't3.micro'
      );
    });

    test('should have auto scaling group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(5);
    });

    test('should have application load balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket with encryption', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should have proper security configuration', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock =
        s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have CloudFront distribution', () => {
      const cloudfront = template.Resources.CloudFrontDistribution;
      expect(cloudfront).toBeDefined();
      expect(cloudfront.Type).toBe('AWS::CloudFront::Distribution');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS instance with proper configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.42');
    });

    test('RDS should have proper security settings', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have secrets manager for DB credentials', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role with proper permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(1);
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch alarms', () => {
      const alarms = ['CPUAlarm', 'RDSBurstBalanceAlarm'];
      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('should have auto scaling policies', () => {
      const policies = ['ScaleUpPolicy', 'ScaleDownPolicy'];
      policies.forEach(policy => {
        expect(template.Resources[policy]).toBeDefined();
        expect(template.Resources[policy].Type).toBe(
          'AWS::AutoScaling::ScalingPolicy'
        );
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'CloudFrontDistributionDomainName',
        'S3BucketName',
        'DatabaseEndpoint',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // We have many resources in this template
    });

    test('all resources should have proper tagging', () => {
      const resourcesWithTags = [
        'WebAppVPC',
        'PublicSubnet1',
        'S3Bucket',
        'RDSInstance',
        'AutoScalingGroup',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const environmentTag = tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
          expect(environmentTag).toBeDefined();
          expect(ownerTag).toBeDefined();
        }
      });
    });
  });
});
