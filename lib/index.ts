import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';
const region = aws.config.region || 'us-east-1';

// Common tags for all resources
const commonTags = {
  Environment: environmentSuffix,
  CostCenter: 'engineering',
  ManagedBy: 'pulumi',
  Project: 'cicd-pipeline',
};

// KMS Key for encryption
const kmsKey = new aws.kms.Key(`pipeline-kms-${environmentSuffix}`, {
  description: 'KMS key for CI/CD pipeline encryption',
  enableKeyRotation: true,
  tags: {
    ...commonTags,
    Name: `pipeline-kms-${environmentSuffix}`,
  },
});

new aws.kms.Alias(`pipeline-kms-alias-${environmentSuffix}`, {
  name: `alias/cicd-pipeline-${environmentSuffix}`,
  targetKeyId: kmsKey.id,
});

// S3 Bucket for Pipeline Artifacts
const artifactBucket = new aws.s3.Bucket(
  `pipeline-artifacts-${environmentSuffix}`,
  {
    bucket: `pipeline-artifacts-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: kmsKey.id,
        },
      },
    },
    lifecycleRules: [
      {
        id: 'cleanup-old-artifacts',
        enabled: true,
        noncurrentVersionExpiration: {
          days: 30,
        },
      },
    ],
    tags: {
      ...commonTags,
      Name: `pipeline-artifacts-${environmentSuffix}`,
    },
  }
);

// Block public access to artifact bucket
new aws.s3.BucketPublicAccessBlock(
  `artifact-bucket-block-${environmentSuffix}`,
  {
    bucket: artifactBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// SNS Topic for Pipeline Notifications
const pipelineNotificationTopic = new aws.sns.Topic(
  `pipeline-notifications-${environmentSuffix}`,
  {
    name: `pipeline-notifications-${environmentSuffix}`,
    kmsMasterKeyId: kmsKey.id,
    tags: {
      ...commonTags,
      Name: `pipeline-notifications-${environmentSuffix}`,
    },
  }
);

// SNS Topic for Failure Notifications
const failureNotificationTopic = new aws.sns.Topic(
  `pipeline-failures-${environmentSuffix}`,
  {
    name: `pipeline-failures-${environmentSuffix}`,
    kmsMasterKeyId: kmsKey.id,
    tags: {
      ...commonTags,
      Name: `pipeline-failures-${environmentSuffix}`,
    },
  }
);

// IAM Role for CodePipeline
const codePipelineRole = new aws.iam.Role(
  `codepipeline-role-${environmentSuffix}`,
  {
    name: `codepipeline-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'codepipeline.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `codepipeline-role-${environmentSuffix}`,
    },
  }
);

