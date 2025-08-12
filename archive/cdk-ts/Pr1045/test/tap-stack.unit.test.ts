import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let environmentSuffix: string;

  beforeEach(() => {
    app = new cdk.App();
    environmentSuffix = 'test';
  });

  describe('Stack Creation', () => {
    test('Creates IAM role for multi-region DynamoDB access', () => {
      const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        Description: 'Role for accessing multi-region DynamoDB tables',
      });
    });

    test('Creates stack with correct outputs', () => {
      const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasOutput('DeploymentInstructions', {
        Description: 'Sample deployment command with configurable capacities',
      });
    });

    test('Adds permissions for both DynamoDB tables when stacks are provided', () => {
      // Create the DynamoDB stacks
      const west1Stack = new DynamoDBStack(app, 'West1Stack', {
        environmentSuffix,
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });

      const west2Stack = new DynamoDBStack(app, 'West2Stack', {
        environmentSuffix,
        readCapacity: 10,
        writeCapacity: 10,
        env: { region: 'us-west-2' },
      });

      const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
        environmentSuffix,
        west1Stack,
        west2Stack,
      });

      const template = Template.fromStack(stack);

      // Check for IAM policy attached to the role
      template.resourceCountIs('AWS::IAM::Policy', 1); // Combined policy for both tables
      
      // Check for IAM role exists
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        Description: 'Role for accessing multi-region DynamoDB tables',
      });

      // Check for outputs
      template.hasOutput('MultiRegionRoleArn', {
        Description: 'IAM role for multi-region DynamoDB access',
      });
      template.hasOutput('West1TableName', {
        Description: 'DynamoDB table name in us-west-1',
      });
      template.hasOutput('West2TableName', {
        Description: 'DynamoDB table name in us-west-2',
      });
    });
  });
});

describe('DynamoDBStack', () => {
  let app: cdk.App;
  let environmentSuffix: string;

  beforeEach(() => {
    app = new cdk.App();
    environmentSuffix = 'test';
  });

  describe('DynamoDB Table Configuration', () => {
    test('Creates table with correct capacity settings', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix,
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });
    });

    test('Creates table with partition and sort keys', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix,
        readCapacity: 10,
        writeCapacity: 10,
        env: { region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'sortKey',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'sortKey',
            AttributeType: 'S',
          },
        ]),
      });
    });

    test('Enables point-in-time recovery', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix,
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('Enables server-side encryption', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix,
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('Creates Global Secondary Index with correct capacity', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix,
        readCapacity: 10,
        writeCapacity: 10,
        env: { region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              {
                AttributeName: 'gsi1pk',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'gsi1sk',
                KeyType: 'RANGE',
              },
            ],
            ProvisionedThroughput: {
              ReadCapacityUnits: 5, // Half of 10
              WriteCapacityUnits: 5, // Half of 10
            },
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('Sets correct removal policy for non-production environments', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
    });

    test('Sets RETAIN removal policy for production environment', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Retain',
      });
    });

    test('Creates correct outputs', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix,
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasOutput('TableName', {
        Description: Match.stringLikeRegexp('DynamoDB table name'),
      });
      template.hasOutput('TableArn', {
        Description: Match.stringLikeRegexp('DynamoDB table ARN'),
      });
      template.hasOutput('TableCapacities', {
        Value: 'Read: 5, Write: 5',
      });
    });

    test('Table name includes region and environment suffix', () => {
      const stack = new DynamoDBStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        readCapacity: 5,
        writeCapacity: 5,
        env: { region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*us-west-2.*staging.*'),
      });
    });
  });
});