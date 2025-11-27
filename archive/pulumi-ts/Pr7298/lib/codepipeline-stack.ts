/**
 * codepipeline-stack.ts
 *
 * Defines AWS CodePipeline with 5 stages: Source, Build, Test, Security, Deploy.
 *
 * Features:
 * - CodeCommit source stage
 * - CodeBuild stages for build, test, security
 * - Manual approval before deployment
 * - Lambda invoke for blue-green deployment
 * - KMS encryption for artifacts
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodePipelineStackArgs {
  environmentSuffix: string;
  repositoryName: pulumi.Input<string>;
  artifactsBucket: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  buildProjectName: pulumi.Input<string>;
  testProjectName: pulumi.Input<string>;
  securityProjectName: pulumi.Input<string>;
  deployFunctionName: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CodePipelineStack extends pulumi.ComponentResource {
  public readonly pipeline: aws.codepipeline.Pipeline;
  public readonly pipelineRole: aws.iam.Role;

  constructor(
    name: string,
    args: CodePipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codepipeline:CodePipelineStack', name, args, opts);

    const {
      environmentSuffix,
      repositoryName,
      artifactsBucket,
      kmsKeyArn,
      buildProjectName,
      testProjectName,
      securityProjectName,
      deployFunctionName,
      tags,
    } = args;

    // Pipeline role
    this.pipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codepipeline.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `codepipeline-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: this.pipelineRole.id,
        policy: pulumi
          .all([artifactsBucket, kmsKeyArn, deployFunctionName])
          .apply(([bucket, keyArn, funcName]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetBucketLocation',
                  ],
                  Resource: [
                    `arn:aws:s3:::${bucket}`,
                    `arn:aws:s3:::${bucket}/*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'codecommit:GetBranch',
                    'codecommit:GetCommit',
                    'codecommit:UploadArchive',
                    'codecommit:GetUploadArchiveStatus',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['lambda:InvokeFunction'],
                  Resource: `arn:aws:lambda:*:*:function:${funcName}`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create Pipeline
    this.pipeline = new aws.codepipeline.Pipeline(
      `cicd-pipeline-${environmentSuffix}`,
      {
        name: `cicd-pipeline-${environmentSuffix}`,
        roleArn: this.pipelineRole.arn,
        artifactStores: [
          {
            location: artifactsBucket,
            type: 'S3',
            encryptionKey: {
              id: kmsKeyArn,
              type: 'KMS',
            },
          },
        ],
        stages: [
          // Stage 1: Source
          {
            name: 'Source',
            actions: [
              {
                name: 'SourceAction',
                category: 'Source',
                owner: 'AWS',
                provider: 'CodeCommit',
                version: '1',
                outputArtifacts: ['SourceOutput'],
                configuration: {
                  RepositoryName: repositoryName,
                  BranchName: 'main',
                  PollForSourceChanges: 'false', // Use EventBridge instead
                },
              },
            ],
          },
          // Stage 2: Build
          {
            name: 'Build',
            actions: [
              {
                name: 'BuildAction',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['SourceOutput'],
                outputArtifacts: ['BuildOutput'],
                configuration: {
                  ProjectName: buildProjectName,
                },
              },
            ],
          },
          // Stage 3: Test
          {
            name: 'Test',
            actions: [
              {
                name: 'TestAction',
                category: 'Test',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['BuildOutput'],
                outputArtifacts: ['TestOutput'],
                configuration: {
                  ProjectName: testProjectName,
                },
              },
            ],
          },
          // Stage 4: Security
          {
            name: 'Security',
            actions: [
              {
                name: 'SecurityScanAction',
                category: 'Test',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['BuildOutput'],
                outputArtifacts: ['SecurityOutput'],
                configuration: {
                  ProjectName: securityProjectName,
                },
              },
            ],
          },
          // Stage 5: Approval + Deploy
          {
            name: 'Deploy',
            actions: [
              {
                name: 'ManualApproval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  CustomData:
                    'Please review the build and security scan results before deploying.',
                },
                runOrder: 1,
              },
              {
                name: 'DeployAction',
                category: 'Invoke',
                owner: 'AWS',
                provider: 'Lambda',
                version: '1',
                inputArtifacts: ['BuildOutput'],
                configuration: {
                  FunctionName: deployFunctionName,
                },
                runOrder: 2,
              },
            ],
          },
        ],
        tags: {
          ...tags,
          Name: `cicd-pipeline-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EventBridge rule to trigger pipeline on CodeCommit changes
    const triggerRule = new aws.cloudwatch.EventRule(
      `pipeline-trigger-rule-${environmentSuffix}`,
      {
        name: `cicd-pipeline-trigger-${environmentSuffix}`,
        description: 'Trigger pipeline on CodeCommit push to main branch',
        eventPattern: pulumi.interpolate`{
          "source": ["aws.codecommit"],
          "detail-type": ["CodeCommit Repository State Change"],
          "detail": {
            "event": ["referenceCreated", "referenceUpdated"],
            "repositoryName": ["${repositoryName}"],
            "referenceName": ["main"]
          }
        }`,
      },
      { parent: this }
    );

    const triggerRole = new aws.iam.Role(
      `pipeline-trigger-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'events.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `pipeline-trigger-policy-${environmentSuffix}`,
      {
        role: triggerRole.id,
        policy: this.pipeline.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['codepipeline:StartPipelineExecution'],
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-trigger-target-${environmentSuffix}`,
      {
        rule: triggerRule.name,
        arn: this.pipeline.arn,
        roleArn: triggerRole.arn,
      },
      { parent: this }
    );

    this.registerOutputs({
      pipelineName: this.pipeline.name,
      pipelineArn: this.pipeline.arn,
    });
  }
}
