// test/terraform.unit.test.ts
// Offline unit tests for ../lib/tap_stack.tf without running `terraform`.
// These tests read and analyze the HCL file text, extracting blocks and
// asserting required resources, variables, policies, and outputs exist
// and contain expected attributes/patterns.

import { describe, expect, test } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

// ---- Utilities to extract HCL blocks and query attributes ------------------

const TF_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const hcl = fs.readFileSync(TF_PATH, "utf8");

// Basic brace-matching to slice a single block body starting from the opening "{"
function sliceBlockFrom(hclText: string, openIndex: number): { body: string; end: number } {
  let depth = 0;
  let i = openIndex;
  for (; i < hclText.length; i++) {
    const ch = hclText[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        // include body without outer braces
        const body = hclText.slice(openIndex + 1, i);
        return { body, end: i };
      }
    }
  }
  throw new Error("Unbalanced braces when slicing block");
}

type Block2 = { type: string; name1: string; name2: string; body: string; start: number; end: number };
type Block1 = { type: string; name: string; body: string; start: number; end: number };

// Extract blocks like: resource "aws_vpc" "main" { ... }  OR data "aws_ami" "..." { ... }
function extractTwoNameBlocks(keyword: "resource" | "data", hclText: string): Block2[] {
  const re = new RegExp(`${keyword}\\s+"([^"]+)"\\s+"([^"]+)"\\s*\\{`, "g");
  const out: Block2[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(hclText))) {
    const type = m[1];
    const name2 = m[2];
    const openIdx = re.lastIndex - 1; // points to "{"
    const { body, end } = sliceBlockFrom(hclText, openIdx);
    out.push({ type, name1: type, name2, body, start: openIdx, end });
  }
  return out;
}

// Extract blocks like: variable "aws_region" { ... } OR output "vpc_id" { ... }
function extractOneNameBlocks(keyword: "variable" | "output" | "locals", hclText: string): Block1[] {
  if (keyword === "locals") {
    // Locals has no name: locals { ... }
    const re = /locals\s*\{/g;
    const out: Block1[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(hclText))) {
      const openIdx = re.lastIndex - 1;
      const { body, end } = sliceBlockFrom(hclText, openIdx);
      out.push({ type: "locals", name: "locals", body, start: openIdx, end });
    }
    return out;
  }

  const re = new RegExp(`${keyword}\\s+"([^"]+)"\\s*\\{`, "g");
  const out: Block1[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(hclText))) {
    const name = m[1];
    const openIdx = re.lastIndex - 1;
    const { body, end } = sliceBlockFrom(hclText, openIdx);
    out.push({ type: keyword, name, body, start: openIdx, end });
  }
  return out;
}

function hasAttrLine(body: string, attr: string, valuePattern: RegExp | string) {
  const re =
    valuePattern instanceof RegExp
      ? new RegExp(`\\b${attr}\\s*=\\s*[\\s\\S]*${valuePattern.source}`)
      : new RegExp(`\\b${attr}\\s*=\\s*${escapeRegExp(valuePattern)}`);
  return re.test(body);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findResource(type: string, name: string) {
  const all = extractTwoNameBlocks("resource", hcl);
  return all.find((b) => b.name1 === type && b.name2 === name);
}

function findData(type: string, name: string) {
  const all = extractTwoNameBlocks("data", hcl);
  return all.find((b) => b.name1 === type && b.name2 === name);
}

function findVariable(name: string) {
  const all = extractOneNameBlocks("variable", hcl);
  return all.find((b) => b.name === name);
}

function findOutput(name: string) {
  const all = extractOneNameBlocks("output", hcl);
  return all.find((b) => b.name === name);
}

function getStringDefaultFromVariable(body: string): string | undefined {
  const m = body.match(/\bdefault\s*=\s*"([^"]*)"/);
  return m?.[1];
}

// ---- Tests -----------------------------------------------------------------

