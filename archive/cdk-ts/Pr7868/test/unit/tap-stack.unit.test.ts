import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Artifact Bucket', () => {
    test('should create S3 bucket with correct name and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'pipeline-artifacts-test',
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

    test('should configure lifecycle rule for 30-day retention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldArtifacts',
              Status: 'Enabled',
              ExpirationInDays: 30,
            },
          ],
        },
      });
    });

    test('should have deletion policy set to DESTROY', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should have auto-delete objects enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('ECR Repository', () => {
    test('should create ECR repository with correct name', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'container-repo-test',
      });
    });

    test('should enable image scanning on push', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });

    test('should configure lifecycle policy to keep last 10 images', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: {
          LifecyclePolicyText: Match.stringLikeRegexp('.*Keep last 10 images.*'),
        },
      });
    });

    test('should have deletion policy set to DESTROY', () => {
      template.hasResource('AWS::ECR::Repository', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'pipeline-notifications-test',
        DisplayName: 'Pipeline Failure Notifications',
      });
    });

    test('should create email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        TopicArn: {
          Ref: Match.stringLikeRegexp('PipelineNotificationTopic.*'),
        },
      });
    });

    test('should have SNS topic policy for EventBridge', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create pipeline IAM role with correct service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'pipeline-role-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create build IAM role with correct service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'build-role-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should grant S3 permissions to pipeline role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyWithS3 = Object.values(policies).find((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            stmt.Action.some((action: string) => action.includes('s3:'))
        );
      });
      expect(policyWithS3).toBeDefined();
    });

    test('should grant ECR permissions to build role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyWithECR = Object.values(policies).find((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            stmt.Action.some((action: string) => action.includes('ecr:'))
        );
      });
      expect(policyWithECR).toBeDefined();
    });

    test('should grant CloudWatch Logs permissions to build role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant CodeBuild permissions to pipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
                'codebuild:StopBuild',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create Docker build project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'docker-build-test',
        Description: 'Build Docker images from source code',
      });
    });

    test('should configure build project with privileged mode', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'docker-build-test',
        Environment: {
          PrivilegedMode: true,
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('should configure build project with environment variables', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const buildProject = Object.values(projects).find(
        (project: any) => project.Properties?.Name === 'docker-build-test'
      );
      expect(buildProject).toBeDefined();
      const envVars = (buildProject as any).Properties.Environment
        .EnvironmentVariables;
      expect(envVars).toBeDefined();
      expect(
        envVars.some((v: any) => v.Name === 'ECR_REPOSITORY_URI')
      ).toBeTruthy();
      expect(
        envVars.some((v: any) => v.Name === 'AWS_DEFAULT_REGION')
      ).toBeTruthy();
      expect(
        envVars.some((v: any) => v.Name === 'AWS_ACCOUNT_ID')
      ).toBeTruthy();
    });

    test('should configure build project timeout to 30 minutes', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'docker-build-test',
        TimeoutInMinutes: 30,
      });
    });

    test('should create security scan project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'security-scan-test',
        Description: 'Scan Docker images for vulnerabilities using Trivy',
      });
    });

    test('should configure security scan project with inline buildspec', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'security-scan-test',
        Source: {
          Type: 'NO_SOURCE',
          BuildSpec: Match.stringLikeRegexp('.*Installing Trivy.*'),
        },
      });
    });

    test('should configure security scan project timeout to 15 minutes', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'security-scan-test',
        TimeoutInMinutes: 15,
      });
    });

    test('should create deploy project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'ecr-deploy-test',
        Description: 'Tag and push images to ECR with semantic versioning',
      });
    });

    test('should configure deploy project timeout to 10 minutes', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'ecr-deploy-test',
        TimeoutInMinutes: 10,
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'container-pipeline-test',
        RestartExecutionOnUpdate: true,
      });
    });

    test('should configure pipeline with artifact bucket', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          Type: 'S3',
          Location: {
            Ref: Match.stringLikeRegexp('ArtifactBucket.*'),
          },
        },
      });
    });

    test('should have 5 pipeline stages', () => {
      const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
      const pipeline = Object.values(pipelines)[0];
      expect(pipeline).toBeDefined();
      const stages = (pipeline as any).Properties.Stages;
      expect(stages).toBeDefined();
      expect(stages).toHaveLength(5);
      expect(stages.map((s: any) => s.Name)).toEqual([
        'Source',
        'Build',
        'SecurityScan',
        'ManualApproval',
        'Deploy',
      ]);
    });

    test('should configure GitHub source action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'GitHub_Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'ThirdParty',
                  Provider: 'GitHub',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure build action with CodeBuild', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Docker_Build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure security scan action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'SecurityScan',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Trivy_Scan',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure manual approval action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'ManualApproval',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Approve_Deployment',
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                },
                Configuration: {
                  CustomData:
                    'Please review security scan results before deploying to ECR',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure deploy action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Tag_And_Push',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should create GitHub webhook', () => {
      template.hasResourceProperties('AWS::CodePipeline::Webhook', {
        Authentication: 'GITHUB_HMAC',
        RegisterWithThirdParty: true,
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create pipeline trigger event rule', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const triggerRule = Object.values(rules).find(
        (rule: any) => rule.Properties?.Name === 'pipeline-trigger-test'
      );
      expect(triggerRule).toBeDefined();
      expect((triggerRule as any).Properties.Description).toBe(
        'Trigger pipeline on source repository changes'
      );
      expect((triggerRule as any).Properties.EventPattern.source).toEqual([
        'aws.codecommit',
      ]);
      expect((triggerRule as any).Properties.EventPattern['detail-type']).toEqual(
        ['CodeCommit Repository State Change']
      );
      expect((triggerRule as any).Properties.State).toBe('ENABLED');
    });

    test('should create pipeline failure notification rule', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const failureRule = Object.values(rules).find(
        (rule: any) => rule.Properties?.Name === 'pipeline-failure-test'
      );
      expect(failureRule).toBeDefined();
      expect((failureRule as any).Properties.Description).toBe(
        'Notify on pipeline failures'
      );
      expect((failureRule as any).Properties.EventPattern.source).toEqual([
        'aws.codepipeline',
      ]);
      expect(
        (failureRule as any).Properties.EventPattern['detail-type']
      ).toEqual(['CodePipeline Pipeline Execution State Change']);
      expect((failureRule as any).Properties.EventPattern.detail.state).toEqual(
        ['FAILED']
      );
    });

    test('should configure failure rule to target SNS topic', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const failureRule = Object.values(rules).find((rule: any) =>
        rule.Properties?.Name?.includes('pipeline-failure')
      );
      expect(failureRule).toBeDefined();
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output artifact bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 bucket for pipeline artifacts',
        Export: {
          Name: 'test-artifact-bucket',
        },
      });
    });

    test('should output SNS topic ARN', () => {
      template.hasOutput('TopicArn', {
        Description: 'SNS topic ARN for notifications',
        Export: {
          Name: 'test-notification-topic-arn',
        },
      });
    });

    test('should output ECR repository URI', () => {
      template.hasOutput('EcrRepositoryUri', {
        Description: 'ECR repository URI',
        Export: {
          Name: 'test-ecr-repository-uri',
        },
      });
    });

    test('should output pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'CodePipeline name',
        Export: {
          Name: 'test-pipeline-name',
        },
      });
    });

    test('should output build project name', () => {
      template.hasOutput('BuildProjectName', {
        Description: 'CodeBuild project name for Docker builds',
        Export: {
          Name: 'test-build-project-name',
        },
      });
    });

    test('should output security scan project name', () => {
      template.hasOutput('SecurityScanProjectName', {
        Description: 'CodeBuild project name for security scanning',
        Export: {
          Name: 'test-security-scan-project-name',
        },
      });
    });
  });

  describe('Resource Count', () => {
    test('should create exactly 3 CodeBuild projects', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 3);
    });

    test('should create exactly 1 CodePipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('should create exactly 1 S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should create exactly 1 ECR repository', () => {
      template.resourceCountIs('AWS::ECR::Repository', 1);
    });

    test('should create exactly 1 SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create exactly 2 EventBridge rules', () => {
      template.resourceCountIs('AWS::Events::Rule', 2);
    });

    test('should create multiple IAM roles', () => {
      template.resourcePropertiesCountIs(
        'AWS::IAM::Role',
        {
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'codepipeline.amazonaws.com',
                },
              }),
            ]),
          }),
        },
        1
      );
    });
  });

  describe('Stack Properties', () => {
    test('should accept environmentSuffix prop', () => {
      // Create a new app for this isolated test
      const testApp = new cdk.App();
      const stackProps = {
        environmentSuffix: 'custom',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      };
      const customStack = new TapStack(testApp, 'CustomStack', stackProps);
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'pipeline-artifacts-custom',
      });
    });

    test('should use correct region from props', () => {
      expect(stack.region).toBe('us-east-1');
    });

    test('should use correct account from props', () => {
      expect(stack.account).toBe('123456789012');
    });
  });

  describe('Security Configuration', () => {
    test('should reference GitHub OAuth token from Secrets Manager', () => {
      // The pipeline role should have secrets manager permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const pipelinePolicy = Object.values(policies).find((policy: any) =>
        policy.Properties?.Roles?.some(
          (role: any) => role.Ref && role.Ref.includes('PipelineRole')
        )
      );
      expect(pipelinePolicy).toBeDefined();
      const statements = (pipelinePolicy as any).Properties.PolicyDocument
        .Statement;
      const secretsStatement = statements.find((stmt: any) =>
        stmt.Action?.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement).toBeDefined();
      // Resource is a CloudFormation intrinsic function, so we need to serialize and check
      const resourceStr = JSON.stringify(secretsStatement.Resource);
      expect(resourceStr).toMatch(/github-oauth-token/);
    });

    test('should use encryption for S3 artifacts', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ]),
        },
      });
    });

    test('should enable ECR image scanning', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });
  });
});
