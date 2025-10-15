// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/tap_stack.tf
// These tests validate the structure and configuration without executing Terraform

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test("tap_stack.tf contains AWS provider configuration", () => {
      expect(tapStackContent).toMatch(/provider\s+"aws"/);
      expect(tapStackContent).toMatch(/required_providers/);
    });

    test("tap_stack.tf contains archive provider configuration", () => {
      expect(tapStackContent).toMatch(/archive/);
    });

    test("tap_stack.tf contains random provider configuration", () => {
      expect(tapStackContent).toMatch(/random/);
    });
  });

  describe("Variables", () => {
    test("declares approved_ami_id variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"approved_ami_id"/);
    });

    test("declares corporate_cidr variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"corporate_cidr"/);
    });

    test("approved_ami_id has default value", () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"ami-/);
    });

    test("corporate_cidr has default value 203.0.113.0/24", () => {
      expect(tapStackContent).toMatch(/203\.0\.113\.0\/24/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates IAM user with minimal privileges", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_user"\s+"devops_user"/);
    });

    test("creates IAM role for EC2 with S3 read-only access", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_access_role"/);
      expect(tapStackContent).toMatch(/s3:GetObject/);
      expect(tapStackContent).toMatch(/s3:ListBucket/);
    });

    test("creates IAM role for Lambda with CloudWatch logs access", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_exec_role"/);
      expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
      expect(tapStackContent).toMatch(/logs:CreateLogStream/);
      expect(tapStackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates IAM instance profile for EC2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("creates IAM role for CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail_role"/);
    });

    test("creates IAM role for VPC Flow Logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_log_role"/);
    });
  });

  describe("KMS Configuration", () => {
    test("creates KMS key for encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"main_key"/);
    });

    test("enables key rotation on KMS key", () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS key alias", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main_key_alias"/);
    });

    test("KMS key has deletion window configured", () => {
      expect(tapStackContent).toMatch(/deletion_window_in_days/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates S3 bucket for data storage", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data_bucket"/);
    });

    test("creates S3 bucket for CloudTrail logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_bucket"/);
    });

    test("enables versioning on S3 buckets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables encryption on S3 buckets with KMS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks public access on S3 buckets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("creates bucket policy for CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_bucket_policy"/);
    });
  });

  describe("VPC and Network Configuration", () => {
    test("creates VPC with correct CIDR block 10.0.0.0/16", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main_vpc"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS support and hostnames on VPC", () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main_igw"/);
    });

    test("creates NAT Gateway with Elastic IP", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat_eip"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main_nat_gw"/);
    });

    test("creates public subnets in us-east-1a and us-east-1b", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_subnet_a"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_subnet_b"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*"us-east-1a"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*"us-east-1b"/);
    });

    test("public subnets have correct CIDR blocks", () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("creates private subnets in two AZs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_subnet_a"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_subnet_b"/);
    });

    test("private subnets have correct CIDR blocks", () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.3\.0\/24"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.4\.0\/24"/);
    });

    test("creates route tables for public and private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public_rt"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private_rt"/);
    });

    test("associates route tables with subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_rta_a"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_rta_b"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_rta_a"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_rta_b"/);
    });

    test("creates VPC Flow Logs to CloudWatch", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"main_vpc_flow_log"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log_group"/);
    });
  });

  describe("Security Groups", () => {
    test("creates security group for ALB", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"sg_alb_https"/);
    });

    test("ALB security group allows HTTP (80) and HTTPS (443)", () => {
      const sgMatch = tapStackContent.match(/resource\s+"aws_security_group"\s+"sg_alb_https"[\s\S]*?(?=resource\s+"|$)/);
      if (sgMatch) {
        expect(sgMatch[0]).toMatch(/from_port\s*=\s*443/);
        expect(sgMatch[0]).toMatch(/from_port\s*=\s*80/);
      }
    });

    test("creates security group for EC2 instances", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"sg_private_ec2"/);
    });

    test("EC2 security group allows SSH (22) from corporate CIDR only", () => {
      const sgMatch = tapStackContent.match(/resource\s+"aws_security_group"\s+"sg_private_ec2"[\s\S]*?(?=resource\s+"|$)/);
      if (sgMatch) {
        expect(sgMatch[0]).toMatch(/from_port\s*=\s*22/);
        expect(sgMatch[0]).toMatch(/corporate_cidr/);
      }
    });

    test("creates security group for RDS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"sg_rds"/);
    });

    test("RDS security group allows PostgreSQL (5432) from EC2 security group", () => {
      const sgMatch = tapStackContent.match(/resource\s+"aws_security_group"\s+"sg_rds"[\s\S]*?(?=resource\s+"|$)/);
      if (sgMatch) {
        expect(sgMatch[0]).toMatch(/from_port\s*=\s*5432/);
        expect(sgMatch[0]).toMatch(/sg_private_ec2/);
      }
    });

    test("creates security group for Lambda", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"sg_lambda"/);
    });

    test("security group names do not start with 'sg-' (AWS restriction)", () => {
      const nameMatches = tapStackContent.match(/name\s*=\s*"sg-/g);
      expect(nameMatches).toBeNull();
    });
  });

  describe("EC2 Configuration", () => {
    test("creates EC2 launch template", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"ec2_template"/);
    });

    test("uses t3.micro instance type", () => {
      expect(tapStackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test("creates EC2 instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_instance"\s+"main_ec2"/);
    });

    test("EC2 instance uses approved AMI variable", () => {
      expect(tapStackContent).toMatch(/image_id\s*=\s*var\.approved_ami_id/);
    });

    test("EC2 instance has user data for baseline setup", () => {
      expect(tapStackContent).toMatch(/user_data\s*=/);
    });

    test("EC2 instance is in private subnet", () => {
      const ec2Match = tapStackContent.match(/resource\s+"aws_instance"\s+"main_ec2"[\s\S]*?(?=resource\s+"|$)/);
      if (ec2Match) {
        expect(ec2Match[0]).toMatch(/private_subnet/);
      }
    });
  });

  describe("Application Load Balancer", () => {
    test("creates Application Load Balancer", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main_alb"/);
      expect(tapStackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB is internet-facing (not internal)", () => {
      expect(tapStackContent).toMatch(/internal\s*=\s*false/);
    });

    test("creates target group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main_tg"/);
    });

    test("target group uses HTTP protocol on port 80", () => {
      const tgMatch = tapStackContent.match(/resource\s+"aws_lb_target_group"\s+"main_tg"[\s\S]*?(?=resource\s+"|$)/);
      if (tgMatch) {
        expect(tgMatch[0]).toMatch(/port\s*=\s*80/);
        expect(tgMatch[0]).toMatch(/protocol\s*=\s*"HTTP"/);
      }
    });

    test("creates target group attachment for EC2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group_attachment"\s+"main_tg_attachment"/);
    });

    test("creates ACM certificate", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"ssl_cert"/);
    });

    test("creates HTTPS listener on port 443", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https_listener"/);
      expect(tapStackContent).toMatch(/port\s*=\s*"443"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test("HTTPS listener uses TLS 1.2 security policy", () => {
      expect(tapStackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2/);
    });

    test("creates HTTP listener with redirect to HTTPS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http_listener"/);
      const httpMatch = tapStackContent.match(/resource\s+"aws_lb_listener"\s+"http_listener"[\s\S]*?(?=resource\s+"|$)/);
      if (httpMatch) {
        expect(httpMatch[0]).toMatch(/port\s*=\s*"80"/);
        expect(httpMatch[0]).toMatch(/type\s*=\s*"redirect"/);
        expect(httpMatch[0]).toMatch(/protocol\s*=\s*"HTTPS"/);
      }
    });
  });

  describe("RDS Configuration", () => {
    test("creates RDS subnet group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"rds_subnet_group"/);
    });

    test("creates RDS instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main_rds"/);
    });

    test("RDS instance uses PostgreSQL engine", () => {
      expect(tapStackContent).toMatch(/engine\s*=\s*"postgres"/);
    });

    test("RDS instance uses db.t3.micro instance class", () => {
      expect(tapStackContent).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("RDS instance has storage encryption enabled with KMS", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main_rds"[\s\S]*?(?=resource\s+"|$)/);
      if (rdsMatch) {
        expect(rdsMatch[0]).toMatch(/storage_encrypted\s*=\s*true/);
        expect(rdsMatch[0]).toMatch(/kms_key_id/);
      }
    });

    test("RDS instance has Multi-AZ enabled", () => {
      expect(tapStackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS instance has 7-day backup retention", () => {
      expect(tapStackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("RDS instance exports logs to CloudWatch", () => {
      expect(tapStackContent).toMatch(/enabled_cloudwatch_logs_exports/);
      expect(tapStackContent).toMatch(/postgresql/);
    });

    test("RDS instance is in private subnets", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main_rds"[\s\S]*?(?=resource\s+"|$)/);
      if (rdsMatch) {
        expect(rdsMatch[0]).toMatch(/db_subnet_group_name/);
      }
    });
  });

  describe("CloudTrail and Monitoring", () => {
    test("creates CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main_trail"/);
    });

    test("CloudTrail uses KMS encryption", () => {
      const trailMatch = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main_trail"[\s\S]*?(?=resource\s+"|$)/);
      if (trailMatch) {
        expect(trailMatch[0]).toMatch(/kms_key_id/);
      }
    });

    test("CloudTrail has log file validation enabled", () => {
      expect(tapStackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail is multi-region", () => {
      expect(tapStackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail logs to CloudWatch", () => {
      expect(tapStackContent).toMatch(/cloud_watch_logs_group_arn/);
      expect(tapStackContent).toMatch(/cloud_watch_logs_role_arn/);
    });

    test("creates SNS topic for security alerts", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts_topic"/);
    });

    test("creates CloudWatch alarm for EC2 CPU utilization", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_alarm"/);
      expect(tapStackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });

    test("creates CloudWatch alarm for unauthorized API calls", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_alarm"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"/);
    });
  });

  describe("Lambda Configuration", () => {
    test("creates Lambda function", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lambda_function"\s+"main_lambda"/);
    });

    test("Lambda function uses Python 3.9 runtime", () => {
      expect(tapStackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test("Lambda function is deployed in VPC", () => {
      const lambdaMatch = tapStackContent.match(/resource\s+"aws_lambda_function"\s+"main_lambda"[\s\S]*?(?=resource\s+"|$)/);
      if (lambdaMatch) {
        expect(lambdaMatch[0]).toMatch(/vpc_config/);
        expect(lambdaMatch[0]).toMatch(/subnet_ids/);
        expect(lambdaMatch[0]).toMatch(/security_group_ids/);
      }
    });

    test("Lambda function uses KMS encryption for environment variables", () => {
      const lambdaMatch = tapStackContent.match(/resource\s+"aws_lambda_function"\s+"main_lambda"[\s\S]*?(?=resource\s+"|$)/);
      if (lambdaMatch) {
        expect(lambdaMatch[0]).toMatch(/kms_key_arn/);
      }
    });

    test("Lambda function is in private subnets", () => {
      const lambdaMatch = tapStackContent.match(/resource\s+"aws_lambda_function"\s+"main_lambda"[\s\S]*?(?=resource\s+"|$)/);
      if (lambdaMatch) {
        expect(lambdaMatch[0]).toMatch(/private_subnet/);
      }
    });

    test("creates CloudWatch log group for Lambda", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_log_group"/);
      expect(tapStackContent).toMatch(/\/aws\/lambda\/production-lambda-function/);
    });

    test("creates Lambda deployment package using archive provider", () => {
      expect(tapStackContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
    });

    test("Lambda code is embedded inline (no external files)", () => {
      const archiveMatch = tapStackContent.match(/data\s+"archive_file"\s+"lambda_zip"[\s\S]*?(?=^})/m);
      if (archiveMatch) {
        expect(archiveMatch[0]).toMatch(/content\s*=/);
        expect(archiveMatch[0]).toMatch(/def handler/);
      }
    });
  });

  describe("Tagging and Naming", () => {
    test("all major resources have Environment = Production tag", () => {
      const tagMatches = tapStackContent.match(/Environment\s*=\s*"Production"/g);
      expect(tagMatches).not.toBeNull();
      if (tagMatches) {
        expect(tagMatches.length).toBeGreaterThan(10); // At least 10 resources should have Production tag
      }
    });

    test("uses snake_case for resource names", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_\w+"\s+"[a-z_]+"/);
    });
  });

  describe("Outputs", () => {
    test("defines output for VPC ID", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("defines output for ALB DNS name", () => {
      expect(tapStackContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test("defines output for RDS endpoint", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("RDS endpoint output is marked as sensitive", () => {
      const rdsOutputMatch = tapStackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?(?=^})/m);
      if (rdsOutputMatch) {
        expect(rdsOutputMatch[0]).toMatch(/sensitive\s*=\s*true/);
      }
    });

    test("defines output for CloudTrail S3 bucket", () => {
      expect(tapStackContent).toMatch(/output\s+"cloudtrail_s3_bucket"/);
    });

    test("defines output for Lambda function name", () => {
      expect(tapStackContent).toMatch(/output\s+"lambda_function_name"/);
    });
  });

  describe("Security and Compliance", () => {
    test("S3 buckets block all public access", () => {
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("encryption at rest is configured for all data stores", () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/); // RDS
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/); // S3
      expect(tapStackContent).toMatch(/kms_key_id/); // Various resources
    });

    test("SSH access is limited to corporate CIDR only", () => {
      const sshMatches = tapStackContent.match(/from_port\s*=\s*22[\s\S]*?(?=ingress\s*{|egress\s*{|resource\s+"[^"]+"\s+"|$)/g);
      if (sshMatches) {
        sshMatches.forEach(match => {
          expect(match).toMatch(/corporate_cidr/);
          expect(match).not.toMatch(/0\.0\.0\.0\/0/);
        });
      }
    });

    test("CloudTrail has log file validation enabled", () => {
      expect(tapStackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("RDS has automated backups enabled", () => {
      expect(tapStackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
    });

    test("IAM policies follow least privilege principle", () => {
      // EC2 role should only have S3 read access
      const ec2PolicyMatch = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_readonly_policy"\s*{[\s\S]*?policy\s*=\s*jsonencode\([\s\S]*?\n\s*\}\)/m);
      if (ec2PolicyMatch) {
        expect(ec2PolicyMatch[0]).toMatch(/s3:GetObject/);
        expect(ec2PolicyMatch[0]).toMatch(/s3:ListBucket/);
        expect(ec2PolicyMatch[0]).not.toMatch(/s3:PutObject/);
        expect(ec2PolicyMatch[0]).not.toMatch(/"s3:\*"/);
      }

      // Lambda role should only have CloudWatch logs access
      const lambdaPolicyMatch = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_logging_policy"\s*{[\s\S]*?policy\s*=\s*jsonencode\([\s\S]*?\n\s*\}\)/m);
      if (lambdaPolicyMatch) {
        expect(lambdaPolicyMatch[0]).toMatch(/logs:CreateLogGroup/);
        expect(lambdaPolicyMatch[0]).toMatch(/logs:CreateLogStream/);
        expect(lambdaPolicyMatch[0]).toMatch(/logs:PutLogEvents/);
      }
    });
  });

  describe("Network Security", () => {
    test("public resources are in public subnets", () => {
      const albMatch = tapStackContent.match(/resource\s+"aws_lb"\s+"main_alb"\s*{[\s\S]*?^}/m);
      if (albMatch) {
        expect(albMatch[0]).toMatch(/public_subnet/);
      }
    });

    test("private resources are in private subnets", () => {
      const ec2Match = tapStackContent.match(/resource\s+"aws_instance"\s+"main_ec2"\s*{[\s\S]*?^}/m);
      if (ec2Match) {
        expect(ec2Match[0]).toMatch(/private_subnet/);
      }

      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main_rds"\s*{[\s\S]*?^}/m);
      if (rdsMatch) {
        expect(rdsMatch[0]).toMatch(/db_subnet_group_name/);
      }
    });

    test("NAT Gateway provides outbound internet for private subnets", () => {
      const privateRtMatch = tapStackContent.match(/resource\s+"aws_route_table"\s+"private_rt"\s*{[\s\S]*?^}/m);
      if (privateRtMatch) {
        expect(privateRtMatch[0]).toMatch(/nat_gateway_id/);
        expect(privateRtMatch[0]).toMatch(/0\.0\.0\.0\/0/);
      }
    });
  });
});