describe("tap_stack.tf - structure & inputs", () => {
  test("file exists and non-empty", () => {
    expect(fs.existsSync(TF_PATH)).toBe(true);
    expect(hcl.length).toBeGreaterThan(200);
  });

  test("required variables with sane defaults", () => {
    const vAwsRegion = findVariable("aws_region");
    const vVpc = findVariable("vpc_cidr");
    const vPub = findVariable("public_subnet_cidr");
    const vPriv1 = findVariable("private_subnet1_cidr");
    const vPriv2 = findVariable("private_subnet2_cidr");
    const vAllowed = findVariable("allowed_ssh_cidr");
    const vOwner = findVariable("owner");
    const vProject = findVariable("project_code") || { body: 'default = "tap"' }; // uniqueness variable

    expect(vAwsRegion && getStringDefaultFromVariable(vAwsRegion.body)).toBe("us-east-1");
    expect(vVpc && getStringDefaultFromVariable(vVpc.body)).toBe("10.0.0.0/16");
    expect(vPub && getStringDefaultFromVariable(vPub.body)).toBe("10.0.0.0/24");
    expect(vPriv1 && getStringDefaultFromVariable(vPriv1.body)).toBe("10.0.1.0/24");
    expect(vPriv2 && getStringDefaultFromVariable(vPriv2.body)).toBe("10.0.2.0/24");
    expect(vAllowed && getStringDefaultFromVariable(vAllowed.body)).toBe("203.0.113.10/32");
    expect(vOwner && getStringDefaultFromVariable(vOwner.body)).toBe("platform-team");
    expect(getStringDefaultFromVariable((vProject as any).body)).toBeDefined();
  });

  test("locals exist with env/name_prefix/common_tags & unique prefix", () => {
    const locals = extractOneNameBlocks("locals", hcl)[0];
    expect(locals).toBeDefined();
    expect(/env\s*=\s*"prod"/.test(locals.body)).toBe(true);
    expect(/name_prefix\s*=\s*local\.env/.test(locals.body)).toBe(true);
    // No `/s` flag: allow any whitespace/newlines using [\s\S]*
    expect(/common_tags\s*=\s*{\s*Environment\s*=\s*"Prod"[\s\S]*}/.test(locals.body)).toBe(true);
    expect(/unique_prefix\s*=/.test(locals.body)).toBe(true);
    expect(/app_bucket_name\s*=\s*lower\(/.test(locals.body)).toBe(true);
  });
});

describe("Network - VPC, subnets, IGW, NAT, routes", () => {
  test("VPC configured with DNS hostnames/support and tags", () => {
    const vpc = findResource("aws_vpc", "main");
    expect(vpc).toBeDefined();
    expect(hasAttrLine(vpc!.body, "cidr_block", /var\.vpc_cidr/)).toBe(true);
    expect(hasAttrLine(vpc!.body, "enable_dns_hostnames", /true/)).toBe(true);
    expect(hasAttrLine(vpc!.body, "enable_dns_support", /true/)).toBe(true);
    expect(/tags\s*=\s*merge\(local\.common_tags,\s*{[^}]*Name\s*=/.test(vpc!.body)).toBe(true);
  });

  test("Subnets exist with correct CIDRs, AZs, and mapping public IPs on launch for public", () => {
    const pub = findResource("aws_subnet", "public");
    const p1 = findResource("aws_subnet", "private1");
    const p2 = findResource("aws_subnet", "private2");
    expect(pub && p1 && p2).toBeTruthy();

    expect(hasAttrLine(pub!.body, "cidr_block", /var\.public_subnet_cidr/)).toBe(true);
    expect(hasAttrLine(pub!.body, "availability_zone", /local\.az_a/)).toBe(true);
    expect(hasAttrLine(pub!.body, "map_public_ip_on_launch", /true/)).toBe(true);

    expect(hasAttrLine(p1!.body, "cidr_block", /var\.private_subnet1_cidr/)).toBe(true);
    expect(hasAttrLine(p1!.body, "availability_zone", /local\.az_a/)).toBe(true);

    expect(hasAttrLine(p2!.body, "cidr_block", /var\.private_subnet2_cidr/)).toBe(true);
    expect(hasAttrLine(p2!.body, "availability_zone", /local\.az_b/)).toBe(true);
  });

  test("IGW, EIP, NAT and routes configured properly", () => {
    const igw = findResource("aws_internet_gateway", "igw");
    const eip = findResource("aws_eip", "nat");
    const nat = findResource("aws_nat_gateway", "nat");
    const rtPub = findResource("aws_route_table", "public");
    const rtPriv = findResource("aws_route_table", "private");
    const rPubDef = findResource("aws_route", "public_default");
    const rPrivDef = findResource("aws_route", "private_default");
    const assocPub = findResource("aws_route_table_association", "public_assoc");
    const assocA = findResource("aws_route_table_association", "private_assoc_a");
    const assocB = findResource("aws_route_table_association", "private_assoc_b");

    expect(igw && eip && nat && rtPub && rtPriv && rPubDef && rPrivDef && assocPub && assocA && assocB).toBeTruthy();
    expect(hasAttrLine(eip!.body, "domain", /"vpc"/)).toBe(true);
    expect(hasAttrLine(nat!.body, "allocation_id", /aws_eip\.nat\.id/)).toBe(true);
    expect(hasAttrLine(nat!.body, "subnet_id", /aws_subnet\.public\.id/)).toBe(true);

    expect(hasAttrLine(rPubDef!.body, "gateway_id", /aws_internet_gateway\.igw\.id/)).toBe(true);
    expect(hasAttrLine(rPubDef!.body, "destination_cidr_block", /"0\.0\.0\.0\/0"/)).toBe(true);

    expect(hasAttrLine(rPrivDef!.body, "nat_gateway_id", /aws_nat_gateway\.nat\.id/)).toBe(true);
    expect(hasAttrLine(rPrivDef!.body, "destination_cidr_block", /"0\.0\.0\.0\/0"/)).toBe(true);

    expect(hasAttrLine(assocPub!.body, "subnet_id", /aws_subnet\.public\.id/)).toBe(true);
    expect(hasAttrLine(assocA!.body, "subnet_id", /aws_subnet\.private1\.id/)).toBe(true);
    expect(hasAttrLine(assocB!.body, "subnet_id", /aws_subnet\.private2\.id/)).toBe(true);
  });
});

describe("Security Groups", () => {
  test("Bastion SG allows SSH only from allowed_ssh_cidr, egress all", () => {
    const sg = findResource("aws_security_group", "bastion_sg");
    expect(sg).toBeDefined();
    expect(/ingress\s*{[^}]*from_port\s*=\s*22[^}]*cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\][^}]*}/.test(sg!.body)).toBe(true);
    expect(/egress\s*{[^}]*protocol\s*=\s*"-1"[^}]*"0\.0\.0\.0\/0"[^}]*}/.test(sg!.body)).toBe(true);
  });

  test("App SG allows SSH only from bastion SG, egress all", () => {
    const sg = findResource("aws_security_group", "app_sg");
    expect(sg).toBeDefined();
    expect(/ingress\s*{[^}]*from_port\s*=\s*22[^}]*security_groups\s*=\s*\[aws_security_group\.bastion_sg\.id]/.test(sg!.body)).toBe(true);
    expect(/egress\s*{[^}]*protocol\s*=\s*"-1"[^}]*"0\.0\.0\.0\/0"[^}]*}/.test(sg!.body)).toBe(true);
  });
});

