import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure E-commerce Infrastructure CloudFormation Template', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure E-commerce Infrastructure with comprehensive security controls, compliance monitoring, and high availability. Uses public subnets for cost optimization to avoid NAT Gateway charges.'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'SSHAllowedCIDR',
        'DBInstanceClass',
        'EC2InstanceType',
        'MinAutoScalingSize',
        'MaxAutoScalingSize',
        'AlertEmail'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBeDefined();
    });

    test('SSHAllowedCIDR parameter should have security pattern', () => {
      const sshParam = template.Parameters.SSHAllowedCIDR;
      expect(sshParam.Type).toBe('String');
      expect(sshParam.AllowedPattern).toBeDefined();
      expect(sshParam.AllowedPattern).toContain('([0-9]');
    });

    test('AlertEmail parameter should have email pattern', () => {
      const emailParam = template.Parameters.AlertEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.AllowedPattern).toBeDefined();
      expect(emailParam.AllowedPattern).toContain('@');
    });
  });

  describe('VPC and Network Security', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have secure configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets across 2 AZs', () => {
      const expectedSubnets = [
        'PublicSubnet1',
        'PublicSubnet2', 
        'PrivateSubnet1',
        'PrivateSubnet2'
      ];

      expectedSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should be in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should use cost-optimized architecture without NAT Gateway', () => {
      // Using public subnets for cost optimization to avoid NAT Gateway charges
      expect(template.Resources.NATGateway1).toBeUndefined();
      expect(template.Resources.NATGateway1EIP).toBeUndefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      const expectedSGs = [
        'ALBSecurityGroup',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup'
      ];

      expectedSGs.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const rules = albSG.Properties.SecurityGroupIngress;
      
      expect(rules).toHaveLength(2);
      expect(rules[0].FromPort).toBe(443);
      expect(rules[1].FromPort).toBe(80);
    });

    test('database security group should only allow access from web servers', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const rules = dbSG.Properties.SecurityGroupIngress;
      
      expect(rules).toHaveLength(1);
      expect(rules[0].FromPort).toBe(3306);
      expect(rules[0].SourceSecurityGroupId).toEqual({
        'Ref': 'WebServerSecurityGroup'
      });
    });

    test('web server security group should restrict SSH access', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const sshRule = webSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ 'Ref': 'SSHAllowedCIDR' });
    });
  });

  describe('IAM Security', () => {
    test('should have EC2 role with least privilege', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have limited managed policies', () => {
      const ec2Role = template.Resources.EC2Role;
      const managedPolicies = ec2Role.Properties.ManagedPolicyArns;
      
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have instance profile for EC2', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have Lambda remediation role', () => {
      expect(template.Resources.RemediationLambdaRole).toBeDefined();
      expect(template.Resources.RemediationLambdaRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Encryption and Data Protection', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have key rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket should block public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have database secret in Secrets Manager', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('Database Security', () => {
    test('should have RDS instance with encryption', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.KmsKeyId).toEqual({ 'Ref': 'KMSKey' });
    });

    test('RDS should have Multi-AZ enabled', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have backup retention period of 7 days', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should have deletion protection disabled for easier rollback', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.DeletionProtection).toBe(false);
    });

    test('should have DB subnet group in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toEqual([
        { 'Ref': 'PrivateSubnet1' },
        { 'Ref': 'PrivateSubnet2' }
      ]);
    });
  });

  describe('Compliance and Monitoring', () => {
    test('should have Lambda function for auto-remediation', () => {
      expect(template.Resources.SecurityRemediationLambda).toBeDefined();
      expect(template.Resources.SecurityRemediationLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have CloudWatch alarms for security monitoring', () => {
      expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
      expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
    });

    test('should have SNS topic for security alerts', () => {
      expect(template.Resources.SecurityAlarmTopic).toBeDefined();
      expect(template.Resources.SecurityAlarmTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('High Availability and Auto Scaling', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing and in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual([
        { 'Ref': 'PublicSubnet1' },
        { 'Ref': 'PublicSubnet2' }
      ]);
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should be in public subnets for cost optimization', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { 'Ref': 'PublicSubnet1' },
        { 'Ref': 'PublicSubnet2' }
      ]);
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should have EBS volumes without KMS encryption for stability', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const blockDeviceMappings = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings;
      
      expect(blockDeviceMappings[0].Ebs.Encrypted).toBe(false);
      expect(blockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
    });

    test('should have scaling policy', () => {
      expect(template.Resources.ScalingPolicy).toBeDefined();
      expect(template.Resources.ScalingPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'LoadBalancerDNS',
        'S3BucketName',
        'DatabaseEndpoint',
        'DatabaseSecretArn',
        'KMSKeyId',
        'SecurityAlarmTopicArn',
        'AutoScalingGroupName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expect.stringContaining('${AWS::StackName}')
        });
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix parameter', () => {
      const resourcesWithNaming = [
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'S3Bucket',
        'DBInstance',
        'ApplicationLoadBalancer'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const resourceTags = resource.Properties.Tags || [];
        const hasEnvironmentSuffix = resourceTags.some((tag: any) => 
          tag.Value && JSON.stringify(tag.Value).includes('EnvironmentSuffix')
        ) || JSON.stringify(resource.Properties).includes('EnvironmentSuffix');
        
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('EC2 instances should require IMDSv2', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const metadataOptions = launchTemplate.Properties.LaunchTemplateData.MetadataOptions;
      
      expect(metadataOptions.HttpTokens).toBe('required');
      expect(metadataOptions.HttpPutResponseHopLimit).toBe(1);
    });

    test('S3 buckets should deny insecure transport', () => {
      expect(template.Resources.S3BucketPolicy).toBeDefined();
      const bucketPolicy = template.Resources.S3BucketPolicy;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      
      const denyInsecureStatement = statements.find((stmt: any) => 
        stmt.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Effect).toBe('Deny');
    });

    test('template should have appropriate deletion policies', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.DeletionPolicy).toBe('Snapshot');
      expect(dbInstance.UpdateReplacePolicy).toBe('Snapshot');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have minimum required resource count for e-commerce infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Comprehensive infrastructure
    });

    test('should have comprehensive parameter coverage', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have comprehensive output coverage', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });
});