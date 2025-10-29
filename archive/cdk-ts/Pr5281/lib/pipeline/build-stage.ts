import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SecurityConfig } from '../security/secrets-config';

export interface BuildStageProps {
  config: any;
  artifactsBucket: s3.Bucket;
  ecrRepository: ecr.Repository;
  securityConfig: SecurityConfig;
  removalPolicy: cdk.RemovalPolicy;
}

export class BuildStage extends Construct {
  public readonly buildProject: codebuild.PipelineProject;
  public readonly testProject: codebuild.PipelineProject;

  constructor(scope: Construct, id: string, props: BuildStageProps) {
    super(scope, id);

    const { config, artifactsBucket, ecrRepository, securityConfig } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create CodeBuild service role
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: resourceName('codebuild-role'),
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        CodeBuildPolicy: this.createCodeBuildPolicy(
          artifactsBucket.bucketArn,
          securityConfig
        ),
      },
    });

    // Build project for TypeScript compilation and Docker packaging
    this.buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: resourceName('build-project'),
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true, // Required for Docker
        environmentVariables: {
          AWS_ACCOUNT_ID: { value: cdk.Aws.ACCOUNT_ID },
          AWS_REGION: { value: cdk.Aws.REGION },
          ENVIRONMENT: { value: config.environmentSuffix },
          IMAGE_TAG: { value: 'latest' },
          DOCKER_REGISTRY: {
            value: `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com`,
          },
          ECR_REPOSITORY_URI: { value: ecrRepository.repositoryUri },
          IMAGE_REPO: { value: ecrRepository.repositoryName },
        },
      },
      cache: codebuild.Cache.bucket(artifactsBucket, {
        prefix: 'build-cache',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'echo Installing dependencies...',
              'npm install -g typescript',
            ],
          },
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'echo "Docker Registry: $DOCKER_REGISTRY"',
              'echo "AWS Region: $AWS_REGION"',
              'echo "ECR Repository URI: $ECR_REPOSITORY_URI"',
              'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $DOCKER_REGISTRY',
              'echo "ECR login successful"',
              'echo Retrieving secrets from Secrets Manager...',
              `export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id ${securityConfig.dbSecret.secretName} --query SecretString --output text | jq -r .password)`,
              `export API_KEY=$(aws secretsmanager get-secret-value --secret-id ${securityConfig.apiKeySecret.secretName} --query SecretString --output text | jq -r .apiKey)`,
            ],
          },
          build: {
            commands: [
              'echo Building TypeScript application...',
              'npm install && npm run build',
              'echo Building Docker image...',
              'docker build -t $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG .',
              'docker tag $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG $DOCKER_REGISTRY/$IMAGE_REPO:$CODEBUILD_BUILD_NUMBER',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing Docker image to ECR...',
              'docker push $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG',
              'docker push $DOCKER_REGISTRY/$IMAGE_REPO:$CODEBUILD_BUILD_NUMBER',
              'echo Creating Dockerrun.aws.json for Elastic Beanstalk...',
              'printf \'{"AWSEBDockerrunVersion":"1","Image":{"Name":"%s","Update":"true"},"Ports":[{"ContainerPort":"3000"}]}\' $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG > Dockerrun.aws.json',
            ],
          },
        },
        artifacts: {
          files: [
            'Dockerrun.aws.json',
            'dist/**/*',
            'package.json',
            'package-lock.json',
          ],
          name: 'BuildArtifact',
        },
        cache: {
          paths: ['node_modules/**/*'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new cdk.aws_logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/${resourceName('build-project')}`,
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
            removalPolicy: props.removalPolicy,
          }),
        },
      },
    });

    // Test project for running unit tests
    this.testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: resourceName('test-project'),
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: ['npm ci'],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm test -- --coverage --watchAll=false',
            ],
          },
        },
        // TODO: Add reports for test coverage and test results once we have tests
        // reports: {
        //   coverage_report: {
        //     files: ['coverage/lcov.info'],
        //     'file-format': 'LCOV',
        //   },
        //   test_report: {
        //     files: ['test-results/**/*.xml'],
        //     'file-format': 'JUNITXML',
        //   },
        // },
        // TODO: Add artifacts for test reports and coverage once we have tests
        // artifacts: {
        //   files: ['coverage/**/*', 'test-results/**/*'],
        //   name: 'TestArtifact',
        // },
      }),
    });

    // Add construct outputs
    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: this.buildProject.projectName,
      description: 'Name of the CodeBuild build project',
      exportName: `${resourceName('build-project-name')}`,
    });

    new cdk.CfnOutput(this, 'TestProjectName', {
      value: this.testProject.projectName,
      description: 'Name of the CodeBuild test project',
      exportName: `${resourceName('test-project-name')}`,
    });

    new cdk.CfnOutput(this, 'CodeBuildRoleArn', {
      value: codeBuildRole.roleArn,
      description: 'ARN of the CodeBuild IAM role',
      exportName: `${resourceName('codebuild-role-arn')}`,
    });
  }

  private createCodeBuildPolicy(
    artifactsBucketArn: string,
    securityConfig: SecurityConfig
  ): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          resources: [artifactsBucketArn, `${artifactsBucketArn}/*`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['secretsmanager:GetSecretValue'],
          resources: [
            securityConfig.dbSecret.secretArn,
            securityConfig.apiKeySecret.secretArn,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'ecr:PutImage',
            'ecr:InitiateLayerUpload',
            'ecr:UploadLayerPart',
            'ecr:CompleteLayerUpload',
          ],
          resources: ['*'],
        }),
      ],
    });
  }
}
