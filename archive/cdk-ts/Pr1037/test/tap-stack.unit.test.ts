import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvSuffix = 'unittest';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${testEnvSuffix}`, { 
      environmentSuffix: testEnvSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with correct configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `Encryption key for trainr241-${testEnvSuffix} CI/CD pipeline`,
      });
    });

    test('should create KMS alias with correct naming', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/trainr241-${testEnvSuffix}-pipeline-key`,
      });
    });
  });

  describe('S3 Artifacts Bucket', () => {
    test('should create S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should follow naming convention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `trainr241-${testEnvSuffix}-artifacts-123456789012`,
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create build log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/trainr241-${testEnvSuffix}-build`,
        RetentionInDays: 7,
      });
    });

    test('should create test log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/trainr241-${testEnvSuffix}-test`,
        RetentionInDays: 7,
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create CodeBuild role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `trainr241-${testEnvSuffix}-codebuild-role`,
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

    test('should create CodePipeline role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `trainr241-${testEnvSuffix}-pipeline-role`,
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

    test('CodeBuild role should have SSM parameter access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `trainr241-${testEnvSuffix}-codebuild-role`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                  Effect: 'Allow',
                }),
              ]),
            },
          }),
        ]),
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create build project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `trainr241-${testEnvSuffix}-build`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: true,
        },
      });
    });

    test('should create test project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `trainr241-${testEnvSuffix}-test`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: false,
        },
      });
    });

    test('should create staging deployment project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `trainr241-${testEnvSuffix}-deploy-staging`,
      });
    });

    test('should create production deployment project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `trainr241-${testEnvSuffix}-deploy-prod`,
      });
    });

    test('all CodeBuild projects should use encryption', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      expect(Object.keys(projects).length).toBe(4); // Build, Test, Staging, Production
      
      Object.values(projects).forEach(project => {
        expect(project.Properties).toHaveProperty('EncryptionKey');
      });
    });
  });

  describe('CodePipeline Configuration', () => {
    test('should create pipeline with V2 type', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        PipelineType: 'V2',
        Name: `trainr241-${testEnvSuffix}-pipeline`,
      });
    });

    test('should use QUEUED execution mode', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ExecutionMode: 'QUEUED',
      });
    });

    test('should have exactly 6 stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Test' }),
          Match.objectLike({ Name: 'DeployStaging' }),
          Match.objectLike({ Name: 'ApprovalGate' }),
          Match.objectLike({ Name: 'DeployProduction' }),
        ]),
      });

      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const stages = Object.values(pipeline)[0].Properties.Stages;
      expect(stages).toHaveLength(6);
    });

    test('should have manual approval action in ApprovalGate stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'ApprovalGate',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                  Version: '1',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should use S3 source action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                },
                Configuration: {
                  S3ObjectKey: 'source.zip',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create environment parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/trainr241/${testEnvSuffix}/environment`,
        Value: testEnvSuffix,
        Description: `Environment suffix for trainr241 pipeline`,
      });
    });

    test('should create pipeline name parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/trainr241/${testEnvSuffix}/pipeline-name`,
        Description: `Pipeline name for trainr241 ${testEnvSuffix} environment`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CodePipeline',
      });
    });

    test('should output artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {
        Description: 'Name of the artifacts S3 bucket',
      });
    });

    test('should output build project name', () => {
      template.hasOutput('BuildProjectName', {
        Description: 'Name of the CodeBuild project for building',
      });
    });

    test('should output test project name', () => {
      template.hasOutput('TestProjectName', {
        Description: 'Name of the CodeBuild project for testing',
      });
    });

    test('should output pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Description: 'ARN of the CodePipeline',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce least privilege for CodeBuild', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `trainr241-${testEnvSuffix}-codebuild-role`,
        },
      });
      
      expect(Object.keys(roles).length).toBe(1);
      const role = Object.values(roles)[0];
      
      // Check that policies are scoped appropriately
      role.Properties.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          // SSM parameters should be scoped to trainr241 prefix
          if (statement.Action?.includes('ssm:GetParameter')) {
            expect(typeof statement.Resource === 'string' ? [statement.Resource] : statement.Resource).toEqual(
              expect.arrayContaining([
                expect.stringContaining('/trainr241/'),
              ])
            );
          }
        });
      });
    });

    test('should use KMS encryption for all resources', () => {
      // Check S3 bucket encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
      });

      // Check pipeline artifact store encryption
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: Match.objectLike({
          EncryptionKey: Match.objectLike({
            Type: 'KMS',
          }),
        }),
      });
    });

    test('should set removal policy to DESTROY for test resources', () => {
      // Check S3 bucket
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });

      // Check log groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow trainr241-{env}-{type} naming', () => {
      // Check CodeBuild projects
      const projects = template.findResources('AWS::CodeBuild::Project');
      Object.values(projects).forEach(project => {
        expect(project.Properties.Name).toMatch(/^trainr241-unittest-/);
      });

      // Check pipeline
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp('^trainr241-unittest-'),
      });

      // Check IAM roles
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach(role => {
        if (role.Properties.RoleName) {
          expect(
            role.Properties.RoleName.startsWith('trainr241-unittest-') ||
            role.Properties.RoleName.startsWith('Custom')
          ).toBeTruthy();
        }
      });
    });
  });

  describe('Pipeline Stage Configuration', () => {
    test('Build stage should use CodeBuild action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
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

    test('Test stage should use CodeBuild action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Test',
            Actions: Match.arrayWith([
              Match.objectLike({
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

    test('Deployment stages should use CodeBuild for deployment', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'DeployStaging',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'DeployProduction',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });
});