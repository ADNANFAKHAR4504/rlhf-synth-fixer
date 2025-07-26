import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('IAM Group Creation', () => {
    test('creates DevOps IAM group with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: `DevOps-${environmentSuffix}`,
      });
    });

    test('attaches AmazonS3ReadOnlyAccess managed policy to DevOps group', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonS3ReadOnlyAccess',
              ],
            ],
          }),
        ]),
      });
    });
  });

  describe('Custom EC2 Policy Creation', () => {
    test('creates CustomEC2Policy with correct name and description', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `CustomEC2Policy-${environmentSuffix}`,
        Description: 'Policy to allow starting and stopping EC2 instances',
      });
    });

    test('CustomEC2Policy has correct permissions for EC2 operations', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:StartInstances',
                'ec2:StopInstances',
                'ec2:DescribeInstances',
                'ec2:DescribeInstanceStatus',
              ],
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('CustomEC2Policy is attached to DevOps group', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        ManagedPolicyArns: Match.arrayWith([
          { Ref: Match.anyValue() },
        ]),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports DevOps group ARN', () => {
      template.hasOutput('DevOpsGroupArn', {
        Description: 'ARN of the DevOps IAM group',
        Export: {
          Name: `DevOpsGroupArn-${environmentSuffix}`,
        },
      });
    });

    test('exports CustomEC2Policy ARN', () => {
      template.hasOutput('CustomEC2PolicyArn', {
        Description: 'ARN of the custom EC2 policy',
        Export: {
          Name: `CustomEC2PolicyArn-${environmentSuffix}`,
        },
      });
    });

    test('exports DevOps group name', () => {
      template.hasOutput('DevOpsGroupName', {
        Description: 'Name of the DevOps IAM group',
        Export: {
          Name: `DevOpsGroupName-${environmentSuffix}`,
        },
      });
    });

    test('exports CustomEC2Policy name', () => {
      template.hasOutput('CustomEC2PolicyName', {
        Description: 'Name of the custom EC2 policy',
        Export: {
          Name: `CustomEC2PolicyName-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('verifies stack creates expected IAM resources with correct count', () => {
      template.resourceCountIs('AWS::IAM::Group', 1);
      template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
    });

    test('verifies idempotency by creating stack multiple times', () => {
      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TestTapStack2', { environmentSuffix });
      const template2 = Template.fromStack(stack2);

      template2.resourceCountIs('AWS::IAM::Group', 1);
      template2.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
    });
  });

  describe('Stack Properties', () => {
    test('stack has correct public properties', () => {
      expect(stack.devOpsGroupArn).toBeDefined();
      expect(stack.customEC2PolicyArn).toBeDefined();
    });

    test('handles environment suffix correctly', () => {
      const customSuffix = 'test123';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customSuffix,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::IAM::Group', {
        GroupName: `DevOps-${customSuffix}`,
      });

      customTemplate.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `CustomEC2Policy-${customSuffix}`,
      });
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::IAM::Group', {
        GroupName: 'DevOps-dev',
      });

      defaultTemplate.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: 'CustomEC2Policy-dev',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('CustomEC2Policy uses principle of least privilege', () => {
      const policyDocument = template.findResources('AWS::IAM::ManagedPolicy');
      const policy = Object.values(policyDocument)[0] as any;
      const statements = policy.Properties.PolicyDocument.Statement;

      expect(statements).toHaveLength(1);
      const statement = statements[0];
      expect(statement.Action).toEqual([
        'ec2:StartInstances',
        'ec2:StopInstances',
        'ec2:DescribeInstances',
        'ec2:DescribeInstanceStatus',
      ]);
    });

    test('no hardcoded sensitive information in resources', () => {
      const stackJson = JSON.stringify(template.toJSON());
      expect(stackJson).not.toMatch(/password|secret|key|credential/i);
    });
  });
});
