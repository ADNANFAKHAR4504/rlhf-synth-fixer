// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform commands are executed - only static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure - tap_stack.tf", () => {
  let terraformContent: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Expected stack file at: ${stackPath}`);
    }
    terraformContent = fs.readFileSync(stackPath, "utf8");
  });

  // Basic file existence and structure tests
  describe("File Structure and Basic Validation", () => {
    test("tap_stack.tf exists and is readable", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
      expect(terraformContent.length).toBeGreaterThan(0);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(terraformContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(terraformContent).not.toMatch(/terraform\s*\{/);
    });

    test("contains proper variable declarations with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"environment"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"organization_name"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test("variables have default values", () => {
      const variableBlocks = terraformContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);
      
      variableBlocks.forEach(block => {
        expect(block).toMatch(/default\s*=/);
      });
    });

    test("variables have proper validation where needed", () => {
      expect(terraformContent).toMatch(/validation\s*\{[\s\S]*?condition\s*=.*contains\(\["prod",\s*"staging",\s*"dev"\]/);
      expect(terraformContent).toMatch(/validation\s*\{[\s\S]*?can\(regex\(/);
    });
  });

  // Variable validation tests
  describe("Variable Definitions and Validation", () => {
    test("declares aws_region variable with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"\s*\{/);
      expect(terraformContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(terraformContent).toMatch(/can\(regex\(".*",\s*var\.aws_region\)\)/);
    });

    test("declares environment variable with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"environment"\s*\{/);
      expect(terraformContent).toMatch(/validation\s*\{[\s\S]*?condition\s*=\s*contains\(\["prod",\s*"staging",\s*"dev"\],\s*var\.environment\)/);
    });

    test("declares environment_suffix variable with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
      expect(terraformContent).toMatch(/description\s*=\s*"Environment suffix to avoid resource conflicts"/);
      expect(terraformContent).toMatch(/type\s*=\s*string/);
      expect(terraformContent).toMatch(/default\s*=\s*""/);
    });

    test("declares database variables with proper configuration", () => {
      expect(terraformContent).toMatch(/variable\s+"db_username"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"db_instance_class"\s*\{/);
      expect(terraformContent).toMatch(/sensitive\s*=\s*true/);
      expect(terraformContent).toMatch(/default\s*=\s*"dbadmin"/);
      expect(terraformContent).toMatch(/default\s*=\s*"db\.t3\.micro"/);
    });

    test("declares network configuration variables", () => {
      expect(terraformContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"public_subnets"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"private_subnets"\s*\{/);
      expect(terraformContent).toMatch(/variable\s+"database_subnets"\s*\{/);
    });
  });

  // Local values and data sources
  describe("Local Values and Data Sources", () => {
    test("defines locals block with name_prefix", () => {
      expect(terraformContent).toMatch(/locals\s*\{/);
      expect(terraformContent).toMatch(/environment_suffix\s*=\s*var\.environment_suffix\s*!=\s*""\s*\?\s*var\.environment_suffix\s*:\s*var\.environment/);
      expect(terraformContent).toMatch(/name_prefix\s*=.*\$\{var\.organization_name\}-\$\{local\.environment_suffix\}/);
    });

    test("defines common_tags in locals", () => {
      expect(terraformContent).toMatch(/common_tags\s*=\s*\{/);
      expect(terraformContent).toMatch(/EnvironmentSuffix\s*=\s*local\.environment_suffix/);
    });

    test("includes required data sources", () => {
      expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(terraformContent).toMatch(/data\s+"aws_region"\s+"current"/);
      expect(terraformContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(terraformContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });
  });

  // Random resources for uniqueness
  describe("Random Resources for Naming", () => {
    test("includes random_id resource for suffix", () => {
      expect(terraformContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
      expect(terraformContent).toMatch(/byte_length\s*=\s*4/);
    });

    test("includes random_password for database", () => {
      expect(terraformContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(terraformContent).toMatch(/special\s*=\s*false/);
      expect(terraformContent).toMatch(/length\s*=\s*20/);
    });
  });

  // KMS encryption
  describe("KMS Key Configuration", () => {
    test("creates KMS key with proper configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(terraformContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(terraformContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("KMS key policy includes necessary service principals", () => {
      expect(terraformContent).toMatch(/Service.*logs\.amazonaws\.com/);
      expect(terraformContent).toMatch(/Service.*s3\.amazonaws\.com/);
      expect(terraformContent).toMatch(/Service.*rds\.amazonaws\.com/);
    });

    test("creates KMS alias", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(terraformContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  // VPC and networking
  describe("VPC and Network Configuration", () => {
    test("creates VPC with proper configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(terraformContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(terraformContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(terraformContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates internet gateway", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(terraformContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets with proper configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(terraformContent).toMatch(/count\s*=\s*length\(var\.public_subnets\)/);
      expect(terraformContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(terraformContent).toMatch(/count\s*=\s*length\(var\.private_subnets\)/);
    });

    test("creates database subnets", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(terraformContent).toMatch(/count\s*=\s*length\(var\.database_subnets\)/);
    });

    test("creates NAT gateways with EIPs", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(terraformContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(terraformContent).toMatch(/domain\s*=\s*"vpc"/);
    });
  });

  // Security groups
  describe("Security Group Configuration", () => {
    test("creates ALB security group with proper rules", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(terraformContent).toMatch(/ingress\s*\{[\s\S]*?from_port\s*=\s*80/);
      expect(terraformContent).toMatch(/ingress\s*\{[\s\S]*?from_port\s*=\s*443/);
      expect(terraformContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("creates app security group with restricted access", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(terraformContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      expect(terraformContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.bastion\.id\]/);
    });

    test("creates database security group with app-only access", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      expect(terraformContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
      expect(terraformContent).toMatch(/from_port\s*=\s*3306/);
    });

    test("creates bastion security group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
      expect(terraformContent).toMatch(/from_port\s*=\s*22/);
      expect(terraformContent).toMatch(/cidr_blocks\s*=\s*var\.allowed_ssh_cidrs/);
    });

    test("all security groups have lifecycle management", () => {
      // Extract each security group resource block properly
      const securityGroups = terraformContent.match(/resource\s+"aws_security_group"[^}]*?\{[\s\S]*?(?=\n\s*resource|\n\s*#|\n\s*output|\n\s*$|\n\s*data)/g) || [];
      
      securityGroups.forEach((sg) => {
        expect(sg).toMatch(/lifecycle\s*\{[\s\S]*?create_before_destroy\s*=\s*true/);
      });
    });
  });

  // S3 configuration
  describe("S3 Bucket Configuration", () => {
    test("creates S3 buckets with random suffix", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_bucket"/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_bucket"/);
      expect(terraformContent).toMatch(/bucket\s*=.*random_id\.suffix\.hex/);
    });

    test("configures S3 encryption with KMS", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(terraformContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("enables S3 versioning", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("blocks public access", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(terraformContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("configures bucket policies for security", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
      expect(terraformContent).toMatch(/DenyInsecureConnections/);
      expect(terraformContent).toMatch(/aws:SecureTransport/);
    });
  });

  // RDS configuration
  describe("RDS Database Configuration", () => {
    test("creates RDS instance with latest MySQL version", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(terraformContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(terraformContent).toMatch(/engine_version\s*=\s*"8\.0\.42"/);
    });

    test("RDS uses random password without special characters", () => {
      expect(terraformContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test("RDS is encrypted with KMS", () => {
      expect(terraformContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS is in private database subnets", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_db_subnet_group"/);
      expect(terraformContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
      expect(terraformContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has monitoring and backup configuration", () => {
      expect(terraformContent).toMatch(/performance_insights_enabled\s*=\s*false/);
      expect(terraformContent).toMatch(/backup_retention_period/);
      expect(terraformContent).toMatch(/monitoring_role_arn/);
    });

    test("RDS has final snapshot protection enabled", () => {
      expect(terraformContent).toMatch(/skip_final_snapshot\s*=\s*false/);
      expect(terraformContent).toMatch(/final_snapshot_identifier\s*=.*-final-snapshot-/);
    });
  });

  // Load balancer configuration
  describe("Application Load Balancer Configuration", () => {
    test("creates ALB in public subnets", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(terraformContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(terraformContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
      expect(terraformContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB access logging is enabled for security compliance", () => {
      // ALB access logging is enabled for security compliance
      expect(terraformContent).toMatch(/# Access logs enabled for security compliance/);
      expect(terraformContent).toMatch(/access_logs\s*\{/);
      expect(terraformContent).toMatch(/enabled\s*=\s*true/);
    });

    test("creates target group with health checks", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lb_target_group"/);
      expect(terraformContent).toMatch(/health_check\s*\{/);
      expect(terraformContent).toMatch(/path\s*=\s*"\/health"/);
    });

    test("creates ALB listener with proper action", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lb_listener"/);
      expect(terraformContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(terraformContent).toMatch(/forward\s*\{/);
    });

    test("creates HTTPS listener with SSL certificate", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lb_listener"\s+"app_https"/);
      expect(terraformContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(terraformContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
      expect(terraformContent).toMatch(/certificate_arn\s*=\s*aws_acm_certificate\.main\.arn/);
    });

    test("HTTP listener redirects to HTTPS", () => {
      expect(terraformContent).toMatch(/redirect\s*\{/);
      expect(terraformContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(terraformContent).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });
  });

  // Auto scaling configuration
  describe("Auto Scaling Configuration", () => {
    test("creates launch template with proper configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_launch_template"/);
      expect(terraformContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(terraformContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
    });

    test("launch template has encrypted EBS volumes", () => {
      expect(terraformContent).toMatch(/block_device_mappings\s*\{/);
      expect(terraformContent).toMatch(/encrypted\s*=\s*true/);
      expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("creates auto scaling group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_autoscaling_group"/);
      expect(terraformContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(terraformContent).toMatch(/target_group_arns/);
    });

    test("auto scaling group has proper scaling configuration", () => {
      expect(terraformContent).toMatch(/min_size\s*=\s*2/);
      expect(terraformContent).toMatch(/max_size\s*=\s*4/);
      expect(terraformContent).toMatch(/desired_capacity\s*=\s*2/);
    });
  });

  // WAF configuration
  describe("WAF Configuration", () => {
    test("creates WAF Web ACL with managed rules", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_wafv2_web_acl"/);
      expect(terraformContent).toMatch(/scope\s*=\s*"REGIONAL"/);
      expect(terraformContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test("WAF logging is properly configured", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"/);
      expect(terraformContent).toMatch(/aws-waf-logs-.*-security-waf-/);
    });

    test("WAF is associated with ALB", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
      expect(terraformContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
    });
  });

  // IAM configuration
  describe("IAM Configuration", () => {
    test("creates EC2 IAM role with proper permissions", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(terraformContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test("EC2 role has S3 access policy", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
      expect(terraformContent).toMatch(/s3:GetObject/);
      expect(terraformContent).toMatch(/s3:PutObject/);
    });

    test("creates instance profile for EC2", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
      expect(terraformContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test("creates monitoring roles for RDS", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
      expect(terraformContent).toMatch(/monitoring\.rds\.amazonaws\.com/);
    });
  });

  // CloudWatch and monitoring
  describe("CloudWatch and Monitoring", () => {
    test("creates CloudWatch log groups with encryption", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(terraformContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("creates VPC Flow Logs", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_flow_log"/);
      expect(terraformContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("creates CloudWatch alarms", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(terraformContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(terraformContent).toMatch(/HTTPCode_ELB_5XX_Count/);
    });
  });

  // Route 53 configuration
  describe("Route 53 Configuration", () => {
    test("creates hosted zone conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_route53_zone"/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("creates A record for ALB", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_route53_record"/);
      expect(terraformContent).toMatch(/alias\s*\{/);
      expect(terraformContent).toMatch(/name\s*=\s*aws_lb\.main\.dns_name/);
    });
  });

  // Bastion host configuration
  describe("Bastion Host Configuration", () => {
    test("creates bastion host conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_instance"\s+"bastion"/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.create_bastion_host\s*\?\s*1\s*:\s*0/);
    });

    test("bastion host is in public subnet with proper security", () => {
      expect(terraformContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
      expect(terraformContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.bastion\.id\]/);
    });
  });

  // Resource naming and tagging
  describe("Resource Naming and Tagging", () => {
    test("all major resources use name_prefix pattern", () => {
      const namePatterns = [
        /Name\s*=\s*".*\$\{local\.name_prefix\}/,
        /name\s*=\s*".*\$\{local\.name_prefix\}/,
        /identifier\s*=\s*".*\$\{local\.name_prefix\}/
      ];
      
      const hasNamingPattern = namePatterns.some(pattern => pattern.test(terraformContent));
      expect(hasNamingPattern).toBe(true);
    });

    test("resources use common_tags consistently", () => {
      expect(terraformContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(terraformContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("resources include environment suffix in naming", () => {
      expect(terraformContent).toMatch(/random_id\.suffix\.hex/);
      expect(terraformContent).toMatch(/local\.environment_suffix/);
    });
  });

  // Output validation
  describe("Output Configuration", () => {
    test("defines essential infrastructure outputs", () => {
      expect(terraformContent).toMatch(/output\s+"vpc_id"/);
      expect(terraformContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(terraformContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(terraformContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test("outputs include security-related resources", () => {
      expect(terraformContent).toMatch(/output\s+"web_security_group_id"/);
      expect(terraformContent).toMatch(/output\s+"app_security_group_id"/);
      expect(terraformContent).toMatch(/output\s+"database_security_group_id"/);
      expect(terraformContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test("sensitive outputs are marked as sensitive", () => {
      expect(terraformContent).toMatch(/output\s+"database_endpoint"[\s\S]*?sensitive\s*=\s*true/);
      expect(terraformContent).toMatch(/output\s+"bastion_public_ip"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("outputs have proper descriptions", () => {
      const outputBlocks = terraformContent.match(/output\s+"[^"]+"\s*\{[^}]+\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  // Security best practices validation
  describe("Security Best Practices", () => {
    test("no hardcoded secrets or credentials", () => {
      expect(terraformContent).not.toMatch(/password\s*=\s*"[^"]+"(?!.*random_password)/);
      expect(terraformContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
      expect(terraformContent).not.toMatch(/key\s*=\s*"[A-Z0-9]{20,}"/);
    });

    test("database password uses random generation", () => {
      expect(terraformContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
      expect(terraformContent).toMatch(/special\s*=\s*false/);
    });

    test("all storage is encrypted", () => {
      expect(terraformContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(terraformContent).toMatch(/encrypted\s*=\s*true/);
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("network security is properly configured", () => {
      // Check that application and database security groups don't have 0.0.0.0/0 on ingress rules
      const sgBlocks = terraformContent.match(/resource\s+"aws_security_group"\s+"(?:app|database)"[\s\S]*?(?=resource\s|$)/g) || [];
      sgBlocks.forEach(block => {
        // Extract only ingress rules and check they don't have 0.0.0.0/0
        const ingressRules = block.match(/ingress\s*\{[\s\S]*?\}/g) || [];
        ingressRules.forEach(rule => {
          expect(rule).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
        });
      });
      
      // Verify security group references are used for secure access
      expect(terraformContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.\w+\.id\]/);
    });

    test("proper backup and recovery configuration", () => {
      expect(terraformContent).toMatch(/backup_retention_period/);
      expect(terraformContent).toMatch(/versioning_configuration/);
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  // Performance and scalability
  describe("Performance and Scalability Configuration", () => {
    test("auto scaling is properly configured", () => {
      expect(terraformContent).toMatch(/min_size\s*=\s*2/);
      expect(terraformContent).toMatch(/max_size\s*=\s*4/);
      expect(terraformContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("storage types are optimized", () => {
      expect(terraformContent).toMatch(/storage_type\s*=\s*"gp3"/);
      expect(terraformContent).toMatch(/volume_type\s*=\s*"gp3"/);
    });

    test("monitoring and alerting configured", () => {
      expect(terraformContent).toMatch(/performance_insights_enabled\s*=\s*false/);
      expect(terraformContent).toMatch(/monitoring_interval\s*=\s*60/);
    });
  });
});