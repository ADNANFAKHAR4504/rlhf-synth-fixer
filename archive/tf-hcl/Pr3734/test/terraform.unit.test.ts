// Unit tests for Terraform multi-region infrastructure
import fs from "fs";
import path from "path";

const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerPath = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Multi-Region Infrastructure - Unit Tests", () => {
  let tfContent: string;
  let providerContent: string;
  let allContent: string;

  beforeAll(() => {
    tfContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    allContent = providerContent + "\n" + tfContent; // Combined content for provider tests
  });

  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("file is not empty", () => {
      expect(tfContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("declares terraform block with required providers", () => {
      expect(allContent).toMatch(/terraform\s*{/);
      expect(allContent).toMatch(/required_providers\s*{/);
    });

    test("configures AWS provider", () => {
      expect(allContent).toMatch(/aws\s*=\s*{/);
      expect(allContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test("configures archive provider for Lambda", () => {
      expect(allContent).toMatch(/archive\s*=\s*{/);
      expect(allContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });

    test("declares multiple AWS provider aliases for regions", () => {
      expect(tfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"us_east_1"/);
      expect(tfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"us_west_2"/);
    });

    test("configures us-east-1 region", () => {
      expect(tfContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test("configures us-west-2 region", () => {
      expect(tfContent).toMatch(/region\s*=\s*"us-west-2"/);
    });
  });

  describe("VPC Configuration", () => {
    test("creates VPC in us-east-1", () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"vpc_us_east_1"/);
    });

    test("creates VPC in us-west-2", () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"vpc_us_west_2"/);
    });

    test("creates Internet Gateway for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"igw_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"igw_us_west_2"/);
    });

    test("creates public subnets", () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public_us_west_2"/);
    });

    test("creates private subnets", () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private_us_west_2"/);
    });

    test("creates NAT Gateways", () => {
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_us_west_2"/);
    });

    test("creates route tables", () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"/);
    });

    test("creates VPC endpoints for private communication", () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc_endpoint"/);
    });
  });

  describe("Compute Resources", () => {
    test("creates launch templates for EC2", () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"app_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"app_us_west_2"/);
    });

    test("configures t2.micro instance type", () => {
      expect(tfContent).toMatch(/instance_type\s*=\s*"t2\.micro"/);
    });

    test("includes user_data for web server setup", () => {
      expect(tfContent).toMatch(/user_data\s*=/);
      expect(tfContent).toMatch(/httpd/);
    });

    test("creates Auto Scaling Groups", () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app_us_west_2"/);
    });

    test("configures ASG with min=2, max=5", () => {
      expect(tfContent).toMatch(/min_size\s*=\s*2/);
      expect(tfContent).toMatch(/max_size\s*=\s*5/);
    });

    test("creates Auto Scaling Policies", () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"/);
    });
  });

  describe("Load Balancer", () => {
    test("creates Application Load Balancer in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"app_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"app_us_west_2"/);
    });

    test("creates target groups", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test("creates ALB listeners", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test("configures health checks", () => {
      expect(tfContent).toMatch(/health_check\s*{/);
    });
  });

  describe("Database", () => {
    test("creates RDS MySQL instance", () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"mysql"/);
    });

    test("configures MySQL engine version 8.0", () => {
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("enables storage encryption", () => {
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("configures backup retention", () => {
      expect(tfContent).toMatch(/backup_retention_period/);
    });

    test("creates DB subnet group", () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"/);
    });
  });

  describe("AWS Backup", () => {
    test("creates backup vault", () => {
      expect(tfContent).toMatch(/resource\s+"aws_backup_vault"/);
    });

    test("creates backup plan with daily schedule", () => {
      expect(tfContent).toMatch(/resource\s+"aws_backup_plan"/);
      expect(tfContent).toMatch(/schedule.*cron/);
    });

    test("creates backup selection for RDS", () => {
      expect(tfContent).toMatch(/resource\s+"aws_backup_selection"/);
    });
  });

  describe("S3 Storage", () => {
    test("creates S3 bucket", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main_bucket"/);
    });

    test("enables versioning", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(tfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables server-side encryption", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test("configures access logging", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_logging"/);
    });

    test("blocks public access", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    });
  });

  describe("Lambda Function", () => {
    test("creates Lambda function", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lambda_function"\s+"data_processor"/);
    });

    test("uses archive_file data source for deployment package", () => {
      expect(tfContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
    });

    test("configures VPC for Lambda", () => {
      expect(tfContent).toMatch(/vpc_config\s*{/);
    });

    test("sets environment variables", () => {
      expect(tfContent).toMatch(/environment\s*{/);
      expect(tfContent).toMatch(/DB_HOST/);
      expect(tfContent).toMatch(/BUCKET_NAME/);
    });

    test("creates S3 bucket notification", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_notification"/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates IAM role for EC2 with SSM access", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("creates IAM role for Lambda", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    });

    test("creates IAM role for AWS Backup", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"backup_role"/);
    });

    test("creates IAM instance profile for EC2", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });

    test("attaches SSM managed policy to EC2 role", () => {
      expect(tfContent).toMatch(/AmazonSSMManagedInstanceCore/);
    });
  });

  describe("Security Groups", () => {
    test("creates security group for ALB", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb_us_west_2"/);
    });

    test("creates security group for EC2", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_us_west_2"/);
    });

    test("creates security group for RDS", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds_us_east_1"/);
    });

    test("creates security group for Lambda", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_us_east_1"/);
    });

    test("restricts SSH access to specific IP", () => {
      expect(tfContent).toMatch(/ssh_allowed_ip/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates CloudWatch alarms for EC2 CPU", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu_us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu_us_west_2"/);
    });

    test("creates CloudWatch alarm for RDS", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    });

    test("monitors CPU utilization", () => {
      expect(tfContent).toMatch(/CPUUtilization/);
    });
  });

  describe("Route 53 DNS", () => {
    test("creates Route 53 hosted zone", () => {
      expect(tfContent).toMatch(/resource\s+"aws_route53_zone"/);
    });

    test("creates health checks for ALBs", () => {
      expect(tfContent).toMatch(/resource\s+"aws_route53_health_check"\s+"us_east_1"/);
      expect(tfContent).toMatch(/resource\s+"aws_route53_health_check"\s+"us_west_2"/);
    });

    test("creates Route 53 records with failover routing", () => {
      expect(tfContent).toMatch(/resource\s+"aws_route53_record"\s+"www_primary"/);
      expect(tfContent).toMatch(/resource\s+"aws_route53_record"\s+"www_secondary"/);
    });

    test("configures failover routing policy", () => {
      expect(tfContent).toMatch(/failover_routing_policy/);
      expect(tfContent).toMatch(/PRIMARY/);
      expect(tfContent).toMatch(/SECONDARY/);
    });
  });

  describe("Tagging", () => {
    test("defines common tags with Environment and Team", () => {
      expect(tfContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(tfContent).toMatch(/Team\s*=\s*"DevOps"/);
    });

    test("applies tags to resources", () => {
      expect(tfContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe("Outputs", () => {
    test("exports ALB DNS names", () => {
      expect(tfContent).toMatch(/output\s+"alb_dns_us_east_1"/);
      expect(tfContent).toMatch(/output\s+"alb_dns_us_west_2"/);
    });

    test("exports RDS endpoint", () => {
      expect(tfContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("exports S3 bucket name", () => {
      expect(tfContent).toMatch(/output\s+"s3_bucket_name"/);
    });

    test("exports Lambda function name", () => {
      expect(tfContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test("exports Route 53 nameservers", () => {
      expect(tfContent).toMatch(/output\s+"route53_nameservers"/);
    });
  });

  describe("No Retain Policies", () => {
    test("does not use prevent_destroy lifecycle", () => {
      expect(tfContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test("RDS skip_final_snapshot is true", () => {
      expect(tfContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS deletion_protection is false", () => {
      expect(tfContent).toMatch(/deletion_protection\s*=\s*false/);
    });
  });
});
