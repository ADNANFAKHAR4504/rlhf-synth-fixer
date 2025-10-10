import fs from "fs";
import path from "path";

describe("tap_stack Terraform Unit Tests (Comprehensive)", () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
  });

  function countMatches(regex: RegExp) {
    const matches = tfContent.match(regex);
    return matches ? matches.length : 0;
  }

  // Variables & Locals
  describe("Variables & Locals", () => {
    test("contains key variables", () => {
      const vars = [
        "primaryregion", "secondaryregion", "thirdregion",
        "environment", "instancetype", "rdsinstanceclass",
        "minsize", "maxsize", "desiredcapacity"
      ];
      vars.forEach(v => expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`)));
    });

    test("has locals for suffix, tags, names, CIDRs, AZs", () => {
      [
        "randomsuffix", "commontags", "vpcnameprimary", "vpcnamesecondary", "vpcnamethird",
        "vpccidrprimary", "vpccidrsecondary", "vpccidrthird",
        "azsprimary", "azssecondary", "azsthird"
      ].forEach(l => expect(tfContent).toContain(l));
    });
  });

  // Random and Password/Secret Resources
  describe("Random & Secrets", () => {
    test("includes random and password resources", () => {
      [
        "random_string", "random_password"
      ].forEach(r => expect(tfContent).toContain(`resource "${r}`));
    });
    test("random for usernames, suffix, passwords", () => {
      [
        "rdsusernameprimary", "rdsusernamesecondary", "rdsusernamethird",
        "rdspasswordprimary", "rdspasswordsecondary", "rdspasswordthird",
        "suffix"
      ].forEach(n => expect(tfContent).toContain(n));
    });
  });

  // Data Sources
  describe("Data Sources", () => {
    test("correct AMI data for all regions", () => {
      [
        "data \"aws_ami\" \"amazonlinux2primary\"",
        "data \"aws_ami\" \"amazonlinux2secondary\"",
        "data \"aws_ami\" \"amazonlinux2third\""
      ].forEach(d => expect(tfContent).toContain(d));
    });
  });

  // VPC & Networking Primary Region
  describe("Primary Region Networking", () => {
    test("VPC, subnets, gateways, route tables", () => {
      [
        "resource \"aws_vpc\" \"primary\"",
        "resource \"aws_internet_gateway\" \"primary\"",
        "resource \"aws_subnet\" \"primarypublic\"",
        "resource \"aws_subnet\" \"primaryprivate\"",
        "resource \"aws_eip\" \"primarynat\"",
        "resource \"aws_nat_gateway\" \"primary\"",
        "resource \"aws_route_table\" \"primarypublic\"",
        "resource \"aws_route_table\" \"primaryprivate\"",
        "resource \"aws_route_table_association\" \"primarypublic\"",
        "resource \"aws_route_table_association\" \"primaryprivate\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Security Groups
  describe("Primary Security Groups", () => {
    test("ALB, EC2, RDS security groups", () => {
      [
        "resource \"aws_security_group\" \"primaryalb\"",
        "resource \"aws_security_group\" \"primaryec2\"",
        "resource \"aws_security_group\" \"primaryrds\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // IAM
  describe("IAM", () => {
    test("EC2 role, policy attachment, instance profile", () => {
      [
        "resource \"aws_iam_role\" \"ec2roleprimary\"",
        "resource \"aws_iam_role_policy_attachment\" \"ec2ssmprimary\"",
        "resource \"aws_iam_role_policy_attachment\" \"ec2cloudwatchprimary\"",
        "resource \"aws_iam_instance_profile\" \"ec2profileprimary\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Launch Templates & AutoScaling
  describe("Compute and Scaling Primary", () => {
    test("launch template, ASG", () => {
      [
        "resource \"aws_launch_template\" \"primary\"",
        "resource \"aws_autoscaling_group\" \"primary\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Load Balancer and Listener
  describe("ALB and Listeners Primary", () => {
    test("ALB, target group, listener", () => {
      [
        "resource \"aws_lb\" \"primary\"",
        "resource \"aws_lb_target_group\" \"primary\"",
        "resource \"aws_lb_listener\" \"primary\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // RDS & DB Subnet Group
  describe("Primary RDS Resources", () => {
    test("DB subnet group and instance", () => {
      [
        "resource \"aws_db_subnet_group\" \"primary\"",
        "resource \"aws_db_instance\" \"primary\""
      ].forEach(r => expect(tfContent).toContain(r));
    });

    test("SecretsManager secret for RDS", () => {
      [
        "resource \"aws_secretsmanager_secret\" \"rdsprimary\"",
        "resource \"aws_secretsmanager_secret_version\" \"rdsprimary\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // S3 (logging bucket)
  describe("S3 Primary", () => {
    test("bucket, versioning, encryption, public access block", () => {
      [
        "resource \"aws_s3_bucket\" \"logsprimary\"",
        "resource \"aws_s3_bucket_versioning\" \"logsprimary\"",
        "resource \"aws_s3_bucket_server_side_encryption_configuration\" \"logsprimary\"",
        "resource \"aws_s3_bucket_public_access_block\" \"logsprimary\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // CloudWatch
  describe("CloudWatch Primary", () => {
    test("primary log group exists", () => {
      expect(tfContent).toContain("resource \"aws_cloudwatch_log_group\" \"primary\"");
    });
  });

  // Secondary & Tertiary Regions – Sample Resource Presence
  describe("Secondary & Third Region Resource Types", () => {
    test("VPC, IGW, subnets, security groups for secondary and third", () => {
      [
        "resource \"aws_vpc\" \"secondary\"",
        "resource \"aws_internet_gateway\" \"secondary\"",
        "resource \"aws_subnet\" \"secondarypublic\"",
        "resource \"aws_security_group\" \"secondaryalb\"",
        "resource \"aws_db_instance\" \"secondary\"",
        "resource \"aws_vpc\" \"third\"",
        "resource \"aws_internet_gateway\" \"third\"",
        "resource \"aws_db_instance\" \"third\""
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Outputs (spot-check main outputs as present)
  describe("Outputs", () => {
    test("exports core outputs", () => {
      [
        "output \"randomsuffix\"",
        "output \"environmenttag\"",
        "output \"thirdvpcid\"",
        "output \"thirdpublicsubnetids\"",
        "output \"thirdalbdnsname\""
      ].forEach(o => expect(tfContent).toMatch(new RegExp(o)));
    });
  });

});


