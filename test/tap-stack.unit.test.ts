import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-west-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'multi-region-table-us-west-1',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('should have correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ]
      });
    });
  });

  describe('IAM Role', () => {
    test('should create IAM role for DynamoDB access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('should have DynamoDB access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ]
            }
          ]
        }
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export DynamoDB table name', () => {
      template.hasOutput('DynamoTableName', {
        Export: {
          Name: 'TestTapStack-DynamoTableName'
        }
      });
    });

    test('should export DynamoDB table ARN', () => {
      template.hasOutput('DynamoTableArn', {
        Export: {
          Name: 'TestTapStack-DynamoTableArn'
        }
      });
    });

    test('should export read capacity', () => {
      template.hasOutput('ReadCapacity', {
        Export: {
          Name: 'TestTapStack-ReadCapacity'
        }
      });
    });

    test('should export write capacity', () => {
      template.hasOutput('WriteCapacity', {
        Export: {
          Name: 'TestTapStack-WriteCapacity'
        }
      });
    });

    test('should export IAM role ARN', () => {
      template.hasOutput('DynamoDBAccessRoleArn', {
        Export: {
          Name: 'TestTapStack-DynamoDBAccessRoleArn'
        }
      });
    });

    test('should export capacity configuration', () => {
      template.hasOutput('CapacityConfiguration', {
        Export: {
          Name: 'TestTapStack-CapacityConfiguration'
        }
      });
    });
  });
});

describe('TapStack UsWest2', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStackUsWest2', {
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with parameterized capacity', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'multi-region-table-us-west-2',
        ProvisionedThroughput: {
          ReadCapacityUnits: {
            Ref: 'DynamoReadCapacity'
          },
          WriteCapacityUnits: {
            Ref: 'DynamoWriteCapacity'
          }
        }
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create cross-region Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'cross-region-lambda-us-west-2',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });
    });

    test('should have cross-region environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            LOCAL_TABLE_NAME: {
              Ref: 'MultiRegionDynamoTableDA1B48CB'
            },
            REMOTE_TABLE_NAME: 'multi-region-table-us-west-1'
          }
        }
      });
    });
  });

  describe('Cross-Region Outputs', () => {
    test('should export cross-region Lambda function ARN', () => {
      template.hasOutput('CrossRegionLambdaFunctionArn', {
        Export: {
          Name: 'TestTapStackUsWest2-CrossRegionLambdaFunctionArn'
        }
      });
    });

    test('should export cross-region configuration', () => {
      template.hasOutput('CrossRegionConfiguration', {
        Export: {
          Name: 'TestTapStackUsWest2-CrossRegionConfiguration'
        }
      });
    });
  });
});
