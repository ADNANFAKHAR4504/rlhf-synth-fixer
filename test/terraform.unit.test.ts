import fs from "fs";
import path from "path";

describe("TapStack.tf Terraform Unit Tests", () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
  });

  // =======================
  // VARIABLES & DATA SOURCES
  // =======================
  describe("Variables & Data Sources", () => {
    test("defines key variables", () => {
      expect(tfContent).toMatch(/variable\s+"primary_region"/);
      expect(tfContent).toMatch(/variable\s+"secondary_region"/);
      expect(tfContent).toMatch(/variable\s+"domain_name"/);
      expect(tfContent).toMatch(/variable\s+"environment"/);
    });
    test("contains data sources for AZs & AMIs", () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"primaryazs"/);
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"secondaryazs"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"primaryamazonlinux"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"secondaryamazonlinux"/);
    });
  });

  // ==========
  // LOCALS
  // ==========
  describe("Locals", () => {
    test("defines resource names, CIDRs, and tags", () => {
      expect(tfContent).toMatch(/locals?\s*{/);
      expect(tfContent).toMatch(/resourcesuffix/);
      expect(tfContent).toMatch(/primaryvpcname/);
      expect(tfContent).toMatch(/secondaryvpcname/);
      expect(tfContent).toMatch(/primaryvpccidr/);
      expect(tfContent).toMatch(/secondaryvpccidr/);
    });
    test("defines commontags with required keys", () => {
      expect(tfContent).toMatch(/commontags/);
      expect(tfContent).toMatch(/Environment/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/i);
      expect(tfContent).toMatch(/Stack\s*=\s*"tap-stack"/i);
    });
  });

  // ===============
  // RANDOM & SECRETS
  // ===============
  describe("Random & Secrets", () => {
    test("creates random username/password resources", () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rdsusernameprimary"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rdspasswordprimary"/);
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rdsusernamesecondary"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rdspasswordsecondary"/);
    });
    test("uses override_special in random password", () => {
      expect(tfContent).toMatch(/override_special\s*=\s*["']!-?["']/);
    });
  });

  // ======================
  // VPC & NETWORKING
  // ======================
  describe("VPC, IGW, Subnets", () => {
    test("creates VPCs and internet gateways in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"primaryvpc"/);
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"secondaryvpc"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primaryigw"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondaryigw"/);
    });
    test("contains required public and private subnets in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"primarypublicsubnet1"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"primarypublicsubnet2"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"primaryprivatesubnet1"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"primaryprivatesubnet2"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"secondarypublicsubnet1"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"secondarypublicsubnet2"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"secondaryprivatesubnet1"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"secondaryprivatesubnet2"/);
    });
  });

  // ======================
  // SECURITY GROUPS
  // ======================
  describe("Security Groups", () => {
    test("defines SGs for both ALB, EC2, RDS in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primaryalbsg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primaryec2sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primaryrdssg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondaryalbsg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondaryec2sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondaryrdssg"/);
    });
  });

  // ======================
  // IAM ROLES & POLICIES
  // ======================
  describe("IAM Roles & Policies", () => {
    test("defines EC2 role, instance profile and essential policies", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2profile"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3accesspolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatchpolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"ssmpolicy"/);
    });
  });

  // =============
  // S3 BUCKETS
  // =============
  describe("S3 Buckets", () => {
    test("creates S3 buckets for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primarybucket"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secondarybucket"/);
    });
  });

  // ==============================
  // ACM, ALB, TARGET GROUPS
  // ==============================
  describe("ACM, ALB, Target Groups", () => {
    test("defines ACM certificate for CloudFront", () => {
      expect(tfContent).toMatch(/resource\s+"aws_acm_certificate"\s+"cloudfrontcert"/);
    });
    test("defines ALBs, listeners, target groups in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"primaryalb"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"secondaryalb"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primarytg"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondarytg"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"primarylistener"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondarylistener"/);
    });
  });

  // ==============================
  // LAUNCH TEMPLATE & ASGs
  // ==============================
  describe("Launch Template & AutoScaling", () => {
    test("creates launch templates and ASGs in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"primarylt"/);
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"secondarylt"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primaryasg"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondaryasg"/);
    });
    test("defines autoscaling policies for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"primaryscalingpolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"secondaryscalingpolicy"/);
    });
  });

  // ==============================
  // RDS & DB Subnet Group
  // ==============================
  describe("RDS & DB Subnet", () => {
    test("RDS instances & DB subnet groups in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"primaryrds"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"secondaryrds"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primarydbsubnetgroup"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondarydbsubnetgroup"/);
    });
  });

  // ==============================
  // SECRETS MANAGER & SSM
  // ==============================
  describe("Secrets Manager & SSM", () => {
    test("creates RDS secrets and secret versions for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"primaryrdssecret"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"secondaryrdssecret"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"primaryrdssecretversion"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"secondaryrdssecretversion"/);
    });
    test("creates SSM parameters for DB connection for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primarydbhost"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primarydbusername"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primarydbpassword"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondarydbhost"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondarydbusername"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondarydbpassword"/);
    });
  });

  // ==============================
  // CLOUDWATCH & ALARMS
  // ==============================
  describe("CloudWatch & Alarms", () => {
    test("CloudWatch metric alarms exist for scaling in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primarycpualarm"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondarycpualarm"/);
    });
  });

  // ==============================
  // OUTPUTS
  // ==============================
  describe("Outputs", () => {
    test("exports all expected outputs", () => {
      [
        "environment", "primaryvpcid", "secondaryvpcid",
        "primaryvpccidr", "secondaryvpccidr", "domainname", "primaryregion", "secondaryregion",
        "primarypublicsubnet1id", "primarypublicsubnet2id",
        "primaryprivatesubnet1id", "primaryprivatesubnet2id",
        "secondarypublicsubnet1id", "secondarypublicsubnet2id",
        "secondaryprivatesubnet1id", "secondaryprivatesubnet2id",
        "primarynateip1", "primarynateip2", "secondarynateip1", "secondarynateip2",
        "primarynatgateway1id", "primarynatgateway2id", "secondarynatgateway1id", "secondarynatgateway2id",
        "primaryigwid", "secondaryigwid", "primarydbsubnetgroupname", "secondarydbsubnetgroupname",
        "cloudfrontdistributionid", "route53zoneid"
      ].forEach(name =>
        expect(tfContent).toMatch(new RegExp(`output\\s+"${name}"`))
      );
    });
  });

  // ==============================
  // TAGGING & SANITY
  // ==============================
  describe("Tagging & Sanity", () => {
    test("commontags are referenced in merged tags on key resources", () => {
      expect(tfContent).toMatch(/merge\(local\.commontags/);
    });
  });
});

