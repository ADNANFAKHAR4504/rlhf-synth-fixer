import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Integration Tests', () => {
    test('should create all required IAM roles with proper permissions', () => {
      // Verify all workload roles are created
      const workloads = ['lambda', 'ec2', 'codebuild', 'codepipeline'];
      workloads.forEach(workload => {
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: `${workload}.amazonaws.com`
                },
                Action: 'sts:AssumeRole'
              }
            ]
          }
        });
      });
    });

    test('should create protected resources with proper configuration', () => {
      // Verify KMS key
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true
      });

      // Verify S3 bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });

      // Verify CloudWatch Log Group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30
      });
    });

    test('should export all required outputs', () => {
      const expectedOutputs = [
        'lambdaRoleArn',
        'ec2RoleArn', 
        'codebuildRoleArn',
        'codepipelineRoleArn',
        'KmsKeyArn',
        'LogsBucketArn'
      ];

      expectedOutputs.forEach(outputName => {
        template.hasOutput(outputName, {});
      });
    });
  });
});
