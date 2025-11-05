// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed - only static file validation.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  // ==================== FILE STRUCTURE TESTS ====================
  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider configuration is only in provider.tf, not in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("terraform block is only in provider.tf, not in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*?required_providers/);
      expect(providerContent).toMatch(/terraform\s*{/);
    });
  });

  // ==================== VARIABLE TESTS ====================
  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region variable has default value of us-west-1", () => {
      const regionMatch = stackContent.match(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(regionMatch).not.toBeNull();
      expect(regionMatch?.[1]).toBe("us-west-1");
    });

    test("declares ssh_allowed_ip variable", () => {
      expect(stackContent).toMatch(/variable\s+"ssh_allowed_ip"\s*{/);
    });

    test("declares key_pair_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"key_pair_name"\s*{/);
    });
  });

  // ==================== DATA SOURCE TESTS ====================
  describe("Data Sources", () => {
    test("declares aws_availability_zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("declares aws_ami data source for Amazon Linux 2", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
    });

    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // ==================== VPC AND NETWORKING TESTS ====================
  describe("VPC and Networking Resources", () => {
    test("declares VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("VPC has correct CIDR block (10.0.0.0/16)", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC has DNS hostnames enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC has DNS support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("declares Elastic IP for NAT Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("declares NAT Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("declares public subnets (count = 2)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?count\s*=\s*2/);
    });

    test("declares private subnets (count = 2)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?count\s*=\s*2/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?map_public_ip_on_launch\s*=\s*true/);
      expect(publicSubnetMatch).not.toBeNull();
    });

    test("declares public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("declares private route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("declares public route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("declares private route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test("public route table routes to Internet Gateway", () => {
      const publicRTMatch = stackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?gateway_id/);
      expect(publicRTMatch).not.toBeNull();
    });

    test("private route table routes to NAT Gateway", () => {
      const privateRTMatch = stackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?nat_gateway_id/);
      expect(privateRTMatch).not.toBeNull();
    });
  });

  // ==================== SECURITY GROUP TESTS ====================
  describe("Security Groups", () => {
    test("declares bastion security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
    });

    test("declares web security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    });

    test("declares RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("bastion security group allows SSH (port 22)", () => {
      const bastionMatch = stackContent.match(/resource\s+"aws_security_group"\s+"bastion"\s*{[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22/);
      expect(bastionMatch).not.toBeNull();
    });

    test("web security group allows HTTPS (port 443)", () => {
      const webMatch = stackContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
      expect(webMatch).not.toBeNull();
    });

    test("RDS security group allows MySQL (port 3306)", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
      expect(rdsMatch).not.toBeNull();
    });
  });

  // ==================== IAM TESTS ====================
  describe("IAM Resources", () => {
    test("declares IAM role for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("declares IAM role policy for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
    });

    test("declares IAM instance profile for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("IAM role has EC2 assume role policy", () => {
      const roleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?ec2\.amazonaws\.com/);
      expect(roleMatch).not.toBeNull();
    });

    test("IAM policy allows CloudWatch access", () => {
      const policyMatch = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{[\s\S]*?cloudwatch:PutMetricData/);
      expect(policyMatch).not.toBeNull();
    });

    test("IAM policy allows Secrets Manager access", () => {
      const policyMatch = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{[\s\S]*?secretsmanager:GetSecretValue/);
      expect(policyMatch).not.toBeNull();
    });

    test("declares IAM role for VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
    });

    test("declares IAM role policy for VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"/);
    });
  });

  // ==================== SECRETS MANAGER TESTS ====================
  describe("Secrets Manager", () => {
    test("declares Secrets Manager secret for RDS credentials", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
    });

    test("declares Secrets Manager secret version", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
    });

    test("Secrets Manager secret has recovery window", () => {
      const secretMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"\s*{[\s\S]*?recovery_window_in_days/);
      expect(secretMatch).not.toBeNull();
    });
  });

  // ==================== EC2 TESTS ====================
  describe("EC2 Instance", () => {
    test("declares EC2 bastion instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"bastion"/);
    });

    test("EC2 instance has monitoring enabled", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?monitoring\s*=\s*true/);
      expect(ec2Match).not.toBeNull();
    });

    test("EC2 instance has encrypted root volume", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?root_block_device\s*{[\s\S]*?encrypted\s*=\s*true/);
      expect(ec2Match).not.toBeNull();
    });

    test("EC2 instance uses IAM instance profile", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?iam_instance_profile/);
      expect(ec2Match).not.toBeNull();
    });

    test("EC2 instance is in public subnet", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
      expect(ec2Match).not.toBeNull();
    });
  });

  // ==================== RDS TESTS ====================
  describe("RDS Database", () => {
    test("declares random password for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    });

    test("random password has appropriate length", () => {
      const pwMatch = stackContent.match(/resource\s+"random_password"\s+"rds_password"\s*{[\s\S]*?length\s*=\s*(\d+)/);
      expect(pwMatch).not.toBeNull();
      expect(parseInt(pwMatch?.[1] || "0")).toBeGreaterThanOrEqual(16);
    });

    test("declares RDS subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"mysql"/);
    });

    test("declares RDS MySQL instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"mysql"/);
    });

    test("RDS instance is MySQL engine", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?engine\s*=\s*"mysql"/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS instance has storage encryption enabled", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?storage_encrypted\s*=\s*true/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS instance is not publicly accessible", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?publicly_accessible\s*=\s*false/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS instance has deletion protection disabled (as per requirement)", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?deletion_protection\s*=\s*false/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS instance is Multi-AZ enabled", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?multi_az\s*=\s*true/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS instance has backup retention period", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?backup_retention_period/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS instance has CloudWatch logs exports enabled", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?enabled_cloudwatch_logs_exports/);
      expect(rdsMatch).not.toBeNull();
    });
  });

  // ==================== VPC FLOW LOGS TESTS ====================
  describe("VPC Flow Logs", () => {
    test("declares S3 bucket for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs"/);
    });

    test("declares S3 bucket versioning for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"flow_logs"/);
    });

    test("declares S3 bucket encryption for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"/);
    });

    test("declares S3 bucket public access block for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"/);
    });

    test("S3 bucket blocks all public access", () => {
      const s3Match = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"\s*{[\s\S]*?block_public_acls\s*=\s*true[\s\S]*?block_public_policy\s*=\s*true/);
      expect(s3Match).not.toBeNull();
    });

    test("declares S3 lifecycle configuration for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"flow_logs"/);
    });

    test("declares CloudWatch log group for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"/);
    });

    test("CloudWatch log group has retention period", () => {
      const cwMatch = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"\s*{[\s\S]*?retention_in_days/);
      expect(cwMatch).not.toBeNull();
    });

    test("declares VPC Flow Log", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test("VPC Flow Log captures ALL traffic", () => {
      const flowLogMatch = stackContent.match(/resource\s+"aws_flow_log"\s+"main"\s*{[\s\S]*?traffic_type\s*=\s*"ALL"/);
      expect(flowLogMatch).not.toBeNull();
    });
  });

  // ==================== CLOUDWATCH MONITORING TESTS ====================
  describe("CloudWatch Monitoring", () => {
    test("declares SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("declares CloudWatch alarm for EC2 CPU", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"/);
    });

    test("declares CloudWatch alarm for EC2 status check", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_status_check"/);
    });

    test("declares CloudWatch alarm for RDS CPU", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"/);
    });

    test("declares CloudWatch alarm for RDS storage", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage_low"/);
    });

    test("EC2 CPU alarm monitors CPUUtilization metric", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?metric_name\s*=\s*"CPUUtilization"/);
      expect(alarmMatch).not.toBeNull();
    });

    test("RDS CPU alarm monitors CPUUtilization metric", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"\s*{[\s\S]*?metric_name\s*=\s*"CPUUtilization"/);
      expect(alarmMatch).not.toBeNull();
    });

    test("CloudWatch alarms use SNS topic for notifications", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
      expect(alarmMatch).not.toBeNull();
    });
  });

  // ==================== TAGGING TESTS ====================
  describe("Resource Tagging", () => {
    test("VPC has Name tag", () => {
      const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?Name\s*=/);
      expect(vpcMatch).not.toBeNull();
    });

    test("EC2 instance has Name tag", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?Name\s*=/);
      expect(ec2Match).not.toBeNull();
    });

    test("RDS instance has Name tag", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?Name\s*=/);
      expect(rdsMatch).not.toBeNull();
    });

    test("resources have Type tags for categorization", () => {
      expect(stackContent).toMatch(/Type\s*=\s*"/);
    });
  });

  // ==================== OUTPUT TESTS ====================
  describe("Outputs", () => {
    test("declares vpc_id output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares bastion_public_ip output", () => {
      expect(stackContent).toMatch(/output\s+"bastion_public_ip"\s*{/);
    });

    test("declares bastion_instance_id output", () => {
      expect(stackContent).toMatch(/output\s+"bastion_instance_id"\s*{/);
    });

    test("declares rds_endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
    });

    test("rds_endpoint output is marked as sensitive", () => {
      const outputMatch = stackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?sensitive\s*=\s*true/);
      expect(outputMatch).not.toBeNull();
    });

    test("declares rds_secret_arn output", () => {
      expect(stackContent).toMatch(/output\s+"rds_secret_arn"\s*{/);
    });

    test("declares nat_gateway_ip output", () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_ip"\s*{/);
    });

    test("declares sns_topic_arn output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("declares flow_logs_s3_bucket output", () => {
      expect(stackContent).toMatch(/output\s+"flow_logs_s3_bucket"\s*{/);
    });

    test("declares cloudwatch_log_group output", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group"\s*{/);
    });

    test("all outputs have descriptions", () => {
      const outputs = stackContent.match(/output\s+"[^"]+"\s*{[^}]*}/g) || [];
      outputs.forEach((output) => {
        expect(output).toMatch(/description\s*=/);
      });
    });
  });

  // ==================== SECURITY BEST PRACTICES TESTS ====================
  describe("Security Best Practices", () => {
    test("no hardcoded credentials in configuration", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^r]/); // Excludes random_password references
      expect(stackContent).not.toMatch(/access_key\s*=\s*"/);
      expect(stackContent).not.toMatch(/secret_key\s*=\s*"/);
    });

    test("RDS password is generated using random_password", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?password\s*=\s*random_password\.rds_password\.result/);
      expect(rdsMatch).not.toBeNull();
    });

    test("no deletion protection is enabled (as per requirement)", () => {
      const deletionProtectionEnabled = stackContent.match(/deletion_protection\s*=\s*true/);
      expect(deletionProtectionEnabled).toBeNull();
    });

    test("encryption is enabled for storage resources", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("S3 buckets block public access", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("private subnets use NAT Gateway for outbound traffic", () => {
      const privateRTMatch = stackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?nat_gateway_id/);
      expect(privateRTMatch).not.toBeNull();
    });
  });

  // ==================== REGION VALIDATION TESTS ====================
  describe("Region Configuration", () => {
    test("default region is us-west-1", () => {
      const regionMatch = stackContent.match(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(regionMatch?.[1]).toBe("us-west-1");
    });

    test("provider uses aws_region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  // ==================== COMMENTS AND DOCUMENTATION TESTS ====================
  describe("Documentation", () => {
    test("file has header comments explaining purpose", () => {
      expect(stackContent).toMatch(/# .* Production-ready AWS Infrastructure/);
    });

    test("file mentions us-west-1 region in comments", () => {
      expect(stackContent).toMatch(/us-west-1/);
    });

    test("file has section separators for organization", () => {
      expect(stackContent).toMatch(/# ={10,}/);
    });

    test("variables have descriptions", () => {
      const variables = stackContent.match(/variable\s+"[^"]+"\s*{[^}]*}/g) || [];
      variables.forEach((variable) => {
        expect(variable).toMatch(/description\s*=/);
      });
    });
  });

  // ==================== ADVANCED VPC CONFIGURATION TESTS ====================
  describe("Advanced VPC Configuration", () => {
    test("VPC CIDR block is correctly formatted", () => {
      const cidrMatch = stackContent.match(/cidr_block\s*=\s*"(\d+\.\d+\.\d+\.\d+\/\d+)"/);
      expect(cidrMatch).not.toBeNull();
      expect(cidrMatch?.[1]).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test("public subnet CIDR blocks are in correct range", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test("private subnet CIDR blocks are in correct range", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 10\}\.0\/24"/);
    });

    test("VPC has proper tags configuration", () => {
      const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/);
      expect(vpcMatch).not.toBeNull();
    });

    test("subnets reference availability zones data source", () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names/);
    });
  });

  // ==================== SECURITY GROUP DETAILED TESTS ====================
  describe("Security Group Details", () => {
    test("bastion security group has proper description", () => {
      const bastionMatch = stackContent.match(/resource\s+"aws_security_group"\s+"bastion"\s*{[\s\S]*?description/);
      expect(bastionMatch).not.toBeNull();
    });

    test("web security group has proper description", () => {
      const webMatch = stackContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?description/);
      expect(webMatch).not.toBeNull();
    });

    test("RDS security group has proper description", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?description/);
      expect(rdsMatch).not.toBeNull();
    });

    test("security groups reference VPC ID", () => {
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/g);
      expect(sgMatches).not.toBeNull();
      expect(sgMatches?.length).toBeGreaterThanOrEqual(3);
    });

    test("bastion security group has egress rules", () => {
      const bastionMatch = stackContent.match(/resource\s+"aws_security_group"\s+"bastion"\s*{[\s\S]*?egress\s*{/);
      expect(bastionMatch).not.toBeNull();
    });

    test("web security group allows SSH from bastion", () => {
      const webMatch = stackContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.bastion\.id\]/);
      expect(webMatch).not.toBeNull();
    });

    test("RDS security group allows access from bastion", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.bastion\.id\]/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS security group allows access from web servers", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
      expect(rdsMatch).not.toBeNull();
    });
  });

  // ==================== IAM DETAILED TESTS ====================
  describe("IAM Configuration Details", () => {
    test("EC2 role has proper trust policy", () => {
      const roleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?assume_role_policy/);
      expect(roleMatch).not.toBeNull();
    });

    test("EC2 role policy allows logs creation", () => {
      const policyMatch = stackContent.match(/logs:CreateLogGroup/);
      expect(policyMatch).not.toBeNull();
    });

    test("EC2 role policy allows logs streaming", () => {
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("EC2 role policy references specific region", () => {
      expect(stackContent).toMatch(/arn:aws:logs:us-west-1/);
    });

    test("VPC Flow Logs role trusts vpc-flow-logs service", () => {
      expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("VPC Flow Logs role has logs permissions", () => {
      const flowLogsMatch = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"flow_logs"\s*{[\s\S]*?logs:DescribeLogGroups/);
      expect(flowLogsMatch).not.toBeNull();
    });
  });

  // ==================== EC2 DETAILED TESTS ====================
  describe("EC2 Instance Details", () => {
    test("bastion instance uses t3.micro type", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?instance_type\s*=\s*"t3\.micro"/);
      expect(ec2Match).not.toBeNull();
    });

    test("bastion instance has key pair configured", () => {
      expect(stackContent).toMatch(/key_name\s*=\s*var\.key_pair_name/);
    });

    test("bastion instance has user data script", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?user_data\s*=/);
      expect(ec2Match).not.toBeNull();
    });

    test("bastion instance uses Amazon Linux 2 AMI", () => {
      expect(stackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test("bastion root volume is gp3 type", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?volume_type\s*=\s*"gp3"/);
      expect(ec2Match).not.toBeNull();
    });

    test("bastion root volume is 20GB", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?volume_size\s*=\s*20/);
      expect(ec2Match).not.toBeNull();
    });

    test("bastion root volume deletes on termination", () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"bastion"\s*{[\s\S]*?delete_on_termination\s*=\s*true/);
      expect(ec2Match).not.toBeNull();
    });
  });

  // ==================== RDS DETAILED TESTS ====================
  describe("RDS Configuration Details", () => {
    test("RDS uses MySQL 8.0 engine", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?engine_version\s*=\s*"8\.0"/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS uses db.t3.micro instance class", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?instance_class\s*=\s*"db\.t3\.micro"/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has 20GB allocated storage", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?allocated_storage\s*=\s*20/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has max allocated storage of 100GB", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?max_allocated_storage\s*=\s*100/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS uses gp3 storage type", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?storage_type\s*=\s*"gp3"/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS database name is configured", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?db_name\s*=\s*"productiondb"/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS username is configured", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?username\s*=\s*"admin"/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS port is set to 3306", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?port\s*=\s*3306/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has backup retention period of 7 days", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?backup_retention_period\s*=\s*7/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has backup window configured", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?backup_window/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has maintenance window configured", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?maintenance_window/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has skip_final_snapshot set to false", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?skip_final_snapshot\s*=\s*false/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has final snapshot identifier configured", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?final_snapshot_identifier/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS has performance insights enabled", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?performance_insights_enabled\s*=\s*true/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS performance insights retention is 7 days", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"mysql"\s*{[\s\S]*?performance_insights_retention_period\s*=\s*7/);
      expect(rdsMatch).not.toBeNull();
    });

    test("RDS exports CloudWatch logs", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
    });
  });

  // ==================== SECRETS MANAGER DETAILED TESTS ====================
  describe("Secrets Manager Details", () => {
    test("secret has 7 day recovery window", () => {
      const secretMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"\s*{[\s\S]*?recovery_window_in_days\s*=\s*7/);
      expect(secretMatch).not.toBeNull();
    });

    test("secret version contains username field", () => {
      const versionMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"\s*{[\s\S]*?username/);
      expect(versionMatch).not.toBeNull();
    });

    test("secret version contains password field", () => {
      const versionMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"\s*{[\s\S]*?password/);
      expect(versionMatch).not.toBeNull();
    });

    test("secret version contains engine field", () => {
      const versionMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"\s*{[\s\S]*?engine/);
      expect(versionMatch).not.toBeNull();
    });

    test("secret version contains host field", () => {
      const versionMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"\s*{[\s\S]*?host/);
      expect(versionMatch).not.toBeNull();
    });

    test("secret version contains port field", () => {
      const versionMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"\s*{[\s\S]*?port/);
      expect(versionMatch).not.toBeNull();
    });

    test("secret version contains dbname field", () => {
      const versionMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"\s*{[\s\S]*?dbname/);
      expect(versionMatch).not.toBeNull();
    });
  });

  // ==================== CLOUDWATCH DETAILED TESTS ====================
  describe("CloudWatch Configuration Details", () => {
    test("EC2 CPU alarm has 2 evaluation periods", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?evaluation_periods\s*=\s*"2"/);
      expect(alarmMatch).not.toBeNull();
    });

    test("EC2 CPU alarm has 300 second period", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?period\s*=\s*"300"/);
      expect(alarmMatch).not.toBeNull();
    });

    test("EC2 CPU alarm threshold is 80", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_high"\s*{[\s\S]*?threshold\s*=\s*"80"/);
      expect(alarmMatch).not.toBeNull();
    });

    test("RDS CPU alarm threshold is 75", () => {
      const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"\s*{[\s\S]*?threshold\s*=\s*"75"/);
      expect(alarmMatch).not.toBeNull();
    });

    test("CloudWatch log group has 30 day retention", () => {
      const logGroupMatch = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"\s*{[\s\S]*?retention_in_days\s*=\s*30/);
      expect(logGroupMatch).not.toBeNull();
    });

    test("all alarms have descriptions", () => {
      const alarms = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?alarm_description/g);
      expect(alarms).not.toBeNull();
      expect(alarms?.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==================== S3 BUCKET DETAILED TESTS ====================
  describe("S3 Bucket Configuration Details", () => {
    test("S3 bucket name includes account ID", () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"production-vpc-flow-logs-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
    });

    test("S3 bucket has lifecycle rule for STANDARD_IA transition", () => {
      const lifecycleMatch = stackContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?storage_class\s*=\s*"STANDARD_IA"/);
      expect(lifecycleMatch).not.toBeNull();
    });

    test("S3 bucket has lifecycle rule for GLACIER transition", () => {
      const lifecycleMatch = stackContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?storage_class\s*=\s*"GLACIER"/);
      expect(lifecycleMatch).not.toBeNull();
    });

    test("S3 bucket lifecycle transitions after 30 days to STANDARD_IA", () => {
      const lifecycleMatch = stackContent.match(/days\s*=\s*30[\s\S]*?storage_class\s*=\s*"STANDARD_IA"/);
      expect(lifecycleMatch).not.toBeNull();
    });

    test("S3 bucket lifecycle transitions after 90 days to GLACIER", () => {
      const lifecycleMatch = stackContent.match(/days\s*=\s*90[\s\S]*?storage_class\s*=\s*"GLACIER"/);
      expect(lifecycleMatch).not.toBeNull();
    });

    test("S3 bucket lifecycle expires after 365 days", () => {
      const lifecycleMatch = stackContent.match(/expiration\s*{[\s\S]*?days\s*=\s*365/);
      expect(lifecycleMatch).not.toBeNull();
    });

    test("S3 bucket encryption uses AES256", () => {
      const encryptionMatch = stackContent.match(/sse_algorithm\s*=\s*"AES256"/);
      expect(encryptionMatch).not.toBeNull();
    });
  });

  // ==================== RANDOM PASSWORD TESTS ====================
  describe("Random Password Configuration", () => {
    test("random password length is 32", () => {
      const pwMatch = stackContent.match(/resource\s+"random_password"\s+"rds_password"\s*{[\s\S]*?length\s*=\s*32/);
      expect(pwMatch).not.toBeNull();
    });

    test("random password has special characters enabled", () => {
      const pwMatch = stackContent.match(/resource\s+"random_password"\s+"rds_password"\s*{[\s\S]*?special\s*=\s*true/);
      expect(pwMatch).not.toBeNull();
    });

    test("random password has override_special defined", () => {
      const pwMatch = stackContent.match(/resource\s+"random_password"\s+"rds_password"\s*{[\s\S]*?override_special/);
      expect(pwMatch).not.toBeNull();
    });
  });
});
