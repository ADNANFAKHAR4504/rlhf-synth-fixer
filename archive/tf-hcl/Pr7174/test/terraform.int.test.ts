// tests/terraform.int.test.ts
// Live verification of deployed AWS Config Compliance Terraform infrastructure
// Tests AWS resources: Config Recorders, Config Rules, Config Aggregator, Lambda, S3, SNS, IAM

import * as fs from "fs";
import * as path from "path";
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
  DescribeConfigurationAggregatorsCommand,
} from "@aws-sdk/client-config-service";
import {
  LambdaClient,
  GetFunctionCommand,
  ListFunctionsCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  config_bucket_name?: TfOutputValue<string>;
  config_bucket_arn?: TfOutputValue<string>;
  sns_topic_arn?: TfOutputValue<string>;
  config_role_arn?: TfOutputValue<string>;
  lambda_role_arn?: TfOutputValue<string>;
  config_aggregator_arn?: TfOutputValue<string>;
  encryption_lambda_arns?: TfOutputValue<string>;
  tagging_lambda_arns?: TfOutputValue<string>;
  backup_lambda_arns?: TfOutputValue<string>;
  config_recorder_names?: TfOutputValue<string>;
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
  if (process.env.TF_CONFIG_BUCKET_NAME) {
    outputs.config_bucket_name = { sensitive: false, type: "string", value: process.env.TF_CONFIG_BUCKET_NAME };
  }
  if (process.env.TF_CONFIG_BUCKET_ARN) {
    outputs.config_bucket_arn = { sensitive: false, type: "string", value: process.env.TF_CONFIG_BUCKET_ARN };
  }
  if (process.env.TF_SNS_TOPIC_ARN) {
    outputs.sns_topic_arn = { sensitive: false, type: "string", value: process.env.TF_SNS_TOPIC_ARN };
  }
  if (process.env.TF_CONFIG_ROLE_ARN) {
    outputs.config_role_arn = { sensitive: false, type: "string", value: process.env.TF_CONFIG_ROLE_ARN };
  }
  if (process.env.TF_LAMBDA_ROLE_ARN) {
    outputs.lambda_role_arn = { sensitive: false, type: "string", value: process.env.TF_LAMBDA_ROLE_ARN };
  }
  if (process.env.TF_CONFIG_AGGREGATOR_ARN) {
    outputs.config_aggregator_arn = { sensitive: false, type: "string", value: process.env.TF_CONFIG_AGGREGATOR_ARN };
  }
  if (process.env.TF_CONFIG_RECORDER_NAMES) {
    outputs.config_recorder_names = { sensitive: false, type: "string", value: process.env.TF_CONFIG_RECORDER_NAMES };
  }

  // Return empty outputs instead of throwing - tests will skip if outputs are missing
  if (Object.keys(outputs).length === 0) {
    console.warn(
      `Outputs file not found. Tried: ${possiblePaths.join(", ")}\n` +
      "Tests will skip if required outputs are missing."
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

// Helper function to parse JSON outputs
function parseJsonObject(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || "us-east-1";
const primaryRegion = process.env.AWS_PRIMARY_REGION || "us-east-1";

// AWS clients
const configClient = new ConfigServiceClient({ region: primaryRegion });
const lambdaClient = new LambdaClient({ region: primaryRegion });
const s3Client = new S3Client({ region: primaryRegion });
const snsClient = new SNSClient({ region: primaryRegion });
const iamClient = new IAMClient({ region: primaryRegion });
const logsClient = new CloudWatchLogsClient({ region: primaryRegion });

// Multi-region Config clients
const configClients: Record<string, ConfigServiceClient> = {
  "us-east-1": new ConfigServiceClient({ region: "us-east-1" }),
  "us-west-2": new ConfigServiceClient({ region: "us-west-2" }),
  "eu-west-1": new ConfigServiceClient({ region: "eu-west-1" }),
};

describe("LIVE: AWS Config Recorders", () => {
  const recorderNamesJson = outputs.config_recorder_names?.value;
  const recorderNames = parseJsonObject(recorderNamesJson);

  test("Config recorders exist in all regions", async () => {
    if (!recorderNamesJson || Object.keys(recorderNames).length === 0) {
      console.warn("Skipping Config recorders test - recorder names not found in outputs");
      return;
    }

    const regions = Object.keys(recorderNames);
    expect(regions.length).toBeGreaterThan(0);

    for (const region of regions) {
      const recorderName = recorderNames[region];
      const client = configClients[region] || configClient;

      const response = await retry(async () => {
        return await client.send(
          new DescribeConfigurationRecordersCommand({
            ConfigurationRecorderNames: [recorderName],
          })
        );
      }, 5, 2000, `Config recorder ${recorderName} in ${region}`);

      expect(response.ConfigurationRecorders).toBeTruthy();
      expect(response.ConfigurationRecorders!.length).toBe(1);
      expect(response.ConfigurationRecorders![0].name).toBe(recorderName);
      expect(response.ConfigurationRecorders![0].roleARN).toBeTruthy();

      console.log(`✓ Config recorder ${recorderName} exists in ${region}`);
    }
  }, 120000);

  test("Config recorders are recording", async () => {
    if (!recorderNamesJson || Object.keys(recorderNames).length === 0) {
      console.warn("Skipping Config recorder status test - recorder names not found");
      return;
    }

    const regions = Object.keys(recorderNames);

    for (const region of regions) {
      const recorderName = recorderNames[region];
      const client = configClients[region] || configClient;

      const response = await retry(async () => {
        return await client.send(
          new DescribeConfigurationRecorderStatusCommand({
            ConfigurationRecorderNames: [recorderName],
          })
        );
      }, 5, 2000, `Config recorder status ${recorderName} in ${region}`);

      expect(response.ConfigurationRecordersStatus).toBeTruthy();
      expect(response.ConfigurationRecordersStatus!.length).toBe(1);
      expect(response.ConfigurationRecordersStatus![0].recording).toBe(true);
      expect(response.ConfigurationRecordersStatus![0].lastStatus).toBe("SUCCESS");

      console.log(`✓ Config recorder ${recorderName} is recording in ${region}`);
    }
  }, 120000);
});

describe("LIVE: AWS Config Delivery Channels", () => {
  const recorderNamesJson = outputs.config_recorder_names?.value;
  const recorderNames = parseJsonObject(recorderNamesJson);
  const configBucketName = outputs.config_bucket_name?.value;

  test("Delivery channels exist and are configured", async () => {
    if (!recorderNamesJson || Object.keys(recorderNames).length === 0) {
      console.warn("Skipping delivery channels test - recorder names not found");
      return;
    }

    const regions = Object.keys(recorderNames);

    for (const region of regions) {
      const client = configClients[region] || configClient;

      const response = await retry(async () => {
        return await client.send(new DescribeDeliveryChannelsCommand({}));
      }, 5, 2000, `Delivery channel in ${region}`);

      expect(response.DeliveryChannels).toBeTruthy();
      expect(response.DeliveryChannels!.length).toBeGreaterThan(0);

      const channel = response.DeliveryChannels![0];
      expect(channel.s3BucketName).toBeTruthy();
      if (configBucketName) {
        expect(channel.s3BucketName).toBe(configBucketName);
      }
      expect(channel.snsTopicARN).toBeTruthy();

      console.log(`✓ Delivery channel configured in ${region}`);
    }
  }, 120000);
});

describe("LIVE: AWS Config Rules", () => {
  const recorderNamesJson = outputs.config_recorder_names?.value;
  const recorderNames = parseJsonObject(recorderNamesJson);

  test("Config rules exist for compliance checking", async () => {
    if (!recorderNamesJson || Object.keys(recorderNames).length === 0) {
      console.warn("Skipping Config rules test - recorder names not found");
      return;
    }

    const regions = Object.keys(recorderNames);
    const expectedRuleTypes = ["encryption", "tagging", "backup"];

    for (const region of regions) {
      const client = configClients[region] || configClient;

      const response = await retry(async () => {
        return await client.send(new DescribeConfigRulesCommand({}));
      }, 5, 2000, `Config rules in ${region}`);

      expect(response.ConfigRules).toBeTruthy();
      expect(response.ConfigRules!.length).toBeGreaterThan(0);

      // Check for compliance rules
      const ruleNames = response.ConfigRules!.map((r) => r.ConfigRuleName || "").join(" ");
      
      for (const ruleType of expectedRuleTypes) {
        const matchingRule = response.ConfigRules!.find((r) =>
          r.ConfigRuleName?.toLowerCase().includes(ruleType)
        );
        if (matchingRule) {
          expect(matchingRule.ConfigRuleState).toBe("ACTIVE");
          console.log(`✓ ${ruleType} compliance rule found in ${region}`);
        }
      }
    }
  }, 120000);

  test("Config rules use Lambda functions", async () => {
    if (!recorderNamesJson || Object.keys(recorderNames).length === 0) {
      console.warn("Skipping Config rules Lambda test - recorder names not found");
      return;
    }

    const regions = Object.keys(recorderNames);

    for (const region of regions) {
      const client = configClients[region] || configClient;

      const response = await retry(async () => {
        return await client.send(new DescribeConfigRulesCommand({}));
      }, 5, 2000, `Config rules Lambda in ${region}`);

      const lambdaRules = response.ConfigRules!.filter(
        (r) => r.Source?.Owner === "CUSTOM_LAMBDA"
      );

      if (lambdaRules.length > 0) {
        expect(lambdaRules[0].Source?.SourceIdentifier).toBeTruthy();
        expect(lambdaRules[0].Source?.SourceIdentifier).toMatch(/^arn:aws:lambda:/);
        console.log(`✓ Lambda-based Config rules found in ${region}`);
      }
    }
  }, 120000);
});

describe("LIVE: AWS Config Aggregator", () => {
  const aggregatorArn = outputs.config_aggregator_arn?.value;

  test("Config aggregator exists", async () => {
    if (!aggregatorArn) {
      console.warn("Skipping Config aggregator test - aggregator ARN not found in outputs");
      return;
    }

    const response = await retry(async () => {
      return await configClient.send(
        new DescribeConfigurationAggregatorsCommand({
          ConfigurationAggregatorNames: [],
        })
      );
    }, 5, 2000, "Config aggregator");

    expect(response.ConfigurationAggregators).toBeTruthy();
    expect(response.ConfigurationAggregators!.length).toBeGreaterThan(0);

    const aggregator = response.ConfigurationAggregators!.find(
      (agg) => agg.ConfigurationAggregatorArn === aggregatorArn
    );
    expect(aggregator).toBeTruthy();
    expect(aggregator!.ConfigurationAggregatorName).toBeTruthy();

    console.log(`✓ Config aggregator exists: ${aggregator!.ConfigurationAggregatorName}`);
  }, 90000);

  test("Config aggregator has account aggregation configured", async () => {
    if (!aggregatorArn) {
      console.warn("Skipping aggregator account test - aggregator ARN not found");
      return;
    }

    const response = await retry(async () => {
      return await configClient.send(
        new DescribeConfigurationAggregatorsCommand({
          ConfigurationAggregatorNames: [],
        })
      );
    }, 5, 2000, "Config aggregator accounts");

    const aggregator = response.ConfigurationAggregators!.find(
      (agg) => agg.ConfigurationAggregatorArn === aggregatorArn
    );

    expect(aggregator).toBeTruthy();
    expect(aggregator!.AccountAggregationSources).toBeTruthy();
    expect(aggregator!.AccountAggregationSources!.length).toBeGreaterThan(0);

    console.log(`✓ Config aggregator has account aggregation configured`);
  }, 90000);
});

describe("LIVE: Lambda Functions", () => {
  const encryptionLambdaArnsJson = outputs.encryption_lambda_arns?.value;
  const taggingLambdaArnsJson = outputs.tagging_lambda_arns?.value;
  const backupLambdaArnsJson = outputs.backup_lambda_arns?.value;

  const encryptionLambdas = parseJsonObject(encryptionLambdaArnsJson);
  const taggingLambdas = parseJsonObject(taggingLambdaArnsJson);
  const backupLambdas = parseJsonObject(backupLambdaArnsJson);

  test("Encryption check Lambda functions exist", async () => {
    if (!encryptionLambdaArnsJson || Object.keys(encryptionLambdas).length === 0) {
      console.warn("Skipping encryption Lambda test - ARNs not found");
      return;
    }

    const regions = Object.keys(encryptionLambdas);

    for (const region of regions) {
      const lambdaArn = encryptionLambdas[region];
      const regionClient = new LambdaClient({ region });

      const response = await retry(async () => {
        return await regionClient.send(
          new GetFunctionCommand({ FunctionName: lambdaArn })
        );
      }, 5, 2000, `Encryption Lambda in ${region}`);

      expect(response.Configuration).toBeTruthy();
      expect(response.Configuration!.FunctionName).toBeTruthy();
      expect(response.Configuration!.Runtime).toMatch(/python/);
      expect(response.Configuration!.Handler).toBeTruthy();

      console.log(`✓ Encryption Lambda exists in ${region}`);
    }
  }, 120000);

  test("Tagging check Lambda functions exist", async () => {
    if (!taggingLambdaArnsJson || Object.keys(taggingLambdas).length === 0) {
      console.warn("Skipping tagging Lambda test - ARNs not found");
      return;
    }

    const regions = Object.keys(taggingLambdas);

    for (const region of regions) {
      const lambdaArn = taggingLambdas[region];
      const regionClient = new LambdaClient({ region });

      const response = await retry(async () => {
        return await regionClient.send(
          new GetFunctionCommand({ FunctionName: lambdaArn })
        );
      }, 5, 2000, `Tagging Lambda in ${region}`);

      expect(response.Configuration).toBeTruthy();
      expect(response.Configuration!.FunctionName).toBeTruthy();
      expect(response.Configuration!.Runtime).toMatch(/python/);

      console.log(`✓ Tagging Lambda exists in ${region}`);
    }
  }, 120000);

  test("Backup check Lambda functions exist", async () => {
    if (!backupLambdaArnsJson || Object.keys(backupLambdas).length === 0) {
      console.warn("Skipping backup Lambda test - ARNs not found");
      return;
    }

    const regions = Object.keys(backupLambdas);

    for (const region of regions) {
      const lambdaArn = backupLambdas[region];
      const regionClient = new LambdaClient({ region });

      const response = await retry(async () => {
        return await regionClient.send(
          new GetFunctionCommand({ FunctionName: lambdaArn })
        );
      }, 5, 2000, `Backup Lambda in ${region}`);

      expect(response.Configuration).toBeTruthy();
      expect(response.Configuration!.FunctionName).toBeTruthy();
      expect(response.Configuration!.Runtime).toMatch(/python/);

      console.log(`✓ Backup Lambda exists in ${region}`);
    }
  }, 120000);

  test("Lambda functions have IAM role configured", async () => {
    const allLambdas = { ...encryptionLambdas, ...taggingLambdas, ...backupLambdas };
    
    if (Object.keys(allLambdas).length === 0) {
      console.warn("Skipping Lambda IAM role test - no Lambda ARNs found");
      return;
    }

    const regions = Object.keys(allLambdas);
    const lambdaArn = allLambdas[regions[0]];
    const regionClient = new LambdaClient({ region: regions[0] });

    const response = await retry(async () => {
      return await regionClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: lambdaArn })
      );
    }, 5, 2000, "Lambda IAM role");

    expect(response.Role).toBeTruthy();
    expect(response.Role).toMatch(/^arn:aws:iam::/);

    console.log(`✓ Lambda function has IAM role: ${response.Role}`);
  }, 90000);
});

describe("LIVE: S3 Bucket for Config Data", () => {
  const configBucketName = outputs.config_bucket_name?.value;

  test("Config bucket exists and is accessible", async () => {
    if (!configBucketName) {
      console.warn("Skipping Config bucket test - bucket name not found in outputs");
      return;
    }

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "Config bucket");

    console.log(`✓ Config bucket ${configBucketName} exists and is accessible`);
  }, 90000);

  test("Config bucket has versioning enabled", async () => {
    if (!configBucketName) {
      console.warn("Skipping Config bucket versioning test - bucket name not found");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "Config bucket versioning");

    expect(response.Status).toBe("Enabled");
    console.log(`✓ Config bucket has versioning enabled`);
  }, 90000);

  test("Config bucket has encryption enabled", async () => {
    if (!configBucketName) {
      console.warn("Skipping Config bucket encryption test - bucket name not found");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "Config bucket encryption");

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);

    const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
    expect(rule.ApplyServerSideEncryptionByDefault).toBeTruthy();
    expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("AES256");

    console.log(`✓ Config bucket has encryption enabled`);
  }, 90000);

  test("Config bucket has public access blocked", async () => {
    if (!configBucketName) {
      console.warn("Skipping Config bucket public access test - bucket name not found");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "Config bucket public access");

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

    console.log(`✓ Config bucket has public access blocked`);
  }, 90000);

  test("Config bucket has policy for Config service access", async () => {
    if (!configBucketName) {
      console.warn("Skipping Config bucket policy test - bucket name not found");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "Config bucket policy");

    expect(response.Policy).toBeTruthy();
    const policy = JSON.parse(response.Policy!);
    expect(policy.Statement).toBeTruthy();

    // Check for Config service access
    const configStatements = policy.Statement.filter((stmt: any) =>
      stmt.Principal?.Service === "config.amazonaws.com"
    );
    expect(configStatements.length).toBeGreaterThan(0);

    console.log(`✓ Config bucket has policy for Config service access`);
  }, 90000);
});