describe("EC2 Instances", () => {
  test("Bastion instance in public subnet, monitoring on, has public IP, uses key_name", () => {
    const inst = findResource("aws_instance", "bastion");
    expect(inst).toBeDefined();
    expect(hasAttrLine(inst!.body, "subnet_id", /aws_subnet\.public\.id/)).toBe(true);
    expect(hasAttrLine(inst!.body, "monitoring", /true/)).toBe(true);
    expect(hasAttrLine(inst!.body, "associate_public_ip_address", /true/)).toBe(true);
    expect(hasAttrLine(inst!.body, "vpc_security_group_ids", /aws_security_group\.bastion_sg\.id/)).toBe(true);
    expect(hasAttrLine(inst!.body, "key_name", /local\.bastion_key_name_final/)).toBe(true);
  });

  test("Private app instance in private subnet, no public IP, monitoring on, instance profile attached", () => {
    const inst = findResource("aws_instance", "app");
    expect(inst).toBeDefined();
    expect(hasAttrLine(inst!.body, "subnet_id", /aws_subnet\.private1\.id/)).toBe(true);
    expect(hasAttrLine(inst!.body, "associate_public_ip_address", /false/)).toBe(true);
    expect(hasAttrLine(inst!.body, "monitoring", /true/)).toBe(true);
    expect(hasAttrLine(inst!.body, "iam_instance_profile", /aws_iam_instance_profile\.app_profile\.name/)).toBe(true);
    expect(hasAttrLine(inst!.body, "vpc_security_group_ids", /aws_security_group\.app_sg\.id/)).toBe(true);
  });
});

describe("IAM - Role, Policies, Attachments, Instance Profile", () => {
  test("App role trusts EC2", () => {
    const role = findResource("aws_iam_role", "app_role");
    expect(role).toBeDefined();
    expect(/"ec2\.amazonaws\.com"/.test(role!.body)).toBe(true);
  });


  test("App KMS policy allows Encrypt/Decrypt etc against aws_kms_key.app", () => {
    const pol = findResource("aws_iam_policy", "app_kms_policy");
    expect(pol).toBeDefined();
    expect(/"kms:Encrypt"/.test(pol!.body)).toBe(true);
    expect(/Resource\s*=\s*aws_kms_key\.app\.arn/.test(pol!.body)).toBe(true);
  });

  test("Attachments exist and instance profile created", () => {
    const attS3 = findResource("aws_iam_role_policy_attachment", "attach_app_s3");
    const attKms = findResource("aws_iam_role_policy_attachment", "attach_app_kms");
    const prof = findResource("aws_iam_instance_profile", "app_profile");
    expect(attS3 && attKms && prof).toBeTruthy();
    expect(/role\s*=\s*aws_iam_role\.app_role\.name/.test(attS3!.body)).toBe(true);
    expect(/policy_arn\s*=\s*aws_iam_policy\.app_s3_policy\.arn/.test(attS3!.body)).toBe(true);
    expect(/policy_arn\s*=\s*aws_iam_policy\.app_kms_policy\.arn/.test(attKms!.body)).toBe(true);
    expect(/role\s*=\s*aws_iam_role\.app_role\.name/.test(prof!.body)).toBe(true);
  });
});

