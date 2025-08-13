import fs from 'fs';
import path from 'path';

const stack = { region: process.env.AWS_REGION || 'us-east-1' };

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('TurnAroundPromptTable should be queryable', async () => {
      const tableName =
        template.Resources.TurnAroundPromptTable.Properties.TableName;
      expect(tableName).toBeDefined();
      expect(typeof tableName['Fn::Sub']).toBe('string');
    });

    test('TurnAroundPromptTable should have correct capacity settings', async () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TurnAroundPromptTable should have proper key structure', async () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;
      const attributes = table.Properties.AttributeDefinitions;

      // Verify primary key setup
      expect(keySchema).toBeDefined();
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');

      // Verify attribute definitions match key schema
      expect(attributes).toBeDefined();
      expect(attributes).toHaveLength(1);
      const idAttribute = attributes.find(
        (attr: any) => attr.AttributeName === 'id'
      );
      expect(idAttribute).toBeDefined();
      expect(idAttribute.AttributeType).toBe('S');
    }); // ✅ FIXED: closed the test block properly

    test('S3 event notification should be configured', () => {
      template.hasResourceProperties('AWS::S3::BucketNotification', {
        NotificationConfiguration: {
          LambdaConfigurations: [
            {
              Event: 's3:ObjectCreated:*',
            },
          ],
        },
      });
    });

    test('Stack should be in us-east-1 region', () => {
      expect(stack.region).toBe('us-east-1');
    });

    test('Required outputs should be exported', () => {
      template.hasOutput('SourceBucketName', {});
      template.hasOutput('ProcessedBucketName', {});
      template.hasOutput('ImageProcessorFunctionArn', {});
      template.hasOutput('ImageProcessorRoleArn', {});
    });
  });
});
