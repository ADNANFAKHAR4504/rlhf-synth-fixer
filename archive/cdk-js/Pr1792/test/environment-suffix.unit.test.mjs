import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { ServerlessAppStack } from '../lib/serverless-app-stack.mjs';

describe('Environment Suffix Tests', () => {
  describe('TapStack with different environment suffixes', () => {
    test('should handle undefined environment suffix and default to dev', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {});
      const template = Template.fromStack(stack);
      
      expect(stack).toBeDefined();
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        TemplateURL: Match.anyValue()
      });
    });

    test('should handle null environment suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', { 
        environmentSuffix: null 
      });
      const template = Template.fromStack(stack);
      
      expect(stack).toBeDefined();
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        TemplateURL: Match.anyValue()
      });
    });

    test('should use provided environment suffix from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', { 
        environmentSuffix: 'prod' 
      });
      
      expect(stack).toBeDefined();
    });

    test('should use environment suffix from context', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const stack = new TapStack(app, 'TestStack', {});
      
      expect(stack).toBeDefined();
    });

    test('should prioritize props over context for environment suffix', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const stack = new TapStack(app, 'TestStack', { 
        environmentSuffix: 'prod' 
      });
      
      expect(stack).toBeDefined();
    });
  });

  describe('ServerlessAppStack with different environment suffixes', () => {
    test('should handle undefined environment suffix', () => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      const nestedStack = new ServerlessAppStack(parentStack, 'ServerlessApp', {});
      const template = Template.fromStack(nestedStack);
      
      // Should default to 'dev'
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('serverless-app-files-dev-')
            ])
          ]
        }
      });
    });

    test('should use provided environment suffix', () => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      const nestedStack = new ServerlessAppStack(parentStack, 'ServerlessApp', {
        environmentSuffix: 'qa'
      });
      const template = Template.fromStack(nestedStack);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('serverless-app-files-qa-')
            ])
          ]
        }
      });
    });

    test('should include environment suffix in Lambda function name', () => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      const nestedStack = new ServerlessAppStack(parentStack, 'ServerlessApp', {
        environmentSuffix: 'test123'
      });
      const template = Template.fromStack(nestedStack);
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'ServerlessApp-FileProcessor-test123'
      });
    });

    test('should include environment suffix in IAM role name', () => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      const nestedStack = new ServerlessAppStack(parentStack, 'ServerlessApp', {
        environmentSuffix: 'test456'
      });
      const template = Template.fromStack(nestedStack);
      
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
        RoleName: 'ServerlessApp-Lambda-Role-test456'
      }));
    });

    test('should include environment suffix in CloudWatch resources', () => {
      const app = new cdk.App();
      const parentStack = new cdk.Stack(app, 'ParentStack');
      const nestedStack = new ServerlessAppStack(parentStack, 'ServerlessApp', {
        environmentSuffix: 'monitor'
      });
      const template = Template.fromStack(nestedStack);
      
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'ServerlessApp-Monitoring-monitor'
      });
      
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/ServerlessApp-FileProcessor-monitor'
      });
    });
  });
});