// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

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

  describe("File Existence", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares bucket_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"bucket_region"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares bucket_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"bucket_name"\s*{/);
    });

    test("declares bucket_tags variable", () => {
      expect(stackContent).toMatch(/variable\s+"bucket_tags"\s*{/);
    });

    test("has locals block with common_tags", () => {
      expect(stackContent).toMatch(/locals\s*\{[\s\S]*common_tags\s*=[\s\S]*\}/);
    });

    test("has environment_suffix local variable", () => {
      expect(stackContent).toMatch(/environment_suffix\s*=\s*var\.environment\s*!=\s*"staging"\s*\?\s*"-\$\{var\.environment\}"\s*:\s*""/);
    });
  });

  describe("Provider Configuration", () => {
    test("does NOT declare provider in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf has primary AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf has secondary AWS provider with alias", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
    });
  });

  describe("KMS Resources", () => {
    test("declares KMS key resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("declares KMS alias resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("KMS key has proper naming convention", () => {
      expect(stackContent).toMatch(/TapStack\$\{local\.environment_suffix\}-\$\{var\.environment\}-\$\{local\.primary_region\}/);
    });
  });

  describe("VPC and Networking", () => {
    test("declares VPC data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_vpc"\s+"primary"/);
      expect(stackContent).toMatch(/data\s+"aws_vpc"\s+"secondary"/);
    });

    test("declares subnet data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_subnets"\s+"primary"/);
      expect(stackContent).toMatch(/data\s+"aws_subnets"\s+"secondary"/);
    });

    test("declares VPC peering connection", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"main"/);
    });

    test("declares VPC peering accepter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"\s+"main"/);
    });
  });

  describe("Security Groups", () => {
    test("declares ALB security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_secondary"/);
    });

    test("declares application security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_secondary"/);
    });

    test("declares RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("ALB security groups allow HTTP and HTTPS", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
    });
  });

  describe("S3 Resources", () => {
    test("declares S3 bucket for logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test("declares S3 bucket encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_encryption_configuration"\s+"logs"/);
    });

    test("declares S3 bucket public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
    });

    test("declares S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    });

    test("declares S3 bucket policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
    });

    test("S3 bucket uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  describe("IAM Resources", () => {
    test("declares EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("declares EC2 IAM policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
    });

    test("declares EC2 instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("IAM policy allows S3 and CloudWatch access", () => {
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
    });
  });

  describe("EC2 Resources", () => {
    test("declares AMI data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_secondary"/);
    });

    test("declares launch templates", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app_secondary"/);
    });

    test("launch templates use environment-based instance sizing", () => {
      expect(stackContent).toMatch(/var\.environment\s*==\s*"production"\s*\?\s*"t3\.medium"\s*:\s*"t3\.micro"/);
    });

    test("launch templates include user data", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(stackContent).toMatch(/yum install -y httpd/);
    });
  });

  describe("Load Balancer Resources", () => {
    test("declares application load balancers", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
    });

    test("declares target groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary"/);
    });

    test("declares listeners", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary"/);
    });

    test("ALB has access logs configured", () => {
      expect(stackContent).toMatch(/access_logs\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.bucket/);
    });
  });

  describe("Auto Scaling Resources", () => {
    test("declares auto scaling groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary"/);
    });

    test("auto scaling groups use environment-based sizing", () => {
      expect(stackContent).toMatch(/max_size\s*=\s*var\.environment\s*==\s*"production"\s*\?\s*6\s*:\s*3/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*var\.environment\s*==\s*"production"\s*\?\s*2\s*:\s*1/);
    });

    test("auto scaling groups reference target groups", () => {
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
    });
  });

  describe("RDS Resources", () => {
    test("declares RDS subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("declares RDS instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test("declares RDS replica", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"replica"/);
    });

    test("RDS uses environment-based sizing", () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*var\.environment\s*==\s*"production"\s*\?\s*"db\.t3\.small"\s*:\s*"db\.t3\.micro"/);
    });

    test("RDS has encryption enabled", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS has Multi-AZ for production", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"production"/);
    });
  });

  describe("DynamoDB Resources", () => {
    test("declares DynamoDB tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"secondary"/);
    });

    test("DynamoDB tables have encryption enabled", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB tables have point-in-time recovery", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB uses pay-per-request billing", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });
  });

  describe("Outputs", () => {
    test("declares ALB DNS outputs", () => {
      expect(stackContent).toMatch(/output\s+"primary_alb_dns"/);
      expect(stackContent).toMatch(/output\s+"secondary_alb_dns"/);
    });

    test("declares RDS endpoint outputs", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"rds_replica_endpoint"/);
    });

    test("declares DynamoDB table outputs", () => {
      expect(stackContent).toMatch(/output\s+"dynamodb_table_primary"/);
      expect(stackContent).toMatch(/output\s+"dynamodb_table_secondary"/);
    });

    test("declares S3 and KMS outputs", () => {
      expect(stackContent).toMatch(/output\s+"s3_logs_bucket"/);
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
    });

    test("sensitive outputs are marked as sensitive", () => {
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Naming Convention", () => {
    test("follows Service-Environment-Region naming pattern", () => {
      expect(stackContent).toMatch(/TapStack\$\{local\.environment_suffix\}-\$\{var\.environment\}-\$\{local\.primary_region\}/);
      expect(stackContent).toMatch(/TapStack\$\{local\.environment_suffix\}-\$\{var\.environment\}-\$\{local\.secondary_region\}/);
    });

    test("uses consistent resource prefixes", () => {
      expect(stackContent).toMatch(/tapstack\$\{local\.environment_suffix\}-\$\{var\.environment\}/);
    });
  });

  describe("Tagging", () => {
    test("resources use common_tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("common_tags include required fields", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Project\s*=\s*"TapStack"/);
      expect(stackContent).toMatch(/Owner\s*=\s*"terraform"/);
    });
  });

  describe("Multi-Region Setup", () => {
    test("uses provider aliases for secondary region", () => {
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test("references both primary and secondary regions", () => {
      expect(stackContent).toMatch(/local\.primary_region/);
      expect(stackContent).toMatch(/local\.secondary_region/);
    });
  });

  describe("Random Resources", () => {
    test("declares random_id for bucket suffix", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
    });

    test("random_id is used in bucket name", () => {
      expect(stackContent).toMatch(/random_id\.bucket_suffix\.hex/);
    });
  });

  describe("Data Sources", () => {
    test("declares ELB service account data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);
    });

    test("uses data sources for AMI lookup", () => {
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });
  });
});
