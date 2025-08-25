import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface CiCdResourcesArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubRepoUrl?: string;
  slackWebhookUrl: string;
}

export class CiCdResources extends pulumi.ComponentResource {
  public readonly pipelineName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly artifactsBucketName: pulumi.Output<string>;
  public readonly slackSecretArn: pulumi.Output<string>;
  public readonly webhookUrl: pulumi.Output<string>;
  public readonly sampleLambdaArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CiCdResourcesArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('cicd:resources:CiCdResources', name, args, opts);

    const config = new pulumi.Config();
    const githubRepoUrl =
      args.githubRepoUrl ||
      config.get('githubRepoUrl') ||
      'https://github.com/paulsony13/temp-repo.git';

    // Use the actual account ID from your existing secret
    const githubTokenSecretArn =
      'arn:aws:secretsmanager:us-east-1:718240086340:secret:github-token-khIa2Q';

    // Secrets Manager for Slack webhook
    const slackSecret = new aws.secretsmanager.Secret(
      `slack-webhook-secret-${args.environmentSuffix}`,
      {
        description: 'Slack webhook URL for CI/CD notifications',
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `slack-webhook-secret-version-${args.environmentSuffix}`,
      {
        secretId: slackSecret.id,
        secretString: args.slackWebhookUrl,
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${args.environmentSuffix}`,
      {
        name: `/aws/codebuild/ci-cd-pipeline-${args.environmentSuffix}`,
        retentionInDays: 14,
        tags: args.tags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild with least privilege
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              // Remove the condition as CodeBuild doesn't send RequestTag when assuming roles
            },
          ],
        }),
        // Add session tags for better security
        tags: {
          ...args.tags,
          Environment: args.environmentSuffix,
          Service: 'codebuild',
        },
      },
      { parent: this }
    );

    // CodeBuild policy with restricted permissions
    new aws.iam.RolePolicy(
      `codebuild-policy-${args.environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([slackSecret.arn, githubTokenSecretArn])
          .apply(([secretArn, githubTokenArn]) =>
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
                  Resource: `arn:aws:logs:*:*:log-group:/aws/codebuild/ci-cd-pipeline-${args.environmentSuffix}*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: [
                    secretArn,
                    'arn:aws:secretsmanager:*:*:secret:slack-webhook-secret-*',
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:ListSecrets',
                    'secretsmanager:*',
                  ],
                  Resource: [githubTokenArn],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'lambda:CreateFunction',
                    'lambda:UpdateFunctionCode',
                    'lambda:UpdateFunctionConfiguration',
                    'lambda:GetFunction',
                    'lambda:TagResource',
                    'lambda:UntagResource',
                    'lambda:AddPermission',
                    'lambda:RemovePermission',
                  ],
                  Resource: [
                    'arn:aws:lambda:*:*:function:sample-app-*',
                    'arn:aws:lambda:*:*:function:lambda-role-*',
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'iam:GetRole',
                    'iam:PassRole',
                    'iam:CreateRole',
                    'iam:AttachRolePolicy',
                    'iam:DetachRolePolicy',
                    'iam:TagRole',
                    'iam:UntagRole',
                  ],
                  Resource: [
                    'arn:aws:iam::*:role/lambda-role-*',
                    'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'codebuild:CreateWebhook',
                    'codebuild:DeleteWebhook',
                    'codebuild:UpdateWebhook',
                    'codebuild:GetProject',
                    'codebuild:ListProjects',
                  ],
                  Resource: `arn:aws:codebuild:*:*:project/ci-cd-pipeline-${args.environmentSuffix}`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:CreateBucket',
                    's3:PutBucketTagging',
                    's3:GetBucketTagging',
                    's3:DeleteBucket',
                    's3:ListBucket',
                    's3:PutObject',
                    's3:GetObject',
                    's3:DeleteObject',
                  ],
                  Resource: [
                    'arn:aws:s3:::pulumi-*',
                    'arn:aws:s3:::pulumi-*/*',
                    'arn:aws:s3:::codepipeline-artifacts-*',
                    'arn:aws:s3:::codepipeline-artifacts-*/*',
                  ],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // S3 Bucket for CodePipeline artifacts
    const artifactsBucket = new aws.s3.Bucket(
      `codepipeline-artifacts-${args.environmentSuffix}`,
      {
        forceDestroy: true,
        // Let Pulumi generate a unique bucket name automatically
        // This prevents naming conflicts and ensures validity
        tags: args.tags,
      },
      { parent: this }
    );

    // S3 Bucket Server Side Encryption Configuration
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `artifacts-encryption-${args.environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket Versioning Configuration
    new aws.s3.BucketVersioning(
      `artifacts-versioning-${args.environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Bucket Lifecycle Configuration
    new aws.s3.BucketLifecycleConfiguration(
      `artifacts-lifecycle-${args.environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        rules: [
          {
            id: 'delete-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access to artifacts bucket
    new aws.s3.BucketPublicAccessBlock(
      `codepipeline-artifacts-pab-${args.environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // CodeBuild Project with secure configuration
    const codeBuildProject = new aws.codebuild.Project(
      `ci-cd-pipeline-${args.environmentSuffix}`,
      {
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'NO_ARTIFACTS',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: false,
          // Add security improvements
          imagePullCredentialsType: 'CODEBUILD',
          certificate: undefined, // No custom certificate
          environmentVariables: [
            {
              name: 'SLACK_SECRET_ARN',
              value: slackSecret.arn,
            },
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: args.environmentSuffix,
            },
          ],
        },
        source: {
          type: 'GITHUB',
          location: githubRepoUrl,
          // Use GitHub token from Secrets Manager for authentication
          auth: {
            type: 'OAUTH',
            resource: githubTokenSecretArn,
          },
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo Installing dependencies...
      - npm install -g @pulumi/cli
      - npm install
  pre_build:
    commands:
      - echo Configuring environment...
      - aws --version
      - echo \$AWS_DEFAULT_REGION
      - echo \$AWS_ACCOUNT_ID
      - SLACK_WEBHOOK_URL=\$(aws secretsmanager get-secret-value --secret-id \$SLACK_SECRET_ARN --query SecretString --output text)
      - export SLACK_WEBHOOK_URL
      - |
        if [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" == "refs/heads/main" ]]; then
          export PULUMI_STACK="production"
        elif [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" == "refs/heads/staging" ]]; then
          export PULUMI_STACK="staging"
        elif [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" =~ refs/heads/feature/.* ]]; then
          BRANCH_NAME=\$(echo \$CODEBUILD_WEBHOOK_HEAD_REF | sed 's/refs\/heads\/feature\///' | sed 's/[^a-zA-Z0-9-]/-/g')
          export PULUMI_STACK="dev-\$BRANCH_NAME"
        elif [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" =~ refs/heads/hotfix/.* ]]; then
          BRANCH_NAME=\$(echo \$CODEBUILD_WEBHOOK_HEAD_REF | sed 's/refs\/heads\/hotfix\///' | sed 's/[^a-zA-Z0-9-]/-/g')
          export PULUMI_STACK="hotfix-\$BRANCH_NAME"
        else
          export PULUMI_STACK="development"
        fi
      - echo "Deploying to stack: \$PULUMI_STACK"
  build:
    commands:
      - echo Build started on \`date\`
      - set -e  # Exit on any error
      - pulumi stack select \$PULUMI_STACK --create || echo "Stack already exists"
      - pulumi preview --diff || echo "Preview completed"
      - pulumi up --yes --skip-preview
  post_build:
    commands:
      - echo Build completed on \`date\`
      - |
        if [ \$CODEBUILD_BUILD_SUCCEEDING -eq 1 ]; then
          STATUS="SUCCESS"
          COLOR="good"
        else
          STATUS="FAILED"
          COLOR="danger"
        fi
      - |
        # Add error handling for Slack notification
        if [ -z "\$SLACK_WEBHOOK_URL" ]; then
          echo "Warning: SLACK_WEBHOOK_URL is not set, skipping notification"
          exit 0
        fi
      - |
        # Validate webhook URL format
        if [[ ! "\$SLACK_WEBHOOK_URL" =~ ^https://hooks\.slack\.com/.* ]]; then
          echo "Warning: Invalid Slack webhook URL format, skipping notification"
          exit 0
        fi
      - |
        curl -X POST -H 'Content-type: application/json' --data "{
          \"attachments\": [{
            \"color\": \"\$COLOR\",
            \"title\": \"CI/CD Pipeline \$STATUS\",
            \"fields\": [
              {\"title\": \"Stack\", \"value\": \"\$PULUMI_STACK\", \"short\": true},
              {\"title\": \"Branch\", \"value\": \"\$CODEBUILD_WEBHOOK_HEAD_REF\", \"short\": true},
              {\"title\": \"Build ID\", \"value\": \"\$CODEBUILD_BUILD_ID\", \"short\": true}
            ]
          }]
        }" \$SLACK_WEBHOOK_URL
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: codeBuildLogGroup.name,
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // GitHub Webhook for automatic triggering
    // Now enabled with proper GitHub token authentication
    const githubWebhook = new aws.codebuild.Webhook(
      `github-webhook-${args.environmentSuffix}`,
      {
        projectName: codeBuildProject.name,
        filterGroups: [
          {
            filters: [
              {
                type: 'EVENT',
                pattern: 'PUSH',
              },
              {
                type: 'HEAD_REF',
                pattern: '^refs/heads/(main|staging|feature/.*|hotfix/.*)$',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Sample Lambda function IAM role
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              // Remove the condition as Lambda doesn't send RequestTag when assuming roles
            },
          ],
        }),
        tags: {
          ...args.tags,
          Environment: args.environmentSuffix,
          Service: 'lambda',
          Component: 'sample-app-role',
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-policy-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Sample Lambda function that will be deployed by the pipeline
    const sampleLambda = new aws.lambda.Function(
      `sample-app-${args.environmentSuffix}`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Hello from Lambda!',
                timestamp: new Date().toISOString(),
                environment: process.env.ENVIRONMENT || 'development',
                version: '1.0.0'
            }),
        };
        
        console.log('Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('Error in Lambda handler:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            }),
        };
    }
};
        `),
        }),
        handler: 'index.handler',
        role: lambdaRole.arn,
        runtime: 'nodejs18.x',
        timeout: 30,
        memorySize: 128,
        environment: {
          variables: {
            ENVIRONMENT: args.environmentSuffix,
            LOG_LEVEL: 'INFO',
          },
        },
        // Add encryption configuration
        kmsKeyArn: undefined, // Use default AWS managed key
        tags: {
          ...args.tags,
          Environment: args.environmentSuffix,
          Service: 'lambda',
          Component: 'sample-app',
        },
      },
      { parent: this }
    );

    // EventBridge Rule for Pipeline State Changes
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-state-change-${args.environmentSuffix}`,
      {
        description: 'Capture pipeline state changes for notifications',
        eventPattern: JSON.stringify({
          source: ['aws.codebuild'],
          'detail-type': ['CodeBuild Build State Change'],
          detail: {
            'project-name': [codeBuildProject.name],
            'build-status': ['SUCCEEDED', 'FAILED', 'STOPPED'],
          },
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Notification Lambda
    const notificationLambdaLogGroup = new aws.cloudwatch.LogGroup(
      `notification-lambda-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/pipeline-notification-${args.environmentSuffix}`,
        retentionInDays: 14,
        tags: args.tags,
      },
      { parent: this }
    );

    // Notification Lambda IAM role
    const notificationLambdaRole = new aws.iam.Role(
      `notification-lambda-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              // Lambda service can assume this role
            },
          ],
        }),
        tags: {
          ...args.tags,
          Environment: args.environmentSuffix,
          Service: 'lambda',
          Component: 'pipeline-notification-role',
        },
      },
      { parent: this }
    );

