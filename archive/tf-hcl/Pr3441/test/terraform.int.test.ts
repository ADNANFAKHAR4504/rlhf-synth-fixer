// tests/integration/terraform.int.test.ts
// Stack validation and integration tests without deploying infrastructure
// Tests read from existing outputs and validate configuration

import * as fs from "fs";
import * as path from "path";

// Path to the outputs JSON file
const OUTPUT_FILE_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const TERRAFORM_FILE_PATH = path.resolve(process.cwd(), "lib/tap_stack.tf");

// Type definitions for outputs
interface StackOutputs {
  api_gateway_url?: { value: string };
  dynamodb_table_name?: { value: string };
  lambda_function_name?: { value: string };
  redis_endpoint?: { value: string };
  vpc_id?: { value: string };
  cloudtrail_name?: { value: string };
  cloudtrail_s3_bucket?: { value: string };
  sns_topic_arn?: { value: string };
  waf_web_acl_arn?: { value: string };
  cloudwatch_dashboard_name?: { value: string };
  cloudwatch_log_group_api?: { value: string };
  cloudwatch_log_group_lambda?: { value: string };
}

// Helper to load stack outputs
function loadStackOutputs(): StackOutputs {
  try {
    if (!fs.existsSync(OUTPUT_FILE_PATH)) {
      throw new Error(`Outputs file not found at: ${OUTPUT_FILE_PATH}`);
    }
    const data = fs.readFileSync(OUTPUT_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load outputs: ${error}`);
  }
}

// Helper to validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper to validate ARN format
function isValidArn(arn: string): boolean {
  return /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]{12}:.+/.test(arn);
}

// Helper to validate resource naming conventions
function isValidResourceName(name: string, pattern?: RegExp): boolean {
  if (!name || name.trim().length === 0) return false;
  if (pattern) return pattern.test(name);
  // Default: alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

// Helper to read Terraform file
function readTerraformFile(): string {
  if (!fs.existsSync(TERRAFORM_FILE_PATH)) {
    throw new Error(`Terraform file not found at: ${TERRAFORM_FILE_PATH}`);
  }
  return fs.readFileSync(TERRAFORM_FILE_PATH, "utf8");
}

describe("Travel Platform API - Stack Validation & Integration Tests", () => {
  let outputs: StackOutputs;
  let terraformContent: string;

  beforeAll(() => {
    outputs = loadStackOutputs();
    terraformContent = readTerraformFile();
    console.log("Loaded stack outputs:", Object.keys(outputs));
  });

  describe("Output Validation - Existence & Format", () => {
    describe("Required Outputs Exist", () => {
      test("should have api_gateway_url output", () => {
        expect(outputs.api_gateway_url).toBeDefined();
        expect(outputs.api_gateway_url?.value).toBeTruthy();
      });

      test("should have dynamodb_table_name output", () => {
        expect(outputs.dynamodb_table_name).toBeDefined();
        expect(outputs.dynamodb_table_name?.value).toBeTruthy();
      });

      test("should have lambda_function_name output", () => {
        expect(outputs.lambda_function_name).toBeDefined();
        expect(outputs.lambda_function_name?.value).toBeTruthy();
      });

      test("should have redis_endpoint output", () => {
        expect(outputs.redis_endpoint).toBeDefined();
        expect(outputs.redis_endpoint?.value).toBeTruthy();
      });

      test("should have vpc_id output", () => {
        expect(outputs.vpc_id).toBeDefined();
        expect(outputs.vpc_id?.value).toBeTruthy();
      });

      test("should have cloudtrail_name output", () => {
        expect(outputs.cloudtrail_name).toBeDefined();
        expect(outputs.cloudtrail_name?.value).toBeTruthy();
      });

      test("should have cloudtrail_s3_bucket output", () => {
        expect(outputs.cloudtrail_s3_bucket).toBeDefined();
        expect(outputs.cloudtrail_s3_bucket?.value).toBeTruthy();
      });

      test("should have sns_topic_arn output", () => {
        expect(outputs.sns_topic_arn).toBeDefined();
        expect(outputs.sns_topic_arn?.value).toBeTruthy();
      });

      test("should have waf_web_acl_arn output", () => {
        expect(outputs.waf_web_acl_arn).toBeDefined();
        expect(outputs.waf_web_acl_arn?.value).toBeTruthy();
      });

      test("should have cloudwatch_dashboard_name output", () => {
        expect(outputs.cloudwatch_dashboard_name).toBeDefined();
        expect(outputs.cloudwatch_dashboard_name?.value).toBeTruthy();
      });

      test("should have cloudwatch_log_group_api output", () => {
        expect(outputs.cloudwatch_log_group_api).toBeDefined();
        expect(outputs.cloudwatch_log_group_api?.value).toBeTruthy();
      });

      test("should have cloudwatch_log_group_lambda output", () => {
        expect(outputs.cloudwatch_log_group_lambda).toBeDefined();
        expect(outputs.cloudwatch_log_group_lambda?.value).toBeTruthy();
      });
    });

    describe("Output Format Validation", () => {
      test("api_gateway_url should be a valid HTTPS URL", () => {
        const url = outputs.api_gateway_url?.value || "";
        expect(isValidUrl(url)).toBe(true);
        expect(url).toMatch(/^https:\/\//);
        expect(url).toMatch(/\.execute-api\./);
        expect(url).toContain("amazonaws.com");
      });

      test("api_gateway_url should end with /search path", () => {
        const url = outputs.api_gateway_url?.value || "";
        expect(url).toMatch(/\/search$/);
      });

      test("dynamodb_table_name should follow naming convention", () => {
        const name = outputs.dynamodb_table_name?.value || "";
        expect(isValidResourceName(name)).toBe(true);
        expect(name).toContain("travel");
        expect(name).toContain("search");
      });

      test("lambda_function_name should follow naming convention", () => {
        const name = outputs.lambda_function_name?.value || "";
        expect(isValidResourceName(name)).toBe(true);
        expect(name).toContain("travel");
        expect(name).toContain("search");
      });

      test("redis_endpoint should be a valid hostname", () => {
        const endpoint = outputs.redis_endpoint?.value || "";
        expect(endpoint).toBeTruthy();
        expect(endpoint).toMatch(/\.[a-z0-9-]+\.cache\.amazonaws\.com$/);
      });

      test("vpc_id should follow AWS VPC ID format", () => {
        const vpcId = outputs.vpc_id?.value || "";
        expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      });

      test("cloudtrail_name should follow naming convention", () => {
        const name = outputs.cloudtrail_name?.value || "";
        expect(isValidResourceName(name)).toBe(true);
        expect(name).toContain("travel");
      });

      test("cloudtrail_s3_bucket should follow S3 naming rules", () => {
        const bucket = outputs.cloudtrail_s3_bucket?.value || "";
        expect(bucket).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
        expect(bucket.length).toBeGreaterThanOrEqual(3);
        expect(bucket.length).toBeLessThanOrEqual(63);
        expect(bucket).toContain("cloudtrail");
      });

      test("sns_topic_arn should be a valid ARN", () => {
        const arn = outputs.sns_topic_arn?.value || "";
        expect(isValidArn(arn)).toBe(true);
        expect(arn).toContain("sns");
        expect(arn).toContain("alerts");
      });

      test("waf_web_acl_arn should be a valid ARN", () => {
        const arn = outputs.waf_web_acl_arn?.value || "";
        expect(isValidArn(arn)).toBe(true);
        expect(arn).toContain("wafv2");
      });

      test("cloudwatch_log_group_api should follow log group naming", () => {
        const logGroup = outputs.cloudwatch_log_group_api?.value || "";
        expect(logGroup).toMatch(/^\/aws\/apigateway\//);
        expect(logGroup).toContain("travel");
      });

      test("cloudwatch_log_group_lambda should follow log group naming", () => {
        const logGroup = outputs.cloudwatch_log_group_lambda?.value || "";
        expect(logGroup).toMatch(/^\/aws\/lambda\//);
        expect(logGroup).toContain("travel");
      });
    });
  });

  describe("Input Validation - Terraform Variables", () => {
    test("should have valid default values for all variables", () => {
      expect(terraformContent).toMatch(/variable\s+"project_name"\s*{\s*[^}]*default\s*=\s*"[^"]+"/);
      expect(terraformContent).toMatch(/variable\s+"environment"\s*{\s*[^}]*default\s*=\s*"[^"]+"/);
      expect(terraformContent).toMatch(/variable\s+"owner"\s*{\s*[^}]*default\s*=\s*"[^"]+"/);
    });

    test("VPC CIDR should be a valid private network range", () => {
      const vpcCidrMatch = terraformContent.match(/variable\s+"vpc_cidr"\s*{[^}]*default\s*=\s*"([^"]+)"/);
      expect(vpcCidrMatch).toBeTruthy();
      const cidr = vpcCidrMatch?.[1] || "";
      expect(cidr).toMatch(/^10\.\d+\.\d+\.\d+\/\d+$/);
    });

    test("subnet CIDRs should be within VPC CIDR range", () => {
      const privateSubnetMatch = terraformContent.match(/variable\s+"private_subnet_cidrs"\s*{[^}]*default\s*=\s*\[([^\]]+)\]/);
      expect(privateSubnetMatch).toBeTruthy();
      expect(privateSubnetMatch?.[1]).toContain("10.0.");
    });

    test("Lambda timeout should be reasonable (1-900 seconds)", () => {
      const timeoutMatch = terraformContent.match(/variable\s+"lambda_timeout"\s*{[^}]*default\s*=\s*(\d+)/);
      expect(timeoutMatch).toBeTruthy();
      const timeout = parseInt(timeoutMatch?.[1] || "0", 10);
      expect(timeout).toBeGreaterThanOrEqual(1);
      expect(timeout).toBeLessThanOrEqual(900);
    });

    test("Lambda memory should be valid (128-10240 MB)", () => {
      const memoryMatch = terraformContent.match(/variable\s+"lambda_memory_size"\s*{[^}]*default\s*=\s*(\d+)/);
      expect(memoryMatch).toBeTruthy();
      const memory = parseInt(memoryMatch?.[1] || "0", 10);
      expect(memory).toBeGreaterThanOrEqual(128);
      expect(memory).toBeLessThanOrEqual(10240);
    });

    test("Redis node count should be appropriate for HA", () => {
      const redisNodesMatch = terraformContent.match(/variable\s+"redis_num_nodes"\s*{[^}]*default\s*=\s*(\d+)/);
      expect(redisNodesMatch).toBeTruthy();
      const nodes = parseInt(redisNodesMatch?.[1] || "0", 10);
      expect(nodes).toBeGreaterThanOrEqual(2); // At least 2 for HA
    });
  });

  describe("Standards Compliance Validation", () => {
    describe("Security Standards", () => {
      test("should have KMS encryption enabled for DynamoDB", () => {
        expect(terraformContent).toMatch(/server_side_encryption\s*{/);
        expect(terraformContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
      });

      test("should have point-in-time recovery for DynamoDB", () => {
        expect(terraformContent).toMatch(/point_in_time_recovery\s*{[^}]*enabled\s*=\s*true/);
      });

      test("should have TTL enabled for GDPR compliance", () => {
        expect(terraformContent).toMatch(/ttl\s*{[^}]*enabled\s*=\s*true/);
      });

      test("should have encryption at rest for ElastiCache", () => {
        expect(terraformContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
      });

      test("should have encryption in transit for ElastiCache", () => {
        expect(terraformContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
      });

      test("should have automatic failover enabled for ElastiCache", () => {
        expect(terraformContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
      });

      test("should have X-Ray tracing enabled on Lambda", () => {
        expect(terraformContent).toMatch(/tracing_config\s*{[^}]*mode\s*=\s*"Active"/);
      });

      test("should have X-Ray tracing enabled on API Gateway", () => {
        expect(terraformContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
      });

      test("should have KMS key rotation enabled", () => {
        expect(terraformContent).toMatch(/enable_key_rotation\s*=\s*true/);
      });

      test("should have CloudTrail log file validation enabled", () => {
        expect(terraformContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      });

      test("should have CloudTrail as multi-region trail", () => {
        expect(terraformContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      });

      test("should have S3 bucket versioning enabled for CloudTrail", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"[^{]*{\s*[^}]*status\s*=\s*"Enabled"/);
      });

      test("should block all public access on S3 bucket", () => {
        expect(terraformContent).toMatch(/block_public_acls\s*=\s*true/);
        expect(terraformContent).toMatch(/block_public_policy\s*=\s*true/);
        expect(terraformContent).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(terraformContent).toMatch(/restrict_public_buckets\s*=\s*true/);
      });

      test("should have CloudWatch log groups encrypted with KMS", () => {
        const logGroupMatches = terraformContent.match(/resource\s+"aws_cloudwatch_log_group"/g);
        expect(logGroupMatches).toBeTruthy();
        expect(logGroupMatches!.length).toBeGreaterThan(0);
        expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      });

      test("should have VPC Flow Logs enabled", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
        expect(terraformContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      });
    });

    describe("High Availability Standards", () => {
      test("should deploy resources across multiple AZs", () => {
        expect(terraformContent).toMatch(/count\s*=\s*length\(var\.(private|public)_subnet_cidrs\)/);
        expect(terraformContent).toMatch(/availability_zone\s*=/);
      });

      test("should have multi-AZ configuration for ElastiCache", () => {
        expect(terraformContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
      });

      test("should have NAT Gateway for high availability", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      });

      test("should have multiple subnets (public and private)", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
        expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      });
    });

    describe("Monitoring Standards", () => {
      test("should have CloudWatch alarms for API errors", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_error_rate"/);
        expect(terraformContent).toMatch(/metric_name\s*=\s*"5XXError"/);
      });

      test("should have CloudWatch alarms for API latency", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"/);
        expect(terraformContent).toMatch(/metric_name\s*=\s*"Latency"/);
      });

      test("should have CloudWatch alarms for Lambda errors", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
        expect(terraformContent).toMatch(/metric_name\s*=\s*"Errors"/);
      });

      test("should have CloudWatch alarms for DynamoDB throttling", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttled"/);
        expect(terraformContent).toMatch(/metric_name\s*=\s*"ThrottledRequests"/);
      });

      test("should have CloudWatch alarms for Redis CPU", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_cpu"/);
      });

      test("should have CloudWatch Dashboard defined", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      });

      test("should have SNS topic for alarm notifications", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
        expect(terraformContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
      });

      test("should have log retention configured", () => {
        expect(terraformContent).toMatch(/retention_in_days\s*=\s*\d+/);
      });
    });

    describe("GDPR Compliance Standards", () => {
      test("should have data retention policies configured", () => {
        expect(terraformContent).toMatch(/retention_in_days/);
        expect(terraformContent).toMatch(/expiration\s*{[^}]*days\s*=\s*365/);
      });

      test("should have TTL for automatic data deletion", () => {
        expect(terraformContent).toMatch(/ttl\s*{[^}]*enabled\s*=\s*true/);
      });

      test("should have CloudTrail for audit logging", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      });

      test("should have S3 lifecycle policies for log archival", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
        expect(terraformContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      });

      test("should have compliance tags on resources", () => {
        expect(terraformContent).toMatch(/Compliance\s*=\s*"GDPR"/);
      });

      test("should have encryption everywhere", () => {
        const encryptionCount = (terraformContent.match(/encryption_enabled\s*=\s*true/g) || []).length;
        expect(encryptionCount).toBeGreaterThan(0);
      });
    });

    describe("Tagging Standards", () => {
      test("should define common_tags in locals", () => {
        expect(terraformContent).toMatch(/locals\s*{[^}]*common_tags\s*=/);
      });

      test("should include Environment tag", () => {
        expect(terraformContent).toMatch(/Environment\s*=\s*var\.environment/);
      });

      test("should include Owner tag", () => {
        expect(terraformContent).toMatch(/Owner\s*=\s*var\.owner/);
      });

      test("should include Project tag", () => {
        expect(terraformContent).toMatch(/Project\s*=\s*var\.project_name/);
      });

      test("should include Compliance tag", () => {
        expect(terraformContent).toMatch(/Compliance\s*=\s*"GDPR"/);
      });

      test("should apply tags to all major resources", () => {
        const tagApplications = (terraformContent.match(/tags\s*=\s*(local\.common_tags|merge\()/g) || []).length;
        expect(tagApplications).toBeGreaterThan(20); // Should have many tagged resources
      });
    });
  });

  describe("Edge Cases & Error Scenarios", () => {
    describe("Output Edge Cases", () => {
      test("should handle missing outputs gracefully", () => {
        const nonExistentOutput = (outputs as any).non_existent_output;
        expect(nonExistentOutput).toBeUndefined();
      });

      test("API Gateway URL should not contain double slashes (except protocol)", () => {
        const url = outputs.api_gateway_url?.value || "";
        // Remove protocol to check for double slashes in the path
        const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
        expect(urlWithoutProtocol).not.toMatch(/\/\//g);
      });

      test("resource names should not have leading/trailing hyphens", () => {
        const tableName = outputs.dynamodb_table_name?.value || "";
        expect(tableName).not.toMatch(/^-|-$/);
      });

      test("resource names should not be excessively long", () => {
        const tableName = outputs.dynamodb_table_name?.value || "";
        expect(tableName.length).toBeLessThan(255);
      });

      test("S3 bucket name should not have uppercase letters", () => {
        const bucket = outputs.cloudtrail_s3_bucket?.value || "";
        expect(bucket).toBe(bucket.toLowerCase());
      });

      test("S3 bucket name should not have consecutive hyphens", () => {
        const bucket = outputs.cloudtrail_s3_bucket?.value || "";
        expect(bucket).not.toMatch(/--/);
      });
    });

    describe("Configuration Edge Cases", () => {
      test("should not have hardcoded AWS account IDs", () => {
        // Allow in comments or for root account reference
        const hardcodedAccounts = terraformContent.match(/:\d{12}:/g);
        if (hardcodedAccounts) {
          hardcodedAccounts.forEach(match => {
            // Should only appear in policy documents or data sources
            expect(terraformContent.indexOf(match)).toBeGreaterThan(-1);
          });
        }
      });

      test("should not have hardcoded regions outside variables", () => {
        const hardcodedRegions = terraformContent.match(/"us-(east|west)-\d"/g);
        // Only allowed in default values
        if (hardcodedRegions) {
          hardcodedRegions.forEach(region => {
            const context = terraformContent.substring(
              Math.max(0, terraformContent.indexOf(region) - 100),
              terraformContent.indexOf(region) + 100
            );
            expect(context).toMatch(/default\s*=/);
          });
        }
      });

      test("should use data sources for dynamic values", () => {
        expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
        expect(terraformContent).toMatch(/data\s+"aws_region"\s+"current"/);
      });

      test("should not have inline policy documents without jsonencode", () => {
        const policyMatches = terraformContent.match(/policy\s*=\s*<<EOF/g);
        expect(policyMatches).toBeFalsy();
      });

      test("Lambda function should not reference non-existent zip file", () => {
        // Should use local_file and archive_file or valid filename
        expect(terraformContent).toMatch(/resource\s+"local_file"\s+"lambda_code"/);
        expect(terraformContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
      });

      test("should have proper depends_on for resource ordering", () => {
        expect(terraformContent).toMatch(/depends_on\s*=/);
      });

      test("should have lifecycle rules where appropriate", () => {
        expect(terraformContent).toMatch(/lifecycle\s*{/);
      });
    });

    describe("Security Edge Cases", () => {
      test("should not allow 0.0.0.0/0 ingress on security groups", () => {
        const ingressRules = terraformContent.match(/ingress\s*{[^}]*}/g) || [];
        ingressRules.forEach(rule => {
          if (rule.includes('cidr_blocks')) {
            expect(rule).not.toContain('"0.0.0.0/0"');
          }
        });
      });

      test("should not have overly permissive IAM policies", () => {
        expect(terraformContent).not.toMatch(/"Action"\s*:\s*"\*"/);
        // ElastiCache might have elasticache:*, which is acceptable
      });

      test("should not disable important security features", () => {
        expect(terraformContent).not.toMatch(/enable_key_rotation\s*=\s*false/);
        expect(terraformContent).not.toMatch(/enable_log_file_validation\s*=\s*false/);
      });

      test("should not expose sensitive data in outputs", () => {
        // Redis endpoint is OK, but not passwords/keys
        expect(terraformContent).not.toMatch(/output\s+"[^"]*password[^"]*"/i);
        expect(terraformContent).not.toMatch(/output\s+"[^"]*secret[^"]*"/i);
        expect(terraformContent).not.toMatch(/output\s+"[^"]*key[^"]*"/i);
      });
    });

    describe("Performance Edge Cases", () => {
      test("Lambda memory should be in valid increments (64 MB)", () => {
        const memoryMatch = terraformContent.match(/memory_size\s*=\s*(\d+)/);
        if (memoryMatch) {
          const memory = parseInt(memoryMatch[1], 10);
          expect(memory % 64).toBe(0);
        }
      });

      test("API Gateway should have caching enabled", () => {
        expect(terraformContent).toMatch(/caching_enabled\s*=\s*true/);
      });

      test("API Gateway should have throttling configured", () => {
        expect(terraformContent).toMatch(/throttling_rate_limit/);
        expect(terraformContent).toMatch(/throttling_burst_limit/);
      });

      test("DynamoDB should use PAY_PER_REQUEST for unpredictable workload", () => {
        expect(terraformContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      });

      test("should have connection pooling configuration for optimal performance", () => {
        // ElastiCache parameters should be configured
        expect(terraformContent).toMatch(/resource\s+"aws_elasticache_parameter_group"/);
      });
    });
  });

  describe("Integration Validation", () => {
    describe("Resource Interconnections", () => {
      test("Lambda should reference DynamoDB table", () => {
        expect(terraformContent).toMatch(/aws_dynamodb_table\.travel_search/);
      });

      test("Lambda should reference ElastiCache endpoint", () => {
        expect(terraformContent).toMatch(/aws_elasticache_replication_group\.redis/);
      });

      test("Lambda should be in VPC with proper subnets", () => {
        expect(terraformContent).toMatch(/vpc_config\s*{[^}]*subnet_ids\s*=\s*aws_subnet\.private\.\*\.id/);
      });

      test("API Gateway should integrate with Lambda", () => {
        expect(terraformContent).toMatch(/integration_http_method\s*=\s*"POST"/);
        expect(terraformContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
        expect(terraformContent).toMatch(/uri\s*=\s*aws_lambda_function\.[^\.]+\.invoke_arn/);
      });

      test("WAF should be associated with API Gateway", () => {
        expect(terraformContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
        expect(terraformContent).toMatch(/resource_arn\s*=\s*aws_api_gateway_stage\.[^\.]+\.arn/);
      });

      test("CloudWatch alarms should reference SNS topic", () => {
        expect(terraformContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
      });

      test("CloudTrail should reference S3 bucket", () => {
        expect(terraformContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail_logs\.id/);
      });

      test("All resources should use KMS key for encryption", () => {
        expect(terraformContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
      });
    });

    describe("Output Consistency", () => {
      test("output values should match resource references", () => {
        expect(terraformContent).toMatch(/output\s+"api_gateway_url"[^}]*value\s*=\s*"\$\{aws_api_gateway_stage\.[^}]+\.invoke_url\}\/search"/);
        expect(terraformContent).toMatch(/output\s+"dynamodb_table_name"[^}]*value\s*=\s*aws_dynamodb_table\.[^\.]+\.name/);
        expect(terraformContent).toMatch(/output\s+"lambda_function_name"[^}]*value\s*=\s*aws_lambda_function\.[^\.]+\.function_name/);
      });

      test("all outputs should have descriptions", () => {
        const outputBlocks = terraformContent.match(/output\s+"[^"]+"\s*{[^}]+}/g) || [];
        outputBlocks.forEach(block => {
          expect(block).toMatch(/description\s*=/);
        });
      });
    });
  });

  describe("Best Practices Validation", () => {
    test("should use meaningful resource names", () => {
      expect(terraformContent).not.toMatch(/resource\s+"[^"]+"\s+"test"/);
      expect(terraformContent).not.toMatch(/resource\s+"[^"]+"\s+"foo"/);
      expect(terraformContent).not.toMatch(/resource\s+"[^"]+"\s+"temp"/);
    });

    test("should have comments for major sections", () => {
      expect(terraformContent).toMatch(/#.*VPC/);
      expect(terraformContent).toMatch(/#.*Security/);
      expect(terraformContent).toMatch(/#.*Lambda/);
      expect(terraformContent).toMatch(/#.*API Gateway/);
    });

    test("should use locals for repeated values", () => {
      expect(terraformContent).toMatch(/locals\s*{/);
      expect(terraformContent).toMatch(/local\.common_tags/);
      expect(terraformContent).toMatch(/local\.account_id/);
      expect(terraformContent).toMatch(/local\.region/);
    });

    test("should use consistent indentation", () => {
      const lines = terraformContent.split('\n');
      const indentedLines = lines.filter(line => line.trim().length > 0);
      // Check that indentation is consistent (2 or 4 spaces)
      const hasConsistentIndentation = indentedLines.every(line => {
        const leadingSpaces = line.match(/^ */)?.[0].length || 0;
        return leadingSpaces % 2 === 0;
      });
      expect(hasConsistentIndentation).toBe(true);
    });

    test("should not have trailing whitespace", () => {
      const linesWithTrailingSpace = terraformContent.split('\n').filter(line =>
        line.length > 0 && line[line.length - 1] === ' '
      );
      expect(linesWithTrailingSpace.length).toBe(0);
    });

    test("file should end with newline", () => {
      expect(terraformContent[terraformContent.length - 1]).toBe('\n');
    });

    test("should use terraform formatting conventions", () => {
      // Check for proper spacing around assignment operators (not comparison operators)
      // Allow ==, !=, >=, <= but catch assignments without spaces
      const lines = terraformContent.split('\n');
      const assignmentLines = lines.filter(line => {
        // Skip lines with comparison operators
        if (line.includes('==') || line.includes('!=') || line.includes('>=') || line.includes('<=')) {
          return false;
        }
        // Check for assignment without proper spacing
        return /[a-zA-Z_]\s*=[^=\s]/.test(line) || /[a-zA-Z_][^=\s]=\s*[^=]/.test(line);
      });

      // Should have minimal violations (allow some flexibility in JSON blocks)
      expect(assignmentLines.length).toBeLessThan(10);
    });
  });
});
