// Comprehensive TypeScript unit tests for IaC AWS Nova Model
// Validates Terraform configuration against enterprise security requirements
// Tests infrastructure components without executing Terraform commands

import fs from "fs";
import path from "path";

interface TerraformResource {
  type: string;
  name: string;
  content: string;
}

interface TerraformVariable {
  name: string;
  type?: string;
  description?: string;
  defaultValue?: string;
}

interface TerraformOutput {
  name: string;
  description?: string;
  value?: string;
}

const STACK_FILE = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_FILE);

describe("IaC AWS Nova Model - Enterprise Security Validation", () => {
  let stackContent: string;
  let resources: TerraformResource[];
  let variables: TerraformVariable[];
  let outputs: TerraformOutput[];

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Terraform stack file not found at: ${stackPath}`);
    }
    stackContent = fs.readFileSync(stackPath, "utf8");
    
    // Parse resources
    resources = parseResources(stackContent);
    variables = parseVariables(stackContent);
    outputs = parseOutputs(stackContent);
  });

  // Helper functions for parsing Terraform configuration
  function parseResources(content: string): TerraformResource[] {
    const lines = content.split('\n');
    const resources: TerraformResource[] = [];
    let currentResource: TerraformResource | null = null;
    let braceCount = 0;
    let inResource = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for resource start
      const resourceMatch = line.match(/resource\s+"([^"]+)"\s+"([^"]+)"\s*{/);
      if (resourceMatch) {
        currentResource = {
          type: resourceMatch[1],
          name: resourceMatch[2],
          content: ''
        };
        inResource = true;
        braceCount = 1;
      }
      
      if (inResource && currentResource) {
        currentResource.content += line + '\n';
        
        // Count braces to find end of resource
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        if (braceCount === 0) {
          resources.push(currentResource);
          currentResource = null;
          inResource = false;
        }
      }
    }
    
    return resources;
  }

  function parseVariables(content: string): TerraformVariable[] {
    const variableMatches = content.match(/variable\s+"([^"]+)"\s*{[^}]*}/g) || [];
    return variableMatches.map(match => {
      const nameMatch = match.match(/variable\s+"([^"]+)"/);
      const typeMatch = match.match(/type\s*=\s*([^\n]+)/);
      const descMatch = match.match(/description\s*=\s*"([^"]+)"/);
      const defaultMatch = match.match(/default\s*=\s*([^\n]+)/);
      
      return {
        name: nameMatch?.[1] || '',
        type: typeMatch?.[1]?.trim(),
        description: descMatch?.[1],
        defaultValue: defaultMatch?.[1]?.trim()
      };
    });
  }

  function parseOutputs(content: string): TerraformOutput[] {
    const outputMatches = content.match(/output\s+"([^"]+)"\s*{[^}]*}/g) || [];
    return outputMatches.map(match => {
      const nameMatch = match.match(/output\s+"([^"]+)"/);
      const descMatch = match.match(/description\s*=\s*"([^"]+)"/);
      const valueMatch = match.match(/value\s*=\s*([^\n]+)/);
      
      return {
        name: nameMatch?.[1] || '',
        description: descMatch?.[1],
        value: valueMatch?.[1]?.trim()
      };
    });
  }

  function findResourceByType(type: string): TerraformResource[] {
    return resources.filter(r => r.type === type);
  }

  function findResourceByName(name: string): TerraformResource | undefined {
    return resources.find(r => r.name === name);
  }

  // Test 1-5: Infrastructure Foundation and Configuration
  describe("Infrastructure Foundation and Configuration", () => {
    test("1. Terraform file exists at correct path with substantial content", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(1000);
      expect(stackContent).toContain('# Variables');
      expect(stackContent).toContain('# Locals');
    });

    test("2. Provider separation - no AWS provider declared in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*required_providers/);
    });

    test("3. Required variables for enterprise configuration", () => {
      const requiredVars = ['aws_region', 'project_name', 'environment', 'domain_name'];
      requiredVars.forEach(varName => {
        const variable = variables.find(v => v.name === varName);
        expect(variable).toBeDefined();
        expect(variable?.description).toBeDefined();
      });
      
      // Validate aws_region default is us-east-1 for compliance
      const awsRegionVar = variables.find(v => v.name === 'aws_region');
      expect(awsRegionVar?.defaultValue).toMatch(/us-east-1/);
    });

    test("4. Locals configuration with enterprise standards", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Compliance\s*=\s*"nist-cis"/);
    });

    test("5. Data sources for AWS account and region information", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  // Test 6-10: Data Security and Encryption Requirements
  describe("Data Security and Encryption Requirements", () => {
    test("6. KMS main encryption key with enterprise security settings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
      expect(stackContent).toMatch(/customer_master_key_spec\s*=\s*"SYMMETRIC_DEFAULT"/);
      expect(stackContent).toMatch(/key_usage\s*=\s*"ENCRYPT_DECRYPT"/);
    });

    test("7. DNSSEC KMS key for Route53 DNS security", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"dnssec"/);
      expect(stackContent).toMatch(/customer_master_key_spec\s*=\s*"ECC_NIST_P256"/);
      expect(stackContent).toMatch(/key_usage\s*=\s*"SIGN_VERIFY"/);
      // DNSSEC keys don't support rotation
    });

    test("8. KMS key aliases for operational management", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"dnssec"/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.dnssec\.key_id/);
    });

    test("9. S3 buckets with mandatory encryption at rest", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.(arn|key_id)/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("10. S3 buckets are private by default - no public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"config"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  // Test 11-15: Identity and Access Management (IAM) - Least Privilege
  describe("Identity and Access Management - Least Privilege Principle", () => {
    test("11. MFA enforcement policy for enhanced security", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_enforcement"/);
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
      expect(stackContent).toMatch(/"aws:MultiFactorAuthPresent"\s*=\s*"false"/);
      expect(stackContent).toMatch(/Effect.*Deny/);
      // Verify policy covers critical AWS actions
      expect(stackContent).toMatch(/iam:/);
      expect(stackContent).toMatch(/s3:/);
    });

    test("12. IAM admin user with MFA policy attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_user"\s+"admin_user"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_user_policy_attachment"\s+"mfa_enforcement"/);
      expect(stackContent).toMatch(/user\s*=\s*aws_iam_user\.admin_user\.name/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*aws_iam_policy\.mfa_enforcement\.arn/);
    });

    test("13. Application IAM role with least privilege access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"app_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"app_policy"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"app_profile"/);
      
      // Verify least privilege - no wildcard in application policy
      const appPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"app_policy"[\s\S]*?(?=resource\s+"\w+")/)?.[0];
      if (appPolicyMatch) {
        expect(appPolicyMatch).not.toMatch(/"Action"\s*:\s*"\*"/);
      }
    });

    test("14. AWS Config service IAM role with managed policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config_policy"/);
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/ConfigRole/);
    });

    test("15. VPC Flow Logs IAM role with specific permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_log_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_log_policy"/);
      
      // Verify CloudWatch Logs permissions
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  // Test 16-20: Networking and VPC Architecture
  describe("Networking and VPC Architecture - Isolation and Security", () => {
    test("16. VPC foundation with proper DNS and multi-AZ support", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("17. Three-tier subnet architecture across multiple AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      
      // Verify multi-AZ deployment with count
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
    });

    test("18. Internet Gateway for public internet access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("19. NAT Gateways with Elastic IPs for private subnet outbound", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      
      // Verify proper configuration
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test("20. Route tables and associations for proper traffic flow", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
      
      // Verify IGW route in public table
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });
  });

  // Test 21-25: Network Security - Defense in Depth
  describe("Network Security - Defense in Depth Strategy", () => {
    test("21. Database subnet group for RDS multi-AZ deployment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("22. Tier-based security groups with least privilege access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      
      // Verify web tier allows HTTP/HTTPS
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      
      // Verify database tier restricts access
      expect(stackContent).toMatch(/from_port\s*=\s*(3306|5432)/);
      expect(stackContent).toMatch(/security_groups/);
    });

    test("23. Network ACLs for additional subnet-level security", () => {
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_network_acl_association"/);
      
      // Verify NACL rules exist
      expect(stackContent).toMatch(/(ingress|egress)\s*{/);
      expect(stackContent).toMatch(/protocol\s*=\s*"(tcp|udp|-1)"/);
    });

    test("24. VPC endpoints for secure AWS service communication", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kms"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoint"/);
      
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.[^"]*\.s3"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.[^"]*\.kms"/);
    });

    test("25. VPC Flow Logs for network traffic monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_log"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"/);
      
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  // Test 26-30: Web Application Security and DNS Protection
  describe("Web Application Security and DNS Protection", () => {
    test("26. WAF Web ACL with comprehensive security rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      
      // Verify managed rule sets that are actually present
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(stackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      
      // Verify rate limiting and geo blocking
      expect(stackContent).toMatch(/rate_based_statement/);
      expect(stackContent).toMatch(/geo_match_statement/);
      expect(stackContent).toMatch(/country_codes/);
    });

    test("27. Route53 DNS zone with DNSSEC security", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_key_signing_key"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_hosted_zone_dnssec"\s+"main"/);
      
      expect(stackContent).toMatch(/name\s*=\s*var\.domain_name/);
      expect(stackContent).toMatch(/key_management_service_arn\s*=\s*aws_kms_key\.dnssec\.arn/);
      expect(stackContent).toMatch(/hosted_zone_id\s*=\s*aws_route53_key_signing_key\.main\.hosted_zone_id/);
    });

    test("28. AWS Config for continuous compliance monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      
      // Verify specific compliance rules
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"root_access_key_check"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"mfa_enabled_for_iam_console_access"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"/);
    });

    test("29. CloudTrail with encryption and multi-region coverage", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.bucket/);
      
      // Verify insights and event selectors
      expect(stackContent).toMatch(/insight_selector/);
      expect(stackContent).toMatch(/event_selector/);
      expect(stackContent).toMatch(/ApiCallRateInsight/);
    });

    test("30. GuardDuty threat detection with advanced features", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"s3_data_events"/);
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"eks_audit_logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"ebs_malware_protection"/);
      
      expect(stackContent).toMatch(/enable\s*=\s*true/);
      
      // Verify advanced features are enabled
      expect(stackContent).toMatch(/status\s*=\s*"ENABLED"/);
    });
  });

  // Comprehensive Output and Tagging Validation
  describe("Infrastructure Outputs and Operational Standards", () => {
    test("Comprehensive outputs for CI/CD pipeline integration", () => {
      expect(outputs.length).toBeGreaterThanOrEqual(15);
      
      // Verify critical outputs exist
      const outputNames = outputs.map(o => o.name);
      const requiredOutputs = [
        'vpc_id', 'private_subnet_ids', 'public_subnet_ids', 'database_subnet_ids',
        'security_group_web_id', 'security_group_app_id', 'security_group_database_id',
        's3_bucket_name', 'kms_key_arn', 'waf_acl_arn', 'route53_zone_id'
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(outputNames).toContain(outputName);
      });
      
      // Verify outputs have descriptions
      outputs.forEach(output => {
        expect(output.description).toBeDefined();
        expect(output.description?.length).toBeGreaterThan(0);
      });
    });

    test("Consistent enterprise tagging strategy across resources", () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      
      // Count resources with proper tagging
      const taggedResourcesCount = (stackContent.match(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/g) || []).length;
      expect(taggedResourcesCount).toBeGreaterThan(15);
      
      // Verify tag structure in locals
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(stackContent).toMatch(/Compliance\s*=\s*"nist-cis"/);
      expect(stackContent).toMatch(/Owner\s*=\s*"infrastructure-team"/);
    });
  });
});

