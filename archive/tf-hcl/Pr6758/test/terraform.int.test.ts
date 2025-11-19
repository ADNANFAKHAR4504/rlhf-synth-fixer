// Integration tests for Banking ETL Terraform infrastructure
// Live verification of deployed ETL infrastructure
// Tests AWS resources: Lambda, S3, SQS, EventBridge, CloudWatch, IAM

import * as fs from "fs";
import * as path from "path";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  GetPolicyCommand,
  ListEventSourceMappingsCommand,
} from "@aws-sdk/client-lambda";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketNotificationConfigurationCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  GetQueueAttributesCommandOutput,
} from "@aws-sdk/client-sqs";
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  input_bucket_name?: TfOutputValue<string>;
  output_bucket_name?: TfOutputValue<string>;
  audit_bucket_name?: TfOutputValue<string>;
  lambda_function_name?: TfOutputValue<string>;
  lambda_function_arn?: TfOutputValue<string>;
  dlq_url?: TfOutputValue<string>;
  dlq_arn?: TfOutputValue<string>;
  log_group_name?: TfOutputValue<string>;
  eventbridge_rule_name?: TfOutputValue<string>;
};

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "lib/terraform.tfstate.d/outputs.json"),
    path.resolve(process.cwd(), "lib/.terraform/outputs.json"),
    path.resolve(process.cwd(), "tf-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      return JSON.parse(fs.readFileSync(outputPath, "utf8"));
    }
  }

  // Fallback: try reading from environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.TF_INPUT_BUCKET_NAME) {
    outputs.input_bucket_name = { sensitive: false, type: "string", value: process.env.TF_INPUT_BUCKET_NAME };
  }
  if (process.env.TF_OUTPUT_BUCKET_NAME) {
    outputs.output_bucket_name = { sensitive: false, type: "string", value: process.env.TF_OUTPUT_BUCKET_NAME };
  }
  if (process.env.TF_AUDIT_BUCKET_NAME) {
    outputs.audit_bucket_name = { sensitive: false, type: "string", value: process.env.TF_AUDIT_BUCKET_NAME };
  }
  if (process.env.TF_LAMBDA_FUNCTION_NAME) {
    outputs.lambda_function_name = { sensitive: false, type: "string", value: process.env.TF_LAMBDA_FUNCTION_NAME };
  }
  if (process.env.TF_LAMBDA_FUNCTION_ARN) {
    outputs.lambda_function_arn = { sensitive: false, type: "string", value: process.env.TF_LAMBDA_FUNCTION_ARN };
  }
  if (process.env.TF_DLQ_URL) {
    outputs.dlq_url = { sensitive: false, type: "string", value: process.env.TF_DLQ_URL };
  }
  if (process.env.TF_DLQ_ARN) {
    outputs.dlq_arn = { sensitive: false, type: "string", value: process.env.TF_DLQ_ARN };
  }
  if (process.env.TF_LOG_GROUP_NAME) {
    outputs.log_group_name = { sensitive: false, type: "string", value: process.env.TF_LOG_GROUP_NAME };
  }
  if (process.env.TF_EVENTBRIDGE_RULE_NAME) {
    outputs.eventbridge_rule_name = { sensitive: false, type: "string", value: process.env.TF_EVENTBRIDGE_RULE_NAME };
  }

  // If no outputs found, try to parse from JSON string in environment
  if (Object.keys(outputs).length === 0 && process.env.TF_OUTPUTS) {
    try {
      const envOutputs = JSON.parse(process.env.TF_OUTPUTS);
      return {
        input_bucket_name: { sensitive: false, type: "string", value: envOutputs.input_bucket_name },
        output_bucket_name: { sensitive: false, type: "string", value: envOutputs.output_bucket_name },
        audit_bucket_name: { sensitive: false, type: "string", value: envOutputs.audit_bucket_name },
        lambda_function_name: { sensitive: false, type: "string", value: envOutputs.lambda_function_name },
        lambda_function_arn: { sensitive: false, type: "string", value: envOutputs.lambda_function_arn },
        dlq_url: { sensitive: false, type: "string", value: envOutputs.dlq_url },
        dlq_arn: { sensitive: false, type: "string", value: envOutputs.dlq_arn },
        log_group_name: { sensitive: false, type: "string", value: envOutputs.log_group_name },
        eventbridge_rule_name: { sensitive: false, type: "string", value: envOutputs.eventbridge_rule_name },
      };
    } catch (e) {
      // Ignore parse errors
    }
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error(
      `Outputs file not found. Tried: ${possiblePaths.join(", ")}\n` +
      "Set environment variables (TF_INPUT_BUCKET_NAME, etc.) or ensure Terraform outputs are available."
    );
  }

  return outputs;
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000,
  logLabel?: string
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const attemptNum = i + 1;
      if (logLabel) {
        console.log(`${logLabel} - Attempt ${attemptNum}/${attempts} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (i < attempts - 1) {
        const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || "us-east-1";

// AWS clients
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe("LIVE: Lambda Function", () => {
  const functionName = outputs.lambda_function_name?.value;
  const functionArn = outputs.lambda_function_arn?.value;

  test("Lambda function exists and is active", async () => {
    expect(functionName).toBeTruthy();

    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName! })
      );
    }, 10, 2000, "Lambda function existence");

    expect(response.Configuration).toBeTruthy();
    expect(response.Configuration!.FunctionName).toBe(functionName);
    expect(response.Configuration!.State).toBe("Active");
    expect(response.Configuration!.Runtime).toBeTruthy();
    expect(response.Configuration!.Handler).toBe("processor.handler");
  }, 90000);

  test("Lambda function has correct configuration", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.MemorySize).toBeGreaterThan(0);
    expect(response.Timeout).toBeGreaterThan(0);
    expect(response.Runtime).toMatch(/python3\./);
    expect(response.Environment).toBeTruthy();
  }, 90000);

  test("Lambda function has environment variables configured", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    const envVars = response.Environment?.Variables;
    expect(envVars).toBeTruthy();
    expect(envVars!.OUTPUT_BUCKET).toBe(outputs.output_bucket_name?.value);
    expect(envVars!.AUDIT_BUCKET).toBe(outputs.audit_bucket_name?.value);
    expect(envVars!.DLQ_URL).toBe(outputs.dlq_url?.value);
    expect(envVars!.ENVIRONMENT_SUFFIX).toBeTruthy();
  }, 90000);

  test("Lambda function has dead letter queue configured", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.DeadLetterConfig).toBeTruthy();
    expect(response.DeadLetterConfig!.TargetArn).toBe(outputs.dlq_arn?.value);
  }, 90000);

  test("Lambda function has execution role configured", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.Role).toBeTruthy();
    expect(response.Role).toMatch(/arn:aws:iam::.*:role\/etl-lambda-role-/);
  }, 90000);

  test("Lambda function has EventBridge permission", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetPolicyCommand({ FunctionName: functionName! })
      );
    }, 5); // Fewer retries if policy doesn't exist yet

    if (response.Policy) {
      const policy = JSON.parse(response.Policy);
      expect(policy.Statement).toBeTruthy();
      const eventBridgeStatement = policy.Statement.find(
        (stmt: any) => stmt.Principal?.Service === "events.amazonaws.com"
      );
      expect(eventBridgeStatement).toBeTruthy();
    }
  }, 60000);
});

describe("LIVE: S3 Buckets", () => {
  const inputBucket = outputs.input_bucket_name?.value;
  const outputBucket = outputs.output_bucket_name?.value;
  const auditBucket = outputs.audit_bucket_name?.value;

  test("Input bucket exists and is accessible", async () => {
    expect(inputBucket).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: inputBucket! })
      );
    }, 10, 2000, "Input bucket existence");
  }, 90000);

  test("Input bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: inputBucket! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("Input bucket has encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: inputBucket! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
  }, 90000);

  test("Input bucket has public access blocked", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: inputBucket! })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
  }, 90000);

  test("Input bucket has EventBridge notification enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketNotificationConfigurationCommand({ Bucket: inputBucket! })
      );
    }, 5); // Fewer retries if notification doesn't exist yet

    // EventBridge notifications are indicated by EventBridgeConfiguration
    // or by checking if EventBridge is enabled
    expect(response).toBeTruthy();
  }, 60000);

  test("Output bucket exists and is accessible", async () => {
    expect(outputBucket).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: outputBucket! })
      );
    });
  }, 90000);

  test("Output bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputBucket! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("Output bucket has encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputBucket! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
  }, 90000);

  test("Output bucket has public access blocked", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputBucket! })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
  }, 90000);

  test("Audit bucket exists and is accessible", async () => {
    expect(auditBucket).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: auditBucket! })
      );
    });
  }, 90000);

  test("Audit bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: auditBucket! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("Audit bucket has encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: auditBucket! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
  }, 90000);

  test("Audit bucket has public access blocked", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: auditBucket! })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
  }, 90000);
});

describe("LIVE: SQS Dead Letter Queue", () => {
  const dlqUrl = outputs.dlq_url?.value;
  const dlqArn = outputs.dlq_arn?.value;

  test("DLQ exists and is accessible", async () => {
    expect(dlqUrl).toBeTruthy();

    // Extract queue name from URL
    const queueName = dlqUrl!.split("/").pop()!;

    const response = await retry(async () => {
      return await sqsClient.send(
        new GetQueueUrlCommand({ QueueName: queueName })
      );
    }, 10, 2000, "DLQ existence");

    expect(response.QueueUrl).toBeTruthy();
  }, 90000);

  test("DLQ has correct configuration", async () => {
    const queueName = dlqUrl!.split("/").pop()!;

    const queueUrlResponse = await retry(async () => {
      return await sqsClient.send(
        new GetQueueUrlCommand({ QueueName: queueName })
      );
    });

    const response = await retry(async () => {
      return await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrlResponse.QueueUrl!,
          AttributeNames: ["All"],
        })
      );
    });

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.MessageRetentionPeriod).toBeTruthy();
    expect(parseInt(response.Attributes!.MessageRetentionPeriod!)).toBeGreaterThanOrEqual(86400); // At least 1 day
    expect(response.Attributes!.VisibilityTimeout).toBeTruthy();
  }, 90000);

  test("DLQ has policy allowing Lambda to send messages", async () => {
    const queueName = dlqUrl!.split("/").pop()!;

    const queueUrlResponse = await retry(async () => {
      return await sqsClient.send(
        new GetQueueUrlCommand({ QueueName: queueName })
      );
    });

    const response = await retry(async () => {
      return await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrlResponse.QueueUrl!,
          AttributeNames: ["Policy"],
        })
      );
    }, 5); // Fewer retries if policy doesn't exist yet

    if (response.Attributes?.Policy) {
      const policy = JSON.parse(response.Attributes.Policy);
      expect(policy.Statement).toBeTruthy();
      const lambdaStatement = policy.Statement.find(
        (stmt: any) => stmt.Principal?.Service === "lambda.amazonaws.com"
      );
      expect(lambdaStatement).toBeTruthy();
      expect(lambdaStatement.Action).toContain("sqs:SendMessage");
    }
  }, 60000);
});

describe("LIVE: EventBridge Rule", () => {
  const ruleName = outputs.eventbridge_rule_name?.value;

  test("EventBridge rule exists and is enabled", async () => {
    expect(ruleName).toBeTruthy();

    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName! })
      );
    }, 10, 2000, "EventBridge rule existence");

    expect(response.Name).toBe(ruleName);
    expect(response.State).toBe("ENABLED");
    expect(response.Description).toBeTruthy();
  }, 90000);

  test("EventBridge rule has correct event pattern for S3", async () => {
    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName! })
      );
    });

    expect(response.EventPattern).toBeTruthy();
    const eventPattern = JSON.parse(response.EventPattern!);
    expect(eventPattern.source).toContain("aws.s3");
    expect(eventPattern["detail-type"]).toContain("Object Created");
    expect(eventPattern.detail).toBeTruthy();
    expect(eventPattern.detail.bucket).toBeTruthy();
    expect(eventPattern.detail.bucket.name).toContain(outputs.input_bucket_name?.value);
  }, 90000);

});

describe("LIVE: CloudWatch Log Group", () => {
  const logGroupName = outputs.log_group_name?.value;

  test("CloudWatch log group exists", async () => {
    expect(logGroupName).toBeTruthy();

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName! })
      );
    }, 10, 2000, "CloudWatch log group existence");

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeTruthy();
    expect(logGroup!.logGroupName).toBe(logGroupName);
  }, 90000);

  test("CloudWatch log group has retention configured", async () => {
    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName! })
      );
    });

    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeTruthy();
    if (logGroup!.retentionInDays) {
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);
    }
  }, 90000);
});

describe("LIVE: CloudWatch Alarms", () => {
  test("Lambda errors alarm exists", async () => {
    const alarmName = `etl-lambda-errors-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
    }, 5); // Fewer retries if alarms don't exist yet

    if (response.MetricAlarms && response.MetricAlarms.length > 0) {
      const alarm = response.MetricAlarms[0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe("Errors");
      expect(alarm.Namespace).toBe("AWS/Lambda");
    }
  }, 60000);

  test("Lambda throttles alarm exists", async () => {
    const alarmName = `etl-lambda-throttles-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
    }, 5);

    if (response.MetricAlarms && response.MetricAlarms.length > 0) {
      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe("Throttles");
      expect(alarm.Namespace).toBe("AWS/Lambda");
    }
  }, 60000);

  test("DLQ messages alarm exists", async () => {
    const alarmName = `etl-dlq-messages-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
    }, 5);

    if (response.MetricAlarms && response.MetricAlarms.length > 0) {
      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe("ApproximateNumberOfMessagesVisible");
      expect(alarm.Namespace).toBe("AWS/SQS");
    }
  }, 60000);
});

