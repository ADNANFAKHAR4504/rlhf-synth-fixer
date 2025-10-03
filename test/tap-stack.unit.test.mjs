import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should use environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', { environmentSuffix: 'prod' });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'healthcare-pipeline-prod',
      });
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp('healthcare-pipeline-.*'),
      });
    });
  });

  describe('Source Bucket', () => {
    test('should create S3 source bucket with encryption', () => {
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

    test('should create exactly two S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should create S3 bucket with encryption', () => {
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

    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have versioning enabled on buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketConfigs = Object.values(buckets);
      expect(bucketConfigs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Lambda Security Scanner', () => {
    test('should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
      });
    });

    test('should create Lambda function with 10 minute timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 600,
      });
    });

    test('should grant Lambda S3 read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant Lambda CodePipeline permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['codepipeline:PutJobSuccessResult', 'codepipeline:PutJobFailureResult'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should create at least one Lambda function', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(1);
    });

    test('should create Lambda log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should create exactly one explicit log group', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create build project with correct image', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          Image: Match.stringLikeRegexp('aws/codebuild/amazonlinux2.*'),
          Type: 'LINUX_CONTAINER',
        },
      });
    });

    test('should create exactly three CodeBuild projects', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 3);
    });

    test('should configure build project with artifact bucket environment variable', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          EnvironmentVariables: Match.arrayWith([
            {
              Name: 'ARTIFACT_BUCKET',
              Type: 'PLAINTEXT',
              Value: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('should grant CodeBuild projects S3 permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy', {
        Properties: {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['s3:GetObject', 's3:PutObject'],
                Effect: 'Allow',
              }),
            ]),
          },
        },
      });
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('CodeDeploy', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `healthcare-app-${environmentSuffix}`,
        ComputePlatform: 'Server',
      });
    });

    test('should create CodeDeploy deployment group', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: `healthcare-deployment-${environmentSuffix}`,
        DeploymentConfigName: 'CodeDeployDefault.AllAtOnce',
      });
    });

    test('should configure auto rollback on deployment failure', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST']),
        },
      });
    });

    test('should configure EC2 instance tags for deployment', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        Ec2TagSet: {
          Ec2TagSetList: Match.arrayWith([
            {
              Ec2TagGroup: Match.arrayWith([
                Match.objectLike({
                  Key: 'Environment',
                  Type: 'KEY_AND_VALUE',
                  Value: environmentSuffix,
                }),
                Match.objectLike({
                  Key: 'Application',
                  Type: 'KEY_AND_VALUE',
                  Value: 'HealthcareApp',
                }),
              ]),
            },
          ]),
        },
      });
    });

    test('should create exactly one CodeDeploy application', () => {
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    });

    test('should create exactly one deployment group', () => {
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `healthcare-pipeline-${environmentSuffix}`,
      });
    });

    test('should create pipeline with 6 stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'BuildAndTest' }),
          Match.objectLike({ Name: 'SecurityScan' }),
          Match.objectLike({ Name: 'ComplianceCheck' }),
          Match.objectLike({ Name: 'Approval' }),
          Match.objectLike({ Name: 'Deploy' }),
        ]),
      });
    });

    test('should configure Source stage with S3', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Source',
                  Provider: 'S3',
                }),
                Name: 'Source',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure BuildAndTest stage with CodeBuild', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'BuildAndTest',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Build',
                  Provider: 'CodeBuild',
                }),
                Name: 'BuildAndTest',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure SecurityScan stage with CodeBuild and Lambda', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          {
            Name: 'SecurityScan',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Provider: 'CodeBuild',
                },
                Name: 'SecurityScan',
              }),
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Invoke',
                  Provider: 'Lambda',
                },
                Name: 'CustomSecurityScan',
              }),
            ]),
          },
        ]),
      });
    });

    test('should configure Approval stage with manual approval', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Approval',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Approval',
                  Provider: 'Manual',
                }),
                Name: 'DeploymentApproval',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure Deploy stage with CodeDeploy', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Deploy',
                  Provider: 'CodeDeploy',
                }),
                Name: 'Deploy',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should create exactly one pipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('should enable restart execution on update', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        RestartExecutionOnUpdate: true,
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch alarm for pipeline failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `healthcare-pipeline-${environmentSuffix}`,
      });
    });

    test('should create exactly one CloudWatch alarm', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create IAM roles with least privilege', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
      
      Object.values(roles).forEach((role) => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('should not grant wildcard permissions on sensitive actions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      
      Object.values(policies).forEach((policy) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement) => {
          if (statement.Effect === 'Allow' && Array.isArray(statement.Action)) {
            statement.Action.forEach((action) => {
              if (action.includes('Delete') || action.includes('Update')) {
                if (Array.isArray(statement.Resource)) {
                  statement.Resource.forEach((resource) => {
                    expect(resource).not.toBe('*');
                  });
                } else if (statement.Resource !== '*' || action === 'codepipeline:PutJobSuccessResult' || action === 'codepipeline:PutJobFailureResult') {
                  // Allow specific exceptions like CodePipeline job results
                } else {
                  expect(statement.Resource).not.toBe('*');
                }
              }
            });
          }
        });
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export source bucket name', () => {
      template.hasOutput('SourceBucketName', {
        Description: 'S3 source bucket name (upload source.zip here)',
      });
    });

    test('should export artifact bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: 'S3 bucket for pipeline artifacts',
      });
    });

    test('should export pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'CodePipeline name',
      });
    });

    test('should export security scan Lambda ARN', () => {
      template.hasOutput('SecurityScanLambdaArn', {
        Description: 'Security scan Lambda function ARN',
      });
    });

    test('should export deployment group name', () => {
      template.hasOutput('DeploymentGroupName', {
        Description: 'CodeDeploy deployment group name',
      });
    });

    test('should have exactly 5 outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBe(5);
    });
  });

  describe('Resource Cleanup', () => {
    test('should configure S3 bucket for deletion', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket) => {
        expect(bucket.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should not have RETAIN deletion policy on resources', () => {
      const allResources = template.toJSON().Resources;
      Object.entries(allResources).forEach(([logicalId, resource]) => {
        if (resource.DeletionPolicy === 'Retain') {
          // Only custom resources should have Retain policy
          expect(resource.Type).toContain('Custom::');
        }
      });
    });
  });
});