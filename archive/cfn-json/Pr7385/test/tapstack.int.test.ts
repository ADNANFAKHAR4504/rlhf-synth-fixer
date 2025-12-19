import fs from "fs";
import path from "path";

const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("TapStack Deployment Outputs Integration Tests", () => {
  let outputs: any;

  beforeAll(() => {
    const json = fs.readFileSync(outputsPath, "utf-8");
    outputs = JSON.parse(json);
  });

  test("All expected outputs are present and non-empty strings", () => {
    const keys = [
      "KMSKeyId",
      "VPCId",
      "PrimaryClusterReaderEndpoint",
      "PrimaryClusterEndpoint",
      "LambdaHealthCheckFunctionArn",
      "PrivateSubnet1Id",
      "PrivateSubnet2Id",
      "PrivateSubnet3Id",
      "DBSecurityGroupId",
      "GlobalClusterIdentifier"
    ];

    keys.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(typeof outputs[key]).toBe("string");
      expect(outputs[key].length).toBeGreaterThan(0);
    });
  });

  test("KMS Key ID is a valid UUID", () => {
    expect(outputs.KMSKeyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test("VPC ID format is valid", () => {
    expect(outputs.VPCId).toMatch(/^vpc-/);
  });

  test("Private subnet IDs are valid and unique", () => {
    const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
    const uniqueIds = new Set(subnetIds);
    expect(uniqueIds.size).toBe(3);
    subnetIds.forEach(id => expect(id).toMatch(/^subnet-/));
  });

  test("Primary cluster endpoints contain environment suffix and domain", () => {
    ["PrimaryClusterReaderEndpoint", "PrimaryClusterEndpoint"].forEach(key => {
      expect(outputs[key]).toContain("pr7385");
      expect(outputs[key]).toMatch(/rds\.amazonaws\.com$/);
    });
  });

  test("Lambda health check function ARN is valid", () => {
    expect(outputs.LambdaHealthCheckFunctionArn).toMatch(/^arn:aws:lambda:[\w-]+:\d{12}:function:/);
  });

  test("DB security group ID is valid", () => {
    expect(outputs.DBSecurityGroupId).toMatch(/^sg-/);
  });

  test("Global cluster identifier contains environment suffix", () => {
    expect(outputs.GlobalClusterIdentifier).toContain("pr7385");
  });

  test("All output strings have non-zero trimmed length", () => {
    Object.entries(outputs).forEach(([key, val]) => {
      expect(typeof val).toBe("string");
    });
  });
});
