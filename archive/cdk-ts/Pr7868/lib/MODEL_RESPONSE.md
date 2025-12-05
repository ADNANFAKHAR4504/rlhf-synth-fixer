# CI/CD Pipeline Infrastructure - CDK TypeScript Implementation

This implementation provides a complete CI/CD pipeline for containerized applications using AWS CDK with TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `pipeline-artifacts-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ECR Repository for Docker Images
    const ecrRepository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: `container-repo-${environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secrets Manager Secret for GitHub OAuth Token
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GitHubToken',
      'github-oauth-token'
    );

    // SNS Topic for Pipeline Failure Notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotificationTopic', {
      topicName: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'Pipeline Failure Notifications',
    });

    // Add email subscription (configurable via parameter)
    const devOpsEmail = new cdk.CfnParameter(this, 'DevOpsEmail', {
      type: 'String',
      description: 'Email address for DevOps notifications',
      default: 'devops@example.com',
    });

    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(devOpsEmail.valueAsString)
    );

    // IAM Role for CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `pipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline execution',
    });

    // Grant permissions to pipeline role
    artifactBucket.grantReadWrite(pipelineRole);
    githubToken.grantRead(pipelineRole);

    // IAM Role for CodeBuild
    const buildRole = new iam.Role(this, 'BuildRole', {
      roleName: `build-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild projects',
    });

    // Grant permissions to build role
    artifactBucket.grantReadWrite(buildRole);
    ecrRepository.grantPullPush(buildRole);

    // Add ECR authentication permissions
    buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    // CodeBuild Project for Docker Image Build
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `docker-build-${environmentSuffix}`,
      description: 'Build Docker images from source code',
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker builds
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
          },
          AWS_DEFAULT_REGION: {
            value: this.region,
          },
          AWS_ACCOUNT_ID: {
            value: this.account,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      timeout: cdk.Duration.minutes(30),
    });

    // CodeBuild Project for Security Scanning with Trivy
    const securityScanProject = new codebuild.Project(this, 'SecurityScanProject', {
      projectName: `security-scan-${environmentSuffix}`,
      description: 'Scan Docker images for vulnerabilities using Trivy',
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo "Installing Trivy..."',
              'wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -',
              'echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee -a /etc/apt/sources.list.d/trivy.list',
              'apt-get update',
              'apt-get install -y trivy',
            ],
          },
          pre_build: {
            commands: [
              'echo "Logging in to ECR..."',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI',
            ],
          },
          build: {
            commands: [
              'echo "Scanning image with Trivy..."',
              'IMAGE_TAG=$(cat imagetag.txt)',
              'trivy image --severity HIGH,CRITICAL --exit-code 0 $ECR_REPOSITORY_URI:$IMAGE_TAG',
              'echo "Security scan completed"',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
      timeout: cdk.Duration.minutes(15),
    });

    // Source Output Artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Build Output Artifact
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Security Scan Output Artifact
    const scanOutput = new codepipeline.Artifact('ScanOutput');

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `container-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Stage 1: Source
    const sourceStage = pipeline.addStage({
      stageName: 'Source',
    });

    sourceStage.addAction(
      new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: 'your-github-username', // Should be parameterized
        repo: 'your-repo-name', // Should be parameterized
        branch: 'main',
        oauthToken: githubToken.secretValue,
        output: sourceOutput,
        trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
      })
    );

    // Stage 2: Build
    const buildStage = pipeline.addStage({
      stageName: 'Build',
    });

    buildStage.addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Docker_Build',
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput],
      })
    );

    // Stage 3: Security Scan
    const scanStage = pipeline.addStage({
      stageName: 'SecurityScan',
    });

    scanStage.addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Trivy_Scan',
        project: securityScanProject,
        input: buildOutput,
        outputs: [scanOutput],
      })
    );

    // Stage 4: Manual Approval
    const approvalStage = pipeline.addStage({
      stageName: 'ManualApproval',
    });

    approvalStage.addAction(
      new codepipeline_actions.ManualApprovalAction({
        actionName: 'Approve_Deployment',
        notificationTopic: notificationTopic,
        additionalInformation: 'Please review security scan results before deploying to ECR',
      })
    );

    // Stage 5: Deploy to ECR (Semantic Versioning)
    const deployStage = pipeline.addStage({
      stageName: 'Deploy',
    });

    // Note: Actual ECR deployment with semantic versioning would require a custom action
    // or Lambda function. This is a placeholder for the deployment logic.
    const deployProject = new codebuild.Project(this, 'DeployProject', {
      projectName: `ecr-deploy-${environmentSuffix}`,
      description: 'Tag and push images to ECR with semantic versioning',
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo "Logging in to ECR..."',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI',
            ],
          },
          build: {
            commands: [
              'echo "Applying semantic version tags..."',
              'IMAGE_TAG=$(cat imagetag.txt)',
              'SEMANTIC_VERSION="1.0.0" # This should be calculated based on commit history',
              'docker tag $ECR_REPOSITORY_URI:$IMAGE_TAG $ECR_REPOSITORY_URI:$SEMANTIC_VERSION',
              'docker push $ECR_REPOSITORY_URI:$SEMANTIC_VERSION',
              'echo "Image deployed with version $SEMANTIC_VERSION"',
            ],
          },
        },
      }),
      timeout: cdk.Duration.minutes(10),
    });

    deployStage.addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Tag_And_Push',
        project: deployProject,
        input: scanOutput,
      })
    );

    // CloudWatch Events Rule to trigger pipeline on repository changes
    const pipelineEventRule = new events.Rule(this, 'PipelineEventRule', {
      ruleName: `pipeline-trigger-${environmentSuffix}`,
      description: 'Trigger pipeline on source repository changes',
      eventPattern: {
        source: ['aws.codecommit'],
        detailType: ['CodeCommit Repository State Change'],
      },
      enabled: true,
    });

    pipelineEventRule.addTarget(
      new events_targets.CodePipeline(pipeline)
    );

    // Pipeline Failure Notifications via CloudWatch Events
    const pipelineFailureRule = new events.Rule(this, 'PipelineFailureRule', {
      ruleName: `pipeline-failure-${environmentSuffix}`,
      description: 'Notify on pipeline failures',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED'],
          pipeline: [pipeline.pipelineName],
        },
      },
    });

    pipelineFailureRule.addTarget(
      new events_targets.SnsTopic(notificationTopic, {
        message: events.RuleTargetInput.fromText(
          `Pipeline ${pipeline.pipelineName} has failed. Please check the AWS Console for details.`
        ),
      })
    );

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
      exportName: `${environmentSuffix}-artifact-bucket`,
    });

    new cdk.CfnOutput(this, 'TopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for notifications',
      exportName: `${environmentSuffix}-notification-topic-arn`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR repository URI',
      exportName: `${environmentSuffix}-ecr-repository-uri`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `${environmentSuffix}-pipeline-name`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'CodeBuild project name for Docker builds',
      exportName: `${environmentSuffix}-build-project-name`,
    });

    new cdk.CfnOutput(this, 'SecurityScanProjectName', {
      value: securityScanProject.projectName,
      description: 'CodeBuild project name for security scanning',
      exportName: `${environmentSuffix}-security-scan-project-name`,
    });
  }
}
```

## File: lib/buildspec.yml

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - echo "Image tag:" $IMAGE_TAG
  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $ECR_REPOSITORY_URI:$IMAGE_TAG .
      - echo "Tagging image as latest..."
      - docker tag $ECR_REPOSITORY_URI:$IMAGE_TAG $ECR_REPOSITORY_URI:latest
  post_build:
    commands:
      - echo "Pushing Docker image to ECR..."
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - docker push $ECR_REPOSITORY_URI:latest
      - echo "Creating imagetag file..."
      - echo $IMAGE_TAG > imagetag.txt
      - printf '{"ImageURI":"%s"}' $ECR_REPOSITORY_URI:$IMAGE_TAG > imageDetail.json

artifacts:
  files:
    - imagetag.txt
    - imageDetail.json
    - '**/*'
```

