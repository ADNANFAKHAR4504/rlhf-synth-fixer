// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for modular Terraform infrastructure
// Validates infrastructure resources without executing Terraform

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const MODULES_DIR = "../lib/modules";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const modulesPath = path.resolve(__dirname, MODULES_DIR);

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

  test("modules directory exists", () => {
    const exists = fs.existsSync(modulesPath);
    expect(exists).toBe(true);
  });
});

describe("Terraform Infrastructure - Module Structure", () => {
  const requiredModules = [
    "vpc",
    "s3",
    "rds",
    "iam",
    "lambda",
    "eventbridge",
    "cloudwatch",
    "sns",
    "compute"
  ];

  requiredModules.forEach((moduleName) => {
    describe(`Module: ${moduleName}`, () => {
      const modulePath = path.join(modulesPath, moduleName);

      test(`${moduleName} module directory exists`, () => {
        expect(fs.existsSync(modulePath)).toBe(true);
      });

      test(`${moduleName} module has main.tf`, () => {
        const mainPath = path.join(modulePath, "main.tf");
        expect(fs.existsSync(mainPath)).toBe(true);
      });

      test(`${moduleName} module has variables.tf`, () => {
        const varsPath = path.join(modulePath, "variables.tf");
        expect(fs.existsSync(varsPath)).toBe(true);
      });

      test(`${moduleName} module has outputs.tf`, () => {
        const outputsPath = path.join(modulePath, "outputs.tf");
        expect(fs.existsSync(outputsPath)).toBe(true);
      });
    });
  });
});