// CodePipeline Policy
new aws.iam.RolePolicy(`codepipeline-policy-${environmentSuffix}`, {
  role: codePipelineRole.id,
  policy: pulumi
    .all([artifactBucket.arn, kmsKey.arn])
    .apply(([bucketArn, keyArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:GetBucketLocation',
              's3:ListBucket',
            ],
            Resource: [bucketArn, `${bucketArn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            Resource: keyArn,
          },
        ],
      })
    ),
});

// IAM Role for CodeBuild
const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
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
  tags: {
    ...commonTags,
    Name: `codebuild-role-${environmentSuffix}`,
  },
});

// CodeBuild Policy
new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
  role: codeBuildRole.id,
  policy: pulumi
    .all([artifactBucket.arn, kmsKey.arn])
    .apply(([bucketArn, keyArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
            Resource: [`${bucketArn}/*`],
          },
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
            Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            Resource: keyArn,
          },
        ],
      })
    ),
});

// CloudWatch Log Group for Build Project
const buildLogGroup = new aws.cloudwatch.LogGroup(
  `build-logs-${environmentSuffix}`,
  {
    name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      ...commonTags,
      Name: `build-logs-${environmentSuffix}`,
    },
  }
);

// CloudWatch Log Group for Test Project
const testLogGroup = new aws.cloudwatch.LogGroup(
  `test-logs-${environmentSuffix}`,
  {
    name: `/aws/codebuild/nodejs-test-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      ...commonTags,
      Name: `test-logs-${environmentSuffix}`,
    },
  }
);

// CodeBuild Project for Building
const buildProject = new aws.codebuild.Project(
  `nodejs-build-${environmentSuffix}`,
  {
    name: `nodejs-build-${environmentSuffix}`,
    description: 'Build project for Node.js microservices',
    serviceRole: codeBuildRole.arn,
    artifacts: {
      type: 'CODEPIPELINE',
    },
    environment: {
      computeType: 'BUILD_GENERAL1_SMALL',
      image: 'aws/codebuild/standard:7.0',
      type: 'LINUX_CONTAINER',
      environmentVariables: [
        {
          name: 'ENVIRONMENT_SUFFIX',
          value: environmentSuffix,
        },
        {
          name: 'AWS_REGION',
          value: region,
        },
      ],
    },
    source: {
      type: 'CODEPIPELINE',
      buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm ci
  build:
    commands:
      - echo "Building application..."
      - npm run build
      - echo "Build completed on \`date\`"
  post_build:
    commands:
      - echo "Build stage completed"

artifacts:
  files:
    - '**/*'
  name: BuildArtifact

cache:
  paths:
    - 'node_modules/**/*'
`,
    },
    logsConfig: {
      cloudwatchLogs: {
        groupName: buildLogGroup.name,
        status: 'ENABLED',
      },
    },
    tags: {
      ...commonTags,
      Name: `nodejs-build-${environmentSuffix}`,
    },
  },
  { dependsOn: [buildLogGroup] }
);

// CodeBuild Project for Testing
const testProject = new aws.codebuild.Project(
  `nodejs-test-${environmentSuffix}`,
  {
    name: `nodejs-test-${environmentSuffix}`,
    description: 'Test project for Node.js microservices',
    serviceRole: codeBuildRole.arn,
    artifacts: {
      type: 'CODEPIPELINE',
    },
    environment: {
      computeType: 'BUILD_GENERAL1_SMALL',
      image: 'aws/codebuild/standard:7.0',
      type: 'LINUX_CONTAINER',
      environmentVariables: [
        {
          name: 'ENVIRONMENT_SUFFIX',
          value: environmentSuffix,
        },
        {
          name: 'AWS_REGION',
          value: region,
        },
      ],
    },
    source: {
      type: 'CODEPIPELINE',
      buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo "Installing test dependencies..."
      - npm ci
  build:
    commands:
      - echo "Running tests..."
      - npm test
      - echo "Tests completed on \`date\`"
  post_build:
    commands:
      - echo "Test stage completed"

artifacts:
  files:
    - '**/*'
  name: TestArtifact

reports:
  test-results:
    files:
      - 'coverage/clover.xml'
    file-format: 'CLOVERXML'
`,
    },
    logsConfig: {
      cloudwatchLogs: {
        groupName: testLogGroup.name,
        status: 'ENABLED',
      },
    },
    tags: {
      ...commonTags,
      Name: `nodejs-test-${environmentSuffix}`,
    },
  },
  { dependsOn: [testLogGroup] }
);

// IAM Role for Lambda Functions
const lambdaRole = new aws.iam.Role(
  `pipeline-lambda-role-${environmentSuffix}`,
  {
    name: `pipeline-lambda-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `pipeline-lambda-role-${environmentSuffix}`,
    },
  }
);

// Attach basic execution role
new aws.iam.RolePolicyAttachment(
  `lambda-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Lambda policy for SNS and CodePipeline
new aws.iam.RolePolicy(`lambda-pipeline-policy-${environmentSuffix}`, {
  role: lambdaRole.id,
  policy: pulumi
    .all([
      pipelineNotificationTopic.arn,
      failureNotificationTopic.arn,
      kmsKey.arn,
    ])
    .apply(([notifArn, failureArn, keyArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: [notifArn, failureArn],
          },
          {
            Effect: 'Allow',
            Action: [
              'codepipeline:PutJobSuccessResult',
              'codepipeline:PutJobFailureResult',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            Resource: keyArn,
          },
        ],
      })
    ),
});

// CloudWatch Log Group for Notification Lambda
const notificationLogGroup = new aws.cloudwatch.LogGroup(
  `notification-lambda-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/pipeline-notification-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      ...commonTags,
      Name: `notification-lambda-logs-${environmentSuffix}`,
    },
  }
);

// Lambda Function for Notifications
const notificationLambda = new aws.lambda.Function(
  `pipeline-notification-${environmentSuffix}`,
  {
    name: `pipeline-notification-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 60,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'notification')
      ),
    }),
    environment: {
      variables: {
        SNS_TOPIC_ARN: pipelineNotificationTopic.arn,
        REGION: region,
      },
    },
    kmsKeyArn: kmsKey.arn,
    tags: {
      ...commonTags,
      Name: `pipeline-notification-${environmentSuffix}`,
    },
  },
  { dependsOn: [notificationLogGroup] }
);