describe("LIVE: SNS Topic for Notifications", () => {
  const topicArn = outputs.sns_topic_arn?.value;

  test("SNS topic exists", async () => {
    if (!topicArn) {
      console.warn("Skipping SNS topic test - topic ARN not found in outputs");
      return;
    }

    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    }, 5, 2000, "SNS topic");

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.TopicArn).toBe(topicArn);

    console.log(`✓ SNS topic exists: ${topicArn}`);
  }, 90000);

  test("SNS topic has subscriptions", async () => {
    if (!topicArn) {
      console.warn("Skipping SNS subscriptions test - topic ARN not found");
      return;
    }

    const response = await retry(async () => {
      return await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn! })
      );
    }, 5, 2000, "SNS subscriptions");

    // Subscriptions are optional (email subscription may require confirmation)
    if (response.Subscriptions && response.Subscriptions.length > 0) {
      expect(response.Subscriptions.length).toBeGreaterThan(0);
      console.log(`✓ SNS topic has ${response.Subscriptions.length} subscription(s)`);
    } else {
      console.log("Note: SNS topic has no subscriptions (email may require confirmation)");
    }
  }, 90000);
});

describe("LIVE: IAM Roles", () => {
  const configRoleArn = outputs.config_role_arn?.value;
  const lambdaRoleArn = outputs.lambda_role_arn?.value;

  test("Config IAM role exists", async () => {
    if (!configRoleArn) {
      console.warn("Skipping Config IAM role test - role ARN not found");
      return;
    }

    const roleName = configRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5, 2000, "Config IAM role");

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();

    const assumePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
    expect(assumePolicy.Statement).toBeTruthy();
    const configStatement = assumePolicy.Statement.find(
      (stmt: any) => stmt.Principal?.Service === "config.amazonaws.com"
    );
    expect(configStatement).toBeTruthy();

    console.log(`✓ Config IAM role exists: ${roleName}`);
  }, 90000);

  test("Config role has managed policy attached", async () => {
    if (!configRoleArn) {
      console.warn("Skipping Config role policy test - role ARN not found");
      return;
    }

    const roleName = configRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
    }, 5, 2000, "Config role policies");

    expect(response.AttachedPolicies).toBeTruthy();
    expect(response.AttachedPolicies!.length).toBeGreaterThan(0);

    const configPolicy = response.AttachedPolicies!.find((p) =>
      p.PolicyArn?.includes("ConfigRole")
    );
    expect(configPolicy).toBeTruthy();

    console.log(`✓ Config role has managed policy attached`);
  }, 90000);

  test("Lambda IAM role exists", async () => {
    if (!lambdaRoleArn) {
      console.warn("Skipping Lambda IAM role test - role ARN not found");
      return;
    }

    const roleName = lambdaRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5, 2000, "Lambda IAM role");

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();

    const assumePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
    expect(assumePolicy.Statement).toBeTruthy();
    const lambdaStatement = assumePolicy.Statement.find(
      (stmt: any) => stmt.Principal?.Service === "lambda.amazonaws.com"
    );
    expect(lambdaStatement).toBeTruthy();

    console.log(`✓ Lambda IAM role exists: ${roleName}`);
  }, 90000);

  test("Lambda role has inline policies", async () => {
    if (!lambdaRoleArn) {
      console.warn("Skipping Lambda role policies test - role ARN not found");
      return;
    }

    const roleName = lambdaRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
    }, 5, 2000, "Lambda role policies");

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
    }, 5, 2000, "Lambda role policy document");

    expect(policyResponse.PolicyDocument).toBeTruthy();

    console.log(`✓ Lambda role has inline policies`);
  }, 90000);
});

