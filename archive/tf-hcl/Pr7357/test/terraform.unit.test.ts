// Unit tests for Payment Processing Infrastructure Terraform
// Target: 90%+ coverage of payment processing infrastructure

import fs from "fs";
import path from "path";

const MAIN_FILE = "../lib/main.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const USER_DATA_FILE = "../lib/user_data.sh";

const mainPath = path.resolve(__dirname, MAIN_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const userDataPath = path.resolve(__dirname, USER_DATA_FILE);

// Helper function to read file content
function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return "";
  }
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

describe("Payment Processing Infrastructure - File Structure", () => {
  test("main.tf file exists", () => {
    const exists = fs.existsSync(mainPath);
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

  test("user_data.sh file exists", () => {
    const exists = fs.existsSync(userDataPath);
    expect(exists).toBe(true);
  });

  test("main.tf has non-zero content", () => {
    const stats = fs.statSync(mainPath);
    expect(stats.size).toBeGreaterThan(100);
  });
});

describe("Payment Processing Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readFileContent(providerPath);
  });

  test("provider.tf declares terraform required_version", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+"/);
  });

  test("provider.tf declares AWS provider requirement", () => {
    expect(providerContent).toMatch(/required_providers\s*{/);
    expect(providerContent).toMatch(/aws\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("provider.tf declares AWS provider version constraint", () => {
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.\d+"/);
  });

  test("provider.tf declares random provider requirement", () => {
    expect(providerContent).toMatch(/random\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf configures default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(providerContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
  });
});

describe("Payment Processing Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readFileContent(variablesPath);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares environment variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
    expect(variablesContent).toMatch(/validation\s*{/);
    expect(variablesContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
  });

  test("declares project_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares availability_zones variable", () => {
    expect(variablesContent).toMatch(/variable\s+"availability_zones"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares instance_type variable", () => {
    expect(variablesContent).toMatch(/variable\s+"instance_type"\s*{/);
  });

  test("declares ASG variables", () => {
    expect(variablesContent).toMatch(/variable\s+"asg_min_size"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"asg_max_size"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"asg_desired_capacity"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares RDS variables", () => {
    expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"db_multi_az"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"db_backup_retention_period"\s*{/);
  });

  test("declares enable_multi_az_nat variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_multi_az_nat"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });
});

describe("Payment Processing Infrastructure - Locals Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("defines name_prefix local", () => {
    expect(mainContent).toMatch(/locals\s*{/);
    expect(mainContent).toMatch(/name_prefix\s*=/);
    expect(mainContent).toMatch(/var\.environment/);
    expect(mainContent).toMatch(/var\.environment_suffix/);
  });

  test("defines common_tags local", () => {
    expect(mainContent).toMatch(/common_tags\s*=\s*{/);
    expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(mainContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(mainContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
  });
});

describe("Payment Processing Infrastructure - VPC Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates VPC", () => {
    expect(hasResource(mainContent, "aws_vpc", "main")).toBe(true);
    expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(hasResource(mainContent, "aws_internet_gateway", "main")).toBe(true);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public subnets", () => {
    expect(hasResource(mainContent, "aws_subnet", "public")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\)/);
    expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private application subnets", () => {
    expect(hasResource(mainContent, "aws_subnet", "private_app")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\s*\+\s*2\)/);
  });

  test("creates private database subnets", () => {
    expect(hasResource(mainContent, "aws_subnet", "private_db")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\s*\+\s*4\)/);
  });

  test("creates Elastic IPs for NAT Gateways", () => {
    expect(hasResource(mainContent, "aws_eip", "nat")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_multi_az_nat\s*\?\s*length\(var\.availability_zones\)\s*:\s*1/);
    expect(mainContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("creates NAT Gateways", () => {
    expect(hasResource(mainContent, "aws_nat_gateway", "main")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_multi_az_nat\s*\?\s*length\(var\.availability_zones\)\s*:\s*1/);
    expect(mainContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    expect(mainContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("creates public route table", () => {
    expect(hasResource(mainContent, "aws_route_table", "public")).toBe(true);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("public route table has internet gateway route", () => {
    const publicRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?(?=resource|$)/);
    expect(publicRtBlock).toBeTruthy();
    expect(publicRtBlock![0]).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(publicRtBlock![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("creates public route table associations", () => {
    expect(hasResource(mainContent, "aws_route_table_association", "public")).toBe(true);
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(mainContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("creates private route table", () => {
    expect(hasResource(mainContent, "aws_route_table", "private")).toBe(true);
  });

  test("private route table routes through NAT Gateway", () => {
    const privateRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?(?=resource|$)/);
    expect(privateRtBlock).toBeTruthy();
    expect(privateRtBlock![0]).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(privateRtBlock![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
  });

  test("creates private route table associations for app subnets", () => {
    expect(hasResource(mainContent, "aws_route_table_association", "private_app")).toBe(true);
    expect(mainContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_app\[count\.index\]\.id/);
  });

  test("creates private route table associations for db subnets", () => {
    expect(hasResource(mainContent, "aws_route_table_association", "private_db")).toBe(true);
    expect(mainContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_db\[count\.index\]\.id/);
  });
});

describe("Payment Processing Infrastructure - Security Groups", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates ALB security group", () => {
    expect(hasResource(mainContent, "aws_security_group", "alb")).toBe(true);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
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

  test("creates application security group", () => {
    expect(hasResource(mainContent, "aws_security_group", "app")).toBe(true);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("application security group allows ingress from ALB only", () => {
    const appSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"app"\s*{[\s\S]*?(?=resource|$)/);
    expect(appSgBlock).toBeTruthy();
    expect(appSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("application security group allows egress", () => {
    const appSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"app"\s*{[\s\S]*?(?=resource|$)/);
    expect(appSgBlock).toBeTruthy();
    expect(appSgBlock![0]).toMatch(/egress\s*{[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("creates RDS security group", () => {
    expect(hasResource(mainContent, "aws_security_group", "rds")).toBe(true);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("RDS security group allows ingress from application security group", () => {
    const rdsSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?(?=resource|$)/);
    expect(rdsSgBlock).toBeTruthy();
    expect(rdsSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
  });
});

describe("Payment Processing Infrastructure - ALB Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates Application Load Balancer", () => {
    expect(hasResource(mainContent, "aws_lb", "main")).toBe(true);
    expect(mainContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(mainContent).toMatch(/internal\s*=\s*false/);
    expect(mainContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("ALB has security groups configured", () => {
    expect(mainContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("target group has health check configured", () => {
    expect(mainContent).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(mainContent).toMatch(/path\s*=/);
    expect(mainContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(mainContent).toMatch(/matcher\s*=\s*"200"/);
  });
});

describe("Payment Processing Infrastructure - Auto Scaling Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates launch template", () => {
    expect(hasResource(mainContent, "aws_launch_template", "main")).toBe(true);
  });

  test("launch template uses instance type variable", () => {
    expect(mainContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
  });

  test("launch template has IAM instance profile", () => {
    expect(mainContent).toMatch(/iam_instance_profile\s*{[\s\S]*?name\s*=\s*aws_iam_instance_profile\.ec2\.name/);
  });

  test("launch template has user data", () => {
    expect(mainContent).toMatch(/user_data\s*=/);
  });

  test("creates Auto Scaling Group", () => {
    expect(hasResource(mainContent, "aws_autoscaling_group", "main")).toBe(true);
  });

  test("Auto Scaling Group uses launch template", () => {
    expect(mainContent).toMatch(/launch_template\s*{[\s\S]*?id\s*=\s*aws_launch_template\.main\.id/);
  });

  test("Auto Scaling Group has min/max/desired capacity", () => {
    expect(mainContent).toMatch(/min_size\s*=\s*var\.asg_min_size/);
    expect(mainContent).toMatch(/max_size\s*=\s*var\.asg_max_size/);
    expect(mainContent).toMatch(/desired_capacity\s*=\s*var\.asg_desired_capacity/);
  });

  test("Auto Scaling Group uses private app subnets", () => {
    expect(mainContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private_app\[\*\]\.id/);
  });

  test("Auto Scaling Group has target group attachments", () => {
    expect(mainContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
  });

  test("creates Auto Scaling policy", () => {
    expect(hasResource(mainContent, "aws_autoscaling_policy", "target_tracking")).toBe(true);
  });

  test("Auto Scaling policy uses target tracking", () => {
    expect(mainContent).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
    expect(mainContent).toMatch(/target_tracking_configuration/);
  });
});

describe("Payment Processing Infrastructure - RDS Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates DB subnet group", () => {
    expect(hasResource(mainContent, "aws_db_subnet_group", "main")).toBe(true);
    expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
  });

  test("creates Secrets Manager secret for DB password", () => {
    expect(hasResource(mainContent, "aws_secretsmanager_secret", "db_password")).toBe(true);
  });

  test("creates Secrets Manager secret version", () => {
    expect(hasResource(mainContent, "aws_secretsmanager_secret_version", "db_password")).toBe(true);
    expect(mainContent).toMatch(/secret_id\s*=\s*aws_secretsmanager_secret\.db_password\.id/);
  });

  test("creates RDS monitoring IAM role", () => {
    expect(hasResource(mainContent, "aws_iam_role", "rds_monitoring")).toBe(true);
  });

  test("creates RDS instance", () => {
    expect(hasResource(mainContent, "aws_db_instance", "main")).toBe(true);
  });

  test("RDS instance uses instance class variable", () => {
    expect(mainContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
  });

  test("RDS instance uses DB subnet group", () => {
    expect(mainContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
  });

  test("RDS instance has security groups", () => {
    expect(mainContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
  });

  test("RDS instance uses multi-AZ configuration", () => {
    expect(mainContent).toMatch(/multi_az\s*=\s*var\.db_multi_az/);
  });

  test("RDS instance has backup retention", () => {
    expect(mainContent).toMatch(/backup_retention_period\s*=\s*var\.db_backup_retention_period/);
  });

  test("RDS instance uses KMS encryption", () => {
    expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
  });
});

describe("Payment Processing Infrastructure - KMS Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates KMS key", () => {
    expect(hasResource(mainContent, "aws_kms_key", "main")).toBe(true);
  });

  test("KMS key has key rotation enabled", () => {
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates KMS alias", () => {
    expect(hasResource(mainContent, "aws_kms_alias", "main")).toBe(true);
    expect(mainContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
  });
});

describe("Payment Processing Infrastructure - CloudTrail Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates S3 bucket for CloudTrail", () => {
    expect(hasResource(mainContent, "aws_s3_bucket", "cloudtrail")).toBe(true);
  });

  test("CloudTrail bucket has versioning enabled", () => {
    expect(hasResource(mainContent, "aws_s3_bucket_versioning", "cloudtrail")).toBe(true);
    expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("CloudTrail bucket has encryption", () => {
    expect(hasResource(mainContent, "aws_s3_bucket_server_side_encryption_configuration", "cloudtrail")).toBe(true);
  });

  test("CloudTrail bucket has public access blocked", () => {
    expect(hasResource(mainContent, "aws_s3_bucket_public_access_block", "cloudtrail")).toBe(true);
  });

  test("creates CloudTrail", () => {
    expect(hasResource(mainContent, "aws_cloudtrail", "main")).toBe(true);
  });

  test("CloudTrail uses S3 bucket", () => {
    expect(mainContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
  });

  test("CloudTrail has is_multi_region_trail enabled", () => {
    expect(mainContent).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("CloudTrail has include_global_service_events enabled", () => {
    expect(mainContent).toMatch(/include_global_service_events\s*=\s*true/);
  });
});

describe("Payment Processing Infrastructure - CloudWatch Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates CloudWatch log group", () => {
    expect(hasResource(mainContent, "aws_cloudwatch_log_group", "application")).toBe(true);
  });

  test("CloudWatch log group has retention period", () => {
    expect(mainContent).toMatch(/retention_in_days\s*=\s*\d+/);
  });

  test("creates CloudWatch metric alarms", () => {
    const alarmCount = countResourceOccurrences(mainContent, "aws_cloudwatch_metric_alarm");
    expect(alarmCount).toBeGreaterThanOrEqual(1);
  });

  test("creates ALB target response time alarm", () => {
    expect(hasResource(mainContent, "aws_cloudwatch_metric_alarm", "alb_target_response_time")).toBe(true);
  });

  test("creates RDS CPU alarm", () => {
    expect(hasResource(mainContent, "aws_cloudwatch_metric_alarm", "rds_cpu")).toBe(true);
  });

  test("creates RDS storage alarm", () => {
    expect(hasResource(mainContent, "aws_cloudwatch_metric_alarm", "rds_storage")).toBe(true);
  });
});

describe("Payment Processing Infrastructure - IAM Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates EC2 IAM role", () => {
    expect(hasResource(mainContent, "aws_iam_role", "ec2")).toBe(true);
  });

  test("EC2 role has assume role policy", () => {
    expect(mainContent).toMatch(/assume_role_policy\s*=/);
    expect(mainContent).toMatch(/ec2\.amazonaws\.com/);
  });

  test("EC2 role has CloudWatch policy", () => {
    expect(hasResource(mainContent, "aws_iam_role_policy", "ec2_cloudwatch")).toBe(true);
    expect(mainContent).toMatch(/logs:CreateLogGroup/);
    expect(mainContent).toMatch(/logs:PutLogEvents/);
  });

  test("EC2 role has SSM attachment", () => {
    expect(hasResource(mainContent, "aws_iam_role_policy_attachment", "ec2_ssm")).toBe(true);
    expect(mainContent).toMatch(/AmazonSSMManagedInstanceCore/);
  });

  test("creates EC2 instance profile", () => {
    expect(hasResource(mainContent, "aws_iam_instance_profile", "ec2")).toBe(true);
    expect(mainContent).toMatch(/role\s*=\s*aws_iam_role\.ec2\.name/);
  });

  test("creates RDS monitoring IAM role", () => {
    expect(hasResource(mainContent, "aws_iam_role", "rds_monitoring")).toBe(true);
  });

  test("RDS monitoring role has policy attachment", () => {
    expect(hasResource(mainContent, "aws_iam_role_policy_attachment", "rds_monitoring")).toBe(true);
    expect(mainContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
  });
});

describe("Payment Processing Infrastructure - SNS Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates SNS topic for alarms", () => {
    expect(hasResource(mainContent, "aws_sns_topic", "alarms")).toBe(true);
  });

  test("creates SNS topic subscription", () => {
    expect(hasResource(mainContent, "aws_sns_topic_subscription", "alarms_email")).toBe(true);
    expect(mainContent).toMatch(/protocol\s*=\s*"email"/);
  });
});

describe("Payment Processing Infrastructure - Data Sources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("queries current AWS caller identity", () => {
    expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("queries Amazon Linux 2 AMI", () => {
    expect(mainContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"\s*{/);
    expect(mainContent).toMatch(/most_recent\s*=\s*true/);
    expect(mainContent).toMatch(/owners\s*=\s*\["amazon"\]/);
  });
});

describe("Payment Processing Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readFileContent(outputsPath);
  });

  test("exports VPC ID", () => {
    expect(hasOutput(outputsContent, "vpc_id")).toBe(true);
  });

  test("exports VPC CIDR", () => {
    expect(hasOutput(outputsContent, "vpc_cidr")).toBe(true);
  });

  test("exports public subnet IDs", () => {
    expect(hasOutput(outputsContent, "public_subnet_ids")).toBe(true);
  });

  test("exports private app subnet IDs", () => {
    expect(hasOutput(outputsContent, "private_app_subnet_ids")).toBe(true);
  });

  test("exports private db subnet IDs", () => {
    expect(hasOutput(outputsContent, "private_db_subnet_ids")).toBe(true);
  });

  test("exports ALB DNS name", () => {
    expect(hasOutput(outputsContent, "alb_dns_name")).toBe(true);
  });

  test("exports ALB ARN", () => {
    expect(hasOutput(outputsContent, "alb_arn")).toBe(true);
  });

  test("exports RDS endpoint", () => {
    expect(hasOutput(outputsContent, "rds_endpoint")).toBe(true);
  });

  test("exports RDS address", () => {
    expect(hasOutput(outputsContent, "rds_address")).toBe(true);
  });

  test("exports DB secret ARN", () => {
    expect(hasOutput(outputsContent, "db_secret_arn")).toBe(true);
  });

  test("exports KMS key ID", () => {
    expect(hasOutput(outputsContent, "kms_key_id")).toBe(true);
  });

  test("exports CloudTrail name", () => {
    expect(hasOutput(outputsContent, "cloudtrail_name")).toBe(true);
  });

  test("exports SNS topic ARN", () => {
    expect(hasOutput(outputsContent, "sns_topic_arn")).toBe(true);
  });
});

describe("Payment Processing Infrastructure - Best Practices", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("uses versioning for S3 buckets", () => {
    const versioningResources = countResourceOccurrences(mainContent, "aws_s3_bucket_versioning");
    expect(versioningResources).toBeGreaterThanOrEqual(1);
  });

  test("enables encryption for S3 buckets", () => {
    const encryptionResources = countResourceOccurrences(mainContent, "aws_s3_bucket_server_side_encryption_configuration");
    expect(encryptionResources).toBeGreaterThanOrEqual(1);
  });

  test("blocks public access on S3 buckets", () => {
    const publicAccessBlock = countResourceOccurrences(mainContent, "aws_s3_bucket_public_access_block");
    expect(publicAccessBlock).toBeGreaterThanOrEqual(1);
  });

  test("uses least privilege IAM policies", () => {
    expect(mainContent).toMatch(/Effect\s*=\s*"Allow"/);
  });

  test("configures log retention periods", () => {
    const retentionConfigs = (mainContent.match(/retention_in_days\s*=\s*\d+/g) || []).length;
    expect(retentionConfigs).toBeGreaterThanOrEqual(1);
  });

  test("enables RDS encryption", () => {
    expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("enables KMS key rotation", () => {
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("uses Secrets Manager for sensitive data", () => {
    expect(hasResource(mainContent, "aws_secretsmanager_secret", "db_password")).toBe(true);
  });

  test("implements multi-AZ NAT Gateway option", () => {
    expect(mainContent).toMatch(/var\.enable_multi_az_nat/);
  });

  test("uses private subnets for application instances", () => {
    expect(mainContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private_app\[\*\]\.id/);
  });

  test("uses private subnets for RDS", () => {
    expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
  });
});

describe("Payment Processing Infrastructure - Security Best Practices", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("application instances run in private subnets", () => {
    expect(mainContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private_app\[\*\]\.id/);
  });

  test("RDS runs in private database subnets", () => {
    expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
  });

  test("application security group allows ingress from ALB only", () => {
    const appSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"app"\s*{[\s\S]*?(?=resource|$)/);
    expect(appSgBlock).toBeTruthy();
    expect(appSgBlock![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("RDS security group allows ingress from application only", () => {
    const rdsSgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?(?=resource|$)/);
    expect(rdsSgBlock).toBeTruthy();
    expect(rdsSgBlock![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
  });

  test("RDS uses encryption", () => {
    expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("S3 bucket for CloudTrail has encryption", () => {
    expect(hasResource(mainContent, "aws_s3_bucket_server_side_encryption_configuration", "cloudtrail")).toBe(true);
  });

  test("database password stored in Secrets Manager", () => {
    expect(hasResource(mainContent, "aws_secretsmanager_secret", "db_password")).toBe(true);
  });
});

describe("Payment Processing Infrastructure - Coverage Summary", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFileContent(mainPath);
  });

  test("creates all required VPC resources", () => {
    expect(hasResource(mainContent, "aws_vpc", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_internet_gateway", "main")).toBe(true);
    const subnetCount = countResourceOccurrences(mainContent, "aws_subnet");
    expect(subnetCount).toBeGreaterThanOrEqual(3); // public, private_app, private_db
  });

  test("creates all required networking resources", () => {
    expect(hasResource(mainContent, "aws_nat_gateway", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_route_table", "public")).toBe(true);
    expect(hasResource(mainContent, "aws_route_table", "private")).toBe(true);
  });

  test("creates all required security groups", () => {
    const sgCount = countResourceOccurrences(mainContent, "aws_security_group");
    expect(sgCount).toBeGreaterThanOrEqual(3); // alb, app, rds
  });

  test("creates all required IAM roles", () => {
    const iamRoleCount = countResourceOccurrences(mainContent, "aws_iam_role");
    expect(iamRoleCount).toBeGreaterThanOrEqual(2); // ec2, rds_monitoring
  });

  test("implements complete infrastructure", () => {
    expect(hasResource(mainContent, "aws_vpc", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_lb", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_autoscaling_group", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_db_instance", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_cloudtrail", "main")).toBe(true);
  });

  test("implements monitoring and alerting", () => {
    const alarmCount = countResourceOccurrences(mainContent, "aws_cloudwatch_metric_alarm");
    expect(alarmCount).toBeGreaterThanOrEqual(1);
    expect(hasResource(mainContent, "aws_sns_topic", "alarms")).toBe(true);
  });

  test("implements security and compliance", () => {
    expect(hasResource(mainContent, "aws_kms_key", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_cloudtrail", "main")).toBe(true);
    expect(hasResource(mainContent, "aws_secretsmanager_secret", "db_password")).toBe(true);
  });
});

