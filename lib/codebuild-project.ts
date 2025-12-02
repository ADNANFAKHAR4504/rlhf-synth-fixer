/**
 * codebuild-project.ts
 *
 * Creates CodeBuild project with IAM role, CloudWatch Logs, and proper configuration
 * for Node.js application builds.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildProjectArgs {
  environmentSuffix: string;
  artifactBucketName: pulumi.Output<string>;
  artifactBucketArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CodeBuildProject extends pulumi.ComponentResource {
  public readonly projectName: pulumi.Output<string>;
  public readonly projectArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildProjectArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codebuild:CodeBuildProject', name, {}, opts);

    // Create CloudWatch Logs group for build output
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${args.environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${args.environmentSuffix}`,
        retentionInDays: 7, // 7-day retention for cost optimization
        tags: args.tags,
      },
      { parent: this }
    );

    // Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${args.environmentSuffix}`,
      {
        name: `codebuild-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Create IAM policy for S3 access
    const s3Policy = new aws.iam.RolePolicy(
      `codebuild-s3-policy-${args.environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([args.artifactBucketArn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:PutObject',
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:ListBucket',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create IAM policy for CloudWatch Logs access
    const logsPolicy = new aws.iam.RolePolicy(
      `codebuild-logs-policy-${args.environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: [logGroupArn, `${logGroupArn}:*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create CodeBuild project
    const project = new aws.codebuild.Project(
      `nodejs-build-${args.environmentSuffix}`,
      {
        name: `nodejs-build-${args.environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: args.artifactBucketName,
          namespaceType: 'BUILD_ID',
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL', // 3 GB memory
          image: 'aws/codebuild/standard:6.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'NODE_ENV',
              value: 'production',
              type: 'PLAINTEXT',
            },
            {
              name: 'BUILD_NUMBER',
              value: '#{CODEBUILD_BUILD_NUMBER}',
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'NO_SOURCE',
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Building application..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed on \`date\`"
artifacts:
  files:
    - '**/*'
  name: build-artifact-$BUILD_NUMBER
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 15, // 15 minutes timeout
        tags: args.tags,
      },
      {
        parent: this,
        dependsOn: [s3Policy, logsPolicy],
      }
    );

    this.projectName = project.name;
    this.projectArn = project.arn;

    this.registerOutputs({
      projectName: this.projectName,
      projectArn: this.projectArn,
    });
  }
}