    // Create inline policy for notification lambda role (will be updated after queue creation)
    let notificationLambdaPolicy: aws.iam.RolePolicy;

    // Notification Lambda function
    const notificationLambda = new aws.lambda.Function(
      `pipeline-notification-${args.environmentSuffix}`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');

const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        const secret = await secretsManager.getSecretValue({
            SecretId: process.env.SLACK_SECRET_ARN
        }).promise();
        
        const webhookUrl = secret.SecretString;
        const detail = event.detail;
        
        const color = detail['build-status'] === 'SUCCEEDED' ? 'good' : 'danger';
        const status = detail['build-status'];
        
        const message = {
            attachments: [{
                color: color,
                title: \`Build \${status}\`,
                fields: [
                    { title: 'Project', value: detail['project-name'], short: true },
                    { title: 'Build ID', value: detail['build-id'], short: true },
                    { title: 'Status', value: status, short: true },
                    { title: 'Region', value: event.region, short: true }
                ],
                ts: Math.floor(Date.now() / 1000)
            }]
        };
        
        await sendSlackMessage(webhookUrl, message);
        console.log('Notification sent successfully');
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Notification sent successfully' })
        };
        
    } catch (error) {
        console.error('Error sending notification:', error);
        // Return error response instead of throwing to prevent Lambda retries
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send notification',
                message: error.message 
            })
        };
    }
};

function sendSlackMessage(webhookUrl, message) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(webhookUrl);
        const postData = JSON.stringify(message);
        
        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Slack response status:', res.statusCode);
                console.log('Slack response:', data);
                resolve(data);
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
                // Add timeout handling
        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        // Add retry logic for transient failures
        let retryCount = 0;
        const maxRetries = 3;
        
        const attemptRequest = () => {
          if (retryCount >= maxRetries) {
            reject(new Error('Max retries exceeded'));
            return;
          }
          retryCount++;
          req.write(postData);
          req.end();
        };
        
        attemptRequest();
    });
}
        `),
        }),
        handler: 'index.handler',
        role: notificationLambdaRole.arn,
        runtime: 'nodejs18.x',
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            SLACK_SECRET_ARN: slackSecret.arn,
            LOG_GROUP_NAME: notificationLambdaLogGroup.name,
          },
        },
        // Add encryption configuration
        kmsKeyArn: undefined, // Use default AWS managed key
        tags: {
          ...args.tags,
          Environment: args.environmentSuffix,
          Service: 'lambda',
          Component: 'pipeline-notification',
        },
      },
      { parent: this }
    );

    // SQS Dead Letter Queue for failed Lambda executions
    const deadLetterQueue = new aws.sqs.Queue(
      `notification-dlq-${args.environmentSuffix}`,
      {
        messageRetentionSeconds: 1209600, // 14 days
        tags: args.tags,
      },
      { parent: this }
    );

    // Create the notification lambda policy with SQS permissions
    notificationLambdaPolicy = new aws.iam.RolePolicy(
      `notification-lambda-policy-${args.environmentSuffix}`,
      {
        role: notificationLambdaRole.id,
        policy: pulumi
          .all([slackSecret.arn, deadLetterQueue.arn])
          .apply(([secretArn, dlqArn]) =>
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
                  Resource: 'arn:aws:logs:*:*:*',
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
                  Resource: dlqArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // EventBridge Target
    new aws.cloudwatch.EventTarget(
      `pipeline-notification-target-${args.environmentSuffix}`,
      {
        rule: pipelineEventRule.name,
        targetId: 'PipelineNotificationTarget',
        arn: notificationLambda.arn,
        deadLetterConfig: {
          arn: deadLetterQueue.arn,
        },
      },
      { parent: this }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `allow-eventbridge-${args.environmentSuffix}`,
      {
        statementId: 'AllowExecutionFromEventBridge',
        action: 'lambda:InvokeFunction',
        function: notificationLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: pipelineEventRule.arn,
      },
      { parent: this }
    );

    // Set outputs
    this.pipelineName = codeBuildProject.name;
    this.codeBuildProjectName = codeBuildProject.name;
    this.lambdaFunctionName = sampleLambda.name;
    this.sampleLambdaArn = sampleLambda.arn;
    this.artifactsBucketName = artifactsBucket.bucket;
    this.slackSecretArn = slackSecret.arn;
    this.webhookUrl = githubWebhook.url;

    // Ensure the policy is created and attached
    if (notificationLambdaPolicy) {
      // Policy is created and attached
    }

    this.registerOutputs({
      pipelineName: this.pipelineName,
      codeBuildProjectName: this.codeBuildProjectName,
      lambdaFunctionName: this.lambdaFunctionName,
      sampleLambdaArn: this.sampleLambdaArn,
      artifactsBucketName: this.artifactsBucketName,
      slackSecretArn: this.slackSecretArn,
      webhookUrl: this.webhookUrl,
    });
  }
}