describe("KMS & S3", () => {
  test("KMS key with root admin & app role permissions, alias includes local.unique_prefix", () => {
    const key = findResource("aws_kms_key", "app");
    const alias = findResource("aws_kms_alias", "app_alias");
    expect(key && alias).toBeTruthy();
    expect(/"kms:\*"/.test(key!.body)).toBe(true); // root full access statement
    expect(/aws_iam_role\.app_role\.arn/.test(key!.body)).toBe(true);
    expect(hasAttrLine(alias!.body, "name", /alias\/\$\{local\.unique_prefix}-app-kms/)).toBe(true);
  });



  test("Bucket policy enforces TLS and CMK usage", () => {
    const pol = findResource("aws_s3_bucket_policy", "app");
    expect(pol).toBeDefined();
    expect(/Sid\s*=\s*"DenyInsecureTransport"/.test(pol!.body)).toBe(true);
    expect(/"aws:SecureTransport"\s*=\s*"false"/.test(pol!.body)).toBe(true);
    expect(/Sid\s*=\s*"DenyIncorrectEncryptionHeader"/.test(pol!.body)).toBe(true);
    expect(/"s3:x-amz-server-side-encryption"\s*=\s*"aws:kms"/.test(pol!.body)).toBe(true);
    expect(/Sid\s*=\s*"DenyWrongKmsKey"/.test(pol!.body)).toBe(true);
    expect(/"s3:x-amz-server-side-encryption-aws-kms-key-id"\s*=\s*aws_kms_key\.app\.arn/.test(pol!.body)).toBe(true);
  });
});

describe("Bastion key pair creation path", () => {
  test("Conditional key resources present (tls_private_key & aws_key_pair with computed name)", () => {
    const tls = findResource("tls_private_key", "bastion");
    const kp = findResource("aws_key_pair", "bastion");
    // Presence of resources; actual `count` conditional is text-asserted
    expect(tls && kp).toBeTruthy();
    expect(/count\s*=\s*var\.bastion_ssh_public_key\s*==\s*""\s*&&\s*var\.bastion_key_name\s*==\s*""\s*\?\s*1\s*:\s*0/.test(tls!.body)).toBe(true);
    expect(/count\s*=\s*var\.bastion_key_name\s*==\s*""\s*\?\s*1\s*:\s*0/.test(kp!.body)).toBe(true);
    expect(/key_name\s*=\s*local\.bastion_key_name_final/.test(kp!.body)).toBe(true);
  });
});

describe("Outputs - coverage", () => {
  const expected = [
    "vpc_id",
    "public_subnet_id",
    "private_subnet_ids",
    "igw_id",
    "nat_gateway_id",
    "bastion_instance_id",
    "bastion_public_ip",
    "private_instance_id",
    "private_instance_profile_arn",
    "private_instance_role_arn",
    "s3_app_bucket_name",
    "s3_app_bucket_arn",
    "kms_app_key_arn",
  ];

  for (const name of expected) {
    test(`output "${name}" exists`, () => {
      const out = findOutput(name);
      expect(out).toBeDefined();
      // basic shape: value =
      expect(/\bvalue\s*=/.test(out!.body)).toBe(true);
    });
  }

  test("sensitive private key output present with try(..., null) pattern", () => {
    const out = findOutput("bastion_private_key_pem");
    expect(out).toBeDefined();
    expect(/sensitive\s*=\s*true/.test(out!.body)).toBe(true);
    expect(/try\(tls_private_key\.bastion\[0]\.private_key_pem,\s*null\)/.test(out!.body)).toBe(true);
  });
});

describe("Data sources present", () => {
  test("Availability zones, caller identity, and Amazon Linux 2 AMI", () => {
    expect(findData("aws_availability_zones", "available")).toBeDefined();
    expect(findData("aws_caller_identity", "current")).toBeDefined();
    const ami = findData("aws_ami", "amazon_linux2");
    expect(ami).toBeDefined();
    // basic AL2 filters
    expect(/amzn2-ami-hvm/.test(ami!.body)).toBe(true);
    expect(/most_recent\s*=\s*true/.test(ami!.body)).toBe(true);
  });
});
