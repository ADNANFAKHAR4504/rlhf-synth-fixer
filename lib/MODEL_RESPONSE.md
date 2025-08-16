```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const config = new pulumi.Config();
const githubRepoUrl =
  config.get('githubRepoUrl') || 'https://github.com/octocat/Hello-World.git';
const slackWebhookUrl = config.require('slackWebhookUrl');

// Store Slack webhook URL in Secrets Manager
const slackSecret = new aws.secretsmanager.Secret('slack-webhook-secret', {
  description: 'Slack webhook URL for CI/CD notifications',
});

const slackSecretVersion = new aws.secretsmanager.SecretVersion(
  'slack-webhook-secret-version',
  {
    secretId: slackSecret.id,
    secretString: slackWebhookUrl,
  }
);

// IAM Role for CodeBuild
const codeBuildRole = new aws.iam.Role('codebuild-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'codebuild.amazonaws.com',
        },
      },
    ],
  }),
});

// IAM Policy for CodeBuild
const codeBuildPolicy = new aws.iam.RolePolicy('codebuild-policy', {
  role: codeBuildRole.id,
  policy: JSON.stringify({
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
        Resource: slackSecret.arn,
      },
      {
        Effect: 'Allow',
        Action: ['lambda:*', 'iam:*', 'cloudformation:*', 's3:*'],
        Resource: '*',
      },
    ],
  }),
});

// CloudWatch Log Group for CodeBuild
const codeBuildLogGroup = new aws.cloudwatch.LogGroup('codebuild-logs', {
  name: '/aws/codebuild/ci-cd-pipeline',
  retentionInDays: 14,
});

// CodeBuild Project
const codeBuildProject = new aws.codebuild.Project('ci-cd-pipeline', {
  serviceRole: codeBuildRole.arn,
  artifacts: {
    type: 'CODEPIPELINE',
  },
  environment: {
    computeType: 'BUILD_GENERAL1_SMALL',
    image: 'aws/codebuild/standard:5.0',
    type: 'LINUX_CONTAINER',
    privilegedMode: true,
    environmentVariables: [
      {
        name: 'SLACK_SECRET_ARN',
        value: slackSecret.arn,
      },
    ],
  },
  source: {
    type: 'CODEPIPELINE',
    buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws --version
      - echo \$AWS_DEFAULT_REGION
      - SLACK_WEBHOOK_URL=\$(aws secretsmanager get-secret-value --secret-id \$SLACK_SECRET_ARN --query SecretString --output text)
      - export SLACK_WEBHOOK_URL
      - |
        if [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" == "refs/heads/main" ]]; then
          export PULUMI_STACK="production"
        elif [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" == "refs/heads/staging" ]]; then
          export PULUMI_STACK="staging"
        elif [[ "\$CODEBUILD_WEBHOOK_HEAD_REF" =~ refs/heads/feature/.* ]]; then
          BRANCH_NAME=\$(echo \$CODEBUILD_WEBHOOK_HEAD_REF | sed 's/refs\/heads\/feature\///')
          export PULUMI_STACK="dev-\$BRANCH_NAME"
        else
          export PULUMI_STACK="development"
        fi
      - echo "Deploying to stack: \$PULUMI_STACK"
  build:
    commands:
      - echo Build started on \`date\`
      - npm install -g @pulumi/cli
      - npm install
      - pulumi stack select \$PULUMI_STACK --create
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
});

// S3 Bucket for CodePipeline artifacts
const artifactsBucket = new aws.s3.Bucket('codepipeline-artifacts', {
  forceDestroy: true,
});

// IAM Role for CodePipeline
const codePipelineRole = new aws.iam.Role('codepipeline-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'codepipeline.amazonaws.com',
        },
      },
    ],
  }),
});

// IAM Policy for CodePipeline
const codePipelinePolicy = new aws.iam.RolePolicy('codepipeline-policy', {
  role: codePipelineRole.id,
  policy: pulumi
    .all([artifactsBucket.arn, codeBuildProject.arn])
    .apply(([bucketArn, buildArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetBucketVersioning',
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
            ],
            Resource: [bucketArn, `${bucketArn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
            Resource: buildArn,
          },
        ],
      })
    ),
});

