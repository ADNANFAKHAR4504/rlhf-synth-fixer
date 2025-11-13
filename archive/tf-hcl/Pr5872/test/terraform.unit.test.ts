// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration in ../lib/tap_stack.tf
// Tests validate resource configuration, security settings, and compliance requirements

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);

let stackContent: string;
let providerContent: string;

describe("Terraform Configuration - File Structure", () => {
  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("tap_stack.tf file exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("provider.tf file exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("tap_stack.tf is not empty", () => {
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("provider block is NOT in tap_stack.tf (should be in provider.tf)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("provider block exists in provider.tf", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("aws_region variable has correct default value (us-west-1)", () => {
    const varMatch = stackContent.match(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
    expect(varMatch).toBeTruthy();
    expect(varMatch![1]).toBe("us-west-1");
  });
});

describe("Terraform Configuration - VPC and Networking", () => {
  test("VPC resource is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("VPC has correct CIDR block (10.0.0.0/16)", () => {
    expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("VPC has DNS hostnames enabled", () => {
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("VPC has DNS support enabled", () => {
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("Internet Gateway is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("Public Subnet 1 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"\s*{/);
  });

  test("Public Subnet 2 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"\s*{/);
  });

  test("Private Subnet 1 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"\s*{/);
  });

  test("Private Subnet 2 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"\s*{/);
  });

  test("NAT Gateway 1 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"\s*{/);
  });

  test("NAT Gateway 2 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"\s*{/);
  });

  test("Elastic IP for NAT Gateway 1 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"\s*{/);
  });

  test("Elastic IP for NAT Gateway 2 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"\s*{/);
  });

  test("Public route table is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
  });

  test("Private route table 1 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1"\s*{/);
  });

  test("Private route table 2 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_2"\s*{/);
  });

  test("Route table associations for all subnets are defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"\s*{/);
  });
});

describe("Terraform Configuration - Security Groups", () => {
  test("EC2 security group is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
  });

  test("RDS security group is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
  });

  test("ALB security group is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
  });

  test("Security groups have proper descriptions", () => {
    const sgMatches = stackContent.match(/resource\s+"aws_security_group"[^}]+description\s*=\s*"[^"]+"/g);
    expect(sgMatches).toBeTruthy();
    expect(sgMatches!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Terraform Configuration - IAM Roles and Policies", () => {
  test("EC2 IAM role is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
  });

  test("EC2 IAM role policy is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{/);
  });

  test("EC2 instance profile is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
  });

  test("IAM account password policy is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{/);
  });

  test("Backup IAM role is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"backup_role"\s*{/);
  });

  test("Backup IAM role policy attachment is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"backup_policy"\s*{/);
  });

  test("IAM password policy requires minimum 14 characters", () => {
    expect(stackContent).toMatch(/minimum_password_length\s*=\s*14/);
  });
});

describe("Terraform Configuration - S3 Buckets", () => {
  test("Secure S3 bucket is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secure_bucket"\s*{/);
  });

  test("Backup S3 bucket is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"backup_bucket"\s*{/);
  });

  test("S3 bucket versioning is enabled for secure bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secure_bucket"\s*{/);
  });

  test("S3 bucket versioning is enabled for backup bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"backup_bucket"\s*{/);
  });

  test("S3 bucket encryption is configured with KMS for secure bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secure_bucket"\s*{/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("S3 bucket encryption is configured with KMS for backup bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"backup_bucket"\s*{/);
  });

  test("S3 bucket public access block is configured for secure bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secure_bucket"\s*{/);
  });

  test("S3 bucket public access block is configured for backup bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"backup_bucket"\s*{/);
  });

  test("All public access is blocked on S3 buckets", () => {
    const blockMatches = stackContent.match(/block_public_acls\s*=\s*true/g);
    expect(blockMatches).toBeTruthy();
    expect(blockMatches!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Terraform Configuration - EC2 Instance", () => {
  test("EC2 instance is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"main"\s*{/);
  });

  test("EC2 instance uses specified AMI (ami-12345678)", () => {
    expect(stackContent).toMatch(/ami\s*=\s*"ami-12345678"/);
  });

  test("EC2 instance is in private subnet", () => {
    expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_1\.id/);
  });

  test("EC2 instance has IAM instance profile attached", () => {
    expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
  });

  test("EC2 instance has detailed monitoring enabled", () => {
    expect(stackContent).toMatch(/monitoring\s*=\s*true/);
  });

  test("EC2 root volume is encrypted", () => {
    const ec2Section = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Section).toBeTruthy();
    expect(ec2Section![0]).toMatch(/encrypted\s*=\s*true/);
  });

  test("EC2 instance does NOT have deletion protection", () => {
    const ec2Section = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Section).toBeTruthy();
    expect(ec2Section![0]).not.toMatch(/deletion_protection\s*=\s*true/);
  });
});