## File: lib/README.md

```markdown
# CI/CD Pipeline for Containerized Applications

This CDK application creates a complete CI/CD pipeline for building, scanning, and deploying containerized applications to Amazon ECR.

## Architecture

The pipeline consists of 5 stages:

1. **Source Stage**: Pulls code from GitHub repository using OAuth token authentication
2. **Build Stage**: Builds Docker images using CodeBuild and the provided buildspec.yml
3. **Security Scan Stage**: Scans images with Trivy for vulnerabilities
4. **Manual Approval Stage**: Requires manual approval before deployment
5. **Deploy Stage**: Tags images with semantic versioning and pushes to ECR

## Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS CLI configured with appropriate credentials
- GitHub OAuth token stored in AWS Secrets Manager with name `github-oauth-token`
- Docker installed (for local testing)

## Configuration

Before deploying, update the following values in `lib/tap-stack.ts`:

- GitHub repository owner (line 191)
- GitHub repository name (line 192)
- GitHub branch (line 193)

## Deployment

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy --context environmentSuffix=dev

# Deploy with custom DevOps email
cdk deploy --context environmentSuffix=dev --parameters DevOpsEmail=your-email@example.com
```

## Environment Suffix

The `environmentSuffix` context variable is used to make resource names unique. This allows multiple instances of the pipeline to coexist in the same AWS account.

```bash
cdk deploy --context environmentSuffix=prod
```

## Secrets Manager Setup

Create the GitHub OAuth token in Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-oauth-token \
  --secret-string "your-github-oauth-token" \
  --region us-east-1
```

## Pipeline Execution

The pipeline triggers automatically when changes are pushed to the configured GitHub repository. You can also trigger it manually from the AWS Console.

### Manual Approval

When the pipeline reaches the ManualApproval stage, you'll receive an SNS notification. Review the security scan results and approve or reject the deployment via the AWS Console.

## Monitoring

- **CloudWatch Logs**: All CodeBuild projects write logs to CloudWatch
- **SNS Notifications**: Pipeline failures trigger SNS notifications to the configured email
- **ECR Image Scanning**: Images are automatically scanned on push to ECR

## Security Features

- S3 artifacts are encrypted at rest
- GitHub OAuth token stored securely in Secrets Manager
- IAM roles follow least privilege principle
- Trivy security scanning for container vulnerabilities
- Manual approval required before production deployment

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=dev
```

## Outputs

After deployment, the stack outputs the following values:

- `BucketName`: S3 bucket name for artifacts
- `TopicArn`: SNS topic ARN for notifications
- `EcrRepositoryUri`: ECR repository URI
- `PipelineName`: CodePipeline name
- `BuildProjectName`: CodeBuild project name for builds
- `SecurityScanProjectName`: CodeBuild project name for security scanning

## Customization

### Buildspec.yml

The `buildspec.yml` file defines the Docker build process. Modify it to match your application's build requirements.

### Semantic Versioning

The current implementation uses a placeholder semantic version (1.0.0). Implement proper semantic versioning by:

1. Parsing git commit messages for version bumps
2. Using git tags to track versions
3. Calculating versions based on commit history

### Lifecycle Policies

- Artifact S3 bucket: 30-day retention
- ECR repository: Keeps last 10 images

Adjust these values in `lib/tap-stack.ts` based on your requirements.
```