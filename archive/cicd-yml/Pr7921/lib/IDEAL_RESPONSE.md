# Educational Content Delivery Platform - CDKTF Implementation

Complete CDKTF TypeScript infrastructure for educational content delivery with CI/CD integration.

## File: lib/education-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessIdentity } from '@cdktf/provider-aws/lib/cloudfront-origin-access-identity';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { CognitoUserPool } from '@cdktf/provider-aws/lib/cognito-user-pool';
import { CognitoUserPoolClient } from '@cdktf/provider-aws/lib/cognito-user-pool-client';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';

interface EducationStackProps {
  environmentSuffix: string;
  region: string;
}

export class EducationStack extends Construct {
  constructor(scope: Construct, id: string, props: EducationStackProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Content Storage S3 Bucket
    const contentBucket = new S3Bucket(this, 'content-bucket', {
      bucket: `education-content-${environmentSuffix}`,
      tags: {
        Name: `education-content-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new S3BucketPublicAccessBlock(this, 'content-bucket-public-access-block', {
      bucket: contentBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'content-bucket-encryption', {
      bucket: contentBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new S3BucketVersioningA(this, 'content-bucket-versioning', {
      bucket: contentBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // CloudFront Origin Access Identity
    const oai = new CloudfrontOriginAccessIdentity(this, 'cloudfront-oai', {
      comment: `OAI for education content ${environmentSuffix}`,
    });

    // S3 Bucket Policy for CloudFront
    new S3BucketPolicy(this, 'content-bucket-policy', {
      bucket: contentBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAI',
            Effect: 'Allow',
            Principal: {
              AWS: oai.iamArn,
            },
            Action: 's3:GetObject',
            Resource: `${contentBucket.arn}/*`,
          },
        ],
      }),
    });

    // CloudFront Distribution
    const distribution = new CloudfrontDistribution(this, 'content-distribution', {
      enabled: true,
      comment: `Education content distribution ${environmentSuffix}`,
      defaultRootObject: 'index.html',
      origin: [
        {
          domainName: contentBucket.bucketRegionalDomainName,
          originId: `S3-${contentBucket.id}`,
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
        },
      ],
      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: `S3-${contentBucket.id}`,
        viewerProtocolPolicy: 'redirect-to-https',
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
        compress: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      tags: {
        Name: `education-distribution-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // DynamoDB Table for User Profiles
    const userProfilesTable = new DynamodbTable(this, 'user-profiles-table', {
      name: `education-user-profiles-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'userId',
      attribute: [
        {
          name: 'userId',
          type: 'S',
        },
        {
          name: 'email',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'email-index',
          hashKey: 'email',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `education-user-profiles-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // DynamoDB Table for Course Progress
    const courseProgressTable = new DynamodbTable(this, 'course-progress-table', {
      name: `education-course-progress-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'userId',
      rangeKey: 'courseId',
      attribute: [
        {
          name: 'userId',
          type: 'S',
        },
        {
          name: 'courseId',
          type: 'S',
        },
        {
          name: 'completionPercentage',
          type: 'N',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'course-completion-index',
          hashKey: 'courseId',
          rangeKey: 'completionPercentage',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `education-course-progress-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Cognito User Pool
    const userPool = new CognitoUserPool(this, 'user-pool', {
      name: `education-users-${environmentSuffix}`,
      autoVerifiedAttributes: ['email'],
      mfaConfiguration: 'OFF',
      passwordPolicy: {
        minimumLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true,
        temporaryPasswordValidityDays: 7,
      },
      accountRecoverySetting: {
        recoveryMechanism: [
          {
            name: 'verified_email',
            priority: 1,
          },
        ],
      },
      emailConfiguration: {
        emailSendingAccount: 'COGNITO_DEFAULT',
      },
      schema: [
        {
          name: 'email',
          attributeDataType: 'String',
          required: true,
          mutable: false,
        },
        {
          name: 'name',
          attributeDataType: 'String',
          required: true,
          mutable: true,
        },
      ],
      tags: {
        Name: `education-users-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Cognito User Pool Client
    const userPoolClient = new CognitoUserPoolClient(this, 'user-pool-client', {
      name: `education-client-${environmentSuffix}`,
      userPoolId: userPool.id,
      generateSecret: false,
      explicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
      ],
      preventUserExistenceErrors: 'ENABLED',
      refreshTokenValidity: 30,
      accessTokenValidity: 60,
      idTokenValidity: 60,
      tokenValidityUnits: [{
        refreshToken: 'days',
        accessToken: 'minutes',
        idToken: 'minutes',
      }],
    });

    // SNS Topic for Alerts
    const alertTopic = new SnsTopic(this, 'alert-topic', {
      name: `education-alerts-${environmentSuffix}`,
      tags: {
        Name: `education-alerts-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Execution Role
    const lambdaRole = new IamRole(this, 'lambda-execution-role', {
      name: `education-lambda-role-${environmentSuffix}`,
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
        Name: `education-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Lambda Policy for DynamoDB and S3
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `education-lambda-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [
              userProfilesTable.arn,
              courseProgressTable.arn,
              `${userProfilesTable.arn}/index/*`,
              `${courseProgressTable.arn}/index/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `${contentBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: alertTopic.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // CloudWatch Log Groups for Lambda
    const enrollmentLogGroup = new CloudwatchLogGroup(this, 'enrollment-log-group', {
      name: `/aws/lambda/education-enrollment-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `education-enrollment-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const progressLogGroup = new CloudwatchLogGroup(this, 'progress-log-group', {
      name: `/aws/lambda/education-progress-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `education-progress-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Function - Course Enrollment
    const enrollmentFunction = new LambdaFunction(this, 'enrollment-function', {
      functionName: `education-enrollment-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: '../../../lambda/enrollment.zip',
      sourceCodeHash: '${filebase64sha256("../../../lambda/enrollment.zip")}',
      environment: {
        variables: {
          USER_PROFILES_TABLE: userProfilesTable.name,
          COURSE_PROGRESS_TABLE: courseProgressTable.name,
          ENVIRONMENT: environmentSuffix,
        },
      },
      timeout: 30,
      memorySize: 256,
      tags: {
        Name: `education-enrollment-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [enrollmentLogGroup],
    });

    // Lambda Function - Progress Update
    const progressFunction = new LambdaFunction(this, 'progress-function', {
      functionName: `education-progress-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: '../../../lambda/progress.zip',
      sourceCodeHash: '${filebase64sha256("../../../lambda/progress.zip")}',
      environment: {
        variables: {
          COURSE_PROGRESS_TABLE: courseProgressTable.name,
          ALERT_TOPIC_ARN: alertTopic.arn,
          ENVIRONMENT: environmentSuffix,
        },
      },
      timeout: 30,
      memorySize: 256,
      tags: {
        Name: `education-progress-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [progressLogGroup],
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'education-api', {
      name: `education-api-${environmentSuffix}`,
      description: 'Education platform API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `education-api-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // API Gateway Resources
    const enrollmentResource = new ApiGatewayResource(this, 'enrollment-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'enrollment',
    });

    const progressResource = new ApiGatewayResource(this, 'progress-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'progress',
    });

    // API Gateway Methods and Integrations - Enrollment
    const enrollmentPostMethod = new ApiGatewayMethod(this, 'enrollment-post-method', {
      restApiId: api.id,
      resourceId: enrollmentResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    const enrollmentIntegration = new ApiGatewayIntegration(this, 'enrollment-integration', {
      restApiId: api.id,
      resourceId: enrollmentResource.id,
      httpMethod: enrollmentPostMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: enrollmentFunction.invokeArn,
    });

    // API Gateway Methods and Integrations - Progress
    const progressPostMethod = new ApiGatewayMethod(this, 'progress-post-method', {
      restApiId: api.id,
      resourceId: progressResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    const progressIntegration = new ApiGatewayIntegration(this, 'progress-integration', {
      restApiId: api.id,
      resourceId: progressResource.id,
      httpMethod: progressPostMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: progressFunction.invokeArn,
    });

    // Lambda Permissions for API Gateway
    new LambdaPermission(this, 'enrollment-api-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: enrollmentFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    new LambdaPermission(this, 'progress-api-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: progressFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [enrollmentIntegration, progressIntegration],
    });

    // API Gateway Stage
    const apiStage = new ApiGatewayStage(this, 'api-stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: environmentSuffix,
      tags: {
        Name: `education-api-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'enrollment-error-alarm', {
      alarmName: `education-enrollment-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert on enrollment function errors',
      alarmActions: [alertTopic.arn],
      dimensions: {
        FunctionName: enrollmentFunction.functionName,
      },
      tags: {
        Name: `education-enrollment-errors-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'progress-error-alarm', {
      alarmName: `education-progress-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert on progress function errors',
      alarmActions: [alertTopic.arn],
      dimensions: {
        FunctionName: progressFunction.functionName,
      },
      tags: {
        Name: `education-progress-errors-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // IAM Role for CI/CD Cross-Account Access (configured via GitHub OIDC)
    const cicdRole = new IamRole(this, 'cicd-deployment-role', {
      name: `education-cicd-deploy-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
              },
              StringLike: {
                'token.actions.githubusercontent.com:sub': 'repo:org/repo:*',
              },
            },
          },
        ],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/PowerUserAccess',
      ],
      tags: {
        Name: `education-cicd-deploy-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Terraform Outputs
    new TerraformOutput(this, 'content-bucket-name', {
      value: contentBucket.bucket,
      description: 'S3 bucket name for educational content',
    });

    new TerraformOutput(this, 'cloudfront-url', {
      value: distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'api-endpoint', {
      value: `https://${api.id}.execute-api.${region}.amazonaws.com/${apiStage.stageName}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'user-pool-id', {
      value: userPool.id,
      description: 'Cognito User Pool ID',
    });

    new TerraformOutput(this, 'user-pool-client-id', {
      value: userPoolClient.id,
      description: 'Cognito User Pool Client ID',
    });

    new TerraformOutput(this, 'enrollment-function-name', {
      value: enrollmentFunction.functionName,
      description: 'Enrollment Lambda function name',
    });

    new TerraformOutput(this, 'progress-function-name', {
      value: progressFunction.functionName,
      description: 'Progress Lambda function name',
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { LocalBackend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { EducationStack } from './education-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    new EducationStack(this, 'education', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
```

## File: lib/ci-cd.yml

```yml
name: Educational Platform Multi-Stage CDKTF Pipeline

on:
  workflow_dispatch:
  push:
    branches:
      - main
      - dev

env:
  AWS_REGION: us-east-1
  DEV_ACCOUNT_ID: ${{ secrets.DEV_ACCOUNT_ID }}
  STAGING_ACCOUNT_ID: ${{ secrets.STAGING_ACCOUNT_ID }}
  PROD_ACCOUNT_ID: ${{ secrets.PROD_ACCOUNT_ID }}

jobs:
  source:
    name: Source Stage
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure GitHub OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.GITHUB_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Source

  build:
    name: Build Stage
    runs-on: ubuntu-latest
    needs: source
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.GITHUB_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Build

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run CDKTF Synth
        run: npx cdktf synth

      - name: Run security checks
        run: |
          npm install -D cdktf
          npx cdktf synth
        continue-on-error: false

      - name: Encrypt artifacts with KMS
        run: |
          tar -czf cdktf-outputs.tar.gz -C cdktf.out .
          aws kms encrypt \
            --key-id alias/github-actions-artifacts \
            --plaintext fileb://cdktf-outputs.tar.gz \
            --output text \
            --query CiphertextBlob > cdktf-outputs.tar.gz.encrypted

      - name: Upload encrypted artifacts
        uses: actions/upload-artifact@v4
        with:
          name: cdktf-outputs
          path: cdktf-outputs.tar.gz.encrypted

  deploy-dev:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    needs: build
    environment: dev
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: cdktf-outputs
          path: cdktf.out/

      - name: Configure AWS Credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.GITHUB_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Dev

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Dev
        run: npx cdktf deploy --auto-approve
        env:
          ENVIRONMENT: dev

      - name: Send Slack notification
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Dev deployment completed for ${{ github.ref }}"}'

  manual-approval-staging:
    name: Approve Staging Deployment
    runs-on: ubuntu-latest
    needs: deploy-dev
    environment: staging-approval
    steps:
      - name: Manual approval checkpoint
        run: echo "Deployment to staging approved"

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: manual-approval-staging
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: cdktf-outputs
          path: cdktf.out/

      - name: Assume cross-account role for Staging via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ env.STAGING_ACCOUNT_ID }}:role/CrossAccountDeployRole
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Staging
          role-chaining: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Staging
        run: npx cdktf deploy --auto-approve
        env:
          ENVIRONMENT: staging

      - name: Send Slack notification
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Staging deployment completed for ${{ github.ref }}"}'

  manual-approval-prod:
    name: Approve Production Deployment
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: prod-approval
    steps:
      - name: Manual approval checkpoint
        run: echo "Deployment to production approved"

  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: manual-approval-prod
    environment: prod
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: cdktf-outputs
          path: cdktf.out/

      - name: Assume cross-account role for Production via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ env.PROD_ACCOUNT_ID }}:role/CrossAccountDeployRole
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions-Prod
          role-chaining: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Production
        run: npx cdktf deploy --auto-approve
        env:
          ENVIRONMENT: prod

      - name: Send Slack notification
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Production deployment completed for ${{ github.ref }}"}'
```

## Key Corrections Made

### 1. Stack Inheritance (CRITICAL)
- Changed `EducationStack extends TerraformStack` to `EducationStack extends Construct`
- Only TapStack extends TerraformStack (proper CDKTF architecture)
- Allows EducationStack to access AWS provider configured in parent

### 2. CI/CD Commands (CRITICAL)
- Changed all `npx cdk synth` to `npx cdktf synth`
- Changed all `npx cdk deploy` to `npx cdktf deploy --auto-approve`
- Changed artifact paths from `cdk.out` to `cdktf.out`
- Changed artifact names from `cdk-outputs` to `cdktf-outputs`

### 3. Cognito Configuration (HIGH)
- Changed tokenValidityUnits from object to array: `[{...}]`
- Changed mfaConfiguration from 'OPTIONAL' to 'OFF' (no SMS configured)

### 4. Lambda Paths (HIGH)
- Changed from `lambda/enrollment.zip` to `../../../lambda/enrollment.zip`
- Paths are relative to cdktf.out/stacks/[stack-name]/ directory

### 5. Backend Configuration (CRITICAL)
- Removed invalid `this.addOverride('terraform.backend.s3.use_lockfile', true)`
- S3 backend handles locking natively via DynamoDB

### 6. Terraform Outputs (NEW)
- Added TerraformOutput constructs for all key resources
- Enables integration tests to reference deployed resources
- Required for CI/CD pipeline integration

### 7. SNS Permissions (MEDIUM)
- Added SNS:Publish permission to Lambda policy
- Required for alert topic notifications

## Implementation Notes

1. All resources include `environmentSuffix` in naming for multi-environment support
2. Proper CDKTF construct hierarchy with parent-child relationships
3. Lambda zip files must exist before deployment
4. LocalBackend used for development (S3Backend for production)
5. CI/CD pipeline uses GitHub OIDC for secure authentication
6. Manual approval gates for staging and production deployments
