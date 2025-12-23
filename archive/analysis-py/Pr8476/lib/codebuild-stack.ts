/**
 * CodeBuild Stack - Two CodeBuild projects for unit tests and Docker builds
 *
 * This stack creates:
 * - Unit Test Project: Runs unit tests with separate buildspec
 * - Docker Build Project: Builds and pushes Docker images with separate buildspec
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildStackArgs {
  environmentSuffix: string;
  region: string;
  serviceRole: pulumi.Output<string>;
  artifactBucket: pulumi.Output<string>;
  unitTestLogGroup: pulumi.Output<string>;
  dockerBuildLogGroup: pulumi.Output<string>;
  dockerRegistrySecretArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CodeBuildStack extends pulumi.ComponentResource {
  public readonly unitTestProjectName: pulumi.Output<string>;
  public readonly unitTestProjectArn: pulumi.Output<string>;
  public readonly dockerBuildProjectName: pulumi.Output<string>;
  public readonly dockerBuildProjectArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CodeBuildStack', name, args, opts);

    // Unit Test Buildspec
    const unitTestBuildspec = `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies..."
      - npm ci
  pre_build:
    commands:
      - echo "Running linting..."
      - npm run lint || true
  build:
    commands:
      - echo "Running unit tests..."
      - npm run test:unit
      - echo "Unit tests completed"
  post_build:
    commands:
      - echo "Generating test coverage report..."
      - npm run test:coverage || true

reports:
  unit-test-reports:
    files:
      - 'coverage/lcov-report/**/*'
    file-format: 'JUNITXML'

artifacts:
  files:
    - '**/*'
  name: unit-test-artifact

cache:
  paths:
    - 'node_modules/**/*'
`;

    // Docker Build Buildspec
    const dockerBuildBuildspec = `version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging in to Docker registry..."
      - export DOCKER_REGISTRY_CREDENTIALS=$(aws secretsmanager get-secret-value --secret-id docker-registry-credentials-${args.environmentSuffix} --query SecretString --output text)
      - export DOCKER_USERNAME=$(echo $DOCKER_REGISTRY_CREDENTIALS | jq -r '.username')
      - export DOCKER_PASSWORD=$(echo $DOCKER_REGISTRY_CREDENTIALS | jq -r '.password')
      - export DOCKER_REGISTRY=$(echo $DOCKER_REGISTRY_CREDENTIALS | jq -r '.registry')
      - echo $DOCKER_PASSWORD | docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME --password-stdin
      - echo "Logged in to Docker registry"
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $DOCKER_REGISTRY/payment-service:$IMAGE_TAG .
      - docker tag $DOCKER_REGISTRY/payment-service:$IMAGE_TAG $DOCKER_REGISTRY/payment-service:latest
  post_build:
    commands:
      - echo "Pushing Docker image..."
      - docker push $DOCKER_REGISTRY/payment-service:$IMAGE_TAG
      - docker push $DOCKER_REGISTRY/payment-service:latest
      - echo "Docker image pushed successfully"
      - printf '[{"name":"payment-service","imageUri":"%s"}]' $DOCKER_REGISTRY/payment-service:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - appspec.yaml
    - taskdef.json
`;

    // Unit Test CodeBuild Project
    const unitTestProject = new aws.codebuild.Project(
      `unit-test-project-${args.environmentSuffix}`,
      {
        name: `unit-test-project-${args.environmentSuffix}`,
        description: 'CodeBuild project for running unit tests',
        serviceRole: args.serviceRole,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: false,
          environmentVariables: [
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: args.environmentSuffix,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: args.region,
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: unitTestBuildspec,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: args.unitTestLogGroup,
            streamName: 'unit-test-build',
          },
        },
        cache: {
          type: 'S3',
          location: pulumi.interpolate`${args.artifactBucket}/build-cache`,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Docker Build CodeBuild Project
    const dockerBuildProject = new aws.codebuild.Project(
      `docker-build-project-${args.environmentSuffix}`,
      {
        name: `docker-build-project-${args.environmentSuffix}`,
        description: 'CodeBuild project for building Docker images',
        serviceRole: args.serviceRole,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_MEDIUM',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: args.environmentSuffix,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: args.region,
            },
            {
              name: 'DOCKER_REGISTRY_SECRET_ARN',
              value: args.dockerRegistrySecretArn,
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: dockerBuildBuildspec,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: args.dockerBuildLogGroup,
            streamName: 'docker-build',
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    this.unitTestProjectName = unitTestProject.name;
    this.unitTestProjectArn = unitTestProject.arn;
    this.dockerBuildProjectName = dockerBuildProject.name;
    this.dockerBuildProjectArn = dockerBuildProject.arn;

    this.registerOutputs({
      unitTestProjectName: this.unitTestProjectName,
      unitTestProjectArn: this.unitTestProjectArn,
      dockerBuildProjectName: this.dockerBuildProjectName,
      dockerBuildProjectArn: this.dockerBuildProjectArn,
    });
  }
}