// CloudWatch Log Group for Approval Lambda
const approvalLogGroup = new aws.cloudwatch.LogGroup(
  `approval-lambda-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/approval-check-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      ...commonTags,
      Name: `approval-lambda-logs-${environmentSuffix}`,
    },
  }
);

// Lambda Function for Approval Checks
const approvalLambda = new aws.lambda.Function(
  `approval-check-${environmentSuffix}`,
  {
    name: `approval-check-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 60,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        path.join(__dirname, 'lambda', 'approval')
      ),
    }),
    environment: {
      variables: {
        SNS_TOPIC_ARN: pipelineNotificationTopic.arn,
        REGION: region,
      },
    },
    kmsKeyArn: kmsKey.arn,
    tags: {
      ...commonTags,
      Name: `approval-check-${environmentSuffix}`,
    },
  },
  { dependsOn: [approvalLogGroup] }
);

// CodePipeline for Production (main branch)
const productionPipeline = new aws.codepipeline.Pipeline(
  `nodejs-production-pipeline-${environmentSuffix}`,
  {
    name: `nodejs-production-${environmentSuffix}`,
    roleArn: codePipelineRole.arn,
    artifactStores: [
      {
        type: 'S3',
        location: artifactBucket.bucket,
        encryptionKey: {
          id: kmsKey.arn,
          type: 'KMS',
        },
      },
    ],
    stages: [
      {
        name: 'Source',
        actions: [
          {
            name: 'SourceAction',
            category: 'Source',
            owner: 'AWS',
            provider: 'S3',
            version: '1',
            outputArtifacts: ['SourceOutput'],
            configuration: {
              S3Bucket: artifactBucket.bucket,
              S3ObjectKey: 'source/main.zip',
              PollForSourceChanges: 'false',
            },
          },
        ],
      },
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
              ProjectName: buildProject.name,
            },
          },
        ],
      },
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
              ProjectName: testProject.name,
            },
          },
        ],
      },
      {
        name: 'Approval',
        actions: [
          {
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
            configuration: {
              CustomData:
                'Please review the changes before deploying to production',
              NotificationArn: pipelineNotificationTopic.arn,
            },
          },
        ],
      },
      {
        name: 'Deploy',
        actions: [
          {
            name: 'DeployAction',
            category: 'Invoke',
            owner: 'AWS',
            provider: 'Lambda',
            version: '1',
            inputArtifacts: ['TestOutput'],
            configuration: {
              FunctionName: notificationLambda.name,
              UserParameters: JSON.stringify({
                environment: 'production',
                branch: 'main',
              }),
            },
          },
        ],
      },
    ],
    tags: {
      ...commonTags,
      Name: `nodejs-production-pipeline-${environmentSuffix}`,
      Branch: 'main',
      Environment: 'production',
    },
  }
);

// CodePipeline for Staging (develop branch)
const stagingPipeline = new aws.codepipeline.Pipeline(
  `nodejs-staging-pipeline-${environmentSuffix}`,
  {
    name: `nodejs-staging-${environmentSuffix}`,
    roleArn: codePipelineRole.arn,
    artifactStores: [
      {
        type: 'S3',
        location: artifactBucket.bucket,
        encryptionKey: {
          id: kmsKey.arn,
          type: 'KMS',
        },
      },
    ],
    stages: [
      {
        name: 'Source',
        actions: [
          {
            name: 'SourceAction',
            category: 'Source',
            owner: 'AWS',
            provider: 'S3',
            version: '1',
            outputArtifacts: ['SourceOutput'],
            configuration: {
              S3Bucket: artifactBucket.bucket,
              S3ObjectKey: 'source/develop.zip',
              PollForSourceChanges: 'false',
            },
          },
        ],
      },
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
              ProjectName: buildProject.name,
            },
          },
        ],
      },
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
              ProjectName: testProject.name,
            },
          },
        ],
      },
      {
        name: 'Deploy',
        actions: [
          {
            name: 'DeployAction',
            category: 'Invoke',
            owner: 'AWS',
            provider: 'Lambda',
            version: '1',
            inputArtifacts: ['TestOutput'],
            configuration: {
              FunctionName: notificationLambda.name,
              UserParameters: JSON.stringify({
                environment: 'staging',
                branch: 'develop',
              }),
            },
          },
        ],
      },
    ],
    tags: {
      ...commonTags,
      Name: `nodejs-staging-pipeline-${environmentSuffix}`,
      Branch: 'develop',
      Environment: 'staging',
    },
  }
);

