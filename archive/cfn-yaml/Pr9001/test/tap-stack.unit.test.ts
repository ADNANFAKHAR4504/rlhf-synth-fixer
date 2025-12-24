import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = fs.readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf8').trim();

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should use correct AWS region from file', () => {
      expect(awsRegion).toBeDefined();
      expect(typeof awsRegion).toBe('string');
      expect(awsRegion).toBe('us-west-2');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'InstanceType',
        'KeyPairName',
        'DBInstanceClass',
        'DBUsername',
        'VpcCIDR',
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR',
        'PrivateSubnet2CIDR',
        'EnvironmentSuffix',
        'AlertEmail'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
    });

    test('KeyPairName parameter should have correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('leave empty to create a new one');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(param.Description).toContain('Environment suffix');
    });

    test('DBPassword parameter should be removed in favor of Secrets Manager', () => {
      expect(template.Parameters.DBPassword).toBeUndefined();
    });
  });

  describe('Conditions', () => {
    test('should have CreateKeyPair condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.CreateKeyPair).toBeDefined();
    });
  });

  describe('Key Pair Resources', () => {
    test('should have key pair resource', () => {
      expect(template.Resources.KeyPair).toBeDefined();
      expect(template.Resources.KeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('key pair should have condition', () => {
      const keyPair = template.Resources.KeyPair;
      expect(keyPair.Condition).toBe('CreateKeyPair');
    });

    test('key pair should have proper properties', () => {
      const keyPair = template.Resources.KeyPair;
      expect(keyPair.Properties.KeyName).toBeDefined();
      expect(keyPair.Properties.Tags).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have web server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('EC2 and Auto Scaling Resources', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have auto scaling group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('auto scaling group should have correct scaling configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have application load balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('SSM Parameter Resources (LocalStack-compatible)', () => {
    test('should have database password parameter', () => {
      expect(template.Resources.DatabasePasswordParameter).toBeDefined();
      expect(template.Resources.DatabasePasswordParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('database password parameter should have correct properties', () => {
      const param = template.Resources.DatabasePasswordParameter;
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Value).toBeDefined();
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/${AWS::StackName}/database/password'
      });
    });
  });

  describe('RDS Database Resources', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have database instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('database should have Multi-AZ disabled (LocalStack limitation)', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.MultiAZ).toBe(false);
    });

    test('database should have proper deletion policies (testing environment)', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });

    test('database should be encrypted', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('database should not be publicly accessible', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('database should have correct engine and version', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.42');
    });

    test('database should use SSM Parameter Store for password (LocalStack-compatible)', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:ssm:/${AWS::StackName}/database/password}}'
      });
      expect(db.DependsOn).toBe('DatabasePasswordParameter');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('IAM role should have proper S3 ARN format in policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ReadOnlyAccess');
      expect(s3Policy).toBeDefined();
      
      const resources = s3Policy.PolicyDocument.Statement[0].Resource;
      expect(resources).toContainEqual({
        'Fn::Sub': 'arn:aws:s3:::${ApplicationS3Bucket}/*'
      });
      expect(resources).toContainEqual({
        'Fn::GetAtt': ['ApplicationS3Bucket', 'Arn']
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have application S3 bucket', () => {
      expect(template.Resources.ApplicationS3Bucket).toBeDefined();
      expect(template.Resources.ApplicationS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should be encrypted', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket name should use lowercase pattern', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      const bucketName = bucket.Properties.BucketName;
      expect(bucketName).toBeDefined();
      // The bucket name should use EnvironmentSuffix which is constrained to lowercase
      expect(bucketName).toEqual({
        'Fn::Sub': 'tapstack-${EnvironmentSuffix}-app-data-${AWS::AccountId}'
      });
    });
  });

  describe('Monitoring and Alerting Resources', () => {
    test('should have SNS topic', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SNS subscription', () => {
      expect(template.Resources.AlertSubscription).toBeDefined();
      expect(template.Resources.AlertSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseFreeStorageAlarm).toBeDefined();
    });
  });

  describe('Auto Scaling Policies', () => {
    test('should have scale up policy', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('should have scale down policy', () => {
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'DatabaseEndpoint',
        'AutoScalingGroupName',
        'S3BucketName',
        'SNSTopicArn',
        'KeyPairName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address']
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
    });

    test('should require IAM capabilities due to IAM resources', () => {
      // Check for IAM resources that require CAPABILITY_IAM
      const iamResources = [
        'EC2InstanceRole',
        'EC2InstanceProfile'
      ];
      
      iamResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toMatch(/^AWS::IAM::/);
      });
    });

    test('IAM resources should not have custom names (CAPABILITY_IAM compatible)', () => {
      // IAM resources should not have RoleName or InstanceProfileName for CAPABILITY_IAM
      const ec2Role = template.Resources.EC2InstanceRole;
      const ec2Profile = template.Resources.EC2InstanceProfile;
      
      expect(ec2Role.Properties.RoleName).toBeUndefined();
      expect(ec2Profile.Properties.InstanceProfileName).toBeUndefined();
    });

    test('should have multiple resources for complete infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Should have many resources for complete infrastructure
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(5); // Should have multiple parameters
    });

    test('should have multiple outputs for critical components', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(5); // Should have multiple outputs
    });
  });

  describe('Security Validation', () => {
    test('database should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('EC2 instances should have IAM role', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const iamProfile = launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile;
      expect(iamProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('EBS volumes should be encrypted', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const blockDeviceMappings = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings;
      const ebsConfig = blockDeviceMappings[0].Ebs;
      expect(ebsConfig.Encrypted).toBe(true);
    });
  });
});
