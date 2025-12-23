/**
 * CodePipeline Stack - Main CI/CD pipeline orchestration
 *
 * This stack creates a CodePipeline with 5 distinct stages:
 * 1. Source: Pull from GitHub
 * 2. Build: Run unit tests
 * 3. Test: Build Docker image
 * 4. Approval: Manual approval for production
 * 5. Deploy: Deploy to ECS using CodeDeploy
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodePipelineStackArgs {
  environmentSuffix: string;
  region: string;
  serviceRole: pulumi.Output<string>;
  artifactBucket: pulumi.Output<string>;
  githubRepo: string;
  githubBranch: string;
  githubOwner: string;
  unitTestProjectName: pulumi.Output<string>;
  dockerBuildProjectName: pulumi.Output<string>;
  codeDeployApplicationName: pulumi.Output<string>;
  codeDeployDeploymentGroupName: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CodePipelineStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodePipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CodePipelineStack', name, args, opts);

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `payment-service-pipeline-${args.environmentSuffix}`,
      {
        name: `payment-service-pipeline-${args.environmentSuffix}`,
        roleArn: args.serviceRole,

        artifactStores: [
          {
            location: args.artifactBucket,
            type: 'S3',
          },
        ],

        stages: [
          // Stage 1: Source
          {
            name: 'Source',
            actions: [
              {
                name: 'GitHubSource',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['SourceOutput'],
                configuration: {
                  Owner: args.githubOwner,
                  Repo: args.githubRepo,
                  Branch: args.githubBranch,
                  OAuthToken: pulumi.secret(
                    process.env.GITHUB_TOKEN ||
                      '{{resolve:secretsmanager:github-token}}'
                  ),
                },
              },
            ],
          },

          // Stage 2: Unit Tests
          {
            name: 'UnitTest',
            actions: [
              {
                name: 'RunUnitTests',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['SourceOutput'],
                outputArtifacts: ['UnitTestOutput'],
                configuration: {
                  ProjectName: args.unitTestProjectName,
                },
              },
            ],
          },

          // Stage 3: Docker Build
          {
            name: 'DockerBuild',
            actions: [
              {
                name: 'BuildDockerImage',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['SourceOutput'],
                outputArtifacts: ['DockerBuildOutput'],
                configuration: {
                  ProjectName: args.dockerBuildProjectName,
                },
              },
            ],
          },

          // Stage 4: Manual Approval
          {
            name: 'ManualApproval',
            actions: [
              {
                name: 'ApproveDeployment',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  NotificationArn: args.snsTopicArn,
                  CustomData: pulumi.interpolate`Please review the changes and approve deployment to production for ${args.environmentSuffix}`,
                },
              },
            ],
          },

          // Stage 5: Deploy
          {
            name: 'Deploy',
            actions: [
              {
                name: 'DeployToECS',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'CodeDeployToECS',
                version: '1',
                inputArtifacts: ['DockerBuildOutput'],
                configuration: {
                  ApplicationName: args.codeDeployApplicationName,
                  DeploymentGroupName: args.codeDeployDeploymentGroupName,
                  TaskDefinitionTemplateArtifact: 'DockerBuildOutput',
                  TaskDefinitionTemplatePath: 'taskdef.json',
                  AppSpecTemplateArtifact: 'DockerBuildOutput',
                  AppSpecTemplatePath: 'appspec.yaml',
                },
              },
            ],
          },
        ],

        tags: args.tags,
      },
      { parent: this }
    );

    // EventBridge Rule for Pipeline State Changes
    const pipelineStateChangeRule = new aws.cloudwatch.EventRule(
      `pipeline-state-change-rule-${args.environmentSuffix}`,
      {
        name: `pipeline-state-change-${args.environmentSuffix}`,
        description: 'Capture pipeline state changes',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"],
    "state": ["FAILED", "SUCCEEDED"]
  }
}`,
        tags: args.tags,
      },
      { parent: this }
    );

    // EventBridge Target for SNS
    new aws.cloudwatch.EventTarget(
      `pipeline-state-change-target-${args.environmentSuffix}`,
      {
        rule: pipelineStateChangeRule.name,
        arn: args.snsTopicArn,
        inputTransformer: {
          inputPaths: {
            pipeline: '$.detail.pipeline',
            state: '$.detail.state',
            executionId: '$.detail.execution-id',
          },
          inputTemplate:
            '"Pipeline <pipeline> has <state>. Execution ID: <executionId>"',
        },
      },
      { parent: this }
    );

    this.pipelineArn = pipeline.arn;
    this.pipelineName = pipeline.name;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      pipelineName: this.pipelineName,
    });
  }
}
