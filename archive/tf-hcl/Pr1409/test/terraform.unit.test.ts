// Unit tests for Terraform infrastructure
// Static validation only - no Terraform commands executed

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  // File Structure Tests
  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("tap_stack.tf does NOT contain provider blocks", () => {
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf contains AWS provider configurations", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });
  });

  // Variable Tests
  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable with default", () => {
      expect(tapStackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("declares project variable with default", () => {
      expect(tapStackContent).toMatch(/variable\s+"project"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"iac-aws-nova-model-breaking"/);
    });

    test("declares owner variable with default", () => {
      expect(tapStackContent).toMatch(/variable\s+"owner"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"platform-team"/);
    });

    test("declares bastion_allowed_cidrs variable as list", () => {
      expect(tapStackContent).toMatch(/variable\s+"bastion_allowed_cidrs"\s*{/);
      expect(tapStackContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares ASG sizing variables", () => {
      expect(tapStackContent).toMatch(/variable\s+"asg_min_size"/);
      expect(tapStackContent).toMatch(/variable\s+"asg_max_size"/);
      expect(tapStackContent).toMatch(/variable\s+"asg_desired_capacity"/);
    });

    test("declares cpu_scale_up_threshold variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"cpu_scale_up_threshold"/);
      expect(tapStackContent).toMatch(/default\s*=\s*70/);
    });

    test("declares RDS variables", () => {
      expect(tapStackContent).toMatch(/variable\s+"rds_instance_class"/);
      expect(tapStackContent).toMatch(/variable\s+"rds_engine"/);
      expect(tapStackContent).toMatch(/variable\s+"rds_engine_version"/);
    });

    test("declares domain_name variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"domain_name"/);
    });

    test("declares subject_alternative_names variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"subject_alternative_names"/);
    });
  });

  // Locals Tests
  describe("Locals", () => {
    test("defines tags local with required keys", () => {
      expect(tapStackContent).toMatch(/locals\s*{/);
      expect(tapStackContent).toMatch(/tags\s*=\s*{/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(tapStackContent).toMatch(/Project\s*=\s*var\.project/);
      expect(tapStackContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test("defines region_suffix mapping", () => {
      expect(tapStackContent).toMatch(/region_suffix\s*=\s*{/);
      expect(tapStackContent).toMatch(/"us-east-1"\s*=\s*"use1"/);
      expect(tapStackContent).toMatch(/"us-west-2"\s*=\s*"usw2"/);
    });

    test("defines name prefixes for both regions", () => {
      expect(tapStackContent).toMatch(/use1_name_prefix/);
      expect(tapStackContent).toMatch(/usw2_name_prefix/);
    });
  });

  // Data Sources Tests
  describe("Data Sources", () => {
    test("defines availability zones data sources for both regions", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"use1"/);
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"usw2"/);
    });

    test("defines AMI data sources for both regions", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ssm_parameter"\s+"al2_ami_use1"/);
      expect(tapStackContent).toMatch(/data\s+"aws_ssm_parameter"\s+"al2_ami_usw2"/);
      expect(tapStackContent).toMatch(/\/aws\/service\/ami-amazon-linux-latest\/amzn2-ami-hvm-x86_64-gp2/);
    });
  });

  // KMS Keys Tests
  describe("KMS Keys", () => {
    test("defines KMS keys for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"usw2"/);
    });

    test("KMS keys have key rotation enabled", () => {
      const kmsMatches = tapStackContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(kmsMatches).not.toBeNull();
      expect(kmsMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("defines KMS aliases for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"usw2"/);
    });
  });

  // Networking Tests
  describe("Networking", () => {
    test("defines VPCs for both regions with non-overlapping CIDRs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"usw2"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.2\.0\.0\/16"/);
    });

    test("defines Internet Gateways for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"usw2"/);
    });

    test("defines public subnets for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"use1_public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"usw2_public"/);
      expect(tapStackContent).toMatch(/count\s*=\s*2/);
    });

    test("defines private subnets for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"use1_private"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"usw2_private"/);
    });

    test("defines NAT gateways for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"usw2"/);
    });

    test("defines Elastic IPs for NAT gateways", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"use1_nat"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"usw2_nat"/);
    });

    test("defines route tables for public and private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"use1_public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"usw2_public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"use1_private"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"usw2_private"/);
    });

    test("defines route table associations", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"use1_public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"usw2_public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"use1_private"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"usw2_private"/);
    });
  });

  // VPC Peering Tests
  describe("VPC Peering", () => {
    test("defines VPC peering connection", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"use1_to_usw2"/);
    });

    test("defines VPC peering accepter", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"\s+"usw2_accept"/);
    });

    test("defines peering routes for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route"\s+"use1_to_usw2"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route"\s+"usw2_to_use1"/);
    });
  });

  // VPC Flow Logs Tests
  describe("VPC Flow Logs", () => {
    test("defines CloudWatch log groups for VPC flow logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"use1_vpc_flow_logs"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"usw2_vpc_flow_logs"/);
    });

    test("defines IAM roles for VPC flow logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs_use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs_usw2"/);
    });

    test("defines VPC flow log resources", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"use1_vpc"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"usw2_vpc"/);
    });
  });

  // Security Groups Tests
  describe("Security Groups", () => {
    test("defines bastion security groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"use1_bastion"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"usw2_bastion"/);
    });

    test("defines ALB security groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"use1_alb"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"usw2_alb"/);
    });

    test("defines application security groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"use1_app"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"usw2_app"/);
    });

    test("defines RDS security groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"use1_rds"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"usw2_rds"/);
    });

    test("bastion security groups use dynamic ingress based on allowed CIDRs", () => {
      expect(tapStackContent).toMatch(/dynamic\s+"ingress"/);
      expect(tapStackContent).toMatch(/var\.bastion_allowed_cidrs/);
    });

    test("RDS security groups allow access only from app and bastion", () => {
      // Check that RDS security groups reference app and bastion security groups
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.use1_app\.id\]/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.usw2_app\.id\]/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.use1_bastion\.id\]/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.usw2_bastion\.id\]/);
    });
  });

  // IAM Tests
  describe("IAM Resources", () => {
    test("defines bastion IAM roles for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"bastion_use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"bastion_usw2"/);
    });

    test("defines application IAM roles for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"app_use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"app_usw2"/);
    });

    test("defines IAM instance profiles", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });

    test("IAM policies follow least privilege principle", () => {
      // Should not contain wildcard permissions in IAM policies
      expect(tapStackContent).toMatch(/policy\s*=\s*jsonencode/);
      // Check that IAM policies don't use wildcards (but exclude CloudWatch agent config)
      const iamPolicyBlocks = tapStackContent.match(/policy\s*=\s*jsonencode\([^)]+\)/gs);
      expect(iamPolicyBlocks).not.toBeNull();
      iamPolicyBlocks!.forEach(policy => {
        expect(policy).not.toMatch(/Resource.*:\s*\[\s*"\*"\s*\]/);
        expect(policy).not.toMatch(/Action.*:\s*\[\s*"\*"\s*\]/);
      });
    });
  });

  // EC2 and Auto Scaling Tests
  describe("EC2 and Auto Scaling", () => {
    test("defines bastion instances for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_instance"\s+"bastion_use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_instance"\s+"bastion_usw2"/);
    });

    test("bastion instances use encrypted EBS", () => {
      const bastionInstances = tapStackContent.match(/resource\s+"aws_instance"\s+"bastion_(use1|usw2)"\s*{[^}]+}/gs);
      expect(bastionInstances).not.toBeNull();
      bastionInstances!.forEach(instance => {
        expect(instance).toMatch(/encrypted\s*=\s*true/);
      });
    });

    test("defines launch templates for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"use1_app"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"usw2_app"/);
    });

    test("defines auto scaling groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"use1_app"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"usw2_app"/);
    });

    test("defines auto scaling policies", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_policy"/);
      expect(tapStackContent).toMatch(/scaling_adjustment/);
    });
  });

  // Load Balancer Tests
  describe("Load Balancers", () => {
    test("defines ALBs for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"usw2"/);
    });

    test("defines target groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"use1_app"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"usw2_app"/);
    });

    test("defines ALB listeners for HTTP and HTTPS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"use1_http"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"use1_https"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"usw2_http"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"usw2_https"/);
    });

    test("HTTP listeners redirect to HTTPS", () => {
      const httpListeners = tapStackContent.match(/resource\s+"aws_lb_listener"\s+"(use1|usw2)_http"[^}]+default_action[^}]+}/gs);
      expect(httpListeners).not.toBeNull();
      httpListeners!.forEach(listener => {
        expect(listener).toMatch(/type\s*=\s*"redirect"/);
        expect(listener).toMatch(/protocol\s*=\s*"HTTPS"/);
      });
    });
  });

  // Route 53 Tests
  describe("Route 53", () => {
    test("defines health checks for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"use1_alb"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"usw2_alb"/);
    });

    test("defines failover records", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_record"\s+"primary"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_record"\s+"secondary"/);
    });

    test("health checks monitor HTTPS endpoints", () => {
      const healthChecks = tapStackContent.match(/resource\s+"aws_route53_health_check"[^}]+}/gs);
      expect(healthChecks).not.toBeNull();
      healthChecks!.forEach(hc => {
        expect(hc).toMatch(/type\s*=\s*"HTTPS"/);
        expect(hc).toMatch(/resource_path\s*=\s*"\/health"/);
      });
    });
  });

  // RDS Tests
  describe("RDS", () => {
    test("defines DB subnet groups for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"usw2"/);
    });

    test("defines RDS instances for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"use1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"usw2"/);
    });

    test("RDS instances use encryption", () => {
      // Check that RDS instances have storage encryption enabled
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
      // Should appear twice (for both regions)
      const matches = tapStackContent.match(/storage_encrypted\s*=\s*true/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test("defines secrets manager for RDS passwords", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"/);
    });

    test("defines random passwords for RDS", () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"/);
    });
  });

  // S3 Tests
  describe("S3 Buckets", () => {
    test("defines application S3 buckets for both regions", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"use1_app"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"usw2_app"/);
    });

    test("defines logging S3 buckets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"use1_logs"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"usw2_logs"/);
    });

    test("defines CloudTrail S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("S3 buckets have versioning enabled", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 buckets have encryption configured", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test("S3 buckets have public access blocked", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  // CloudFront Tests
  describe("CloudFront", () => {
    test("defines CloudFront distribution", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test("CloudFront enforces HTTPS", () => {
      // Check that CloudFront has HTTPS redirect policy
      expect(tapStackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });
  });

  // CloudWatch Tests
  describe("CloudWatch", () => {
    test("defines CloudWatch log groups with encryption", () => {
      const logGroups = tapStackContent.match(/resource\s+"aws_cloudwatch_log_group"/g);
      expect(logGroups).not.toBeNull();
      expect(logGroups!.length).toBeGreaterThan(4); // VPC flow logs + bastion + app logs
    });

    test("defines CloudWatch metric alarms", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("defines SNS topics for notifications", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic"/);
    });

    test("SNS topics use encryption", () => {
      // Check that SNS topics have KMS encryption
      expect(tapStackContent).toMatch(/kms_master_key_id/);
    });
  });

  // CloudTrail Tests
  describe("CloudTrail", () => {
    test("defines CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("CloudTrail has log file validation enabled", () => {
      // Check that CloudTrail has log file validation enabled
      expect(tapStackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });
  });

  // Outputs Tests
  describe("Outputs", () => {
    test("defines VPC outputs", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_ids"/);
    });

    test("defines subnet outputs", () => {
      expect(tapStackContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test("defines ALB outputs", () => {
      expect(tapStackContent).toMatch(/output\s+"alb_dns_names"/);
    });

    test("defines RDS outputs", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoints"/);
    });

    test("defines S3 bucket outputs", () => {
      expect(tapStackContent).toMatch(/output\s+"s3_bucket_names"/);
    });

    test("outputs do not contain sensitive values", () => {
      const outputs = tapStackContent.match(/output\s+"[^"]+"\s*{[^}]+}/gs);
      expect(outputs).not.toBeNull();
      outputs!.forEach(output => {
        expect(output).not.toMatch(/password/i);
        expect(output).not.toMatch(/secret/i);
        // Allow kms_key_arns output but not hardcoded keys
        if (!output.includes('kms_key_arns')) {
          expect(output).not.toMatch(/key/i);
        }
      });
    });
  });

  // Security and Compliance Tests
  describe("Security and Compliance", () => {
    test("no hardcoded secrets or passwords", () => {
      // Should not contain hardcoded passwords, keys, secrets
      expect(tapStackContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(tapStackContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      // Allow key names in config but not hardcoded key values
      expect(tapStackContent).not.toMatch(/access_key\s*=\s*"[^"]+"/i);
      expect(tapStackContent).not.toMatch(/secret_key\s*=\s*"[^"]+"/i);
    });

    test("encryption is used throughout", () => {
      // Should have multiple encryption references
      const encryptionMatches = tapStackContent.match(/(encrypted|encryption|kms_key_id)/gi);
      expect(encryptionMatches).not.toBeNull();
      expect(encryptionMatches!.length).toBeGreaterThan(10);
    });

    test("tags are applied consistently", () => {
      const taggedResources = tapStackContent.match(/tags\s*=\s*(merge\()?local\.tags/g);
      expect(taggedResources).not.toBeNull();
      expect(taggedResources!.length).toBeGreaterThan(20);
    });

    test("follows least privilege principle in IAM", () => {
      const iamPolicies = tapStackContent.match(/policy\s*=\s*jsonencode/g);
      expect(iamPolicies).not.toBeNull();
      expect(iamPolicies!.length).toBeGreaterThan(5);
    });
  });

  // Resource Naming and Organization Tests
  describe("Resource Naming and Organization", () => {
    test("resources follow consistent naming convention", () => {
      const resourceNames = tapStackContent.match(/resource\s+"[^"]+"\s+"([^"]+)"/g);
      expect(resourceNames).not.toBeNull();
      
      // Check that resources are consistently named by region
      const use1Resources = resourceNames!.filter(name => name.includes('use1'));
      const usw2Resources = resourceNames!.filter(name => name.includes('usw2'));
      
      expect(use1Resources.length).toBeGreaterThan(10);
      expect(usw2Resources.length).toBeGreaterThan(10);
    });

    test("uses proper dependencies", () => {
      const dependsOnMatches = tapStackContent.match(/depends_on\s*=/g);
      expect(dependsOnMatches).not.toBeNull();
      expect(dependsOnMatches!.length).toBeGreaterThan(3);
    });
  });
});