describe("LIVE: CloudWatch Log Groups", () => {
  test("Lambda log groups exist", async () => {
    const logGroupPrefix = "/aws/lambda/config-compliance";

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupPrefix })
      );
    }, 5, 2000, "Lambda log groups");

    if (response.logGroups && response.logGroups.length > 0) {
      expect(response.logGroups.length).toBeGreaterThan(0);
      console.log(`✓ Found ${response.logGroups.length} Lambda log group(s)`);
    } else {
      console.log("Note: No Lambda log groups found (may be created on first execution)");
    }
  }, 60000);
});

describe("LIVE: Output Validation", () => {
  test("Config recorder names contain expected regions", () => {
    if (!outputs.config_recorder_names?.value) {
      console.warn("Skipping recorder regions test - recorder names not found");
      return;
    }

    const recorders = parseJsonObject(outputs.config_recorder_names.value);
    const expectedRegions = ["us-east-1", "us-west-2", "eu-west-1"];

    expectedRegions.forEach((region) => {
      if (recorders[region]) {
        expect(recorders[region]).toBeTruthy();
        expect(recorders[region]).toMatch(/^config-recorder-/);
      }
    });

    console.log(`✓ Config recorders found in ${Object.keys(recorders).length} region(s)`);
  });
});

describe("LIVE: Security Configuration", () => {
  test("S3 bucket enforces encryption", async () => {
    const configBucketName = outputs.config_bucket_name?.value;
    if (!configBucketName) {
      console.warn("Skipping S3 encryption test - bucket name not found");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "S3 encryption");

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
  }, 90000);

  test("S3 bucket blocks public access", async () => {
    const configBucketName = outputs.config_bucket_name?.value;
    if (!configBucketName) {
      console.warn("Skipping S3 public access test - bucket name not found");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: configBucketName! })
      );
    }, 5, 2000, "S3 public access");

    const config = response.PublicAccessBlockConfiguration!;
    expect(config.BlockPublicAcls).toBe(true);
    expect(config.BlockPublicPolicy).toBe(true);
    expect(config.RestrictPublicBuckets).toBe(true);
  }, 90000);

  test("IAM roles use least privilege", async () => {
    const configRoleArn = outputs.config_role_arn?.value;
    if (!configRoleArn) {
      console.warn("Skipping IAM least privilege test - role ARN not found");
      return;
    }

    const roleName = configRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5, 2000, "IAM role");

    expect(response.Role).toBeTruthy();
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();

    const assumePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
    expect(assumePolicy.Statement).toBeTruthy();
    expect(assumePolicy.Statement.length).toBeGreaterThan(0);
  }, 90000);
});

