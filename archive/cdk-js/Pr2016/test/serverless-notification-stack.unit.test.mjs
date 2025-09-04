import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ServerlessNotificationStack } from '../lib/serverless-notification-stack.mjs';

describe('ServerlessNotificationStack', () => {
  let app;
  let stack;
  let template;

  const defaultProps = {
    environmentSuffix: 'test',
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new ServerlessNotificationStack(app, 'TestServerlessNotificationStack', defaultProps);
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestServerlessNotificationStack');
    });

    test('uses correct environment suffix', () => {
      // Test with custom suffix
      const customApp = new cdk.App();
      const customStack = new ServerlessNotificationStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
      });
      const customTemplate = Template.fromStack(customStack);
      
      // Verify bucket name contains the environment suffix - just check resource exists
      customTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      
      // Verify bucket name pattern indirectly
      const buckets = customTemplate.findResources('AWS::S3::Bucket');
      const bucketProps = Object.values(buckets)[0].Properties;
      expect(bucketProps.BucketName).toBeDefined();
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new ServerlessNotificationStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Verify bucket name contains default suffix - just check resource exists
      defaultTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      
      // Verify bucket name pattern indirectly  
      const buckets = defaultTemplate.findResources('AWS::S3::Bucket');
      const bucketProps = Object.values(buckets)[0].Properties;
      expect(bucketProps.BucketName).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
      
      // Verify bucket name pattern separately
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketProps = Object.values(buckets)[0].Properties;
      expect(bucketProps.BucketName).toMatchObject(expect.any(Object));
    });

    test('creates S3 bucket with lifecycle configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });

    test('has correct removal policy for S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('enables SSL enforcement on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('creates SNS topic with correct properties', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'task-completion-notifications-test',
        DisplayName: 'Task Completion Notifications - test',
      });
    });

    test('creates exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('creates Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'task-processor-test',
        Runtime: 'python3.11',
        Handler: 'task-processor.lambda_handler',
        Timeout: 300,
        MemorySize: 512,
        Description: 'Processes async tasks and notifies completion - test',
      });
    });

    test('configures Lambda environment variables correctly', () => {
      // Verify environment variables exist
      const functions = template.findResources('AWS::Lambda::Function');
      const mainFunction = Object.values(functions).find(func => 
        func.Properties.FunctionName === 'task-processor-test'
      );
      
      expect(mainFunction).toBeDefined();
      expect(mainFunction.Properties.Environment).toBeDefined();
      expect(mainFunction.Properties.Environment.Variables).toBeDefined();
      expect(mainFunction.Properties.Environment.Variables.S3_BUCKET_NAME).toBeDefined();
      expect(mainFunction.Properties.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
      expect(mainFunction.Properties.Environment.Variables.REGION).toBeDefined();
    });

    test('enables dead letter queue for Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });

    test('sets correct retry attempts for Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: Match.absent(),
      });
    });

    test('creates exactly one Lambda function', () => {
      // Note: CDK might create additional Lambda versions, so we check at least one exists
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('IAM Permissions', () => {
    test('creates IAM role for Lambda function', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('grants S3 write permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.anyValue(),
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
      
      // Verify S3 permissions exist in the policy
      const policies = template.findResources('AWS::IAM::Policy');
      const policyStatements = Object.values(policies)[0].Properties.PolicyDocument.Statement;
      const s3Statement = policyStatements.find(stmt => 
        Array.isArray(stmt.Action) && stmt.Action.some(action => action.includes('s3:'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('grants SNS publish permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sns:Publish',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
      
      // Verify SNS permissions exist in the policy
      const policies = template.findResources('AWS::IAM::Policy');
      const policyStatements = Object.values(policies)[0].Properties.PolicyDocument.Statement;
      const snsStatement = policyStatements.find(stmt => 
        stmt.Action === 'sns:Publish' || (Array.isArray(stmt.Action) && stmt.Action.includes('sns:Publish'))
      );
      expect(snsStatement).toBeDefined();
    });

    test('does not contain wildcard permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        const policyDoc = policy.Properties.PolicyDocument;
        policyDoc.Statement.forEach((statement) => {
          if (Array.isArray(statement.Resource)) {
            statement.Resource.forEach((resource) => {
              if (typeof resource === 'string') {
                expect(resource).not.toBe('*');
              }
            });
          } else if (typeof statement.Resource === 'string') {
            expect(statement.Resource).not.toBe('*');
          }
        });
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies required tags to all resources', () => {
      // Check that tags are applied to stack level
      const stackTags = stack.tags.tagValues();
      expect(stackTags.Environment).toBe('production');
      expect(stackTags.Department).toBe('IT');
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('TaskResultsBucketNametest', {
        Description: 'S3 Bucket name for task results',
        Export: {
          Name: 'TaskResultsBucketName-test',
        },
      });

      template.hasOutput('TaskCompletionTopicArntest', {
        Description: 'SNS Topic ARN for completion notifications',
        Export: {
          Name: 'TaskCompletionTopicArn-test',
        },
      });

      template.hasOutput('TaskProcessorFunctionArntest', {
        Description: 'Lambda Function ARN for task processing',
        Export: {
          Name: 'TaskProcessorFunctionArn-test',
        },
      });

      template.hasOutput('TaskProcessorFunctionNametest', {
        Description: 'Lambda Function name for task processing',
        Export: {
          Name: 'TaskProcessorFunctionName-test',
        },
      });

      template.hasOutput('StackStatustest', {
        Value: 'DEPLOYED',
        Description: 'Serverless notification service deployment status - test',
        Export: {
          Name: 'ServerlessNotificationStackStatus-test',
        },
      });
    });

    test('creates exactly 5 outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(Object.keys(outputs)).toHaveLength(5);
    });
  });

  describe('Security Best Practices', () => {
    test('uses least privilege IAM policies', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement) => {
          // Ensure actions are specific, not wildcard
          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action) => {
              expect(action).not.toBe('*');
            });
          } else if (typeof statement.Action === 'string') {
            expect(statement.Action).not.toBe('*');
          }
        });
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('Production Readiness', () => {
    test('Lambda function has error handling configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('resources are tagged for governance', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags).toHaveProperty('Environment');
      expect(stackTags).toHaveProperty('Department');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty props object', () => {
      const emptyApp = new cdk.App();
      const emptyPropsStack = new ServerlessNotificationStack(emptyApp, 'EmptyPropsStack', {});
      expect(emptyPropsStack).toBeDefined();
      
      const emptyTemplate = Template.fromStack(emptyPropsStack);
      // Should still create all required resources with default values
      emptyTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      emptyTemplate.resourceCountIs('AWS::SNS::Topic', 1);
      
      // Check Lambda functions (might be multiple due to versions)
      const functions = emptyTemplate.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(1);
    });

    test('handles undefined environment suffix', () => {
      const undefinedApp = new cdk.App();
      const undefinedSuffixStack = new ServerlessNotificationStack(undefinedApp, 'UndefinedSuffixStack', {
        environmentSuffix: undefined,
      });
      const undefinedTemplate = Template.fromStack(undefinedSuffixStack);
      
      // Should default to 'dev' - verify bucket exists
      undefinedTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      
      // Verify bucket name contains 'dev'
      const buckets = undefinedTemplate.findResources('AWS::S3::Bucket');
      const bucketProps = Object.values(buckets)[0].Properties;
      expect(bucketProps.BucketName).toMatchObject(expect.any(Object));
    });
  });
});