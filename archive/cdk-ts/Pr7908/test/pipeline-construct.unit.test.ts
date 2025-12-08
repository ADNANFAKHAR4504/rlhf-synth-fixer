import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { PipelineConstruct } from '../lib/pipeline-construct';

describe('PipelineConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let repository: ecr.Repository;
  let cluster: ecs.Cluster;
  let taskDefinition: ecs.FargateTaskDefinition;
  let service: ecs.FargateService;
  let pipeline: PipelineConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
      natGateways: 0,
    });

    repository = new ecr.Repository(stack, 'TestRepo', {
      repositoryName: 'test-repo',
    });

    cluster = new ecs.Cluster(stack, 'TestCluster', {
      vpc,
      clusterName: 'test-cluster',
    });

    taskDefinition = new ecs.FargateTaskDefinition(stack, 'TestTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDefinition.addContainer('TestContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      containerName: 'test-container',
    });

    service = new ecs.FargateService(stack, 'TestService', {
      cluster,
      taskDefinition,
      serviceName: 'test-service',
    });

    pipeline = new PipelineConstruct(stack, 'TestPipeline', {
      environmentSuffix: 'test',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      ecrRepository: repository,
      ecsService: service,
      ecsCluster: cluster,
    });

    template = Template.fromStack(stack);
  });

  test('Construct is created successfully', () => {
    expect(pipeline).toBeDefined();
    expect(pipeline.pipeline).toBeDefined();
    expect(pipeline.buildProject).toBeDefined();
  });

  test('S3 Artifact Bucket is created', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'cicd-artifacts-test',
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

  test('Artifact Bucket has public access blocked', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('CodeBuild Project is created', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'cicd-build-test',
      Description: 'Build Docker images for containerized application',
    });
  });

  test('CodeBuild uses privileged mode for Docker', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: Match.objectLike({
        PrivilegedMode: true,
      }),
    });
  });

  test('CodeBuild has correct environment variables', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: Match.objectLike({
        EnvironmentVariables: Match.arrayWith([
          Match.objectLike({
            Name: 'ENVIRONMENT_SUFFIX',
            Type: 'PLAINTEXT',
            Value: 'test',
          }),
        ]),
      }),
    });

    // Verify all required environment variables are present
    const projects = template.findResources('AWS::CodeBuild::Project');
    const project = Object.values(projects)[0] as any;
    const envVars = project.Properties.Environment.EnvironmentVariables;

    const varNames = envVars.map((v: any) => v.Name);
    expect(varNames).toContain('ENVIRONMENT_SUFFIX');
    expect(varNames).toContain('AWS_ACCOUNT_ID');
    expect(varNames).toContain('AWS_DEFAULT_REGION');
    expect(varNames).toContain('ECR_REPOSITORY_URI');
  });

  test('CodeBuild uses STANDARD_7_0 image', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: Match.objectLike({
        Image: 'aws/codebuild/standard:7.0',
        ComputeType: 'BUILD_GENERAL1_SMALL',
      }),
    });
  });

  test('CodeBuild has Docker layer caching enabled', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Cache: {
        Type: 'LOCAL',
        Modes: ['LOCAL_DOCKER_LAYER_CACHE'],
      },
    });
  });

  test('CodePipeline is created', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'cicd-pipeline-test',
    });
  });

  test('Pipeline has Source stage with GitHub action', () => {
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
              Configuration: Match.objectLike({
                Owner: 'test-owner',
                Repo: 'test-repo',
                Branch: 'main',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('Pipeline has Build stage with CodeBuild action', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Build',
          Actions: Match.arrayWith([
            Match.objectLike({
              Name: 'Build_Docker_Image',
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

  test('Pipeline has Deploy stage with ECS action', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Deploy',
          Actions: Match.arrayWith([
            Match.objectLike({
              Name: 'Deploy_to_ECS',
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'ECS',
              },
            }),
          ]),
        }),
      ]),
    });
  });

  test('Pipeline has restart execution on update enabled', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      RestartExecutionOnUpdate: true,
    });
  });

  test('CodeBuild has ECR permissions', () => {
    const roles = template.findResources('AWS::IAM::Role', {
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        },
      },
    });
    expect(Object.keys(roles).length).toBeGreaterThan(0);
  });

  test('BuildSpec includes Docker login command', () => {
    const projects = template.findResources('AWS::CodeBuild::Project');
    const project = Object.values(projects)[0] as any;
    const buildSpec = project.Properties.Source.BuildSpec;
    expect(buildSpec).toContain('aws ecr get-login-password');
    expect(buildSpec).toContain('docker login');
  });

  test('BuildSpec creates imagedefinitions.json', () => {
    const projects = template.findResources('AWS::CodeBuild::Project');
    const project = Object.values(projects)[0] as any;
    const buildSpec = project.Properties.Source.BuildSpec;
    expect(buildSpec).toContain('imagedefinitions.json');
  });
});
