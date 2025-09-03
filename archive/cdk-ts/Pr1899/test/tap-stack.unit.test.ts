import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';
  const accountId = '123456789012';
  const region = 'us-east-1';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix,
      },
    });
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: accountId,
        region,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('CloudWatch Log Group', () => {
    test('creates audit log group with correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/corp/iam/audit/${environmentSuffix}/${region}`,
      });
    });

    test('sets retention to one week', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('has deletion policy set to Delete', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Application Service Role', () => {
    test('creates role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-app-service-role-${environmentSuffix}-${region}`,
      });
    });

    test('assumes EC2 service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-app-service-role-${environmentSuffix}-${region}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('has max session duration of 1 hour', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-app-service-role-${environmentSuffix}-${region}`,
        MaxSessionDuration: 3600,
      });
    });

    test('has correct description', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-app-service-role-${environmentSuffix}-${region}`,
        Description: Match.stringLikeRegexp('Least-privilege role for EC2-based services'),
      });
    });
  });

  describe('Lambda Execution Role', () => {
    test('creates role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-lambda-exec-role-${environmentSuffix}-${region}`,
      });
    });

    test('assumes Lambda service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-lambda-exec-role-${environmentSuffix}-${region}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('has max session duration of 1 hour', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-lambda-exec-role-${environmentSuffix}-${region}`,
        MaxSessionDuration: 3600,
      });
    });

    test('has correct description', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `corp-lambda-exec-role-${environmentSuffix}-${region}`,
        Description: Match.stringLikeRegexp('Least-privilege role for Lambda'),
      });
    });
  });

  describe('IAM Policies - Application Role', () => {
    test('creates logs policy for app role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `corp-app-logs-${environmentSuffix}-${region}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'WriteToAuditLogGroup',
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
            }),
            Match.objectLike({
              Sid: 'CreateGroupIfMissing',
              Effect: 'Allow',
              Action: ['logs:CreateLogGroup', 'logs:DescribeLogStreams'],
            }),
          ]),
        },
      });
    });

    test('creates SSM read policy for app role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `corp-app-ssm-read-${environmentSuffix}-${region}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'ReadScopedParameters',
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Resource: Match.anyValue(), // CDK uses Fn::Join for dynamic values
            }),
          ]),
        },
      });
    });

    test('logs policy targets specific log group', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const logsPolicy = Object.values(policies).find(
        p => p.Properties?.PolicyName === `corp-app-logs-${environmentSuffix}-${region}`
      );
      
      const statements = logsPolicy?.Properties?.PolicyDocument?.Statement;
      const writeStatement = statements?.find((s: any) => s.Sid === 'WriteToAuditLogGroup');
      
      expect(writeStatement?.Resource).toBeDefined();
      // Resource will be Fn::Join with the log stream ARN components
      if (writeStatement?.Resource?.['Fn::Join']) {
        const joinArray = writeStatement.Resource['Fn::Join'];
        expect(JSON.stringify(joinArray)).toContain('log-stream:*');
      }
    });
  });

  describe('IAM Policies - Lambda Role', () => {
    test('creates logs policy for Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `corp-lambda-logs-${environmentSuffix}-${region}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'WriteToAuditLogGroup',
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
            }),
            Match.objectLike({
              Sid: 'CreateGroupIfMissing',
              Effect: 'Allow',
              Action: ['logs:CreateLogGroup', 'logs:DescribeLogStreams'],
            }),
          ]),
        },
      });
    });

    test('creates SSM read policy for Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `corp-lambda-ssm-read-${environmentSuffix}-${region}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'ReadScopedParameters',
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Resource: Match.anyValue(), // CDK uses Fn::Join for dynamic values
            }),
          ]),
        },
      });
    });
  });

  describe('Self-Protection Policy', () => {
    test('creates self-protection policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `corp-iam-self-protect-${environmentSuffix}-${region}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyDeleteOrDetachWithoutMFA',
              Effect: 'Deny',
              Action: [
                'iam:DeleteRole',
                'iam:DeleteRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:AttachRolePolicy',
              ],
            }),
          ]),
        },
      });
    });

    test('self-protection requires MFA', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const selfProtectPolicy = Object.values(policies).find(
        p => p.Properties?.PolicyName === `corp-iam-self-protect-${environmentSuffix}-${region}`
      );
      
      const statement = selfProtectPolicy?.Properties?.PolicyDocument?.Statement?.[0];
      expect(statement?.Condition).toEqual({
        Bool: { 'aws:MultiFactorAuthPresent': 'false' },
      });
    });

    test('self-protection applies to both roles', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const selfProtectPolicy = Object.values(policies).find(
        p => p.Properties?.PolicyName === `corp-iam-self-protect-${environmentSuffix}-${region}`
      );
      
      const statement = selfProtectPolicy?.Properties?.PolicyDocument?.Statement?.[0];
      expect(statement?.Resource).toBeDefined();
      expect(Array.isArray(statement?.Resource)).toBe(true);
      expect(statement?.Resource.length).toBe(2);
    });
  });

  describe('Stack Outputs', () => {
    test('exports audit log group name', () => {
      template.hasOutput('AuditLogGroupName', {
        Export: {
          Name: `corp-iam-audit-loggroup-${environmentSuffix}-${region}`,
        },
      });
    });

    test('exports app service role ARN', () => {
      template.hasOutput('AppServiceRoleArn', {
        Export: {
          Name: `corp-app-role-${environmentSuffix}-${region}`,
        },
      });
    });

    test('exports Lambda execution role ARN', () => {
      template.hasOutput('LambdaExecutionRoleArn', {
        Export: {
          Name: `corp-lambda-role-${environmentSuffix}-${region}`,
        },
      });
    });
  });

  describe('Stack Instantiation Variations', () => {
    test('can be instantiated with minimal props', () => {
      const newApp = new cdk.App();
      const minimalStack = new TapStack(newApp, 'MinimalStack', {
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      expect(minimalStack).toBeDefined();
      const minimalTemplate = Template.fromStack(minimalStack);
      minimalTemplate.resourceCountIs('AWS::IAM::Role', 2);
      minimalTemplate.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('uses provided environment suffix', () => {
      const newApp = new cdk.App();
      const customSuffix = 'custom-env';
      const customStack = new TapStack(newApp, 'CustomStack', {
        environmentSuffix: customSuffix,
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      const customTemplate = Template.fromStack(customStack);
      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`corp-.*-${customSuffix}-.*`),
      });
    });

    test('defaults to dev environment suffix', () => {
      const newApp = new cdk.App();
      const defaultStack = new TapStack(newApp, 'DefaultStack', {
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('corp-.*-dev-.*'),
      });
    });

    test('prioritizes props over context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      const overrideStack = new TapStack(contextApp, 'OverrideStack', {
        environmentSuffix: 'prop-env',
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      const overrideTemplate = Template.fromStack(overrideStack);
      overrideTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('corp-.*-prop-env-.*'),
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources follow corp- naming convention', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('^corp-'),
      });
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('^/corp/'),
      });
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: Match.stringLikeRegexp('^corp-'),
      });
    });

    test('all resource names include environment suffix', () => {
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach((role) => {
        expect(role.Properties?.RoleName).toContain(environmentSuffix);
      });
      
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        expect(policy.Properties?.PolicyName).toContain(environmentSuffix);
      });
    });

    test('all resource names include region', () => {
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach((role) => {
        expect(role.Properties?.RoleName).toContain(region);
      });
      
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        expect(policy.Properties?.PolicyName).toContain(region);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources have Retain deletion policy', () => {
      const allResources = template.toJSON().Resources;
      Object.values(allResources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('roles have least-privilege permissions', () => {
      // Check that policies are scoped to specific resources
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        const statements = policy.Properties?.PolicyDocument?.Statement as any[];
        statements?.forEach((statement) => {
          if (statement.Effect === 'Allow') {
            // Resources should not be wildcards for Allow statements
            if (statement.Resource) {
              const resources = Array.isArray(statement.Resource) 
                ? statement.Resource 
                : [statement.Resource];
              resources.forEach((resource: any) => {
                if (typeof resource === 'string') {
                  expect(resource).not.toBe('*');
                }
              });
            }
          }
        });
      });
    });

    test('deny statements require MFA for destructive actions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        const statements = policy.Properties?.PolicyDocument?.Statement as any[];
        statements?.forEach((statement) => {
          if (statement.Effect === 'Deny' && 
              statement.Action?.includes('iam:DeleteRole')) {
            expect(statement.Condition).toBeDefined();
            expect(statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('false');
          }
        });
      });
    });

    test('log group has short retention period', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('Policy Scope Validation', () => {
    test('SSM policies are scoped to specific parameter paths', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        if (policy.Properties?.PolicyName?.includes('ssm-read')) {
          const statements = policy.Properties?.PolicyDocument?.Statement as any[];
          const ssmStatement = statements?.find((s: any) => s.Sid === 'ReadScopedParameters');
          expect(ssmStatement?.Resource).toBeDefined();
          // Resource will be Fn::Join with the parameter path components
          if (ssmStatement?.Resource?.['Fn::Join']) {
            const joinArray = ssmStatement.Resource['Fn::Join'];
            expect(JSON.stringify(joinArray)).toContain('parameter/corp/iam/');
          }
        }
      });
    });

    test('log policies are scoped to specific log groups', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        if (policy.Properties?.PolicyName?.includes('-logs-')) {
          const statements = policy.Properties?.PolicyDocument?.Statement as any[];
          statements?.forEach((statement: any) => {
            if (statement.Sid === 'WriteToAuditLogGroup') {
              expect(statement.Resource).toBeDefined();
              // Resource will be Fn::Join with the log group components
              if (statement.Resource?.['Fn::Join']) {
                const joinArray = statement.Resource['Fn::Join'];
                expect(JSON.stringify(joinArray)).toContain('log-group:/corp/iam/audit/');
              }
            }
          });
        }
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('creates exactly 2 IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 2);
    });

    test('creates exactly 5 IAM policies', () => {
      // 2 logs policies + 2 SSM policies + 1 self-protection
      template.resourceCountIs('AWS::IAM::Policy', 5);
    });

    test('creates exactly 1 log group', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('creates exactly 3 outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(Object.keys(outputs).length).toBe(3);
    });
  });
});