// CodePipeline
const pipeline = new aws.codepipeline.Pipeline('ci-cd-pipeline', {
  roleArn: codePipelineRole.arn,
  artifactStore: {
    location: artifactsBucket.bucket,
    type: 'S3',
  },
  stages: [
    {
      name: 'Source',
      actions: [
        {
          name: 'Source',
          category: 'Source',
          owner: 'ThirdParty',
          provider: 'GitHub',
          version: '1',
          outputArtifacts: ['source_output'],
          configuration: {
            Owner: 'octocat',
            Repo: 'Hello-World',
            Branch: 'main',
            OAuthToken: config.get('githubToken') || 'dummy-token',
          },
        },
      ],
    },
    {
      name: 'Build',
      actions: [
        {
          name: 'Build',
          category: 'Build',
          owner: 'AWS',
          provider: 'CodeBuild',
          inputArtifacts: ['source_output'],
          version: '1',
          configuration: {
            ProjectName: codeBuildProject.name,
          },
        },
      ],
    },
  ],
});

// Sample Lambda function to be deployed by the pipeline
const lambdaRole = new aws.iam.Role('lambda-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
});

const lambdaPolicy = new aws.iam.RolePolicyAttachment('lambda-policy', {
  role: lambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

const sampleLambda = new aws.lambda.Function('sample-app', {
  code: new pulumi.asset.AssetArchive({
    'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Hello from Lambda!',
            timestamp: new Date().toISOString(),
            environment: process.env.ENVIRONMENT || 'development'
        }),
    };
    return response;
};
        `),
  }),
  handler: 'index.handler',
  role: lambdaRole.arn,
  runtime: 'nodejs18.x',
  environment: {
    variables: {
      ENVIRONMENT: pulumi.getStack(),
    },
  },
});

// EventBridge Rule for Pipeline State Changes
const pipelineEventRule = new aws.cloudwatch.EventRule(
  'pipeline-state-change',
  {
    eventPattern: JSON.stringify({
      source: ['aws.codepipeline'],
      'detail-type': ['CodePipeline Pipeline Execution State Change'],
      detail: {
        pipeline: [pipeline.name],
        state: ['SUCCEEDED', 'FAILED'],
      },
    }),
  }
);

// Lambda function for Slack notifications
const notificationLambdaRole = new aws.iam.Role('notification-lambda-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
});

const notificationLambdaPolicy = new aws.iam.RolePolicy(
  'notification-lambda-policy',
  {
    role: notificationLambdaRole.id,
    policy: JSON.stringify({
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
          Resource: slackSecret.arn,
        },
      ],
    }),
  }
);

const notificationLambda = new aws.lambda.Function('pipeline-notification', {
  code: new pulumi.asset.AssetArchive({
    'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');

const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    try {
        const secret = await secretsManager.getSecretValue({
            SecretId: process.env.SLACK_SECRET_ARN
        }).promise();
        
        const webhookUrl = secret.SecretString;
        const detail = event.detail;
        
        const color = detail.state === 'SUCCEEDED' ? 'good' : 'danger';
        const message = {
            attachments: [{
                color: color,
                title: \`Pipeline \${detail.state}\`,
                fields: [
                    { title: 'Pipeline', value: detail.pipeline, short: true },
                    { title: 'Execution ID', value: detail['execution-id'], short: true },
                    { title: 'State', value: detail.state, short: true }
                ],
                ts: Math.floor(Date.now() / 1000)
            }]
        };
        
        await sendSlackMessage(webhookUrl, message);
        console.log('Notification sent successfully');
        
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
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
            res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}
        `),
  }),
  handler: 'index.handler',
  role: notificationLambdaRole.arn,
  runtime: 'nodejs18.x',
  environment: {
    variables: {
      SLACK_SECRET_ARN: slackSecret.arn,
    },
  },
});

// EventBridge Target
const pipelineEventTarget = new aws.cloudwatch.EventTarget(
  'pipeline-notification-target',
  {
    rule: pipelineEventRule.name,
    targetId: 'PipelineNotificationTarget',
    arn: notificationLambda.arn,
  }
);

// Lambda permission for EventBridge
const lambdaEventPermission = new aws.lambda.Permission('allow-eventbridge', {
  statementId: 'AllowExecutionFromEventBridge',
  action: 'lambda:InvokeFunction',
  function: notificationLambda.name,
  principal: 'events.amazonaws.com',
  sourceArn: pipelineEventRule.arn,
});

// Webhook for GitHub (requires GitHub token with webhook permissions)
const githubWebhook = new aws.codebuild.Webhook('github-webhook', {
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
          pattern: '^refs/heads/(main|staging|feature/.*)$',
        },
      ],
    },
  ],
});

// Exports
export const pipelineName = pipeline.name;
export const codeBuildProjectName = codeBuildProject.name;
export const lambdaFunctionName = sampleLambda.name;
export const artifactsBucketName = artifactsBucket.bucket;
export const slackSecretArn = slackSecret.arn;
export const webhookUrl = githubWebhook.url;
```
