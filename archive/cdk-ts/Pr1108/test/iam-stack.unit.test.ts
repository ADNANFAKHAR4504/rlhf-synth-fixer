import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { IamStack } from '../lib/stacks/iam-stack';

describe('IamStack', () => {
  it('creates dev and prod roles and attaches MFA managed policy', () => {
    const app = new cdk.App();
    const stack = new IamStack(app, 'IamStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::IAM::Role', 2);
    template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'eng-dev-test-app-role',
    });
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      Description: 'Deny if MFA not present (fallback when no SCP)',
    });
  });

  it('throws if required props are missing', () => {
    const app = new cdk.App();
    expect(() => {
      // @ts-expect-error
      new IamStack(app, 'IamStack', {});
    }).toThrow();
  });

  it('creates roles with alternate names', () => {
    const app = new cdk.App();
    const stack = new IamStack(app, 'IamStack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ops-prod-data-app-role',
    });
  });
});
