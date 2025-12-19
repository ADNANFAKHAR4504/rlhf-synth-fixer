import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TapStack', { 
      environmentSuffix: 'test', 
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Resources', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });
      
      // Check environment variables exist (exact refs may vary)
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const lambdaFunction = Object.values(lambdaFunctions)[0] as any;
      expect(lambdaFunction.Properties.Environment.Variables.IMAGE_BUCKET).toBeDefined();
      expect(lambdaFunction.Properties.Environment.Variables.NOTIFICATION_TOPIC_ARN).toBeDefined();
    });

    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Image Processing Completion Notifications'
      });
    });

    test('should create API Gateway REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'ImageProcessingService',
        Description: 'API Gateway for image processing requests'
      });
    });

    test('should create API Gateway method for POST /process', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY'
        }
      });
    });

    test('should create IAM role for Lambda with proper policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        },
        ManagedPolicyArns: [{
          'Fn::Join': ['', [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
          ]]
        }]
      });
    });

    test('should grant S3 permissions to Lambda role', () => {
      // Check that IAM policy contains S3 permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const policy = Object.values(policies)[0] as any;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      const s3Statement = statements.find((stmt: any) => 
        stmt.Action && Array.isArray(stmt.Action) && 
        stmt.Action.some((action: string) => action.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
    });

    test('should grant SNS publish permissions to Lambda role', () => {
      // Check that IAM policy contains SNS permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const policy = Object.values(policies)[0] as any;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      const snsStatement = statements.find((stmt: any) => 
        stmt.Action && (stmt.Action === 'sns:Publish' || 
        (Array.isArray(stmt.Action) && stmt.Action.includes('sns:Publish')))
      );
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Effect).toBe('Allow');
    });

    test('should output SNS topic ARN', () => {
      // Check that the output exists (exact ref may vary)
      const outputs = template.findOutputs('NotificationTopicArn');
      expect(Object.keys(outputs)).toHaveLength(1);
      
      const output = Object.values(outputs)[0] as any;
      expect(output.Value.Ref).toBeDefined();
      expect(output.Value.Ref).toMatch(/ImageProcessingNotifications/);
    });

    test('should set region to us-east-1', () => {
      expect(stack.region).toBe('us-east-1');
    });

    test('should apply RemovalPolicy.DESTROY for cleanup', () => {
      // Verify SNS topic has removal policy set to DESTROY
      const snsTopics = template.findResources('AWS::SNS::Topic');
      const snsTopic = Object.values(snsTopics)[0] as any;

      expect(snsTopic.UpdateReplacePolicy).toBe('Delete');
      expect(snsTopic.DeletionPolicy).toBe('Delete');
    });
  });
});
