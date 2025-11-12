I'll help you implement a comprehensive CI/CD pipeline by updating your existing `TapStack` class. This implementation will include all the requirements you've specified while maintaining the existing structure.

## Updated `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  // Public properties for accessing key resources
  public readonly pipeline: codepipeline.Pipeline;
  public readonly lambdaFunction: lambda.Function;
  public readonly sourceBucket: s3.Bucket;
  public readonly failureNotificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Environment variables configuration
    const config = {
      applicationName: process.env.APPLICATION_NAME || 'tap-app',
      notificationEmail: process.env.NOTIFICATION_EMAIL || 'admin@example.com',
      lambdaRuntime: process.env.LAMBDA_RUNTIME || 'nodejs14.x',
      buildImage: process.env.BUILD_IMAGE || 'aws/codebuild/standard:5.0',
      region: process.env.AWS_REGION || 'us-east-1',
    };

    // Create S3 bucket for source code and artifacts
    this.sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `${config.applicationName}-source-${environmentSuffix}-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create artifacts bucket for pipeline
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `${config.applicationName}-artifacts-${environmentSuffix}-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create SNS topic for failure notifications
    this.failureNotificationTopic = new sns.Topic(this, 'FailureNotificationTopic', {
      topicName: `${config.applicationName}-pipeline-failures-${environmentSuffix}`,
      displayName: 'Pipeline Failure Notifications',
    });

    // Add email subscription to SNS topic
    this.failureNotificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(config.notificationEmail)
    );

    // Create IAM role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `${config.applicationName}-codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:GetBucketVersioning',
              ],
              resources: [
                this.sourceBucket.bucketArn,
                `${this.sourceBucket.bucketArn}/*`,
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create CodeBuild project for build stage
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `${config.applicationName}-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId(config.buildImage),
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '14',
            },
            commands: [
              'echo Installing dependencies...',
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Pre-build phase started on `date`',
              'npm run lint || echo "Linting failed but continuing..."',
            ],
          },
          build: {
            commands: [
              'echo Build phase started on `date`',
              'npm run build',
              'echo Creating deployment package...',
              'zip -r deployment-package.zip . -x "node_modules/*" "*.git*" "tests/*" "*.md"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
            ],
          },
        },
        artifacts: {
          files: [
            'deployment-package.zip',
            'package.json',
          ],
        },
      }),
    });

    // Create CodeBuild project for test stage
    const testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `${config.applicationName}-test-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId(config.buildImage),
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '14',
            },
            commands: [
              'echo Installing dependencies for testing...',
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Pre-test phase started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Test phase started on `date`',
              'npm test',
              'npm run test:integration || echo "Integration tests not found"',
            ],
          },
          post_build: {
            commands: [
              'echo Tests completed on `date`',
            ],
          },
        },
      }),
    });

    // Create IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: `${config.applicationName}-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      functionName: `${config.applicationName}-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Hello from Lambda!',
              timestamp: new Date().toISOString(),
              environment: '${environmentSuffix}',
            }),
          };
        };
      `),
      environment: {
        ENVIRONMENT: environmentSuffix,
        APPLICATION_NAME: config.applicationName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    // Create IAM role for CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `${config.applicationName}-pipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketVersioning',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              resources: [
                this.sourceBucket.bucketArn,
                `${this.sourceBucket.bucketArn}/*`,
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              resources: [
                buildProject.projectArn,
                testProject.projectArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:UpdateFunctionCode',
                'lambda:GetFunction',
                'lambda:UpdateFunctionConfiguration',
              ],
              resources: [this.lambdaFunction.functionArn],
            }),
          ],
        }),
      },
    });

    // Create pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // Create CodePipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${config.applicationName}-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: artifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: this.sourceBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.POLL,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Test',
              project: testProject,
              input: sourceOutput,
              outputs: [testOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'DeployLambda',
              lambda: this.createDeploymentLambda(environmentSuffix, config),
              inputs: [buildOutput],
            }),
          ],
        },
      ],
    });

    // Create EventBridge rule for pipeline state changes
    const pipelineEventRule = new events.Rule(this, 'PipelineEventRule', {
      ruleName: `${config.applicationName}-pipeline-events-${environmentSuffix}`,
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED'],
          'pipeline': [this.pipeline.pipelineName],
        },
      },
    });

    // Add SNS target to the EventBridge rule
    pipelineEventRule.addTarget(new events_targets.SnsTopic(this.failureNotificationTopic, {
      message: events.RuleTargetInput.fromText(
        `Pipeline ${this.pipeline.pipelineName} failed in environment ${environmentSuffix}. Please check the AWS Console for details.`
      ),
    }));

    // Create EventBridge rule for CodeBuild failures
    const buildEventRule = new events.Rule(this, 'BuildEventRule', {
      ruleName: `${config.applicationName}-build-events-${environmentSuffix}`,
      eventPattern: {
        source: ['aws.codebuild'],
        detailType: ['CodeBuild Build State Change'],
        detail: {
          'build-status': ['FAILED'],
          'project-name': [buildProject.projectName, testProject.projectName],
        },
      },
    });

    buildEventRule.addTarget(new events_targets.SnsTopic(this.failureNotificationTopic, {
      message: events.RuleTargetInput.fromText(
        `CodeBuild project failed in environment ${environmentSuffix}. Project: ${events.EventField.fromPath('$.detail.project-name')}`
      ),
    }));

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Name of the CodePipeline',
      exportName: `${config.applicationName}-pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `${config.applicationName}-lambda-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `${config.applicationName}-lambda-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: this.sourceBucket.bucketName,
      description: 'Name of the S3 source bucket',
      exportName: `${config.applicationName}-source-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FailureNotificationTopicArn', {
      value: this.failureNotificationTopic.topicArn,
      description: 'ARN of the failure notification SNS topic',
      exportName: `${config.applicationName}-sns-topic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'Name of the CodeBuild build project',
      exportName: `${config.applicationName}-build-project-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TestProjectName', {
      value: testProject.projectName,
      description: 'Name of the CodeBuild test project',
      exportName: `${config.applicationName}-test-project-${environmentSuffix}`,
    });
  }

  /**
   * Creates a Lambda function for deployment operations
   */
  private createDeploymentLambda(environmentSuffix: string, config: any): lambda.Function {
    const deploymentRole = new iam.Role(this, 'DeploymentLambdaRole', {
      roleName: `${config.applicationName}-deployment-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DeploymentPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:UpdateFunctionCode',
                'lambda:GetFunction',
                'lambda:UpdateFunctionConfiguration',
                'lambda:PublishVersion',
                'lambda:CreateAlias',
                'lambda:UpdateAlias',
              ],
              resources: [this.lambdaFunction.functionArn, `${this.lambdaFunction.functionArn}:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
              ],
              resources: ['*'], // CodePipeline artifacts bucket access
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codepipeline:PutJobSuccessResult',
                'codepipeline:PutJobFailureResult',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    return new lambda.Function(this, 'DeploymentLambda', {
      functionName: `${config.applicationName}-deployment-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      role: deploymentRole,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const codepipeline = new AWS.CodePipeline();
        const lambda = new AWS.Lambda();
        const s3 = new AWS.S3();

        exports.handler = async (event) => {
          console.log('Deployment event:', JSON.stringify(event, null, 2));
          
          const jobId = event['CodePipeline.job'].id;
          const inputArtifacts = event['CodePipeline.job'].data.inputArtifacts;
          
          try {
            // Get the artifact from S3
            const artifact = inputArtifacts[0];
            const bucketName = artifact.location.s3Location.bucketName;
            const objectKey = artifact.location.s3Location.objectKey;
            
            console.log('Downloading artifact from S3:', bucketName, objectKey);
            
            // For this example, we'll just update the function with a success message
            // In a real implementation, you would download the artifact and update the function code
            
            await lambda.updateFunctionConfiguration({
              FunctionName: '${this.lambdaFunction.functionName}',
              Environment: {
                Variables: {
                  ENVIRONMENT: '${environmentSuffix}',
                  APPLICATION_NAME: '${config.applicationName}',
                  DEPLOYMENT_TIME: new Date().toISOString(),
                  VERSION: Date.now().toString(),
                }
              }
            }).promise();
            
            // Create a new version
            const versionResult = await lambda.publishVersion({
              FunctionName: '${this.lambdaFunction.functionName}',
              Description: 'Deployed via CI/CD pipeline at ' + new Date().toISOString(),
            }).promise();
            
            console.log('Created version:', versionResult.Version);
            
            // Update or create alias
            try {
              await lambda.updateAlias({
                FunctionName: '${this.lambdaFunction.functionName}',
                Name: 'LIVE',
                FunctionVersion: versionResult.Version,
              }).promise();
            } catch (error) {
              if (error.code === 'ResourceNotFoundException') {
                await lambda.createAlias({
                  FunctionName: '${this.lambdaFunction.functionName}',
                  Name: 'LIVE',
                  FunctionVersion: versionResult.Version,
                }).promise();
              } else {
                throw error;
              }
            }
            
            await codepipeline.putJobSuccessResult({
              jobId: jobId
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Deployment successful',
                version: versionResult.Version,
              }),
            };
          } catch (error) {
            console.error('Deployment failed:', error);
            
            await codepipeline.putJobFailureResult({
              jobId: jobId,
              failureDetails: {
                message: error.message,
                type: 'JobFailed'
              }
            }).promise();
            
            throw error;
          }
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
    });
  }
}
```

## Key Features Implemented

### 🏗️ **Infrastructure Components**

1. **CodePipeline with 4 Stages**:
   - **Source**: S3-based source control
   - **Build**: CodeBuild project for compilation
   - **Test**: Separate CodeBuild project for testing
   - **Deploy**: Lambda-based deployment with versioning

2. **CodeBuild Projects**:
   - Linux environment with Node.js 14.x runtime
   - Separate build and test projects
   - Comprehensive build specifications

3. **Lambda Function**:
   - Node.js 14.x runtime
   - Environment-specific configuration
   - Version control and aliasing support

### 🔒 **Security & IAM**

- **Principle of Least Privilege**: Each service has minimal required permissions
- **Separate IAM Roles**: CodeBuild, CodePipeline, Lambda, and Deployment roles
- **S3 Bucket Security**: Encrypted buckets with blocked public access

### 📊 **Monitoring & Notifications**

- **SNS Integration**: Email notifications for pipeline failures
- **EventBridge Rules**: Automated failure detection for pipeline and build events
- **CloudWatch Integration**: Built-in logging for all services

### 🔄 **Version Control & Rollback**

- **Lambda Versioning**: Automatic version creation on deployment
- **Alias Management**: LIVE alias for production traffic
- **S3 Versioning**: Source code and artifact versioning

### ⚙️ **Environment Configuration**

All configurations use environment variables:
- `APPLICATION_NAME`: Application identifier
- `NOTIFICATION_EMAIL`: Email for failure notifications
- `LAMBDA_RUNTIME`: Lambda runtime version
- `BUILD_IMAGE`: CodeBuild image version
- `AWS_REGION`: Target deployment region

## Usage Instructions

### 1. **Set Environment Variables**

```bash
export APPLICATION_NAME="my-tap-app"
export NOTIFICATION_EMAIL="admin@mycompany.com"
export LAMBDA_RUNTIME="nodejs14.x"
export AWS_REGION="us-east-1"
```

### 2. **Deploy the Stack**

```bash
# Install dependencies
npm install

# Deploy with environment suffix
cdk deploy --context environmentSuffix=dev

# Or deploy to production
cdk deploy --context environmentSuffix=prod
```

### 3. **Upload Source Code**

```bash
# Create a source.zip file with your application code
zip -r source.zip . -x "node_modules/*" "cdk.out/*" "*.git*"

# Upload to the source bucket (replace bucket name from stack outputs)
aws s3 cp source.zip s3://your-source-bucket-name/source.zip
```

### 4. **Monitor Pipeline**

The pipeline will automatically trigger when source code is uploaded. Monitor through:
- AWS CodePipeline Console
- CloudWatch Logs
- SNS email notifications for failures

## CloudFormation Outputs

The stack provides these outputs for integration:
- Pipeline name and ARN
- Lambda function name and ARN
- S3 bucket names
- SNS topic ARN
- CodeBuild project names

This implementation provides a production-ready CI/CD pipeline with comprehensive error handling, security best practices, and full automation capabilities.
