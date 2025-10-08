// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates infrastructure resources without executing Terraform

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure - File Existence", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
  });
});

describe("Terraform Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf configures S3 backend", () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
  });
});

describe("Terraform Infrastructure - Variables", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares secondary_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"secondary_region"\s*{/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares app_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"app_name"\s*{/);
  });
});

describe("Terraform Infrastructure - VPC Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates primary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"\s*{/);
  });

  test("VPC has DNS support enabled", () => {
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC has DNS hostnames enabled", () => {
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("creates private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"\s*{/);
  });

  test("creates public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"\s*{/);
  });

  test("creates internet gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"\s*{/);
  });

  test("creates route table for public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"\s*{/);
  });

  test("creates security group for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"\s*{/);
  });
});

describe("Terraform Infrastructure - S3 Buckets", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates primary data bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary_data"\s*{/);
  });

  test("creates CloudFormation templates bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudformation_templates"\s*{/);
  });

  test("enables versioning on primary data bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary_data"\s*{/);
  });

  test("configures encryption for primary data bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary_data"\s*{/);
  });

  test("blocks public access on primary data bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary_data"\s*{/);
  });

  test("encryption uses AES256", () => {
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });
});

describe("Terraform Infrastructure - CloudWatch Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates Lambda log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_failover"\s*{/);
  });

  test("creates application log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"\s*{/);
  });

  test("sets log retention for Lambda logs", () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
  });

  test("sets log retention for application logs", () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
  });
});

describe("Terraform Infrastructure - IAM Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates Lambda IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_failover"\s*{/);
  });

  test("creates Lambda IAM policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_failover"\s*{/);
  });

  test("Lambda role has AssumeRole policy", () => {
    expect(stackContent).toMatch(/sts:AssumeRole/);
  });

  test("Lambda policy grants CloudWatch Logs permissions", () => {
    expect(stackContent).toMatch(/logs:CreateLogGroup/);
    expect(stackContent).toMatch(/logs:CreateLogStream/);
    expect(stackContent).toMatch(/logs:PutLogEvents/);
  });

  test("Lambda policy grants S3 permissions", () => {
    expect(stackContent).toMatch(/s3:GetObject/);
    expect(stackContent).toMatch(/s3:PutObject/);
    expect(stackContent).toMatch(/s3:ListBucket/);
  });

  test("Lambda policy grants CloudFormation permissions", () => {
    expect(stackContent).toMatch(/cloudformation:DescribeStacks/);
    expect(stackContent).toMatch(/cloudformation:CreateStack/);
  });

  test("Lambda policy grants CloudWatch metrics permissions", () => {
    expect(stackContent).toMatch(/cloudwatch:PutMetricData/);
  });

  test("Lambda policy grants VPC permissions", () => {
    expect(stackContent).toMatch(/ec2:CreateNetworkInterface/);
    expect(stackContent).toMatch(/ec2:DescribeNetworkInterfaces/);
    expect(stackContent).toMatch(/ec2:DeleteNetworkInterface/);
  });
});

describe("Terraform Infrastructure - Lambda Function", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates archive data source for Lambda", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_failover"\s*{/);
  });

  test("creates Lambda function resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover"\s*{/);
  });

  test("Lambda uses Python runtime", () => {
    expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("Lambda has appropriate timeout", () => {
    expect(stackContent).toMatch(/timeout\s*=\s*300/);
  });

  test("Lambda has appropriate memory", () => {
    expect(stackContent).toMatch(/memory_size\s*=\s*512/);
  });

  test("Lambda has environment variables", () => {
    expect(stackContent).toMatch(/environment\s*{/);
    expect(stackContent).toMatch(/PRIMARY_BUCKET/);
    expect(stackContent).toMatch(/SECONDARY_REGION/);
  });

  test("Lambda has VPC configuration", () => {
    expect(stackContent).toMatch(/vpc_config\s*{/);
  });

  test("creates Lambda permission for EventBridge", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"\s*{/);
  });
});

describe("Terraform Infrastructure - EventBridge", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates EventBridge rule", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"health_check"\s*{/);
  });

  test("EventBridge rule has schedule expression", () => {
    expect(stackContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
  });

  test("creates EventBridge target", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda_failover"\s*{/);
  });
});

describe("Terraform Infrastructure - CloudWatch Alarms", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates Lambda errors alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
  });

  test("creates S3 bucket errors alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"s3_bucket_errors"\s*{/);
  });

  test("Lambda alarm monitors Errors metric", () => {
    expect(stackContent).toMatch(/metric_name\s*=\s*"Errors"/);
  });

  test("S3 alarm monitors 4xxErrors metric", () => {
    expect(stackContent).toMatch(/metric_name\s*=\s*"4xxErrors"/);
  });
});

