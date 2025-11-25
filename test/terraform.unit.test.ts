// Unit tests for Payment Processing Platform Terraform infrastructure
// Target: 90%+ coverage of payment processing infrastructure

import fs from "fs";
import path from "path";

const MAIN_FILE = "../lib/main.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const LOCALS_FILE = "../lib/locals.tf";
const VPC_MODULE_FILE = "../lib/modules/vpc/main.tf";
const AURORA_MODULE_FILE = "../lib/modules/aurora/main.tf";
const LAMBDA_MODULE_FILE = "../lib/modules/lambda/main.tf";

const mainPath = path.resolve(__dirname, MAIN_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const localsPath = path.resolve(__dirname, LOCALS_FILE);
const vpcModulePath = path.resolve(__dirname, VPC_MODULE_FILE);
const auroraModulePath = path.resolve(__dirname, AURORA_MODULE_FILE);
const lambdaModulePath = path.resolve(__dirname, LAMBDA_MODULE_FILE);

// Helper function to read file content
function readFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper function to check if resource exists
function hasResource(content: string, resourceType: string, resourceName: string): boolean {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`, "g");
  return regex.test(content);
}

// Helper function to check if output exists
function hasOutput(content: string, outputName: string): boolean {
  const regex = new RegExp(`output\\s+"${outputName}"\\s*{`, "g");
  return regex.test(content);
}

// Helper function to count resource occurrences
function countResourceOccurrences(content: string, resourceType: string): number {
  const regex = new RegExp(`resource\\s+"${resourceType}"`, "g");
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

describe("Payment Processing Platform Infrastructure - File Structure", () => {
  test("main.tf file exists", () => {
    const exists = fs.existsSync(mainPath);
    if (!exists) {
      console.error(`[FAIL] Expected main file at: ${mainPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf file exists", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
  });

  test("variables.tf file exists", () => {
    const exists = fs.existsSync(variablesPath);
    expect(exists).toBe(true);
  });

  test("outputs.tf file exists", () => {
    const exists = fs.existsSync(outputsPath);
    expect(exists).toBe(true);
  });

  test("locals.tf file exists", () => {
    const exists = fs.existsSync(localsPath);
    expect(exists).toBe(true);
  });

  test("VPC module main.tf exists", () => {
    const exists = fs.existsSync(vpcModulePath);
    expect(exists).toBe(true);
  });

  test("Aurora module main.tf exists", () => {
    const exists = fs.existsSync(auroraModulePath);
    expect(exists).toBe(true);
  });

  test("Lambda module main.tf exists", () => {
    const exists = fs.existsSync(lambdaModulePath);
    expect(exists).toBe(true);
  });

  test("main.tf has non-zero content", () => {
    const stats = fs.statSync(mainPath);
    expect(stats.size).toBeGreaterThan(100);
  });
});