describe("Terraform Configuration - RDS Instance", () => {
  test("RDS instance is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
  });

  test("DB subnet group is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
  });

  test("RDS instance has storage encryption enabled", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsSection).toBeTruthy();
    expect(rdsSection![0]).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS instance does NOT have deletion protection enabled", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsSection).toBeTruthy();
    expect(rdsSection![0]).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("RDS instance skips final snapshot", () => {
    expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  test("RDS instance has automated backups configured", () => {
    expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
  });

  test("RDS instance has CloudWatch logs exports enabled", () => {
    expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
  });
});

describe("Terraform Configuration - Application Load Balancer", () => {
  test("ALB is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
  });

  test("ALB target group is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
  });

  test("ALB listener is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"\s*{/);
  });

  test("ALB target group attachment is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group_attachment"\s+"main"\s*{/);
  });

  test("ALB is internet-facing", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^}/m);
    expect(albSection).toBeTruthy();
    expect(albSection![0]).toMatch(/internal\s*=\s*false/);
  });

  test("ALB deletion protection is disabled", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^}/m);
    expect(albSection).toBeTruthy();
    expect(albSection![0]).toMatch(/enable_deletion_protection\s*=\s*false/);
  });

  test("ALB is in public subnets", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^}/m);
    expect(albSection).toBeTruthy();
    expect(albSection![0]).toMatch(/aws_subnet\.public_1\.id/);
    expect(albSection![0]).toMatch(/aws_subnet\.public_2\.id/);
  });
});

describe("Terraform Configuration - AWS WAF", () => {
  test("WAF Web ACL is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
  });

  test("WAF Web ACL is regional scope", () => {
    expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
  });

  test("WAF Web ACL association with ALB is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"\s*{/);
  });

  test("WAF has AWS Managed Rules for SQL injection", () => {
    expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
  });

  test("WAF has AWS Managed Rules for common rule set", () => {
    expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
  });

  test("WAF has AWS Managed Rules for known bad inputs", () => {
    expect(stackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
  });

  test("WAF has rate limiting configured", () => {
    expect(stackContent).toMatch(/rate_based_statement/);
  });
});

describe("Terraform Configuration - CloudWatch Monitoring", () => {
  test("SNS topic for alarms is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"\s*{/);
  });

  test("SNS topic subscription is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"\s*{/);
  });

  test("CloudWatch alarm for EC2 CPU is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{/);
  });

  test("EC2 CPU alarm threshold is 70%", () => {
    const alarmSection = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?^}/m);
    expect(alarmSection).toBeTruthy();
    expect(alarmSection![0]).toMatch(/threshold\s*=\s*"?70"?/);
  });

  test("CloudWatch alarm for RDS CPU is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"\s*{/);
  });

  test("CloudWatch alarms send notifications to SNS", () => {
    expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alarms\.arn\]/);
  });
});

describe("Terraform Configuration - AWS Backup", () => {
  test("Backup vault is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_backup_vault"\s+"main"\s*{/);
  });

  test("Backup plan is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_backup_plan"\s+"main"\s*{/);
  });

  test("Backup selection for EC2 is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_backup_selection"\s+"ec2"\s*{/);
  });

  test("Backup selection for RDS is defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_backup_selection"\s+"rds"\s*{/);
  });

  test("Backup plan has schedule configured", () => {
    expect(stackContent).toMatch(/schedule\s*=\s*"cron\([^)]+\)"/);
  });

  test("Backup plan has lifecycle policy", () => {
    expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*?delete_after/);
  });
});

