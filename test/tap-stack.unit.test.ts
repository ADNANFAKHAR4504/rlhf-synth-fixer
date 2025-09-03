import * as fs from "fs";
import * as path from "path";

const template = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../lib/TapStack.json"), "utf8")
);

describe("TapStack CloudFormation Template - Unit Tests", () => {
  // -------------------------------
  // General Structure
  // -------------------------------
  test("Template should have valid format version", () => {
    expect(template.AWSTemplateFormatVersion).toBe("2010-09-09");
  });

  test("Template should have a description", () => {
    expect(template.Description).toMatch(/Secure Multi-Tier AWS Infrastructure/);
  });

  // -------------------------------
  // Parameters
  // -------------------------------
  test("Should define required parameters", () => {
    const params = template.Parameters;
    expect(params.EnvironmentName.Default).toBe("dev");
    expect(params.VpcACidr.Default).toBe("10.0.0.0/16");
    expect(params.VpcBCidr.Default).toBe("10.1.0.0/16");
    expect(params.KmsKeyAlias.Default).toBe("alias/tap_stack-key");
    expect(params.Az1Name.Default).toBe("us-east-1a");
    expect(Object.keys(params)).toContain("EnableGuardDuty");
    expect(Object.keys(params)).toContain("EnableConfig");
  });

  // -------------------------------
  // Conditions
  // -------------------------------
  test("Should define AZ usage and optional services conditions", () => {
    expect(Object.keys(template.Conditions)).toEqual(
      expect.arrayContaining(["CreateGuardDuty", "CreateConfig", "UseAz2", "UseAz3"])
    );
  });

  // -------------------------------
  // KMS
  // -------------------------------
  test("KmsKey should exist and enable key rotation", () => {
    const kms = template.Resources.KmsKey;
    expect(kms.Type).toBe("AWS::KMS::Key");
    expect(kms.Properties.EnableKeyRotation).toBe(true);
  });

  test("KmsAlias should point to KmsKey", () => {
    const alias = template.Resources.KmsAlias;
    expect(alias.Type).toBe("AWS::KMS::Alias");
    expect(alias.Properties.TargetKeyId.Ref).toBe("KmsKey");
  });

  // -------------------------------
  // VPCs and Subnets
  // -------------------------------
  test("VpcA and VpcB should be defined with correct CIDRs", () => {
    expect(template.Resources.VpcA.Properties.CidrBlock.Ref).toBe("VpcACidr");
    expect(template.Resources.VpcB.Properties.CidrBlock.Ref).toBe("VpcBCidr");
  });

  test("VpcA should contain at least one public and one private subnet", () => {
    expect(template.Resources.VpcAPublicSubnet1.Type).toBe("AWS::EC2::Subnet");
    expect(template.Resources.VpcAPrivateSubnet1.Type).toBe("AWS::EC2::Subnet");
  });

  test("VpcB should contain at least one public and one private subnet", () => {
    expect(template.Resources.VpcBPublicSubnet1.Type).toBe("AWS::EC2::Subnet");
    expect(template.Resources.VpcBPrivateSubnet1.Type).toBe("AWS::EC2::Subnet");
  });

  test("Optional subnets should be conditioned on AZ usage", () => {
    expect(template.Resources.VpcAPrivateSubnet2.Condition).toBe("UseAz2");
    expect(template.Resources.VpcBPrivateSubnet3.Condition).toBe("UseAz3");
  });

  // -------------------------------
  // Security Group
  // -------------------------------
  test("BastionSecurityGroup should allow SSH only from restricted CIDR", () => {
    const sg = template.Resources.BastionSecurityGroup.Properties;
    expect(sg.SecurityGroupIngress[0].FromPort).toBe(22);
    expect(sg.SecurityGroupIngress[0].CidrIp).toBe("203.0.113.0/24");
  });

  // -------------------------------
  // CloudTrail
  // -------------------------------
  test("CloudTrail bucket should enforce KMS encryption", () => {
    const ctBucket = template.Resources.CloudTrailBucket;
    expect(ctBucket.Type).toBe("AWS::S3::Bucket");
    expect(
      ctBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm
    ).toBe("aws:kms");
  });

  test("CloudTrail bucket policy should contain required ACL check and write statements", () => {
    const policy = template.Resources.CloudTrailBucketPolicy.Properties.PolicyDocument.Statement;
    const sids = policy.map((s: any) => s.Sid);
    expect(sids).toContain("AWSCloudTrailAclCheck");
    expect(sids).toContain("AWSCloudTrailWrite");
  });

  test("CloudTrail should depend on the bucket policy", () => {
    expect(template.Resources.CloudTrail.DependsOn).toBe("CloudTrailBucketPolicy");
  });

  // -------------------------------
  // AWS Config (Optional)
  // -------------------------------
  test("Config resources should be conditional", () => {
    expect(template.Resources.ConfigBucket.Condition).toBe("CreateConfig");
    expect(template.Resources.ConfigRecorder.Condition).toBe("CreateConfig");
  });

  // -------------------------------
  // GuardDuty (Optional)
  // -------------------------------
  test("GuardDuty detector should be conditional", () => {
    expect(template.Resources.GuardDutyDetector.Condition).toBe("CreateGuardDuty");
  });

  // -------------------------------
  // Secrets Manager
  // -------------------------------
  test("DbSecret should generate credentials with password excluded punctuation", () => {
    const secret = template.Resources.DbSecret.Properties.GenerateSecretString;
    expect(secret.PasswordLength).toBe(16);
    expect(secret.ExcludePunctuation).toBe(true);
  });

  // -------------------------------
  // Outputs
  // -------------------------------
  test("Template should export core outputs", () => {
    const outputs = Object.keys(template.Outputs);
    expect(outputs).toEqual(
      expect.arrayContaining([
        "VpcAId",
        "VpcBId",
        "VpcPeeringId",
        "CloudTrailBucketArn",
        "CloudTrailTrailArn",
        "KmsKeyArn",
        "DbSecretArn"
      ])
    );
  });

  test("Optional outputs should be conditioned properly", () => {
    expect(template.Outputs.ConfigBucketArn.Condition).toBe("CreateConfig");
    expect(template.Outputs.GuardDutyDetectorId.Condition).toBe("CreateGuardDuty");
  });
});
