// test/terraform.unit.test.ts
// Unit tests for ElastiCache Redis Infrastructure
// Static code analysis - validates configuration before deployment
// NO Terraform commands - just reads main.tf file as text
// Coverage requirement: 90%+ (MANDATORY - Claude QA enforced)

import fs from "fs";
import path from "path";

const TERRAFORM_FILE = path.resolve(__dirname, "../lib/main.tf");  // ← CHANGED THIS LINE
let tf: string;

beforeAll(() => {
  if (!fs.existsSync(TERRAFORM_FILE)) {
    throw new Error(`Terraform file not found at: ${TERRAFORM_FILE}`);
  }
  tf = fs.readFileSync(TERRAFORM_FILE, "utf8");
});


// Helper functions
function has(rx: RegExp): boolean {
  return rx.test(tf);
}

function count(rx: RegExp): number {
  return (tf.match(rx) || []).length;
}

describe("ElastiCache Redis Infrastructure - Unit Tests", () => {
  
  // ========================================================================
  // TEST GROUP 1: FILE STRUCTURE (5 tests)
  // ========================================================================
  describe("File Structure", () => {
    test("main.tf exists and is non-trivial", () => {
      expect(tf).toBeDefined();
      expect(tf.length).toBeGreaterThan(3000);
      expect(tf).toMatch(/resource|output|data/);
    });

    test("has clear section headers with comments", () => {
      expect(count(/# ={50,}/g)).toBeGreaterThanOrEqual(5);
      expect(has(/# Data Sources/)).toBe(true);
      expect(has(/# Variables/)).toBe(true);
      expect(has(/# Locals/)).toBe(true);
    });

    test("sections in logical order", () => {
      const dataIndex = tf.indexOf('# Data Sources');
      const variableIndex = tf.indexOf('# Variables');
      const localsIndex = tf.indexOf('# Locals');
      const resourceIndex = tf.indexOf('# Random String');
      const outputIndex = tf.indexOf('# Outputs');
      
      expect(dataIndex).toBeLessThan(variableIndex);
      expect(variableIndex).toBeLessThan(localsIndex);
      expect(localsIndex).toBeLessThan(resourceIndex);
      expect(resourceIndex).toBeLessThan(outputIndex);
    });

    test("consistent indentation throughout", () => {
      const lines = tf.split('\n');
      const indentedLines = lines.filter(line => /^  [a-z]/.test(line));
      expect(indentedLines.length).toBeGreaterThan(50);
    });

    test("no extremely long lines", () => {
      const lines = tf.split('\n');
      const longLines = lines.filter(line => line.length > 120);
      expect(longLines.length).toBeLessThan(5);
    });
  });

  // ========================================================================
  // TEST GROUP 2: DATA SOURCES (6 tests)
  // ========================================================================
  describe("Data Sources", () => {
    test("uses aws_caller_identity for account ID", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });

    test("uses aws_region data source", () => {
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });

    test("uses availability zones data source", () => {
      expect(has(/data\s+"aws_availability_zones"\s+"available"/)).toBe(true);
      expect(has(/state\s*=\s*"available"/)).toBe(true);
    });

    test("creates VPC resource for Redis", () => {
      expect(has(/resource\s+"aws_vpc"\s+"redis"/)).toBe(true);
      expect(has(/cidr_block\s*=\s*var\.vpc_cidr/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    });

    test("no hardcoded account IDs", () => {
      const accountIdMatches = tf.match(/\d{12}/g);
      expect(accountIdMatches).toBeNull();
    });

    test("creates subnet resources in multiple AZs", () => {
      expect(has(/resource\s+"aws_subnet"\s+"redis"/)).toBe(true);
      expect(has(/count\s*=\s*3/)).toBe(true);
      expect(has(/availability_zone\s*=\s*local\.azs\[count\.index\]/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 3: VARIABLES (10 tests)
  // ========================================================================
  describe("Variable Definitions", () => {
    test("has environment variable", () => {
      expect(has(/variable\s+"environment"/)).toBe(true);
      expect(has(/default\s*=\s*"dev"/)).toBe(true);
    });

    test("has project_name variable", () => {
      expect(has(/variable\s+"project_name"/)).toBe(true);
    });

    test("has owner variable for tagging", () => {
      expect(has(/variable\s+"owner"/)).toBe(true);
    });

    test("has vpc_cidr variable", () => {
      expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
      expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    });

    test("has internal_cidr_block variable", () => {
      expect(has(/variable\s+"internal_cidr_block"/)).toBe(true);
      expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    });

    test("has redis_engine_version variable", () => {
      expect(has(/variable\s+"redis_engine_version"/)).toBe(true);
      expect(has(/default\s*=\s*"7\.0"/)).toBe(true);
    });

    test("has node_type variable with t3.micro", () => {
      expect(has(/variable\s+"node_type"/)).toBe(true);
      expect(has(/default\s*=\s*"cache\.t3\.micro"/)).toBe(true);
    });

    test("has num_cache_clusters variable set to 3", () => {
      expect(has(/variable\s+"num_cache_clusters"/)).toBe(true);
      expect(has(/default\s*=\s*3/)).toBe(true);
    });

    test("has backup_retention_days set to 7", () => {
      expect(has(/variable\s+"backup_retention_days"/)).toBe(true);
      expect(has(/default\s*=\s*7/)).toBe(true);
    });

    test("all variables have descriptions and types", () => {
      const variables = tf.match(/variable\s+"[^"]+"/g) || [];
      const descriptions = tf.match(/description\s*=/g) || [];
      const types = tf.match(/type\s*=/g) || [];
      expect(descriptions.length).toBeGreaterThanOrEqual(variables.length);
      expect(types.length).toBeGreaterThanOrEqual(variables.length);
    });
  });

  // ========================================================================
  // TEST GROUP 4: LOCALS (6 tests)
  // ========================================================================
  describe("Locals Configuration", () => {
    test("has locals block", () => {
      expect(has(/locals\s*\{/)).toBe(true);
    });

    test("defines common_tags with required fields", () => {
      expect(has(/common_tags\s*=\s*\{/)).toBe(true);
      expect(has(/Environment\s*=\s*var\.environment/)).toBe(true);
      expect(has(/Project\s*=\s*var\.project_name/)).toBe(true);
      expect(has(/Owner\s*=\s*var\.owner/)).toBe(true);
      expect(has(/ManagedBy\s*=\s*"terraform"/)).toBe(true);
    });

    test("defines cluster_name with random suffix", () => {
      expect(has(/cluster_name\s*=/)).toBe(true);
      expect(has(/random_string\.suffix\.result/)).toBe(true);
    });

    test("maintenance window set to Sunday 3-4 AM UTC", () => {
      expect(has(/maintenance_window\s*=\s*"sun:03:00-sun:04:00"/)).toBe(true);
    });

    test("backup window set to 2-3 AM UTC", () => {
      expect(has(/backup_window\s*=\s*"02:00-03:00"/)).toBe(true);
    });

    test("uses timestamp() in locals not provider tags", () => {
      const providerBlock = tf.match(/provider\s+"aws"[\s\S]*?\n\}/);
      if (providerBlock) {
        expect(providerBlock[0]).not.toMatch(/timestamp\(\)/);
      }
    });
  });

  // ========================================================================
  // TEST GROUP 5: RANDOM SUFFIX (5 tests)
  // ========================================================================
  describe("Random Suffix for Unique Naming", () => {
    test("creates random_string resource", () => {
      expect(has(/resource\s+"random_string"\s+"suffix"/)).toBe(true);
    });

    test("random_string has length of 8", () => {
      expect(has(/length\s*=\s*8/)).toBe(true);
    });

    test("random_string disables special characters", () => {
      expect(has(/special\s*=\s*false/)).toBe(true);
    });

    test("random_string disables uppercase", () => {
      expect(has(/upper\s*=\s*false/)).toBe(true);
    });

    test("random_string allows numeric", () => {
      expect(has(/numeric\s*=\s*true/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 6: SECURITY GROUP (8 tests)
  // ========================================================================
  describe("Security Group Configuration", () => {
    test("creates security group for Redis", () => {
      expect(has(/resource\s+"aws_security_group"\s+"redis"/)).toBe(true);
    });

    test("security group uses VPC ID", () => {
      expect(has(/vpc_id\s*=\s*aws_vpc\.redis\.id/)).toBe(true);
    });

    test("allows inbound traffic on port 6379", () => {
      expect(has(/from_port\s*=\s*6379/)).toBe(true);
      expect(has(/to_port\s*=\s*6379/)).toBe(true);
    });

    test("restricts access to internal CIDR block only", () => {
      expect(has(/cidr_blocks\s*=\s*\[var\.internal_cidr_block\]/)).toBe(true);
    });

    test("uses TCP protocol for Redis", () => {
      expect(has(/protocol\s*=\s*"tcp"/)).toBe(true);
    });

    test("allows all outbound traffic", () => {
      expect(has(/egress\s*\{/)).toBe(true);
      expect(has(/protocol\s*=\s*"-1"/)).toBe(true);
    });

    test("security group has proper tags", () => {
      const sgBlock = tf.match(/resource\s+"aws_security_group"[\s\S]*?\n\}/);
      if (sgBlock) {
        expect(sgBlock[0]).toMatch(/tags\s*=\s*merge/);
      }
    });

    test("security group name uses cluster name", () => {
      expect(has(/name\s*=\s*"\$\{local\.cluster_name\}-sg"/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 7: ELASTICACHE SUBNET GROUP (5 tests)
  // ========================================================================
  describe("ElastiCache Subnet Group", () => {
    test("creates subnet group resource", () => {
      expect(has(/resource\s+"aws_elasticache_subnet_group"\s+"redis"/)).toBe(true);
    });

    test("subnet group uses created subnets", () => {
      expect(has(/subnet_ids\s*=\s*aws_subnet\.redis\[\*\]\.id/)).toBe(true);
    });

    test("subnet group name uses cluster name", () => {
      expect(has(/name\s*=\s*"\$\{local\.cluster_name\}-subnet-group"/)).toBe(true);
    });

    test("subnet group has description", () => {
      expect(has(/description\s*=\s*".*multiple AZs"/)).toBe(true);
    });

    test("subnet group has proper tags", () => {
      const subnetBlock = tf.match(/resource\s+"aws_elasticache_subnet_group"[\s\S]*?\n\}/);
      if (subnetBlock) {
        expect(subnetBlock[0]).toMatch(/tags\s*=\s*merge/);
      }
    });
  });

  // ========================================================================
  // TEST GROUP 8: PARAMETER GROUP (6 tests)
  // ========================================================================
  describe("ElastiCache Parameter Group", () => {
    test("creates parameter group resource", () => {
      expect(has(/resource\s+"aws_elasticache_parameter_group"\s+"redis"/)).toBe(true);
    });

    test("uses Redis 7 family", () => {
      expect(has(/family\s*=\s*"redis7"/)).toBe(true);
    });

    test("sets timeout parameter to 300", () => {
      expect(has(/name\s*=\s*"timeout"/)).toBe(true);
      expect(has(/value\s*=\s*"300"/)).toBe(true);
    });

    test("enables TCP keepalive", () => {
      expect(has(/name\s*=\s*"tcp-keepalive"/)).toBe(true);
      expect(has(/value\s*=\s*"60"/)).toBe(true);
    });

    test("parameter group name uses cluster name", () => {
      expect(has(/name\s*=\s*"\$\{local\.cluster_name\}-params"/)).toBe(true);
    });

    test("parameter group has proper tags", () => {
      const paramBlock = tf.match(/resource\s+"aws_elasticache_parameter_group"[\s\S]*?\n\}/);
      if (paramBlock) {
        expect(paramBlock[0]).toMatch(/tags\s*=\s*merge/);
      }
    });
  });

  // ========================================================================
  // TEST GROUP 9: ELASTICACHE REPLICATION GROUP (20 tests)
  // ========================================================================
  describe("ElastiCache Replication Group", () => {
    test("creates replication group resource", () => {
      expect(has(/resource\s+"aws_elasticache_replication_group"\s+"redis"/)).toBe(true);
    });

    test("uses Redis engine", () => {
      expect(has(/engine\s*=\s*"redis"/)).toBe(true);
    });

    test("uses Redis version 7.0 or higher", () => {
      expect(has(/engine_version\s*=\s*var\.redis_engine_version/)).toBe(true);
    });

    test("uses cache.t3.micro node type", () => {
      expect(has(/node_type\s*=\s*var\.node_type/)).toBe(true);
    });

    test("configures 3 cache clusters", () => {
      expect(has(/num_cache_clusters\s*=\s*var\.num_cache_clusters/)).toBe(true);
    });

    test("enables automatic failover", () => {
      expect(has(/automatic_failover_enabled\s*=\s*true/)).toBe(true);
    });

    test("enables Multi-AZ deployment", () => {
      expect(has(/multi_az_enabled\s*=\s*true/)).toBe(true);
    });

    test("uses port 6379", () => {
      expect(has(/port\s*=\s*6379/)).toBe(true);
    });

    test("references parameter group", () => {
      expect(has(/parameter_group_name\s*=\s*aws_elasticache_parameter_group\.redis\.name/)).toBe(true);
    });

    test("references subnet group", () => {
      expect(has(/subnet_group_name\s*=\s*aws_elasticache_subnet_group\.redis\.name/)).toBe(true);
    });

    test("references security group", () => {
      expect(has(/security_group_ids\s*=\s*\[aws_security_group\.redis\.id\]/)).toBe(true);
    });

    test("enables at-rest encryption", () => {
      expect(has(/at_rest_encryption_enabled\s*=\s*true/)).toBe(true);
    });

    test("enables transit encryption (TLS)", () => {
      expect(has(/transit_encryption_enabled\s*=\s*true/)).toBe(true);
    });

    test("configures 7-day backup retention", () => {
      expect(has(/snapshot_retention_limit\s*=\s*var\.backup_retention_days/)).toBe(true);
    });

    test("sets backup window", () => {
      expect(has(/snapshot_window\s*=\s*local\.backup_window/)).toBe(true);
    });

    test("sets maintenance window", () => {
      expect(has(/maintenance_window\s*=\s*local\.maintenance_window/)).toBe(true);
    });

    test("enables auto minor version upgrade", () => {
      expect(has(/auto_minor_version_upgrade\s*=\s*true/)).toBe(true);
    });

    test("configures CloudWatch log delivery", () => {
      expect(has(/log_delivery_configuration\s*\{/)).toBe(true);
      expect(count(/log_type\s*=\s*"(slow-log|engine-log)"/g)).toBe(2);
    });

    test("uses final_snapshot_identifier not snapshot_name", () => {
      expect(has(/final_snapshot_identifier/)).toBe(true);
      expect(has(/^\s*snapshot_name\s*=/m)).toBe(false);
    });

    test("has proper dependencies", () => {
      expect(has(/depends_on\s*=\s*\[/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 10: CLOUDWATCH LOG GROUPS (6 tests)
  // ========================================================================
  describe("CloudWatch Log Groups", () => {
    test("creates slow-log group", () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"redis_slow_log"/)).toBe(true);
    });

    test("creates engine-log group", () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"redis_engine_log"/)).toBe(true);
    });

    test("sets 7-day retention for logs", () => {
      expect(count(/retention_in_days\s*=\s*7/g)).toBeGreaterThanOrEqual(2);
    });

    test("log group names use cluster name", () => {
      expect(has(/name\s*=\s*"\/aws\/elasticache\/\$\{local\.cluster_name\}\/slow-log"/)).toBe(true);
      expect(has(/name\s*=\s*"\/aws\/elasticache\/\$\{local\.cluster_name\}\/engine-log"/)).toBe(true);
    });

    test("log groups have proper tags", () => {
      expect(count(/LogType\s*=\s*"redis-(slow|engine)-log"/g)).toBe(2);
    });

    test("log groups use common tags", () => {
      const logBlocks = tf.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?\n\}/g) || [];
      logBlocks.forEach(block => {
        expect(block).toMatch(/tags\s*=\s*merge/);
      });
    });
  });

  // ========================================================================
  // TEST GROUP 11: CLOUDWATCH ALARMS (8 tests)
  // ========================================================================
  describe("CloudWatch Alarms", () => {
    test("creates CPU utilization alarm", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_utilization"/)).toBe(true);
    });

    test("CPU alarm threshold set to 75%", () => {
      const cpuBlock = tf.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_utilization"[\s\S]*?\n\}/);
      if (cpuBlock) {
        expect(cpuBlock[0]).toMatch(/threshold\s*=\s*"75"/);
      }
    });

    test("creates memory utilization alarm", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"memory_utilization"/)).toBe(true);
    });

    test("memory alarm threshold set to 85%", () => {
      const memBlock = tf.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"memory_utilization"[\s\S]*?\n\}/);
      if (memBlock) {
        expect(memBlock[0]).toMatch(/threshold\s*=\s*"85"/);
      }
    });

    test("alarms use correct namespace", () => {
      expect(count(/namespace\s*=\s*"AWS\/ElastiCache"/g)).toBeGreaterThanOrEqual(2);
    });

    test("alarms have 5-minute period", () => {
      expect(count(/period\s*=\s*"300"/g)).toBeGreaterThanOrEqual(2);
    });

    test("alarms use proper evaluation periods", () => {
      expect(count(/evaluation_periods\s*=\s*"2"/g)).toBeGreaterThanOrEqual(2);
    });

    test("alarms reference replication group ID", () => {
      expect(count(/CacheClusterId\s*=\s*aws_elasticache_replication_group\.redis\.id/g)).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // TEST GROUP 12: OUTPUTS (12 tests)
  // ========================================================================
  describe("Output Definitions", () => {
    test("outputs primary endpoint address", () => {
      expect(has(/output\s+"redis_primary_endpoint_address"/)).toBe(true);
      expect(has(/aws_elasticache_replication_group\.redis\.primary_endpoint_address/)).toBe(true);
    });

    test("outputs reader endpoint address", () => {
      expect(has(/output\s+"redis_reader_endpoint_address"/)).toBe(true);
      expect(has(/aws_elasticache_replication_group\.redis\.reader_endpoint_address/)).toBe(true);
    });

    test("outputs configuration endpoint", () => {
      expect(has(/output\s+"redis_configuration_endpoint"/)).toBe(true);
    });

    test("outputs security group ID", () => {
      expect(has(/output\s+"redis_security_group_id"/)).toBe(true);
      expect(has(/aws_security_group\.redis\.id/)).toBe(true);
    });

    test("outputs replication group ID", () => {
      expect(has(/output\s+"redis_replication_group_id"/)).toBe(true);
    });

    test("outputs parameter group name", () => {
      expect(has(/output\s+"redis_parameter_group_name"/)).toBe(true);
    });

    test("outputs subnet group name", () => {
      expect(has(/output\s+"redis_subnet_group_name"/)).toBe(true);
    });

    test("outputs cluster name", () => {
      expect(has(/output\s+"redis_cluster_name"/)).toBe(true);
      expect(has(/value\s*=\s*local\.cluster_name/)).toBe(true);
    });

    test("outputs AWS account ID", () => {
      expect(has(/output\s+"aws_account_id"/)).toBe(true);
    });

    test("outputs AWS region", () => {
      expect(has(/output\s+"aws_region"/)).toBe(true);
    });

    test("all outputs have descriptions", () => {
      const outputs = tf.match(/output\s+"[^"]+"/g) || [];
      const outputDescriptions = tf.match(/output\s+"[^"]+"[\s\S]*?description\s*=/g) || [];
      expect(outputDescriptions.length).toBe(outputs.length);
    });

    test("no hardcoded values in outputs", () => {
      const outputBlocks = tf.match(/output\s+"[^"]+"[\s\S]*?\n\}/g) || [];
      outputBlocks.forEach(block => {
        const valueMatch = block.match(/value\s*=\s*"([^"]+)"/);
        if (valueMatch) {
          expect(valueMatch[1]).not.toMatch(/^[a-z0-9-]+$/);
        }
      });
    });
  });

  // ========================================================================
  // TEST GROUP 13: SECURITY BEST PRACTICES (8 tests)
  // ========================================================================
  describe("Security Best Practices", () => {
    test("no public access allowed", () => {
      expect(has(/0\.0\.0\.0\/0.*ingress/)).toBe(false);
      expect(has(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\].*from_port\s*=\s*6379/)).toBe(false);
    });

    test("encryption enabled for data at rest", () => {
      expect(has(/at_rest_encryption_enabled\s*=\s*true/)).toBe(true);
    });

    test("encryption enabled for data in transit", () => {
      expect(has(/transit_encryption_enabled\s*=\s*true/)).toBe(true);
    });

    test("no hardcoded passwords or secrets", () => {
      expect(has(/password|secret|key|token/i)).toBe(false);
    });

    test("uses IAM authentication where applicable", () => {
      expect(has(/auth_token_enabled\s*=\s*false/)).toBe(false);
    });

    test("backup retention configured", () => {
      expect(has(/snapshot_retention_limit\s*=\s*var\.backup_retention_days/)).toBe(true);
    });

    test("log delivery configured for audit", () => {
      expect(has(/log_delivery_configuration/)).toBe(true);
    });

    test("no deprecated security configurations", () => {
      expect(has(/acl|ACL/)).toBe(false);
    });
  });

// ========================================================================
// TEST GROUP 14: RESOURCE NAMING (6 tests)
// ========================================================================
describe("Resource Naming Conventions", () => {
  test("all resources use random suffix", () => {
    expect(count(/\$\{random_string\.suffix\.result\}/g)).toBeGreaterThanOrEqual(1);
  });

  test("no hardcoded resource names", () => {
    const resourceNames = tf.match(/name\s*=\s*"[^$\n]+"/g) || [];
    resourceNames.forEach(name => {
      if (!name.includes('${')) {
        // Allow parameter names, filter names, and AWS metric names
        expect(name).toMatch(/name\s*=\s*"(timeout|tcp-keepalive|vpc-id|availability-zone|CPUUtilization|DatabaseMemoryUsagePercentage|redis7)"/);
      }
    });
  });

  test("consistent naming pattern", () => {
    expect(has(/\$\{local\.cluster_name\}/)).toBe(true);
  });

  test("names include environment", () => {
    expect(has(/\$\{var\.environment\}/)).toBe(true);
  });

  test("names include project", () => {
    expect(has(/\$\{var\.project_name\}/)).toBe(true);
  });

  test("no uppercase in resource names", () => {
    const nameDefinitions = tf.match(/name\s*=\s*"[^"]+"/g) || [];
    nameDefinitions.forEach(name => {
      const nameValue = name.match(/"([^"]+)"/)?.[1];
      // Skip AWS-defined names (metric names, families, etc.)
      const awsDefinedNames = ['CPUUtilization', 'DatabaseMemoryUsagePercentage', 'redis7', 'timeout', 'tcp-keepalive', 'vpc-id', 'availability-zone'];
      if (nameValue && !nameValue.includes('${') && !awsDefinedNames.includes(nameValue)) {
        expect(nameValue).toBe(nameValue.toLowerCase());
      }
    });
  });
});


  // ========================================================================
  // TEST GROUP 15: TAGGING (6 tests)
  // ========================================================================
  describe("Resource Tagging", () => {
    test("all resources have tags", () => {
      const resourceCount = count(/resource\s+"aws_/g);
      const tagCount = count(/tags\s*=/g);
      expect(tagCount).toBeGreaterThanOrEqual(resourceCount - 1);
    });

    test("uses merge() for tag combination", () => {
      expect(count(/merge\s*\(/g)).toBeGreaterThan(5);
    });

    test("Environment tag present", () => {
      expect(has(/Environment\s*=\s*var\.environment/)).toBe(true);
    });

    test("Project tag present", () => {
      expect(has(/Project\s*=\s*var\.project_name/)).toBe(true);
    });

    test("Owner tag present", () => {
      expect(has(/Owner\s*=\s*var\.owner/)).toBe(true);
    });

    test("ManagedBy tag set to terraform", () => {
      expect(has(/ManagedBy\s*=\s*"terraform"/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 16: HIGH AVAILABILITY (8 tests)
  // ========================================================================
  describe("High Availability Configuration", () => {
    test("Multi-AZ enabled", () => {
      expect(has(/multi_az_enabled\s*=\s*true/)).toBe(true);
    });

    test("automatic failover enabled", () => {
      expect(has(/automatic_failover_enabled\s*=\s*true/)).toBe(true);
    });

    test("spans multiple availability zones", () => {
      expect(has(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*3\)/)).toBe(true);
      expect(has(/availability_zone\s*=\s*local\.azs\[count\.index\]/)).toBe(true);
    });

    test("has 3 nodes minimum", () => {
      expect(has(/num_cache_clusters\s*=\s*var\.num_cache_clusters/)).toBe(true);
      expect(has(/default\s*=\s*3/)).toBe(true);
    });

    test("backup configured for disaster recovery", () => {
      expect(has(/snapshot_retention_limit/)).toBe(true);
      expect(has(/snapshot_window/)).toBe(true);
    });

    test("maintenance window defined", () => {
      expect(has(/maintenance_window\s*=\s*local\.maintenance_window/)).toBe(true);
    });

    test("auto minor version upgrade enabled", () => {
      expect(has(/auto_minor_version_upgrade\s*=\s*true/)).toBe(true);
    });

    test("final snapshot on deletion", () => {
      expect(has(/final_snapshot_identifier/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 17: COMPLIANCE (5 tests)
  // ========================================================================
  describe("Compliance Requirements", () => {
    test("uses data source for current region", () => {
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });

    test("uses specified VPC", () => {
      expect(has(/vpc_id/)).toBe(true);
    });

    test("restricts to internal CIDR only", () => {
      expect(has(/10\.0\.0\.0\/16/)).toBe(true);
    });

    test("Sunday maintenance window configured", () => {
      expect(has(/sun:03:00-sun:04:00/)).toBe(true);
    });

    test("Redis 7.0 or higher", () => {
      expect(has(/redis7/)).toBe(true);
      expect(has(/default\s*=\s*"7\.0"/)).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 18: TERRAFORM BEST PRACTICES (6 tests)
  // ========================================================================
  describe("Terraform Best Practices", () => {
    test("uses data sources for dynamic values", () => {
      expect(count(/data\s+"/g)).toBeGreaterThanOrEqual(3);
    });

    test("uses locals for reusable values", () => {
      expect(has(/locals\s*\{/)).toBe(true);
      expect(count(/local\./g)).toBeGreaterThan(10);
    });

    test("uses variables for configuration", () => {
      expect(count(/variable\s+"/g)).toBeGreaterThanOrEqual(9);
      expect(count(/var\./g)).toBeGreaterThan(10);
    });

    test("explicit dependencies where needed", () => {
      expect(has(/depends_on/)).toBe(true);
    });

    test("no circular dependencies", () => {
      const replicationGroup = tf.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?\n\}/)?.[0];
      if (replicationGroup) {
        expect(replicationGroup).not.toMatch(/aws_elasticache_replication_group\.redis/);
      }
    });

    test("apply_immediately set for development", () => {
      expect(has(/apply_immediately\s*=\s*true/)).toBe(true);
    });
  });
});
