import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template
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
        'Secure Web Application Infrastructure - Security Configuration as Code'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'DatabaseName',
        'DatabaseUsername',
        'InstanceType',
        'LatestAmiId',
        'AllowedSSHCidr'
      ];
      
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.AppKMSKey).toBeDefined();
      expect(template.Resources.AppKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have WAF Web ACL', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('WAF should have security rules', () => {
      const wafRules = template.Resources.WebACL.Properties.Rules;
      expect(wafRules).toHaveLength(3);
      expect(wafRules[0].Name).toBe('AWSManagedRulesCommonRuleSet');
      expect(wafRules[1].Name).toBe('AWSManagedRulesKnownBadInputsRuleSet');
      expect(wafRules[2].Name).toBe('AWSManagedRulesSQLiRuleSet');
    });

    test('should have security groups', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
    });
  });

  describe('Network Resources', () => {
    test('should have VPC with DNS enabled', () => {
      expect(template.Resources.AppVPC).toBeDefined();
      expect(template.Resources.AppVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.AppVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.AppVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets in two AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have NAT gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('should have RDS database instance', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
    });

    test('database should have encryption and backups enabled', () => {
      const dbProps = template.Resources.Database.Properties;
      expect(dbProps.StorageEncrypted).toBe(true);
      expect(dbProps.BackupRetentionPeriod).toBe(7);
      expect(dbProps.KmsKeyId).toBeDefined();
    });

    test('should use Secrets Manager for database credentials', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.SecretRDSInstanceAttachment).toBeDefined();
    });
  });

  describe('Storage Resources', () => {
    test('should have encrypted S3 buckets', () => {
      expect(template.Resources.AppS3Bucket).toBeDefined();
      expect(template.Resources.LoggingBucket).toBeDefined();
    });

    test('S3 buckets should have encryption enabled', () => {
      const appBucket = template.Resources.AppS3Bucket.Properties;
      expect(appBucket.BucketEncryption).toBeDefined();
      expect(appBucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 buckets should have public access blocked', () => {
      const appBucket = template.Resources.AppS3Bucket.Properties;
      expect(appBucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(appBucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(appBucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(appBucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Compute Resources', () => {
    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
    });

    test('should have CloudWatch alarms for scaling', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmLow).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have target group and listener', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.Listener).toBeDefined();
    });

    test('WAF should be associated with ALB', () => {
      expect(template.Resources.WebACLAssociation).toBeDefined();
      expect(template.Resources.WebACLAssociation.Properties.ResourceArn.Ref)
        .toBe('ApplicationLoadBalancer');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.EC2LogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.WAFLogGroup).toBeDefined();
    });

    test('log groups should be encrypted', () => {
      const ec2LogGroup = template.Resources.EC2LogGroup.Properties;
      expect(ec2LogGroup.KmsKeyId).toBeDefined();
    });

    test('should have SNS topic for alerts', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudTrail for audit logging', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(template.Resources.CloudTrail.Properties.S3BucketName.Ref).toBe('LoggingBucket');
      expect(template.Resources.CloudTrail.Properties.KMSKeyId.Ref).toBe('AppKMSKey');
    });


  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'LoadBalancerDNS',
        'DatabaseEndpoint',
        'S3BucketName',
        'KMSKeyId',
        'WebACLArn',
        'CloudTrailArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('database should not be publicly accessible', () => {
      const dbProps = template.Resources.Database.Properties;
      expect(dbProps.PubliclyAccessible).toBe(false);
    });

    test('database should have deletion protection disabled for testing', () => {
      const dbProps = template.Resources.Database.Properties;
      expect(dbProps.DeletionProtection).toBe(false);
    });

    test('security groups should follow least privilege', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      expect(dbSG.SecurityGroupIngress).toHaveLength(1);
      expect(dbSG.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(dbSG.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });

    test('bastion security group should restrict SSH access', () => {
      const bastionSG = template.Resources.BastionSecurityGroup.Properties;
      expect(bastionSG.SecurityGroupIngress).toHaveLength(1);
      const sshRule = bastionSG.SecurityGroupIngress[0];
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp.Ref).toBe('AllowedSSHCidr');
      expect(sshRule.Description).toBe('SSH from authorized IP ranges only');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have at least 42 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(42);
    });
  });
});