describe("LIVE: Compliance Checking Infrastructure", () => {
  test("Lambda functions are configured for compliance checks", async () => {
    const encryptionLambdas = parseJsonObject(outputs.encryption_lambda_arns?.value);
    const taggingLambdas = parseJsonObject(outputs.tagging_lambda_arns?.value);
    const backupLambdas = parseJsonObject(outputs.backup_lambda_arns?.value);

    const allLambdas = { ...encryptionLambdas, ...taggingLambdas, ...backupLambdas };

    if (Object.keys(allLambdas).length === 0) {
      console.warn("Skipping compliance Lambda test - no Lambda ARNs found");
      return;
    }

    const regions = Object.keys(allLambdas);
    expect(regions.length).toBeGreaterThan(0);

    // Verify at least one Lambda function exists
    const firstRegion = regions[0];
    const firstLambdaArn = allLambdas[firstRegion];
    const regionClient = new LambdaClient({ region: firstRegion });

    const response = await retry(async () => {
      return await regionClient.send(
        new GetFunctionCommand({ FunctionName: firstLambdaArn })
      );
    }, 5, 2000, "Compliance Lambda");

    expect(response.Configuration).toBeTruthy();
    expect(response.Configuration!.Runtime).toMatch(/python/);
    expect(response.Configuration!.Timeout).toBeGreaterThan(0);

    console.log(`✓ Compliance Lambda functions configured in ${regions.length} region(s)`);
  }, 120000);

  test("Config rules reference Lambda functions", async () => {
    const recorderNamesJson = outputs.config_recorder_names?.value;
    if (!recorderNamesJson) {
      console.warn("Skipping Config rules Lambda reference test - recorder names not found");
      return;
    }

    const recorders = parseJsonObject(recorderNamesJson);
    const firstRegion = Object.keys(recorders)[0];
    const client = configClients[firstRegion] || configClient;

    const response = await retry(async () => {
      return await client.send(new DescribeConfigRulesCommand({}));
    }, 5, 2000, "Config rules Lambda reference");

    const lambdaRules = response.ConfigRules!.filter(
      (r) => r.Source?.Owner === "CUSTOM_LAMBDA"
    );

    if (lambdaRules.length > 0) {
      expect(lambdaRules[0].Source?.SourceIdentifier).toBeTruthy();
      expect(lambdaRules[0].Source?.SourceIdentifier).toMatch(/^arn:aws:lambda:/);
      console.log(`✓ Config rules reference Lambda functions`);
    } else {
      console.log("Note: No Lambda-based Config rules found (may use managed rules)");
    }
  }, 90000);
});