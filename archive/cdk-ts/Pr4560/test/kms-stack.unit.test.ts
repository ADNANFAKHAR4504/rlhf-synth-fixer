import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { KmsStack } from '../lib/kms-stack';

describe('KmsStack Unit Tests', () => {
  let app: cdk.App;
  let stack: KmsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new KmsStack(app, 'TestKmsStack', {
      region: 'us-east-1',
      environmentSuffix: 'test123',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
    });

    test('KMS key is exported correctly', () => {
      expect(stack.kmsKey).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('Creates exactly one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('KMS key has automatic rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('KMS key has correct description', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting the payments DynamoDB table in us-east-1',
      });
    });

    test('KMS key has DeletionPolicy set to Delete', () => {
      const resources = template.toJSON().Resources;
      const kmsKeys = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBe(1);
      expect((kmsKeys[0] as any).DeletionPolicy).toBe('Delete');
    });
  });

  describe('KMS Key Alias', () => {
    test('Creates exactly one KMS alias', () => {
      template.resourceCountIs('AWS::KMS::Alias', 1);
    });

    test('KMS alias has correct naming pattern', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payments-table-key-us-east-1-test123',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports KMS key ARN', () => {
      template.hasOutput('KmsKeyArn', {});
    });

    test('Exports KMS key ID', () => {
      template.hasOutput('KmsKeyId', {});
    });

    test('Exports KMS key alias', () => {
      template.hasOutput('KmsKeyAlias', {
        Value: 'alias/payments-table-key-us-east-1-test123',
      });
    });

    test('Exports key rotation status', () => {
      template.hasOutput('KeyRotationEnabled', {
        Value: 'true',
      });
    });

    test('Exports KMS region', () => {
      template.hasOutput('KmsRegion', {
        Value: 'us-east-1',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Different environment suffixes create different key aliases', () => {
      const app2 = new cdk.App();
      const stack2 = new KmsStack(app2, 'TestKmsStack2', {
        region: 'us-east-1',
        environmentSuffix: 'prod456',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payments-table-key-us-east-1-test123',
      });

      template2.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payments-table-key-us-east-1-prod456',
      });
    });
  });

  describe('Region Configuration', () => {
    test('Supports different regions in key alias', () => {
      const app2 = new cdk.App();
      const stack2 = new KmsStack(app2, 'TestKmsStack3', {
        region: 'us-east-2',
        environmentSuffix: 'test123',
        env: {
          account: '123456789012',
          region: 'us-east-2',
        },
      });
      const template2 = Template.fromStack(stack2);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payments-table-key-us-east-1-test123',
      });

      template2.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payments-table-key-us-east-2-test123',
      });
    });

    test('Key description includes correct region', () => {
      const app2 = new cdk.App();
      const stack2 = new KmsStack(app2, 'TestKmsStack4', {
        region: 'eu-west-1',
        environmentSuffix: 'test123',
        env: {
          account: '123456789012',
          region: 'eu-west-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting the payments DynamoDB table in eu-west-1',
      });
    });
  });

  describe('Output Export Names', () => {
    test('Export names include region and environment suffix', () => {
      const outputs = template.findOutputs('*');

      expect(outputs.KmsKeyArn.Export.Name).toBe('PaymentsKmsKeyArn-us-east-1-test123');
      expect(outputs.KmsKeyId.Export.Name).toBe('PaymentsKmsKeyId-us-east-1-test123');
      expect(outputs.KmsKeyAlias.Export.Name).toBe('PaymentsKmsKeyAlias-us-east-1-test123');
      expect(outputs.KeyRotationEnabled.Export.Name).toBe('KmsKeyRotation-us-east-1-test123');
      expect(outputs.KmsRegion.Export.Name).toBe('KmsRegion-us-east-1-test123');
    });
  });
});