describe("Terraform Configuration - Tags", () => {
  test("Resources have Environment tag set to Production", () => {
    const envTags = stackContent.match(/Environment\s*=\s*"Production"/g);
    expect(envTags).toBeTruthy();
    expect(envTags!.length).toBeGreaterThanOrEqual(10);
  });

  test("Resources have Team tag set to DevOps", () => {
    const teamTags = stackContent.match(/Team\s*=\s*"DevOps"/g);
    expect(teamTags).toBeTruthy();
    expect(teamTags!.length).toBeGreaterThanOrEqual(10);
  });

  test("Provider has default tags configured", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/Environment\s*=\s*"Production"/);
    expect(providerContent).toMatch(/Team\s*=\s*"DevOps"/);
  });
});

describe("Terraform Configuration - Outputs", () => {
  test("VPC ID output is defined", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test("ALB DNS name output is defined", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
  });

  test("EC2 instance ID output is defined", () => {
    expect(stackContent).toMatch(/output\s+"ec2_instance_id"\s*{/);
  });

  test("RDS endpoint output is defined", () => {
    expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
  });

  test("S3 bucket name output is defined", () => {
    expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
  });

  test("Backup vault name output is defined", () => {
    expect(stackContent).toMatch(/output\s+"backup_vault_name"\s*{/);
  });

  test("RDS endpoint output is marked as sensitive", () => {
    const rdsOutputSection = stackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?^}/m);
    expect(rdsOutputSection).toBeTruthy();
    expect(rdsOutputSection![0]).toMatch(/sensitive\s*=\s*true/);
  });
});

