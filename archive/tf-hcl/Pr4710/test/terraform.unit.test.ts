import fs from "fs";
import path from "path";


describe("TapStack Terraform Unit Tests (Full Coverage)", () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
  });

  const countMatches = (regex: RegExp): number =>
    (tfContent.match(regex) || []).length;

  // -------------------------------------------------------------
  // VARIABLES
  // -------------------------------------------------------------
  describe("Variables", () => {
    const vars = [
      "region",
      "vpc_cidr",
      "availability_zones",
      "instance_type",
      "rds_instance_class",
      "min_size",
      "max_size",
      "desired_capacity"
    ];
    vars.forEach((v) =>
      test(`variable "${v}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`));
      })
    );
  });

  // -------------------------------------------------------------
  // LOCALS
  // -------------------------------------------------------------
  describe("Locals", () => {
    const locals = [
      "random_suffix",
      "common_tags",
      "name_prefix",
      "vpc_name",
      "igw_name",
      "nat_name",
      "sg_name",
      "alb_name",
      "asg_name",
      "rds_name",
      "s3_name",
      "cf_name",
      "role_name",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "db_subnet_cidrs"
    ];
    locals.forEach((l) =>
      test(`local "${l}" present`, () => {
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`));
      })
    );

    test("common_tags include environment, ManagedBy, Timestamp", () => {
      ["environment", "ManagedBy", "Timestamp"].forEach((key) =>
        expect(tfContent).toMatch(new RegExp(`${key}\\s*=`))
      );
    });
  });

  // -------------------------------------------------------------
  // DATA SOURCES
  // -------------------------------------------------------------
  describe("Data Sources", () => {
    const dataSources = [
      "aws_ami",
      "aws_caller_identity"
    ];
    dataSources.forEach((ds) =>
      test(`data source "${ds}" present`, () => {
        expect(tfContent).toMatch(new RegExp(`data\\s+"${ds}"`));
      })
    );
  });

  // -------------------------------------------------------------
  // NETWORKING RESOURCES
  // -------------------------------------------------------------
  describe("Networking Resources", () => {
    const networking = [
      "aws_vpc",
      "aws_internet_gateway",
      "aws_eip",
      "aws_subnet",
      "aws_nat_gateway",
      "aws_route_table",
      "aws_route_table_association"
    ];
    networking.forEach((r) =>
      test(`${r} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("aws_subnet public count is 2", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"public"/)).toBe(1);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });

    test("aws_subnet private count is 2", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"private"/)).toBe(1);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });

    test("aws_subnet database count is 3", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"database"/)).toBe(1);
      expect(tfContent).toMatch(/count\s*=\s*3/);
    });

    test("aws_route_table.private has count 2", () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/count\s*=\s*2/);
    });
  });

  // -------------------------------------------------------------
  // SECURITY GROUPS
  // -------------------------------------------------------------
  describe("Security Groups", () => {
    const securityGroups = ["alb", "ec2", "rds"];
    securityGroups.forEach((sg) =>
      test(`aws_security_group "${sg}" exists`, () => {
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`)
        );
      })
    );

    test("ALB SG contains ports 80 and 443 ingress", () => {
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
    });
  });

  // -------------------------------------------------------------
  // IAM ROLES AND POLICIES
  // -------------------------------------------------------------
  describe("IAM Roles and Policies", () => {
    const iamResources = [
      "aws_iam_role",
      "aws_iam_role_policy",
      "aws_iam_role_policy_attachment",
      "aws_iam_instance_profile",
    ];
    iamResources.forEach((r) =>
      test(`resource ${r} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("IAM role assume_role_policy includes sts:AssumeRole", () => {
      expect(tfContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });
  });

  // -------------------------------------------------------------
  // KMS KEYS
  // -------------------------------------------------------------
  describe("KMS Resources", () => {
    ["aws_kms_key", "aws_kms_alias"].forEach((res) =>
      test(`${res} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${res}"`));
      })
    );
  });

  // -------------------------------------------------------------
  // RDS DATABASE
  // -------------------------------------------------------------
  describe("RDS Resources", () => {
    const rdsResources = [
      "random_string",
      "random_password",
      "aws_db_subnet_group",
      "aws_rds_cluster",
      "aws_rds_cluster_instance",
      "aws_iam_role",
      "aws_iam_role_policy_attachment",
      "aws_secretsmanager_secret",
      "aws_secretsmanager_secret_version",
      "aws_ssm_parameter",
    ];
    rdsResources.forEach((r) =>
      test(`${r} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("RDS cluster 'engine' attribute set to aurora-mysql", () => {
      expect(tfContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
    });
  });

  // -------------------------------------------------------------
  // LAUNCH TEMPLATE
  // -------------------------------------------------------------
  describe("Launch Template", () => {
    test("aws_launch_template defined with correct keys", () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"/);
      expect(tfContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux2\.id/);
      expect(tfContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(tfContent).toMatch(/iam_instance_profile\s*{/);
      expect(tfContent).toMatch(/metadata_options\s*{/);
      expect(tfContent).toMatch(/user_data\s*=/);
    });
  });

  // -------------------------------------------------------------
  // LOAD BALANCER
  // -------------------------------------------------------------
  describe("Load Balancer and Target Group", () => {
    ["aws_lb", "aws_lb_target_group", "aws_lb_listener"].forEach((r) =>
      test(`${r} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("ALB health check configured", () => {
      expect(tfContent).toMatch(/health_check\s*{/);
      expect(tfContent).toMatch(/healthy_threshold/);
      expect(tfContent).toMatch(/unhealthy_threshold/);
    });
  });

  // -------------------------------------------------------------
  // AUTO SCALING
  // -------------------------------------------------------------
  describe("Auto Scaling", () => {
    ["aws_autoscaling_group", "aws_autoscaling_policy", "aws_cloudwatch_metric_alarm"].forEach((r) =>
      test(`${r} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("Auto Scaling group uses launch template and tags", () => {
      expect(tfContent).toMatch(/launch_template\s*{/);
      expect(tfContent).toMatch(/tag\s*{/);
    });

    test("CloudWatch Alarms monitor EC2 CPU utilization", () => {
      expect(tfContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });
  });

  // -------------------------------------------------------------
  // S3 BUCKETS
  // -------------------------------------------------------------
  describe("S3 Buckets and Configurations", () => {
    const s3Resources = [
      "aws_s3_bucket",
      "aws_s3_bucket_versioning",
      "aws_s3_bucket_server_side_encryption_configuration",
      "aws_s3_bucket_public_access_block",
      "aws_s3_bucket_lifecycle_configuration",
      "aws_s3_bucket_policy"
    ];
    s3Resources.forEach((r) =>
      test(`${r} defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("S3 static bucket has versioning enabled", () => {
      expect(tfContent).toMatch(/versioning_configuration\s*{/);
      expect(tfContent).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  // -------------------------------------------------------------
  // CLOUDFRONT
  // -------------------------------------------------------------
  describe("CloudFront Distribution and Related Resources", () => {
    [
      "aws_cloudfront_origin_access_identity",
      "aws_cloudfront_distribution",
      "aws_s3_bucket_policy"
    ].forEach((r) =>
      test(`${r} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("CloudFront distribution enablement and viewer certificate config", () => {
      expect(tfContent).toMatch(/enabled\s*=\s*true/);
      expect(tfContent).toMatch(/viewer_certificate\s*{/);
      expect(tfContent).toMatch(/cloudfront_default_certificate\s*=\s*true/);
    });
  });

  // -------------------------------------------------------------
  // CLOUDWATCH LOG GROUPS
  // -------------------------------------------------------------
  describe("CloudWatch Log Groups", () => {
    [
      "aws_cloudwatch_log_group"
    ].forEach((r) =>
      test(`${r} resource exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("Application log group retention days is 30", () => {
  expect(tfContent).toMatch(/name\s*=\s*["']\/aws\/application\/.*["']/);
  expect(tfContent).toMatch(/retention_in_days\s*=\s*30/);
});

    test("RDS log groups retention days is 7", () => {
      expect(tfContent).toMatch(/\/aws\/rds\/cluster\/.*\/error/);
      expect(tfContent).toMatch(/\/aws\/rds\/cluster\/.*\/general/);
      expect(tfContent).toMatch(/\/aws\/rds\/cluster\/.*\/slowquery/);
      expect(tfContent).toMatch(/retention_in_days\s*=\s*7/);
    });
  });

  // -------------------------------------------------------------
  // OUTPUTS
  // -------------------------------------------------------------
  describe("Outputs", () => {
    const outputs = [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "database_subnet_ids",
      "nat_gateway_ids",
      "internet_gateway_id",
      "alb_dns_name",
      "alb_arn",
      "target_group_arn",
      "auto_scaling_group_name",
      "launch_template_id",
      "rds_cluster_identifier",
      "rds_cluster_endpoint",
      "rds_cluster_reader_endpoint",
      "secrets_manager_secret_id",
      "ssm_parameter_username",
      "ssm_parameter_password",
      "s3_static_bucket_name",
      "s3_static_bucket_arn",
      "s3_logs_bucket_name",
      "cloudfront_distribution_id",
      "cloudfront_distribution_domain_name",
      "ec2_iam_role_arn",
      "ec2_instance_profile_arn",
      "rds_monitoring_role_arn",
      "kms_key_id",
      "kms_key_arn",
      "security_group_alb_id",
      "security_group_ec2_id",
      "security_group_rds_id",
      "cloudwatch_log_group_application",
      "cloudwatch_log_group_rds_error",
      "amazon_linux2_ami_id",
      "resource_suffix"
    ];
    outputs.forEach((o) =>
      test(`Output "${o}" defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${o}"`));
      })
    );
  });

  // -------------------------------------------------------------
  // COUNTS
  // -------------------------------------------------------------
  describe("Count validations", () => {
    test("should have at least one VPC", () => {
      expect(countMatches(/resource\s+"aws_vpc"/)).toBeGreaterThan(0);
    });
    test("should have exactly 2 public subnets", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"public"/)).toBe(1);
      expect(tfContent.match(/count\s*=\s*2/)).toBeTruthy();
    });
    test("should have exactly 2 private subnets", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"private"/)).toBe(1);
      expect(tfContent.match(/count\s*=\s*2/)).toBeTruthy();
    });
    test("should have exactly 3 database subnets", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"database"/)).toBe(1);
      expect(tfContent.match(/count\s*=\s*3/)).toBeTruthy();
    });
    test("should have exactly 2 NAT gateways", () => {
      expect(countMatches(/resource\s+"aws_nat_gateway"/)).toBe(1);
      expect(tfContent.match(/count\s*=\s*2/)).toBeTruthy();
    });
    test("should have exactly 2 route tables for private subnets", () => {
      expect(countMatches(/resource\s+"aws_route_table"\s+"private"/)).toBe(1);
      expect(tfContent.match(/count\s*=\s*2/)).toBeTruthy();
    });
  });
});
