import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack CI/CD Pipeline Infrastructure', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  // Test both with and without environment suffix to improve branch coverage
  describe('with default environment suffix', () => {
    beforeEach(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
      delete process.env.AWS_REGION;
      delete process.env.APPLICATION_NAME;
      delete process.env.NOTIFICATION_EMAIL;
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {});
      template = Template.fromStack(stack);
    });

    test('should use default environment suffix when not provided', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-app-function-dev',
      });
    });

    test('should use default notification email when not provided', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('with custom environment suffix', () => {
    const customEnvSuffix = 'dev2';

    beforeEach(() => {
      process.env.ENVIRONMENT_SUFFIX = customEnvSuffix;
      process.env.AWS_REGION = 'us-east-1';
      process.env.APPLICATION_NAME = 'tap-app';
      process.env.NOTIFICATION_EMAIL = 'test@example.com';
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: customEnvSuffix });
      template = Template.fromStack(stack);
    });

    afterEach(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
      delete process.env.AWS_REGION;
      delete process.env.APPLICATION_NAME;
      delete process.env.NOTIFICATION_EMAIL;
    });

    describe('S3 Buckets', () => {
      test('should create source code bucket with correct configuration', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          VersioningConfiguration: {
            Status: 'Enabled',
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
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('should create artifacts bucket with correct configuration', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('should create exactly 2 S3 buckets', () => {
        template.resourceCountIs('AWS::S3::Bucket', 2);
      });
  });

  describe('Lambda Functions', () => {
      test('should create main Lambda function with Node.js 18.x runtime', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `tap-app-function-${customEnvSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: 128,
          Timeout: 30,
          Environment: {
            Variables: {
              ENVIRONMENT: customEnvSuffix,
              APPLICATION_NAME: 'tap-app',
            },
          },
        });
      });

      test('should create deployment Lambda function', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `tap-app-deployment-${customEnvSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: 256,
          Timeout: 300,
        });
      });
  });

    describe('CodeBuild Projects', () => {
      test('should create build project with correct configuration', () => {
        template.hasResourceProperties('AWS::CodeBuild::Project', {
          Name: `tap-app-build-${customEnvSuffix}`,
          Environment: {
            ComputeType: 'BUILD_GENERAL1_SMALL',
            Image: 'aws/codebuild/standard:5.0',
            Type: 'LINUX_CONTAINER',
            PrivilegedMode: false,
          },
        });
      });

      test('should create test project with correct configuration', () => {
        template.hasResourceProperties('AWS::CodeBuild::Project', {
          Name: `tap-app-test-${customEnvSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:5.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: false,
        },
      });
    });

      test('should have correct build spec for build project', () => {
        const buildProject = template.findResources('AWS::CodeBuild::Project', {
          Properties: {
            Name: `tap-app-build-${customEnvSuffix}`,
        },
      });
      
      const buildProjectKey = Object.keys(buildProject)[0];
      const buildSpec = JSON.parse(buildProject[buildProjectKey].Properties.Source.BuildSpec);
      
      expect(buildSpec.version).toBe('0.2');
      expect(buildSpec.phases.install['runtime-versions'].nodejs).toBe('18');
      expect(buildSpec.phases.build.commands).toContain('npm run build');
        expect(buildSpec.artifacts.files).toContain('deployment-package.zip');
      });
  });

    describe('CodePipeline', () => {
      test('should create pipeline with all required stages', () => {
        template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
          Name: `tap-app-pipeline-${customEnvSuffix}`,
      });

      // Check that pipeline has the correct number of stages
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineKey = Object.keys(pipeline)[0];
      const stages = pipeline[pipelineKey].Properties.Stages;
      
      expect(stages).toHaveLength(4);
        expect(stages.map((stage: any) => stage.Name)).toEqual(['Source', 'Build', 'Test', 'Deploy']);
      });

      test('should have correct source stage configuration', () => {
        const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
        const pipelineKey = Object.keys(pipeline)[0];
        const sourceStage = pipeline[pipelineKey].Properties.Stages[0];
        
        expect(sourceStage.Name).toBe('Source');
        expect(sourceStage.Actions[0].ActionTypeId.Provider).toBe('S3');
        expect(sourceStage.Actions[0].Configuration.S3ObjectKey).toBe('source.zip');
      });
    });

    describe('SNS Notifications', () => {
      test('should create failure notification topic', () => {
        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: `tap-app-pipeline-failures-${customEnvSuffix}`,
          DisplayName: 'Pipeline Failure Notifications',
        });
      });

      test('should create email subscription', () => {
        template.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
          Endpoint: 'test@example.com',
        });
      });

      test('should create topic policy for EventBridge', () => {
        template.hasResourceProperties('AWS::SNS::TopicPolicy', {
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'events.amazonaws.com',
                },
                Action: 'sns:Publish',
              },
            ],
          },
        });
      });
    });

    describe('IAM Roles and Policies', () => {
      test('should create CodeBuild role with appropriate policies', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `tap-app-codebuild-role-${customEnvSuffix}`,
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'codebuild.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          },
        });
      });

      test('should create pipeline role with appropriate policies', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `tap-app-pipeline-role-${customEnvSuffix}`,
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'codepipeline.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          },
        });
      });

      test('should create Lambda execution role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `tap-app-lambda-role-${customEnvSuffix}`,
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

      test('should have correct number of IAM roles', () => {
        template.resourceCountIs('AWS::IAM::Role', 9);
        
        // Verify CodeBuild role exists
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `tap-app-codebuild-role-${customEnvSuffix}`,
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'codebuild.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          },
        });
      });
    });

    describe('EventBridge Rules', () => {
      test('should create pipeline state change rule', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: `tap-app-pipeline-events-${customEnvSuffix}`,
          EventPattern: {
            source: ['aws.codepipeline'],
            'detail-type': ['CodePipeline Pipeline Execution State Change'],
            detail: {
              state: ['FAILED'],
            },
          },
        });
      });

      test('should create CodeBuild state change rule', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Name: `tap-app-build-events-${customEnvSuffix}`,
          EventPattern: {
            source: ['aws.codebuild'],
            'detail-type': ['CodeBuild Build State Change'],
            detail: {
              'build-status': ['FAILED'],
            },
          },
        });
      });

      test('should create exactly 2 EventBridge rules', () => {
        template.resourceCountIs('AWS::Events::Rule', 2);
      });
    });

    describe('CloudFormation Outputs', () => {
      test('should create all required outputs', () => {
        template.hasOutput('PipelineName', {
          Export: {
            Name: `tap-app-pipeline-name-${customEnvSuffix}`,
          },
        });

        template.hasOutput('LambdaFunctionArn', {
          Export: {
            Name: `tap-app-lambda-arn-${customEnvSuffix}`,
          },
        });

        template.hasOutput('SourceBucketName', {
          Export: {
            Name: `tap-app-source-bucket-${customEnvSuffix}`,
          },
        });
      });

      test('should create build and test project name outputs', () => {
        template.hasOutput('BuildProjectName', {
          Export: {
            Name: `tap-app-build-project-${customEnvSuffix}`,
          },
        });

        template.hasOutput('TestProjectName', {
          Export: {
            Name: `tap-app-test-project-${customEnvSuffix}`,
          },
        });
      });
    });

    describe('Resource Counts', () => {
      test('should create correct number of resources', () => {
        template.resourceCountIs('AWS::S3::Bucket', 2);
        template.resourceCountIs('AWS::Lambda::Function', 3); // Main + Deployment + AutoDelete
        template.resourceCountIs('AWS::CodeBuild::Project', 2);
        template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.resourceCountIs('AWS::Events::Rule', 2);
      });
    });

    describe('Stack Properties', () => {
      test('should have public properties accessible', () => {
        expect(stack.pipeline).toBeDefined();
        expect(stack.lambdaFunction).toBeDefined();
        expect(stack.sourceBucket).toBeDefined();
        expect(stack.failureNotificationTopic).toBeDefined();
      });
    });
  });

  describe('context variations for branch coverage', () => {
    test('should handle environment suffix from context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'context-test');
      const contextStack = new TapStack(contextApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-app-function-context-test',
      });
    });

    test('should handle missing environment variables', () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      delete process.env.AWS_REGION;
      delete process.env.APPLICATION_NAME;
      delete process.env.NOTIFICATION_EMAIL;

      const fallbackApp = new cdk.App();
      const fallbackStack = new TapStack(fallbackApp, 'FallbackTestStack');
      const fallbackTemplate = Template.fromStack(fallbackStack);

      fallbackTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-app-function-dev',
      });

      fallbackTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Endpoint: 'admin@example.com',
      });
    });
  });
});
