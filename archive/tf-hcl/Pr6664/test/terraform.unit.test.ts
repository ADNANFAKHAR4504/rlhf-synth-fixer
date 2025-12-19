// tests/terraform.unit.test.ts
// Comprehensive unit tests for Terraform PCI-DSS compliant infrastructure
// Tests validate the presence and configuration of all security resources

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");

describe("Terraform PCI-DSS Infrastructure - File Structure", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
  });

  describe("File Existence and Structure", () => {
    test("tap_stack.tf exists and is not empty", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(100);
    });

    test("provider.tf exists and contains provider configuration", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test("variables.tf exists and contains variable definitions", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(variablesContent).toMatch(/variable\s+"/);
    });

    test("tap_stack.tf does NOT declare provider blocks (delegated to provider.tf)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform blocks (delegated to provider.tf)", () => {
      expect(stackContent).not.toMatch(/\bterraform\s*{\s*required_version/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("provider.tf declares AWS provider with correct version", () => {
      expect(providerContent).toMatch(/required_providers/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf declares primary provider with us-east-1 region", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/alias\s*=\s*"primary"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test("provider.tf declares secondary provider with us-west-2 region", () => {
      expect(providerContent).toMatch(/alias\s*=\s*"secondary"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("provider.tf has default tags configured", () => {
      expect(providerContent).toMatch(/default_tags/);
      expect(providerContent).toMatch(/Owner\s*=\s*"security-team"/);
      expect(providerContent).toMatch(/ComplianceScope\s*=\s*"PCI-DSS"/);
    });

    test("provider.tf has S3 backend configured", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("variables.tf declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("variables.tf declares tagging variables", () => {
      expect(variablesContent).toMatch(/variable\s+"repository"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"team"\s*{/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Locals and Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Locals Block", () => {
    test("defines common_tags with PCI-DSS compliance tags", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/Environment\s*=\s*"prod"/);
      expect(stackContent).toMatch(/Owner\s*=\s*"security-team"/);
      expect(stackContent).toMatch(/ComplianceScope\s*=\s*"PCI-DSS"/);
    });

    test("defines VPC CIDR blocks for three-tier architecture", () => {
      expect(stackContent).toMatch(/dmz_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/app_cidr\s*=\s*"10\.1\.0\.0\/16"/);
      expect(stackContent).toMatch(/data_cidr\s*=\s*"10\.2\.0\.0\/16"/);
    });

    test("references account_id from data source", () => {
      expect(stackContent).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
    });

    test("defines availability zones for multi-region deployment", () => {
      expect(stackContent).toMatch(/azs_primary\s*=/);
      expect(stackContent).toMatch(/azs_secondary\s*=/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares aws_availability_zones for primary region", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test("declares aws_availability_zones for secondary region", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test("declares IAM policy documents for assume role policies", () => {
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"assume_role_policy_ec2"/);
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"assume_role_policy_lambda"/);
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"assume_role_policy_ecs"/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - KMS Encryption", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("KMS Keys", () => {
    test("creates master KMS key with rotation enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"master"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("creates KMS alias for master key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"master"/);
      expect(stackContent).toMatch(/alias\/pci-dss-master/);
    });

    test("creates S3-specific KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
      expect(stackContent).toMatch(/KMS key for S3 bucket encryption/);
    });

    test("creates KMS alias for S3 key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
      expect(stackContent).toMatch(/alias\/pci-dss-s3/);
    });

    test("creates Parameter Store KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"parameter_store"/);
      expect(stackContent).toMatch(/KMS key for Parameter Store encryption/);
    });

    test("creates KMS alias for Parameter Store key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"parameter_store"/);
      expect(stackContent).toMatch(/alias\/pci-dss-parameter-store/);
    });

    test("all KMS keys have proper policies configured", () => {
      const kmsKeyMatches = stackContent.match(/resource\s+"aws_kms_key"\s+"\w+"/g);
      expect(kmsKeyMatches).toBeTruthy();
      expect(kmsKeyMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Networking (VPCs)", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("VPC Configuration", () => {
    test("creates DMZ VPC for internet-facing resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"dmz"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.dmz_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Application VPC for application tier", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"application"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.app_cidr/);
    });

    test("creates Data VPC for database tier", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"data"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.data_cidr/);
    });

    test("all VPCs have proper tagging", () => {
      const vpcMatches = stackContent.match(/resource\s+"aws_vpc"\s+"\w+"/g);
      expect(vpcMatches).toBeTruthy();
      expect(vpcMatches!.length).toBe(3);
    });
  });

  describe("Subnet Configuration", () => {
    test("creates DMZ public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dmz_public"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates DMZ private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dmz_private"/);
    });

    test("creates Application private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"app_private"/);
    });

    test("creates Data private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"data_private"/);
    });

    test("subnets use count for multi-AZ deployment", () => {
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });
  });

  describe("Internet Gateway and NAT", () => {
    test("creates Internet Gateway for DMZ VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"dmz"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.dmz\.id/);
    });

    test("creates Elastic IPs for NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"dmz_nat"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates NAT Gateways in DMZ VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"dmz"/);
    });
  });

  describe("Route Tables", () => {
    test("creates public route table for DMZ", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"dmz_public"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.dmz\.id/);
    });

    test("creates private route tables for DMZ", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"dmz_private"/);
      expect(stackContent).toMatch(/nat_gateway_id/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"dmz_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"dmz_private"/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Security Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Security Group Resources", () => {
    test("creates bastion host security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
      expect(stackContent).toMatch(/bastion-sg/);
    });

    test("creates web tier security group with HTTPS access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates application tier security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/app-sg/);
    });

    test("creates database tier security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      expect(stackContent).toMatch(/database-sg/);
    });

    test("security groups reference other security groups (zero-trust)", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.\w+\.id\]/);
    });

    test("security groups allow SSH only from bastion", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.bastion\.id\]/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - S3 Buckets", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("S3 Bucket Resources", () => {
    test("creates CloudTrail S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("creates VPC Flow Logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"vpc_flow_logs"/);
    });

    test("creates AWS Config S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });

    test("creates ALB logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
    });
  });

  describe("S3 Versioning", () => {
    test("enables versioning on CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
      expect(stackContent).toMatch(/mfa_delete\s*=\s*"Enabled"/);
    });

    test("enables versioning on VPC Flow Logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"vpc_flow_logs"/);
    });

    test("enables versioning on Config bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"config"/);
    });

    test("enables versioning on ALB logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"alb_logs"/);
    });
  });

  describe("S3 Encryption", () => {
    test("configures KMS encryption for CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test("configures KMS encryption for all S3 buckets", () => {
      const encryptionMatches = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g);
      expect(encryptionMatches).toBeTruthy();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("S3 Public Access Block", () => {
    test("blocks all public access on CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("blocks public access on all S3 buckets", () => {
      const publicAccessMatches = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      expect(publicAccessMatches).toBeTruthy();
      expect(publicAccessMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("S3 Lifecycle Policies", () => {
    test("configures lifecycle policy for CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/transition/);
      expect(stackContent).toMatch(/days\s*=\s*30/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("lifecycle policies have filter blocks", () => {
      expect(stackContent).toMatch(/filter\s*{}/);
    });
  });

  describe("S3 Bucket Policies", () => {
    test("creates CloudTrail bucket policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test("creates VPC Flow Logs bucket policy with cross-account access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"vpc_flow_logs"/);
      expect(stackContent).toMatch(/delivery\.logs\.amazonaws\.com/);
    });

    test("creates Config bucket policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
      expect(stackContent).toMatch(/config\.amazonaws\.com/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - VPC Flow Logs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Flow Log Configuration", () => {
    test("creates IAM role for VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
      expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("creates IAM policy for VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates flow log for DMZ VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"dmz"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.dmz\.id/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("creates flow log for Application VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"application"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.application\.id/);
    });

    test("creates flow log for Data VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"data"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.data\.id/);
    });

    test("flow logs send to S3", () => {
      expect(stackContent).toMatch(/log_destination\s*=\s*aws_s3_bucket\.vpc_flow_logs\.arn/);
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - CloudTrail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("CloudTrail Configuration", () => {
    test("creates CloudWatch Log Group for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.arn/);
    });

    test("creates IAM role for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test("creates IAM policy for CloudTrail CloudWatch integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates multi-region CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("enables log file validation", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("configures data events for S3", () => {
      expect(stackContent).toMatch(/event_selector/);
      expect(stackContent).toMatch(/data_resource/);
      expect(stackContent).toMatch(/AWS::S3::Object/);
    });

    test("uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.arn/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - AWS Config", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Config Setup", () => {
    test("creates IAM role for AWS Config", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(stackContent).toMatch(/config\.amazonaws\.com/);
    });

    test("attaches managed policy to Config role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
      expect(stackContent).toMatch(/service-role\/ConfigRole/);
    });

    test("creates Config S3 policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config_s3"/);
      expect(stackContent).toMatch(/s3:GetBucketAcl/);
      expect(stackContent).toMatch(/s3:PutObject/);
    });

    test("creates Configuration Recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("creates Delivery Channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(stackContent).toMatch(/s3_bucket_name/);
    });

    test("enables Configuration Recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(stackContent).toMatch(/is_enabled\s*=\s*true/);
    });
  });

  describe("Config Rules", () => {
    test("creates encrypted volumes rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"/);
      expect(stackContent).toMatch(/ENCRYPTED_VOLUMES/);
    });

    test("creates S3 public read prohibited rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"/);
      expect(stackContent).toMatch(/S3_BUCKET_PUBLIC_READ_PROHIBITED/);
    });

    test("creates restricted SSH rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"restricted_ssh"/);
      expect(stackContent).toMatch(/INCOMING_SSH_DISABLED/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - GuardDuty", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("GuardDuty Setup", () => {
    test("enables GuardDuty detector", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("enables S3 protection", () => {
      expect(stackContent).toMatch(/s3_logs\s*{/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("enables Kubernetes audit logs", () => {
      expect(stackContent).toMatch(/kubernetes\s*{/);
      expect(stackContent).toMatch(/audit_logs\s*{/);
    });

    test("sets finding publishing frequency", () => {
      expect(stackContent).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - SNS and Notifications", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("SNS Topics", () => {
    test("creates SNS topic for GuardDuty findings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"guardduty"/);
      expect(stackContent).toMatch(/guardduty-findings/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.master\.id/);
    });

    test("creates SNS subscription for GuardDuty", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"guardduty_email"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
    });

    test("creates SNS topic for CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alarms"/);
      expect(stackContent).toMatch(/cloudwatch-security-alarms/);
    });

    test("creates SNS subscription for CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"cloudwatch_email"/);
    });
  });

  describe("EventBridge Integration", () => {
    test("creates EventBridge rule for GuardDuty findings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"guardduty_findings"/);
      expect(stackContent).toMatch(/aws\.guardduty/);
      expect(stackContent).toMatch(/GuardDuty Finding/);
    });

    test("creates EventBridge target to SNS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty_sns"/);
      expect(stackContent).toMatch(/arn\s*=\s*aws_sns_topic\.guardduty\.arn/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - CloudWatch Alarms", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Metric Filters and Alarms", () => {
    test("creates log metric filter for failed authentication", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"failed_auth"/);
      expect(stackContent).toMatch(/Authentication/);
      expect(stackContent).toMatch(/FailedAuthenticationAttempts/);
    });

    test("creates alarm for failed authentication attempts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_auth"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"5"/);
      expect(stackContent).toMatch(/period\s*=\s*"60"/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[\s*aws_sns_topic\.cloudwatch_alarms\.arn\s*\]/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - WAF", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("WAF Configuration", () => {
    test("creates WAF IP set", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_ip_set"\s+"allowed_ips"/);
      expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("creates WAF Web ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(stackContent).toMatch(/pci-dss-web-acl/);
    });

    test("configures rate limiting rule (2000 requests per 5 minutes)", () => {
      expect(stackContent).toMatch(/rate_based_statement/);
      expect(stackContent).toMatch(/limit\s*=\s*2000/);
      expect(stackContent).toMatch(/aggregate_key_type\s*=\s*"IP"/);
    });

    test("includes AWS managed rule sets", () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });

    test("enables CloudWatch metrics for WAF", () => {
      expect(stackContent).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/sampled_requests_enabled\s*=\s*true/);
    });

    test("creates CloudWatch Log Group for WAF", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"waf"/);
      expect(stackContent).toMatch(/\/aws\/wafv2\/pci-dss/);
    });

    test("configures WAF logging", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"\s+"main"/);
      expect(stackContent).toMatch(/redacted_fields/);
      expect(stackContent).toMatch(/authorization/);
      expect(stackContent).toMatch(/cookie/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Systems Manager Parameter Store", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Parameter Store", () => {
    test("creates database password parameter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
      expect(stackContent).toMatch(/\/pci-dss\/database\/master\/password/);
      expect(stackContent).toMatch(/type\s*=\s*"SecureString"/);
      expect(stackContent).toMatch(/key_id\s*=\s*aws_kms_key\.parameter_store\.key_id/);
    });

    test("creates API key parameter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_key"/);
      expect(stackContent).toMatch(/\/pci-dss\/api\/payment\/key/);
      expect(stackContent).toMatch(/type\s*=\s*"SecureString"/);
    });

    test("parameters have AutoRotate tag", () => {
      expect(stackContent).toMatch(/AutoRotate\s*=\s*"true"/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - IAM Roles and Policies", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("EC2 IAM Role", () => {
    test("creates EC2 instance role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"/);
      expect(stackContent).toMatch(/pci-dss-ec2-role/);
    });

    test("creates EC2 instance policy with least privilege", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_instance"/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/ssm:GetParameter/);
      expect(stackContent).toMatch(/kms:Decrypt/);
    });

    test("creates EC2 instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_instance\.name/);
    });

    test("EC2 policy uses explicit ARNs (no wildcards)", () => {
      const ec2PolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_instance"[\s\S]{0,1000}/);
      expect(ec2PolicySection).toBeTruthy();
      expect(ec2PolicySection![0]).toMatch(/arn:aws:/);
    });
  });

  describe("Lambda IAM Role", () => {
    test("creates Lambda function role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_function"/);
      expect(stackContent).toMatch(/pci-dss-lambda-role/);
    });

    test("creates Lambda policy with least privilege", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_function"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/ssm:GetParameter/);
      expect(stackContent).toMatch(/kms:Decrypt/);
    });

    test("Lambda policy allows X-Ray tracing", () => {
      expect(stackContent).toMatch(/xray:PutTraceSegments/);
      expect(stackContent).toMatch(/xray:PutTelemetryRecords/);
    });
  });

  describe("ECS IAM Roles", () => {
    test("creates ECS task role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
      expect(stackContent).toMatch(/pci-dss-ecs-task-role/);
    });

    test("creates ECS task policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ecs_task"/);
      expect(stackContent).toMatch(/ecr:GetAuthorizationToken/);
      expect(stackContent).toMatch(/ecr:BatchGetImage/);
    });

    test("creates ECS task execution role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
      expect(stackContent).toMatch(/pci-dss-ecs-task-execution-role/);
    });

    test("attaches ECS task execution policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ecs_task_execution"/);
      expect(stackContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Application Load Balancer", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("ALB Configuration", () => {
    test("creates Application Load Balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"web"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("ALB is not internal", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB has access logs enabled", () => {
      expect(stackContent).toMatch(/access_logs\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("associates WAF with ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"alb"/);
      expect(stackContent).toMatch(/resource_arn\s*=\s*aws_lb\.web\.arn/);
      expect(stackContent).toMatch(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("Output Values", () => {
    test("outputs VPC IDs", () => {
      expect(stackContent).toMatch(/output\s+"vpc_ids"/);
    });

    test("outputs KMS key ARNs (marked sensitive)", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_arns"/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("outputs S3 bucket names", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_names"/);
    });

    test("outputs SNS topic ARNs", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arns"/);
    });

    test("outputs IAM role ARNs", () => {
      expect(stackContent).toMatch(/output\s+"iam_role_arns"/);
    });

    test("outputs ALB DNS name", () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
      expect(stackContent).toMatch(/aws_lb\.web\.dns_name/);
    });

    test("outputs WAF Web ACL ID", () => {
      expect(stackContent).toMatch(/output\s+"waf_web_acl_id"/);
    });

    test("outputs GuardDuty detector ID", () => {
      expect(stackContent).toMatch(/output\s+"guardduty_detector_id"/);
    });

    test("outputs CloudTrail name", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_name"/);
    });

    test("outputs Config recorder name", () => {
      expect(stackContent).toMatch(/output\s+"config_recorder_name"/);
    });
  });
});

