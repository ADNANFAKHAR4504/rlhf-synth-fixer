import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MfaManagedPolicy } from '../lib/constructs/iam-mfa-policy';

describe('MfaManagedPolicy', () => {
  it('creates a managed policy that denies actions if MFA is not present', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new MfaManagedPolicy(stack, 'MfaManagedPolicy');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
    const policies = template.findResources('AWS::IAM::ManagedPolicy');
    const policy = Object.values(policies)[0].Properties;
    expect(policy.Description).toBe(
      'Deny if MFA not present (fallback when no SCP)'
    );
    expect(policy.PolicyDocument.Version).toBe('2012-10-17');
    expect(Array.isArray(policy.PolicyDocument.Statement)).toBe(true);
    expect(policy.PolicyDocument.Statement.length).toBeGreaterThanOrEqual(1);
    expect(policy.PolicyDocument.Statement[0].Effect).toBe('Deny');
    expect(policy.PolicyDocument.Statement[0].Condition).toHaveProperty(
      'BoolIfExists'
    );
  });

  it('creates managed policy with alternate content', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const policy = new MfaManagedPolicy(stack, 'MfaManagedPolicy');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      Description: 'Deny if MFA not present (fallback when no SCP)',
    });
    // Check that the policy document contains Deny effect
    const policies = template.findResources('AWS::IAM::ManagedPolicy');
    const policyDoc = Object.values(policies)[0].Properties.PolicyDocument;
    expect(policyDoc.Statement[0].Effect).toBe('Deny');
  });
});
