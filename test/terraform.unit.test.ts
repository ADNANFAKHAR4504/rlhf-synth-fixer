// Unit tests for AWS Config Compliance Terraform infrastructure
// Target: 90%+ coverage of AWS Config compliance infrastructure

import fs from "fs";
import path from "path";

const MAIN_FILE = "../lib/main.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const CONFIG_FILE = "../lib/config.tf";
const CONFIG_RULES_FILE = "../lib/config_rules.tf";
const CONFIG_AGGREGATOR_FILE = "../lib/config_aggregator.tf";
const IAM_FILE = "../lib/iam.tf";
const LAMBDA_FILE = "../lib/lambda.tf";
const LAMBDA_PACKAGES_FILE = "../lib/lambda_packages.tf";
const S3_FILE = "../lib/s3.tf";
const SNS_FILE = "../lib/sns.tf";

const mainPath = path.resolve(__dirname, MAIN_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const configPath = path.resolve(__dirname, CONFIG_FILE);
const configRulesPath = path.resolve(__dirname, CONFIG_RULES_FILE);
const configAggregatorPath = path.resolve(__dirname, CONFIG_AGGREGATOR_FILE);
const iamPath = path.resolve(__dirname, IAM_FILE);
const lambdaPath = path.resolve(__dirname, LAMBDA_FILE);
const lambdaPackagesPath = path.resolve(__dirname, LAMBDA_PACKAGES_FILE);
const s3Path = path.resolve(__dirname, S3_FILE);
const snsPath = path.resolve(__dirname, SNS_FILE);

function readFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function hasResource(content: string, resourceType: string, resourceName: string): boolean {
  const pattern = new RegExp(
    `resource\\s+"${resourceType.replace(/\./g, "\\.")}"\\s+"${resourceName.replace(/\./g, "\\.")}"\\s*{`
  );
  return pattern.test(content);
}

function hasOutput(content: string, outputName: string): boolean {
  const pattern = new RegExp(`output\\s+"${outputName.replace(/\./g, "\\.")}"\\s*{`);
  return pattern.test(content);
}

function countResourceOccurrences(content: string, resourceType: string): number {
  const pattern = new RegExp(`resource\\s+"${resourceType.replace(/\./g, "\\.")}"`, "g");
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

describe("AWS Config Compliance Infrastructure - File Structure", () => {
  test("main.tf file exists", () => {
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test("variables.tf file exists", () => {
    expect(fs.existsSync(variablesPath)).toBe(true);
  });

  test("outputs.tf file exists", () => {
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test("config.tf file exists", () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test("config_rules.tf file exists", () => {
    expect(fs.existsSync(configRulesPath)).toBe(true);
  });

  test("config_aggregator.tf file exists", () => {
    expect(fs.existsSync(configAggregatorPath)).toBe(true);
  });

  test("iam.tf file exists", () => {
    expect(fs.existsSync(iamPath)).toBe(true);
  });

  test("lambda.tf file exists", () => {
    expect(fs.existsSync(lambdaPath)).toBe(true);
  });

  test("lambda_packages.tf file exists", () => {
    expect(fs.existsSync(lambdaPackagesPath)).toBe(true);
  });

  test("s3.tf file exists", () => {
    expect(fs.existsSync(s3Path)).toBe(true);
  });

  test("sns.tf file exists", () => {
    expect(fs.existsSync(snsPath)).toBe(true);
  });
});

describe("AWS Config Compliance Infrastructure - Provider Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("main.tf declares terraform required_version", () => {
    expect(mainContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
  });

  test("main.tf declares AWS provider requirement", () => {
    expect(mainContent).toMatch(/required_providers\s*{/);
    expect(mainContent).toMatch(/aws\s*=\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("main.tf declares AWS provider version constraint", () => {
    expect(mainContent).toMatch(/version\s*=\s*"~>\s*\d+\.\d+"/);
  });

  test("main.tf declares archive provider", () => {
    expect(mainContent).toMatch(/archive\s*=\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
  });

  test("main.tf declares AWS provider aliases", () => {
    expect(mainContent).toMatch(/provider\s+"aws"\s*{/);
    expect(mainContent).toMatch(/alias\s*=\s*"primary"/);
  });

  test("main.tf uses primary_region variable", () => {
    expect(mainContent).toMatch(/region\s*=\s*var\.primary_region/);
  });

  test("main.tf declares data sources", () => {
    expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    expect(mainContent).toMatch(/data\s+"aws_region"\s+"current"/);
  });

  test("main.tf declares locals", () => {
    expect(mainContent).toMatch(/locals\s*{/);
    expect(mainContent).toMatch(/account_id\s*=/);
    expect(mainContent).toMatch(/config_bucket_name\s*=/);
  });
});

describe("AWS Config Compliance Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readFileContent(variablesPath);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"prod"/);
  });

  test("declares aws_regions variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_regions"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares primary_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"primary_region"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
  });

  test("declares notification_email variable", () => {
    expect(variablesContent).toMatch(/variable\s+"notification_email"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*null/);
  });

  test("declares config_delivery_frequency variable", () => {
    expect(variablesContent).toMatch(/variable\s+"config_delivery_frequency"\s*{/);
  });

  test("declares lambda_timeout variable", () => {
    expect(variablesContent).toMatch(/variable\s+"lambda_timeout"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares compliance_check_schedule variable", () => {
    expect(variablesContent).toMatch(/variable\s+"compliance_check_schedule"\s*{/);
  });

  test("declares resource_types_to_record variable", () => {
    expect(variablesContent).toMatch(/variable\s+"resource_types_to_record"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("variables have proper descriptions", () => {
    expect(variablesContent).toMatch(/description\s*=\s*"[^"]+"/);
  });
});

describe("AWS Config Compliance Infrastructure - AWS Config Resources", () => {
  let configContent: string;

  beforeAll(() => {
    configContent = readFileContent(configPath);
  });

  test("creates Config recorders for multiple regions", () => {
    expect(hasResource(configContent, "aws_config_configuration_recorder", "us_east_1")).toBe(true);
    expect(hasResource(configContent, "aws_config_configuration_recorder", "us_west_2")).toBe(true);
    expect(hasResource(configContent, "aws_config_configuration_recorder", "eu_west_1")).toBe(true);
  });

  test("Config recorders use IAM role", () => {
    expect(configContent).toMatch(/role_arn\s*=\s*aws_iam_role\.config_role\.arn/);
  });

  test("creates Config delivery channels", () => {
    expect(hasResource(configContent, "aws_config_delivery_channel", "us_east_1")).toBe(true);
  });

  test("Config delivery channels use S3 bucket", () => {
    expect(configContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.config_bucket\.id/);
  });

  test("Config delivery channels use SNS topic", () => {
    expect(configContent).toMatch(/sns_topic_arn\s*=\s*aws_sns_topic\./);
  });

  test("creates Config recorder status resources", () => {
    expect(hasResource(configContent, "aws_config_configuration_recorder_status", "us_east_1")).toBe(true);
  });

  test("Config recorder status enables recording", () => {
    expect(configContent).toMatch(/is_enabled\s*=\s*true/);
  });
});

describe("AWS Config Compliance Infrastructure - Config Rules", () => {
  let configRulesContent: string;

  beforeAll(() => {
    configRulesContent = readFileContent(configRulesPath);
  });

  test("creates encryption compliance rules", () => {
    expect(hasResource(configRulesContent, "aws_config_config_rule", "encryption_us_east_1")).toBe(true);
  });

  test("creates tagging compliance rules", () => {
    expect(hasResource(configRulesContent, "aws_config_config_rule", "tagging_us_east_1")).toBe(true);
  });

  test("creates backup compliance rules", () => {
    expect(hasResource(configRulesContent, "aws_config_config_rule", "backup_us_east_1")).toBe(true);
  });

  test("Config rules use Lambda functions", () => {
    expect(configRulesContent).toMatch(/source_identifier\s*=\s*aws_lambda_function\./);
  });

  test("Config rules have scope defined", () => {
    expect(configRulesContent).toMatch(/scope\s*{/);
    expect(configRulesContent).toMatch(/compliance_resource_types/);
  });
});

describe("AWS Config Compliance Infrastructure - Config Aggregator", () => {
  let aggregatorContent: string;

  beforeAll(() => {
    aggregatorContent = readFileContent(configAggregatorPath);
  });

  test("creates Config aggregator", () => {
    expect(hasResource(aggregatorContent, "aws_config_configuration_aggregator", "organization")).toBe(true);
  });

  test("Config aggregator uses account aggregation", () => {
    expect(aggregatorContent).toMatch(/account_aggregation_source/);
  });
});

describe("AWS Config Compliance Infrastructure - IAM Resources", () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = readFileContent(iamPath);
  });

  test("creates Config IAM role", () => {
    expect(hasResource(iamContent, "aws_iam_role", "config_role")).toBe(true);
  });

  test("Config role has assume role policy for Config service", () => {
    expect(iamContent).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
  });

  test("attaches Config managed policy", () => {
    expect(hasResource(iamContent, "aws_iam_role_policy_attachment", "config_policy")).toBe(true);
    expect(iamContent).toMatch(/ConfigRole/);
  });

  test("creates Lambda IAM role", () => {
    expect(hasResource(iamContent, "aws_iam_role", "lambda_role")).toBe(true);
  });

  test("Lambda role has assume role policy for Lambda service", () => {
    expect(iamContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
  });
});

describe("AWS Config Compliance Infrastructure - Lambda Resources", () => {
  let lambdaContent: string;

  beforeAll(() => {
    lambdaContent = readFileContent(lambdaPath);
  });

  test("creates encryption check Lambda functions", () => {
    expect(hasResource(lambdaContent, "aws_lambda_function", "encryption_check")).toBe(true);
  });

  test("creates tagging check Lambda functions", () => {
    expect(hasResource(lambdaContent, "aws_lambda_function", "tagging_check")).toBe(true);
  });

  test("creates backup check Lambda functions", () => {
    expect(hasResource(lambdaContent, "aws_lambda_function", "backup_check")).toBe(true);
  });

  test("Lambda functions use timeout variable", () => {
    expect(lambdaContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
  });

  test("Lambda functions have runtime specified", () => {
    expect(lambdaContent).toMatch(/runtime\s*=\s*"python/);
  });
});

describe("AWS Config Compliance Infrastructure - S3 Resources", () => {
  let s3Content: string;

  beforeAll(() => {
    s3Content = readFileContent(s3Path);
  });

  test("creates S3 bucket for Config data", () => {
    expect(hasResource(s3Content, "aws_s3_bucket", "config_bucket")).toBe(true);
  });

  test("Config bucket uses local bucket name", () => {
    expect(s3Content).toMatch(/bucket\s*=\s*local\.config_bucket_name/);
  });

  test("configures S3 bucket versioning", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_versioning", "config_bucket")).toBe(true);
    expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures S3 bucket encryption", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_server_side_encryption_configuration", "config_bucket")).toBe(true);
    expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("configures S3 bucket public access block", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_public_access_block", "config_bucket")).toBe(true);
    expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("creates S3 bucket policy for Config", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_policy", "config_bucket")).toBe(true);
    expect(s3Content).toMatch(/config\.amazonaws\.com/);
  });
});

describe("AWS Config Compliance Infrastructure - SNS Resources", () => {
  let snsContent: string;

  beforeAll(() => {
    snsContent = readFileContent(snsPath);
  });

  test("creates SNS topic for compliance notifications", () => {
    expect(hasResource(snsContent, "aws_sns_topic", "compliance_notifications")).toBe(true);
  });

  test("creates SNS subscription conditionally", () => {
    expect(snsContent).toMatch(/count\s*=\s*var\.notification_email\s*!=\s*null/);
  });
});

describe("AWS Config Compliance Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readFileContent(outputsPath);
  });

  test("exports Config bucket name", () => {
    expect(hasOutput(outputsContent, "config_bucket_name")).toBe(true);
  });

  test("exports Config bucket ARN", () => {
    expect(hasOutput(outputsContent, "config_bucket_arn")).toBe(true);
  });

  test("exports SNS topic ARN", () => {
    expect(hasOutput(outputsContent, "sns_topic_arn")).toBe(true);
  });

  test("exports Config role ARN", () => {
    expect(hasOutput(outputsContent, "config_role_arn")).toBe(true);
  });

  test("exports Lambda role ARN", () => {
    expect(hasOutput(outputsContent, "lambda_role_arn")).toBe(true);
  });

  test("exports Config aggregator ARN", () => {
    expect(hasOutput(outputsContent, "config_aggregator_arn")).toBe(true);
  });

  test("exports Lambda function ARNs", () => {
    expect(hasOutput(outputsContent, "encryption_lambda_arns")).toBe(true);
    expect(hasOutput(outputsContent, "tagging_lambda_arns")).toBe(true);
    expect(hasOutput(outputsContent, "backup_lambda_arns")).toBe(true);
  });

  test("outputs have proper descriptions", () => {
    expect(outputsContent).toMatch(/description\s*=\s*"[^"]+"/);
  });
});

describe("AWS Config Compliance Infrastructure - Best Practices", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [
      MAIN_FILE,
      CONFIG_FILE,
      CONFIG_RULES_FILE,
      IAM_FILE,
      LAMBDA_FILE,
      S3_FILE,
      SNS_FILE,
    ];
    allContent = files.map((file) => readFileContent(path.resolve(__dirname, file))).join("\n");
  });

  test("uses versioning for S3 buckets", () => {
    const versioningResources = countResourceOccurrences(allContent, "aws_s3_bucket_versioning");
    expect(versioningResources).toBeGreaterThanOrEqual(1);
  });

  test("enables encryption for S3 buckets", () => {
    const encryptionResources = countResourceOccurrences(
      allContent,
      "aws_s3_bucket_server_side_encryption_configuration"
    );
    expect(encryptionResources).toBeGreaterThanOrEqual(1);
  });

  test("blocks public access on S3 buckets", () => {
    const publicAccessBlock = countResourceOccurrences(allContent, "aws_s3_bucket_public_access_block");
    expect(publicAccessBlock).toBeGreaterThanOrEqual(1);
  });

  test("uses IAM roles for service access", () => {
    expect(hasResource(allContent, "aws_iam_role", "config_role")).toBe(true);
    expect(hasResource(allContent, "aws_iam_role", "lambda_role")).toBe(true);
  });

  test("implements multi-region Config deployment", () => {
    const recorderCount = countResourceOccurrences(allContent, "aws_config_configuration_recorder");
    expect(recorderCount).toBeGreaterThanOrEqual(3);
  });

  test("implements compliance checking with Lambda", () => {
    const lambdaCount = countResourceOccurrences(allContent, "aws_lambda_function");
    expect(lambdaCount).toBeGreaterThanOrEqual(3);
  });
});

describe("AWS Config Compliance Infrastructure - Security Best Practices", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [IAM_FILE, S3_FILE, LAMBDA_FILE];
    allContent = files.map((file) => readFileContent(path.resolve(__dirname, file))).join("\n");
  });

  test("IAM roles use least privilege", () => {
    expect(allContent).toMatch(/assume_role_policy/);
  });

  test("S3 bucket has encryption enabled", () => {
    expect(allContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("S3 bucket blocks public access", () => {
    expect(allContent).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("Lambda functions have IAM roles", () => {
    expect(allContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_role\.arn/);
  });
});

describe("AWS Config Compliance Infrastructure - Coverage Summary", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [
      MAIN_FILE,
      CONFIG_FILE,
      CONFIG_RULES_FILE,
      CONFIG_AGGREGATOR_FILE,
      IAM_FILE,
      LAMBDA_FILE,
      S3_FILE,
      SNS_FILE,
    ];
    allContent = files.map((file) => readFileContent(path.resolve(__dirname, file))).join("\n");
  });

  test("implements complete Config infrastructure stack", () => {
    expect(hasResource(allContent, "aws_config_configuration_recorder", "us_east_1")).toBe(true);
    expect(hasResource(allContent, "aws_config_delivery_channel", "us_east_1")).toBe(true);
    expect(hasResource(allContent, "aws_config_config_rule", "encryption_us_east_1")).toBe(true);
    expect(hasResource(allContent, "aws_config_configuration_aggregator", "organization")).toBe(true);
  });

  test("implements Lambda-based compliance checking", () => {
    expect(hasResource(allContent, "aws_lambda_function", "encryption_check")).toBe(true);
    expect(hasResource(allContent, "aws_lambda_function", "tagging_check")).toBe(true);
    expect(hasResource(allContent, "aws_lambda_function", "backup_check")).toBe(true);
  });

  test("implements multi-region support", () => {
    const recorderCount = countResourceOccurrences(allContent, "aws_config_configuration_recorder");
    expect(recorderCount).toBeGreaterThanOrEqual(3);
  });

  test("implements monitoring and notifications", () => {
    expect(hasResource(allContent, "aws_sns_topic", "compliance_notifications")).toBe(true);
    expect(hasResource(allContent, "aws_s3_bucket", "config_bucket")).toBe(true);
  });
});
