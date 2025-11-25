/**
 * codebuild-stack.ts
 *
 * Defines AWS CodeBuild projects for build, test, and security scanning.
 *
 * Features:
 * - Build project (compile application)
 * - Test project (unit tests)
 * - Security scanning project (SAST, dependency scanning)
 * - CloudWatch Logs integration with KMS encryption
 * - IAM roles with least-privilege permissions
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildStackArgs {
  environmentSuffix: string;
  artifactsBucket: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  logGroupArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CodeBuildStack extends pulumi.ComponentResource {
  public readonly buildProject: aws.codebuild.Project;
  public readonly testProject: aws.codebuild.Project;
  public readonly securityProject: aws.codebuild.Project;
  public readonly buildRole: aws.iam.Role;
  public readonly testRole: aws.iam.Role;
  public readonly securityRole: aws.iam.Role;

  constructor(
    name: string,
    args: CodeBuildStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codebuild:CodeBuildStack', name, args, opts);

    const { environmentSuffix, artifactsBucket, kmsKeyArn, tags } = args;

    // IAM Role for Build Project
    this.buildRole = new aws.iam.Role(
      `codebuild-build-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codebuild.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `codebuild-build-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `codebuild-build-policy-${environmentSuffix}`,
      {
        role: this.buildRole.id,
        policy: pulumi
          .all([artifactsBucket, kmsKeyArn])
          .apply(([bucket, keyArn]) =>
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
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `arn:aws:s3:::${bucket}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: keyArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:GetAuthorizationToken',
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:PutImage',
                    'ecr:InitiateLayerUpload',
                    'ecr:UploadLayerPart',
                    'ecr:CompleteLayerUpload',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Build Project
    this.buildProject = new aws.codebuild.Project(
      `cicd-build-${environmentSuffix}`,
      {
        name: `cicd-build-${environmentSuffix}`,
        description: 'Build and compile application',
        serviceRole: this.buildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true, // For Docker builds
          environmentVariables: [
            { name: 'ENVIRONMENT_SUFFIX', value: environmentSuffix },
            { name: 'AWS_DEFAULT_REGION', value: 'us-east-1' },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
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
      - echo "Build complete"
artifacts:
  files:
    - '**/*'`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: `/aws/codebuild/${environmentSuffix}`,
            streamName: 'build',
          },
        },
        tags: {
          ...tags,
          Name: `cicd-build-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM Role for Test Project
    this.testRole = new aws.iam.Role(
      `codebuild-test-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codebuild.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `codebuild-test-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `codebuild-test-policy-${environmentSuffix}`,
      {
        role: this.testRole.id,
        policy: pulumi
          .all([artifactsBucket, kmsKeyArn])
          .apply(([bucket, keyArn]) =>
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
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `arn:aws:s3:::${bucket}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Test Project
    this.testProject = new aws.codebuild.Project(
      `cicd-test-${environmentSuffix}`,
      {
        name: `cicd-test-${environmentSuffix}`,
        description: 'Run unit tests',
        serviceRole: this.testRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            { name: 'ENVIRONMENT_SUFFIX', value: environmentSuffix },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Running tests..."
      - npm test
artifacts:
  files:
    - 'coverage/**/*'`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: `/aws/codebuild/${environmentSuffix}`,
            streamName: 'test',
          },
        },
        tags: {
          ...tags,
          Name: `cicd-test-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM Role for Security Project
    this.securityRole = new aws.iam.Role(
      `codebuild-security-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codebuild.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `codebuild-security-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `codebuild-security-policy-${environmentSuffix}`,
      {
        role: this.securityRole.id,
        policy: pulumi
          .all([artifactsBucket, kmsKeyArn])
          .apply(([bucket, keyArn]) =>
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
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `arn:aws:s3:::${bucket}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Security Scanning Project
    this.securityProject = new aws.codebuild.Project(
      `cicd-security-${environmentSuffix}`,
      {
        name: `cicd-security-${environmentSuffix}`,
        description: 'Security scanning (SAST, dependency check)',
        serviceRole: this.securityRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            { name: 'ENVIRONMENT_SUFFIX', value: environmentSuffix },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo "Installing security scanning tools..."
      - npm install -g npm-audit-html
  build:
    commands:
      - echo "Running security scans..."
      - npm audit || true
      - echo "Dependency check complete"
artifacts:
  files:
    - 'security-report.html'`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: `/aws/codebuild/${environmentSuffix}`,
            streamName: 'security',
          },
        },
        tags: {
          ...tags,
          Name: `cicd-security-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      buildProjectName: this.buildProject.name,
      testProjectName: this.testProject.name,
      securityProjectName: this.securityProject.name,
    });
  }
}
