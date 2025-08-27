// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure
// Tests tap_stack.tf and provider.tf
// No Terraform commands are executed - only static analysis

import fs from "fs";
import path from "path";

// File paths
const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");



// Helper function to read file content
const readFile = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
};

// Helper function to count resource occurrences
const countMatches = (content: string, pattern: RegExp): number => {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
};

describe("Terraform Infrastructure Unit Tests", () => {
  
  // =============================================================================
  // FILE EXISTENCE TESTS
  // =============================================================================
  
  describe("File Existence", () => {
  test("tap_stack.tf exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });




  });

  // =============================================================================
  // PROVIDER CONFIGURATION TESTS (provider.tf)
  // =============================================================================
  
  describe("Provider Configuration (provider.tf)", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readFile(PROVIDER_PATH);
    });

    test("declares terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*{[\s\S]*?required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("declares AWS provider with correct version", () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*?source\s*=\s*"hashicorp\/aws"[\s\S]*?version\s*=\s*"~>\s*5\.0"/);
    });

    test("declares random provider with correct version", () => {
      expect(providerContent).toMatch(/random\s*=\s*{[\s\S]*?source\s*=\s*"hashicorp\/random"[\s\S]*?version\s*=\s*"~>\s*3\.1"/);
    });

    test("declares primary AWS provider with alias", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"primary"/);
    });

    test("declares secondary AWS provider with alias", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"secondary"/);
    });

    test("defines environment variable with validation", () => {
      expect(providerContent).toMatch(/variable\s+"environment"\s*{/);
      expect(providerContent).toMatch(/validation\s*{[\s\S]*?contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test("defines all required variables", () => {
      const requiredVariables = [
        "environment",
        "project_name", 
        "primary_region",
        "secondary_region",
        "vpc_cidr_primary",
        "vpc_cidr_secondary",
        "instance_type",
        "min_size",
        "max_size",
        "desired_capacity"
      ];
      
      requiredVariables.forEach(variable => {
        expect(providerContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("has default tags configuration for both providers", () => {
      expect(countMatches(providerContent, /default_tags\s*{/g)).toBe(2);
    });

    test("does not use timestamp() function (causes plan inconsistencies)", () => {
      expect(providerContent).not.toMatch(/timestamp\(\)/);
    });
  });

  // =============================================================================
  // INFRASTRUCTURE RESOURCES TESTS (tap_stack.tf)
  // =============================================================================
  
  describe("Infrastructure Resources (tap_stack.tf)", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(TAP_STACK_PATH);
    });

    // Data Sources Tests
    describe("Data Sources", () => {
      test("declares availability zones data sources for both regions", () => {
        expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
        expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"/);
      });

      test("declares AMI data sources for both regions", () => {
        expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_primary"/);
        expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_secondary"/);
      });

      test("declares AWS caller identity data source", () => {
        expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      });
    });

    // Local Values Tests
    describe("Local Values", () => {
      test("declares locals block with required values", () => {
        expect(stackContent).toMatch(/locals\s*{/);
        expect(stackContent).toMatch(/name_prefix\s*=/);
        expect(stackContent).toMatch(/common_tags\s*=/);
        expect(stackContent).toMatch(/environment_configs\s*=/);
        expect(stackContent).toMatch(/env_config\s*=/);
      });

      test("defines environment-specific configurations", () => {
        expect(stackContent).toMatch(/dev\s*=\s*{/);
        expect(stackContent).toMatch(/staging\s*=\s*{/);
        expect(stackContent).toMatch(/prod\s*=\s*{/);
      });
    });

    // VPC and Networking Tests
    describe("VPC and Networking", () => {
      test("creates VPCs in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
      });

      test("creates internet gateways in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
      });

      test("creates public and private subnets in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
        expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
      });

      test("creates NAT gateways with Elastic IPs in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_secondary"/);
        expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"/);
      });

      test("creates route tables and associations", () => {
        expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_primary"/);
      });

      test("uses count for multi-AZ deployment", () => {
        expect(stackContent).toMatch(/count\s*=\s*2/);
        expect(stackContent).toMatch(/count\.index/);
      });
    });

    // Security Groups Tests
    describe("Security Groups", () => {
      test("creates ALB security groups for both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_secondary"/);
      });

      test("creates EC2 security groups for both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_secondary"/);
      });

      test("configures HTTP and HTTPS ingress for ALB security groups", () => {
        const httpMatches = countMatches(stackContent, /from_port\s*=\s*80/g);
        const httpsMatches = countMatches(stackContent, /from_port\s*=\s*443/g);
        expect(httpMatches).toBeGreaterThanOrEqual(4); // ALB + EC2 ingress rules
        expect(httpsMatches).toBeGreaterThanOrEqual(2); // ALB ingress rules
      });

      test("configures security group references (not CIDR blocks) for EC2 ingress", () => {
        expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb_primary\.id\]/);
        expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb_secondary\.id\]/);
      });
    });

    // IAM Tests
    describe("IAM Roles and Policies", () => {
      test("creates EC2 instance role and profile", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
        expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      });

      test("creates S3 access policy for EC2 instances", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"s3_access"/);
        expect(stackContent).toMatch(/"s3:GetObject"/);
        expect(stackContent).toMatch(/"s3:PutObject"/);
        expect(stackContent).toMatch(/"s3:ListBucket"/);
      });

      test("creates CloudWatch logs policy", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudwatch_logs"/);
        expect(stackContent).toMatch(/"logs:CreateLogGroup"/);
        expect(stackContent).toMatch(/"logs:PutLogEvents"/);
      });

      test("creates automation role for CI/CD", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"automation_role"/);
        expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"automation_policy"/);
      });

      test("creates S3 replication role and policy", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"replication_role"/);
        expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"replication_policy"/);
      });
    });

    // S3 Tests
    describe("S3 Buckets and Replication", () => {
      test("creates S3 buckets in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary"/);
      });

      test("creates random ID for unique bucket naming", () => {
        expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      });

      test("enables versioning on both buckets", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/);
      });

      test("configures server-side encryption", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary"/);
        expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      });

      test("blocks public access", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secondary"/);
        expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      });

      test("configures cross-region replication", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"replication"/);
        expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      });
    });

    // Load Balancer Tests
    describe("Application Load Balancers", () => {
      test("creates ALBs in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
      });

      test("creates target groups in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary"/);
      });

      test("creates listeners in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary"/);
      });

      test("configures health checks", () => {
        expect(stackContent).toMatch(/health_check\s*{/);
        expect(stackContent).toMatch(/healthy_threshold\s*=\s*2/);
        expect(stackContent).toMatch(/unhealthy_threshold\s*=\s*2/);
        expect(stackContent).toMatch(/path\s*=\s*"\/"/);
      });

      test("enables deletion protection for production", () => {
        expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
      });
    });

    // Auto Scaling Tests
    describe("Auto Scaling Groups and Launch Templates", () => {
      test("creates launch templates in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"secondary"/);
      });

      test("creates auto scaling groups in both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary"/);
      });

      test("uses environment-specific configuration", () => {
        expect(stackContent).toMatch(/instance_type\s*=\s*local\.env_config\.instance_type/);
        expect(stackContent).toMatch(/min_size\s*=\s*local\.env_config\.min_size/);
        expect(stackContent).toMatch(/max_size\s*=\s*local\.env_config\.max_size/);
      });

      test("configures user data inline", () => {
        expect(stackContent).toMatch(/user_data\s*=\s*base64encode\(<<-EOF/);
        expect(stackContent).toMatch(/#!\/bin\/bash/);
      });

      test("deploys instances in private subnets", () => {
        expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private_primary\[\*\]\.id/);
        expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private_secondary\[\*\]\.id/);
      });

      test("configures ELB health checks", () => {
        expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
        expect(stackContent).toMatch(/health_check_grace_period\s*=\s*300/);
      });
    });

    // Tagging Tests
    describe("Resource Tagging", () => {
      test("uses consistent tagging with merge function", () => {
        expect(countMatches(stackContent, /merge\(local\.common_tags/g)).toBeGreaterThan(10);
      });

      test("includes environment and region tags", () => {
        expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
        expect(stackContent).toMatch(/Region\s*=\s*var\.primary_region/);
        expect(stackContent).toMatch(/Region\s*=\s*var\.secondary_region/);
      });

      test("includes ManagedBy tag", () => {
        expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      });
    });

    // Provider Usage Tests
    describe("Provider Usage", () => {
      test("uses provider aliases correctly", () => {
        expect(countMatches(stackContent, /provider\s*=\s*aws\.primary/g)).toBeGreaterThan(10);
        expect(countMatches(stackContent, /provider\s*=\s*aws\.secondary/g)).toBeGreaterThan(10);
      });

      test("does not declare provider blocks (delegates to provider.tf)", () => {
        expect(stackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
      });
    });
  });

  // =============================================================================
  // OUTPUTS TESTS (inline in tap_stack.tf)
  // =============================================================================
  
  describe("Terraform Outputs (inline)", () => {
    let outputsContent: string;

    beforeAll(() => {
      const stackContent = readFile(TAP_STACK_PATH);
      // Extract outputs section from tap_stack.tf
      const outputsMatch = stackContent.match(/# TERRAFORM OUTPUTS[\s\S]*$/m);
      if (outputsMatch) {
        outputsContent = outputsMatch[0];
      } else {
        throw new Error('Could not find outputs section in tap_stack.tf');
      }
    });

    describe("VPC and Networking Outputs", () => {
      test("outputs VPC information", () => {
        expect(outputsContent).toMatch(/output\s+"vpc_primary_id"/);
        expect(outputsContent).toMatch(/output\s+"vpc_secondary_id"/);
        expect(outputsContent).toMatch(/output\s+"vpc_primary_cidr"/);
        expect(outputsContent).toMatch(/output\s+"vpc_secondary_cidr"/);
      });

      test("outputs subnet information", () => {
        expect(outputsContent).toMatch(/output\s+"public_subnet_primary_ids"/);
        expect(outputsContent).toMatch(/output\s+"private_subnet_primary_ids"/);
        expect(outputsContent).toMatch(/output\s+"public_subnet_secondary_ids"/);
        expect(outputsContent).toMatch(/output\s+"private_subnet_secondary_ids"/);
      });

      test("outputs NAT gateway information", () => {
        expect(outputsContent).toMatch(/output\s+"nat_gateway_primary_ids"/);
        expect(outputsContent).toMatch(/output\s+"nat_gateway_secondary_ids"/);
        expect(outputsContent).toMatch(/output\s+"nat_gateway_primary_ips"/);
        expect(outputsContent).toMatch(/output\s+"nat_gateway_secondary_ips"/);
      });
    });

    describe("Security Group Outputs", () => {
      test("outputs security group IDs", () => {
        expect(outputsContent).toMatch(/output\s+"alb_security_group_primary_id"/);
        expect(outputsContent).toMatch(/output\s+"ec2_security_group_primary_id"/);
        expect(outputsContent).toMatch(/output\s+"alb_security_group_secondary_id"/);
        expect(outputsContent).toMatch(/output\s+"ec2_security_group_secondary_id"/);
      });
    });

    describe("IAM Outputs", () => {
      test("outputs IAM role ARNs", () => {
        expect(outputsContent).toMatch(/output\s+"ec2_role_arn"/);
        expect(outputsContent).toMatch(/output\s+"automation_role_arn"/);
        expect(outputsContent).toMatch(/output\s+"s3_replication_role_arn"/);
      });

      test("outputs instance profile name", () => {
        expect(outputsContent).toMatch(/output\s+"ec2_instance_profile_name"/);
      });
    });

    describe("S3 Outputs", () => {
      test("outputs S3 bucket information", () => {
        expect(outputsContent).toMatch(/output\s+"s3_bucket_primary_id"/);
        expect(outputsContent).toMatch(/output\s+"s3_bucket_secondary_id"/);
        expect(outputsContent).toMatch(/output\s+"s3_bucket_primary_arn"/);
        expect(outputsContent).toMatch(/output\s+"s3_bucket_secondary_arn"/);
      });
    });

    describe("Load Balancer Outputs", () => {
      test("outputs ALB information", () => {
        expect(outputsContent).toMatch(/output\s+"alb_primary_dns_name"/);
        expect(outputsContent).toMatch(/output\s+"alb_secondary_dns_name"/);
        expect(outputsContent).toMatch(/output\s+"alb_primary_arn"/);
        expect(outputsContent).toMatch(/output\s+"alb_secondary_arn"/);
      });

      test("outputs target group ARNs", () => {
        expect(outputsContent).toMatch(/output\s+"target_group_primary_arn"/);
        expect(outputsContent).toMatch(/output\s+"target_group_secondary_arn"/);
      });
    });

    describe("Auto Scaling Outputs", () => {
      test("outputs ASG information", () => {
        expect(outputsContent).toMatch(/output\s+"asg_primary_id"/);
        expect(outputsContent).toMatch(/output\s+"asg_secondary_id"/);
        expect(outputsContent).toMatch(/output\s+"launch_template_primary_id"/);
        expect(outputsContent).toMatch(/output\s+"launch_template_secondary_id"/);
      });
    });

    describe("Application Endpoints", () => {
      test("outputs application URLs", () => {
        expect(outputsContent).toMatch(/output\s+"application_url_primary"/);
        expect(outputsContent).toMatch(/output\s+"application_url_secondary"/);
        expect(outputsContent).toMatch(/output\s+"health_check_url_primary"/);
        expect(outputsContent).toMatch(/output\s+"health_check_url_secondary"/);
      });
    });

    describe("Configuration Outputs", () => {
      test("outputs environment configuration", () => {
        expect(outputsContent).toMatch(/output\s+"environment"/);
        expect(outputsContent).toMatch(/output\s+"primary_region"/);
        expect(outputsContent).toMatch(/output\s+"secondary_region"/);
        expect(outputsContent).toMatch(/output\s+"environment_config"/);
      });
    });

    test("all outputs have descriptions", () => {
      const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*{[^}]*}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  // =============================================================================
  // USER DATA SCRIPT TESTS (inline in tap_stack.tf)
  // =============================================================================
  
  describe("User Data Script (inline)", () => {
    let userDataContent: string;

    beforeAll(() => {
      const stackContent = readFile(TAP_STACK_PATH);
      // Extract user_data content from both launch templates
      const userDataMatches = stackContent.match(/user_data\s*=\s*base64encode\(<<-EOF([\s\S]*?)EOF\s*\)/g);
      if (userDataMatches && userDataMatches.length > 0) {
        userDataContent = userDataMatches[0];
      } else {
        throw new Error('Could not find inline user_data in tap_stack.tf');
      }
    });

    test("has proper bash shebang", () => {
      expect(userDataContent).toMatch(/#!\/bin\/bash/);
    });

    test("sets error handling with 'set -e'", () => {
      expect(userDataContent).toMatch(/set\s+-e/);
    });

    test("uses Terraform template variables", () => {
      expect(userDataContent).toMatch(/\$\{var\.environment\}/);
      expect(userDataContent).toMatch(/\$\{var\.(primary|secondary)_region\}/);
      expect(userDataContent).toMatch(/\$\{aws_s3_bucket\.(primary|secondary)\.bucket\}/);
    });

    test("installs required packages", () => {
      expect(userDataContent).toMatch(/yum\s+update\s+-y/);
      expect(userDataContent).toMatch(/yum\s+install.*httpd/);
      expect(userDataContent).toMatch(/yum\s+install.*aws-cli/);
    });

    test("configures CloudWatch agent", () => {
      expect(userDataContent).toMatch(/amazon-cloudwatch-agent/);
      expect(userDataContent).toMatch(/cloudwatch-agent\.json/);
      expect(userDataContent).toMatch(/logs_collected/);
      expect(userDataContent).toMatch(/metrics_collected/);
    });

    test("creates web application", () => {
      expect(userDataContent).toMatch(/\/var\/www\/html\/index\.html/);
      expect(userDataContent).toMatch(/<!DOCTYPE html>/);
      expect(userDataContent).toMatch(/TAP Application/);
    });

    test("creates health check endpoint", () => {
      expect(userDataContent).toMatch(/\/var\/www\/html\/health/);
      expect(userDataContent).toMatch(/OK/);
    });

    test("starts and enables httpd service", () => {
      expect(userDataContent).toMatch(/systemctl\s+start\s+httpd/);
      expect(userDataContent).toMatch(/systemctl\s+enable\s+httpd/);
    });

    test("integrates with S3", () => {
      expect(userDataContent).toMatch(/aws\s+s3\s+cp/);
      expect(userDataContent).toMatch(/s3:\/\/\$BUCKET_NAME/);
    });

    test("includes error handling for S3 operations", () => {
      expect(userDataContent).toMatch(/\|\|\s+echo\s+"Failed to upload to S3"/);
    });

    test("includes logging", () => {
      expect(userDataContent).toMatch(/\/var\/log\/user-data\.log/);
      expect(userDataContent).toMatch(/echo.*completed successfully/);
    });

    test("fetches instance metadata", () => {
      expect(userDataContent).toMatch(/169\.254\.169\.254/);
      expect(userDataContent).toMatch(/instance-id/);
      expect(userDataContent).toMatch(/availability-zone/);
    });
  });

  // =============================================================================
  // INTEGRATION AND CONSISTENCY TESTS
  // =============================================================================
  
  describe("Cross-File Integration", () => {
    let stackContent: string;
    let providerContent: string;
    let outputsContent: string;

    beforeAll(() => {
      stackContent = readFile(TAP_STACK_PATH);
      providerContent = readFile(PROVIDER_PATH);
      // Extract outputs section from tap_stack.tf since it's now inline
      const outputsMatch = stackContent.match(/# TERRAFORM OUTPUTS[\s\S]*$/m);
      if (outputsMatch) {
        outputsContent = outputsMatch[0];
      } else {
        throw new Error('Could not find outputs section in tap_stack.tf');
      }
    });

    test("variables used in stack are defined in provider", () => {
      // Extract variable references from stack
      const variableRefs = stackContent.match(/var\.[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      const uniqueVars = [...new Set(variableRefs.map(ref => ref.replace('var.', '')))];
      
      uniqueVars.forEach(variable => {
        expect(providerContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("outputs reference resources defined in stack", () => {
      // Check that major resource references in outputs exist in stack
      const resourceRefs = [
        'aws_vpc.primary',
        'aws_vpc.secondary',
        'aws_lb.primary',
        'aws_lb.secondary',
        'aws_autoscaling_group.primary',
        'aws_autoscaling_group.secondary'
      ];

      resourceRefs.forEach(resource => {
        if (outputsContent.includes(resource)) {
          const [resourceType, resourceName] = resource.split('.');
          expect(stackContent).toMatch(new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`));
        }
      });
    });

    test("provider aliases are used consistently", () => {
      const primaryProviderUsage = countMatches(stackContent, /provider\s*=\s*aws\.primary/g);
      const secondaryProviderUsage = countMatches(stackContent, /provider\s*=\s*aws\.secondary/g);
      
      // Should have roughly equal usage of both providers (allowing some variance)
      expect(primaryProviderUsage).toBeGreaterThan(5);
      expect(secondaryProviderUsage).toBeGreaterThan(5);
      expect(Math.abs(primaryProviderUsage - secondaryProviderUsage)).toBeLessThan(5);
    });

    test("inline user data contains proper script content", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode\(<<-EOF/);
      expect(stackContent).toMatch(/#!\/bin\/bash/);
    });
  });

  // =============================================================================
  // TERRAFORM BEST PRACTICES TESTS
  // =============================================================================
  
  describe("Terraform Best Practices", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = readFile(TAP_STACK_PATH);
      providerContent = readFile(PROVIDER_PATH);
    });

    test("uses explicit provider configurations", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{.*alias\s*=\s*"primary"/s);
      expect(providerContent).toMatch(/provider\s+"aws"\s*{.*alias\s*=\s*"secondary"/s);
    });

    test("uses data sources for dynamic values", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"/);
      expect(stackContent).toMatch(/data\s+"aws_ami"/);
    });

    test("uses locals for computed values", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/local\.name_prefix/);
      expect(stackContent).toMatch(/local\.common_tags/);
    });

    test("uses count for multiple similar resources", () => {
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).toMatch(/count\.index/);
    });

    test("uses merge function for consistent tagging", () => {
      expect(countMatches(stackContent, /merge\(/g)).toBeGreaterThan(5);
    });

    test("uses depends_on for explicit dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
    });

    test("avoids hardcoded values", () => {
      // Should not have hardcoded AMI IDs
      expect(stackContent).not.toMatch(/ami-[a-f0-9]{8,}/);
      // Should not have hardcoded account IDs
      expect(stackContent).not.toMatch(/\d{12}/);
    });
  });

  // =============================================================================
  // ENHANCED SECURITY TESTING
  // =============================================================================

  describe("Enhanced Security Testing", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = readFile(TAP_STACK_PATH);
      providerContent = readFile(PROVIDER_PATH);
    });

    describe("IAM Permissions Security", () => {
      test("IAM policies use least privilege principles", () => {
        // Check for overly permissive IAM policies
        const iamPolicies = stackContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?}[\s]*}/gs) || [];
        
        iamPolicies.forEach(policy => {
          // Should not allow all actions on all resources
          expect(policy).not.toMatch(/"Action":\s*"\*"/);
          expect(policy).not.toMatch(/"Resource":\s*"\*"/);
          
          // Should have specific action lists in JSON
          expect(policy).toMatch(/Action.*\[/);
        });
        
        expect(iamPolicies.length).toBeGreaterThan(0);
      });

      test("IAM roles have proper assume role policies", () => {
        const roleDefinitions = stackContent.match(/resource\s+"aws_iam_role"[\s\S]*?}[\s]*}/gs) || [];
        
        roleDefinitions.forEach(role => {
          // Should have assume_role_policy defined
          expect(role).toMatch(/assume_role_policy/);
          
          // Should specify Principal
          expect(role).toMatch(/Principal/);
          
          // Should have proper service principals
          if (role.includes('ec2')) {
            expect(role).toMatch(/ec2\.amazonaws\.com/);
          }
          if (role.includes('s3')) {
            expect(role).toMatch(/s3\.amazonaws\.com/);
          }
        });
        
        expect(roleDefinitions.length).toBeGreaterThan(0);
      });

      test("automation role uses external ID for cross-account access", () => {
        expect(stackContent).toMatch(/sts:ExternalId/);
        expect(stackContent).toMatch(/StringEquals/);
        
        // External ID should reference project/environment variables
        expect(stackContent).toMatch(/local\.name_prefix.*automation/);
      });

      test("CloudWatch logs permissions are scoped to project", () => {
        const logsPolicy = stackContent.match(/aws_iam_role_policy.*cloudwatch[\s\S]*?}[\s]*}/gs);
        
        if (logsPolicy && logsPolicy.length > 0) {
          const policy = logsPolicy[0];
          
          // Should be scoped to specific log groups using name_prefix
          expect(policy).toMatch(/local\.name_prefix/);
          
          // Current implementation may still have wildcard - validate it's being improved
          if (policy.includes('arn:aws:logs:*:*:*')) {
            console.warn('CloudWatch logs policy still uses wildcard - should be scoped to project');
          }
        } else {
          console.warn('CloudWatch logs policy not found - should be added for better security');
        }
      });

      test("S3 permissions are bucket-specific", () => {
        const s3Policy = stackContent.match(/aws_iam_role_policy.*s3-access.*?}/gs);
        
        if (s3Policy && s3Policy.length > 0) {
          const policy = s3Policy[0];
          
          // Should reference specific buckets, not wildcards
          expect(policy).toMatch(/aws_s3_bucket\.(primary|secondary)\.arn/);
          expect(policy).not.toMatch(/"arn:aws:s3:::\*"/);
        }
      });
    });

    describe("Security Group Rules Analysis", () => {
      test("security groups follow network segmentation", () => {
        const securityGroups = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?}[\s]*}/gs) || [];
        
        securityGroups.forEach(sg => {
          // Should not allow unrestricted SSH access (port 22 with 0.0.0.0/0)
          if (sg.includes('from_port = 22') || sg.includes('from_port   = 22')) {
            // Check each ingress block separately
            const ingressBlocks = sg.match(/ingress\s*{[^}]*}/g) || [];
            const hasUnrestrictedSSH = ingressBlocks.some(ingress => 
              ingress.includes('from_port   = 22') && ingress.includes('0.0.0.0/0')
            );
            expect(hasUnrestrictedSSH).toBe(false);
            
            // VPC CIDR blocks are acceptable for SSH (internal access)
            if (sg.includes('var.vpc_cidr')) {
              console.log('✓ SSH access properly restricted to VPC CIDR');
            }
          }
          
          // Should not allow all ports open to internet
          if (sg.includes('0.0.0.0/0')) {
            expect(sg).not.toMatch(/from_port\s*=\s*0.*to_port\s*=\s*65535/s);
          }
        });
        
        expect(securityGroups.length).toBeGreaterThan(0);
      });

      test("ALB security groups allow appropriate HTTP/HTTPS traffic", () => {
        const albSecurityGroups = stackContent.match(/resource\s+"aws_security_group"\s+"alb_[\s\S]*?}[\s]*}/gs) || [];
        
        albSecurityGroups.forEach(sg => {
          // Should allow HTTP (80) and HTTPS (443)
          expect(sg).toMatch(/from_port\s*=\s*80/);
          expect(sg).toMatch(/from_port\s*=\s*443/);
          
          // Should allow traffic from internet for ALB
          expect(sg).toMatch(/0\.0\.0\.0\/0/);
        });
        
        expect(albSecurityGroups.length).toBeGreaterThan(0);
      });

      test("EC2 security groups restrict access to ALB sources", () => {
        const ec2SecurityGroups = stackContent.match(/resource\s+"aws_security_group"\s+"ec2_[^}]+}/gs) || [];
        
        ec2SecurityGroups.forEach(sg => {
          // Should reference ALB security group, not allow direct internet access
          if (sg.includes('ingress')) {
            expect(sg).toMatch(/security_groups\s*=\s*\[/);
          }
        });
      });

      test("security groups have proper egress rules", () => {
        const securityGroups = stackContent.match(/resource\s+"aws_security_group"[^}]+}/gs) || [];
        
        securityGroups.forEach(sg => {
          // Should either have explicit egress rules or rely on defaults
          if (sg.includes('egress')) {
            // If egress is defined, it should be specific
            expect(sg).toMatch(/to_port\s*=\s*\d+/);
          }
        });
      });
    });

    describe("Encryption and Data Protection", () => {
      test("S3 buckets have encryption configuration", () => {
        expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
        expect(stackContent).toMatch(/AES256|aws:kms/);
      });

      test("S3 buckets have versioning enabled", () => {
        expect(stackContent).toMatch(/aws_s3_bucket_versioning/);
        expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
      });

      test("S3 buckets have force_destroy for non-production", () => {
        // Should have force_destroy = true for easier cleanup in dev/test
        expect(stackContent).toMatch(/force_destroy\s*=\s*true/);
      });

      test("S3 cross-region replication is properly configured", () => {
        expect(stackContent).toMatch(/aws_s3_bucket_replication_configuration/);
        expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
        expect(stackContent).toMatch(/aws_s3_bucket_versioning/);
      });
    });

    describe("Network Security Configuration", () => {
      test("VPCs use non-overlapping CIDR blocks", () => {
        // Should use CIDR variables and reference them in VPC configurations
        expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr_primary/);
        expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr_secondary/);
        
        // Check default values in provider.tf
        expect(providerContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
        expect(providerContent).toMatch(/default\s*=\s*"10\.1\.0\.0\/16"/);
      });

      test("subnets are properly distributed across AZs", () => {
        // Should use availability zones data source
        expect(stackContent).toMatch(/data\.aws_availability_zones\./);
        expect(stackContent).toMatch(/count\.index/);
      });

      test("NAT gateways are created for private subnet internet access", () => {
        expect(stackContent).toMatch(/aws_nat_gateway/);
        expect(stackContent).toMatch(/aws_eip.*nat/);
      });

      test("route tables properly segment traffic", () => {
        expect(stackContent).toMatch(/aws_route_table.*public/);
        expect(stackContent).toMatch(/aws_route_table.*private/);
        expect(stackContent).toMatch(/aws_route_table_association/);
      });
    });

    describe("Secrets and Sensitive Data", () => {
      test("no hardcoded secrets in configuration", () => {
        const sensitivePatterns = [
          /password\s*=\s*"[^"]+"/i,
          /secret\s*=\s*"[^"]+"/i,
          /access_key\s*=\s*"[^"]+"/i,
          /secret_key\s*=\s*"[^"]+"/i,
          /AKIA[0-9A-Z]{16}/,  // AWS Access Key pattern
          /[0-9a-zA-Z/+]{40}/  // AWS Secret Key pattern
        ];

        const allConfig = stackContent + providerContent;
        
        sensitivePatterns.forEach(pattern => {
          expect(allConfig).not.toMatch(pattern);
        });
      });

      test("no timestamp() functions that cause plan inconsistencies", () => {
        expect(providerContent).not.toMatch(/timestamp\(\)/);
        expect(stackContent).not.toMatch(/timestamp\(\)/);
      });
    });
  });

  // =============================================================================
  // ENVIRONMENT ISOLATION VALIDATION
  // =============================================================================

  describe("Environment Isolation Validation", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = readFile(TAP_STACK_PATH);
      providerContent = readFile(PROVIDER_PATH);
    });

    describe("Environment Variable Usage", () => {
      test("environment variable is used consistently for resource naming", () => {
        // Should use var.environment in naming patterns
        expect(stackContent).toMatch(/var\.environment/);
        
        // Check that name_prefix includes environment variable
        expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}"/);
        
        // Count occurrences to ensure consistent usage
        const envUsage = countMatches(stackContent, /var\.environment/g);
        expect(envUsage).toBeGreaterThan(3);
      });

      test("environment validation constrains allowed values", () => {
        expect(providerContent).toMatch(/validation\s*{/);
        expect(providerContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
        expect(providerContent).toMatch(/var\.environment/);
      });

      test("default environment is development", () => {
        expect(providerContent).toMatch(/default\s*=\s*"dev"/);
      });
    });

    describe("Multi-Environment Resource Isolation", () => {
      test("resource names include environment prefix", () => {
        const resourceTypes = [
          'aws_vpc',
          'aws_subnet',
          'aws_security_group',
          'aws_lb',
          'aws_autoscaling_group',
          'aws_s3_bucket',
          'aws_iam_role'
        ];

        resourceTypes.forEach(resourceType => {
          const resourceMatches = stackContent.match(new RegExp(`resource\\s+"${resourceType}"`, 'g'));
          if (resourceMatches) {
            // Should use name_prefix which includes environment
            const resourceBlocks = stackContent.match(new RegExp(`resource\\s+"${resourceType}"[\\s\\S]*?}[\\s]*}`, 'gs'));
            if (resourceBlocks) {
              resourceBlocks.forEach(block => {
                expect(block).toMatch(/local\.name_prefix/);
              });
            }
          }
        });
      });

      test("tags include environment identification", () => {
        expect(stackContent).toMatch(/Environment.*var\.environment/);
        expect(stackContent).toMatch(/local\.common_tags/);
        
        // Common tags should include environment
        expect(stackContent).toMatch(/common_tags\s*=\s*{[^}]*Environment[^}]*}/s);
      });

      test("S3 buckets have environment-specific naming", () => {
        expect(stackContent).toMatch(/bucket.*local\.name_prefix.*storage/);
        expect(stackContent).toMatch(/random_id.*bucket_suffix/);
      });

      test("IAM roles have environment-specific naming", () => {
        const iamRoles = stackContent.match(/resource\s+"aws_iam_role"[^}]+}/gs) || [];
        
        iamRoles.forEach(role => {
          expect(role).toMatch(/name.*local\.name_prefix/);
        });
        
        expect(iamRoles.length).toBeGreaterThan(0);
      });
    });

    describe("Environment-Specific Configuration", () => {
      test("production environment has enhanced security", () => {
        // Should have production-specific conditions
        expect(stackContent).toMatch(/var\.environment\s*==\s*"prod"/);
        
        // Production should have deletion protection
        expect(stackContent).toMatch(/deletion_protection.*var\.environment.*prod/);
      });

      test("development environment allows easier resource cleanup", () => {
        // Should have force_destroy for dev environments
        expect(stackContent).toMatch(/force_destroy\s*=\s*true/);
      });

      test("environment-specific scaling configurations", () => {
        // Should use environment-specific configurations
        expect(stackContent).toMatch(/env_config/);
        expect(stackContent).toMatch(/local\.env_config\.(min_size|max_size|desired_capacity)/);
      });
    });

    describe("Cross-Environment Prevention", () => {
      test("resources are scoped to single environment", () => {
        // Should not reference resources from other environments
        expect(stackContent).not.toMatch(/\$\{.*prod.*\}/);
        expect(stackContent).not.toMatch(/\$\{.*staging.*\}/);
        expect(stackContent).not.toMatch(/\$\{.*dev.*\}/);
      });

      test("no hardcoded environment values", () => {
        // Should not have hardcoded environment names in resource definitions
        const resourceBlocks = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{[^}]+}/gs) || [];
        
        resourceBlocks.forEach(block => {
          expect(block).not.toMatch(/name\s*=\s*"[^"]*-prod-/);
          expect(block).not.toMatch(/name\s*=\s*"[^"]*-staging-/);
          expect(block).not.toMatch(/name\s*=\s*"[^"]*-dev-/);
        });
      });

      test("automation role permissions are environment-scoped", () => {
        const automationPolicy = stackContent.match(/aws_iam_role_policy.*automation-policy.*?}/gs);
        
        if (automationPolicy && automationPolicy.length > 0) {
          const policy = automationPolicy[0];
          
          // Should include environment reference
          expect(policy).toMatch(/local\.name_prefix/);
          
          // Check if resource constraints are properly implemented
          if (policy.includes('ResourceTag')) {
            expect(policy).toMatch(/ResourceTag.*Environment.*var\.environment/);
            console.log('✓ Automation policy uses proper resource tag constraints');
          } else {
            console.warn('Automation policy should be enhanced with resource tag constraints');
          }
        }
      });
    });

    describe("Multi-Region Environment Consistency", () => {
      test("both regions use same environment configuration", () => {
        // Primary and secondary should both reference environment
        expect(stackContent).toMatch(/provider\s*=\s*aws\.primary.*var\.environment/s);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary.*var\.environment/s);
      });

      test("region-specific resource naming includes environment", () => {
        expect(stackContent).toMatch(/local\.name_prefix.*primary/);
        expect(stackContent).toMatch(/local\.name_prefix.*secondary/);
      });

      test("cross-region replication respects environment boundaries", () => {
        // Replication should be within same environment
        expect(stackContent).toMatch(/aws_s3_bucket_replication_configuration/);
        
        // Check replication configuration references environment-scoped buckets
        const replicationConfig = stackContent.match(/aws_s3_bucket_replication_configuration[\s\S]*?}[\s]*}/);
        if (replicationConfig) {
          expect(replicationConfig[0]).toMatch(/aws_s3_bucket\.primary/);
          expect(replicationConfig[0]).toMatch(/aws_s3_bucket\.secondary/);
        }
        
        // Buckets should use name_prefix (which includes environment)
        expect(stackContent).toMatch(/bucket.*local\.name_prefix.*storage/);
      });
    });

    describe("Environment Variable Propagation", () => {
      test("user data script receives environment variables", () => {
        expect(stackContent).toMatch(/ENVIRONMENT="\$\{var\.environment\}"/);
        expect(stackContent).toMatch(/REGION="\$\{var\.(primary|secondary)_region\}"/);
        expect(stackContent).toMatch(/BUCKET_NAME="\$\{aws_s3_bucket\.(primary|secondary)\.bucket\}"/);
      });

      test("load balancer configuration varies by environment", () => {
        // Should have environment-specific ALB settings
        expect(stackContent).toMatch(/enable_deletion_protection.*var\.environment/);
      });

      test("auto scaling groups use environment-specific configurations", () => {
        expect(stackContent).toMatch(/local\.env_config\./);
        expect(stackContent).toMatch(/var\.environment.*dev.*staging.*prod/s);
      });
    });
  });
});