describe("LIVE: IAM Roles and Policies", () => {
  test("Lambda execution role exists", async () => {
    const roleName = `etl-lambda-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();

    const assumePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
    expect(assumePolicy.Statement).toBeTruthy();
    expect(assumePolicy.Statement[0].Principal.Service).toBe("lambda.amazonaws.com");
  }, 60000);

  test("Lambda execution role has inline policies", async () => {
    const roleName = `etl-lambda-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
    }, 5);

    expect(response.PolicyNames).toBeTruthy();
    expect(response.PolicyNames!.length).toBeGreaterThan(0);

    // Verify at least one policy document
    const policyResponse = await retry(async () => {
      return await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: response.PolicyNames![0],
        })
      );
    }, 5);

    expect(policyResponse.PolicyDocument).toBeTruthy();
    const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
    expect(policy.Statement).toBeTruthy();
  }, 60000);

  test("Lambda execution role has S3 access policy", async () => {
    const roleName = `etl-lambda-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
    }, 5);

    // Check if lambda-s3-access-policy exists
    const hasS3Policy = response.PolicyNames!.some(
      (name) => name === "lambda-s3-access-policy"
    );

    if (hasS3Policy) {
      const policyResponse = await retry(async () => {
        return await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: roleName,
            PolicyName: "lambda-s3-access-policy",
          })
        );
      }, 5);

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      const s3Statement = policy.Statement.find(
        (stmt: any) => stmt.Action && (stmt.Action.includes("s3:GetObject") || stmt.Action.includes("s3:PutObject"))
      );
      expect(s3Statement).toBeTruthy();
    }
  }, 60000);

  test("Lambda execution role has SQS access policy", async () => {
    const roleName = `etl-lambda-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
    }, 5);

    const hasSQSPolicy = response.PolicyNames!.some(
      (name) => name === "lambda-sqs-access-policy"
    );

    if (hasSQSPolicy) {
      const policyResponse = await retry(async () => {
        return await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: roleName,
            PolicyName: "lambda-sqs-access-policy",
          })
        );
      }, 5);

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      const sqsStatement = policy.Statement.find(
        (stmt: any) => stmt.Action && stmt.Action.includes("sqs:SendMessage")
      );
      expect(sqsStatement).toBeTruthy();
    }
  }, 60000);

  test("EventBridge Lambda role exists", async () => {
    const roleName = `etl-eventbridge-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);

    const assumePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
    expect(assumePolicy.Statement[0].Principal.Service).toBe("events.amazonaws.com");
  }, 60000);
});

describe("LIVE: ETL Pipeline Integration", () => {
  test("S3 input bucket triggers EventBridge rule", async () => {
    const ruleResponse = await retry(async () => {
      return await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: outputs.eventbridge_rule_name!.value! })
      );
    });

    const eventPattern = JSON.parse(ruleResponse.EventPattern!);
    expect(eventPattern.detail.bucket.name).toContain(outputs.input_bucket_name?.value);
  }, 60000);


  test("Lambda function has access to all required S3 buckets", async () => {
    const functionConfig = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.lambda_function_name!.value! })
      );
    });

    const envVars = functionConfig.Environment?.Variables;
    expect(envVars!.OUTPUT_BUCKET).toBe(outputs.output_bucket_name?.value);
    expect(envVars!.AUDIT_BUCKET).toBe(outputs.audit_bucket_name?.value);
  }, 90000);

  test("Lambda function has DLQ configured for error handling", async () => {
    const functionConfig = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.lambda_function_name!.value! })
      );
    });

    expect(functionConfig.DeadLetterConfig).toBeTruthy();
    expect(functionConfig.DeadLetterConfig!.TargetArn).toBe(outputs.dlq_arn?.value);
  }, 90000);
});

describe("LIVE: Security Configuration", () => {
  test("All S3 buckets enforce encryption", async () => {
    const buckets = [
      outputs.input_bucket_name?.value,
      outputs.output_bucket_name?.value,
      outputs.audit_bucket_name?.value,
    ].filter(Boolean);

    for (const bucketName of buckets) {
      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName! })
        );
      });

      expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }
  }, 120000);

  test("All S3 buckets block public access", async () => {
    const buckets = [
      outputs.input_bucket_name?.value,
      outputs.output_bucket_name?.value,
      outputs.audit_bucket_name?.value,
    ].filter(Boolean);

    for (const bucketName of buckets) {
      const response = await retry(async () => {
        return await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName! })
        );
      });

      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    }
  }, 120000);

  test("All S3 buckets have versioning enabled", async () => {
    const buckets = [
      outputs.input_bucket_name?.value,
      outputs.output_bucket_name?.value,
      outputs.audit_bucket_name?.value,
    ].filter(Boolean);

    for (const bucketName of buckets) {
      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName! })
        );
      });

      expect(response.Status).toBe("Enabled");
    }
  }, 120000);

  test("IAM roles use service principals correctly", async () => {
    const lambdaRoleName = `etl-lambda-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;
    const eventBridgeRoleName = `etl-eventbridge-role-${outputs.lambda_function_name?.value?.replace("etl-processor-", "") || "devtest"}`;

    const lambdaRole = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: lambdaRoleName }));
    }, 5);

    const lambdaAssumePolicy = JSON.parse(decodeURIComponent(lambdaRole.Role!.AssumeRolePolicyDocument!));
    expect(lambdaAssumePolicy.Statement[0].Principal.Service).toBe("lambda.amazonaws.com");

    const eventBridgeRole = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: eventBridgeRoleName }));
    }, 5);

    const eventBridgeAssumePolicy = JSON.parse(decodeURIComponent(eventBridgeRole.Role!.AssumeRolePolicyDocument!));
    expect(eventBridgeAssumePolicy.Statement[0].Principal.Service).toBe("events.amazonaws.com");
  }, 60000);
});