describe("Payment Processing Platform Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readFileContent(providerPath);
  });

  test("provider.tf declares terraform required_version", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
  });

  test("provider.tf declares AWS provider requirement", () => {
    expect(providerContent).toMatch(/required_providers\s*{/);
    expect(providerContent).toMatch(/aws\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("provider.tf declares AWS provider version constraint", () => {
    expect(providerContent).toMatch(/version\s*=\s*">=\s*\d+\.\d+"/);
  });

  test("provider.tf declares random provider requirement", () => {
    expect(providerContent).toMatch(/random\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
  });

  test("provider.tf configures S3 backend", () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf configures default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
  });
});

describe("Payment Processing Platform Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readFileContent(variablesPath);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares environment variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares availability_zones variable", () => {
    expect(variablesContent).toMatch(/variable\s+"availability_zones"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares Aurora resource variables", () => {
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_class"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares Lambda resource variables", () => {
    expect(variablesContent).toMatch(/variable\s+"lambda_memory_size"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"lambda_timeout"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares s3_bucket_count variable", () => {
    expect(variablesContent).toMatch(/variable\s+"s3_bucket_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares log_retention_days variable", () => {
    expect(variablesContent).toMatch(/variable\s+"log_retention_days"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("variables have proper descriptions", () => {
    expect(variablesContent).toMatch(/description\s*=\s*"AWS region for resources"/);
    expect(variablesContent).toMatch(/description\s*=\s*"Environment suffix for resource naming"/);
  });
});

describe("Payment Processing Platform Infrastructure - Locals Configuration", () => {
  let localsContent: string;

  beforeAll(() => {
    localsContent = readFileContent(localsPath);
  });

  test("declares locals block", () => {
    expect(localsContent).toMatch(/^locals\s*{/m);
  });

  test("defines name prefix with random suffix", () => {
    expect(localsContent).toMatch(/name_prefix\s*=/);
    expect(localsContent).toMatch(/random_id\.suffix\.hex/);
    expect(localsContent).toMatch(/var\.project_name/);
    expect(localsContent).toMatch(/var\.environment_suffix/);
  });

  test("defines common tags", () => {
    expect(localsContent).toMatch(/common_tags\s*=\s*{/);
    expect(localsContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(localsContent).toMatch(/Project\s*=\s*var\.project_id/);
    expect(localsContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });
});

describe("Payment Processing Platform Infrastructure - Random ID Resource", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates random_id resource for unique naming", () => {
    expect(mainContent).toMatch(/resource\s+"random_id"\s+"suffix"\s*{/);
    expect(mainContent).toMatch(/byte_length\s*=\s*4/);
  });
});

describe("Payment Processing Platform Infrastructure - VPC Module", () => {
  let mainContent: string;
  let vpcModuleContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
    vpcModuleContent = readFileContent(vpcModulePath);
  });

  test("main.tf references VPC module", () => {
    expect(mainContent).toMatch(/module\s+"vpc"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });

  test("VPC module receives required variables", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(mainContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr/);
    expect(mainContent).toMatch(/availability_zones\s*=\s*var\.availability_zones/);
  });

  test("VPC module creates VPC", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(vpcModuleContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpcModuleContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpcModuleContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC module creates Internet Gateway", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    expect(vpcModuleContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("VPC module creates public subnets", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(vpcModuleContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcModuleContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("VPC module creates private subnets", () => {
    expect(vpcModuleContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(vpcModuleContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
  });
});

describe("Payment Processing Platform Infrastructure - Security Groups", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates ALB security group", () => {
    expect(hasResource(mainContent, "aws_security_group", "alb")).toBe(true);
    expect(mainContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-alb-"/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
  });

  test("ALB security group allows HTTP from internet", () => {
    const albSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(albSgBlock).toBeTruthy();
    expect(albSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
    expect(albSgBlock![0]).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("ALB security group allows HTTPS from internet", () => {
    const albSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(albSgBlock).toBeTruthy();
    expect(albSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443/);
  });

  test("creates Lambda security group", () => {
    expect(hasResource(mainContent, "aws_security_group", "lambda")).toBe(true);
    expect(mainContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-lambda-"/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
  });

  test("Lambda security group allows egress", () => {
    const lambdaSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"lambda"\s*{[\s\S]*?(?=resource|$)/);
    expect(lambdaSgBlock).toBeTruthy();
    expect(lambdaSgBlock![0]).toMatch(/egress\s*{[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });
});

describe("Payment Processing Platform Infrastructure - S3 Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates S3 buckets with count", () => {
    expect(hasResource(mainContent, "aws_s3_bucket", "data")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*var\.s3_bucket_count/);
    expect(mainContent).toMatch(/bucket\s*=\s*"\$\{local\.name_prefix\}-data-\$\{count\.index\s*\+\s*1\}"/);
  });

  test("configures S3 bucket versioning", () => {
    expect(hasResource(mainContent, "aws_s3_bucket_versioning", "data")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*var\.s3_bucket_count/);
    expect(mainContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.data\[count\.index\]\.id/);
    expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("S3 buckets use common tags", () => {
    expect(mainContent).toMatch(/tags\s*=\s*merge\s*\([\s\S]*?local\.common_tags/);
  });
});

describe("Payment Processing Platform Infrastructure - Aurora Module", () => {
  let mainContent: string;
  let auroraModuleContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
    auroraModuleContent = readFileContent(auroraModulePath);
  });

  test("main.tf references Aurora module", () => {
    expect(mainContent).toMatch(/module\s+"aurora"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/aurora"/);
  });

  test("Aurora module receives required variables", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
    expect(mainContent).toMatch(/subnet_ids\s*=\s*module\.vpc\.private_subnet_ids/);
    expect(mainContent).toMatch(/instance_class\s*=\s*var\.aurora_instance_class/);
    expect(mainContent).toMatch(/instance_count\s*=\s*var\.aurora_instance_count/);
  });

  test("Aurora module creates DB subnet group", () => {
    expect(auroraModuleContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*{/);
    expect(auroraModuleContent).toMatch(/name\s*=\s*"\$\{var\.name_prefix\}-aurora-subnet-group"/);
  });

  test("Aurora module creates security group", () => {
    expect(auroraModuleContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
    expect(auroraModuleContent).toMatch(/from_port\s*=\s*5432/);
    expect(auroraModuleContent).toMatch(/to_port\s*=\s*5432/);
  });

  test("Aurora module creates RDS cluster", () => {
    expect(auroraModuleContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
    expect(auroraModuleContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    expect(auroraModuleContent).toMatch(/storage_encrypted\s*=\s*true/);
  });
});

describe("Payment Processing Platform Infrastructure - Lambda Module", () => {
  let mainContent: string;
  let lambdaModuleContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
    lambdaModuleContent = readFileContent(lambdaModulePath);
  });

  test("main.tf references Lambda module", () => {
    expect(mainContent).toMatch(/module\s+"lambda"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/lambda"/);
  });

  test("Lambda module receives required variables", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(mainContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
    expect(mainContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    expect(mainContent).toMatch(/s3_bucket_arn\s*=\s*aws_s3_bucket\.data\[0\]\.arn/);
  });

  test("Lambda module creates IAM role", () => {
    expect(lambdaModuleContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda"\s*{/);
    expect(lambdaModuleContent).toMatch(/lambda\.amazonaws\.com/);
  });

  test("Lambda module creates Lambda function", () => {
    expect(lambdaModuleContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"\s*{/);
    expect(lambdaModuleContent).toMatch(/runtime\s*=\s*"python/);
  });
});

describe("Payment Processing Platform Infrastructure - ALB Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates Application Load Balancer", () => {
    expect(hasResource(mainContent, "aws_lb", "main")).toBe(true);
    expect(mainContent).toMatch(/name\s*=\s*"\$\{local\.short_prefix\}-alb"/);
    expect(mainContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(mainContent).toMatch(/internal\s*=\s*false/);
  });

  test("ALB is in public subnets", () => {
    expect(mainContent).toMatch(/subnets\s*=\s*module\.vpc\.public_subnet_ids/);
  });

  test("ALB uses ALB security group", () => {
    expect(mainContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("creates target group for ALB", () => {
    expect(hasResource(mainContent, "aws_lb_target_group", "main")).toBe(true);
    expect(mainContent).toMatch(/name\s*=\s*"\$\{local\.short_prefix\}-tg"/);
    expect(mainContent).toMatch(/port\s*=\s*80/);
    expect(mainContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
  });

  test("target group has health check configured", () => {
    expect(mainContent).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(mainContent).toMatch(/path\s*=\s*"\/health"/);
    expect(mainContent).toMatch(/matcher\s*=\s*"200"/);
  });

  test("creates HTTP listener on ALB", () => {
    expect(hasResource(mainContent, "aws_lb_listener", "http")).toBe(true);
    expect(mainContent).toMatch(/load_balancer_arn\s*=\s*aws_lb\.main\.arn/);
    expect(mainContent).toMatch(/port\s*=\s*"80"/);
    expect(mainContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(mainContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
  });
});

describe("Payment Processing Platform Infrastructure - SNS Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates SNS topic for alerts", () => {
    expect(hasResource(mainContent, "aws_sns_topic", "alerts")).toBe(true);
    expect(mainContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-alerts"/);
  });

  test("creates SNS topic subscription", () => {
    expect(hasResource(mainContent, "aws_sns_topic_subscription", "alerts_email")).toBe(true);
    expect(mainContent).toMatch(/topic_arn\s*=\s*aws_sns_topic\.alerts\.arn/);
    expect(mainContent).toMatch(/protocol\s*=\s*"email"/);
  });

  test("SNS subscription has filter policy", () => {
    expect(mainContent).toMatch(/filter_policy\s*=\s*jsonencode/);
    expect(mainContent).toMatch(/severity\s*=\s*\[\s*"critical",\s*"high"\s*\]/);
  });
});

describe("Payment Processing Platform Infrastructure - CloudWatch Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates CloudWatch log group", () => {
    expect(hasResource(mainContent, "aws_cloudwatch_log_group", "application")).toBe(true);
    expect(mainContent).toMatch(/name\s*=\s*"\/payment-processing\/\$\{var\.environment\}\/application/);
    expect(mainContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });

  test("CloudWatch log group uses random suffix", () => {
    expect(mainContent).toMatch(/random_id\.suffix\.hex/);
  });
});

describe("Payment Processing Platform Infrastructure - IAM Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates IAM roles with for_each", () => {
    expect(hasResource(mainContent, "aws_iam_role", "app_role")).toBe(true);
    expect(mainContent).toMatch(/for_each\s*=\s*toset\(\[\s*"api",\s*"worker",\s*"scheduler"\s*\]\)/);
  });

  test("IAM roles have name prefix", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*"\$\{local\.short_prefix\}-\$\{each\.key\}-"/);
  });

  test("IAM roles have assume role policy with ExternalId condition", () => {
    expect(mainContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    expect(mainContent).toMatch(/sts:AssumeRole/);
    expect(mainContent).toMatch(/sts:ExternalId/);
    expect(mainContent).toMatch(/\$\{var\.environment\}-\$\{each\.key\}/);
  });

  test("creates IAM role policies", () => {
    expect(hasResource(mainContent, "aws_iam_role_policy", "app_role_policy")).toBe(true);
    expect(mainContent).toMatch(/for_each\s*=\s*aws_iam_role\.app_role/);
  });

  test("IAM role policies allow S3 access", () => {
    expect(mainContent).toMatch(/s3:GetObject/);
    expect(mainContent).toMatch(/s3:PutObject/);
    expect(mainContent).toMatch(/aws_s3_bucket\.data\[0\]\.arn/);
  });

  test("IAM role policies allow CloudWatch Logs access", () => {
    expect(mainContent).toMatch(/logs:CreateLogGroup/);
    expect(mainContent).toMatch(/logs:CreateLogStream/);
    expect(mainContent).toMatch(/logs:PutLogEvents/);
    expect(mainContent).toMatch(/aws_cloudwatch_log_group\.application\.arn/);
  });
});

describe("Payment Processing Platform Infrastructure - Data Sources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("queries current AWS caller identity", () => {
    expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("queries VPC for validation", () => {
    expect(mainContent).toMatch(/data\s+"aws_vpc"\s+"validate_cidr"\s*{/);
    expect(mainContent).toMatch(/id\s*=\s*module\.vpc\.vpc_id/);
  });

  test("VPC data source has postcondition for CIDR validation", () => {
    expect(mainContent).toMatch(/lifecycle\s*{[\s\S]*?postcondition/);
    expect(mainContent).toMatch(/condition\s*=/);
    expect(mainContent).toMatch(/error_message/);
  });
});

describe("Payment Processing Platform Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readFileContent(outputsPath);
  });

  test("exports VPC ID", () => {
    expect(hasOutput(outputsContent, "vpc_id")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.vpc_id/);
  });

  test("exports VPC CIDR", () => {
    expect(hasOutput(outputsContent, "vpc_cidr")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.vpc_cidr/);
  });

  test("exports Aurora endpoint", () => {
    expect(hasOutput(outputsContent, "aurora_endpoint")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*module\.aurora\.cluster_endpoint/);
    expect(outputsContent).toMatch(/sensitive\s*=\s*true/);
  });

  test("exports Lambda function name", () => {
    expect(hasOutput(outputsContent, "lambda_function_name")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*module\.lambda\.function_name/);
  });

  test("exports S3 bucket names", () => {
    expect(hasOutput(outputsContent, "s3_bucket_names")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.data\[\*\]\.id/);
  });

  test("exports ALB DNS name", () => {
    expect(hasOutput(outputsContent, "alb_dns_name")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
  });

  test("exports SNS topic ARN", () => {
    expect(hasOutput(outputsContent, "sns_topic_arn")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*aws_sns_topic\.alerts\.arn/);
  });

  test("exports IAM role ARNs", () => {
    expect(hasOutput(outputsContent, "iam_role_arns")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*\{\s*for\s+k,\s*v\s+in\s+aws_iam_role\.app_role/);
  });

  test("outputs have proper descriptions", () => {
    expect(outputsContent).toMatch(/description\s*=\s*"VPC ID"/);
    expect(outputsContent).toMatch(/description\s*=\s*"Aurora cluster endpoint"/);
  });
});

describe("Payment Processing Platform Infrastructure - Best Practices", () => {
  let mainContent: string;
  let vpcModuleContent: string;
  let auroraModuleContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
    vpcModuleContent = readFileContent(vpcModulePath);
    auroraModuleContent = readFileContent(auroraModulePath);
  });

  test("uses versioning for S3 buckets", () => {
    const versioningCount = countResourceOccurrences(mainContent, "aws_s3_bucket_versioning");
    expect(versioningCount).toBeGreaterThan(0);
  });

  test("uses common tags for resources", () => {
    expect(mainContent).toMatch(/tags\s*=\s*merge\s*\([\s\S]*?local\.common_tags/);
    expect(vpcModuleContent).toMatch(/tags\s*=\s*merge\s*\([\s\S]*?var\.tags/);
  });

  test("uses random suffix for unique resource names", () => {
    expect(mainContent).toMatch(/random_id\.suffix\.hex/);
    expect(mainContent).toMatch(/\$\{local\.name_prefix\}/);
  });

  test("configures log retention periods", () => {
    expect(mainContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });

  test("Aurora cluster uses encryption", () => {
    expect(auroraModuleContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("uses modules for reusable components", () => {
    expect(mainContent).toMatch(/module\s+"vpc"/);
    expect(mainContent).toMatch(/module\s+"aurora"/);
    expect(mainContent).toMatch(/module\s+"lambda"/);
  });
});

describe("Payment Processing Platform Infrastructure - Security Best Practices", () => {
  let mainContent: string;
  let vpcModuleContent: string;
  let auroraModuleContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
    vpcModuleContent = readFileContent(vpcModulePath);
    auroraModuleContent = readFileContent(auroraModulePath);
  });

  test("ALB is in public subnets", () => {
    expect(mainContent).toMatch(/subnets\s*=\s*module\.vpc\.public_subnet_ids/);
  });

  test("Aurora is in private subnets", () => {
    expect(mainContent).toMatch(/subnet_ids\s*=\s*module\.vpc\.private_subnet_ids/);
  });

  test("Aurora security group allows ingress from Lambda only", () => {
    expect(auroraModuleContent).toMatch(/security_groups\s*=\s*var\.allowed_security_groups/);
    expect(mainContent).toMatch(/allowed_security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
  });

  test("IAM roles use ExternalId for additional security", () => {
    expect(mainContent).toMatch(/sts:ExternalId/);
    expect(mainContent).toMatch(/StringEquals/);
  });

  test("IAM policies use specific resource ARNs", () => {
    expect(mainContent).toMatch(/Resource\s*=\s*"\$\{aws_s3_bucket\.data\[0\]\.arn\}\/\*"/);
    expect(mainContent).toMatch(/Resource\s*=\s*"\$\{aws_cloudwatch_log_group\.application\.arn\}:/);
  });
});

describe("Payment Processing Platform Infrastructure - Coverage Summary", () => {
  let mainContent: string;
  let allContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
    const vpcContent = readFileContent(vpcModulePath);
    const auroraContent = readFileContent(auroraModulePath);
    const lambdaContent = readFileContent(lambdaModulePath);
    allContent = mainContent + vpcContent + auroraContent + lambdaContent;
  });

  test("implements complete infrastructure stack", () => {
    expect(hasResource(allContent, "aws_vpc", "main")).toBe(true);
    expect(hasResource(allContent, "aws_lb", "main")).toBe(true);
    expect(hasResource(allContent, "aws_s3_bucket", "data")).toBe(true);
    expect(hasResource(allContent, "aws_rds_cluster", "aurora")).toBe(true);
    expect(hasResource(allContent, "aws_lambda_function", "processor")).toBe(true);
    expect(hasResource(allContent, "aws_sns_topic", "alerts")).toBe(true);
  });

  test("implements networking infrastructure", () => {
    expect(hasResource(allContent, "aws_internet_gateway", "main")).toBe(true);
    expect(hasResource(allContent, "aws_subnet", "public")).toBe(true);
    expect(hasResource(allContent, "aws_subnet", "private")).toBe(true);
  });

  test("implements security infrastructure", () => {
    const sgCount = countResourceOccurrences(allContent, "aws_security_group");
    expect(sgCount).toBeGreaterThanOrEqual(3);
  });

  test("implements monitoring and logging", () => {
    expect(hasResource(mainContent, "aws_cloudwatch_log_group", "application")).toBe(true);
  });
});