describe("Terraform Configuration - Security and Compliance", () => {
  test("No resources have deletion_protection = true", () => {
    expect(stackContent).not.toMatch(/deletion_protection\s*=\s*true/);
  });

  test("All S3 buckets use SSE-KMS encryption", () => {
    const sseMatches = stackContent.match(/sse_algorithm\s*=\s*"aws:kms"/g);
    expect(sseMatches).toBeTruthy();
    expect(sseMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test("All S3 buckets block public access", () => {
    const blockPublicAcls = stackContent.match(/block_public_acls\s*=\s*true/g);
    const blockPublicPolicy = stackContent.match(/block_public_policy\s*=\s*true/g);
    const ignorePublicAcls = stackContent.match(/ignore_public_acls\s*=\s*true/g);
    const restrictPublicBuckets = stackContent.match(/restrict_public_buckets\s*=\s*true/g);
    
    expect(blockPublicAcls).toBeTruthy();
    expect(blockPublicPolicy).toBeTruthy();
    expect(ignorePublicAcls).toBeTruthy();
    expect(restrictPublicBuckets).toBeTruthy();
    expect(blockPublicAcls!.length).toBeGreaterThanOrEqual(2);
  });

  test("EC2 instance is in private subnet (not public)", () => {
    const ec2Section = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Section).toBeTruthy();
    expect(ec2Section![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.private_\d+\.id/);
    expect(ec2Section![0]).not.toMatch(/subnet_id\s*=\s*aws_subnet\.public_\d+\.id/);
  });

  test("RDS instance is in private subnets", () => {
    const dbSubnetSection = stackContent.match(/resource\s+"aws_db_subnet_group"\s+"main"\s*{[\s\S]*?^}/m);
    expect(dbSubnetSection).toBeTruthy();
    expect(dbSubnetSection![0]).toMatch(/aws_subnet\.private_1\.id/);
    expect(dbSubnetSection![0]).toMatch(/aws_subnet\.private_2\.id/);
  });

  test("Security groups reference each other (not using CIDR blocks)", () => {
    expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
  });

  test("IAM roles follow least privilege principle (no * actions on * resources)", () => {
    const iamPolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?^}/m);
    if (iamPolicySection) {
      // Check that policies don't grant full access
      expect(iamPolicySection[0]).not.toMatch(/"Action"\s*:\s*"\*"/);
    }
  });
});

describe("Terraform Configuration - High Availability", () => {
  test("Resources are deployed across two availability zones", () => {
    expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
  });

  test("Two NAT gateways for high availability", () => {
    const natGateways = stackContent.match(/resource\s+"aws_nat_gateway"/g);
    expect(natGateways).toBeTruthy();
    expect(natGateways!.length).toBe(2);
  });

  test("Two public subnets for ALB", () => {
    const publicSubnets = stackContent.match(/resource\s+"aws_subnet"\s+"public_/g);
    expect(publicSubnets).toBeTruthy();
    expect(publicSubnets!.length).toBe(2);
  });

  test("Two private subnets for EC2 and RDS", () => {
    const privateSubnets = stackContent.match(/resource\s+"aws_subnet"\s+"private_/g);
    expect(privateSubnets).toBeTruthy();
    expect(privateSubnets!.length).toBe(2);
  });
});

describe("Terraform Configuration - Subnet CIDR Blocks", () => {
  test("Public subnet 1 has correct CIDR (10.0.1.0/24)", () => {
    const pubSub1 = stackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?^}/m);
    expect(pubSub1).toBeTruthy();
    expect(pubSub1![0]).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
  });

  test("Public subnet 2 has correct CIDR (10.0.2.0/24)", () => {
    const pubSub2 = stackContent.match(/resource\s+"aws_subnet"\s+"public_2"\s*{[\s\S]*?^}/m);
    expect(pubSub2).toBeTruthy();
    expect(pubSub2![0]).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
  });

  test("Private subnet 1 has correct CIDR (10.0.10.0/24)", () => {
    const privSub1 = stackContent.match(/resource\s+"aws_subnet"\s+"private_1"\s*{[\s\S]*?^}/m);
    expect(privSub1).toBeTruthy();
    expect(privSub1![0]).toMatch(/cidr_block\s*=\s*"10\.0\.10\.0\/24"/);
  });

  test("Private subnet 2 has correct CIDR (10.0.11.0/24)", () => {
    const privSub2 = stackContent.match(/resource\s+"aws_subnet"\s+"private_2"\s*{[\s\S]*?^}/m);
    expect(privSub2).toBeTruthy();
    expect(privSub2![0]).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
  });

  test("Public subnets have map_public_ip_on_launch enabled", () => {
    const pubSub1 = stackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?^}/m);
    const pubSub2 = stackContent.match(/resource\s+"aws_subnet"\s+"public_2"\s*{[\s\S]*?^}/m);
    expect(pubSub1![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    expect(pubSub2![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("Private subnets do NOT have map_public_ip_on_launch", () => {
    const privSub1 = stackContent.match(/resource\s+"aws_subnet"\s+"private_1"\s*{[\s\S]*?^}/m);
    const privSub2 = stackContent.match(/resource\s+"aws_subnet"\s+"private_2"\s*{[\s\S]*?^}/m);
    expect(privSub1![0]).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
    expect(privSub2![0]).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });
});

describe("Terraform Configuration - Route Table Details", () => {
  test("Public route table routes to Internet Gateway", () => {
    const pubRT = stackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
    expect(pubRT).toBeTruthy();
    expect(pubRT![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("Public route table has route to 0.0.0.0/0", () => {
    const pubRT = stackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
    expect(pubRT).toBeTruthy();
    expect(pubRT![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
  });

  test("Private route table 1 routes to NAT Gateway 1", () => {
    const privRT1 = stackContent.match(/resource\s+"aws_route_table"\s+"private_1"\s*{[\s\S]*?^}/m);
    expect(privRT1).toBeTruthy();
    expect(privRT1![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1\.id/);
  });

  test("Private route table 2 routes to NAT Gateway 2", () => {
    const privRT2 = stackContent.match(/resource\s+"aws_route_table"\s+"private_2"\s*{[\s\S]*?^}/m);
    expect(privRT2).toBeTruthy();
    expect(privRT2![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_2\.id/);
  });

  test("Private route tables have route to 0.0.0.0/0 via NAT", () => {
    const privRT1 = stackContent.match(/resource\s+"aws_route_table"\s+"private_1"\s*{[\s\S]*?^}/m);
    const privRT2 = stackContent.match(/resource\s+"aws_route_table"\s+"private_2"\s*{[\s\S]*?^}/m);
    expect(privRT1![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(privRT2![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
  });
});

describe("Terraform Configuration - Security Group Rules Details", () => {
  test("EC2 security group allows HTTP from ALB", () => {
    const ec2SG = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?^}/m);
    expect(ec2SG).toBeTruthy();
    expect(ec2SG![0]).toMatch(/from_port\s*=\s*80/);
    expect(ec2SG![0]).toMatch(/to_port\s*=\s*80/);
  });

  test("EC2 security group has egress rule", () => {
    const ec2SG = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?^}/m);
    expect(ec2SG).toBeTruthy();
    expect(ec2SG![0]).toMatch(/egress\s*{/);
  });

  test("RDS security group allows MySQL port 3306", () => {
    const rdsSG = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?^}/m);
    expect(rdsSG).toBeTruthy();
    expect(rdsSG![0]).toMatch(/from_port\s*=\s*3306/);
    expect(rdsSG![0]).toMatch(/to_port\s*=\s*3306/);
  });

  test("RDS security group ingress from EC2 security group", () => {
    const rdsSG = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?^}/m);
    expect(rdsSG).toBeTruthy();
    expect(rdsSG![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
  });

  test("ALB security group allows HTTP (port 80)", () => {
    const albSG = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^}/m);
    expect(albSG).toBeTruthy();
    expect(albSG![0]).toMatch(/from_port\s*=\s*80/);
  });

  test("ALB security group allows HTTPS (port 443)", () => {
    const albSG = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^}/m);
    expect(albSG).toBeTruthy();
    expect(albSG![0]).toMatch(/from_port\s*=\s*443/);
  });

  test("ALB security group allows traffic from internet", () => {
    const albSG = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^}/m);
    expect(albSG).toBeTruthy();
    expect(albSG![0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
  });
});

describe("Terraform Configuration - IAM Policy Details", () => {
  test("EC2 role allows CloudWatch PutMetricData", () => {
    const ec2Policy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{[\s\S]*?^}/m);
    expect(ec2Policy).toBeTruthy();
    expect(ec2Policy![0]).toMatch(/cloudwatch:PutMetricData/);
  });

  test("EC2 role allows CloudWatch Logs actions", () => {
    const ec2Policy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{[\s\S]*?^}/m);
    expect(ec2Policy).toBeTruthy();
    expect(ec2Policy![0]).toMatch(/logs:CreateLogGroup/);
    expect(ec2Policy![0]).toMatch(/logs:CreateLogStream/);
    expect(ec2Policy![0]).toMatch(/logs:PutLogEvents/);
  });

  test("IAM password policy requires uppercase characters", () => {
    expect(stackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
  });

  test("IAM password policy requires lowercase characters", () => {
    expect(stackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
  });

  test("IAM password policy requires numbers", () => {
    expect(stackContent).toMatch(/require_numbers\s*=\s*true/);
  });

  test("IAM password policy requires symbols", () => {
    expect(stackContent).toMatch(/require_symbols\s*=\s*true/);
  });

  test("IAM password policy allows users to change password", () => {
    expect(stackContent).toMatch(/allow_users_to_change_password\s*=\s*true/);
  });

  test("IAM password policy has password reuse prevention", () => {
    expect(stackContent).toMatch(/password_reuse_prevention\s*=\s*24/);
  });

  test("IAM password policy has max password age", () => {
    expect(stackContent).toMatch(/max_password_age\s*=\s*90/);
  });
});

describe("Terraform Configuration - S3 Bucket Details", () => {
  test("S3 buckets use bucket_prefix for unique naming", () => {
    const secureBucket = stackContent.match(/resource\s+"aws_s3_bucket"\s+"secure_bucket"\s*{[\s\S]*?^}/m);
    const backupBucket = stackContent.match(/resource\s+"aws_s3_bucket"\s+"backup_bucket"\s*{[\s\S]*?^}/m);
    expect(secureBucket![0]).toMatch(/bucket_prefix\s*=\s*"secure-bucket-"/);
    expect(backupBucket![0]).toMatch(/bucket_prefix\s*=\s*"backup-bucket-"/);
  });

  test("S3 versioning status is Enabled", () => {
    expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("S3 encryption uses bucket_key_enabled", () => {
    expect(stackContent).toMatch(/bucket_key_enabled\s*=\s*true/);
  });

  test("S3 encryption uses KMS master key alias", () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/s3"/);
  });
});

describe("Terraform Configuration - EC2 Instance Details", () => {
  test("EC2 instance uses t3.micro instance type", () => {
    const ec2Instance = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Instance).toBeTruthy();
    expect(ec2Instance![0]).toMatch(/instance_type\s*=\s*"t3\.micro"/);
  });

  test("EC2 instance root volume uses gp3", () => {
    const ec2Instance = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Instance).toBeTruthy();
    expect(ec2Instance![0]).toMatch(/volume_type\s*=\s*"gp3"/);
  });

  test("EC2 instance root volume is 20 GB", () => {
    const ec2Instance = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Instance).toBeTruthy();
    expect(ec2Instance![0]).toMatch(/volume_size\s*=\s*20/);
  });

  test("EC2 instance has user_data script", () => {
    const ec2Instance = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Instance).toBeTruthy();
    expect(ec2Instance![0]).toMatch(/user_data\s*=/);
  });

  test("EC2 user_data installs CloudWatch agent", () => {
    const ec2Instance = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(ec2Instance).toBeTruthy();
    expect(ec2Instance![0]).toMatch(/cloudwatch-agent/);
  });
});

describe("Terraform Configuration - RDS Instance Details", () => {
  test("RDS instance uses MySQL engine", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/engine\s*=\s*"mysql"/);
  });

  test("RDS instance uses MySQL 8.0", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/engine_version\s*=\s*"8\.0"/);
  });

  test("RDS instance uses db.t3.micro", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
  });

  test("RDS instance has 20 GB allocated storage", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/allocated_storage\s*=\s*20/);
  });

  test("RDS instance uses gp3 storage", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/storage_type\s*=\s*"gp3"/);
  });

  test("RDS instance has backup retention period", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/backup_retention_period\s*=\s*7/);
  });

  test("RDS instance has backup window configured", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/backup_window/);
  });

  test("RDS instance has maintenance window configured", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/maintenance_window/);
  });

  test("RDS CloudWatch logs include error logs", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/"error"/);
  });

  test("RDS CloudWatch logs include slow query logs", () => {
    const rdsInstance = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
    expect(rdsInstance).toBeTruthy();
    expect(rdsInstance![0]).toMatch(/"slowquery"/);
  });
});

