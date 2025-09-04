import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DataKmsKey } from '../lib/constructs/kms-key';

describe('DataKmsKey', () => {
  it('creates a KMS key with correct alias, description, and key rotation', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new DataKmsKey(stack, 'DataKmsKey', {
      alias: 'alias/test-key',
      description: 'Test KMS Key',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'Test KMS Key',
    });
    template.resourceCountIs('AWS::KMS::Alias', 1);
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/test-key',
    });
  });

  it('throws if alias is missing', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    expect(() => {
      // @ts-expect-error
      new DataKmsKey(stack, 'DataKmsKey', { description: 'Test KMS Key' });
    }).toThrow();
  });

  it('creates KMS key with alternate description', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new DataKmsKey(stack, 'DataKmsKey', {
      alias: 'alias/alt-key',
      description: 'Alternate KMS Key',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'Alternate KMS Key',
    });
  });
});
