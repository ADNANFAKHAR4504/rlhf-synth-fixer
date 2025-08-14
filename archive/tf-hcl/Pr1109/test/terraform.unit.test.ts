import fs from "fs";
import path from "path";

/** === File loader === */
const mainTfPath = path.resolve(__dirname, "../lib/main.tf");
function readFileOrThrow(p: string): string {
  if (!fs.existsSync(p)) throw new Error(`File not found at ${p}`);
  return fs.readFileSync(p, "utf8");
}

/** === Helpers: comment strip + HCL block extraction === */
function stripComments(hcl: string): string {
  // block comments
  let s = hcl.replace(/\/\*[\s\S]*?\*\//g, "");
  // line comments
  s = s.replace(/\/\/[^\n]*\n/g, "\n");
  s = s.replace(/^[ \t]*#[^\n]*\n/gm, "\n");
  return s;
}

function extractFirstBlock(hcl: string, headerRegex: RegExp): string | null {
  headerRegex.lastIndex = 0;
  const m = headerRegex.exec(hcl);
  if (!m) return null;
  const start = m.index;
  const open = hcl.indexOf("{", start);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < hcl.length; i++) {
    const ch = hcl[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return hcl.slice(open + 1, i);
    }
  }
  return null;
}

function extractAllBlocks(hcl: string, headerRegex: RegExp): string[] {
  const out: string[] = [];
  let last = 0;
  while (last < hcl.length) {
    headerRegex.lastIndex = last;
    const m = headerRegex.exec(hcl);
    if (!m) break;
    const start = m.index;
    const open = hcl.indexOf("{", start);
    if (open === -1) break;
    let depth = 0;
    let end = -1;
    for (let i = open; i < hcl.length; i++) {
      const ch = hcl[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    out.push(hcl.slice(open + 1, end));
    last = end + 1;
  }
  return out;
}

function containsAll(hay: string, needles: (RegExp | string)[]): boolean {
  return needles.every((n) => (typeof n === "string" ? hay.includes(n) : n.test(hay)));
}

describe("Static validation of ../lib/main.tf (no terraform runtime)", () => {
  const raw = readFileOrThrow(mainTfPath);
  const hcl = stripComments(raw);

  it("is readable and non-trivial", () => {
    expect(raw.length).toBeGreaterThan(1000);
  });

  it("does NOT contain provider/terraform blocks (kept in provider.tf)", () => {
    expect(/^\s*provider\s+"/m.test(hcl)).toBe(false);
    expect(/^\s*terraform\s*{/m.test(hcl)).toBe(false);
  });

  /** ===================== VARIABLES ===================== */
  it("declares required variables with validations", () => {
    const mustVars = [
      "aws_region",
      "project",
      "environment",
      "vpc_cidr",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "instance_type",
      "bucket_name",
      "allowed_ssh_cidrs",
    ];
    for (const v of mustVars) {
      const vb = extractFirstBlock(hcl, new RegExp(`variable\\s+"${v}"\\s*`,"g"));
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=/);
      // environment must validate allowed values
      if (v === "environment") {
        expect(vb!).toMatch(/contains\(\s*\[\s*"dev"\s*,\s*"staging"\s*,\s*"prod"\s*]/);
      }
      // public/private subnet lists must validate two valid CIDRs
      if (v === "public_subnet_cidrs" || v === "private_subnet_cidrs") {
        expect(vb!).toMatch(/validation\s*{/);
        expect(vb!).toMatch(/alltrue\(\s*\[for c in var\.[a-z_]+ : can\(cidrhost\(c, 0\)\)\]\s*\)/);
      }
      // aws_region/bucket_name should validate non-empty/length
      if (v === "aws_region" || v === "bucket_name") {
        expect(vb!).toMatch(/validation\s*{/);
      }
      // allowed_ssh_cidrs items must be valid CIDR
      if (v === "allowed_ssh_cidrs") {
        expect(vb!).toMatch(/alltrue\(\s*\[for c in var\.allowed_ssh_cidrs : can\(cidrhost\(c, 0\)\)\]\s*\)/);
      }
    }
  });

  /** ===================== DATA SOURCES ===================== */
  it("has AZ and Amazon Linux 2023 AMI data sources", () => {
    const az = extractFirstBlock(hcl, /data\s+"aws_availability_zones"\s+"available"\s*/g);
    expect(az).toBeTruthy();
    expect(az!).toMatch(/state\s*=\s*"available"/);

    const ami = extractFirstBlock(hcl, /data\s+"aws_ami"\s+"al2023"\s*/g);
    expect(ami).toBeTruthy();
    expect(ami!).toMatch(/owners\s*=\s*\["amazon"\]/);
    expect(ami!).toMatch(/most_recent\s*=\s*true/);
    expect(ami!).toMatch(/values\s*=\s*\["al2023-ami-\*-x86_64"\]/);
  });

  /** ===================== LOCALS & TOGGLES ===================== */
  it("defines feature toggles and naming locals", () => {
    const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
    expect(localsBlocks.length).toBeGreaterThanOrEqual(2); // there are 2 locals blocks
    const l0 = localsBlocks.join("\n");

    expect(l0).toMatch(/env\s*=\s*lower\(var\.environment\)/);
    expect(l0).toMatch(/is_dev\s*=\s*local\.env\s*==\s*"dev"/);
    expect(l0).toMatch(/enable_nat\s*=\s*local\.is_nondev/);
    expect(l0).toMatch(/enable_detailed_monitoring\s*=\s*local\.is_nondev/);
    expect(l0).toMatch(/enable_bucket_versioning\s*=\s*local\.is_nondev/);
    expect(l0).toMatch(/associate_public_ip\s*=\s*local\.is_dev/);
    expect(l0).toMatch(/name_prefix\s*=\s*"\$\{local\.project_sanitized}-\$\{local\.env_sanitized}"/);
    expect(l0).toMatch(/effective_bucket_name\s*=\s*substr/);
    // subnet id locals used by outputs
    expect(l0).toMatch(/public_subnet_ids/);
    expect(l0).toMatch(/private_subnet_ids/);
  });

  /** ===================== NETWORKING ===================== */
  it("creates a VPC with DNS features and tags", () => {
    const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
    expect(vpc).toBeTruthy();
    expect(vpc!).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpc!).toMatch(/enable_dns_support\s*=\s*true/);
    expect(vpc!).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpc!).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });

  it("creates two public & two private subnets across two AZs", () => {
    const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
    const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
    expect(pub && priv).toBeTruthy();
    expect(pub!).toMatch(/for_each/);
    expect(pub!).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    expect(priv!).toMatch(/for_each/);
  });

  it("attaches an Internet Gateway and routes 0.0.0.0/0 on public route table", () => {
    const igw = extractFirstBlock(hcl, /resource\s+"aws_internet_gateway"\s+"igw"\s*/g);
    expect(igw).toBeTruthy();

    const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g);
    expect(rtp).toBeTruthy();
    expect(rtp!).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(rtp!).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.igw\.id/);

    const assocPub = extractFirstBlock(hcl, /resource\s+"aws_route_table_association"\s+"public"\s*/g);
    expect(assocPub).toBeTruthy();
  });

  it("conditionally provisions EIP + NAT and uses it in private route tables only in non-dev", () => {
    const eip = extractFirstBlock(hcl, /resource\s+"aws_eip"\s+"nat"\s*/g);
    const nat = extractFirstBlock(hcl, /resource\s+"aws_nat_gateway"\s+"ngw"\s*/g);
    const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
    expect(eip && nat && rtp).toBeTruthy();

    expect(eip!).toMatch(/count\s*=\s*local\.enable_nat\s*\?\s*1\s*:\s*0/);
    expect(nat!).toMatch(/count\s*=\s*local\.enable_nat\s*\?\s*1\s*:\s*0/);
    expect(rtp!).toMatch(/dynamic\s+"route"\s*{/);
    expect(rtp!).toMatch(/for_each\s*=\s*local\.enable_nat\s*\?\s*\[1\]\s*:\s*\[\]/);
    expect(rtp!).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.ngw\[0]\.id/);
  });

  /** ===================== SECURITY GROUP ===================== */
  it("creates an instance SG: optional SSH ingress from allowed_ssh_cidrs, allow-all egress", () => {
    const sg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"instance"\s*/g);
    expect(sg).toBeTruthy();
    // SSH ingress dynamic over allowed_ssh_cidrs
    expect(sg!).toMatch(/dynamic\s+"ingress"\s*{/);
    expect(sg!).toMatch(/for_each\s*=\s*var\.allowed_ssh_cidrs/);
    expect(sg!).toMatch(/from_port\s*=\s*22/);
    expect(sg!).toMatch(/to_port\s*=\s*22/);
    expect(sg!).toMatch(/protocol\s*=\s*"tcp"/);
    expect(sg!).toMatch(/cidr_blocks\s*=\s*\[ingress\.value]/);
    // egress all
    expect(sg!).toMatch(/egress\s*{[\s\S]*protocol\s*=\s*"-1"[\s\S]*0\.0\.0\.0\/0/);
  });

  /** ===================== EC2 ===================== */
  it("defines EC2 instance with AL2023 AMI, t3.micro default, subnet selection & feature toggles", () => {
    const inst = extractFirstBlock(hcl, /resource\s+"aws_instance"\s+"app"\s*/g);
    expect(inst).toBeTruthy();
    expect(inst!).toMatch(/ami\s*=\s*data\.aws_ami\.al2023\.id/);
    expect(inst!).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(inst!).toMatch(/subnet_id\s*=\s*local\.instance_subnet_id/);
    expect(inst!).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.instance\.id]/);
    expect(inst!).toMatch(/associate_public_ip_address\s*=\s*local\.associate_public_ip/);
    expect(inst!).toMatch(/monitoring\s*=\s*local\.enable_detailed_monitoring/);
    expect(inst!).toMatch(/root_block_device\s*{[\s\S]*volume_type\s*=\s*"gp3"/);
    // depends_on to ensure routes/subnets ready
    expect(inst!).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_route_table_association\.public[\s\S]*aws_route_table_association\.private/);
  });

  /** ===================== S3 ===================== */
  it("creates a hardened S3 bucket: OwnershipControls, PublicAccessBlock, SSE-S3, env-based versioning", () => {
    const b = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket"\s+"app"\s*/g);
    const own = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_ownership_controls"\s+"app"\s*/g);
    const pab = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_public_access_block"\s+"app"\s*/g);
    const sse = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app"\s*/g);
    const ver = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_versioning"\s+"app"\s*/g);

    expect(b && own && pab && sse && ver).toBeTruthy();
    expect(own!).toMatch(/object_ownership\s*=\s*"BucketOwnerEnforced"/);
    expect(pab!).toMatch(/block_public_acls\s*=\s*true/);
    expect(pab!).toMatch(/block_public_policy\s*=\s*true/);
    expect(pab!).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(pab!).toMatch(/restrict_public_buckets\s*=\s*true/);
    expect(sse!).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    expect(ver!).toMatch(/status\s*=\s*local\.enable_bucket_versioning\s*\?\s*"Enabled"\s*:\s*"Suspended"/);
  });

  /** ===================== OUTPUTS ===================== */
  it("exports required outputs with correct references", () => {
    const outs = [...hcl.matchAll(/output\s+"([^"]+)"/g)].map((m) => m[1]);
    // presence
    [
      "vpc_id",
      "public_subnet_ids",
      "private_subnet_ids",
      "security_group_id",
      "instance_id",
      "instance_private_ip",
      "instance_public_ip",
      "s3_bucket_name",
      "nat_gateway_id",
    ].forEach((name) => expect(outs).toContain(name));

    // value checks
    const out = (name: string) => extractFirstBlock(hcl, new RegExp(`output\\s+"${name}"\\s*`, "g"))!;
    expect(out("vpc_id")).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    expect(out("public_subnet_ids")).toMatch(/value\s*=\s*local\.public_subnet_ids/);
    expect(out("private_subnet_ids")).toMatch(/value\s*=\s*local\.private_subnet_ids/);
    expect(out("security_group_id")).toMatch(/value\s*=\s*aws_security_group\.instance\.id/);
    expect(out("instance_id")).toMatch(/value\s*=\s*aws_instance\.app\.id/);
    expect(out("instance_private_ip")).toMatch(/value\s*=\s*aws_instance\.app\.private_ip/);
    expect(out("instance_public_ip")).toMatch(/value\s*=\s*local\.is_dev\s*\?\s*aws_instance\.app\.public_ip\s*:\s*""/);
    expect(out("s3_bucket_name")).toMatch(/value\s*=\s*aws_s3_bucket\.app\.bucket/);
    // nat id uses try(...) or ternary
    const nat = out("nat_gateway_id");
    expect(/try\(aws_nat_gateway\.ngw\[0]\.id,\s*""\)|local\.enable_nat\s*\?\s*aws_nat_gateway\.ngw\[0]\.id\s*:\s*""/.test(nat)).toBe(true);
  });
});
