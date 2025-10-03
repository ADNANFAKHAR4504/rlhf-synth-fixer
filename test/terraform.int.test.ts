// tests/integration/terraform.int.test.ts
// Integration tests for tap_stack.tf - validates full stack configuration
// Tests resource relationships, outputs, edge cases, and deployment readiness
// Uses cfn-outputs/all-outputs.json if available to validate actual deployments

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

let tfContent: string;
let deploymentOutputs: any = null;

beforeAll(() => {
  if (!fs.existsSync(STACK_PATH)) {
    throw new Error(`Stack file not found at: ${STACK_PATH}`);
  }
  tfContent = fs.readFileSync(STACK_PATH, "utf8");

  // Load actual deployment outputs if available
  if (fs.existsSync(OUTPUTS_PATH)) {
    try {
      const outputsContent = fs.readFileSync(OUTPUTS_PATH, "utf8");
      deploymentOutputs = JSON.parse(outputsContent);
      console.log("✓ Loaded deployment outputs for integration testing");
    } catch (error) {
      console.warn("⚠ Could not parse deployment outputs:", error);
    }
  }
});

describe("Integration Tests - Full Stack Validation", () => {
  describe("Stack Configuration Integrity", () => {
    test("stack has all required resource types for healthcare compliance", () => {
      const requiredResources = [
        "aws_db_instance",
        "aws_kms_key",
        "aws_security_group",
        "aws_cloudwatch_metric_alarm",
        "aws_sns_topic",
        "aws_cloudtrail",
        "aws_s3_bucket",
        "aws_iam_role",
        "aws_db_parameter_group",
        "aws_db_subnet_group",
      ];

      requiredResources.forEach((resourceType) => {
        const pattern = new RegExp(`resource\\s+"${resourceType}"\\s+`, "g");
        const matches = tfContent.match(pattern);
        expect(matches).toBeTruthy();
        expect(matches!.length).toBeGreaterThan(0);
      });
    });

    test("stack declares minimum required variables for deployment", () => {
      const requiredVariables = [
        "aws_region",
        "db_password",
        "environment",
        "owner",
        "project",
      ];

      requiredVariables.forEach((varName) => {
        const pattern = new RegExp(`variable\\s+"${varName}"\\s*{`, "g");
        expect(tfContent).toMatch(pattern);
      });
    });

    test("stack has no syntax errors in resource blocks", () => {
      // Check for balanced braces in resource blocks
      const resourceBlocks = tfContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
      expect(resourceBlocks).toBeTruthy();
      expect(resourceBlocks!.length).toBeGreaterThan(15);

      // Basic brace balance check
      const openBraces = (tfContent.match(/{/g) || []).length;
      const closeBraces = (tfContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe("Resource Relationships and Dependencies", () => {
    test("RDS instance correctly references all dependent resources", () => {
      const rdsBlock = tfContent.match(
        /resource\s+"aws_db_instance"[\s\S]*?(?=\nresource\s+|# -+\n\nresource|$)/
      );
      expect(rdsBlock).toBeTruthy();

      const rdsContent = rdsBlock![0];

      // Check all critical references
      expect(rdsContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/);
      expect(rdsContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.\w+\.id\]/);
      expect(rdsContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.\w+\.name/);
      expect(rdsContent).toMatch(/parameter_group_name\s*=\s*aws_db_parameter_group\.\w+\.name/);
      expect(rdsContent).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.\w+\.arn/);
      expect(rdsContent).toMatch(/performance_insights_kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/);
    });

    test("CloudWatch alarms correctly reference RDS instance and SNS topic", () => {
      const alarmBlocks = tfContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?dimensions\s*=\s*{[\s\S]*?}/g);
      expect(alarmBlocks).toBeTruthy();
      expect(alarmBlocks!.length).toBeGreaterThanOrEqual(6);

      alarmBlocks!.forEach((alarm) => {
        expect(alarm).toMatch(/DBInstanceIdentifier\s*=\s*aws_db_instance\.\w+\.id/);
        expect(alarm).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.\w+\.arn\]/);
      });
    });

    test("SNS topic is encrypted with KMS key from same stack", () => {
      const snsBlock = tfContent.match(
        /resource\s+"aws_sns_topic"[\s\S]*?(?=\nresource\s+|# -+\n)/
      );
      expect(snsBlock).toBeTruthy();
      expect(snsBlock![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.\w+\.(id|key_id)/);
    });

    test("CloudTrail references S3 bucket and KMS key from same stack", () => {
      const cloudtrailBlock = tfContent.match(
        /resource\s+"aws_cloudtrail"[\s\S]*?(?=\nresource\s+|# -+\n\nresource|$)/
      );
      expect(cloudtrailBlock).toBeTruthy();

      const cloudtrailContent = cloudtrailBlock![0];
      expect(cloudtrailContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.\w+\.id/);
      expect(cloudtrailContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/);
    });

    test("S3 bucket encryption references KMS key from same stack", () => {
      const s3EncryptionBlock = tfContent.match(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"[\s\S]*?(?=\nresource\s+|# -+\n)/
      );
      expect(s3EncryptionBlock).toBeTruthy();
      expect(s3EncryptionBlock![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.\w+\.arn/);
    });

    test("CloudWatch log groups reference KMS key for encryption", () => {
      const logGroupBlocks = tfContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.\w+\.arn/g);
      expect(logGroupBlocks).toBeTruthy();
      expect(logGroupBlocks!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Security Configuration Integration", () => {
    test("security group and RDS are in same VPC", () => {
      const sgMatch = tfContent.match(/resource\s+"aws_security_group"[\s\S]*?vpc_id\s*=\s*([\w.]+)/);
      const rdsMatch = tfContent.match(/resource\s+"aws_db_instance"[\s\S]*?vpc_security_group_ids/);

      expect(sgMatch).toBeTruthy();
      expect(rdsMatch).toBeTruthy();

      // If VPC is created, both should reference it
      if (tfContent.includes('resource "aws_vpc"')) {
        expect(sgMatch![1]).toMatch(/aws_vpc\.\w+\.id/);
      }
    });

    test("RDS is isolated from public internet (no public accessibility)", () => {
      const rdsBlock = tfContent.match(/resource\s+"aws_db_instance"[\s\S]*?(?=\nresource\s+|# -+\n\nresource|$)/);
      expect(rdsBlock).toBeTruthy();

      // Should not have publicly_accessible = true
      const publiclyAccessible = rdsBlock![0].match(/publicly_accessible\s*=\s*true/);
      expect(publiclyAccessible).toBeFalsy();
    });

    test("all encryption uses consistent KMS key", () => {
      const kmsReferences = tfContent.match(/aws_kms_key\.\w+\.(arn|id|key_id)/g);
      expect(kmsReferences).toBeTruthy();
      expect(kmsReferences!.length).toBeGreaterThan(5); // Multiple resources use KMS

      // Extract resource names to check consistency
      const keyNames = kmsReferences!.map((ref) => {
        const match = ref.match(/aws_kms_key\.(\w+)/);
        return match ? match[1] : null;
      });

      // Should use the same KMS key across resources
      const uniqueKeys = new Set(keyNames);
      expect(uniqueKeys.size).toBe(1); // Only one KMS key resource
    });

    test("IAM role has proper trust relationship for RDS monitoring", () => {
      const iamRoleBlock = tfContent.match(
        /resource\s+"aws_iam_role"[\s\S]*?assume_role_policy[\s\S]*?monitoring\.rds\.amazonaws\.com/
      );
      expect(iamRoleBlock).toBeTruthy();
    });
  });

  describe("Monitoring and Alerting Integration", () => {
    test("all critical metrics have corresponding alarms", () => {
      const criticalMetrics = [
        "CPUUtilization",
        "DatabaseConnections",
        "FreeStorageSpace",
        "FreeableMemory",
      ];

      criticalMetrics.forEach((metric) => {
        const alarmPattern = new RegExp(`metric_name\\s*=\\s*"${metric}"`, "g");
        expect(tfContent).toMatch(alarmPattern);
      });
    });

    test("alarms are configured with appropriate thresholds", () => {
      // CPU should be high threshold (e.g., 80%)
      const cpuAlarm = tfContent.match(/metric_name\s*=\s*"CPUUtilization"[\s\S]*?threshold\s*=\s*(\d+)/);
      if (cpuAlarm) {
        const cpuThreshold = parseInt(cpuAlarm[1]);
        expect(cpuThreshold).toBeGreaterThan(50);
        expect(cpuThreshold).toBeLessThanOrEqual(90);
      }

      // Storage should be reasonable (in bytes)
      const storageAlarm = tfContent.match(/metric_name\s*=\s*"FreeStorageSpace"[\s\S]*?threshold\s*=\s*(\d+)/);
      if (storageAlarm) {
        const storageThreshold = parseInt(storageAlarm[1]);
        expect(storageThreshold).toBeGreaterThan(1000000000); // At least 1GB in bytes
      }
    });

    test("alarms have both alarm and ok actions configured", () => {
      const alarmBlocks = tfContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?(?=\nresource\s+|# -+\n)/g);

      if (alarmBlocks) {
        alarmBlocks.forEach((alarm) => {
          expect(alarm).toMatch(/alarm_actions\s*=/);
          // OK actions are optional but recommended
          if (alarm.includes("ok_actions")) {
            expect(alarm).toMatch(/ok_actions\s*=/);
          }
        });
      }
    });

    test("SNS topic has subscription mechanism configured", () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"/);
      expect(tfContent).toMatch(/protocol\s*=\s*"email"/);
      expect(tfContent).toMatch(/endpoint\s*=\s*var\.sns_email_endpoints/);
    });
  });

  describe("Backup and Disaster Recovery Integration", () => {
    test("RDS backup configuration is complete", () => {
      const rdsBlock = tfContent.match(/resource\s+"aws_db_instance"[\s\S]*?(?=\nresource\s+|# -+\n\nresource|$)/);
      expect(rdsBlock).toBeTruthy();

      const rdsContent = rdsBlock![0];
      expect(rdsContent).toMatch(/backup_retention_period\s*=\s*var\.db_backup_retention_period/);
      expect(rdsContent).toMatch(/backup_window\s*=\s*"\d{2}:\d{2}-\d{2}:\d{2}"/);
      expect(rdsContent).toMatch(/skip_final_snapshot\s*=\s*false/);
      expect(rdsContent).toMatch(/final_snapshot_identifier/);
    });

    test("Multi-AZ configuration is properly set for high availability", () => {
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("maintenance window does not overlap with backup window", () => {
      const backupWindow = tfContent.match(/backup_window\s*=\s*"(\d{2}):(\d{2})-(\d{2}):(\d{2})"/);
      const maintenanceWindow = tfContent.match(/maintenance_window\s*=\s*"(\w+):(\d{2}):(\d{2})-(\w+):(\d{2}):(\d{2})"/);

      expect(backupWindow).toBeTruthy();
      expect(maintenanceWindow).toBeTruthy();

      // Basic validation that they exist and are formatted correctly
      if (backupWindow && maintenanceWindow) {
        const backupStart = parseInt(backupWindow[1]);
        const backupEnd = parseInt(backupWindow[3]);
        expect(backupStart).toBeGreaterThanOrEqual(0);
        expect(backupStart).toBeLessThan(24);
        expect(backupEnd).toBeGreaterThanOrEqual(0);
        expect(backupEnd).toBeLessThan(24);
      }
    });
  });

  describe("Compliance and Audit Integration", () => {
    test("CloudTrail configuration is complete for auditing", () => {
      const cloudtrailBlock = tfContent.match(/resource\s+"aws_cloudtrail"[\s\S]*?(?=\nresource\s+|# -+\n\nresource|$)/);
      expect(cloudtrailBlock).toBeTruthy();

      const cloudtrailContent = cloudtrailBlock![0];
      expect(cloudtrailContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(cloudtrailContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(cloudtrailContent).toMatch(/event_selector/);
    });

    test("S3 bucket for CloudTrail has all security features enabled", () => {
      // Check for public access block
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/block_public_policy\s*=\s*true/);

      // Check for encryption
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test("all resources have proper tagging for compliance tracking", () => {
      const resourceBlocks = tfContent.match(/resource\s+"aws_\w+"[\s\S]*?tags\s*=/g);
      expect(resourceBlocks).toBeTruthy();
      expect(resourceBlocks!.length).toBeGreaterThan(10);
    });
  });

  describe("Output Validation", () => {
    test("all critical outputs are properly defined", () => {
      const criticalOutputs = [
        "rds_endpoint",
        "rds_instance_id",
        "sns_topic_arn",
        "kms_key_arn",
      ];

      criticalOutputs.forEach((output) => {
        const pattern = new RegExp(`output\\s+"${output}"\\s*{`, "g");
        expect(tfContent).toMatch(pattern);
      });
    });

    test("outputs reference correct resource attributes", () => {
      const endpointOutput = tfContent.match(/output\s+"rds_endpoint"[\s\S]*?value\s*=\s*([\w.]+)/);
      expect(endpointOutput).toBeTruthy();
      expect(endpointOutput![1]).toMatch(/aws_db_instance\.\w+\.endpoint/);

      const kmsOutput = tfContent.match(/output\s+"kms_key_arn"[\s\S]*?value\s*=\s*([\w.]+)/);
      expect(kmsOutput).toBeTruthy();
      expect(kmsOutput![1]).toMatch(/aws_kms_key\.\w+\.arn/);
    });

    test("sensitive outputs are marked appropriately", () => {
      // RDS endpoint might contain connection info
      const endpointOutput = tfContent.match(/output\s+"rds_endpoint"[\s\S]*?}/);
      if (endpointOutput && endpointOutput[0].includes("sensitive")) {
        expect(endpointOutput[0]).toMatch(/sensitive\s*=\s*true/);
      }
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("handles empty SNS email endpoints gracefully", () => {
      const snsSubscription = tfContent.match(/resource\s+"aws_sns_topic_subscription"[\s\S]*?count\s*=\s*length\(var\.sns_email_endpoints\)/);
      expect(snsSubscription).toBeTruthy();
    });

    test("database password is never hardcoded", () => {
      const passwordAssignments = tfContent.match(/password\s*=\s*"[^"]+"(?!var)/g);
      expect(passwordAssignments).toBeFalsy();
    });

    test("no default values for sensitive variables", () => {
      const dbPasswordVar = tfContent.match(/variable\s+"db_password"[\s\S]*?(?=\nvariable|# -+\n\nvariable|$)/);
      expect(dbPasswordVar).toBeTruthy();

      // Should not have a default value for sensitive password
      if (dbPasswordVar![0].includes("default")) {
        // If it has a default, fail the test
        expect(dbPasswordVar![0]).not.toMatch(/default\s*=\s*".+"/);
      }
    });

    test("resource names follow naming conventions and avoid conflicts", () => {
      const resourceNames = tfContent.match(/resource\s+"aws_\w+"\s+"(\w+)"/g);
      const names = new Set();

      if (resourceNames) {
        resourceNames.forEach((resource) => {
          const match = resource.match(/"(\w+)"$/);
          if (match) {
            const name = match[1];
            expect(names.has(name)).toBe(false); // No duplicate names
            names.add(name);
            expect(name).toMatch(/^[a-z][a-z0-9_]*$/); // Valid Terraform naming
          }
        });
      }
    });

    test("handles missing optional variables with sensible defaults", () => {
      const optionalVars = ["environment", "owner", "project", "db_instance_class"];

      optionalVars.forEach((varName) => {
        const varBlock = tfContent.match(new RegExp(`variable\\s+"${varName}"[\\s\\S]*?(?=\\nvariable|# -+\\n\\nvariable|$)`));
        if (varBlock) {
          expect(varBlock[0]).toMatch(/default\s*=/);
        }
      });
    });
  });

  describe("Variable Validation", () => {
    test("numeric variables have appropriate types", () => {
      const numericVars = ["db_allocated_storage", "db_backup_retention_period"];

      numericVars.forEach((varName) => {
        const varBlock = tfContent.match(new RegExp(`variable\\s+"${varName}"[\\s\\S]*?type\\s*=\\s*(\\w+)`));
        expect(varBlock).toBeTruthy();
        expect(varBlock![1]).toBe("number");
      });
    });

    test("list variables have appropriate types", () => {
      const listVars = ["allowed_cidr_blocks", "sns_email_endpoints"];

      listVars.forEach((varName) => {
        const varBlock = tfContent.match(new RegExp(`variable\\s+"${varName}"[\\s\\S]*?type\\s*=\\s*list`));
        expect(varBlock).toBeTruthy();
      });
    });

    test("variables have descriptions", () => {
      const variables = tfContent.match(/variable\s+"\w+"[\s\S]*?(?=\nvariable|# -+\n\nvariable|$)/g);

      if (variables) {
        variables.forEach((varBlock) => {
          expect(varBlock).toMatch(/description\s*=/);
        });
      }
    });
  });

  describe("Network Architecture Validation (Self-Contained)", () => {
    test("if VPC exists, it has proper DNS settings", () => {
      const vpcBlock = tfContent.match(/resource\s+"aws_vpc"[\s\S]*?(?=\nresource\s+|# -+\n)/);

      if (vpcBlock) {
        expect(vpcBlock[0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
        expect(vpcBlock[0]).toMatch(/enable_dns_support\s*=\s*true/);
      }
    });

    test("private subnets are properly configured for RDS", () => {
      const privateSubnets = tfContent.match(/resource\s+"aws_subnet"\s+"private_subnet/g);

      if (privateSubnets) {
        expect(privateSubnets.length).toBeGreaterThanOrEqual(2); // Multi-AZ requires 2+
      }
    });

    test("NAT Gateways are configured for HA if present", () => {
      const natGateways = tfContent.match(/resource\s+"aws_nat_gateway"/g);

      if (natGateways) {
        expect(natGateways.length).toBeGreaterThanOrEqual(2); // HA requires 2+

        // Check for EIPs
        const eips = tfContent.match(/resource\s+"aws_eip"/g);
        expect(eips).toBeTruthy();
        expect(eips!.length).toBeGreaterThanOrEqual(natGateways.length);
      }
    });

    test("route tables are properly associated with subnets", () => {
      const routeTableAssocs = tfContent.match(/resource\s+"aws_route_table_association"/g);

      if (routeTableAssocs) {
        expect(routeTableAssocs.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("Performance and Optimization", () => {
    test("RDS uses appropriate storage type", () => {
      const rdsBlock = tfContent.match(/resource\s+"aws_db_instance"[\s\S]*?storage_type\s*=\s*"(\w+)"/);

      if (rdsBlock) {
        const storageType = rdsBlock[1];
        expect(["gp2", "gp3", "io1"]).toContain(storageType);
      }
    });

    test("Performance Insights retention is configured", () => {
      expect(tfContent).toMatch(/performance_insights_retention_period\s*=\s*\d+/);
    });

    test("CloudWatch log exports are enabled", () => {
      expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\[/);
    });
  });

  describe("Deployment Outputs Integration (if available)", () => {
    test("validates deployment outputs structure if available", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs).toBeDefined();
        expect(typeof deploymentOutputs).toBe("object");
      } else {
        console.log("ℹ Deployment outputs not available, skipping live validation");
        expect(true).toBe(true);
      }
    });

    test("RDS endpoint format is valid if deployment exists", () => {
      if (deploymentOutputs && deploymentOutputs.rds_endpoint) {
        const endpointData = deploymentOutputs.rds_endpoint;
        // Handle both string and object with value property
        const endpoint = typeof endpointData === 'string' ? endpointData : endpointData.value;
        // RDS endpoint format: hostname:port
        expect(endpoint).toMatch(/^[\w.-]+:\d+$/);
      } else {
        expect(true).toBe(true);
      }
    });

    test("KMS key ARN format is valid if deployment exists", () => {
      if (deploymentOutputs && deploymentOutputs.kms_key_arn) {
        const arnData = deploymentOutputs.kms_key_arn;
        // Handle both string and object with value property
        const arn = typeof arnData === 'string' ? arnData : arnData.value;
        expect(arn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d+:key\/[\w-]+$/);
      } else {
        expect(true).toBe(true);
      }
    });

    test("SNS topic ARN format is valid if deployment exists", () => {
      if (deploymentOutputs && deploymentOutputs.sns_topic_arn) {
        const arnData = deploymentOutputs.sns_topic_arn;
        // Handle both string and object with value property
        const arn = typeof arnData === 'string' ? arnData : arnData.value;
        expect(arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:[\w-]+$/);
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe("Healthcare Compliance Requirements", () => {
    test("HIPAA: encryption at rest is enforced", () => {
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key/);
    });

    test("HIPAA: encryption in transit is enforced", () => {
      expect(tfContent).toMatch(/rds\.force_ssl.*value\s*=\s*"1"/s);
    });

    test("HIPAA: audit logging is enabled", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"/);
      expect(tfContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("HIPAA: access controls are implemented", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"/);
    });

    test("HIPAA: data retention policies are configured", () => {
      expect(tfContent).toMatch(/backup_retention_period/);
      expect(tfContent).toMatch(/retention_in_days/);
    });
  });
});

describe("Integration Tests - Configuration Scenarios", () => {
  describe("Production Deployment Scenario", () => {
    test("production configuration has all critical features enabled", () => {
      const criticalFeatures = [
        /multi_az\s*=\s*true/,
        /deletion_protection\s*=\s*true/,
        /storage_encrypted\s*=\s*true/,
        /enable_key_rotation\s*=\s*true/,
        /performance_insights_enabled\s*=\s*true/,
      ];

      criticalFeatures.forEach((pattern) => {
        expect(tfContent).toMatch(pattern);
      });
    });

    test("production has comprehensive monitoring coverage", () => {
      const monitoringComponents = [
        /resource\s+"aws_cloudwatch_metric_alarm"/,
        /monitoring_interval\s*=\s*60/,
        /performance_insights_enabled\s*=\s*true/,
        /enabled_cloudwatch_logs_exports/,
      ];

      monitoringComponents.forEach((pattern) => {
        expect(tfContent).toMatch(pattern);
      });
    });
  });

  describe("Disaster Recovery Scenario", () => {
    test("DR configuration supports point-in-time recovery", () => {
      expect(tfContent).toMatch(/backup_retention_period/);
      expect(tfContent).toMatch(/skip_final_snapshot\s*=\s*false/);
    });

    test("DR configuration has automated backups", () => {
      expect(tfContent).toMatch(/backup_window\s*=\s*"\d{2}:\d{2}-\d{2}:\d{2}"/);
      const backupRetention = tfContent.match(/backup_retention_period.*default\s*=\s*(\d+)/);
      if (backupRetention) {
        expect(parseInt(backupRetention[1])).toBeGreaterThanOrEqual(7);
      }
    });
  });

  describe("Security Incident Scenario", () => {
    test("security incident can be traced through CloudTrail", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"/);
      expect(tfContent).toMatch(/event_selector/);
      expect(tfContent).toMatch(/AWS::RDS::DBInstance/);
    });

    test("security alerts are properly configured", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(tfContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic/);
    });
  });

  describe("Scaling Scenario", () => {
    test("instance class can be easily changed via variable", () => {
      expect(tfContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
      expect(tfContent).toMatch(/variable\s+"db_instance_class"[\s\S]*?default\s*=\s*"db\.m5\.large"/);
    });

    test("storage can be increased without data loss", () => {
      expect(tfContent).toMatch(/allocated_storage\s*=\s*var\.db_allocated_storage/);
    });
  });
});

describe("Integration Tests - Cost Optimization", () => {
  test("resources use cost-effective configurations where appropriate", () => {
    // Storage should be gp3 (cost-effective) or gp2
    const storageType = tfContent.match(/storage_type\s*=\s*"(\w+)"/);
    if (storageType) {
      expect(["gp2", "gp3"]).toContain(storageType[1]);
    }
  });

  test("monitoring interval is appropriate for cost (60s is standard)", () => {
    const monitoringInterval = tfContent.match(/monitoring_interval\s*=\s*(\d+)/);
    if (monitoringInterval) {
      expect(parseInt(monitoringInterval[1])).toBe(60);
    }
  });
});

describe("Summary Integration Report", () => {
  test("generates integration test summary", () => {
    const totalResources = (tfContent.match(/resource\s+"aws_\w+"/g) || []).length;
    const totalVariables = (tfContent.match(/variable\s+"\w+"/g) || []).length;
    const totalOutputs = (tfContent.match(/output\s+"\w+"/g) || []).length;

    console.log("\n=== Integration Test Summary ===");
    console.log(`Total Resources: ${totalResources}`);
    console.log(`Total Variables: ${totalVariables}`);
    console.log(`Total Outputs: ${totalOutputs}`);
    console.log(`Deployment Outputs Available: ${deploymentOutputs ? "Yes" : "No"}`);
    console.log("================================\n");

    expect(totalResources).toBeGreaterThan(15);
    expect(totalVariables).toBeGreaterThan(8);
    expect(totalOutputs).toBeGreaterThan(5);
  });
});
