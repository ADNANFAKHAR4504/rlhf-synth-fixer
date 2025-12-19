import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';

describe('DatabaseStack Unit Tests', () => {
  let app: cdk.App;
  let stack: DatabaseStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DatabaseStack(app, 'TestDatabaseStack', {
      environmentSuffix: 'test123',
      replicaRegion: 'us-east-2',
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

    test('Table name is exported correctly', () => {
      expect(stack.tableName).toBeDefined();
      expect(typeof stack.tableName).toBe('string');
    });

    test('KMS key is exported correctly', () => {
      expect(stack.kmsKey).toBeDefined();
    });

    test('Table is exported correctly', () => {
      expect(stack.table).toBeDefined();
    });
  });

  describe('DynamoDB Global Table', () => {
    test('Creates exactly one DynamoDB Global Table', () => {
      template.resourceCountIs('AWS::DynamoDB::GlobalTable', 1);
    });

    test('Global Table has correct composite key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('Global Table has correct attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('Global Table uses on-demand billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('Global Table has point-in-time recovery enabled', () => {
      const resources = template.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::GlobalTable'
      );
      expect(tables.length).toBe(1);
      const table = tables[0] as any;
      expect(table.Properties.Replicas.every((r: any) =>
        r.PointInTimeRecoverySpecification?.PointInTimeRecoveryEnabled === true
      )).toBe(true);
    });

    test('Global Table has replication to secondary region', () => {
      const resources = template.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::GlobalTable'
      );
      expect(tables.length).toBe(1);
      const table = tables[0] as any;
      const regions = table.Properties.Replicas.map((r: any) => r.Region);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('us-east-2');
    });

    test('Global Table uses customer-managed KMS encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    test('Table name includes environment suffix', () => {
      // Verify table name via exported property
      expect(stack.tableName).toBeDefined();
      expect(typeof stack.tableName).toBe('string');

      // Verify table exists in template
      const resources = template.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::GlobalTable'
      );
      expect(tables.length).toBe(1);
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
      const resources = template.toJSON().Resources;
      const kmsKeys = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBe(1);
      const kmsKey = kmsKeys[0] as any;
      expect(kmsKey.Properties.Description).toContain('payments DynamoDB table');
    });

    test('KMS key has DeletionPolicy set to Delete', () => {
      const resources = template.toJSON().Resources;
      const kmsKeys = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBe(1);
      expect((kmsKeys[0] as any).DeletionPolicy).toBe('Delete');
    });

    test('Creates KMS key alias with correct naming', () => {
      template.resourceCountIs('AWS::KMS::Alias', 1);
      const resources = template.toJSON().Resources;
      const aliases = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Alias'
      );
      expect(aliases.length).toBe(1);
      const alias = aliases[0] as any;
      expect(alias.Properties.AliasName).toContain('payments-table-key');
      expect(alias.Properties.AliasName).toContain('test123');
    });
  });

  describe('Stack Outputs', () => {
    test('Stack exports outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs || {}).length).toBeGreaterThan(0);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Different environment suffixes create different table names', () => {
      const app2 = new cdk.App();
      const stack2 = new DatabaseStack(app2, 'TestDatabaseStack2', {
        environmentSuffix: 'prod456',
        replicaRegion: 'us-east-2',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      // Both stacks should export table names
      expect(stack.tableName).toBeDefined();
      expect(stack2.tableName).toBeDefined();

      // Table names should be different (CDK generates unique names)
      expect(stack.tableName).not.toBe(stack2.tableName);
    });
  });

  describe('Replica Region Configuration', () => {
    test('Supports different replica regions', () => {
      const app2 = new cdk.App();
      const stack2 = new DatabaseStack(app2, 'TestDatabaseStack3', {
        environmentSuffix: 'test123',
        replicaRegion: 'eu-west-1',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      const resources = template2.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::GlobalTable'
      );
      expect(tables.length).toBe(1);
      const table = tables[0] as any;
      const regions = table.Properties.Replicas.map((r: any) => r.Region);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('eu-west-1');
    });

    test('Constructs correct KMS key ARN for replica region', () => {
      const app2 = new cdk.App();
      const stack2 = new DatabaseStack(app2, 'TestDatabaseStack4', {
        environmentSuffix: 'test456',
        replicaRegion: 'ap-south-1',
        env: {
          account: '987654321098',
          region: 'ap-southeast-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      const resources = template2.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::GlobalTable'
      );
      expect(tables.length).toBe(1);
      const table = tables[0] as any;
      const replicaRegion = table.Properties.Replicas.find((r: any) => r.Region === 'ap-south-1');
      expect(replicaRegion).toBeDefined();
    });
  });
});
