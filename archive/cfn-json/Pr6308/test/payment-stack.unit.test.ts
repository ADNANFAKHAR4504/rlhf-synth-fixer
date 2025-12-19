import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 's907';

describe('Payment Stack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/payment-stack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-environment payment processing');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter with correct values', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(3);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(10);
    });

    test('should have VPC and subnet parameters', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.PrivateSubnet1).toBeDefined();
      expect(template.Parameters.PrivateSubnet2).toBeDefined();
      expect(template.Parameters.PrivateSubnet3).toBeDefined();
      expect(template.Parameters.PublicSubnet1).toBeDefined();
      expect(template.Parameters.PublicSubnet2).toBeDefined();
      expect(template.Parameters.PublicSubnet3).toBeDefined();
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('AWS::EC2::KeyPair::KeyName');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping with all environments', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('dev environment should have correct configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig.RDSInstanceClass).toBe('db.t3.micro');
      expect(devConfig.EC2InstanceType).toBe('t3.micro');
      expect(devConfig.BackupRetentionDays).toBe(1);
      expect(devConfig.MultiAZ).toBe('false');
      expect(devConfig.MinSize).toBe(1);
      expect(devConfig.MaxSize).toBe(2);
      expect(devConfig.DesiredCapacity).toBe(1);
      expect(devConfig.CPUAlarmThreshold).toBe(80);
    });

    test('staging environment should have correct configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig.RDSInstanceClass).toBe('db.t3.small');
      expect(stagingConfig.EC2InstanceType).toBe('t3.small');
      expect(stagingConfig.BackupRetentionDays).toBe(7);
      expect(stagingConfig.MultiAZ).toBe('true');
      expect(stagingConfig.MinSize).toBe(2);
      expect(stagingConfig.MaxSize).toBe(4);
    });

    test('prod environment should have correct configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.RDSInstanceClass).toBe('db.t3.medium');
      expect(prodConfig.EC2InstanceType).toBe('t3.medium');
      expect(prodConfig.BackupRetentionDays).toBe(30);
      expect(prodConfig.MultiAZ).toBe('true');
      expect(prodConfig.MinSize).toBe(3);
      expect(prodConfig.MaxSize).toBe(10);
    });
  });

  describe('Conditions', () => {
    test('should have IsMultiAZ condition', () => {
      expect(template.Conditions.IsMultiAZ).toBeDefined();
      expect(template.Conditions.IsMultiAZ['Fn::Or']).toBeDefined();
    });

    test('should have EnableVersioning condition', () => {
      expect(template.Conditions.EnableVersioning).toBeDefined();
      expect(template.Conditions.EnableVersioning['Fn::Or']).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have DBPassword secret', () => {
      expect(template.Resources.DBPassword).toBeDefined();
      expect(template.Resources.DBPassword.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBPassword.Properties.Name).toEqual({
        'Fn::Sub': 'payment-db-password-${Environment}-${EnvironmentSuffix}'
      });
    });

    test('should have DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('should have DBSecurityGroup', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = template.Resources.DBSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
    });

    test('should have RDSInstance with correct properties', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.RDSInstance.DeletionPolicy).toBe('Delete');

      const props = template.Resources.RDSInstance.Properties;
      expect(props.Engine).toBe('postgres');
      // EngineVersion can vary based on AWS updates, checking it exists
      expect(props.EngineVersion).toBeDefined();
      expect(props.StorageEncrypted).toBe(true);
      expect(props.DeletionProtection).toBe(false);
      expect(props.PubliclyAccessible).toBe(false);
    });

    test('RDSInstance should reference DBPassword secret', () => {
      const masterPassword = template.Resources.RDSInstance.Properties.MasterUserPassword;
      expect(masterPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBPassword}:SecretString:password}}'
      });
    });

    test('RDSInstance should use MultiAZ condition', () => {
      const multiAZ = template.Resources.RDSInstance.Properties.MultiAZ;
      expect(multiAZ).toEqual({
        'Fn::If': ['IsMultiAZ', true, false]
      });
    });

    test('should have RDS CPU alarm', () => {
      expect(template.Resources.RDSCPUAlarm).toBeDefined();
      expect(template.Resources.RDSCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.RDSCPUAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(template.Resources.RDSCPUAlarm.Properties.Namespace).toBe('AWS/RDS');
    });
  });

  describe('S3 Resources', () => {
    test('should have StaticContentBucket', () => {
      expect(template.Resources.StaticContentBucket).toBeDefined();
      expect(template.Resources.StaticContentBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.StaticContentBucket.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket should have encryption enabled', () => {
      const encryption = template.Resources.StaticContentBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', () => {
      const publicAccess = template.Resources.StaticContentBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should use versioning condition', () => {
      const versioning = template.Resources.StaticContentBucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toEqual({
        'Fn::If': ['EnableVersioning', 'Enabled', 'Suspended']
      });
    });

    test('S3 bucket should have lifecycle rules', () => {
      const lifecycle = template.Resources.StaticContentBucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have ALBSecurityGroup', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(2); // HTTP and HTTPS
    });

    test('should have ApplicationLoadBalancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Type).toBe('application');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should use 3 public subnets', () => {
      const subnets = template.Resources.ApplicationLoadBalancer.Properties.Subnets;
      expect(subnets.length).toBe(3);
    });

    test('should have ALBTargetGroup', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      const props = template.Resources.ALBTargetGroup.Properties;
      expect(props.Port).toBe(80);
      expect(props.Protocol).toBe('HTTP');
      expect(props.HealthCheckPath).toBe('/health');
    });

    test('should have ALBListener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.ALBListener.Properties.Port).toBe(80);
      expect(template.Resources.ALBListener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have EC2SecurityGroup', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 security group should allow traffic from ALB', () => {
      const ingress = template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(2); // HTTP and HTTPS from ALB
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });

    test('should have InstanceRole', () => {
      expect(template.Resources.InstanceRole).toBeDefined();
      expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');
      const policies = template.Resources.InstanceRole.Properties.Policies;
      expect(policies.length).toBe(2); // S3Access and SecretsAccess
    });

    test('should have InstanceProfile', () => {
      expect(template.Resources.InstanceProfile).toBeDefined();
      expect(template.Resources.InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      const data = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(data.UserData).toBeDefined();
    });

    test('LaunchTemplate should use SSM parameter for AMI', () => {
      const imageId = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.ImageId;
      expect(imageId).toContain('resolve:ssm');
      expect(imageId).toContain('amazon-linux');
    });

    test('should have AutoScalingGroup', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should use environment-specific sizing', () => {
      const props = template.Resources.AutoScalingGroup.Properties;
      expect(props.MinSize).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'MinSize']
      });
      expect(props.MaxSize).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'MaxSize']
      });
    });

    test('ASG should use private subnets', () => {
      const subnets = template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(subnets.length).toBe(3);
    });

    test('should have ScaleUpPolicy', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleUpPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('all resource names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'DBPassword',
        'DBSubnetGroup',
        'DBSecurityGroup',
        'RDSInstance',
        'StaticContentBucket',
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'InstanceRole',
        'InstanceProfile',
        'LaunchTemplate',
        'AutoScalingGroup',
        'RDSCPUAlarm'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const props = resource.Properties;

        // Find the name property (varies by resource type)
        const nameProperty = props.Name || props.DBInstanceIdentifier || props.DBSubnetGroupName ||
          props.GroupName || props.BucketName || props.RoleName || props.InstanceProfileName ||
          props.LaunchTemplateName || props.AutoScalingGroupName || props.AlarmName;

        if (nameProperty) {
          const hasEnvSuffix = JSON.stringify(nameProperty).includes('EnvironmentSuffix');
          expect(hasEnvSuffix).toBe(true);
        }
      });
    });
  });

  describe('Tagging', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['Environment', 'Project', 'ManagedBy'];
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      expect(taggableResources.length).toBeGreaterThan(0);

      taggableResources.forEach(resourceName => {
        const tags = template.Resources[resourceName].Properties.Tags;
        requiredTags.forEach(tagKey => {
          const hasTag = tags.some((tag: any) => tag.Key === tagKey);
          expect(hasTag).toBe(true);
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSPort).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerArn).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.DBSecretArn).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('output exports should include environment suffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = JSON.stringify(output.Export.Name);
        expect(exportName).toContain('EnvironmentSuffix');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('RDS should not have DeletionProtection enabled', () => {
      expect(template.Resources.RDSInstance.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should not be publicly accessible', () => {
      expect(template.Resources.RDSInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('S3 bucket should block all public access', () => {
      const config = template.Resources.StaticContentBucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('database password should come from Secrets Manager', () => {
      const password = template.Resources.RDSInstance.Properties.MasterUserPassword;
      const passwordStr = JSON.stringify(password);
      expect(passwordStr).toContain('secretsmanager');
      expect(passwordStr).toContain('DBPassword');
    });
  });

  describe('Template Coverage', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16);
    });

    test('should have expected number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(10);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });
});
