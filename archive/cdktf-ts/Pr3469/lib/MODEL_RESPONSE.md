# Referral Management System Infrastructure - CDKTF TypeScript

Here is the complete infrastructure code for the referral management system:

## Main Stack File

```typescript
// lib/tap-stack.ts
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { ApigatewayRestApi } from "@cdktf/provider-aws/lib/apigateway-rest-api";
import { ApigatewayResource } from "@cdktf/provider-aws/lib/apigateway-resource";
import { ApigatewayMethod } from "@cdktf/provider-aws/lib/apigateway-method";
import { ApigatewayIntegration } from "@cdktf/provider-aws/lib/apigateway-integration";
import { ApigatewayDeployment } from "@cdktf/provider-aws/lib/apigateway-deployment";
import { ApigatewayStage } from "@cdktf/provider-aws/lib/apigateway-stage";
import { ApigatewayRequestValidator } from "@cdktf/provider-aws/lib/apigateway-request-validator";
import { ApigatewayModel } from "@cdktf/provider-aws/lib/apigateway-model";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { EventbridgeRule } from "@cdktf/provider-aws/lib/eventbridge-rule";
import { EventbridgeTarget } from "@cdktf/provider-aws/lib/eventbridge-target";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { CloudwatchDashboard } from "@cdktf/provider-aws/lib/cloudwatch-dashboard";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataArchiveFile } from "@cdktf/provider-archive/lib/data-archive-file";
import { ArchiveProvider } from "@cdktf/provider-archive/lib/provider";
import * as path from "path";
import * as fs from "fs";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "aws", {
      region: "us-east-2",
    });

    new ArchiveProvider(this, "archive");

    // DynamoDB Tables
    const referralTable = new DynamodbTable(this, "referral-table", {
      name: "referral-tracking",
      billingMode: "PAY_PER_REQUEST",
      hashKey: "user_id",
      rangeKey: "referral_timestamp",
      attribute: [
        {
          name: "user_id",
          type: "S",
        },
        {
          name: "referral_timestamp",
          type: "N",
        },
        {
          name: "referrer_id",
          type: "S",
        },
      ],
      globalSecondaryIndex: [
        {
          name: "referrer-index",
          hashKey: "referrer_id",
          projectionType: "ALL",
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: "ReferralTracking",
        Environment: "production",
      },
    });

    const idempotencyTable = new DynamodbTable(this, "idempotency-table", {
      name: "payout-idempotency",
      billingMode: "PAY_PER_REQUEST",
      hashKey: "idempotency_key",
      attribute: [
        {
          name: "idempotency_key",
          type: "S",
        },
      ],
      timeToLiveSpecification: {
        enabled: true,
        attributeName: "ttl",
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: "PayoutIdempotency",
        Environment: "production",
      },
    });

    // S3 Bucket for Reports
    const reportsBucket = new S3Bucket(this, "reports-bucket", {
      bucket: "referral-payout-reports-" + Date.now(),
      tags: {
        Name: "ReferralPayoutReports",
        Environment: "production",
      },
    });

    new S3BucketPublicAccessBlock(this, "reports-bucket-pab", {
      bucket: reportsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLifecycleConfiguration(this, "reports-bucket-lifecycle", {
      bucket: reportsBucket.id,
      rule: [
        {
          id: "archive-old-reports",
          status: "Enabled",
          transition: [
            {
              days: 90,
              storageClass: "GLACIER",
            },
          ],
        },
      ],
    });

    // SNS Topic
    const notificationTopic = new SnsTopic(this, "notification-topic", {
      name: "referral-notifications",
      displayName: "Referral Program Notifications",
      tags: {
        Name: "ReferralNotifications",
        Environment: "production",
      },
    });

    // CloudWatch Log Groups
    const rewardCalculatorLogGroup = new CloudwatchLogGroup(this, "reward-calculator-logs", {
      name: "/aws/lambda/reward-calculator",
      retentionInDays: 7,
    });

    const payoutProcessorLogGroup = new CloudwatchLogGroup(this, "payout-processor-logs", {
      name: "/aws/lambda/payout-processor",
      retentionInDays: 7,
    });

    // IAM Role for Lambda Functions
    const lambdaRole = new IamRole(this, "lambda-role", {
      name: "referral-lambda-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "lambda-basic-execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    new IamRolePolicyAttachment(this, "lambda-xray-policy", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    });

    new IamRolePolicy(this, "lambda-dynamodb-policy", {
      name: "lambda-dynamodb-access",
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:UpdateItem",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:DeleteItem",
              "dynamodb:BatchWriteItem",
              "dynamodb:BatchGetItem",
              "dynamodb:DescribeTable",
              "dynamodb:ConditionCheckItem",
              "dynamodb:TransactWriteItems",
              "dynamodb:TransactGetItems",
            ],
            Resource: [
              referralTable.arn,
              `${referralTable.arn}/index/*`,
              idempotencyTable.arn,
            ],
          },
          {
            Effect: "Allow",
            Action: ["sns:Publish"],
            Resource: notificationTopic.arn,
          },
          {
            Effect: "Allow",
            Action: ["s3:PutObject", "s3:GetObject"],
            Resource: `${reportsBucket.arn}/*`,
          },
        ],
      }),
    });

    // Create Lambda function directories
    const lambdaDir = path.join(__dirname, "lambda");
    if (!fs.existsSync(lambdaDir)) {
      fs.mkdirSync(lambdaDir, { recursive: true });
    }

    // Write Lambda function code
    const rewardCalculatorCode = path.join(lambdaDir, "reward-calculator");
    if (!fs.existsSync(rewardCalculatorCode)) {
      fs.mkdirSync(rewardCalculatorCode, { recursive: true });
    }

    const payoutProcessorCode = path.join(lambdaDir, "payout-processor");
    if (!fs.existsSync(payoutProcessorCode)) {
      fs.mkdirSync(payoutProcessorCode, { recursive: true });
    }

    // Package Lambda functions
    const rewardCalculatorZip = new DataArchiveFile(this, "reward-calculator-zip", {
      type: "zip",
      sourceDir: rewardCalculatorCode,
      outputPath: path.join(lambdaDir, "reward-calculator.zip"),
    });

    const payoutProcessorZip = new DataArchiveFile(this, "payout-processor-zip", {
      type: "zip",
      sourceDir: payoutProcessorCode,
      outputPath: path.join(lambdaDir, "payout-processor.zip"),
    });

    // Lambda Functions
    const rewardCalculator = new LambdaFunction(this, "reward-calculator", {
      functionName: "reward-calculator",
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: lambdaRole.arn,
      filename: rewardCalculatorZip.outputPath,
      sourceCodeHash: rewardCalculatorZip.outputBase64Sha256,
      timeout: 30,
      memorySize: 512,
      tracingConfig: {
        mode: "Active",
      },
      environment: {
        variables: {
          REFERRAL_TABLE_NAME: referralTable.name,
          SNS_TOPIC_ARN: notificationTopic.arn,
          REGION: "us-east-2",
        },
      },
      dependsOn: [rewardCalculatorLogGroup],
    });

    const payoutProcessor = new LambdaFunction(this, "payout-processor", {
      functionName: "payout-processor",
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: lambdaRole.arn,
      filename: payoutProcessorZip.outputPath,
      sourceCodeHash: payoutProcessorZip.outputBase64Sha256,
      timeout: 300,
      memorySize: 1024,
      tracingConfig: {
        mode: "Active",
      },
      environment: {
        variables: {
          REFERRAL_TABLE_NAME: referralTable.name,
          IDEMPOTENCY_TABLE_NAME: idempotencyTable.name,
          SNS_TOPIC_ARN: notificationTopic.arn,
          REPORTS_BUCKET_NAME: reportsBucket.id,
          REGION: "us-east-2",
        },
      },
      dependsOn: [payoutProcessorLogGroup],
    });

    // API Gateway
    const api = new ApigatewayRestApi(this, "referral-api", {
      name: "referral-management-api",
      description: "API for referral sign-ups",
    });

    const signupResource = new ApigatewayResource(this, "signup-resource", {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "signup",
    });

    // Request Validator and Model
    const requestValidator = new ApigatewayRequestValidator(this, "request-validator", {
      name: "signup-validator",
      restApiId: api.id,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    const signupModel = new ApigatewayModel(this, "signup-model", {
      restApiId: api.id,
      name: "SignupModel",
      contentType: "application/json",
      schema: JSON.stringify({
        type: "object",
        required: ["userId", "referralCode"],
        properties: {
          userId: { type: "string" },
          referralCode: { type: "string" },
          email: { type: "string" },
        },
      }),
    });

    const signupMethod = new ApigatewayMethod(this, "signup-method", {
      restApiId: api.id,
      resourceId: signupResource.id,
      httpMethod: "POST",
      authorization: "NONE",
      requestValidatorId: requestValidator.id,
      requestModels: {
        "application/json": signupModel.name,
      },
    });

    new ApigatewayIntegration(this, "signup-integration", {
      restApiId: api.id,
      resourceId: signupResource.id,
      httpMethod: signupMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: rewardCalculator.invokeArn,
    });

    const deployment = new ApigatewayDeployment(this, "api-deployment", {
      restApiId: api.id,
      dependsOn: [signupMethod],
    });

    new ApigatewayStage(this, "api-stage", {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: "prod",
      xrayTracingEnabled: true,
    });

    // Lambda Permissions
    new LambdaPermission(this, "api-lambda-permission", {
      statementId: "AllowAPIGatewayInvoke",
      action: "lambda:InvokeFunction",
      functionName: rewardCalculator.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

    // EventBridge Rule for Monthly Payouts
    const payoutRule = new EventbridgeRule(this, "payout-rule", {
      name: "monthly-payout-rule",
      description: "Trigger payout processing on the 1st of every month",
      scheduleExpression: "cron(0 0 1 * ? *)",
    });

    new EventbridgeTarget(this, "payout-target", {
      rule: payoutRule.name,
      targetId: "payout-lambda-target",
      arn: payoutProcessor.arn,
    });

    new LambdaPermission(this, "eventbridge-lambda-permission", {
      statementId: "AllowEventBridgeInvoke",
      action: "lambda:InvokeFunction",
      functionName: payoutProcessor.functionName,
      principal: "events.amazonaws.com",
      sourceArn: payoutRule.arn,
    });

    // CloudWatch Dashboard
    new CloudwatchDashboard(this, "referral-dashboard", {
      dashboardName: "referral-management-dashboard",
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/Lambda", "Invocations", { stat: "Sum", label: "Sign-ups" }],
                [".", "Errors", { stat: "Sum", label: "Errors" }],
                [".", "Duration", { stat: "Average", label: "Avg Duration" }],
              ],
              period: 300,
              stat: "Average",
              region: "us-east-2",
              title: "Lambda Metrics",
            },
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/DynamoDB", "UserErrors", { stat: "Sum" }],
                [".", "ConsumedReadCapacityUnits", { stat: "Sum" }],
                [".", "ConsumedWriteCapacityUnits", { stat: "Sum" }],
              ],
              period: 300,
              stat: "Sum",
              region: "us-east-2",
              title: "DynamoDB Metrics",
            },
          },
        ],
      }),
    });
  }
}
```

## Reward Calculator Lambda Function

```javascript
// lib/lambda/reward-calculator/index.js
const { DynamoDBClient, TransactWriteItemsCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

const REFERRAL_TABLE = process.env.REFERRAL_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Reward tiers
const REWARD_TIERS = {
  1: 10,    // First referral: $10
  5: 15,    // 5 referrals: $15 per referral
  10: 20,   // 10 referrals: $20 per referral
  25: 25,   // 25 referrals: $25 per referral
};

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { userId, referralCode, email } = body;

    if (!userId || !referralCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const timestamp = Date.now();

    // Get referrer details
    const getReferrerParams = {
      TableName: REFERRAL_TABLE,
      Key: marshall({ user_id: referralCode, referral_timestamp: 0 }),
    };

    const referrerData = await dynamodb.send(new GetItemCommand(getReferrerParams));

    if (!referrerData.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Invalid referral code" }),
      };
    }

    const referrer = unmarshall(referrerData.Item);
    const currentReferralCount = (referrer.referral_count || 0) + 1;

    // Determine reward amount based on tier
    let rewardAmount = REWARD_TIERS[1];
    for (const [tier, amount] of Object.entries(REWARD_TIERS).sort((a, b) => b[0] - a[0])) {
      if (currentReferralCount >= parseInt(tier)) {
        rewardAmount = amount;
        break;
      }
    }

    // Prepare transaction items
    const transactItems = [
      {
        Put: {
          TableName: REFERRAL_TABLE,
          Item: marshall({
            user_id: userId,
            referral_timestamp: timestamp,
            referrer_id: referralCode,
            email: email || "",
            signup_date: new Date().toISOString(),
            reward_amount: rewardAmount,
            status: "pending",
          }),
        },
      },
      {
        Update: {
          TableName: REFERRAL_TABLE,
          Key: marshall({ user_id: referralCode, referral_timestamp: 0 }),
          UpdateExpression: "SET referral_count = referral_count + :inc, total_rewards = total_rewards + :reward",
          ExpressionAttributeValues: marshall({
            ":inc": 1,
            ":reward": rewardAmount,
          }),
        },
      },
    ];

    // Execute transaction
    await dynamodb.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));

    // Send notification
    const message = `New referral signup! User ${userId} signed up with referral code ${referralCode}. Reward: $${rewardAmount}`;

    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
      Subject: "New Referral Signup",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Signup successful",
        rewardAmount: rewardAmount,
        referralCount: currentReferralCount,
      }),
    };

  } catch (error) {
    console.error("Error processing signup:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
```

## Reward Calculator Package.json

```json
// lib/lambda/reward-calculator/package.json
{
  "name": "reward-calculator",
  "version": "1.0.0",
  "description": "Lambda function for calculating referral rewards",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0",
    "@aws-sdk/util-dynamodb": "^3.0.0"
  }
}
```

## Payout Processor Lambda Function

```javascript
// lib/lambda/payout-processor/index.js
const { DynamoDBClient, QueryCommand, PutItemCommand, GetItemCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const s3 = new S3Client({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

const REFERRAL_TABLE = process.env.REFERRAL_TABLE_NAME;
const IDEMPOTENCY_TABLE = process.env.IDEMPOTENCY_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const REPORTS_BUCKET = process.env.REPORTS_BUCKET_NAME;

exports.handler = async (event) => {
  console.log("Starting monthly payout processing");

  const payoutDate = new Date();
  const payoutMonth = payoutDate.toISOString().slice(0, 7);
  const idempotencyKey = `payout-${payoutMonth}`;

  try {
    // Check idempotency
    const idempotencyCheck = await dynamodb.send(new GetItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Key: marshall({ idempotency_key: idempotencyKey }),
    }));

    if (idempotencyCheck.Item) {
      console.log("Payout already processed for this month");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Payout already processed" }),
      };
    }

    // Mark as processing
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "processing",
        timestamp: payoutDate.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 90, // 90 days TTL
      }),
    }));

    // Query all pending rewards
    const queryParams = {
      TableName: REFERRAL_TABLE,
      IndexName: "referrer-index",
      FilterExpression: "#status = :pending",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":pending": "pending",
      }),
    };

    const pendingRewards = [];
    let lastEvaluatedKey = null;

    do {
      if (lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await dynamodb.send(new QueryCommand(queryParams));

      if (result.Items) {
        pendingRewards.push(...result.Items.map(item => unmarshall(item)));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Group rewards by referrer
    const payoutsByReferrer = {};
    for (const reward of pendingRewards) {
      const referrerId = reward.referrer_id;
      if (!payoutsByReferrer[referrerId]) {
        payoutsByReferrer[referrerId] = {
          total: 0,
          count: 0,
          details: [],
        };
      }
      payoutsByReferrer[referrerId].total += reward.reward_amount;
      payoutsByReferrer[referrerId].count += 1;
      payoutsByReferrer[referrerId].details.push({
        userId: reward.user_id,
        amount: reward.reward_amount,
        date: reward.signup_date,
      });
    }

    // Generate CSV report
    let csvContent = "Referrer ID,Total Amount,Referral Count,Payment Status\n";
    const payoutSummary = [];

    for (const [referrerId, data] of Object.entries(payoutsByReferrer)) {
      csvContent += `${referrerId},${data.total},${data.count},Processed\n`;
      payoutSummary.push({
        referrerId,
        amount: data.total,
        count: data.count,
      });
    }

    // Save report to S3
    const reportKey = `payouts/${payoutMonth}/payout-report-${payoutDate.toISOString()}.csv`;
    await s3.send(new PutObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: reportKey,
      Body: csvContent,
      ContentType: "text/csv",
    }));

    // Update reward statuses in batches
    const updateBatches = [];
    let currentBatch = [];

    for (const reward of pendingRewards) {
      currentBatch.push({
        PutRequest: {
          Item: marshall({
            ...reward,
            status: "paid",
            payout_date: payoutDate.toISOString(),
          }),
        },
      });

      if (currentBatch.length === 25) {
        updateBatches.push([...currentBatch]);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      updateBatches.push(currentBatch);
    }

    // Process updates
    for (const batch of updateBatches) {
      await dynamodb.send(new BatchWriteItemCommand({
        RequestItems: {
          [REFERRAL_TABLE]: batch,
        },
      }));
    }

    // Update idempotency record
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "completed",
        timestamp: payoutDate.toISOString(),
        report_location: reportKey,
        total_payouts: Object.keys(payoutsByReferrer).length,
        total_amount: Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 90,
      }),
    }));

    // Send notification
    const message = `Monthly payout processing completed. Total referrers: ${Object.keys(payoutsByReferrer).length}. Total amount: $${Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0)}. Report saved to: ${reportKey}`;

    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
      Subject: "Monthly Payout Processing Completed",
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Payout processing completed",
        totalReferrers: Object.keys(payoutsByReferrer).length,
        totalAmount: Object.values(payoutsByReferrer).reduce((sum, data) => sum + data.total, 0),
        reportLocation: reportKey,
      }),
    };

  } catch (error) {
    console.error("Error processing payouts:", error);

    // Mark as failed in idempotency table
    await dynamodb.send(new PutItemCommand({
      TableName: IDEMPOTENCY_TABLE,
      Item: marshall({
        idempotency_key: idempotencyKey,
        status: "failed",
        error: error.message,
        timestamp: payoutDate.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 30,
      }),
    }));

    throw error;
  }
};
```

## Payout Processor Package.json

```json
// lib/lambda/payout-processor/package.json
{
  "name": "payout-processor",
  "version": "1.0.0",
  "description": "Lambda function for processing monthly payouts",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0",
    "@aws-sdk/util-dynamodb": "^3.0.0"
  }
}
```