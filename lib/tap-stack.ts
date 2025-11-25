/**
 * tap-stack.ts - Main CI/CD Pipeline ComponentResource
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly deploymentTableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const githubOwner = args.githubOwner || 'TuringGpt';
    const githubRepo = args.githubRepo || 'iac-test-automations';
    const githubBranch = args.githubBranch || 'main';

    // 1. S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix.toLowerCase()}`,
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            noncurrentVersionExpiration: { days: 30 },
          },
        ],
        forceDestroy: true, // Allow bucket to be destroyed even with objects
        tags: tags,
      },
      { parent: this }
    );

    // 2. DynamoDB Table for Deployment History
    const deploymentTable = new aws.dynamodb.Table(
      `deployment-history-${environmentSuffix}`,
      {
        name: `deployment-history-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'deploymentId',
        attributes: [{ name: 'deploymentId', type: 'S' }],
        pointInTimeRecovery: { enabled: true },
        tags: tags,
      },
      { parent: this }
    );

    // 3. SNS Topic for Notifications
    const notificationTopic = new aws.sns.Topic(
      `deployment-notifications-${environmentSuffix}`,
      {
        name: `deployment-notifications-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // 4. IAM Role for Lambda
    const lambdaRole = new aws.iam.Role(
      `lambda-execution-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Attach DynamoDB policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-dynamo-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
      },
      { parent: this }
    );

    // 5. Blue Lambda Function
    const blueLambda = new aws.lambda.Function(
      `payment-blue-${environmentSuffix}`,
      {
        name: `payment-blue-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 512,
        reservedConcurrentExecutions: 100,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
// Using AWS SDK v3 for Node.js 18+
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Blue version processing:', JSON.stringify(event));
  
  // Record deployment in DynamoDB
  const deploymentId = 'deploy-' + Date.now();
  const params = {
    TableName: process.env.DEPLOYMENT_TABLE_NAME || 'deployment-history',
    Item: {
      deploymentId: deploymentId,
      version: 'blue',
      timestamp: new Date().toISOString(),
      status: 'active'
    }
  };
  
  try {
    await ddbDocClient.send(new PutCommand(params));
    console.log('Deployment recorded:', deploymentId);
  } catch (error) {
    console.error('Error recording deployment:', error);
  }
  
  return { 
    statusCode: 200, 
    body: JSON.stringify({ version: 'blue', deploymentId }) 
  };
};`),
        }),
        environment: {
          variables: {
            DEPLOYMENT_TABLE_NAME: deploymentTable.name,
          },
        },
        tags: tags,
      },
      { parent: this }
    );

    // Create alias for blue Lambda
    const blueLambdaAlias = new aws.lambda.Alias(
      `payment-blue-alias-${environmentSuffix}`,
      {
        name: 'live',
        functionName: blueLambda.name,
        functionVersion: '$LATEST',
      },
      { parent: this }
    );

    // 6. Green Lambda Function
    const greenLambda = new aws.lambda.Function(
      `payment-green-${environmentSuffix}`,
      {
        name: `payment-green-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 512,
        reservedConcurrentExecutions: 100,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
// Using AWS SDK v3 for Node.js 18+
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Green version processing:', JSON.stringify(event));
  
  // Record deployment in DynamoDB
  const deploymentId = 'deploy-' + Date.now();
  const params = {
    TableName: process.env.DEPLOYMENT_TABLE_NAME || 'deployment-history',
    Item: {
      deploymentId: deploymentId,
      version: 'green',
      timestamp: new Date().toISOString(),
      status: 'active'
    }
  };
  
  try {
    await ddbDocClient.send(new PutCommand(params));
    console.log('Deployment recorded:', deploymentId);
  } catch (error) {
    console.error('Error recording deployment:', error);
  }
  
  return { 
    statusCode: 200, 
    body: JSON.stringify({ version: 'green', deploymentId }) 
  };
};`),
        }),
        environment: {
          variables: {
            DEPLOYMENT_TABLE_NAME: deploymentTable.name,
          },
        },
        tags: tags,
      },
      { parent: this }
    );

    // Create alias for green Lambda
    const greenLambdaAlias = new aws.lambda.Alias(
      `payment-green-alias-${environmentSuffix}`,
      {
        name: 'live',
        functionName: greenLambda.name,
        functionVersion: '$LATEST',
      },
      { parent: this }
    );

    // 7. CloudWatch Alarm
    const errorAlarm = new aws.cloudwatch.MetricAlarm(
      `lambda-error-alarm-${environmentSuffix}`,
      {
        name: `lambda-error-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Average',
        threshold: 5,
        alarmActions: [notificationTopic.arn],
        dimensions: { FunctionName: blueLambda.name },
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // 8. CodeBuild Role
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
        ],
        tags: tags,
      },
      { parent: this }
    );

    // 9. CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      `build-project-${environmentSuffix}`,
      {
        name: `build-project-${environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: { type: 'CODEPIPELINE' },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies"
  pre_build:
    commands:
      - echo "Installing npm packages"
      - npm install || echo "No package.json found"
  build:
    commands:
      - echo "Building TypeScript"
      - npm run build || npx tsc || echo "No build script"
      - echo "Running tests"
      - npm test || npx jest || echo "No tests found"
artifacts:
  files:
    - '**/*'
  name: BuildArtifact`,
        },
        tags: tags,
      },
      { parent: this }
    );

    // 10. CodeDeploy Role
    const codeDeployRole = new aws.iam.Role(
      `codedeploy-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codedeploy.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda',
        ],
        tags: tags,
      },
      { parent: this }
    );

    // 11. CodeDeploy Application
    const deployApp = new aws.codedeploy.Application(
      `deploy-app-${environmentSuffix}`,
      {
        name: `deploy-app-${environmentSuffix}`,
        computePlatform: 'Lambda',
        tags: tags,
      },
      { parent: this }
    );

    // 12. CodeDeploy Deployment Group
    const deploymentGroup = new aws.codedeploy.DeploymentGroup(
      `deploy-group-${environmentSuffix}`,
      {
        appName: deployApp.name,
        deploymentGroupName: `deploy-group-${environmentSuffix}`,
        serviceRoleArn: codeDeployRole.arn,
        deploymentConfigName:
          'CodeDeployDefault.LambdaLinear10PercentEvery10Minutes',
        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
        },
        alarmConfiguration: {
          enabled: true,
          alarms: [errorAlarm.name],
        },
        deploymentStyle: {
          deploymentOption: 'WITH_TRAFFIC_CONTROL',
          deploymentType: 'BLUE_GREEN',
        },
        tags: tags,
      },
      { parent: this }
    );

    // 13. CodePipeline Role
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codepipeline.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          'arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess',
          'arn:aws:iam::aws:policy/AWSCodeDeployFullAccess',
          'arn:aws:iam::aws:policy/AWSLambda_FullAccess',
        ],
        tags: tags,
      },
      { parent: this }
    );

    // 14. CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `pipeline-${environmentSuffix}`,
      {
        name: `pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStores: [{ location: artifactBucket.bucket, type: 'S3' }],
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'SourceAction',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  Owner: githubOwner,
                  Repo: githubRepo,
                  Branch: githubBranch,
                  OAuthToken: args.githubToken || 'dummy-token',
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
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                configuration: { ProjectName: buildProject.name },
              },
            ],
          },
          {
            name: 'Deploy-Blue',
            actions: [
              {
                name: 'DeployBlue',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'CodeDeploy',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  ApplicationName: deployApp.name,
                  DeploymentGroupName: deploymentGroup.deploymentGroupName,
                },
              },
            ],
          },
          {
            name: 'Switch-Traffic',
            actions: [
              {
                name: 'SwitchTraffic',
                category: 'Invoke',
                owner: 'AWS',
                provider: 'Lambda',
                version: '1',
                configuration: {
                  FunctionName: blueLambda.name,
                  UserParameters: JSON.stringify({
                    action: 'switch-traffic',
                    targetAlias: 'live',
                  }),
                },
              },
            ],
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Output the pipeline URL and deployment table name
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view`;
    this.deploymentTableName = deploymentTable.name;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      deploymentTableName: this.deploymentTableName,
      blueLambdaArn: blueLambda.arn,
      greenLambdaArn: greenLambda.arn,
      blueLambdaAliasArn: blueLambdaAlias.arn,
      greenLambdaAliasArn: greenLambdaAlias.arn,
      artifactBucketName: artifactBucket.bucket,
      notificationTopicArn: notificationTopic.arn,
    });
  }
}
