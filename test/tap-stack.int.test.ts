/**
 * tap-stack.integration.test.ts
 *
 * Integration tests for the deployed TapStack stack.
 * Reads CloudFormation Outputs from:
 *   process.cwd() + "/cfn-outputs/all-outputs.json"
 *
 * Expected keys (from TapStack.yml Outputs):
 *  - VpcId
 *  - PublicSubnetIds (comma-separated 2 subnets)
 *  - PrivateSubnetIds (comma-separated 2 subnets)
 *  - InternetGatewayId
 *  - NatGatewayIds (either single nat-... or comma-separated 2 nat-...)
 *  - PublicRouteTableIds
 *  - PrivateRouteTableIds (comma-separated 2)
 *  - InstanceProfileName
 *  - Ec2RoleArn
 *  - AppBucketName
 *  - AppBucketArn
 *  - PrivateEc2InstanceIds (comma-separated 2)
 *  - Region
 *  - AccountId
 */

import * as fs from "fs";
import * as path from "path";

type OutputsArrayItem = { OutputKey: string; OutputValue: string };
type OutputsMap = Record<string, string>;

const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

function loadRaw(): any {
  const raw = fs.readFileSync(OUTPUTS_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * Accepts multiple shapes:
 * 1) { Stacks: [{ Outputs: [{OutputKey, OutputValue}, ...] }] }
 * 2) { Outputs: [{OutputKey, OutputValue}, ...] }
 * 3) [{OutputKey, OutputValue}, ...]
 * 4) { "VpcId": "vpc-...", ... }  (simple map)
 */
function normalizeOutputs(raw: any): OutputsMap {
  let outputsArray: OutputsArrayItem[] | null = null;

  if (Array.isArray(raw)) {
    // Case 3
    outputsArray = raw as OutputsArrayItem[];
  } else if (raw && Array.isArray(raw?.Stacks) && raw.Stacks[0]?.Outputs) {
    // Case 1
    outputsArray = raw.Stacks[0].Outputs as OutputsArrayItem[];
  } else if (raw && Array.isArray(raw?.Outputs)) {
    // Case 2
    outputsArray = raw.Outputs as OutputsArrayItem[];
  }

  if (outputsArray) {
    const map: OutputsMap = {};
    for (const item of outputsArray) {
      if (!item || !item.OutputKey) continue;
      map[item.OutputKey] = String(item.OutputValue ?? "");
    }
    return map;
  }

  // Case 4 — assume already a map
  const map: OutputsMap = {};
  for (const k of Object.keys(raw || {})) {
    map[k] = String(raw[k]);
  }
  return map;
}

function getOutputs(): OutputsMap {
  const raw = loadRaw();
  const out = normalizeOutputs(raw);
  expect(Object.keys(out).length).toBeGreaterThan(0);
  return out;
}

