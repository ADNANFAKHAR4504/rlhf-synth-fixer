import fs from "fs";
import path from "path";

describe("tap_stack Terraform Unit Tests (Accurate Names)", () => {
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
      [
        "primaryregion", "secondaryregion", "thirdregion",
        "environment", "instancetype", "rdsinstanceclass",
        "minsize", "maxsize", "desiredcapacity"
      ].forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });

    test("has locals for suffix, tags, names, CIDRs, AZs", () => {
      [
        "randomsuffix", "commontags",
        "vpcnameprimary", "vpcnamesecondary", "vpcnamethird",
        "vpccidrprimary", "vpccidrsecondary", "vpccidrthird",
        "azsprimary", "azssecondary", "azsthird"
      ].forEach(l => expect(tfContent).toContain(l));
    });
  });

  // Random and Password/Secret Resources
  describe("Random & Secrets", () => {
    test("includes random and password resources", () => {
      [
        "resource \"randomstring\" \"rdsusernameprimary\"",
        "resource \"randomstring\" \"rdsusernamesecondary\"",
        "resource \"randomstring\" \"rdsusernamethird\"",
        "resource \"randompassword\" \"rdspasswordprimary\"",
        "resource \"randompassword\" \"rdspasswordsecondary\"",
        "resource \"randompassword\" \"rdspasswordthird\"",
        "resource \"randomstring\" \"suffix\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // Data Sources
  describe("Data Sources", () => {
    test("AMI data for all regions", () => {
      [
        "data \"awsami\" \"amazonlinux2primary\"",
        "data \"awsami\" \"amazonlinux2secondary\"",
        "data \"awsami\" \"amazonlinux2third\""
      ].forEach(d => expect(tfContent.replace(/\s+/g, '')).toContain(d.replace(/\s+/g, '')));
    });
  });

  // Primary Region Networking
  describe("Primary Region Networking", () => {
    test("VPC, subnets, gateways, route tables", () => {
      [
        "resource \"awsvpc\" \"primary\"",
        "resource \"awsinternetgateway\" \"primary\"",
        "resource \"awssubnet\" \"primarypublic\"",
        "resource \"awssubnet\" \"primaryprivate\"",
        "resource \"awseip\" \"primarynat\"",
        "resource \"awsnatgateway\" \"primary\"",
        "resource \"awsroutetable\" \"primarypublic\"",
        "resource \"awsroutetable\" \"primaryprivate\"",
        "resource \"awsroutetableassociation\" \"primarypublic\"",
        "resource \"awsroutetableassociation\" \"primaryprivate\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // Security Groups
  describe("Primary Security Groups", () => {
    test("ALB, EC2, RDS security groups", () => {
      [
        "resource \"awssecuritygroup\" \"primaryalb\"",
        "resource \"awssecuritygroup\" \"primaryec2\"",
        "resource \"awssecuritygroup\" \"primaryrds\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // IAM
  describe("IAM", () => {
    test("EC2 role, policy attachment, instance profile", () => {
      [
        "resource \"awsiamrole\" \"ec2roleprimary\"",
        "resource \"awsiamrolepolicyattachment\" \"ec2ssmprimary\"",
        "resource \"awsiamrolepolicyattachment\" \"ec2cloudwatchprimary\"",
        "resource \"awsiaminstanceprofile\" \"ec2profileprimary\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // Launch Templates & AutoScaling
  describe("Compute and Scaling Primary", () => {
    test("launch template, ASG", () => {
      [
        "resource \"awslaunchtemplate\" \"primary\"",
        "resource \"awsautoscalinggroup\" \"primary\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // Load Balancer and Listener
  describe("ALB and Listeners Primary", () => {
    test("ALB, target group, listener", () => {
      [
        "resource \"awslb\" \"primary\"",
        "resource \"awslbtargetgroup\" \"primary\"",
        "resource \"awslblistener\" \"primary\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // RDS & DB Subnet Group
  describe("Primary RDS Resources", () => {
    test("DB subnet group, instance & secrets", () => {
      [
        "resource \"awsdbsubnetgroup\" \"primary\"",
        "resource \"awsdbinstance\" \"primary\"",
        "resource \"awssecretsmanagersecret\" \"rdsprimary\"",
        "resource \"awssecretsmanagersecretversion\" \"rdsprimary\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // S3 (logging bucket)
  describe("S3 Primary", () => {
    test("bucket, versioning, encryption, public access block", () => {
      [
        "resource \"awss3bucket\" \"logsprimary\"",
        "resource \"awss3bucketversioning\" \"logsprimary\"",
        "resource \"awss3bucketserversideencryptionconfiguration\" \"logsprimary\"",
        "resource \"awss3bucketpublicaccessblock\" \"logsprimary\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // CloudWatch
  describe("CloudWatch Primary", () => {
    test("primary log group exists", () => {
      expect(tfContent.replace(/\s+/g, '')).toContain("resource \"awscloudwatchloggroup\" \"primary\"");
    });
  });

  // Secondary & Third Region - Sample Resources
  describe("Secondary & Third Region Resource Types", () => {
    test("VPC, IGW, subnets, security groups for secondary and third", () => {
      [
        "resource \"awsvpc\" \"secondary\"",
        "resource \"awsinternetgateway\" \"secondary\"",
        "resource \"awssubnet\" \"secondarypublic\"",
        "resource \"awssecuritygroup\" \"secondaryalb\"",
        "resource \"awsdbinstance\" \"secondary\"",
        "resource \"awsvpc\" \"third\"",
        "resource \"awsinternetgateway\" \"third\"",
        "resource \"awsdbinstance\" \"third\""
      ].forEach(r => expect(tfContent.replace(/\s+/g, '')).toContain(r.replace(/\s+/g, '')));
    });
  });

  // Outputs (spot-check main outputs as present)
  describe("Outputs", () => {
    test("exports core outputs (sample)", () => {
      [
        "output \"randomsuffix\"",
        "output \"environmenttag\"",
        "output \"thirdvpcid\"",
        "output \"thirdpublicsubnetids\"",
        "output \"thirdalbdnsname\""
      ].forEach(o =>
        expect(tfContent.replace(/\s+/g, '')).toMatch(new RegExp(o.replace(/\s+/g, '')))
      );
    });
  });
});

