import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DataKmsKey, DataKmsKeyProps } from '../lib/constructs/kms-key';

describe('DataKmsKey Integration', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('synthesizes KMS key with default and custom properties', () => {
    // Default
    new DataKmsKey(stack, 'IntegrationDefault');
    // Custom
    const customProps: DataKmsKeyProps = {
      alias: 'alias/integration-key',
      description: 'Integration custom key',
      removalPolicy: RemovalPolicy.DESTROY,
    };
    new DataKmsKey(stack, 'IntegrationCustom', customProps);

    const template = Template.fromStack(stack);

    // Default KMS Key
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'CMK for encrypting S3 objects and data keys',
      EnableKeyRotation: true,
    });

    // Custom KMS Key
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'Integration custom key',
      EnableKeyRotation: true,
    });

    // Alias for custom key
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/integration-key',
    });
  });
});
