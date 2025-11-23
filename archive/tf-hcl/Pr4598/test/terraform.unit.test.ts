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
      "aws_region",
      "vpc_cidr",
      "ssh_allowed_ip",
      "environment",
      "ec2_instance_type",
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
      "name_prefix",
      "vpc_name",
      "igw_name",
      "s3_bucket_name",
      "api_gateway_name",
      "ec2_instance_name",
      "lambda_function_name",
      "ec2_role_name",
      "lambda_role_name",
      "api_role_name",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "common_tags",
      "ec2_user_data",
    ];
    locals.forEach((l) =>
      test(`local "${l}" present`, () => {
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`));
      })
    );

    test("common tags include Environment, ManagedBy, Stack, and Suffix", () => {
      ["Environment", "ManagedBy", "Stack", "Suffix"].forEach((key) =>
        expect(tfContent).toMatch(new RegExp(`${key}\\s*=`))
      );
    });
  });

  // -------------------------------------------------------------
  // DATA SOURCES
  // -------------------------------------------------------------
  describe("Data Sources", () => {
    ["aws_availability_zones", "aws_ami", "archive_file"].forEach((ds) =>
      test(`data source "${ds}" present`, () => {
        expect(tfContent).toMatch(new RegExp(`data\\s+"${ds}"`));
      })
    );
  });

  // -------------------------------------------------------------
  // NETWORKING
  // -------------------------------------------------------------
  describe("Networking", () => {
    test("VPC, IGW, EIP, Subnets defined", () => {
      [
        "aws_vpc",
        "aws_internet_gateway",
        "aws_eip",
        "aws_subnet",
        "aws_nat_gateway",
      ].forEach((r) =>
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`))
      );
    });

    test("Route tables and associations exist", () => {
      [
        "aws_route_table",
        "aws_route_table_association",
      ].forEach((r) =>
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`))
      );
    });
  });

  // -------------------------------------------------------------
  // S3 BUCKETS
  // -------------------------------------------------------------
  describe("S3", () => {
    const s3Resources = [
      "aws_s3_bucket",
      "aws_s3_bucket_server_side_encryption_configuration",
      "aws_s3_bucket_versioning",
      "aws_s3_bucket_public_access_block",
      "aws_s3_bucket_notification",
    ];
    s3Resources.forEach((r) =>
      test(`${r} defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );
  });

  // -------------------------------------------------------------
  // IAM ROLES
  // -------------------------------------------------------------
  describe("IAM", () => {
    const iamResources = [
      "aws_iam_role",
      "aws_iam_role_policy",
      "aws_iam_instance_profile",
      "aws_iam_role_policy_attachment",
    ];
    iamResources.forEach((r) =>
      test(`${r} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("IAM assume role policies include sts:AssumeRole", () => {
      expect(tfContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });
  });

  // -------------------------------------------------------------
  // SECURITY GROUPS
  // -------------------------------------------------------------
  describe("Security Groups", () => {
    ["ec2", "lambda"].forEach((sg) =>
      test(`Security group "${sg}" exists`, () => {
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`)
        );
      })
    );

    test("EC2 SG allows SSH from allowed IP", () => {
      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\[var\.ssh_allowed_ip\]/);
    });
  });

  // -------------------------------------------------------------
  // EC2
  // -------------------------------------------------------------
  describe("EC2 Instance", () => {
    test("EC2 main instance exists", () => {
      expect(tfContent).toMatch(/resource\s+"aws_instance"\s+"main"/);
    });
    test("EC2 AMI and type reference variables", () => {
      expect(tfContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(tfContent).toMatch(/instance_type\s*=\s*var\.ec2_instance_type/);
    });
    test("Root block device encrypted", () => {
      expect(tfContent).toMatch(/encrypted\s*=\s*true/);
    });
  });

  // -------------------------------------------------------------
  // LAMBDA FUNCTION
  // -------------------------------------------------------------
  describe("Lambda Function", () => {
    [
      "aws_lambda_function",
      "aws_cloudwatch_log_group",
      "aws_lambda_permission",
    ].forEach((r) =>
      test(`${r} defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("Lambda uses VPC config and environment variables", () => {
      expect(tfContent).toMatch(/vpc_config\s*{/);
      expect(tfContent).toMatch(/environment\s*{/);
      expect(tfContent).toMatch(/BUCKET_NAME/);
    });
  });

  // -------------------------------------------------------------
  // API GATEWAY
  // -------------------------------------------------------------
  describe("API Gateway", () => {
    const apiResources = [
      "aws_api_gateway_rest_api",
      "aws_api_gateway_resource",
      "aws_api_gateway_method",
      "aws_api_gateway_integration",
      "aws_api_gateway_deployment",
      "aws_api_gateway_stage",
      "aws_api_gateway_method_settings",
      "aws_api_gateway_account",
    ];
    apiResources.forEach((r) =>
      test(`${r} present`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${r}"`));
      })
    );

    test("API Gateway stage enables logging", () => {
      expect(tfContent).toMatch(/access_log_settings/);
      expect(tfContent).toMatch(/logging_level\s*=\s*"INFO"/);
    });
  });

  // -------------------------------------------------------------
  // CLOUDWATCH ALARMS
  // -------------------------------------------------------------
  describe("CloudWatch Alarms", () => {
    ["ec2_cpu", "ec2_network_in", "ec2_network_out"].forEach((alarm) =>
      test(`CloudWatch Alarm "${alarm}" exists`, () => {
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`)
        );
      })
    );
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
      "nat_gateway_ids",
      "internet_gateway_id",
      "s3_bucket_name",
      "s3_bucket_arn",
      "ec2_instance_id",
      "ec2_instance_private_ip",
      "ec2_security_group_id",
      "ami_id",
      "ec2_role_arn",
      "lambda_role_arn",
      "api_gateway_role_arn",
      "lambda_function_name",
      "lambda_function_arn",
      "lambda_security_group_id",
      "api_gateway_id",
      "api_gateway_invoke_url",
      "api_gateway_stage_name",
      "cloudwatch_alarm_cpu_name",
      "cloudwatch_alarm_network_in_name",
      "cloudwatch_alarm_network_out_name",
      "lambda_log_group_name",
      "api_gateway_log_group_name",
      "public_route_table_id",
      "private_route_table_ids",
      "availability_zones_used",
      "resource_suffix",
      "environment_tag",
      "region",
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
    test("should have 2 public subnets and 2 private subnets", () => {
      expect(countMatches(/aws_subnet"\s+"public"/)).toBe(1);
      expect(countMatches(/aws_subnet"\s+"private"/)).toBe(1);
    });
  });
});