describe("Terraform Configuration - ALB Details", () => {
  test("ALB has HTTP/2 enabled", () => {
    const alb = stackContent.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^}/m);
    expect(alb).toBeTruthy();
    expect(alb![0]).toMatch(/enable_http2\s*=\s*true/);
  });

  test("ALB target group uses HTTP protocol", () => {
    const tg = stackContent.match(/resource\s+"aws_lb_target_group"\s+"main"\s*{[\s\S]*?^}/m);
    expect(tg).toBeTruthy();
    expect(tg![0]).toMatch(/protocol\s*=\s*"HTTP"/);
  });

  test("ALB target group listens on port 80", () => {
    const tg = stackContent.match(/resource\s+"aws_lb_target_group"\s+"main"\s*{[\s\S]*?^}/m);
    expect(tg).toBeTruthy();
    expect(tg![0]).toMatch(/port\s*=\s*80/);
  });

  test("ALB target group has health check enabled", () => {
    const tg = stackContent.match(/resource\s+"aws_lb_target_group"\s+"main"\s*{[\s\S]*?^}/m);
    expect(tg).toBeTruthy();
    expect(tg![0]).toMatch(/enabled\s*=\s*true/);
  });

  test("ALB listener forwards to target group", () => {
    const listener = stackContent.match(/resource\s+"aws_lb_listener"\s+"main"\s*{[\s\S]*?^}/m);
    expect(listener).toBeTruthy();
    expect(listener![0]).toMatch(/type\s*=\s*"forward"/);
  });
});