function splitCsv(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

const re = {
  id: {
    vpc: /^vpc-[a-z0-9]+$/,
    subnet: /^subnet-[a-z0-9]+$/,
    igw: /^igw-[a-z0-9]+$/,
    nat: /^nat-[a-z0-9]+$/,
    rtb: /^rtb-[a-z0-9]+$/,
    instance: /^i-[a-z0-9]+$/,
  },
  region: /^[a-z]{2}-[a-z]+-\d$/,
  account: /^\d{12}$/,
  arn: {
    s3Bucket: /^arn:aws[a-z-]*:s3:::[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/,
    iamRole: /^arn:aws[a-z-]*:iam::\d{12}:role\/.+$/,
  },
  bucketDNS: /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/, // allow dots & hyphens, 3..63 total
};

describe("TapStack Integration - Load & Shape", () => {
  test("Outputs file exists and is parseable", () => {
    expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
    const data = loadRaw();
    expect(data).toBeTruthy();
  });

  test("Normalized outputs contain required keys", () => {
    const out = getOutputs();
    const expected = [
      "VpcId",
      "PublicSubnetIds",
      "PrivateSubnetIds",
      "InternetGatewayId",
      "NatGatewayIds",
      "PublicRouteTableIds",
      "PrivateRouteTableIds",
      "InstanceProfileName",
      "Ec2RoleArn",
      "AppBucketName",
      "AppBucketArn",
      "PrivateEc2InstanceIds",
      "Region",
      "AccountId",
    ];
    for (const k of expected) {
      expect(out[k]).toBeDefined();
      expect(String(out[k]).length).toBeGreaterThan(0);
    }
  });
});

describe("TapStack Integration - Core IDs", () => {
  test("VpcId format", () => {
    const { VpcId } = getOutputs();
    expect(VpcId).toMatch(re.id.vpc);
  });

  test("InternetGatewayId format", () => {
    const { InternetGatewayId } = getOutputs();
    expect(InternetGatewayId).toMatch(re.id.igw);
  });

  test("PublicRouteTableIds format", () => {
    const { PublicRouteTableIds } = getOutputs();
    expect(PublicRouteTableIds).toMatch(re.id.rtb);
  });
});

describe("TapStack Integration - Subnets", () => {
  test("PublicSubnetIds has 2 distinct subnets with correct format", () => {
    const { PublicSubnetIds } = getOutputs();
    const list = splitCsv(PublicSubnetIds);
    expect(list.length).toBe(2);
    expect(uniq(list).length).toBe(2);
    for (const id of list) expect(id).toMatch(re.id.subnet);
  });

  test("PrivateSubnetIds has 2 distinct subnets with correct format", () => {
    const { PrivateSubnetIds } = getOutputs();
    const list = splitCsv(PrivateSubnetIds);
    expect(list.length).toBe(2);
    expect(uniq(list).length).toBe(2);
    for (const id of list) expect(id).toMatch(re.id.subnet);
  });

  test("Public and Private subnets do not overlap", () => {
    const { PublicSubnetIds, PrivateSubnetIds } = getOutputs();
    const pub = splitCsv(PublicSubnetIds);
    const pri = splitCsv(PrivateSubnetIds);
    const overlap = pub.filter((x) => pri.includes(x));
    expect(overlap.length).toBe(0);
  });
});

describe("TapStack Integration - NAT", () => {
  test("NatGatewayIds contains either one nat-* or two nat-* separated by comma", () => {
    const { NatGatewayIds } = getOutputs();
    const natList = splitCsv(NatGatewayIds);
    expect(natList.length === 1 || natList.length === 2).toBe(true);
    for (const id of natList) expect(id).toMatch(re.id.nat);
  });
});

describe("TapStack Integration - Private Route Tables", () => {
  test("PrivateRouteTableIds has 2 rtb-* ids", () => {
    const { PrivateRouteTableIds } = getOutputs();
    const list = splitCsv(PrivateRouteTableIds);
    expect(list.length).toBe(2);
    expect(uniq(list).length).toBe(2);
    for (const id of list) expect(id).toMatch(re.id.rtb);
  });
});

describe("TapStack Integration - Compute", () => {
  test("PrivateEc2InstanceIds contains 2 unique instance ids with correct format", () => {
    const { PrivateEc2InstanceIds } = getOutputs();
    const list = splitCsv(PrivateEc2InstanceIds);
    expect(list.length).toBe(2);
    expect(uniq(list).length).toBe(2);
    for (const id of list) expect(id).toMatch(re.id.instance);
  });

  test("InstanceProfileName is a non-empty string and ends with '-ec2-profile'", () => {
    const { InstanceProfileName } = getOutputs();
    expect(typeof InstanceProfileName).toBe("string");
    expect(InstanceProfileName.length).toBeGreaterThan(0);
    expect(InstanceProfileName.endsWith("-ec2-profile")).toBe(true);
  });

  test("Ec2RoleArn is a valid IAM role ARN and ends with '-ec2-role'", () => {
    const { Ec2RoleArn } = getOutputs();
    expect(Ec2RoleArn).toMatch(re.arn.iamRole);
    expect(Ec2RoleArn.includes("-ec2-role")).toBe(true);
  });
});

describe("TapStack Integration - S3 Bucket", () => {
  test("AppBucketName is DNS-compliant and <= 63 chars", () => {
    const { AppBucketName } = getOutputs();
    expect(AppBucketName).toMatch(re.bucketDNS);
    expect(AppBucketName.length).toBeLessThanOrEqual(63);
    // Must include "app" literal based on template naming
    expect(AppBucketName.includes("-app-")).toBe(true);
  });

  test("AppBucketArn matches ARN format and embeds bucket name", () => {
    const { AppBucketName, AppBucketArn } = getOutputs();
    expect(AppBucketArn).toMatch(re.arn.s3Bucket);
    expect(AppBucketArn.endsWith(AppBucketName)).toBe(true);
  });

  test("Bucket name includes AccountId and Region suffix from outputs", () => {
    const { AppBucketName, AccountId, Region } = getOutputs();
    // Example: <project>-<env>-app-<account>-<region>
    expect(AppBucketName.endsWith(`-${AccountId}-${Region}`)).toBe(true);
  });
});

describe("TapStack Integration - Global", () => {
  test("Region output matches AWS region pattern", () => {
    const { Region } = getOutputs();
    expect(Region).toMatch(re.region);
  });

  test("AccountId is 12 digits", () => {
    const { AccountId } = getOutputs();
    expect(AccountId).toMatch(re.account);
  });

  test("All comma-separated outputs are trimmed and non-empty tokens", () => {
    const {
      PublicSubnetIds,
      PrivateSubnetIds,
      PrivateRouteTableIds,
      NatGatewayIds,
      PrivateEc2InstanceIds,
    } = getOutputs();
    const allCSVs = [
      PublicSubnetIds,
      PrivateSubnetIds,
      PrivateRouteTableIds,
      NatGatewayIds,
      PrivateEc2InstanceIds,
    ];
    for (const csv of allCSVs) {
      const tokens = splitCsv(csv);
      for (const t of tokens) {
        expect(t).toBeTruthy();
        expect(t).toBe(t.trim());
      }
    }
  });
});