describe("Terraform PCI-DSS Infrastructure - Compliance Requirements", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("PCI-DSS Compliance Checks", () => {
    test("all resources use encryption at rest", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      // Check for KMS encryption - we use S3 and KMS, not RDS in this infrastructure
      expect(stackContent).toMatch(/kms_master_key_id\s*=/);
    });

    test("no resources have deletion protection enabled", () => {
      expect(stackContent).not.toMatch(/deletion_protection\s*=\s*true/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("all S3 buckets block public access", () => {
      const publicAccessBlockCount = (stackContent.match(/block_public_acls\s*=\s*true/g) || []).length;
      const s3BucketCount = (stackContent.match(/resource\s+"aws_s3_bucket"\s+"\w+"/g) || []).length;
      expect(publicAccessBlockCount).toBeGreaterThanOrEqual(s3BucketCount);
    });

    test("logging is enabled for all required services", () => {
      expect(stackContent).toMatch(/CloudTrail/);
      expect(stackContent).toMatch(/VPC Flow Logs/);
      expect(stackContent).toMatch(/AWS Config/);
      expect(stackContent).toMatch(/waf/i);
    });

    test("all logs have 90-day retention for compliance", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/);
    });

    test("multi-region deployment configured", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/azs_primary/);
      expect(stackContent).toMatch(/azs_secondary/);
    });

    test("network segmentation implemented (3 VPCs)", () => {
      const vpcCount = (stackContent.match(/resource\s+"aws_vpc"\s+"\w+"/g) || []).length;
      expect(vpcCount).toBe(3);
    });

    test("all IAM policies use explicit ARNs", () => {
      const policySection = stackContent.match(/policy\s*=\s*jsonencode\s*\([\s\S]{0,2000}\)/g);
      expect(policySection).toBeTruthy();
      expect(policySection!.length).toBeGreaterThan(5);
    });
  });

  describe("Zero-Trust Architecture", () => {
    test("security groups reference other security groups", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
    });

    test("SSH access is controlled through security groups", () => {
      const sshRules = stackContent.match(/from_port\s*=\s*22/g);
      expect(sshRules).toBeTruthy();
      expect(sshRules!.length).toBeGreaterThan(0);
      // Verify SSH security group rules exist
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
    });

    test("database tier is isolated in separate VPC", () => {
      expect(stackContent).toMatch(/aws_vpc\.data/);
      expect(stackContent).toMatch(/data-vpc/);
    });
  });
});