// EventBridge Rule for Production Pipeline State Changes
const productionPipelineRule = new aws.cloudwatch.EventRule(
  `prod-pipeline-rule-${environmentSuffix}`,
  {
    name: `prod-pipeline-state-${environmentSuffix}`,
    description: 'Capture production pipeline state changes',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${productionPipeline.name}"]
  }
}`,
    tags: {
      ...commonTags,
      Name: `prod-pipeline-rule-${environmentSuffix}`,
    },
  }
);

new aws.cloudwatch.EventTarget(`prod-pipeline-target-${environmentSuffix}`, {
  rule: productionPipelineRule.name,
  arn: pipelineNotificationTopic.arn,
});

// EventBridge Rule for Production Pipeline Failures
const productionFailureRule = new aws.cloudwatch.EventRule(
  `prod-failure-rule-${environmentSuffix}`,
  {
    name: `prod-pipeline-failure-${environmentSuffix}`,
    description: 'Capture production pipeline failures',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${productionPipeline.name}"],
    "state": ["FAILED"]
  }
}`,
    tags: {
      ...commonTags,
      Name: `prod-failure-rule-${environmentSuffix}`,
    },
  }
);

new aws.cloudwatch.EventTarget(`prod-failure-target-${environmentSuffix}`, {
  rule: productionFailureRule.name,
  arn: failureNotificationTopic.arn,
});

// EventBridge Rule for Staging Pipeline State Changes
const stagingPipelineRule = new aws.cloudwatch.EventRule(
  `staging-pipeline-rule-${environmentSuffix}`,
  {
    name: `staging-pipeline-state-${environmentSuffix}`,
    description: 'Capture staging pipeline state changes',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${stagingPipeline.name}"]
  }
}`,
    tags: {
      ...commonTags,
      Name: `staging-pipeline-rule-${environmentSuffix}`,
    },
  }
);

new aws.cloudwatch.EventTarget(`staging-pipeline-target-${environmentSuffix}`, {
  rule: stagingPipelineRule.name,
  arn: pipelineNotificationTopic.arn,
});

// EventBridge Rule for Staging Pipeline Failures
const stagingFailureRule = new aws.cloudwatch.EventRule(
  `staging-failure-rule-${environmentSuffix}`,
  {
    name: `staging-pipeline-failure-${environmentSuffix}`,
    description: 'Capture staging pipeline failures',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${stagingPipeline.name}"],
    "state": ["FAILED"]
  }
}`,
    tags: {
      ...commonTags,
      Name: `staging-failure-rule-${environmentSuffix}`,
    },
  }
);

new aws.cloudwatch.EventTarget(`staging-failure-target-${environmentSuffix}`, {
  rule: stagingFailureRule.name,
  arn: failureNotificationTopic.arn,
});

// SNS Topic Policy to allow EventBridge to publish
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const snsTopicPolicy = new aws.sns.TopicPolicy(
  `pipeline-topic-policy-${environmentSuffix}`,
  {
    arn: pipelineNotificationTopic.arn,
    policy: pulumi.all([pipelineNotificationTopic.arn]).apply(([topicArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Action: 'sns:Publish',
            Resource: topicArn,
          },
        ],
      })
    ),
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const failureTopicPolicy = new aws.sns.TopicPolicy(
  `failure-topic-policy-${environmentSuffix}`,
  {
    arn: failureNotificationTopic.arn,
    policy: pulumi.all([failureNotificationTopic.arn]).apply(([topicArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Action: 'sns:Publish',
            Resource: topicArn,
          },
        ],
      })
    ),
  }
);

// Exports
export const artifactBucketName = artifactBucket.bucket;
export const productionPipelineName = productionPipeline.name;
export const stagingPipelineName = stagingPipeline.name;
export const notificationTopicArn = pipelineNotificationTopic.arn;
export const failureTopicArn = failureNotificationTopic.arn;
export const buildProjectName = buildProject.name;
export const testProjectName = testProject.name;
export const notificationLambdaArn = notificationLambda.arn;
export const approvalLambdaArn = approvalLambda.arn;
export const kmsKeyId = kmsKey.id;
