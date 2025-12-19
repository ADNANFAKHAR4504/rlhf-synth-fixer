import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to create app with VPC context to avoid lookup
function createAppWithVpcContext(additionalContext?: any): cdk.App {
  return new cdk.App({
    context: {
      'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
        {
          vpcId: 'vpc-12345',
          vpcCidrBlock: '172.31.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          subnetGroups: [
            {
              name: 'Public',
              type: 'Public',
              subnets: [
                {
                  subnetId: 'subnet-12345',
                  cidr: '172.31.0.0/20',
                  availabilityZone: 'us-east-1a',
                  routeTableId: 'rtb-12345',
                },
                {
                  subnetId: 'subnet-67890',
                  cidr: '172.31.16.0/20',
                  availabilityZone: 'us-east-1b',
                  routeTableId: 'rtb-67890',
                },
              ],
            },
          ],
        },
      ...additionalContext,
    },
  });
}

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = createAppWithVpcContext();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    // Create template from the TapStack (ResourcesStack is now a Construct within TapStack)
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('TapStack instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('TapStack uses environmentSuffix from props', () => {
      const customApp = createAppWithVpcContext();
      const customStack = new TapStack(customApp, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(customStack).toBeDefined();
      const customTemplate = Template.fromStack(customStack);
      expect(customTemplate).toBeDefined();
    });

    test('TapStack uses environmentSuffix from context', () => {
      const customApp = createAppWithVpcContext({
        environmentSuffix: 'staging',
      });
      const customStack = new TapStack(customApp, 'TestTapStackWithContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(customStack).toBeDefined();
      const customTemplate = Template.fromStack(customStack);
      expect(customTemplate).toBeDefined();
    });

    test('TapStack uses default environmentSuffix when none provided', () => {
      const customApp = createAppWithVpcContext();
      const customStack = new TapStack(customApp, 'TestTapStackDefault', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(customStack).toBeDefined();
      const customTemplate = Template.fromStack(customStack);
      expect(customTemplate).toBeDefined();

      // Verify that 'dev' is used as the default environment suffix
      const templateJson = customTemplate.toJSON();
      const parameterKeys = Object.keys(templateJson.Parameters || {});
      const sshParamKey = parameterKeys.find(key => key.includes('devAllowedSshIp'));

      expect(sshParamKey).toBeDefined();
      expect(templateJson.Parameters[sshParamKey!]).toMatchObject({
        Type: 'String',
        Description: 'IP address range allowed for SSH access (CIDR format)',
        Default: '10.0.0.0/8',
      });
    });
  });

  describe('Parameters', () => {
    test('creates AllowedSshIp parameter with correct properties', () => {
      // After flattening ResourcesStack to Construct, parameter names include ResourcesStack prefix
      const templateJson = template.toJSON();
      const parameterKeys = Object.keys(templateJson.Parameters || {});
      const sshParamKey = parameterKeys.find(key => key.includes('AllowedSshIp'));

      expect(sshParamKey).toBeDefined();
      expect(templateJson.Parameters[sshParamKey!]).toMatchObject({
        Type: 'String',
        Description: 'IP address range allowed for SSH access (CIDR format)',
        Default: '10.0.0.0/8',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has proper deletion policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
      });
    });

    test('S3 bucket has auto delete objects enabled', () => {
      // AutoDeleteObjects is enabled, which will create a Lambda function for cleanup
      // We'll just verify the bucket has the property set
      const resources = template.findResources('AWS::S3::Bucket');
      const bucketLogicalId = Object.keys(resources)[0];
      expect(resources[bucketLogicalId].UpdateReplacePolicy).toBe('Delete');
      expect(resources[bucketLogicalId].DeletionPolicy).toBe('Delete');
    });
  });

  describe('IAM Role and Permissions', () => {
    test('creates IAM role for EC2 instance', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        Description: 'IAM role for TapStack EC2 instance',
      });
    });

    test('IAM role has S3 read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*',
              ]),
            }),
          ]),
        },
      });
    });

    test('creates instance profile for IAM role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          {
            Ref: Match.stringLikeRegexp(`${environmentSuffix}TapStackInstanceRole.*`),
          },
        ],
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('creates security group with SSH access rule', () => {
      // After flattening ResourcesStack to Construct, parameter Refs include ResourcesStack prefix
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for TapStack EC2 instance',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: Match.objectLike({
              Ref: Match.stringLikeRegexp('.*AllowedSshIp.*'),
            }),
            Description: 'SSH access from specified IP range',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          }),
        ]),
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          }),
        ]),
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance with t2.micro instance type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
      });
    });

    test('EC2 instance uses latest Amazon Linux 2 AMI', () => {
      // CDK creates an SSM parameter lookup that gets resolved at deployment time
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: Match.objectLike({
          Ref: Match.stringLikeRegexp('SsmParameterValue.*amzn2.*'),
        }),
      });
    });

    test('EC2 instance is associated with security group', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp(`${environmentSuffix}TapStackSecurityGroup.*`),
              'GroupId',
            ],
          },
        ],
      });
    });

    test('EC2 instance has IAM instance profile attached', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        IamInstanceProfile: Match.objectLike({
          Ref: Match.stringLikeRegexp(`${environmentSuffix}TapStackInstance.*InstanceProfile.*`),
        }),
      });
    });
  });

  describe('Elastic IP Configuration', () => {
    test('creates Elastic IP', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
      });
    });

    test('associates Elastic IP with EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::EIPAssociation', {
        AllocationId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp(`${environmentSuffix}TapStackEIP.*`),
            'AllocationId',
          ]),
        }),
        InstanceId: Match.objectLike({
          Ref: Match.stringLikeRegexp(`${environmentSuffix}TapStackInstance.*`),
        }),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('S3 bucket has auto-delete objects tag', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      const bucketLogicalId = Object.keys(resources)[0];

      expect(resources[bucketLogicalId].Properties?.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'aws-cdk:auto-delete-objects', Value: 'true' },
        ])
      );
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
      });
    });

    test('exports S3 bucket ARN', () => {
      template.hasOutput('S3BucketArn', {
        Description: 'S3 Bucket ARN',
      });
    });

    test('exports EC2 instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
      });
    });

    test('exports EC2 instance private IP', () => {
      template.hasOutput('EC2InstancePrivateIp', {
        Description: 'EC2 Instance Private IP',
      });
    });

    test('exports Elastic IP', () => {
      template.hasOutput('ElasticIP', {
        Description: 'Elastic IP Address',
      });
    });

    test('exports Security Group ID', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID',
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('exports Instance Role ARN', () => {
      template.hasOutput('InstanceRoleArn', {
        Description: 'EC2 Instance IAM Role ARN',
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      // AutoDeleteObjects creates additional IAM roles for the Lambda function
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::EC2::Instance', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
      template.resourceCountIs('AWS::EC2::EIPAssociation', 1);
      // AutoDeleteObjects creates additional Lambda resources
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('resource names include environment suffix', () => {
      const customApp = createAppWithVpcContext();
      const customStack = new TapStack(customApp, 'TestTapStackCustom', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customTemplate = Template.fromStack(customStack);

      // Check that resource logical IDs include the environment suffix
      const resources = customTemplate.toJSON().Resources;
      const resourceNames = Object.keys(resources);

      expect(resourceNames.some(name => name.includes('test'))).toBe(true);
    });

    test('ResourcesStack uses default when environmentSuffix is undefined', () => {
      const customApp = createAppWithVpcContext();
      // Create TapStack with undefined environmentSuffix to test default behavior
      const customStack = new TapStack(customApp, 'TestResourcesStackDefault', {
        environmentSuffix: undefined,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const customTemplate = Template.fromStack(customStack);

      // Verify that 'dev' is used as the default environment suffix
      const templateJson = customTemplate.toJSON();
      const parameterKeys = Object.keys(templateJson.Parameters || {});
      const sshParamKey = parameterKeys.find(key => key.includes('devAllowedSshIp'));

      expect(sshParamKey).toBeDefined();
      expect(templateJson.Parameters[sshParamKey!]).toMatchObject({
        Type: 'String',
        Description: 'IP address range allowed for SSH access (CIDR format)',
        Default: '10.0.0.0/8',
      });
    });
  });
});
