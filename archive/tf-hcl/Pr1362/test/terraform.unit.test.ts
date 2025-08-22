// test/terraform.unit.test.ts
// Unit tests for Terraform configuration (robust to file layout and style)

import fs from "fs";
import path from "path";

function readIfExists(p: string): string {
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  } catch {
    return "";
  }
}

function gatherTfFrom(dir: string): string {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return "";
  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.endsWith(".tf"))
    .map(f => readIfExists(path.join(dir, f)))
    .join("\n");
}

describe("Terraform Infrastructure Unit Tests", () => {
  // Prefer lib/ (your structure), but also scan repo root as fallback
  const repoRoot = path.resolve(__dirname, "..", "..");
  const libDir = path.resolve(__dirname, "..", "lib");
  const providerTfPath = path.resolve(libDir, "provider.tf");

  // Aggregate content from lib/ first, then root
  const libContent = gatherTfFrom(libDir);
  const rootContent = gatherTfFrom(path.resolve(repoRoot));
  const combinedContent = [libContent, rootContent].filter(Boolean).join("\n");

  // Keep provider.tf direct read (for the specific provider test), but fall back to combined
  let providerContent = readIfExists(providerTfPath);
  if (!providerContent) providerContent = combinedContent;

  // Helper: regex with optional quotes around a number
  const num = (n: number | string) => new RegExp(`=\\s*"?${n}"?`);

  it("has at least one .tf file discoverable", () => {
    expect(combinedContent.length).toBeGreaterThan(0);
  });

  describe("File Structure", () => {
    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Terraform Configuration Block", () => {
    test("declares terraform block with required version (any .tf)", () => {
      // Accept it in any file (main/provider/versions)
      expect(combinedContent).toMatch(/terraform\s*{/);
      expect(combinedContent).toMatch(/required_version\s*=\s*"\s*>=\s*1\.\d+\.\d+"\s*/);
    });

    test("declares required providers or implicitly uses them", () => {
      const hasRequiredProviders =
        /terraform\s*{[\s\S]*?required_providers\s*{[\s\S]*?aws[\s\S]*?source\s*=\s*"hashicorp\/aws"[\s\S]*?}[\s\S]*?}/.test(
          combinedContent
        ) &&
        /random[\s\S]*source\s*=\s*"hashicorp\/random"/.test(combinedContent) &&
        /archive[\s\S]*source\s*=\s*"hashicorp\/archive"/.test(combinedContent);

      // Or infer via usage, which your stack clearly has:
      const usesAws = /(?:^|\s)(resource|data)\s+"aws_[^"]+"/.test(combinedContent);
      const usesRandom = /resource\s+"random_(id|password)"/.test(combinedContent);
      const usesArchive = /data\s+"archive_file"\s+"/.test(combinedContent);

      expect(hasRequiredProviders || (usesAws && usesRandom && usesArchive)).toBe(true);
    });
  });

  describe("Variables", () => {
    test("declares environment_suffix variable", () => {
      expect(combinedContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares aws_region variable with default us-west-1", () => {
      expect(combinedContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(combinedContent).toMatch(/default\s*=\s*"us-west-1"/);
    });

    test("declares allowed_https_cidrs variable", () => {
      expect(combinedContent).toMatch(/variable\s+"allowed_https_cidrs"\s*{/);
      expect(combinedContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares bastion_ingress_cidrs variable", () => {
      expect(combinedContent).toMatch(/variable\s+"bastion_ingress_cidrs"\s*{/);
      expect(combinedContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares vpc_cidr variable with default 10.20.0.0/16", () => {
      expect(combinedContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(combinedContent).toMatch(/default\s*=\s*"10\.20\.0\.0\/16"/);
    });

    test("declares instance type variables", () => {
      expect(combinedContent).toMatch(/variable\s+"app_instance_type"\s*{/);
      expect(combinedContent).toMatch(/variable\s+"bastion_instance_type"\s*{/);
    });

    test("declares ASG sizing variables", () => {
      expect(combinedContent).toMatch(/variable\s+"asg_min_size"\s*{/);
      expect(combinedContent).toMatch(/variable\s+"asg_max_size"\s*{/);
      expect(combinedContent).toMatch(/variable\s+"asg_desired_capacity"\s*{/);
    });

    test("declares RDS variables", () => {
      expect(combinedContent).toMatch(/variable\s+"rds_instance_class"\s*{/);
      expect(combinedContent).toMatch(/variable\s+"rds_allocated_storage"\s*{/);
      expect(combinedContent).toMatch(/variable\s+"rds_username"\s*{/);
    });
  });

  describe("Locals", () => {
    test("defines env_suffix local", () => {
      expect(combinedContent).toMatch(/locals\s*{/);
      expect(combinedContent).toMatch(/env_suffix\s*=/);
    });

    test("defines common_tags with prod- metadata", () => {
      expect(combinedContent).toMatch(/common_tags\s*=\s*{/);
      expect(combinedContent).toMatch(/Environment\s*=\s*"prod"/);
      expect(combinedContent).toMatch(/Project\s*=\s*"secure-stack"/);
      expect(combinedContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test("defines subnet CIDR calculations", () => {
      expect(combinedContent).toMatch(/public_subnet_cidrs\s*=/);
      expect(combinedContent).toMatch(/private_subnet_cidrs\s*=/);
      expect(combinedContent).toMatch(/db_subnet_cidrs\s*=/);
    });

    test("defines security group change events", () => {
      expect(combinedContent).toMatch(/sg_change_events\s*=\s*\[/);
      expect(combinedContent).toMatch(/"CreateSecurityGroup"/);
      expect(combinedContent).toMatch(/"AuthorizeSecurityGroupIngress"/);
      expect(combinedContent).toMatch(/"DeleteSecurityGroup"/);
    });
  });

  describe("Networking - VPC and Subnets", () => {
    test("creates VPC resource", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(combinedContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(combinedContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(combinedContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(combinedContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(combinedContent).toMatch(/count\s*=\s*2/);
      expect(combinedContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private and db subnets", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(combinedContent).toMatch(/resource\s+"aws_subnet"\s+"db"\s*{/);
      expect(combinedContent).toMatch(/count\s*=\s*2/);
    });

    test("creates NAT Gateways and EIPs", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(combinedContent).toMatch(/count\s*=\s*2/);
      expect(combinedContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(combinedContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(combinedContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("creates route tables and associations", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(combinedContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(combinedContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(combinedContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });
  });

  describe("Security - NACLs and Security Groups", () => {
    test("creates public NACL with ssh/https rules", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_network_acl"\s+"public"\s*{/);
      expect(combinedContent).toMatch(/from_port\s*=\s*22/);
      expect(combinedContent).toMatch(/from_port\s*=\s*443/);
    });

    test("creates private NACL with postgres rule", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_network_acl"\s+"private"\s*{/);
      expect(combinedContent).toMatch(/from_port\s*=\s*5432/);
    });

    test("creates bastion security group with dynamic ingress", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_security_group"\s+"bastion"\s*{/);
      expect(combinedContent).toMatch(/dynamic\s+"ingress"\s*{/);
      expect(combinedContent).toMatch(/for_each\s*=\s*var\.bastion_ingress_cidrs/);
    });

    test("creates app security group with HTTPS only from allowed CIDRs", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
      expect(combinedContent).toMatch(/for_each\s*=\s*var\.allowed_https_cidrs/);
      expect(combinedContent).toMatch(/from_port\s*=\s*443/);
      expect(combinedContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates RDS security group tied to app SG", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(combinedContent).toMatch(/from_port\s*=\s*5432/);
      expect(combinedContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("creates Lambda security group", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    });
  });

  describe("KMS and Encryption", () => {
    test("creates KMS key with rotation and deletion window", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_kms_key"\s+"general"\s*{/);
      expect(combinedContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(combinedContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("has a KMS key policy (inline or separate resource) and includes IAM user permissions", () => {
      const separatePolicy = /resource\s+"aws_kms_key_policy"\s+"general"\s*{/.test(
        combinedContent
      );
      const inlinePolicyOnKey = /resource\s+"aws_kms_key"\s+"general"[\s\S]*?policy\s*=/.test(
        combinedContent
      );
      expect(separatePolicy || inlinePolicyOnKey).toBe(true);
      expect(combinedContent).toMatch(/"EnableIAMUserPermissions"/);
    });

    test("creates KMS alias", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_kms_alias"\s+"general"\s*{/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates S3 logs bucket", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
      expect(combinedContent).toMatch(/force_destroy\s*=\s*true/);
    });

    test("configures S3 bucket encryption with KMS", () => {
      expect(combinedContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"\s*{/
      );
      expect(combinedContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.general\.arn/);
      expect(combinedContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("enables S3 bucket versioning", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"\s*{/);
      expect(combinedContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("blocks public access on S3 bucket", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{/);
      expect(combinedContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(combinedContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(combinedContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(combinedContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 bucket policy denies insecure transport and enforces SSE-KMS", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"\s*{/);
      // SecureTransport = false denied
      expect(combinedContent).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
      // Enforce kms algorithm OR explicit kms key id
      expect(
        /"s3:x-amz-server-side-encryption"\s*=\s*"aws:kms"/.test(combinedContent) ||
          /"s3:x-amz-server-side-encryption-aws-kms-key-id"\s*=/.test(combinedContent)
      ).toBe(true);
    });

    test("enables S3 server access logging", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"logs"\s*{/);
      expect(combinedContent).toMatch(/target_prefix\s*=\s*"access-logs\/"/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates EC2 app role with SSM/Secrets/Logs/KMS/S3 access", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_app"\s*{/);
      expect(combinedContent).toMatch(/"ssm:GetParameter"/);
      expect(combinedContent).toMatch(/"secretsmanager:GetSecretValue"/);
      expect(combinedContent).toMatch(/"logs:CreateLogGroup"/);
    });

    test("creates EC2 instance profile", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_app"\s*{/);
    });

    test("creates bastion role and profile", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_iam_role"\s+"bastion"\s*{/);
      expect(combinedContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"bastion"\s*{/);
    });

    test("creates Lambda security role with SNS + EC2 Describe permissions", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_security"\s*{/);
      expect(combinedContent).toMatch(/"sns:Publish"/);
      expect(combinedContent).toMatch(/"ec2:DescribeSecurityGroups"/);
    });
  });

  describe("Compute - EC2 and Auto Scaling", () => {
    test("creates bastion host instance in public subnet 0", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_instance"\s+"bastion"\s*{/);
      expect(combinedContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
    });

    test("creates launch template for app instances with secure settings", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
      expect(combinedContent).toMatch(/instance_type\s*=\s*var\.app_instance_type/);
      expect(combinedContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(combinedContent).toMatch(/monitoring\s*{\s*enabled\s*=\s*true/);
    });

    test("creates Auto Scaling Group", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"\s*{/);
      expect(combinedContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(combinedContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(combinedContent).toMatch(/min_size\s*=\s*var\.asg_min_size/);
      expect(combinedContent).toMatch(/max_size\s*=\s*var\.asg_max_size/);
    });

    test("creates scaling policies", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_out"\s*{/);
      expect(combinedContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_in"\s*{/);
      expect(combinedContent).toMatch(/adjustment_type\s*=\s*"ChangeInCapacity"/);
    });
  });

  describe("Load Balancing", () => {
    test("creates Network Load Balancer", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_lb"\s+"app"\s*{/);
      expect(combinedContent).toMatch(/load_balancer_type\s*=\s*"network"/);
      expect(combinedContent).toMatch(/internal\s*=\s*false/);
      expect(combinedContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test("creates target group", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
      expect(combinedContent).toMatch(/port\s*=\s*"?443"?/);
      expect(combinedContent).toMatch(/protocol\s*=\s*"TCP"/);
    });

    test("creates listener on port 443 TCP", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_lb_listener"\s+"app"\s*{/);
      expect(combinedContent).toMatch(/port\s*=\s*"?443"?/);
      expect(combinedContent).toMatch(/protocol\s*=\s*"TCP"/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("creates CPU high alarm for scale out", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"\s*{/);
      expect(combinedContent).toMatch(new RegExp(`threshold\\s*${num(60).source}`));
      expect(combinedContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });

    test("creates CPU low alarm for scale in", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"\s*{/);
      expect(combinedContent).toMatch(new RegExp(`threshold\\s*${num(30).source}`));
      expect(combinedContent).toMatch(/comparison_operator\s*=\s*"LessThanThreshold"/);
    });

    test("creates CPU critical alarm at 80% for 5 minutes", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_critical"\s*{/);
      expect(combinedContent).toMatch(new RegExp(`threshold\\s*${num(80).source}`));
      expect(combinedContent).toMatch(new RegExp(`period\\s*${num(300).source}`));
      expect(combinedContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.security_alerts\.arn\]/);
    });
  });

  describe("RDS Database", () => {
    test("creates RDS PostgreSQL instance (encrypted, private)", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(combinedContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(combinedContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(combinedContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.general\.arn/);
      expect(combinedContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("configures RDS backup retention (>=7 days)", () => {
      expect(combinedContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("creates DB subnet group for db subnets", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(combinedContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.db\[\*\]\.id/);
    });
  });

  describe("Lambda and EventBridge", () => {
    test("creates Lambda function for security automation", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_lambda_function"\s+"security_automation"\s*{/);
      expect(combinedContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(combinedContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test("configures Lambda VPC settings", () => {
      expect(combinedContent).toMatch(/vpc_config\s*{/);
      expect(combinedContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(combinedContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("creates EventBridge rules and targets", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_changes"\s*{/);
      expect(combinedContent).toMatch(/"AWS API Call via CloudTrail"/);
      expect(combinedContent).toMatch(/eventName\s*=\s*local\.sg_change_events/);
      expect(combinedContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"periodic_compliance"\s*{/);
      expect(combinedContent).toMatch(/schedule_expression\s*=\s*"rate\(1 hour\)"/);
      expect(combinedContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"security_events"\s*{/);
      expect(combinedContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.general\.arn/);
    });
  });

  describe("SNS Topic", () => {
    test("creates SNS topic for security alerts (KMS protected)", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{/);
      expect(combinedContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.general\.id/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID and subnet IDs", () => {
      expect(combinedContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(combinedContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(combinedContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(combinedContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(combinedContent).toMatch(/output\s+"db_subnet_ids"\s*{/);
    });

    test("outputs security groups, NLB DNS, bastion DNS, ASG, RDS, S3", () => {
      expect(combinedContent).toMatch(/output\s+"bastion_sg_id"\s*{/);
      expect(combinedContent).toMatch(/output\s+"app_sg_id"\s*{/);
      expect(combinedContent).toMatch(/output\s+"rds_sg_id"\s*{/);
      expect(combinedContent).toMatch(/output\s+"nlb_dns_name"\s*{/);
      expect(combinedContent).toMatch(/value\s*=\s*aws_lb\.app\.dns_name/);
      expect(combinedContent).toMatch(/output\s+"bastion_public_dns"\s*{/);
      expect(combinedContent).toMatch(/output\s+"asg_name"\s*{/);
      expect(combinedContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(combinedContent).toMatch(/output\s+"logs_bucket_name"\s*{/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("many resources have Name tag with prod- prefix", () => {
      const resourcePattern = /Name\s*=\s*"prod-[^"]+/g;
      const matches = combinedContent.match(resourcePattern) || [];
      expect(matches.length).toBeGreaterThan(15);
    });

    test("many Name tags include environment suffix", () => {
      const suffixPattern = /Name\s*=\s*"[^"]*\$\{local\.env_suffix\}"/g;
      const matches = combinedContent.match(suffixPattern) || [];
      expect(matches.length).toBeGreaterThan(10);
    });
  });

  describe("Security Requirements", () => {
    test("EC2 instances in private subnets (ASG)", () => {
      expect(combinedContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(combinedContent).not.toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public/);
    });

    test("RDS is not public and uses db subnets", () => {
      expect(combinedContent).toMatch(/publicly_accessible\s*=\s*false/);
      expect(combinedContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.db\[\*\]\.id/);
    });

    test("all S3 buckets are encrypted with KMS", () => {
      expect(combinedContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.general\.arn/);
      expect(combinedContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("no CloudTrail, ACM, or WAF resources", () => {
      expect(combinedContent).not.toMatch(/resource\s+"aws_cloudtrail"/);
      expect(combinedContent).not.toMatch(/resource\s+"aws_acm/);
      expect(combinedContent).not.toMatch(/resource\s+"aws_waf/);
    });
  });

  describe("State Management", () => {
    test("DynamoDB table for state locking is included", () => {
      expect(combinedContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"\s*{/);
      expect(combinedContent).toMatch(/hash_key\s*=\s*"LockID"/);
    });
  });

  describe("Data Sources", () => {
    test("uses data source for availability zones", () => {
      expect(combinedContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("uses data source for AMI", () => {
      expect(combinedContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
      expect(combinedContent).toMatch(/most_recent\s*=\s*true/);
    });

    test("uses data source for caller identity", () => {
      expect(combinedContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });
});