describe("Terraform Configuration - CloudWatch Alarm Details", () => {
  test("EC2 CPU alarm uses Average statistic", () => {
    const alarm = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?^}/m);
    expect(alarm).toBeTruthy();
    expect(alarm![0]).toMatch(/statistic\s*=\s*"Average"/);
  });

  test("EC2 CPU alarm has 2 evaluation periods", () => {
    const alarm = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?^}/m);
    expect(alarm).toBeTruthy();
    expect(alarm![0]).toMatch(/evaluation_periods\s*=\s*"2"/);
  });

  test("EC2 CPU alarm has 300 second period", () => {
    const alarm = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?^}/m);
    expect(alarm).toBeTruthy();
    expect(alarm![0]).toMatch(/period\s*=\s*"300"/);
  });

  test("EC2 CPU alarm uses GreaterThanThreshold comparison", () => {
    const alarm = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?^}/m);
    expect(alarm).toBeTruthy();
    expect(alarm![0]).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
  });
});

describe("Terraform Configuration - Data Sources", () => {
  test("Availability zones data source is defined", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });

  test("Availability zones data source filters available zones", () => {
    const azData = stackContent.match(/data\s+"aws_availability_zones"\s+"available"\s*{[\s\S]*?^}/m);
    expect(azData).toBeTruthy();
    expect(azData![0]).toMatch(/state\s*=\s*"available"/);
  });
});
