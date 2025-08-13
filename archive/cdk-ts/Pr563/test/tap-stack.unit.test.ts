import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('creates TapStack with correct properties', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('uses default environment suffix when not provided', () => {
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);
      
      // Check that resources are created with default suffix
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'multi-region-pipeline-dev'
      });
    });

    test('applies correct environment suffix to resources', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);
      
      // Check pipeline name includes suffix
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'multi-region-pipeline-test'
      });
    });
  });

  describe('CI/CD Pipeline Resources', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('creates CodePipeline with V2 type', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        PipelineType: 'V2',
        Name: 'multi-region-pipeline-test'
      });
    });

    test('creates pipeline with correct number of stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' })
        ])
      });
    });

    test('creates pipeline variables', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Variables: Match.arrayWith([
          Match.objectLike({
            Name: 'DEPLOY_ENVIRONMENT',
            DefaultValue: 'test'
          }),
          Match.objectLike({
            Name: 'COMMIT_ID',
            DefaultValue: 'unknown'
          })
        ])
      });
    });

    test('creates build project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'app-build-test',
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true
        })
      });
    });

    test('creates deployment projects for both regions', () => {
      // US East 1 deployment project
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'app-deploy-us-east-1-test'
      });

      // EU Central 1 deployment project
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'app-deploy-eu-central-1-test'
      });
    });
  });

  describe('S3 Artifact Buckets', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('creates artifact buckets for each region', () => {
      // Check that we have exactly 2 S3 buckets (excluding the Custom resource bucket)
      const buckets = template.findResources('AWS::S3::Bucket');
      const artifactBuckets = Object.entries(buckets).filter(([key, resource]) => 
        key.includes('ArtifactBucket')
      );
      
      expect(artifactBuckets.length).toBe(2);
      
      // Verify both buckets have versioning enabled
      artifactBuckets.forEach(([key, bucket]) => {
        expect(bucket.Properties.VersioningConfiguration).toEqual({
          Status: 'Enabled'
        });
      });
    });

    test('configures bucket lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'cleanup-old-artifacts',
              ExpirationInDays: 30,
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('enables S3 managed encryption', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toEqual({
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        });
      });
    });

    test('configures buckets with DESTROY removal policy', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('creates CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        })
      });
    });

    test('creates CodeBuild service roles', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'codebuild.amazonaws.com'
                }
              })
            ])
          }
        }
      });

      // Should have at least 3 CodeBuild roles (1 build + 2 deploy)
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(3);
    });

    test('grants cross-region S3 permissions to pipeline', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject', 's3:PutObject'])
            })
          ])
        })
      });
    });
  });

  describe('Resource Tagging', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
      });
      template = Template.fromStack(stack);
    });

    test('applies cost allocation tags to pipeline', () => {
      const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
      const pipeline = Object.values(pipelineResource)[0];
      const tags = pipeline.Properties.Tags;
      
      // Check that required tags are present
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Purpose');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('Project');
      
      // Check specific tag values
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toBe('prod');
      
      const costCenterTag = tags.find((tag: any) => tag.Key === 'CostCenter');
      expect(costCenterTag.Value).toBe('Engineering');
    });

    test('applies tags to S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment' }),
            expect.objectContaining({ Key: 'CostCenter', Value: 'Engineering' }),
            expect.objectContaining({ Key: 'Purpose', Value: 'CI/CD Artifacts' })
          ])
        );
      });
    });

    test('applies tags to CodeBuild projects', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      Object.values(projects).forEach(project => {
        expect(project.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment' }),
            expect.objectContaining({ Key: 'CostCenter', Value: 'Engineering' })
          ])
        );
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('outputs pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CI/CD Pipeline'
      });
    });

    test('outputs pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Description: 'ARN of the CI/CD Pipeline'
      });
    });
  });

  describe('Multi-Region Configuration', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('configures deployment for us-east-1 and eu-central-1', () => {
      // Check deployment actions in pipeline
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({ Name: 'Deploy-us-east-1' }),
              Match.objectLike({ Name: 'Deploy-eu-central-1' })
            ])
          })
        ])
      });
    });

    test('sets parallel deployment with runOrder 1', () => {
      const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
      const pipeline = Object.values(pipelineResource)[0];
      const deployStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Deploy');
      
      deployStage.Actions.forEach((action: any) => {
        expect(action.RunOrder).toBe(1);
      });
    });
  });
});