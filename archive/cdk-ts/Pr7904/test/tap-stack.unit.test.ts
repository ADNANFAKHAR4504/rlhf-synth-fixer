import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack1', { environmentSuffix: 'prod' });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: 'nodejs-app-repo-prod',
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(testApp, 'TestStack2', {});
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: 'nodejs-app-repo-staging',
      });
    });

    test('should default to dev when neither props nor context provide environmentSuffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack3', {});
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: 'nodejs-app-repo-dev',
      });
    });
  });

  describe('CodeCommit Repository', () => {
    test('should create CodeCommit repository with correct name', () => {
      template.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: `nodejs-app-repo-${environmentSuffix}`,
        RepositoryDescription: Match.stringLikeRegexp('Node.js application repository'),
      });
    });

    test('should have repository count of 1', () => {
      template.resourceCountIs('AWS::CodeCommit::Repository', 1);
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have S3 bucket encryption enabled', () => {
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

    test('should have public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rule for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            }),
          ]),
        },
      });
    });

    test('should have exactly 1 S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create log group with correct name and retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/nodejs-app-build-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should have exactly 1 log group', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `nodejs-app-build-${environmentSuffix}`,
        Description: Match.stringLikeRegexp('Build project for Node.js'),
        Environment: {
          Image: 'aws/codebuild/standard:6.0',
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: false,
          EnvironmentVariables: Match.arrayWith([
            {
              Name: 'NODE_ENV',
              Type: 'PLAINTEXT',
              Value: 'production',
            },
          ]),
        },
      });
    });

    test('should have build timeout of 15 minutes', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        TimeoutInMinutes: 15,
      });
    });

    test('should have buildspec with correct phases', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          BuildSpec: Match.serializedJson(
            Match.objectLike({
              version: '0.2',
              phases: {
                install: Match.objectLike({
                  'runtime-versions': {
                    nodejs: '18',
                  },
                  commands: Match.arrayWith([
                    Match.stringLikeRegexp('npm install'),
                  ]),
                }),
                pre_build: Match.objectLike({
                  commands: Match.arrayWith([
                    Match.stringLikeRegexp('npm test'),
                  ]),
                }),
                build: Match.objectLike({
                  commands: Match.arrayWith([
                    Match.stringLikeRegexp('npm run build'),
                  ]),
                }),
              },
            })
          ),
        },
      });
    });

    test('should have CloudWatch logs enabled', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        LogsConfig: {
          CloudWatchLogs: {
            Status: 'ENABLED',
          },
        },
      });
    });

    test('should have local caching enabled', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Cache: {
          Type: 'LOCAL',
          Modes: Match.arrayWith(['LOCAL_SOURCE_CACHE', 'LOCAL_CUSTOM_CACHE']),
        },
      });
    });

    test('should have exactly 1 CodeBuild project', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should create CodeBuild IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `codebuild-nodejs-app-role-${environmentSuffix}`,
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

    test('should create CodePipeline IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `codepipeline-nodejs-app-role-${environmentSuffix}`,
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

    test('should create CloudFormation IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cloudformation-deploy-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudformation.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should have CodeBuild role with CloudWatch logs permissions', () => {
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

    test('should have CodeBuild role with S3 artifact permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have CodePipeline role with CodeCommit permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'codecommit:GetBranch',
                'codecommit:GetCommit',
                'codecommit:UploadArchive',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have CodePipeline role with CodeBuild permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have CodePipeline role with CloudFormation permissions', () => {
      // Check that at least one policy has CloudFormation permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const hasCloudFormationPerms = Object.values(policies).some((policy: any) => {
        return policy.Properties.PolicyDocument.Statement.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.some((action: string) => action.startsWith('cloudformation:'));
        });
      });
      expect(hasCloudFormationPerms).toBe(true);
    });

    test('should have at least 3 IAM roles', () => {
      // CodeBuild, CodePipeline, CloudFormation roles
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `nodejs-app-pipeline-${environmentSuffix}`,
      });
    });

    test('should have three stages: Source, Build, Deploy', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'CodeCommit_Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'CodeCommit',
                },
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'CodeBuild_Build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'CloudFormation_Deploy',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CloudFormation',
                },
              }),
            ]),
          }),
        ],
      });
    });

    test('should have Source stage configured with main branch', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: [
              Match.objectLike({
                Configuration: Match.objectLike({
                  BranchName: 'main',
                  PollForSourceChanges: false, // Using EventBridge
                }),
              }),
            ],
          }),
        ]),
      });
    });

    test('should have exactly 1 pipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });
  });

  describe('CloudWatch Event Rule', () => {
    test('should create EventBridge rule for automatic triggering', () => {
      // EventBridge rule is created automatically for CodeCommit trigger
      const eventRules = template.findResources('AWS::Events::Rule');
      const eventRuleKeys = Object.keys(eventRules);
      expect(eventRuleKeys.length).toBeGreaterThanOrEqual(1);
    });

    test('should have event rule configured for main branch commits', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codecommit'],
          'detail-type': ['CodeCommit Repository State Change'],
          detail: {
            event: ['referenceCreated', 'referenceUpdated'],
            referenceName: ['main'],
          },
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have repository clone URL output', () => {
      template.hasOutput('RepositoryCloneUrlHttp', {
        Description: Match.stringLikeRegexp('CodeCommit repository clone URL'),
      });
    });

    test('should have pipeline ARN output', () => {
      template.hasOutput('PipelineArn', {
        Description: Match.stringLikeRegexp('CodePipeline ARN'),
      });
    });

    test('should have pipeline name output', () => {
      template.hasOutput('PipelineName', {
        Description: Match.stringLikeRegexp('CodePipeline name'),
      });
    });

    test('should have artifact bucket name output', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: Match.stringLikeRegexp('S3 bucket'),
      });
    });

    test('should have build project name output', () => {
      template.hasOutput('BuildProjectName', {
        Description: Match.stringLikeRegexp('CodeBuild project'),
      });
    });

    test('should have build log group output', () => {
      template.hasOutput('BuildLogGroupName', {
        Description: Match.stringLikeRegexp('CloudWatch log group'),
      });
    });

    test('should have at least 6 outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('all resource names should include environment suffix', () => {
      const resourceTypes = [
        'AWS::CodeCommit::Repository',
        'AWS::CodeBuild::Project',
        'AWS::CodePipeline::Pipeline',
        'AWS::Logs::LogGroup',
      ];

      resourceTypes.forEach((resourceType) => {
        const resources = template.findResources(resourceType);
        Object.values(resources).forEach((resource: any) => {
          const nameProperty =
            resource.Properties.Name ||
            resource.Properties.ProjectName ||
            resource.Properties.RepositoryName ||
            resource.Properties.LogGroupName;

          if (nameProperty) {
            expect(nameProperty).toContain(environmentSuffix);
          }
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with wildcard IAM permissions on sensitive actions', () => {
      const policies = template.findResources('AWS::IAM::Policy');

      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (statement.Effect === 'Allow') {
            // PassRole with wildcard is acceptable with condition
            if (
              statement.Action.includes('iam:PassRole') &&
              statement.Condition
            ) {
              return; // This is okay
            }
            // Check for dangerous wildcards without conditions
            const hasWildcardResource =
              statement.Resource === '*' ||
              (Array.isArray(statement.Resource) &&
                statement.Resource.includes('*'));
            const hasDangerousActions =
              statement.Action.includes('iam:*') ||
              statement.Action.includes('s3:*') ||
              statement.Action.includes('*');

            if (hasWildcardResource && hasDangerousActions) {
              fail(
                `Found dangerous wildcard permissions: ${JSON.stringify(statement)}`
              );
            }
          }
        });
      });
    });

    test('S3 bucket should have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.anyValue(),
        },
      });
    });

    test('should not have any resources with RemovalPolicy.RETAIN', () => {
      // All resources should be destroyable for testing environments
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('CodeBuild should use SMALL compute type', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('S3 bucket should have lifecycle rules for cost management', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('CloudWatch logs should have retention policy', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue(),
      });
    });
  });

  describe('Integration and Dependencies', () => {
    test('CodeBuild project should reference the correct repository', () => {
      const buildProjects = template.findResources('AWS::CodeBuild::Project');
      const repositories = template.findResources(
        'AWS::CodeCommit::Repository'
      );

      expect(Object.keys(buildProjects).length).toBe(1);
      expect(Object.keys(repositories).length).toBe(1);

      // Verify the build project references the repository
      Object.values(buildProjects).forEach((project: any) => {
        expect(project.Properties.Source.Type).toBe('CODECOMMIT');
      });
    });

    test('Pipeline should reference CodeBuild project', () => {
      const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
      const buildProjects = template.findResources('AWS::CodeBuild::Project');

      Object.values(pipelines).forEach((pipeline: any) => {
        const buildStage = pipeline.Properties.Stages.find(
          (stage: any) => stage.Name === 'Build'
        );
        expect(buildStage).toBeDefined();
        expect(buildStage.Actions[0].ActionTypeId.Provider).toBe('CodeBuild');
      });
    });
  });
});
