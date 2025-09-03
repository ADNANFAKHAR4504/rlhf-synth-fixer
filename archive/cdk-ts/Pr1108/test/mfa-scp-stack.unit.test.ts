import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MfaEnforcementScpStack } from '../lib/stacks/mfa-scp-stack';

describe('MfaEnforcementScpStack', () => {
  it('creates an SCP policy for MFA enforcement with correct content', () => {
    const app = new cdk.App();
    const stack = new MfaEnforcementScpStack(app, 'MfaScpStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
      orgTargetId: 'ou-1234',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Organizations::Policy', 1);
    template.hasResourceProperties('AWS::Organizations::Policy', {
      Type: 'SERVICE_CONTROL_POLICY',
      Name: 'eng-dev-test-mfa-scp',
    });
    // Check content for MFA enforcement
    const policies = template.findResources('AWS::Organizations::Policy');
    const policy = Object.values(policies)[0].Properties;
    const content = policy.Content;
    expect(content.Statement[0].Condition).toHaveProperty('BoolIfExists');
    expect(content.Statement[0].Effect).toBe('Deny');
  });

  it('throws if orgTargetId is missing', () => {
    const app = new cdk.App();
    expect(() => {
      // @ts-expect-error
      new MfaEnforcementScpStack(app, 'MfaScpStack', {
        dept: 'eng',
        envName: 'dev',
        purpose: 'test',
        // orgTargetId missing
      });
    }).toThrow();
  });

  it('creates SCP policy with alternate props', () => {
    const app = new cdk.App();
    const stack = new MfaEnforcementScpStack(app, 'MfaScpStack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
      orgTargetId: 'ou-5678',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Organizations::Policy', {
      Name: 'ops-prod-data-mfa-scp',
    });
  });
});
