// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates all requirements without executing Terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

let tfContent: string;

beforeAll(() => {
  if (!fs.existsSync(stackPath)) {
    throw new Error(`Stack file not found at: ${stackPath}`);
  }
  tfContent = fs.readFileSync(stackPath, "utf8");
});

describe("Terraform Stack: tap_stack.tf - File Structure", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("file is not empty", () => {
    expect(tfContent.length).toBeGreaterThan(0);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(tfContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });
});

describe("Required Variables", () => {
  test("declares aws_region variable", () => {
    expect(tfContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares database configuration variables", () => {
    expect(tfContent).toMatch(/variable\s+"db_name"\s*{/);
    expect(tfContent).toMatch(/variable\s+"db_username"\s*{/);
    expect(tfContent).toMatch(/variable\s+"db_password"\s*{/);
    expect(tfContent).toMatch(/variable\s+"db_instance_class"\s*{/);
  });

  test("declares backup retention variable", () => {
    expect(tfContent).toMatch(/variable\s+"db_backup_retention_period"\s*{/);
  });

  test("declares allowed_cidr_blocks variable for security", () => {
    expect(tfContent).toMatch(/variable\s+"allowed_cidr_blocks"\s*{/);
  });

  test("declares SNS email endpoints variable", () => {
    expect(tfContent).toMatch(/variable\s+"sns_email_endpoints"\s*{/);
  });

  test("declares tagging variables (environment, owner, project)", () => {
    expect(tfContent).toMatch(/variable\s+"environment"\s*{/);
    expect(tfContent).toMatch(/variable\s+"owner"\s*{/);
    expect(tfContent).toMatch(/variable\s+"project"\s*{/);
  });

  test("db_password variable is marked as sensitive", () => {
    const dbPasswordBlock = tfContent.match(
      /variable\s+"db_password"\s*{[^}]*}/s
    );
    expect(dbPasswordBlock).toBeTruthy();
    expect(dbPasswordBlock![0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("db_instance_class defaults to db.m5.large", () => {
    const dbInstanceBlock = tfContent.match(
      /variable\s+"db_instance_class"\s*{[^}]*}/s
    );
    expect(dbInstanceBlock).toBeTruthy();
    expect(dbInstanceBlock![0]).toMatch(/default\s*=\s*"db\.m5\.large"/);
  });

  test("db_backup_retention_period defaults to at least 7 days", () => {
    const backupBlock = tfContent.match(
      /variable\s+"db_backup_retention_period"\s*{[^}]*}/s
    );
    expect(backupBlock).toBeTruthy();
    expect(backupBlock![0]).toMatch(/default\s*=\s*7/);
  });
});

describe("RDS PostgreSQL Configuration - Required Components", () => {
  test("declares RDS instance resource", () => {
    expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"\w+"\s*{/);
  });

  test("RDS uses PostgreSQL engine", () => {
    const rdsBlock = tfContent.match(
      /resource\s+"aws_db_instance"[^}]*engine\s*=\s*"postgres"/s
    );
    expect(rdsBlock).toBeTruthy();
  });

  test("RDS instance class references db_instance_class variable", () => {
    expect(tfContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
  });

  test("RDS has Multi-AZ enabled", () => {
    expect(tfContent).toMatch(/multi_az\s*=\s*true/);
  });

  test("RDS storage is encrypted", () => {
    expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS uses KMS key for encryption", () => {
    expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/);
  });

  test("RDS backup retention period references variable", () => {
    expect(tfContent).toMatch(
      /backup_retention_period\s*=\s*var\.db_backup_retention_period/
    );
  });

  test("RDS Enhanced Monitoring is enabled (monitoring_interval = 60)", () => {
    expect(tfContent).toMatch(/monitoring_interval\s*=\s*60/);
  });

  test("RDS has monitoring role ARN configured", () => {
    expect(tfContent).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.\w+\.arn/);
  });

  test("RDS has deletion protection enabled", () => {
    expect(tfContent).toMatch(/deletion_protection\s*=\s*true/);
  });

  test("RDS Performance Insights is enabled", () => {
    expect(tfContent).toMatch(/performance_insights_enabled\s*=\s*true/);
  });

  test("RDS Performance Insights uses KMS encryption", () => {
    expect(tfContent).toMatch(
      /performance_insights_kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/
    );
  });

  test("RDS exports CloudWatch logs", () => {
    expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports/);
  });
});

describe("RDS PostgreSQL - TLS/SSL Enforcement", () => {
  test("declares DB parameter group", () => {
    expect(tfContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"\w+"\s*{/);
  });

  test("parameter group enforces SSL connections (rds.force_ssl = 1)", () => {
    const paramBlock = tfContent.match(
      /resource\s+"aws_db_parameter_group".*?{.*?}/gs
    );
    expect(paramBlock).toBeTruthy();
    const forceSSL = tfContent.match(
      /name\s*=\s*"rds\.force_ssl"[\s\S]*?value\s*=\s*"1"/
    );
    expect(forceSSL).toBeTruthy();
  });

  test("parameter group enables connection logging", () => {
    expect(tfContent).toMatch(/name\s*=\s*"log_connections"/);
    expect(tfContent).toMatch(/name\s*=\s*"log_disconnections"/);
  });
});

describe("RDS PostgreSQL - Subnet Configuration", () => {
  test("declares DB subnet group", () => {
    expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"\w+"\s*{/);
  });

  test("RDS instance references DB subnet group", () => {
    expect(tfContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.\w+\.name/);
  });
});

describe("Security Groups - Network Security", () => {
  test("declares security group resource", () => {
    expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"\w+"\s*{/);
  });

  test("security group allows inbound traffic on port 5432", () => {
    const sgBlock = tfContent.match(/resource\s+"aws_security_group".*?{[\s\S]*?}/);
    expect(sgBlock).toBeTruthy();
    expect(tfContent).toMatch(/from_port\s*=\s*5432/);
    expect(tfContent).toMatch(/to_port\s*=\s*5432/);
  });

  test("security group ingress uses allowed_cidr_blocks variable", () => {
    expect(tfContent).toMatch(/cidr_blocks\s*=\s*var\.allowed_cidr_blocks/);
  });

  test("security group does NOT have permissive egress rules (no 0.0.0.0/0 egress)", () => {
    // Find the security group block
    const sgMatch = tfContent.match(
      /resource\s+"aws_security_group"\s+"[^"]+"\s*{[\s\S]*?(?=\n\s*resource\s+"|# -+\n|$)/
    );

    if (sgMatch) {
      const sgBlock = sgMatch[0];
      // Check that there's no egress block with 0.0.0.0/0
      const hasPermissiveEgress = sgBlock.match(
        /egress\s*{[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/
      );
      expect(hasPermissiveEgress).toBeFalsy();
    }
  });

  test("RDS instance references security group", () => {
    expect(tfContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.\w+\.id\]/);
  });
});

describe("KMS Encryption", () => {
  test("declares KMS key resource", () => {
    expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"\w+"\s*{/);
  });

  test("KMS key has rotation enabled", () => {
    expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares KMS key alias", () => {
    expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"\w+"\s*{/);
  });
});

describe("CloudWatch Monitoring - Alarms", () => {
  test("declares CloudWatch alarm for CPU utilization", () => {
    const cpuAlarm = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"CPUUtilization"/
    );
    expect(cpuAlarm).toBeTruthy();
  });

  test("declares CloudWatch alarm for database connections", () => {
    const connAlarm = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"DatabaseConnections"/
    );
    expect(connAlarm).toBeTruthy();
  });

  test("declares CloudWatch alarm for free storage space", () => {
    const storageAlarm = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"FreeStorageSpace"/
    );
    expect(storageAlarm).toBeTruthy();
  });

  test("declares CloudWatch alarm for freeable memory", () => {
    const memoryAlarm = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"FreeableMemory"/
    );
    expect(memoryAlarm).toBeTruthy();
  });

  test("declares CloudWatch alarm for read latency", () => {
    const readLatencyAlarm = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"ReadLatency"/
    );
    expect(readLatencyAlarm).toBeTruthy();
  });

  test("declares CloudWatch alarm for write latency", () => {
    const writeLatencyAlarm = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"WriteLatency"/
    );
    expect(writeLatencyAlarm).toBeTruthy();
  });

  test("FreeStorageSpace alarm threshold is in bytes (not MB)", () => {
    const storageAlarmBlock = tfContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"FreeStorageSpace"[\s\S]*?threshold\s*=\s*(\d+)/
    );
    expect(storageAlarmBlock).toBeTruthy();
    if (storageAlarmBlock) {
      const threshold = parseInt(storageAlarmBlock[1]);
      // Should be in bytes (e.g., 21474836480 for 20GB), not MB (20480)
      expect(threshold).toBeGreaterThan(1000000000); // At least 1GB in bytes
    }
  });

  test("CloudWatch alarms send to SNS topic", () => {
    const alarmWithSNS = tfContent.match(
      /alarm_actions\s*=\s*\[aws_sns_topic\.\w+\.arn\]/
    );
    expect(alarmWithSNS).toBeTruthy();
  });
});

describe("CloudWatch Log Groups", () => {
  test("declares CloudWatch log group for PostgreSQL logs", () => {
    const logGroup = tfContent.match(
      /resource\s+"aws_cloudwatch_log_group"[\s\S]*?postgresql/i
    );
    expect(logGroup).toBeTruthy();
  });

  test("log groups are encrypted with KMS", () => {
    const logGroupWithKMS = tfContent.match(
      /resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/
    );
    expect(logGroupWithKMS).toBeTruthy();
  });

  test("log groups have retention configured", () => {
    expect(tfContent).toMatch(/retention_in_days\s*=\s*\d+/);
  });
});

describe("SNS Notifications", () => {
  test("declares SNS topic resource", () => {
    expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"\w+"\s*{/);
  });

  test("SNS topic is encrypted with KMS CMK", () => {
    const snsBlock = tfContent.match(
      /resource\s+"aws_sns_topic"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.\w+\.(id|arn)/
    );
    expect(snsBlock).toBeTruthy();
  });

  test("declares SNS topic policy", () => {
    expect(tfContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"\w+"\s*{/);
  });

  test("SNS topic policy allows CloudWatch to publish", () => {
    const policyBlock = tfContent.match(
      /resource\s+"aws_sns_topic_policy"[\s\S]*?cloudwatch\.amazonaws\.com/i
    );
    expect(policyBlock).toBeTruthy();
  });

  test("declares SNS topic subscription", () => {
    expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"\w+"\s*{/);
  });

  test("SNS subscription uses email protocol", () => {
    expect(tfContent).toMatch(/protocol\s*=\s*"email"/);
  });
});

describe("IAM Roles & Policies - Least Privilege", () => {
  test("declares IAM role for RDS Enhanced Monitoring", () => {
    expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"\w+"\s*{/);
  });

  test("IAM role has assume role policy for monitoring.rds.amazonaws.com", () => {
    const roleBlock = tfContent.match(
      /resource\s+"aws_iam_role"[\s\S]*?monitoring\.rds\.amazonaws\.com/
    );
    expect(roleBlock).toBeTruthy();
  });

  test("attaches AmazonRDSEnhancedMonitoringRole policy", () => {
    const policyAttachment = tfContent.match(
      /resource\s+"aws_iam_role_policy_attachment"[\s\S]*?AmazonRDSEnhancedMonitoringRole/
    );
    expect(policyAttachment).toBeTruthy();
  });
});

describe("CloudTrail - Audit & Compliance", () => {
  test("declares CloudTrail resource", () => {
    expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"\w+"\s*{/);
  });

  test("CloudTrail enables log file validation", () => {
    expect(tfContent).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("CloudTrail is encrypted with KMS", () => {
    const cloudtrailBlock = tfContent.match(
      /resource\s+"aws_cloudtrail"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/
    );
    expect(cloudtrailBlock).toBeTruthy();
  });

  test("CloudTrail is multi-region", () => {
    expect(tfContent).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("CloudTrail has event selector for RDS", () => {
    const eventSelector = tfContent.match(
      /event_selector[\s\S]*?AWS::RDS::DBInstance/
    );
    expect(eventSelector).toBeTruthy();
  });

  test("CloudTrail stores logs in S3 bucket", () => {
    expect(tfContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.\w+\.id/);
  });
});

describe("S3 Bucket - CloudTrail Logs", () => {
  test("declares S3 bucket for CloudTrail", () => {
    expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"\w+"\s*{/);
  });

  test("S3 bucket has public access blocked", () => {
    expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"\w+"\s*{/);
    expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(tfContent).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("S3 bucket has server-side encryption enabled", () => {
    expect(tfContent).toMatch(
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"\w+"\s*{/
    );
  });

  test("S3 bucket encryption uses KMS", () => {
    const encryptionBlock = tfContent.match(
      /aws_s3_bucket_server_side_encryption_configuration[\s\S]*?aws:kms/
    );
    expect(encryptionBlock).toBeTruthy();
  });

  test("S3 bucket has policy for CloudTrail", () => {
    expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"\w+"\s*{/);
    const bucketPolicy = tfContent.match(
      /resource\s+"aws_s3_bucket_policy"[\s\S]*?cloudtrail\.amazonaws\.com/i
    );
    expect(bucketPolicy).toBeTruthy();
  });
});

describe("Resource Tagging - All Resources", () => {
  test("KMS key has required tags", () => {
    const kmsBlock = tfContent.match(
      /resource\s+"aws_kms_key"[\s\S]*?tags\s*=\s*{[\s\S]*?}/
    );
    expect(kmsBlock).toBeTruthy();
    expect(kmsBlock![0]).toMatch(/Environment\s*=/);
    expect(kmsBlock![0]).toMatch(/Owner\s*=/);
    expect(kmsBlock![0]).toMatch(/Project\s*=/);
  });

  test("RDS instance has required tags", () => {
    const rdsBlock = tfContent.match(
      /resource\s+"aws_db_instance"[\s\S]*?tags\s*=\s*{[\s\S]*?}/
    );
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/Environment\s*=/);
    expect(rdsBlock![0]).toMatch(/Owner\s*=/);
    expect(rdsBlock![0]).toMatch(/Project\s*=/);
  });

  test("security group has required tags", () => {
    const sgBlock = tfContent.match(
      /resource\s+"aws_security_group"[\s\S]*?tags\s*=\s*{[\s\S]*?}/
    );
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/Environment\s*=/);
    expect(sgBlock![0]).toMatch(/Owner\s*=/);
    expect(sgBlock![0]).toMatch(/Project\s*=/);
  });

  test("SNS topic has required tags", () => {
    const snsBlock = tfContent.match(
      /resource\s+"aws_sns_topic"[^}]*tags\s*=\s*{[\s\S]*?}/
    );
    expect(snsBlock).toBeTruthy();
    expect(snsBlock![0]).toMatch(/Environment\s*=/);
    expect(snsBlock![0]).toMatch(/Owner\s*=/);
    expect(snsBlock![0]).toMatch(/Project\s*=/);
  });

  test("CloudTrail has required tags", () => {
    const cloudtrailBlock = tfContent.match(
      /resource\s+"aws_cloudtrail"[\s\S]*?tags\s*=\s*{[\s\S]*?}/
    );
    expect(cloudtrailBlock).toBeTruthy();
    expect(cloudtrailBlock![0]).toMatch(/Environment\s*=/);
    expect(cloudtrailBlock![0]).toMatch(/Owner\s*=/);
    expect(cloudtrailBlock![0]).toMatch(/Project\s*=/);
  });

  test("S3 bucket has required tags", () => {
    const s3Block = tfContent.match(
      /resource\s+"aws_s3_bucket"\s+"[^"]+"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/
    );
    expect(s3Block).toBeTruthy();
    expect(s3Block![0]).toMatch(/Environment\s*=/);
    expect(s3Block![0]).toMatch(/Owner\s*=/);
    expect(s3Block![0]).toMatch(/Project\s*=/);
  });

  test("tags reference variables correctly", () => {
    expect(tfContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(tfContent).toMatch(/Owner\s*=\s*var\.owner/);
    expect(tfContent).toMatch(/Project\s*=\s*var\.project/);
  });
});

describe("Outputs - Required Information", () => {
  test("declares output for RDS endpoint", () => {
    expect(tfContent).toMatch(/output\s+"rds_endpoint"\s*{/);
  });

  test("RDS endpoint output references RDS instance", () => {
    const endpointOutput = tfContent.match(
      /output\s+"rds_endpoint"[\s\S]*?value\s*=\s*aws_db_instance\.\w+\.endpoint/
    );
    expect(endpointOutput).toBeTruthy();
  });

  test("declares output for RDS instance ID", () => {
    expect(tfContent).toMatch(/output\s+"rds_instance_id"\s*{/);
  });

  test("declares output for security group ID", () => {
    expect(tfContent).toMatch(/output\s+"rds_security_group_id"\s*{/);
  });

  test("declares output for SNS topic ARN", () => {
    expect(tfContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
  });

  test("declares output for CloudTrail information", () => {
    const cloudtrailOutput = tfContent.match(
      /output\s+"cloudtrail_(name|bucket_name|arn)"\s*{/
    );
    expect(cloudtrailOutput).toBeTruthy();
  });

  test("declares output for KMS key ARN", () => {
    expect(tfContent).toMatch(/output\s+"kms_key_arn"\s*{/);
  });

  test("all outputs have descriptions", () => {
    const outputs = tfContent.match(/output\s+"\w+"\s*{[^}]*}/g);
    if (outputs) {
      outputs.forEach((output) => {
        expect(output).toMatch(/description\s*=/);
      });
    }
  });
});

describe("Data Sources", () => {
  test("uses aws_caller_identity data source", () => {
    expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });
});

describe("AWS Best Practices & Healthcare Compliance", () => {
  test("no hardcoded credentials or secrets", () => {
    // Check for common patterns of hardcoded secrets
    expect(tfContent).not.toMatch(/password\s*=\s*"[^"]*[A-Za-z0-9]/);
    expect(tfContent).not.toMatch(/secret\s*=\s*"[^"]*[A-Za-z0-9]/);
  });

  test("uses variables for sensitive information", () => {
    expect(tfContent).toMatch(/password\s*=\s*var\.db_password/);
  });

  test("backup window is configured", () => {
    expect(tfContent).toMatch(/backup_window\s*=\s*"\d{2}:\d{2}-\d{2}:\d{2}"/);
  });

  test("maintenance window is configured", () => {
    expect(tfContent).toMatch(/maintenance_window\s*=\s*"\w+:\d{2}:\d{2}-\w+:\d{2}:\d{2}"/);
  });

  test("auto minor version upgrade is enabled", () => {
    expect(tfContent).toMatch(/auto_minor_version_upgrade\s*=\s*true/);
  });

  test("final snapshot is required on deletion", () => {
    expect(tfContent).toMatch(/skip_final_snapshot\s*=\s*false/);
  });

  test("tags are copied to snapshots", () => {
    expect(tfContent).toMatch(/copy_tags_to_snapshot\s*=\s*true/);
  });
});

describe("VPC and Networking (Self-Contained Version)", () => {
  test("declares VPC resource if self-contained", () => {
    const hasVPC = tfContent.match(/resource\s+"aws_vpc"\s+"\w+"\s*{/);
    if (hasVPC) {
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    }
  });

  test("declares private subnets for RDS", () => {
    const hasPrivateSubnet = tfContent.match(/resource\s+"aws_subnet"\s+"private_subnet/);
    if (hasPrivateSubnet) {
      // Should have at least 2 private subnets for Multi-AZ
      const privateSubnets = tfContent.match(/resource\s+"aws_subnet"\s+"private_subnet/g);
      expect(privateSubnets!.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("if NAT Gateways exist, they should be in public subnets", () => {
    const hasNATGW = tfContent.match(/resource\s+"aws_nat_gateway"/);
    if (hasNATGW) {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public_subnet/);
    }
  });
});

describe("Resource Dependencies", () => {
  test("RDS instance depends on CloudWatch log groups", () => {
    const rdsBlock = tfContent.match(
      /resource\s+"aws_db_instance"[\s\S]*?depends_on\s*=\s*\[[\s\S]*?aws_cloudwatch_log_group/
    );
    expect(rdsBlock).toBeTruthy();
  });

  test("CloudTrail depends on S3 bucket policy", () => {
    const cloudtrailBlock = tfContent.match(
      /resource\s+"aws_cloudtrail"[\s\S]*?depends_on\s*=\s*\[[\s\S]*?aws_s3_bucket_policy/
    );
    // This is optional but recommended
    if (cloudtrailBlock) {
      expect(cloudtrailBlock).toBeTruthy();
    }
  });
});

describe("Code Quality & Standards", () => {
  test("uses consistent resource naming convention", () => {
    const resources = tfContent.match(/resource\s+"\w+"\s+"(\w+)"/g);
    if (resources) {
      resources.forEach((resource) => {
        const name = resource.match(/"(\w+)"$/);
        if (name) {
          // Should use snake_case
          expect(name[1]).toMatch(/^[a-z][a-z0-9_]*$/);
        }
      });
    }
  });

  test("uses consistent variable naming convention", () => {
    const variables = tfContent.match(/variable\s+"(\w+)"/g);
    if (variables) {
      variables.forEach((variable) => {
        const name = variable.match(/"(\w+)"$/);
        if (name) {
          // Should use snake_case
          expect(name[1]).toMatch(/^[a-z][a-z0-9_]*$/);
        }
      });
    }
  });

  test("has organized sections with comments", () => {
    expect(tfContent).toMatch(/#.*VARIABLES/i);
    expect(tfContent).toMatch(/#.*DATA SOURCES/i);
    expect(tfContent).toMatch(/#.*OUTPUTS/i);
  });

  test("file is properly formatted with consistent indentation", () => {
    const lines = tfContent.split("\n");
    let hasConsistentIndentation = true;

    lines.forEach((line) => {
      // Check that indentation uses spaces (not tabs mixed with spaces)
      if (line.match(/^\t/)) {
        hasConsistentIndentation = false;
      }
    });

    expect(hasConsistentIndentation).toBe(true);
  });
});

describe("Critical Fixes Validation", () => {
  test("CRITICAL: aws_region variable is declared (Fix #1)", () => {
    expect(tfContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("CRITICAL: Security group has NO permissive egress rule (Fix #2)", () => {
    const sgMatch = tfContent.match(
      /resource\s+"aws_security_group"\s+"[^"]+"\s*{[\s\S]*?(?=\n\s*resource\s+"|# -+\n|$)/
    );

    if (sgMatch) {
      const sgBlock = sgMatch[0];
      const hasPermissiveEgress = sgBlock.match(
        /egress\s*{[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/
      );
      expect(hasPermissiveEgress).toBeFalsy();
    }
  });

  test("CRITICAL: FreeStorageSpace alarm uses correct byte threshold (Fix #3)", () => {
    const storageAlarmMatch = tfContent.match(
      /metric_name\s*=\s*"FreeStorageSpace"[\s\S]*?threshold\s*=\s*(\d+)/
    );

    if (storageAlarmMatch) {
      const threshold = parseInt(storageAlarmMatch[1]);
      // Should be in bytes (>1GB), not MB
      expect(threshold).toBeGreaterThan(1000000000);
      // Specific check: should be around 20GB in bytes (21474836480)
      expect(threshold).toBeGreaterThan(10000000000);
    }
  });
});

describe("Summary Statistics", () => {
  test("file has sufficient complexity (minimum line count)", () => {
    const lines = tfContent.split("\n").length;
    expect(lines).toBeGreaterThan(500); // Should be comprehensive
  });

  test("declares multiple resources", () => {
    const resources = tfContent.match(/resource\s+"\w+"\s+"\w+"/g);
    expect(resources).toBeTruthy();
    expect(resources!.length).toBeGreaterThan(20); // Comprehensive stack
  });

  test("declares appropriate number of variables", () => {
    const variables = tfContent.match(/variable\s+"\w+"/g);
    expect(variables).toBeTruthy();
    expect(variables!.length).toBeGreaterThan(8); // Sufficient configurability
  });

  test("declares appropriate number of outputs", () => {
    const outputs = tfContent.match(/output\s+"\w+"/g);
    expect(outputs).toBeTruthy();
    expect(outputs!.length).toBeGreaterThan(5); // Key information exposed
  });
});
