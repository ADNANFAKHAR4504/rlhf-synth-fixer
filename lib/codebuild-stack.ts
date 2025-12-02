import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CodeBuildStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:CodeBuildStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create S3 bucket for build artifacts
    const artifactBucket = new aws.s3.Bucket(
      `codebuild-artifacts-${environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // Enable versioning using separate resource (recommended approach)
    new aws.s3.BucketVersioningV2(
      `codebuild-artifacts-versioning-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Create CloudWatch Logs group
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Create IAM policy for S3 access with complete permissions
    const s3Policy = new aws.iam.RolePolicy(
      `codebuild-s3-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:PutObject',
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:GetBucketAcl',
                  's3:GetBucketLocation',
                ],
                Resource: [`${bucketArn}/*`, bucketArn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create IAM policy for CloudWatch Logs
    const logsPolicy = new aws.iam.RolePolicy(
      `codebuild-logs-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: `${logGroupArn}:*`,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-${environmentSuffix}`,
        description: 'Automated build for Node.js applications',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.id,
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: false,
        },
        source: {
          type: 'NO_SOURCE',
          buildspec: `version: 0.2
phases:
  install:
    commands:
      - npm install
  build:
    commands:
      - npm test
      - npm run build
artifacts:
  files:
    - '**/*'
  base-directory: dist`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 900,
        tags: tags,
      },
      { parent: this, dependsOn: [s3Policy, logsPolicy] }
    );

    this.codeBuildProjectName = codeBuildProject.name;
    this.artifactBucketName = artifactBucket.id;

    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
    });
  }
}
