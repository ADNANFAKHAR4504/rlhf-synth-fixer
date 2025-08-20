// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure code files
// No Terraform or CDKTF commands are executed - pure static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Code Unit Tests", () => {
  
  describe("File Structure and Existence", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      if (!exists) {
        console.error(`[unit] Expected provider at: ${providerPath}`);
      }
      expect(exists).toBe(true);
    });

    test("files have substantial content", () => {
      const stackContent = fs.readFileSync(stackPath, "utf8");
      const providerContent = fs.readFileSync(providerPath, "utf8");
      
      expect(stackContent.length).toBeGreaterThan(1000); // Substantial infrastructure
      expect(providerContent.length).toBeGreaterThan(50); // Basic provider config
    });
  });

  describe("Provider Configuration Validation", () => {
    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf correctly configures AWS provider", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("provider.tf includes required providers configuration", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{/);
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable in tap_stack.tf", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/default\s*=\s*"us-west-2"/);
      expect(content).toMatch(/type\s*=\s*string/);
    });

    test("aws_region variable has proper description", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/description\s*=\s*"AWS region for resources"/);
    });
  });

  describe("Data Sources", () => {
    test("includes required data sources", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });

    test("AMI data source has proper filters", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/most_recent\s*=\s*true/);
      expect(content).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(content).toMatch(/name\s*=\s*"name"/);
      expect(content).toMatch(/values\s*=\s*\["amzn2-ami-hvm-.*x86_64-gp2"\]/);
    });
  });

  describe("Core Infrastructure Resources", () => {
    test("VPC resource is properly defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("public subnets are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test("private subnets are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 10\}\.0\/24"/);
      expect(content).not.toMatch(/map_public_ip_on_launch\s*=\s*true.*private/);
    });

    test("internet gateway is defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("NAT gateways are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });
  });

  describe("Security Configuration", () => {
    test("security groups are defined with proper rules", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"private_instances"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("bastion security group allows SSH", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/from_port\s*=\s*22/);
      expect(content).toMatch(/to_port\s*=\s*22/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("KMS key is properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"tap_key"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(content).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("IAM roles follow least privilege", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);
      expect(content).toMatch(/"logs:PutLogEvents"/);
    });
  });

  describe("Compute Resources", () => {
    test("EC2 instances are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_instance"\s+"bastion"/);
      expect(content).toMatch(/resource\s+"aws_instance"\s+"private"/);
      expect(content).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(content).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux\.id/);
    });

    test("key pair is generated and stored securely", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"tls_private_key"\s+"main"/);
      expect(content).toMatch(/algorithm\s*=\s*"RSA"/);
      expect(content).toMatch(/rsa_bits\s*=\s*4096/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"private_key"/);
    });
  });

  describe("Storage and Encryption", () => {
    test("S3 bucket has proper security configuration", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    });

    test("S3 bucket blocks public access", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("encryption is applied to storage resources", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.tap_key\.arn/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });
  });

  describe("Monitoring and Logging", () => {
    test("CloudWatch resources are defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(content).toMatch(/resource\s+"aws_flow_log"/);
    });

    test("VPC Flow Logs are configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("CloudWatch alarms have proper thresholds", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/threshold\s*=\s*"80"/);
      expect(content).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });
  });

  describe("DNS and Service Discovery", () => {
    test("Route53 private zone is configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route53_zone"\s+"private"/);
      expect(content).toMatch(/name\s*=\s*"tap\.internal"/);
    });

    test("DNS records are properly defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route53_record"\s+"bastion"/);
      expect(content).toMatch(/resource\s+"aws_route53_record"\s+"private"/);
      expect(content).toMatch(/type\s*=\s*"A"/);
      expect(content).toMatch(/ttl\s*=\s*300/);
    });
  });

  describe("Outputs", () => {
    test("essential outputs are defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"bastion_public_ip"/);
      expect(content).toMatch(/output\s+"private_instance_ips"/);
      expect(content).toMatch(/output\s+"s3_bucket_name"/);
      expect(content).toMatch(/output\s+"kms_key_id"/);
    });

    test("outputs have proper descriptions", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(content).toMatch(/description\s*=\s*"Public IP of the bastion host"/);
      expect(content).toMatch(/description\s*=\s*"Private IPs of the private instances"/);
    });

    test("sensitive outputs are marked appropriately", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      // Check for any sensitive outputs that should be marked
      if (content.includes('output "rds_endpoint"')) {
        expect(content).toMatch(/sensitive\s*=\s*true/);
      }
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("resources use consistent naming patterns", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/random_id\.bucket_suffix\.hex/);
      expect(content).toMatch(/Name\s*=\s*"tap-/);
    });

    test("resources are properly tagged", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/tags\s*=\s*{/);
      expect(content).toMatch(/Name\s*=/);
      // Count tag occurrences to ensure comprehensive tagging
      const tagMatches = content.match(/tags\s*=\s*{/g);
      expect(tagMatches?.length).toBeGreaterThan(10); // Multiple resources tagged
    });
  });

  describe("High Availability and Redundancy", () => {
    test("resources are distributed across multiple AZs", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("NAT gateways provide redundancy", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/aws_nat_gateway.*count\s*=\s*2/s);
      expect(content).toMatch(/aws_eip.*count\s*=\s*2/s);
    });
  });

  describe("Dependencies and References", () => {
    test("resources properly reference each other", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/aws_vpc\.main\.id/);
      expect(content).toMatch(/aws_subnet\.(public|private)/);
      expect(content).toMatch(/aws_security_group\./);
      expect(content).toMatch(/aws_kms_key\.tap_key/);
    });

    test("explicit dependencies are defined where needed", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/depends_on\s*=\s*\[/);
    });
  });

  describe("Infrastructure Logic Validation", () => {
    test("terraform syntax validation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Validate proper block structure
      const resourceBlocks = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
      const dataBlocks = content.match(/data\s+"[^"]+"\s+"[^"]+"\s*{/g);
      const variableBlocks = content.match(/variable\s+"[^"]+"\s*{/g);
      const outputBlocks = content.match(/output\s+"[^"]+"\s*{/g);
      
      expect(resourceBlocks).toBeTruthy();
      expect(dataBlocks).toBeTruthy();
      expect(variableBlocks).toBeTruthy();
      expect(outputBlocks).toBeTruthy();
      
      // Validate that resource types are properly quoted
      expect(content).toMatch(/resource\s+"aws_/);
      expect(content).toMatch(/data\s+"aws_/);
      
      // Check for required Terraform syntax patterns
      expect(content).toMatch(/=\s*{/); // Assignment with braces
      expect(content).toMatch(/}\s*$/m); // Proper block closures
      
      // Ensure no obvious syntax errors
      expect(content).not.toMatch(/\$\${[^}]*\$\{/); // No nested interpolation issues
      expect(content).not.toMatch(/"\s*\+\s*"/); // No string concatenation issues
      
      console.log(`PASS Syntax validation: ${resourceBlocks?.length} resources, ${dataBlocks?.length} data sources, ${variableBlocks?.length} variables, ${outputBlocks?.length} outputs`);
    });

    test("resource dependency logic validation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // VPC must be referenced by subnets
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      
      // Subnets must be referenced by instances
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.(public|private)/);
      
      // Security groups must be referenced by instances
      expect(content).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group/);
      
      // KMS key must be referenced by encrypted resources
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.tap_key\.arn/);
      
      // Validate that EC2 instances reference valid AMI data source
      expect(content).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      
      // Validate that instances use generated key pair
      expect(content).toMatch(/key_name\s*=\s*aws_key_pair\.main\.key_name/);
      
      console.log('PASS Resource dependency logic validated');
    });

    test("network architecture logic validation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Public subnets must have internet gateway route
      expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      
      // Private subnets must have NAT gateway route
      expect(content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main/);
      
      // NAT gateways must be in public subnets
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
      
      // Bastion must be in public subnet
      const bastionMatch = content.match(/resource\s+"aws_instance"\s+"bastion"[\s\S]*?subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
      expect(bastionMatch).toBeTruthy();
      
      // Private instances must be in private subnets
      const privateInstanceMatch = content.match(/resource\s+"aws_instance"\s+"private"[\s\S]*?subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
      expect(privateInstanceMatch).toBeTruthy();
      
      console.log('PASS Network architecture logic validated');
    });

    test("security group rules logic validation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Bastion security group SSH rule
      const bastionSSHMatch = content.match(/resource\s+"aws_security_group"\s+"bastion"[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22/);
      expect(bastionSSHMatch).toBeTruthy();
      
      // Private instances security group references bastion
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.bastion\.id\]/);
      
      // RDS security group references private instances
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.private_instances\.id\]/);
      
      // Validate MySQL port for RDS
      const rdsPortMatch = content.match(/from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
      expect(rdsPortMatch).toBeTruthy();
      
      console.log('PASS Security group rules logic validated');
    });

    test("encryption and security logic validation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // All storage resources must use KMS encryption
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.tap_key\.arn/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.tap_key\.arn/);
      
      // S3 bucket must have public access blocked
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
      
      // SSM parameters must be SecureString type
      expect(content).toMatch(/type\s*=\s*"SecureString"/);
      
      // KMS key must have rotation enabled
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
      
      console.log('PASS Encryption and security logic validated');
    });

    test("resource naming consistency logic", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // All resources should use the random_id suffix for uniqueness
      expect(content).toMatch(/random_id\.bucket_suffix\.hex/);
      
      // Check that suffix is used in resource names
      const resourcesWithSuffix = [
        /tap-stack-bucket-\$\{random_id\.bucket_suffix\.hex\}/,
        /tap-ec2-role-\$\{random_id\.bucket_suffix\.hex\}/,
        /tap-key-\$\{random_id\.bucket_suffix\.hex\}/,
        /\/tap\/ec2\/private-key-\$\{random_id\.bucket_suffix\.hex\}/,
        /\/tap\/rds\/password-\$\{random_id\.bucket_suffix\.hex\}/
      ];
      
      resourcesWithSuffix.forEach(pattern => {
        expect(content).toMatch(pattern);
      });
      
      // Validate consistent naming prefix
      expect(content).toMatch(/Name\s*=\s*"tap-/);
      
      console.log('PASS Resource naming consistency logic validated');
    });

    test("high availability architecture logic", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Multiple AZs should be used
      expect(content).toMatch(/data\.aws_availability_zones\.available\.names\[count\.index\]/);
      
      // Count should be 2 for HA
      const countMatches = content.match(/count\s*=\s*2/g);
      expect(countMatches).toBeTruthy();
      expect(countMatches?.length).toBeGreaterThan(2); // Multiple resources with count=2
      
      // Verify HA components
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*2/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*2/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?count\s*=\s*2/);
      expect(content).toMatch(/resource\s+"aws_instance"\s+"private"[\s\S]*?count\s*=\s*2/);
      
      console.log('PASS High availability architecture logic validated');
    });

    test("monitoring and logging logic validation", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // VPC Flow Logs must reference VPC
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      
      // CloudWatch log groups must have retention
      expect(content).toMatch(/retention_in_days\s*=\s*14/);
      
      // CloudWatch alarms must have proper configuration
      expect(content).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(content).toMatch(/threshold\s*=\s*"80"/);
      expect(content).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      
      // IAM role for VPC Flow Logs
      expect(content).toMatch(/iam_role_arn\s*=\s*aws_iam_role\.flow_log\.arn/);
      
      console.log('PASS Monitoring and logging logic validated');
    });

    test("configuration drift prevention", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Ensure consistent region usage
      const regionReferences = content.match(/us-west-2/g);
      expect(regionReferences).toBeTruthy();
      expect(regionReferences?.length).toBeGreaterThan(1);
      
      // Ensure no hardcoded account IDs (should use data source)
      expect(content).not.toMatch(/\d{12}/); // 12-digit account ID
      expect(content).toMatch(/data\.aws_caller_identity\.current\.account_id/);
      
      // Ensure no hardcoded AZ names (should use data source)
      expect(content).not.toMatch(/us-west-2[abc]/);
      expect(content).toMatch(/data\.aws_availability_zones\.available/);
      
      console.log('PASS Configuration drift prevention validated');
    });

    test("terraform state management validation", () => {
      const providerContent = fs.readFileSync(providerPath, "utf8");
      
      // Terraform version constraints
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
      
      // AWS provider version constraints
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
      
      // Backend configuration should be external (not in code)
      expect(providerContent).not.toMatch(/backend\s+"s3"/);
      
      console.log('PASS Terraform state management validated');
    });
  });

});