describe("Terraform Infrastructure - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("outputs VPC ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test("outputs primary bucket name", () => {
    expect(stackContent).toMatch(/output\s+"primary_bucket_name"\s*{/);
  });

  test("outputs Lambda function name", () => {
    expect(stackContent).toMatch(/output\s+"lambda_function_name"\s*{/);
  });

  test("outputs EventBridge rule name", () => {
    expect(stackContent).toMatch(/output\s+"eventbridge_rule_name"\s*{/);
  });

  test("outputs CloudWatch log group names", () => {
    expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_lambda"\s*{/);
    expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_application"\s*{/);
  });

  test("outputs subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
  });
});

describe("Terraform Infrastructure - Security Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("S3 buckets have encryption enabled", () => {
    const encryptionMatches = stackContent.match(/aws_s3_bucket_server_side_encryption_configuration/g);
    expect(encryptionMatches).toBeTruthy();
    expect(encryptionMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test("S3 buckets have versioning enabled", () => {
    const versioningMatches = stackContent.match(/aws_s3_bucket_versioning/g);
    expect(versioningMatches).toBeTruthy();
    expect(versioningMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test("S3 buckets have public access blocked", () => {
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("all resources have tags", () => {
    const tagMatches = stackContent.match(/tags\s*=\s*{/g);
    expect(tagMatches).toBeTruthy();
    expect(tagMatches!.length).toBeGreaterThan(15);
  });

  test("IAM policies use least privilege principle", () => {
    expect(stackContent).toMatch(/Resource\s*=\s*\[/);
    // Allow scoped ARN patterns with wildcards but not bare "*"
    const bareWildcards = stackContent.match(/Resource\s*=\s*"\*"(?!\:)/g);
    if (bareWildcards && bareWildcards.length > 0) {
      console.error("Found bare wildcard resources:", bareWildcards);
    }
    expect(bareWildcards).toBeNull();
  });
});

describe("Terraform Infrastructure - Resource Naming", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("resources use app_name variable for naming", () => {
    const nameMatches = stackContent.match(/\$\{var\.app_name\}/g);
    expect(nameMatches).toBeTruthy();
    expect(nameMatches!.length).toBeGreaterThan(20);
  });

  test("resources use environment variable for tagging", () => {
    const envMatches = stackContent.match(/Environment\s*=\s*var\.environment/g);
    expect(envMatches).toBeTruthy();
    expect(envMatches!.length).toBeGreaterThan(10);
  });
});

describe("Terraform Infrastructure - Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("uses aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("uses aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });
});

describe("Terraform Infrastructure - Multi-AZ Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("subnets use count for multi-AZ", () => {
    expect(stackContent).toMatch(/count\s*=\s*2/);
  });

  test("subnets reference availability zones", () => {
    expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
  });
});

describe("Terraform Infrastructure - SNS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates SNS topic for notifications", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"failover_notifications"\s*{/);
  });

  test("SNS topic has encryption configured", () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
  });

  test("creates SNS topic policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"failover_notifications"\s*{/);
  });

  test("SNS policy allows CloudWatch to publish", () => {
    expect(stackContent).toMatch(/"cloudwatch\.amazonaws\.com"/);
  });

  test("Lambda has SNS publish permission", () => {
    expect(stackContent).toMatch(/sns:Publish/);
  });

  test("Lambda environment includes SNS topic ARN", () => {
    expect(stackContent).toMatch(/SNS_TOPIC_ARN/);
  });

  test("CloudWatch alarms send notifications to SNS", () => {
    expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.failover_notifications\.arn\]/);
  });
});

describe("Terraform Infrastructure - Enhanced Monitoring", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates Lambda duration alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_duration"\s*{/);
  });

  test("Lambda duration alarm monitors Duration metric", () => {
    expect(stackContent).toMatch(/metric_name\s*=\s*"Duration"/);
  });

  test("creates Lambda throttles alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"\s*{/);
  });

  test("Lambda throttles alarm monitors Throttles metric", () => {
    expect(stackContent).toMatch(/metric_name\s*=\s*"Throttles"/);
  });

  test("alarms have severity tags", () => {
    expect(stackContent).toMatch(/Severity\s*=\s*"high"/);
    expect(stackContent).toMatch(/Severity\s*=\s*"medium"/);
    expect(stackContent).toMatch(/Severity\s*=\s*"low"/);
  });

  test("Lambda code includes SNS notification logic", () => {
    expect(stackContent).toMatch(/sns\.publish/);
  });

  test("outputs SNS topic ARN", () => {
    expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
  });

  test("outputs CloudWatch alarm details", () => {
    expect(stackContent).toMatch(/output\s+"cloudwatch_alarms"\s*{/);
    expect(stackContent).toMatch(/lambda_throttles/);
  });
});

describe("Terraform Infrastructure - Cost Optimization", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("S3 bucket has lifecycle configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"primary_data"\s*{/);
  });

  test("lifecycle transitions to IA storage class", () => {
    expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
  });

  test("lifecycle transitions to Glacier", () => {
    expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
  });

  test("lifecycle expires old data", () => {
    expect(stackContent).toMatch(/expiration\s*{/);
  });

  test("lifecycle removes old versions", () => {
    expect(stackContent).toMatch(/noncurrent_version_expiration\s*{/);
  });
});
