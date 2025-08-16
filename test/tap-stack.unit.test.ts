import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template should be converted from YAML to JSON using cfn-flip
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
      expect(template.Description).toContain('Production-ready single-region environment');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentName', 'VpcCidr', 'AZCount', 'PublicSubnetCidrs', 'PrivateSubnetCidrs',
        'S3BucketName', 'DBSecretArn', 'DBInstanceClass', 'EC2InstanceType',
        'AsgMinSize', 'AsgMaxSize', 'AsgDesiredCapacity', 'AllowedCidrIngress'
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct default', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod-regional');
    });

    test('VPC CIDR parameter should have valid pattern', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Default).toBe('10.0.0.0/16');
    });

    test('AZ Count parameter should have valid range', () => {
      const param = template.Parameters.AZCount;
      expect(param.Type).toBe('Number');
      expect(param.MinValue).toBe(2);
      expect(param.MaxValue).toBe(3);
      expect(param.Default).toBe(2);
    });

    test('Instance types should be fixed as per requirements', () => {
      const dbParam = template.Parameters.DBInstanceClass;
      const ec2Param = template.Parameters.EC2InstanceType;
      expect(dbParam.AllowedValues).toEqual(['db.m5.large']);
      expect(ec2Param.AllowedValues).toEqual(['t3.medium']);
    });
  });

  describe('Resources', () => {
    test('should have all core infrastructure resources', () => {
      const expectedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'NatGw1', 'NatGw2', 'ApplicationLoadBalancer', 'AutoScalingGroup', 'RDSInstance', 'S3Bucket'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('RDS instance should have Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.DeletionPolicy).toBe('Snapshot');
    });

    test('S3 bucket should have security configurations', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(s3.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(s3.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('Auto Scaling Group should have correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('Launch Template should have security configurations', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('Security Groups should exist and be properly configured', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const webSg = template.Resources.WebTierSecurityGroup;
      const dbSg = template.Resources.DatabaseSecurityGroup;
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('IAM roles should exist with proper permissions', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const rdsRole = template.Resources.RDSMonitoringRole;
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      expect(rdsRole.Type).toBe('AWS::IAM::Role');
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId', 'PublicSubnets', 'PrivateSubnets', 'SecurityGroups',
        'AlbDnsName', 'S3BucketNameOut', 'S3BucketArnOut', 'RdsEndpoint'
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should reference VPC resource', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALB DNS name output should reference ALB', () => {
      const output = template.Outputs.AlbDnsName;
      expect(output.Description).toBe('ALB DNS name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('RDS endpoint output should reference RDS instance', () => {
      const output = template.Outputs.RdsEndpoint;
      expect(output.Description).toBe('RDS endpoint address');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });

    test('S3 bucket outputs should reference S3 resource', () => {
      const nameOutput = template.Outputs.S3BucketNameOut;
      const arnOutput = template.Outputs.S3BucketArnOut;

      expect(nameOutput.Value).toEqual({ Ref: 'S3Bucket' });

      // If your template builds the ARN with !Sub, assert the constructed string:
      expect(
        arnOutput.Value['Fn::Sub'] || arnOutput.Value
      ).toEqual('arn:aws:s3:::${S3BucketName}');
    });
  });

  describe('Conditions', () => {
    test('should have all expected conditions', () => {
      const expectedConditions = [
        'EnableReplication', 'CreateRoute53Records', 'EnableHTTPS', 'UseThreeAZs', 'IsPostgres'
      ];
      expectedConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });

    test('UseThreeAZs condition should check AZCount parameter', () => {
      const condition = template.Conditions.UseThreeAZs;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'AZCount' }, 3]
      });
    });

    test('IsPostgres condition should check DBEngine parameter', () => {
      const condition = template.Conditions.IsPostgres;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'DBEngine' }, 'postgres']
      });
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have substantial infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have comprehensive parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10);
    });

    test('should have meaningful outputs for integration', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(5);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('resources should use EnvironmentName for naming', () => {
      const vpc = template.Resources.VPC;
      const expectedTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(expectedTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentName}-vpc' });
    });

    test('resources should have consistent tagging', () => {
      const resourcesWithTags = ['VPC', 'InternetGateway', 'PublicSubnet1', 'S3Bucket'];
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('S3 bucket should use provided bucket name parameter', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.BucketName).toEqual({ Ref: 'S3BucketName' });
    });

    test('RDS instance should use environment naming', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': '${EnvironmentName}-db'
      });
    });
  });

  describe('Security Configuration', () => {
    test('RDS should use Secrets Manager for credentials', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });

    test('Launch Template should enforce IMDSv2', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpEndpoint).toBe('enabled');
    });

    test('Database security group should only allow access from web tier', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingressRule = dbSg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
    });

    test('EC2 instances should have encrypted storage', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });
  });
});
