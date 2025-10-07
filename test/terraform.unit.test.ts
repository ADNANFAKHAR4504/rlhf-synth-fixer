import fs from "fs";
import path from "path";

describe("TapStack Multi-Region Terraform Unit Tests (detailed)", () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
  });

  function countMatches(regex: RegExp) {
    const matches = tfContent.match(regex);
    return matches ? matches.length : 0;
  }

  describe("Variables & Data Sources", () => {
    test("defines all region and base variables", () => {
      expect(tfContent).toMatch(/variable\s+"primary_region"/);
      expect(tfContent).toMatch(/variable\s+"secondary_region"/);
      expect(tfContent).toMatch(/variable\s+"domain_name"/);
      expect(tfContent).toMatch(/variable\s+"environment"/);
    });

    test("contains data sources for AZs and AMIs in both regions", () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"primaryazs"/);
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"secondaryazs"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"primaryamazonlinux"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"secondaryamazonlinux"/);
      expect(tfContent).toMatch(/most_recent\s*=\s*true/);
    });
  });

  describe("Locals", () => {
    test("defines resource suffix and names for each region", () => {
      expect(tfContent).toMatch(/resourcesuffix/);
      expect(tfContent).toMatch(/primaryvpcname/);
      expect(tfContent).toMatch(/secondaryvpcname/);
      expect(tfContent).toMatch(/primaryvpccidr/);
      expect(tfContent).toMatch(/secondaryvpccidr/);
    });
    test("defines commontags", () => {
      expect(tfContent).toMatch(/commontags.*Environment/);
      expect(tfContent).toMatch(/ManagedBy.*Terraform/);
      expect(tfContent).toMatch(/Stack.*tap-stack/);
    });
  });

  describe("Random & Secrets", () => {
    test("creates random usernames and passwords for each region", () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rdsusernameprimary"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rdspasswordprimary"/);
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rdsusernamesecondary"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rdspasswordsecondary"/);
    });
    test("overridespecial characters pattern exists", () => {
      expect(tfContent).toMatch(/override_special\s*=\s*["']!-?["']/);
    });
  });

  describe("VPC and Networking", () => {
    test("defines VPCs and internet gateways for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"primaryvpc"/);
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"secondaryvpc"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primaryigw"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondaryigw"/);
    });

    test("creates all required subnets (public, private) for each region", () => {
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

  describe("Security Groups", () => {
    test("defines SGs for ALB, EC2, and RDS in both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primaryalbsg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondaryalbsg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primaryec2sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondaryec2sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primaryrdssg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondaryrdssg"/);
    });
  });

  describe("IAM Roles & Policies", () => {
    test("defines roles and profiles for EC2 and policies for S3, CloudWatch, SSM", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2profile"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3accesspolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatchpolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"ssmpolicy"/);
    });
  });

  describe("S3 Buckets", () => {
    test("creates S3 buckets for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primarybucket"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secondarybucket"/);
    });
  });

  describe("ACM, ALB & Target Groups", () => {
    test("defines ACM cert for CloudFront", () => {
      expect(tfContent).toMatch(/resource\s+"aws_acm_certificate"\s+"cloudfrontcert"/);
    });

    test("defines ALBs and listeners for each region", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"primaryalb"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"secondaryalb"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"primarylistener"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondarylistener"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primarytg"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondarytg"/);
    });
  });

  describe("Launch Templates & ASGs", () => {
    test("creates launch templates and ASGs per region", () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"primarylt"/);
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"secondarylt"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primaryasg"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondaryasg"/);
    });

    test("autoscaling policies for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"primaryscalingpolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"secondaryscalingpolicy"/);
    });
  });

  describe("RDS & DB Subnet Groups", () => {
    test("creates RDS instance and subnet group for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"primaryrds"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"secondaryrds"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primarydbsubnetgroup"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondarydbsubnetgroup"/);
    });
  });

  describe("Secrets Manager & SSM", () => {
    test("creates RDS credentials secrets for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"primaryrdssecret"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"secondaryrdssecret"/);
    });

    test("creates SSM parameters for DB credentials for both regions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primarydbhost"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primarydbusername"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primarydbpassword"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondarydbhost"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondarydbusername"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondarydbpassword"/);
    });
  });

  describe("CloudWatch & Alarms", () => {
    test("CloudWatch alarms and scaling policies exist per region", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primarycpualarm"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondarycpualarm"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"primaryscalingpolicy"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"secondaryscalingpolicy"/);
    });
  });

  describe("Outputs", () => {
    test("exports all key outputs for each region", () => {
      expect(tfContent).toMatch(/output\s+"primaryvpcid"/);
      expect(tfContent).toMatch(/output\s+"secondaryvpcid"/);
      expect(tfContent).toMatch(/output\s+"primaryvpccidr"/);
      expect(tfContent).toMatch(/output\s+"secondaryvpccidr"/);
      expect(tfContent).toMatch(/output\s+"primarydbsubnetgroupname"/);
      expect(tfContent).toMatch(/output\s+"secondarydbsubnetgroupname"/);
      expect(tfContent).toMatch(/output\s+"primaryalbsgid"/);
      expect(tfContent).toMatch(/output\s+"secondaryalbsgid"/);
      expect(tfContent).toMatch(/output\s+"primarys3bucketid"/);
      expect(tfContent).toMatch(/output\s+"secondarys3bucketid"/);
    });
  });

  describe("CloudFront and Route53", () => {
    test("exports CloudFront and Route 53 outputs", () => {
      expect(tfContent).toMatch(/output\s+"cloudfrontdistributionid"/);
      expect(tfContent).toMatch(/output\s+"route53zoneid"/);
    });
  });

  describe("Tagging & Sanity", () => {
    test("commontags used in VPC, ALB, subnets and resources", () => {
      expect(tfContent).toMatch(/commontags/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/i);
      expect(tfContent).toMatch(/\${var\.environment}/);
      expect(tfContent).toMatch(/Stack\s*=\s*"tap-stack"/);
    });
  });
});

