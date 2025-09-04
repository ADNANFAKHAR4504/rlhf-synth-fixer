import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { KmsStack } from '../lib/stacks/kms-stack';

describe('KmsStack', () => {
  it('creates a KMS key with correct alias, policies, and SSM parameter', () => {
    const app = new cdk.App();
    const stack = new KmsStack(app, 'KmsStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
      regionOverride: 'us-east-1',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.resourceCountIs('AWS::KMS::Alias', 1);
    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/eng-dev-test-data',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-dev-test/kms/key-arn/us-east-1',
    });
  });

  it('throws if regionOverride is missing in test context', () => {
    const app = new cdk.App();
    expect(() => {
      new KmsStack(app, 'KmsStack', {
        dept: 'eng',
        envName: 'dev',
        purpose: 'test',
        // regionOverride missing
      });
    }).toThrow();
  });

  it('creates KMS key with alternate alias', () => {
    const app = new cdk.App();
    const stack = new KmsStack(app, 'KmsStack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
      regionOverride: 'us-west-2',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/ops-prod-data-data',
    });
  });
});
