import * as fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('LatestAmiId parameter should have correct properties', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam).toBeDefined();
      // Assuming dynamic AMI via SSM, validate its type.
      // Check for the correct AWS SSM parameter type.  This is a placeholder, adjust according to your actual template.
       expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });


    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('EC2InstanceProfile should reference the correct role', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });
  describe('Resources', () => {
    test('should have SharedVPC resource', () => {
      expect(template.Resources.SharedVPC).toBeDefined();
      expect(template.Resources.SharedVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('SharedVPC should have correct tags', () => {
      const sharedVpc = template.Resources.SharedVPC;
      const tags = sharedVpc.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${EnvironmentSuffix}-shared-vpc' },
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'AWS::StackName' },
      });
    });

    test('should have PublicSubnet resource', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet should have correct tags', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      const tags = publicSubnet.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${EnvironmentSuffix}-public-subnet' },
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'AWS::StackName' },
      });
    });

    test('should have AppS3Bucket resource', () => {
      expect(template.Resources.AppS3Bucket).toBeDefined();
      expect(template.Resources.AppS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AppS3Bucket should have correct bucket name and tags', () => {
      const appS3Bucket = template.Resources.AppS3Bucket;
      expect(appS3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-app-s3-bucket-${AWS::AccountId}',
      });
      expect(appS3Bucket.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'AWS::StackName' },
      });
    });

    test('should have AppSecurityGroup resource', () => {
      expect(template.Resources.AppSecurityGroup).toBeDefined();
      expect(template.Resources.AppSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('AppSecurityGroup should have correct properties', () => {
      const appSecurityGroup = template.Resources.AppSecurityGroup;
      expect(appSecurityGroup.Properties.GroupDescription).toBe(
        'Allow HTTP and HTTPS traffic'
      );
      expect(appSecurityGroup.Properties.SecurityGroupIngress).toEqual([
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0',
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
        },
      ]);
      expect(appSecurityGroup.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'AWS::StackName' },
      });
    });

    test('should have EC2InstanceRole resource', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have correct properties', () => {
      const ec2InstanceRole = template.Resources.EC2InstanceRole;
      expect(
        ec2InstanceRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal
          .Service
      ).toContain('ec2.amazonaws.com');
      expect(ec2InstanceRole.Properties.Policies).toContainEqual({
        PolicyName: 'S3ReadAccessPolicy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:ListBucket'],
              Resource: [
                { 'Fn::GetAtt': ['AppS3Bucket', 'Arn'] },
                { 'Fn::Sub': '${AppS3Bucket.Arn}/*' },
              ],
            },
          ],
        },
      });
      expect(ec2InstanceRole.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'AWS::StackName' },
      });
    });

    test('should have EC2InstanceProfile resource', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('should have ProductionOnlyInstance resource', () => {
      expect(template.Resources.ProductionOnlyInstance).toBeDefined();
      expect(template.Resources.ProductionOnlyInstance.Type).toBe(
        'AWS::EC2::Instance'
      );
    });

    test('ProductionOnlyInstance should have correct properties when condition is met', () => {
      const productionOnlyInstance = template.Resources.ProductionOnlyInstance;
      expect(productionOnlyInstance.Properties.InstanceType).toEqual({
        Ref: 'InstanceType',
      });
      expect(productionOnlyInstance.Properties.ImageId).toEqual({
        Ref: 'LatestAmiId',
      });
      expect(productionOnlyInstance.Properties.SecurityGroupIds).toEqual([
        { Ref: 'AppSecurityGroup' },
      ]);
      expect(productionOnlyInstance.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet',
      });
      expect(productionOnlyInstance.Properties.IamInstanceProfile).toEqual({
        Ref: 'EC2InstanceProfile',
      });
      expect(productionOnlyInstance.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'AWS::StackName' },
      });
    });
  });
  describe('Outputs', () => {
    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.StackName.Description).toBe(
        'Name of this CloudFormation stack'
      );
      expect(template.Outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(template.Outputs.StackName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({
        Ref: 'EnvironmentSuffix',
      });
      expect(template.Outputs.EnvironmentSuffix.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });
});
