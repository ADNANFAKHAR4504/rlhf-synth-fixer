import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";  
const OUTPUTS_REL = "../lib/outputs.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const outputsPath = path.resolve(__dirname, OUTPUTS_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let outputsContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  describe("File Existence Tests", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });
  });

  describe("Provider Configuration Tests", () => {
    test("declares primary AWS provider with alias", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"primary"/);
    });

    test("declares secondary AWS provider with alias", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
    });

    test("declares random provider", () => {
      expect(providerContent).toMatch(/random\s*=\s*{\s*source\s*=\s*"hashicorp\/random"/);
    });

    test("uses Terraform version >= 1.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test("uses AWS provider version ~> 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("uses random provider version ~> 3.1", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*3\.1"/);
    });

    test("includes default tags configuration", () => {
      expect(providerContent).toMatch(/default_tags\s*{\s*tags\s*=/);
    });

    test("declares environment_suffix variable", () => {
      expect(providerContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test("declares aws_region variable", () => {
      expect(providerContent).toMatch(/variable\s+"aws_region"/);
    });

    test("declares random string resource", () => {
      expect(providerContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
    });

    test("defines local name_prefix", () => {
      expect(providerContent).toMatch(/locals\s*{/);
      expect(providerContent).toMatch(/name_prefix\s*=\s*"financial-app-\$\{local\.environment_suffix\}-\$\{random_string\.suffix\.result\}"/);
    });

    test("environment tag uses local.environment_suffix", () => {
      expect(providerContent).toMatch(/Environment\s*=\s*local\.environment_suffix/);
    });
  });

  describe("Stack Infrastructure Tests", () => {
    test("does NOT declare provider in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("declares KMS keys for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"financial_app_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"financial_app_secondary"/);
    });

    test("KMS keys use environment suffix in naming", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-kms-primary"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-kms-secondary"/);
    });

    test("enables KMS key rotation", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS keys have enhanced security policies", () => {
      expect(stackContent).toMatch(/"logs\.\$\{var\.primary_region\}\.amazonaws\.com"/);
      expect(stackContent).toMatch(/aws:PrincipalAccount.*data\.aws_caller_identity\.current\.account_id/);
      expect(stackContent).toMatch(/kms:EncryptionContext:aws:logs:arn/);
    });

    test("declares VPCs for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
    });

    test("VPCs use proper CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test("VPCs have DNS support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
    });

    test("declares NAT gateways with EIPs (optimized for cost)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"/);
      
      // Should be 1 NAT gateway per region for cost optimization
      expect(stackContent).toMatch(/count\s*=\s*1/);
    });

    test("declares route tables and associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test("declares IAM resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"financial_app_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"financial_app_policy"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });

    test("IAM resources use environment suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-role"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-policy"/);
    });

    test("declares CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\./);
    });

    test("declares CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });

    test("declares SNS topics", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"/);
      expect(stackContent).toMatch(/kms_master_key_id/);
    });

    test("declares security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
    });
  });

  describe("Environment Suffix Integration Tests", () => {
    test("all resource names use local.name_prefix pattern", () => {
      const nameMatches = stackContent.match(/Name\s*=\s*"[^"]*"/g) || [];
      const dynamicNames = nameMatches.filter(name => name.includes("${local.name_prefix}"));
      const hardcodedNames = nameMatches.filter(name => !name.includes("${") && name.includes("financial-app"));
      
      expect(hardcodedNames.length).toBe(0); // Should be no hardcoded financial-app names
      expect(dynamicNames.length).toBeGreaterThan(20); // Should have many dynamic names
    });

    test("all resources include Environment tags", () => {
      const environmentTagMatches = stackContent.match(/Environment\s*=\s*local\.environment_suffix/g) || [];
      
      // Count expected resources that should have environment tags
      const kmsResources = (stackContent.match(/resource\s+"aws_kms_key"/g) || []).length;
      const vpcResources = (stackContent.match(/resource\s+"aws_vpc"/g) || []).length;
      const igwResources = (stackContent.match(/resource\s+"aws_internet_gateway"/g) || []).length;
      const subnetResources = (stackContent.match(/resource\s+"aws_subnet"/g) || []).length;
      const eipResources = (stackContent.match(/resource\s+"aws_eip"/g) || []).length;
      const natResources = (stackContent.match(/resource\s+"aws_nat_gateway"/g) || []).length;
      const rtResources = (stackContent.match(/resource\s+"aws_route_table"\s+"/g) || []).length;
      const iamResources = (stackContent.match(/resource\s+"aws_iam_(role|policy|instance_profile)"/g) || []).length;
      const cwLogResources = (stackContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length;
      const cwAlarmResources = (stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length;
      const snsResources = (stackContent.match(/resource\s+"aws_sns_topic"/g) || []).length;
      const sgResources = (stackContent.match(/resource\s+"aws_security_group"/g) || []).length;
      
      const totalTaggableResources = kmsResources + vpcResources + igwResources + 
        subnetResources + eipResources + natResources + rtResources + 
        iamResources + cwLogResources + cwAlarmResources + snsResources + sgResources;
      
      // IAM policies and some route table associations don't have explicit tags, so adjust expectation
      expect(environmentTagMatches.length).toBeGreaterThanOrEqual(totalTaggableResources - 2);
    });

    test("IAM role names use environment suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-role"/);
    });

    test("CloudWatch log group names use environment suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/\$\{local\.name_prefix\}/);
    });

    test("SNS topic names use environment suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-alerts/);
    });

    test("KMS alias names use environment suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"alias\/\$\{local\.name_prefix\}/);
    });
  });

  describe("Security Configuration Tests", () => {
    test("KMS keys have proper IAM policies", () => {
      expect(stackContent).toMatch(/Action\s*=\s*"kms:\*"/);
      expect(stackContent).toMatch(/Principal[\s\S]*AWS[\s\S]*arn:aws:iam/);
    });

    test("KMS policies include CloudWatch Logs service permissions", () => {
      expect(stackContent).toMatch(/"logs\.\$\{var\.primary_region\}\.amazonaws\.com"/);
      expect(stackContent).toMatch(/kms:EncryptionContext:aws:logs:arn/);
    });

    test("KMS policies include account-specific conditions", () => {
      expect(stackContent).toMatch(/aws:PrincipalAccount.*data\.aws_caller_identity\.current\.account_id/);
    });

    test("IAM policy includes KMS permissions", () => {
      expect(stackContent).toMatch(/"kms:Decrypt"/);
      expect(stackContent).toMatch(/"kms:Encrypt"/);
      expect(stackContent).toMatch(/"kms:GenerateDataKey\*"/);
    });

    test("IAM policy includes CloudWatch permissions with specific ARNs", () => {
      expect(stackContent).toMatch(/"logs:CreateLogGroup"/);
      expect(stackContent).toMatch(/"cloudwatch:PutMetricData"/);
      expect(stackContent).toMatch(/"arn:aws:logs:\$\{var\.primary_region\}:\$\{data\.aws_caller_identity\.current\.account_id\}:log-group:\/aws\/\$\{local\.name_prefix\}\/\*"/);
      expect(stackContent).toMatch(/"arn:aws:logs:\$\{var\.secondary_region\}:\$\{data\.aws_caller_identity\.current\.account_id\}:log-group:\/aws\/\$\{local\.name_prefix\}\/\*"/);
    });

    test("Security groups use restricted CIDR blocks (not 0.0.0.0/0 for ingress)", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      
      // Should use VPC and RFC 1918 private networks instead of 0.0.0.0/0 for ingress
      expect(stackContent).toMatch(/"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/"10\.1\.0\.0\/16"/);
      expect(stackContent).toMatch(/"172\.16\.0\.0\/12"/);
      expect(stackContent).toMatch(/"192\.168\.0\.0\/16"/);
      
      // Ensure specific security descriptions are present
      expect(stackContent).toMatch(/HTTPS access from private networks/);
      expect(stackContent).toMatch(/HTTP access from VPC only \(for health checks\)/);
    });

    test("Security groups allow egress to 0.0.0.0/0 only", () => {
      const egressMatches = stackContent.match(/egress\s*{[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/g) || [];
      const ingressMatches = stackContent.match(/ingress\s*{[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/g) || [];
      
      expect(egressMatches.length).toBeGreaterThan(0); // Should have egress to 0.0.0.0/0
      expect(ingressMatches.length).toBe(0); // Should NOT have ingress from 0.0.0.0/0
    });
  });

  describe("Multi-Region Configuration Tests", () => {
    test("uses different CIDR blocks for each region", () => {
      expect(stackContent).toMatch(/10\.0\.0\.0\/16/);
      expect(stackContent).toMatch(/10\.1\.0\.0\/16/);
    });

    test("creates resources in both primary and secondary providers", () => {
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test("subnet CIDR blocks are properly distributed", () => {
      expect(stackContent).toMatch(/10\.0\.\$\{count\.index \+ 1\}\.0\/24/);
      expect(stackContent).toMatch(/10\.1\.\$\{count\.index \+ 1\}\.0\/24/);
      expect(stackContent).toMatch(/10\.0\.\$\{count\.index \+ 10\}\.0\/24/);
      expect(stackContent).toMatch(/10\.1\.\$\{count\.index \+ 10\}\.0\/24/);
    });

    test("NAT gateways are optimized for cost (1 per region)", () => {
      // Should use first NAT gateway for all private route tables
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.primary\[0\]\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.secondary\[0\]\.id/);
    });
  });

  describe("Output Configuration Tests", () => {
    test("declares all required VPC outputs", () => {
      expect(outputsContent).toMatch(/output\s+"vpc_primary_id"/);
      expect(outputsContent).toMatch(/output\s+"vpc_secondary_id"/);
    });

    test("declares subnet outputs", () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids_primary"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids_primary"/);
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids_secondary"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids_secondary"/);
    });

    test("declares KMS key outputs", () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_primary_id"/);
      expect(outputsContent).toMatch(/output\s+"kms_key_primary_arn"/);
      expect(outputsContent).toMatch(/output\s+"kms_key_secondary_id"/);
      expect(outputsContent).toMatch(/output\s+"kms_key_secondary_arn"/);
    });

    test("declares IAM outputs", () => {
      expect(outputsContent).toMatch(/output\s+"financial_app_role_arn"/);
      expect(outputsContent).toMatch(/output\s+"financial_app_instance_profile_name"/);
    });

    test("declares monitoring outputs", () => {
      expect(outputsContent).toMatch(/output\s+"log_group_primary_name"/);
      expect(outputsContent).toMatch(/output\s+"sns_topic_primary_arn"/);
      expect(outputsContent).toMatch(/output\s+"cloudwatch_alarm_primary_name"/);
    });

    test("declares application monitoring outputs", () => {
      expect(outputsContent).toMatch(/output\s+"app_metrics_log_group_primary"/);
      expect(outputsContent).toMatch(/output\s+"app_metrics_log_group_secondary"/);
      expect(outputsContent).toMatch(/output\s+"app_response_time_alarm_primary"/);
      expect(outputsContent).toMatch(/output\s+"app_response_time_alarm_secondary"/);
      expect(outputsContent).toMatch(/output\s+"app_error_rate_alarm_primary"/);
      expect(outputsContent).toMatch(/output\s+"app_error_rate_alarm_secondary"/);
      expect(outputsContent).toMatch(/output\s+"transaction_volume_alarm_primary"/);
      expect(outputsContent).toMatch(/output\s+"transaction_volume_alarm_secondary"/);
      expect(outputsContent).toMatch(/output\s+"memory_utilization_alarm_primary"/);
      expect(outputsContent).toMatch(/output\s+"memory_utilization_alarm_secondary"/);
      expect(outputsContent).toMatch(/output\s+"app_health_check_alarm_primary"/);
      expect(outputsContent).toMatch(/output\s+"app_health_check_alarm_secondary"/);
    });

    test("includes region outputs", () => {
      expect(outputsContent).toMatch(/output\s+"primary_region"/);
      expect(outputsContent).toMatch(/output\s+"secondary_region"/);
    });

    test("includes environment and naming outputs", () => {
      expect(outputsContent).toMatch(/output\s+"environment_suffix"/);
      expect(outputsContent).toMatch(/output\s+"name_prefix"/);
      expect(outputsContent).toMatch(/output\s+"random_suffix"/);
    });

    test("includes network infrastructure outputs", () => {
      expect(outputsContent).toMatch(/output\s+"igw_primary_id"/);
      expect(outputsContent).toMatch(/output\s+"nat_gateway_primary_ids"/);
      expect(outputsContent).toMatch(/output\s+"public_route_table_primary_id"/);
      expect(outputsContent).toMatch(/output\s+"private_route_table_primary_ids"/);
    });

    test("includes KMS alias outputs", () => {
      expect(outputsContent).toMatch(/output\s+"kms_alias_primary_name"/);
      expect(outputsContent).toMatch(/output\s+"kms_alias_secondary_name"/);
    });
  });

  describe("Resource Dependencies Tests", () => {
    test("NAT gateways depend on internet gateways", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway/);
    });

    test("IAM role policy attachment references correct resources", () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.financial_app_role\.name/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*aws_iam_policy\.financial_app_policy\.arn/);
    });

    test("route tables reference correct NAT gateways", () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.primary\[0\]\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.secondary\[0\]\.id/);
    });

    test("subnets use availability zones data source", () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones/);
    });

    test("KMS aliases reference correct KMS keys", () => {
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.financial_app_primary\.key_id/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.financial_app_secondary\.key_id/);
    });
  });

  describe("Cost Optimization Tests", () => {
    test("NAT gateway count is optimized for cost", () => {
      // Should have only 1 NAT gateway per region instead of 2
      const natGatewayMatches = stackContent.match(/count\s*=\s*1/g) || [];
      expect(natGatewayMatches.length).toBeGreaterThanOrEqual(4); // 2 EIPs + 2 NAT gateways
    });

    test("KMS key deletion window is set for testing", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("CloudWatch log retention is reasonable", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });
  });

  describe("High Availability Tests", () => {
    test("resources span multiple availability zones", () => {
      expect(stackContent).toMatch(/count\s*=\s*2/); // For subnets and route tables
      expect(stackContent).toMatch(/data\.aws_availability_zones\.primary\.names\[count\.index\]/);
      expect(stackContent).toMatch(/data\.aws_availability_zones\.secondary\.names\[count\.index\]/);
    });

    test("both regions have complete infrastructure", () => {
      // Each region should have VPC, IGW, subnets, NAT, route tables, and monitoring
      const primaryProviderMatches = stackContent.match(/provider\s*=\s*aws\.primary/g) || [];
      const secondaryProviderMatches = stackContent.match(/provider\s*=\s*aws\.secondary/g) || [];
      
      expect(primaryProviderMatches.length).toBeGreaterThan(15); // Updated to account for additional monitoring resources
      expect(secondaryProviderMatches.length).toBeGreaterThan(15);
      expect(primaryProviderMatches.length).toBe(secondaryProviderMatches.length);
    });
  });

  describe("Application Monitoring Tests", () => {
    test("declares custom application metrics log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_metrics_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_metrics_secondary"/);
      expect(stackContent).toMatch(/\/aws\/\$\{local\.name_prefix\}\/application-metrics/);
    });

    test("declares application response time monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"app_response_time_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"app_response_time_secondary"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"Financial\/Application"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"ResponseTime"/);
    });

    test("declares application error rate monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"app_error_rate_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"app_error_rate_secondary"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"ErrorRate"/);
    });

    test("declares business transaction volume monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"transaction_volume_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"transaction_volume_secondary"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"Financial\/Business"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"TransactionVolume"/);
    });

    test("declares database connection monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"db_connection_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"db_connection_secondary"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"Financial\/Database"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
    });

    test("declares memory utilization monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"memory_utilization_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"memory_utilization_secondary"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"CWAgent"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"MemoryUtilization"/);
    });

    test("declares application health check monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"app_health_check_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"app_health_check_secondary"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"HealthCheck"/);
    });

    test("all monitoring alarms use environment suffix in naming", () => {
      expect(stackContent).toMatch(/alarm_name\s*=\s*"\$\{local\.name_prefix\}-app-response-time-primary"/);
      expect(stackContent).toMatch(/alarm_name\s*=\s*"\$\{local\.name_prefix\}-app-error-rate-primary"/);
      expect(stackContent).toMatch(/alarm_name\s*=\s*"\$\{local\.name_prefix\}-transaction-volume-primary"/);
      expect(stackContent).toMatch(/alarm_name\s*=\s*"\$\{local\.name_prefix\}-db-connections-primary"/);
    });

    test("monitoring alarms have proper alarm actions configured", () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts_primary\.arn\]/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts_secondary\.arn\]/);
    });

    test("custom log groups use KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.financial_app_primary\.arn/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.financial_app_secondary\.arn/);
    });
  });
});