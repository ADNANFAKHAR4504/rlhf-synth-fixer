import * as fs from "fs";
import * as path from "path";

describe("TapStack Integration Output Tests", () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, "../cfn-outputs/flat-outputs.json");
    const raw = fs.readFileSync(outputsPath, "utf8");
    outputs = JSON.parse(raw)["TapStackpr5664"];
  });

  test("VPC ID output exists and is valid", () => {
    expect(outputs["vpc-stack_vpc-id_B4D2EFC2"]).toMatch(/^vpc-/);
  });

  test("Public Subnets exist and are non-empty", () => {
    const subnets = outputs["vpc-stack_public-subnet-ids_9241F01E"] as string[];
    expect(Array.isArray(subnets)).toBe(true);
    expect(subnets.length).toBeGreaterThan(0);
    subnets.forEach((subnet: string) => expect(subnet).toMatch(/^subnet-/));
  });

  test("Private Subnets exist and are non-empty", () => {
    const subnets = outputs["vpc-stack_private-subnet-ids_7503D504"] as string[];
    expect(Array.isArray(subnets)).toBe(true);
    expect(subnets.length).toBeGreaterThan(0);
    subnets.forEach((subnet: string) => expect(subnet).toMatch(/^subnet-/));
  });

  test("Instance IDs array exists", () => {
    const instances = outputs["vpc-stack_instance-ids_07654B89"] as string[];
    expect(Array.isArray(instances)).toBe(true);
    expect(instances.length).toBeGreaterThanOrEqual(1);
    instances.forEach((instanceId: string) => expect(instanceId).toMatch(/^i-/));
  });

  test("NAT Gateway IDs exist", () => {
    const natIds = outputs["vpc-stack_nat-gateway-ids_979318AA"] as string[];
    expect(Array.isArray(natIds)).toBe(true);
    expect(natIds.length).toBeGreaterThan(0);
    natIds.forEach((natId: string) => expect(natId).toMatch(/^nat-/));
  });


  test("Flow log group name exists", () => {
    expect(outputs["vpc-stack_flow-log-group-name_24D2A9FC"])
      .toMatch(/^\/aws\/vpc\/flowlogs-/);
  });

  test("DynamoDB VPC Endpoint exists", () => {
    expect(outputs["vpc-stack_dynamodb-endpoint-id_8FD40CED"])
      .toMatch(/^vpce-/);
  });

  test("S3 VPC Endpoint exists", () => {
    expect(outputs["vpc-stack_s3-endpoint-id_75E8EEA3"])
      .toMatch(/^vpce-/);
  });

  test("Security Groups exist and look valid", () => {
    expect(outputs["vpc-stack_app-security-group-id_53770D0F"])
      .toMatch(/^sg-/);
    expect(outputs["vpc-stack_web-security-group-id_E4BFFCEB"])
      .toMatch(/^sg-/);
  });
});