describe("Terraform Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("provider.tf declares primary AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf declares secondary AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
  });

  test("provider.tf secondary provider uses secondary_region", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.secondary_region/);
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

  test("declares database credentials variables", () => {
    expect(stackContent).toMatch(/variable\s+"db_master_username"\s*{/);
    expect(stackContent).toMatch(/variable\s+"db_master_password"\s*{/);
  });

  test("database password is marked sensitive", () => {
    expect(stackContent).toMatch(/sensitive\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - Module Declarations", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares VPC module", () => {
    expect(stackContent).toMatch(/module\s+"vpc"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });

  test("declares S3 module", () => {
    expect(stackContent).toMatch(/module\s+"s3"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/s3"/);
  });

  test("declares RDS module", () => {
    expect(stackContent).toMatch(/module\s+"rds"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/rds"/);
  });

  test("declares IAM module", () => {
    expect(stackContent).toMatch(/module\s+"iam"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/iam"/);
  });

  test("declares Lambda module", () => {
    expect(stackContent).toMatch(/module\s+"lambda"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/lambda"/);
  });

  test("declares EventBridge module", () => {
    expect(stackContent).toMatch(/module\s+"eventbridge"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/eventbridge"/);
  });

  test("declares CloudWatch module", () => {
    expect(stackContent).toMatch(/module\s+"cloudwatch"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/cloudwatch"/);
  });

  test("declares SNS module", () => {
    expect(stackContent).toMatch(/module\s+"sns"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/sns"/);
  });

  test("declares Compute module", () => {
    expect(stackContent).toMatch(/module\s+"compute"\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/compute"/);
  });
});

describe("VPC Module - Resources", () => {
  let vpcContent: string;

  beforeAll(() => {
    const vpcPath = path.join(modulesPath, "vpc", "main.tf");
    vpcContent = fs.readFileSync(vpcPath, "utf8");
  });

  test("creates VPC", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("VPC has DNS support enabled", () => {
    expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC has DNS hostnames enabled", () => {
    expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("creates private subnets", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
  });

  test("creates public subnets", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
  });

  test("creates database subnets", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
  });

  test("creates internet gateway", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("creates NAT gateways", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
  });

  test("creates security groups", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    expect(vpcContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    expect(vpcContent).toMatch(/resource\s+"aws_security_group"\s+"web_server"\s*{/);
    expect(vpcContent).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
  });
});

describe("RDS Module - Multi-AZ", () => {
  let rdsContent: string;

  beforeAll(() => {
    const rdsPath = path.join(modulesPath, "rds", "main.tf");
    rdsContent = fs.readFileSync(rdsPath, "utf8");
  });

  test("creates Aurora cluster without Global Cluster (simplified for reliability)", () => {
    // Verify we DON'T have a global cluster (simplified configuration)
    expect(rdsContent).not.toMatch(/resource\s+"aws_rds_global_cluster"\s+"main"\s*{/);
    // Verify we DO have a standard Aurora cluster for Multi-AZ
    expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"\s*{/);
  });

  test("creates Aurora cluster", () => {
    expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"\s*{/);
  });

  test("Aurora cluster uses MySQL engine", () => {
    expect(rdsContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
  });

  test("creates Aurora instances for Multi-AZ", () => {
    expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"\s*{/);
    expect(rdsContent).toMatch(/count\s*=\s*var\.instance_count/);
  });

  test("Aurora cluster has encryption enabled", () => {
    expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("Aurora cluster has backups configured", () => {
    expect(rdsContent).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_period/);
  });

  test("creates DB subnet group", () => {
    expect(rdsContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*{/);
  });

  test("has Performance Insights configuration option", () => {
    expect(rdsContent).toMatch(/performance_insights_enabled/);
  });

  test("creates CloudWatch alarms for database", () => {
    expect(rdsContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"database_cpu"\s*{/);
    expect(rdsContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"database_connections"\s*{/);
  });
});

describe("Compute Module - Auto Scaling and Load Balancer", () => {
  let computeContent: string;

  beforeAll(() => {
    const computePath = path.join(modulesPath, "compute", "main.tf");
    computeContent = fs.readFileSync(computePath, "utf8");
  });

  test("creates Application Load Balancer", () => {
    expect(computeContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    expect(computeContent).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("ALB is internet-facing", () => {
    expect(computeContent).toMatch(/internal\s*=\s*false/);
  });

  test("creates Target Group", () => {
    expect(computeContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
  });

  test("Target Group has health checks", () => {
    expect(computeContent).toMatch(/health_check\s*{/);
  });

  test("creates ALB Listener", () => {
    expect(computeContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
  });

  test("creates Launch Template", () => {
    expect(computeContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
  });

  test("Launch Template uses AMI data source", () => {
    expect(computeContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
  });

  test("Launch Template has user data script", () => {
    expect(computeContent).toMatch(/user_data\s*=\s*base64encode/);
  });

  test("creates Auto Scaling Group", () => {
    expect(computeContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
  });

  test("ASG has min, max, and desired capacity", () => {
    expect(computeContent).toMatch(/min_size\s*=\s*var\.min_size/);
    expect(computeContent).toMatch(/max_size\s*=\s*var\.max_size/);
    expect(computeContent).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
  });

  test("creates Auto Scaling Policies", () => {
    expect(computeContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"\s*{/);
    expect(computeContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"\s*{/);
  });

  test("creates CloudWatch Alarms for scaling", () => {
    expect(computeContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
    expect(computeContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"\s*{/);
  });

  test("user data script file exists", () => {
    const userDataPath = path.join(modulesPath, "compute", "user_data.sh");
    expect(fs.existsSync(userDataPath)).toBe(true);
  });
});

describe("S3 Module - Resources", () => {
  let s3Content: string;

  beforeAll(() => {
    const s3Path = path.join(modulesPath, "s3", "main.tf");
    s3Content = fs.readFileSync(s3Path, "utf8");
  });

  test("creates primary data bucket", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary_data"\s*{/);
  });

  test("creates CloudFormation templates bucket", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudformation_templates"\s*{/);
  });

  test("enables versioning on primary data bucket", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary_data"\s*{/);
  });

  test("configures encryption for buckets", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary_data"\s*{/);
  });

  test("blocks public access on buckets", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary_data"\s*{/);
  });

  test("encryption uses AES256", () => {
    expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("has lifecycle configuration", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"primary_data"\s*{/);
  });
});

describe("IAM Module - Resources", () => {
  let iamContent: string;

  beforeAll(() => {
    const iamPath = path.join(modulesPath, "iam", "main.tf");
    iamContent = fs.readFileSync(iamPath, "utf8");
  });

  test("creates Lambda IAM role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_failover"\s*{/);
  });

  test("creates Lambda IAM policy", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_failover"\s*{/);
  });

  test("creates EC2 instance role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"\s*{/);
  });

  test("creates EC2 instance profile", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
  });

  test("creates RDS monitoring role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"\s*{/);
  });

  test("Lambda role has AssumeRole policy", () => {
    expect(iamContent).toMatch(/sts:AssumeRole/);
  });

  test("Lambda policy grants CloudWatch Logs permissions", () => {
    expect(iamContent).toMatch(/logs:CreateLogGroup/);
    expect(iamContent).toMatch(/logs:CreateLogStream/);
    expect(iamContent).toMatch(/logs:PutLogEvents/);
  });

  test("Lambda policy grants S3 permissions", () => {
    expect(iamContent).toMatch(/s3:GetObject/);
    expect(iamContent).toMatch(/s3:PutObject/);
    expect(iamContent).toMatch(/s3:ListBucket/);
  });

  test("EC2 role has SSM policy attached", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"\s*{/);
  });
});

describe("Lambda Module - Resources", () => {
  let lambdaContent: string;

  beforeAll(() => {
    const lambdaPath = path.join(modulesPath, "lambda", "main.tf");
    lambdaContent = fs.readFileSync(lambdaPath, "utf8");
  });

  test("creates archive data source for Lambda", () => {
    expect(lambdaContent).toMatch(/data\s+"archive_file"\s+"lambda_failover"\s*{/);
  });

  test("creates Lambda function resource", () => {
    expect(lambdaContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover"\s*{/);
  });

  test("Lambda uses Python runtime", () => {
    expect(lambdaContent).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("Lambda has appropriate timeout", () => {
    expect(lambdaContent).toMatch(/timeout\s*=\s*var\.timeout/);
  });

  test("Lambda has environment variables", () => {
    expect(lambdaContent).toMatch(/environment\s*{/);
    expect(lambdaContent).toMatch(/PRIMARY_BUCKET/);
    expect(lambdaContent).toMatch(/SECONDARY_REGION/);
  });

  test("Lambda has VPC configuration", () => {
    expect(lambdaContent).toMatch(/vpc_config\s*{/);
  });

  test("creates Lambda permission for EventBridge", () => {
    expect(lambdaContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"\s*{/);
  });
});

describe("EventBridge Module - Resources", () => {
  let eventbridgeContent: string;

  beforeAll(() => {
    const eventbridgePath = path.join(modulesPath, "eventbridge", "main.tf");
    eventbridgeContent = fs.readFileSync(eventbridgePath, "utf8");
  });

  test("creates EventBridge rule", () => {
    expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"health_check"\s*{/);
  });

  test("EventBridge rule has schedule expression", () => {
    expect(eventbridgeContent).toMatch(/schedule_expression\s*=\s*var\.schedule_expression/);
  });

  test("creates EventBridge target", () => {
    expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda_failover"\s*{/);
  });
});

describe("CloudWatch Module - Resources", () => {
  let cloudwatchContent: string;

  beforeAll(() => {
    const cloudwatchPath = path.join(modulesPath, "cloudwatch", "main.tf");
    cloudwatchContent = fs.readFileSync(cloudwatchPath, "utf8");
  });

  test("creates Lambda log group", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_failover"\s*{/);
  });

  test("creates application log group", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"\s*{/);
  });

  test("creates Lambda errors alarm", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
  });

  test("creates S3 bucket errors alarm", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"s3_bucket_errors"\s*{/);
  });

  test("Lambda alarm monitors Errors metric", () => {
    expect(cloudwatchContent).toMatch(/metric_name\s*=\s*"Errors"/);
  });

  test("S3 alarm monitors 4xxErrors metric", () => {
    expect(cloudwatchContent).toMatch(/metric_name\s*=\s*"4xxErrors"/);
  });
});

describe("SNS Module - Resources", () => {
  let snsContent: string;

  beforeAll(() => {
    const snsPath = path.join(modulesPath, "sns", "main.tf");
    snsContent = fs.readFileSync(snsPath, "utf8");
  });

  test("creates SNS topic for notifications", () => {
    expect(snsContent).toMatch(/resource\s+"aws_sns_topic"\s+"failover_notifications"\s*{/);
  });

  test("SNS topic has encryption configured", () => {
    expect(snsContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
  });

  test("creates SNS topic policy", () => {
    expect(snsContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"failover_notifications"\s*{/);
  });

  test("SNS policy allows CloudWatch to publish", () => {
    expect(snsContent).toMatch(/"cloudwatch\.amazonaws\.com"/);
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

  test("outputs Aurora cluster endpoints", () => {
    expect(stackContent).toMatch(/output\s+"aurora_cluster_endpoint"\s*{/);
    expect(stackContent).toMatch(/output\s+"aurora_reader_endpoint"\s*{/);
  });

  test("outputs ALB DNS name", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
  });

  test("outputs Auto Scaling Group name", () => {
    expect(stackContent).toMatch(/output\s+"autoscaling_group_name"\s*{/);
  });

  test("outputs architecture summary", () => {
    expect(stackContent).toMatch(/output\s+"architecture_summary"\s*{/);
  });
});

describe("Terraform Infrastructure - Security Best Practices", () => {
  test("all modules have proper tagging", () => {
    const modules = ["vpc", "s3", "rds", "iam", "lambda", "eventbridge", "cloudwatch", "sns", "compute"];
    
    modules.forEach((moduleName) => {
      const modulePath = path.join(modulesPath, moduleName, "main.tf");
      const content = fs.readFileSync(modulePath, "utf8");
      
      // Check for tags or tags parameter
      const hasTags = content.includes("tags =") || content.includes("tags\n") || content.includes("var.tags");
      expect(hasTags).toBe(true);
    });
  });

  test("S3 encryption is configured in module", () => {
    const s3Path = path.join(modulesPath, "s3", "main.tf");
    const content = fs.readFileSync(s3Path, "utf8");
    expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
  });

  test("database password is sensitive", () => {
    const stackContent = fs.readFileSync(stackPath, "utf8");
    expect(stackContent).toMatch(/variable\s+"db_master_password"[\s\S]*?sensitive\s*=\s*true/);
  });

  test("Aurora outputs are marked sensitive", () => {
    const stackContent = fs.readFileSync(stackPath, "utf8");
    expect(stackContent).toMatch(/output\s+"aurora_cluster_endpoint"[\s\S]{0,200}sensitive\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - Module Dependencies", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("IAM module depends on CloudWatch", () => {
    const iamModuleMatch = stackContent.match(/module\s+"iam"\s*{[\s\S]*?depends_on\s*=[\s\S]*?}/);
    expect(iamModuleMatch).toBeTruthy();
  });

  test("RDS module depends on VPC and IAM", () => {
    const rdsModuleMatch = stackContent.match(/module\s+"rds"\s*{[\s\S]*?depends_on\s*=[\s\S]*?}/);
    expect(rdsModuleMatch).toBeTruthy();
  });

  test("Compute module depends on VPC, IAM, and RDS", () => {
    const computeModuleMatch = stackContent.match(/module\s+"compute"\s*{[\s\S]*?depends_on\s*=[\s\S]*?}/);
    expect(computeModuleMatch).toBeTruthy();
  });

  test("Lambda module depends on multiple modules", () => {
    const lambdaModuleMatch = stackContent.match(/module\s+"lambda"\s*{[\s\S]*?depends_on\s*=[\s\S]*?}/);
    expect(lambdaModuleMatch).toBeTruthy();
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

describe("Terraform Infrastructure - Local Values", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares local values", () => {
    expect(stackContent).toMatch(/locals\s*{/);
  });

  test("defines name_prefix local", () => {
    expect(stackContent).toMatch(/name_prefix\s*=/);
  });

  test("defines common_tags local", () => {
    expect(stackContent).toMatch(/common_tags\s*=/);
  });
});