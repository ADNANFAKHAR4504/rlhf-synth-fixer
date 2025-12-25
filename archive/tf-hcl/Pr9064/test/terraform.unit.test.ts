import fs from "fs";
import path from "path";

/** === File loader === */
const mainTfPath = path.resolve(__dirname, "../lib/tap_stack.tf");
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

describe("Static validation of ../lib/tap_stack.tf (no terraform runtime)", () => {
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
  describe("Variables", () => {
    it("declares aws_region variable with validation", () => {
      const vb = extractFirstBlock(hcl, /variable\s+"aws_region"\s*/g);
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=\s*string/);
      expect(vb!).toMatch(/default\s*=\s*"us-east-1"/);
      expect(vb!).toMatch(/validation\s*{/);
    });

    it("declares vpc_cidr variable with CIDR validation", () => {
      const vb = extractFirstBlock(hcl, /variable\s+"vpc_cidr"\s*/g);
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=\s*string/);
      expect(vb!).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(vb!).toMatch(/validation\s*{/);
      expect(vb!).toMatch(/cidrhost/);
    });

    it("declares public_subnet_cidrs variable with list validation", () => {
      const vb = extractFirstBlock(hcl, /variable\s+"public_subnet_cidrs"\s*/g);
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=\s*list\(string\)/);
      expect(vb!).toMatch(/validation\s*{/);
      expect(vb!).toMatch(/length\(var\.public_subnet_cidrs\)\s*==\s*2/);
    });

    it("declares private_subnet_cidrs variable with list validation", () => {
      const vb = extractFirstBlock(hcl, /variable\s+"private_subnet_cidrs"\s*/g);
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=\s*list\(string\)/);
      expect(vb!).toMatch(/validation\s*{/);
      expect(vb!).toMatch(/length\(var\.private_subnet_cidrs\)\s*==\s*2/);
    });

    it("declares environment variable with default Production", () => {
      const vb = extractFirstBlock(hcl, /variable\s+"environment"\s*/g);
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=\s*string/);
      expect(vb!).toMatch(/default\s*=\s*"Production"/);
    });

    it("declares environment_suffix variable", () => {
      const vb = extractFirstBlock(hcl, /variable\s+"environment_suffix"\s*/g);
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=\s*string/);
    });
  });

  /** ===================== DATA SOURCES ===================== */
  describe("Data Sources", () => {
    it("has availability zones data source", () => {
      const az = extractFirstBlock(hcl, /data\s+"aws_availability_zones"\s+"available"\s*/g);
      expect(az).toBeTruthy();
      expect(az!).toMatch(/state\s*=\s*"available"/);
    });

    it("has caller identity data source", () => {
      const callerExists = hcl.includes('data "aws_caller_identity" "current"');
      expect(callerExists).toBe(true);
    });
  });

  /** ===================== LOCALS ===================== */
  describe("Locals", () => {
    it("defines azs local using slice of availability zones", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThanOrEqual(1);
      const l0 = localsBlocks.join("\n");
      expect(l0).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });

    it("defines common_tags with Environment tag", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      const l0 = localsBlocks.join("\n");
      expect(l0).toMatch(/common_tags\s*=\s*{/);
      expect(l0).toMatch(/Environment\s*=\s*var\.environment/);
    });
  });

  /** ===================== VPC ===================== */
  describe("VPC", () => {
    it("creates a VPC with the specified CIDR block", () => {
      const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
      expect(vpc).toBeTruthy();
      expect(vpc!).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    it("enables DNS support and hostnames on VPC", () => {
      const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
      expect(vpc!).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpc!).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    it("tags VPC with Environment and Name", () => {
      const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
      expect(vpc!).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(vpc!).toMatch(/Name\s*=\s*"main-vpc"/);
    });
  });

  /** ===================== INTERNET GATEWAY ===================== */
  describe("Internet Gateway", () => {
    it("creates an Internet Gateway attached to VPC", () => {
      const igw = extractFirstBlock(hcl, /resource\s+"aws_internet_gateway"\s+"main"\s*/g);
      expect(igw).toBeTruthy();
      expect(igw!).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    it("has depends_on for VPC", () => {
      const igw = extractFirstBlock(hcl, /resource\s+"aws_internet_gateway"\s+"main"\s*/g);
      expect(igw!).toMatch(/depends_on\s*=\s*\[aws_vpc\.main\]/);
    });

    it("tags Internet Gateway with Environment and Name", () => {
      const igw = extractFirstBlock(hcl, /resource\s+"aws_internet_gateway"\s+"main"\s*/g);
      expect(igw!).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(igw!).toMatch(/Name\s*=\s*"main-igw"/);
    });
  });

  /** ===================== PUBLIC SUBNETS ===================== */
  describe("Public Subnets", () => {
    it("creates public subnets using for_each", () => {
      const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
      expect(pub).toBeTruthy();
      expect(pub!).toMatch(/for_each\s*=\s*{/);
    });

    it("enables map_public_ip_on_launch for public subnets", () => {
      const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
      expect(pub!).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    it("distributes public subnets across availability zones", () => {
      const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
      expect(pub!).toMatch(/availability_zone\s*=\s*each\.value\.az/);
      expect(pub!).toMatch(/local\.azs\[0\]/);
      expect(pub!).toMatch(/local\.azs\[1\]/);
    });

    it("tags public subnets with Tier = public", () => {
      const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
      expect(pub!).toMatch(/Tier\s*=\s*"public"/);
    });
  });

  /** ===================== PRIVATE SUBNETS ===================== */
  describe("Private Subnets", () => {
    it("creates private subnets using for_each", () => {
      const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
      expect(priv).toBeTruthy();
      expect(priv!).toMatch(/for_each\s*=\s*{/);
    });

    it("does NOT enable map_public_ip_on_launch for private subnets", () => {
      const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
      expect(priv!).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    it("distributes private subnets across availability zones", () => {
      const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
      expect(priv!).toMatch(/availability_zone\s*=\s*each\.value\.az/);
      expect(priv!).toMatch(/local\.azs\[0\]/);
      expect(priv!).toMatch(/local\.azs\[1\]/);
    });

    it("tags private subnets with Tier = private", () => {
      const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
      expect(priv!).toMatch(/Tier\s*=\s*"private"/);
    });
  });

  /** ===================== PUBLIC ROUTE TABLE ===================== */
  describe("Public Route Table", () => {
    it("creates a public route table", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g);
      expect(rtp).toBeTruthy();
      expect(rtp!).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    it("routes 0.0.0.0/0 to Internet Gateway", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g);
      expect(rtp!).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(rtp!).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    it("has depends_on for VPC and Internet Gateway", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g);
      expect(rtp!).toMatch(/depends_on\s*=\s*\[aws_vpc\.main,\s*aws_internet_gateway\.main\]/);
    });

    it("tags public route table", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g);
      expect(rtp!).toMatch(/Name\s*=\s*"public-rt"/);
    });
  });

  /** ===================== PUBLIC ROUTE TABLE ASSOCIATIONS ===================== */
  describe("Public Route Table Associations", () => {
    it("creates public route table associations using for_each", () => {
      const assoc = extractFirstBlock(hcl, /resource\s+"aws_route_table_association"\s+"public"\s*/g);
      expect(assoc).toBeTruthy();
      expect(assoc!).toMatch(/for_each\s*=\s*aws_subnet\.public/);
    });

    it("associates public subnets with public route table", () => {
      const assoc = extractFirstBlock(hcl, /resource\s+"aws_route_table_association"\s+"public"\s*/g);
      expect(assoc!).toMatch(/subnet_id\s*=\s*each\.value\.id/);
      expect(assoc!).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    });
  });

  /** ===================== PRIVATE ROUTE TABLE ===================== */
  describe("Private Route Table", () => {
    it("creates a private route table", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
      expect(rtp).toBeTruthy();
      expect(rtp!).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    it("does NOT route to internet (isolated)", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
      expect(rtp!).not.toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    it("tags private route table", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
      expect(rtp!).toMatch(/Name\s*=\s*"private-rt"/);
    });
  });

  /** ===================== PRIVATE ROUTE TABLE ASSOCIATIONS ===================== */
  describe("Private Route Table Associations", () => {
    it("creates private route table associations using for_each", () => {
      const assoc = extractFirstBlock(hcl, /resource\s+"aws_route_table_association"\s+"private"\s*/g);
      expect(assoc).toBeTruthy();
      expect(assoc!).toMatch(/for_each\s*=\s*aws_subnet\.private/);
    });

    it("associates private subnets with private route table", () => {
      const assoc = extractFirstBlock(hcl, /resource\s+"aws_route_table_association"\s+"private"\s*/g);
      expect(assoc!).toMatch(/subnet_id\s*=\s*each\.value\.id/);
      expect(assoc!).toMatch(/route_table_id\s*=\s*aws_route_table\.private\.id/);
    });
  });

  /** ===================== OUTPUTS ===================== */
  describe("Outputs", () => {
    it("exports vpc_id output", () => {
      const out = extractFirstBlock(hcl, /output\s+"vpc_id"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    it("exports vpc_cidr output", () => {
      const out = extractFirstBlock(hcl, /output\s+"vpc_cidr"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*aws_vpc\.main\.cidr_block/);
    });

    it("exports internet_gateway_id output", () => {
      const out = extractFirstBlock(hcl, /output\s+"internet_gateway_id"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*aws_internet_gateway\.main\.id/);
    });

    it("exports public_subnet_ids output", () => {
      const out = extractFirstBlock(hcl, /output\s+"public_subnet_ids"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*\[for k in sort\(keys\(aws_subnet\.public\)\) : aws_subnet\.public\[k\]\.id\]/);
    });

    it("exports private_subnet_ids output", () => {
      const out = extractFirstBlock(hcl, /output\s+"private_subnet_ids"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*\[for k in sort\(keys\(aws_subnet\.private\)\) : aws_subnet\.private\[k\]\.id\]/);
    });

    it("exports public_route_table_id output", () => {
      const out = extractFirstBlock(hcl, /output\s+"public_route_table_id"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*aws_route_table\.public\.id/);
    });

    it("exports private_route_table_id output", () => {
      const out = extractFirstBlock(hcl, /output\s+"private_route_table_id"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*aws_route_table\.private\.id/);
    });

    it("exports availability_zones output", () => {
      const out = extractFirstBlock(hcl, /output\s+"availability_zones"\s*/g);
      expect(out).toBeTruthy();
      expect(out!).toMatch(/value\s*=\s*local\.azs/);
    });
  });

  /** ===================== TAGGING ===================== */
  describe("Tagging", () => {
    it("all major resources use common_tags", () => {
      const resources = [
        extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g),
        extractFirstBlock(hcl, /resource\s+"aws_internet_gateway"\s+"main"\s*/g),
        extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g),
        extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g),
        extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g),
        extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g),
      ];
      resources.forEach((r) => {
        expect(r).toBeTruthy();
        expect(r!).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      });
    });
  });

  /** ===================== SECURITY ===================== */
  describe("Security", () => {
    it("public subnets auto-assign public IPs", () => {
      const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
      expect(pub!).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    it("private subnets do NOT auto-assign public IPs", () => {
      const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
      expect(priv!).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    it("private route table has no internet route", () => {
      const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
      expect(rtp!).not.toMatch(/gateway_id/);
      expect(rtp!).not.toMatch(/nat_gateway_id/);
    });
  });
});
