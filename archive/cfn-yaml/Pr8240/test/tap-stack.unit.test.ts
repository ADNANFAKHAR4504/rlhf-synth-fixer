import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE TESTS
  // ===================================================================

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a descriptive template description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Security Configuration as Code');
      expect(template.Description).toContain('Secure AWS Infrastructure');
      expect(template.Description.length).toBeGreaterThan(50);
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ===================================================================
  // PARAMETERS TESTS
  // ===================================================================

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
    });

    test('should have TrustedCidrBlock parameter with correct properties', () => {
      const param = template.Parameters.TrustedCidrBlock;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.Description).toContain('CIDR block for trusted SSH access');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toContain('valid CIDR range');
    });

    test('should have DBUsername parameter with correct properties', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.Description).toContain('Database administrator username');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have NotificationEmail parameter with correct properties', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('Email address for security alerts');
      expect(param.AllowedPattern).toBe('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
      expect(param.Default).toBe('admin@example.com');
    });
  });

  // ===================================================================
  // RESOURCES TESTS
  // ===================================================================

  describe('Resources Validation', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toHaveLength(2);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');

      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public and private subnets', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });

      // Public subnets should have MapPublicIpOnLaunch: true
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      // Private subnets should not
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have route tables and routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.DefaultPublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have security groups with proper configurations', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2Sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(ec2Sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(ec2Sg.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
      expect(ec2Sg.Properties.SecurityGroupIngress[0].CidrIp).toEqual({ Ref: 'TrustedCidrBlock' });

      const rdsSg = template.Resources.RDSSecurityGroup;
      expect(rdsSg).toBeDefined();
      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(rdsSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(rdsSg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(rdsSg.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
      expect(rdsSg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should have IAM role and instance profile for EC2', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('should have encrypted S3 buckets', () => {
      const secureBucket = template.Resources.SecureS3Bucket;
      expect(secureBucket).toBeDefined();
      expect(secureBucket.Type).toBe('AWS::S3::Bucket');
      expect(secureBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(secureBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(secureBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      const loggingBucket = template.Resources.LoggingS3Bucket;
      expect(loggingBucket).toBeDefined();
      expect(loggingBucket.Type).toBe('AWS::S3::Bucket');
      expect(loggingBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(loggingBucket.Properties.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
    });

    test('should have RDS instance with proper security', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.VPCSecurityGroups).toEqual([{ Ref: 'RDSSecurityGroup' }]);
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test('should have SNS topic for security alerts', () => {
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');

      const subscription = template.Resources.SecurityAlertsSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should have CloudWatch log group', () => {
      const logGroup = template.Resources.SecurityLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  // ===================================================================
  // OUTPUTS TESTS
  // ===================================================================

  describe('Outputs Validation', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPCID' });
    });

    test('should have SecurityGroupId output', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ID of the EC2 Security Group');
      expect(output.Value).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-EC2-SecurityGroup' });
    });

    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Name of the secure S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SecureS3Bucket' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-SecureS3Bucket' });
    });

    test('should have RDSEndpoint output', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('RDS instance endpoint');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-RDS-Endpoint' });
    });

    test('should have SNSTopicArn output', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ARN of the Security Alerts SNS Topic');
      expect(output.Value).toEqual({ Ref: 'SecurityAlertsTopic' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-SecurityAlerts-Topic' });
    });

    test('should have DBPasswordSecretArn output', () => {
      const output = template.Outputs.DBPasswordSecretArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ARN of the database password secret');
      expect(output.Value).toEqual({ Ref: 'DBPasswordSecret' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-DBPassword-Secret' });
    });

    test('should have exactly 6 outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(6);
    });
  });

  // ===================================================================
  // SECURITY TESTS
  // ===================================================================

  describe('Security Best Practices', () => {
    test('should have restrictive security groups', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      expect(ec2Sg.Properties.SecurityGroupIngress[0].CidrIp).not.toBe('0.0.0.0/0');
      expect(ec2Sg.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Security', Value: 'Restrictive' })
        ])
      );
    });

    test('should have encrypted S3 buckets', () => {
      expect(template.Resources.SecureS3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.LoggingS3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have private RDS instance', () => {
      expect(template.Resources.RDSInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have S3 bucket policies denying insecure connections', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false'
              }
            }
          })
        ])
      );
    });
  });
});
