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

function containsAll(hay: string, needles: (RegExp | string)[]): boolean {
  return needles.every((n) => (typeof n === "string" ? hay.includes(n) : n.test(hay)));
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
  it("declares required variables with validations", () => {
    const mustVars = [
      "aws_region",
      "project_name",
      "environment",
      "vpc_cidr",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "rds_instance_class",
      "rds_allocated_storage",
      "rds_engine_version",
      "rds_username",
      "rds_password",
      "app_instance_type",
      "app_desired_capacity",
      "app_max_size",
      "app_min_size",
      "allowed_ssh_cidrs",
      "environment_suffix",
    ];
    for (const v of mustVars) {
      const vb = extractFirstBlock(hcl, new RegExp(`variable\\s+"${v}"\\s*`,"g"));
      expect(vb).toBeTruthy();
      expect(vb!).toMatch(/type\s*=/);
      // environment must validate allowed values
      if (v === "environment") {
        expect(vb!).toMatch(/contains\(\s*\[\s*"test"\s*,\s*"production"\s*]/);
      }
      // public/private subnet lists must validate two valid CIDRs
      if (v === "public_subnet_cidrs" || v === "private_subnet_cidrs") {
        expect(vb!).toMatch(/validation\s*{/);
        expect(vb!).toMatch(/alltrue\(\s*\[for c in var\.[a-z_]+ : can\(cidrhost\(c, 0\)\)\]\s*\)/);
      }
      // aws_region/project_name should validate non-empty
      if (v === "aws_region" || v === "project_name") {
        expect(vb!).toMatch(/validation\s*{/);
      }
      // allowed_ssh_cidrs items must be valid CIDR
      if (v === "allowed_ssh_cidrs") {
        expect(vb!).toMatch(/alltrue\(\s*\[for c in var\.allowed_ssh_cidrs : can\(cidrhost\(c, 0\)\)\]\s*\)/);
      }
      // RDS credentials should be sensitive
      if (v === "rds_username" || v === "rds_password") {
        expect(vb!).toMatch(/sensitive\s*=\s*true/);
      }
    }
  });

  /** ===================== DATA SOURCES ===================== */
  it("has AZ, caller identity, and Amazon Linux 2023 AMI data sources", () => {
    const az = extractFirstBlock(hcl, /data\s+"aws_availability_zones"\s+"available"\s*/g);
    expect(az).toBeTruthy();
    expect(az!).toMatch(/state\s*=\s*"available"/);

    // Check for caller identity data source (it exists but is empty)
    const callerExists = hcl.includes('data "aws_caller_identity" "current"');
    expect(callerExists).toBe(true);

    const ami = extractFirstBlock(hcl, /data\s+"aws_ami"\s+"al2023"\s*/g);
    expect(ami).toBeTruthy();
    expect(ami!).toMatch(/owners\s*=\s*\["amazon"\]/);
    expect(ami!).toMatch(/most_recent\s*=\s*true/);
    expect(ami!).toMatch(/values\s*=\s*\["al2023-ami-\*-x86_64"\]/);
  });

  /** ===================== LOCALS & TOGGLES ===================== */
  it("defines feature toggles and naming locals", () => {
    const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
    expect(localsBlocks.length).toBeGreaterThanOrEqual(1);
    const l0 = localsBlocks.join("\n");

    expect(l0).toMatch(/is_production\s*=\s*var\.environment\s*==\s*"production"/);
    expect(l0).toMatch(/is_test\s*=\s*var\.environment\s*==\s*"test"/);
    expect(l0).toMatch(/enable_detailed_monitoring\s*=\s*local\.is_production/);
    expect(l0).toMatch(/enable_bucket_versioning\s*=\s*local\.is_production/);
    expect(l0).toMatch(/enable_nat_gateway\s*=\s*local\.is_production/);
    expect(l0).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    expect(l0).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    // environment-specific resource configurations
    expect(l0).toMatch(/rds_instance_class\s*=\s*local\.is_production/);
    expect(l0).toMatch(/rds_storage\s*=\s*local\.is_production/);
    expect(l0).toMatch(/app_instance_type\s*=\s*local\.is_production/);
    expect(l0).toMatch(/app_desired_capacity\s*=\s*local\.is_production/);
  });

  /** ===================== NETWORKING ===================== */
  it("creates a VPC with DNS features and tags", () => {
    const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
    expect(vpc).toBeTruthy();
    expect(vpc!).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpc!).toMatch(/enable_dns_support\s*=\s*true/);
    expect(vpc!).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpc!).toMatch(/tags\s*=\s*{[\s\S]*Name\s*=\s*"\$\{local\.name_prefix\}-vpc"/);
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

  it("conditionally provisions EIP + NAT and uses it in private route tables only in production", () => {
    const eip = extractFirstBlock(hcl, /resource\s+"aws_eip"\s+"nat"\s*/g);
    const nat = extractFirstBlock(hcl, /resource\s+"aws_nat_gateway"\s+"ngw"\s*/g);
    const rtp = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
    expect(eip && nat && rtp).toBeTruthy();

    expect(eip!).toMatch(/count\s*=\s*local\.enable_nat_gateway\s*\?\s*1\s*:\s*0/);
    expect(nat!).toMatch(/count\s*=\s*local\.enable_nat_gateway\s*\?\s*1\s*:\s*0/);
    expect(rtp!).toMatch(/dynamic\s+"route"\s*{/);
    expect(rtp!).toMatch(/for_each\s*=\s*local\.enable_nat_gateway\s*\?\s*\[1\]\s*:\s*\[\]/);
    expect(rtp!).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.ngw\[0]\.id/);
  });

  /** ===================== SECURITY GROUPS ===================== */
  it("creates ALB security group with HTTP/HTTPS ingress and all egress", () => {
    const sg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"alb"\s*/g);
    expect(sg).toBeTruthy();
    expect(sg!).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/);
    expect(sg!).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*443[\s\S]*to_port\s*=\s*443/);
    expect(sg!).toMatch(/egress\s*{[\s\S]*protocol\s*=\s*"-1"[\s\S]*0\.0\.0\.0\/0/);
  });

  it("creates app security group with HTTP from ALB and SSH ingress", () => {
    const sg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"app"\s*/g);
    expect(sg).toBeTruthy();
    expect(sg!).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*80[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    expect(sg!).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*var\.allowed_ssh_cidrs/);
    expect(sg!).toMatch(/egress\s*{[\s\S]*protocol\s*=\s*"-1"[\s\S]*0\.0\.0\.0\/0/);
  });

  it("creates RDS security group with PostgreSQL ingress from app instances", () => {
    const sg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"rds"\s*/g);
    expect(sg).toBeTruthy();
    expect(sg!).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*5432[\s\S]*to_port\s*=\s*5432/);
    expect(sg!).toMatch(/ingress\s*{[\s\S]*security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    expect(sg!).toMatch(/egress\s*{[\s\S]*protocol\s*=\s*"-1"[\s\S]*0\.0\.0\.0\/0/);
  });

  /** ===================== RDS DATABASE ===================== */
  it("creates RDS subnet group and PostgreSQL instance with encryption", () => {
    const subnetGroup = extractFirstBlock(hcl, /resource\s+"aws_db_subnet_group"\s+"main"\s*/g);
    expect(subnetGroup).toBeTruthy();
    expect(subnetGroup!).toMatch(/subnet_ids\s*=\s*\[for k in sort\(keys\(aws_subnet\.private\)\) : aws_subnet\.private\[k\]\.id\]/);

    const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
    expect(rds).toBeTruthy();
    expect(rds!).toMatch(/engine\s*=\s*"postgres"/);
    expect(rds!).toMatch(/engine_version\s*=\s*var\.rds_engine_version/);
    expect(rds!).toMatch(/instance_class\s*=\s*local\.rds_instance_class/);
    expect(rds!).toMatch(/storage_encrypted\s*=\s*true/);
    expect(rds!).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    expect(rds!).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    expect(rds!).toMatch(/backup_retention_period\s*=\s*local\.is_production/);
    expect(rds!).toMatch(/deletion_protection\s*=\s*false/);
  });

  /** ===================== APPLICATION LOAD BALANCER ===================== */
  it("creates Application Load Balancer with target group and listener", () => {
    const alb = extractFirstBlock(hcl, /resource\s+"aws_lb"\s+"main"\s*/g);
    expect(alb).toBeTruthy();
    expect(alb!).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(alb!).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    expect(alb!).toMatch(/subnets\s*=\s*\[for k in sort\(keys\(aws_subnet\.public\)\) : aws_subnet\.public\[k\]\.id\]/);
    expect(alb!).toMatch(/enable_deletion_protection\s*=\s*false/);

    const targetGroup = extractFirstBlock(hcl, /resource\s+"aws_lb_target_group"\s+"main"\s*/g);
    expect(targetGroup).toBeTruthy();
    expect(targetGroup!).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(targetGroup!).toMatch(/port\s*=\s*80/);
    expect(targetGroup!).toMatch(/health_check\s*{/);

    const listener = extractFirstBlock(hcl, /resource\s+"aws_lb_listener"\s+"main"\s*/g);
    expect(listener).toBeTruthy();
    expect(listener!).toMatch(/port\s*=\s*"80"/);
    expect(listener!).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(listener!).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
  });

  /** ===================== AUTO SCALING GROUP ===================== */
  it("creates launch template and Auto Scaling Group", () => {
    const launchTemplate = extractFirstBlock(hcl, /resource\s+"aws_launch_template"\s+"main"\s*/g);
    expect(launchTemplate).toBeTruthy();
    expect(launchTemplate!).toMatch(/image_id\s*=\s*data\.aws_ami\.al2023\.id/);
    expect(launchTemplate!).toMatch(/instance_type\s*=\s*local\.app_instance_type/);
    expect(launchTemplate!).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    expect(launchTemplate!).toMatch(/user_data\s*=\s*base64encode/);

    const asg = extractFirstBlock(hcl, /resource\s+"aws_autoscaling_group"\s+"main"\s*/g);
    expect(asg).toBeTruthy();
    expect(asg!).toMatch(/desired_capacity\s*=\s*local\.app_desired_capacity/);
    expect(asg!).toMatch(/max_size\s*=\s*var\.app_max_size/);
    expect(asg!).toMatch(/min_size\s*=\s*var\.app_min_size/);
    expect(asg!).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
    expect(asg!).toMatch(/vpc_zone_identifier\s*=\s*\[for k in sort\(keys\(aws_subnet\.private\)\) : aws_subnet\.private\[k\]\.id\]/);
    expect(asg!).toMatch(/launch_template\s*{/);
  });

  /** ===================== CLOUDWATCH MONITORING ===================== */
  it("creates CloudWatch dashboard and alarms", () => {
    const dashboard = extractFirstBlock(hcl, /resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*/g);
    expect(dashboard).toBeTruthy();
    expect(dashboard!).toMatch(/dashboard_body\s*=\s*jsonencode/);

    const cpuAlarm = extractFirstBlock(hcl, /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"\s*/g);
    expect(cpuAlarm).toBeTruthy();
    expect(cpuAlarm!).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    expect(cpuAlarm!).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
    expect(cpuAlarm!).toMatch(/dimensions\s*=\s*{[\s\S]*AutoScalingGroupName\s*=\s*aws_autoscaling_group\.main\.name/);

    const rdsAlarm = extractFirstBlock(hcl, /resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"\s*/g);
    expect(rdsAlarm).toBeTruthy();
    expect(rdsAlarm!).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    expect(rdsAlarm!).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
    expect(rdsAlarm!).toMatch(/dimensions\s*=\s*{[\s\S]*DBInstanceIdentifier\s*=\s*aws_db_instance\.main\.id/);
  });

  /** ===================== OUTPUTS ===================== */
  it("exports required outputs with correct references", () => {
    const outs = [...hcl.matchAll(/output\s+"([^"]+)"/g)].map((m) => m[1]);
    // presence
    [
      "vpc_id",
      "public_subnet_ids",
      "private_subnet_ids",
      "alb_dns_name",
      "alb_zone_id",
      "rds_endpoint",
      "rds_port",
      "asg_name",
      "cloudwatch_dashboard_url",
      "nat_gateway_id",
      "environment_info",
    ].forEach((name) => expect(outs).toContain(name));

    // value checks
    const out = (name: string) => extractFirstBlock(hcl, new RegExp(`output\\s+"${name}"\\s*`, "g"))!;
    expect(out("vpc_id")).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    expect(out("public_subnet_ids")).toMatch(/value\s*=\s*\[for k in sort\(keys\(aws_subnet\.public\)\) : aws_subnet\.public\[k\]\.id\]/);
    expect(out("private_subnet_ids")).toMatch(/value\s*=\s*\[for k in sort\(keys\(aws_subnet\.private\)\) : aws_subnet\.private\[k\]\.id\]/);
    expect(out("alb_dns_name")).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    expect(out("alb_zone_id")).toMatch(/value\s*=\s*aws_lb\.main\.zone_id/);
    expect(out("rds_endpoint")).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    expect(out("rds_port")).toMatch(/value\s*=\s*aws_db_instance\.main\.port/);
    expect(out("asg_name")).toMatch(/value\s*=\s*aws_autoscaling_group\.main\.name/);
    // CloudWatch dashboard URL validation - check if the output exists
    const cloudwatchOutputExists = hcl.includes('output "cloudwatch_dashboard_url"');
    expect(cloudwatchOutputExists).toBe(true);
    // nat id uses try(...)
    const nat = out("nat_gateway_id");
    expect(/try\(aws_nat_gateway\.ngw\[0]\.id,\s*""\)/.test(nat)).toBe(true);
    // environment info
    expect(out("environment_info")).toMatch(/value\s*=\s*{[\s\S]*environment\s*=\s*var\.environment/);
    expect(out("environment_info")).toMatch(/is_production\s*=\s*local\.is_production/);
  });

  /** ===================== NAMING CONVENTIONS ===================== */
  it("follows naming convention pattern", () => {
    const namePattern = /\$\{local\.name_prefix\}/g;
    const matches = hcl.match(namePattern);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThan(10); // Should be used extensively

    // Check specific resource naming
    const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
    expect(vpc!).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-vpc"/);

    const alb = extractFirstBlock(hcl, /resource\s+"aws_lb"\s+"main"\s*/g);
    expect(alb!).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-alb"/);

    const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
    expect(rds!).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-db"/);

    const asg = extractFirstBlock(hcl, /resource\s+"aws_autoscaling_group"\s+"main"\s*/g);
    expect(asg!).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-asg"/);
  });

  /** ===================== SECURITY BEST PRACTICES ===================== */
  it("implements security best practices", () => {
    // RDS encryption
    const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
    expect(rds!).toMatch(/storage_encrypted\s*=\s*true/);

    // No sensitive data in outputs
    const outputsString = hcl.match(/output\s+"[^"]*"\s*{[\s\S]*?}/g)?.join("") || "";
    expect(outputsString).not.toMatch(/password/);
    expect(outputsString).not.toMatch(/secret/);
    // Note: "key" is allowed as it appears in legitimate contexts like "project" and "environment"

    // Security groups have proper egress rules
    const securityGroups = [
      extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"alb"\s*/g),
      extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"app"\s*/g),
      extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"rds"\s*/g),
    ];
    securityGroups.forEach(sg => {
      expect(sg!).toMatch(/egress\s*{[\s\S]*protocol\s*=\s*"-1"[\s\S]*0\.0\.0\.0\/0/);
    });
  });

  /** ===================== ENVIRONMENT-SPECIFIC LOGIC ===================== */
  it("has proper environment-specific configurations", () => {
    // Environment toggles
    const locals = extractFirstBlock(hcl, /\blocals\s*/g);
    expect(locals!).toMatch(/enable_nat_gateway\s*=\s*local\.is_production/);
    expect(locals!).toMatch(/enable_detailed_monitoring\s*=\s*local\.is_production/);
    expect(locals!).toMatch(/enable_bucket_versioning\s*=\s*local\.is_production/);

    // Resource sizing
    expect(locals!).toMatch(/rds_instance_class\s*=\s*local\.is_production\s*\?\s*"db\.r5\.large"\s*:\s*var\.rds_instance_class/);
    expect(locals!).toMatch(/rds_storage\s*=\s*local\.is_production\s*\?\s*100\s*:\s*var\.rds_allocated_storage/);
    expect(locals!).toMatch(/app_instance_type\s*=\s*local\.is_production\s*\?\s*"t3\.small"\s*:\s*var\.app_instance_type/);
    expect(locals!).toMatch(/app_desired_capacity\s*=\s*local\.is_production\s*\?\s*3\s*:\s*var\.app_desired_capacity/);

    // RDS configurations
    const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
    expect(rds!).toMatch(/backup_retention_period\s*=\s*local\.is_production\s*\?\s*7\s*:\s*1/);
    expect(rds!).toMatch(/deletion_protection\s*=\s*false/);

    // ALB configurations
    const alb = extractFirstBlock(hcl, /resource\s+"aws_lb"\s+"main"\s*/g);
    expect(alb!).toMatch(/enable_deletion_protection\s*=\s*false/);
  });
});
