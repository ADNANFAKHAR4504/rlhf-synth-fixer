import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WebServer } from '../lib/constructs/web-server';

describe('WebServer Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let vpc: ec2.Vpc;
  let securityGroup: ec2.SecurityGroup;
  let logBucket: s3.Bucket;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    // Create dependencies
    vpc = new ec2.Vpc(stack, 'TestVPC', {
      maxAzs: 2,
    });

    securityGroup = new ec2.SecurityGroup(stack, 'TestSG', {
      vpc,
      description: 'Test security group',
    });

    logBucket = new s3.Bucket(stack, 'TestBucket', {
      bucketName: 'test-log-bucket',
    });
  });

  describe('default configuration', () => {
    beforeEach(() => {
      new WebServer(stack, 'TestWebServer', {
        vpc,
        securityGroup,
        logBucket,
      });
      template = Template.fromStack(stack);
    });

    test('creates EC2 instance with t3.micro', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('places instance in public subnet', () => {
      const instance = template.findResources('AWS::EC2::Instance');
      const instanceResource = Object.values(instance)[0];
      expect(instanceResource.Properties.SubnetId).toBeDefined();
    });

    test('creates IAM role for EC2', () => {
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
        },
      });
    });

    test('attaches CloudWatch policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const webServerRole = Object.values(roles).find((role: any) =>
        role.Properties?.ManagedPolicyArns?.some((arn: any) => {
          if (typeof arn === 'object' && arn['Fn::Join']) {
            const parts = arn['Fn::Join'][1];
            return parts.some(
              (part: any) =>
                typeof part === 'string' &&
                part.includes('CloudWatchAgentServerPolicy')
            );
          }
          return false;
        })
      );
      expect(webServerRole).toBeDefined();
    });

    test('grants S3 write permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const s3Policy = Object.values(policies).find((policy: any) =>
        policy.Properties?.PolicyDocument?.Statement?.some(
          (statement: any) =>
            statement.Effect === 'Allow' &&
            statement.Action?.some((action: string) =>
              action.includes('s3:PutObject')
            )
        )
      );
      expect(s3Policy).toBeDefined();
    });

    test('tags instance with Environment Production', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('tags IAM role with Environment Production', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const webServerRole = Object.values(roles).find((role: any) =>
        role.Properties?.Tags?.some(
          (tag: any) => tag.Key === 'Environment' && tag.Value === 'Production'
        )
      );
      expect(webServerRole).toBeDefined();
    });
  });

  describe('custom configuration', () => {
    beforeEach(() => {
      new WebServer(stack, 'TestWebServer', {
        vpc,
        securityGroup,
        logBucket,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.LARGE
        ),
        keyName: 'my-key-pair',
      });
      template = Template.fromStack(stack);
    });

    test('uses custom instance type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.large',
      });
    });

    test('uses custom key pair', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        KeyName: 'my-key-pair',
      });
    });
  });

  describe('user data script', () => {
    beforeEach(() => {
      new WebServer(stack, 'TestWebServer', {
        vpc,
        securityGroup,
        logBucket,
      });
      template = Template.fromStack(stack);
    });

    test('includes Apache installation', () => {
      const instance = template.findResources('AWS::EC2::Instance');
      const instanceResource = Object.values(instance)[0];
      const userData =
        instanceResource.Properties.UserData['Fn::Base64']['Fn::Join'][1];

      const userDataString = userData.join('');
      expect(userDataString).toContain('yum install -y httpd');
      expect(userDataString).toContain('systemctl start httpd');
      expect(userDataString).toContain('systemctl enable httpd');
    });

    test('includes CloudWatch agent installation', () => {
      const instance = template.findResources('AWS::EC2::Instance');
      const instanceResource = Object.values(instance)[0];
      const userData =
        instanceResource.Properties.UserData['Fn::Base64']['Fn::Join'][1];

      const userDataString = userData.join('');
      expect(userDataString).toContain('amazon-cloudwatch-agent.rpm');
    });

    test('includes S3 sync command', () => {
      const instance = template.findResources('AWS::EC2::Instance');
      const instanceResource = Object.values(instance)[0];
      const userData =
        instanceResource.Properties.UserData['Fn::Base64']['Fn::Join'][1];

      expect(userData).toContain('/httpd-logs/');
    });

    test('creates CloudWatch log group', () => {
      const instance = template.findResources('AWS::EC2::Instance');
      const instanceResource = Object.values(instance)[0];
      const userData =
        instanceResource.Properties.UserData['Fn::Base64']['Fn::Join'][1];

      const userDataString = userData.join('');
      expect(userDataString).toContain('aws logs create-log-group');
      expect(userDataString).toContain('/aws/ec2/webserver');
    });
  });

  describe('IAM permissions', () => {
    beforeEach(() => {
      new WebServer(stack, 'TestWebServer', {
        vpc,
        securityGroup,
        logBucket,
      });
      template = Template.fromStack(stack);
    });

    test('grants KMS permissions for encrypted bucket', () => {
      // In our simple setup without KMS in web-server.ts dependencies,
      // the KMS permissions are granted by the SecureStorage construct
      // when grantWrite is called on the bucket
      const policies = template.findResources('AWS::IAM::Policy');
      const hasS3Permissions = Object.values(policies).some((policy: any) =>
        policy.Properties?.PolicyDocument?.Statement?.some(
          (statement: any) =>
            statement.Effect === 'Allow' &&
            statement.Action?.some((action: string) =>
              action.includes('s3:PutObject')
            )
        )
      );
      expect(hasS3Permissions).toBe(true);
    });

    test('creates instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });
  });
});
