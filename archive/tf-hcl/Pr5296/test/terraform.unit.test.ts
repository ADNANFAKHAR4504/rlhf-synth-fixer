// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for tap_stack.tf
// Validates all components against requirements without running Terraform commands

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
let stackContent: string;

beforeAll(() => {
  if (!fs.existsSync(STACK_PATH)) {
    throw new Error(`Stack file not found at: ${STACK_PATH}`);
  }
  stackContent = fs.readFileSync(STACK_PATH, "utf8");
});

describe("File Structure & Basic Validation", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
  });

  test("file is not empty", () => {
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("does NOT declare provider block (provider.tf owns it)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("contains no module blocks (must be self-contained)", () => {
    expect(stackContent).not.toMatch(/\bmodule\s+"[^"]+"\s*{/);
  });

  test("is a single-file stack with all resources inline", () => {
    expect(stackContent).toContain("resource");
    expect(stackContent).toContain("variable");
    expect(stackContent).toContain("output");
  });
});

describe("Variable Declarations - Required Variables", () => {
  const requiredVariables = [
    "env",
    "aws_region",
    "name",
    "vpc_cidr",
    "public_subnet_cidrs",
    "private_subnet_cidrs",
    "instance_type",
    "db_allocated_storage",
    "db_engine_version",
    "db_username",
    "db_password",
    "common_tags"
  ];

  test.each(requiredVariables)("declares variable '%s'", (varName) => {
    const regex = new RegExp(`variable\\s+"${varName}"\\s*{`, "m");
    expect(stackContent).toMatch(regex);
  });

  test("env variable has validation for dev/staging/prod", () => {
    const envVarSection = stackContent.match(
      /variable\s+"env"\s*{[\s\S]*?^}/m
    );
    expect(envVarSection).toBeTruthy();
    if (envVarSection) {
      expect(envVarSection[0]).toMatch(/validation\s*{/);
      expect(envVarSection[0]).toMatch(/contains\s*\(/);
      expect(envVarSection[0]).toMatch(/"dev"/);
      expect(envVarSection[0]).toMatch(/"staging"/);
      expect(envVarSection[0]).toMatch(/"prod"/);
    }
  });

  test("public_subnet_cidrs variable validates exactly 2 subnets", () => {
    // Match variable block including nested braces
    const varSection = stackContent.match(
      /variable\s+"public_subnet_cidrs"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/validation\s*\{/);
      expect(varSection[0]).toMatch(/length.*==\s*2/);
    }
  });

  test("private_subnet_cidrs variable validates exactly 2 subnets", () => {
    // Match variable block including nested braces
    const varSection = stackContent.match(
      /variable\s+"private_subnet_cidrs"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/validation\s*\{/);
      expect(varSection[0]).toMatch(/length.*==\s*2/);
    }
  });

  test("db_username is marked as sensitive", () => {
    // Match variable block including nested braces
    const varSection = stackContent.match(
      /variable\s+"db_username"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/sensitive\s*=\s*true/);
    }
  });

  test("db_password is marked as sensitive", () => {
    // Match variable block including nested braces
    const varSection = stackContent.match(
      /variable\s+"db_password"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/sensitive\s*=\s*true/);
    }
  });

  test("common_tags has default empty map", () => {
    // Match variable block including nested braces
    const varSection = stackContent.match(
      /variable\s+"common_tags"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/default\s*=\s*\{\}/);
    }
  });
});

describe("Data Sources", () => {
  test("declares aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"this"/);
  });

  test("uses SSM parameter for AMI (not most_recent query)", () => {
    expect(stackContent).toMatch(/data\s+"aws_ssm_parameter"\s+"al2023"/);
    expect(stackContent).toMatch(/\/aws\/service\/ami-amazon-linux-latest\/al2023-ami-kernel/);
  });

  test("does NOT use aws_ami data source with most_recent", () => {
    expect(stackContent).not.toMatch(/data\s+"aws_ami"\s+"al2023"/);
  });
});

describe("Locals Block", () => {
  test("declares locals block", () => {
    expect(stackContent).toMatch(/locals\s*{/);
  });

  test("derives instance_type from var.instance_type", () => {
    const localsSection = stackContent.match(/locals\s*{[\s\S]*?^}/m);
    expect(localsSection).toBeTruthy();
    if (localsSection) {
      expect(localsSection[0]).toMatch(/instance_type\s*=\s*var\.instance_type/);
    }
  });

  test("derives db_allocated from var.db_allocated_storage", () => {
    const localsSection = stackContent.match(/locals\s*{[\s\S]*?^}/m);
    expect(localsSection).toBeTruthy();
    if (localsSection) {
      expect(localsSection[0]).toMatch(/db_allocated\s*=\s*var\.db_allocated_storage/);
    }
  });

  test("slices first 2 AZs", () => {
    const localsSection = stackContent.match(/locals\s*{[\s\S]*?^}/m);
    expect(localsSection).toBeTruthy();
    if (localsSection) {
      expect(localsSection[0]).toMatch(/slice.*0,\s*2/);
    }
  });

  test("merges common_tags with Environment tag using title()", () => {
    const localsSection = stackContent.match(/locals\s*{[\s\S]*?^}/m);
    expect(localsSection).toBeTruthy();
    if (localsSection) {
      expect(localsSection[0]).toMatch(/merge\s*\(.*var\.common_tags/);
      expect(localsSection[0]).toMatch(/Environment.*title\s*\(\s*var\.env\s*\)/);
    }
  });
});

describe("VPC & Networking Resources", () => {
  test("declares single VPC resource", () => {
    const vpcMatches = stackContent.match(/resource\s+"aws_vpc"\s+"this"/g);
    expect(vpcMatches).toBeTruthy();
    expect(vpcMatches?.length).toBe(1);
  });

  test("VPC enables DNS hostnames and support", () => {
    const vpcSection = stackContent.match(
      /resource\s+"aws_vpc"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(vpcSection).toBeTruthy();
    if (vpcSection) {
      expect(vpcSection[0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcSection[0]).toMatch(/enable_dns_support\s*=\s*true/);
    }
  });

  test("declares exactly 2 public subnets (count = 2)", () => {
    const publicSubnetSection = stackContent.match(
      /resource\s+"aws_subnet"\s+"public"\s*\{[\s\S]*?\n\}/m
    );
    expect(publicSubnetSection).toBeTruthy();
    if (publicSubnetSection) {
      expect(publicSubnetSection[0]).toMatch(/count\s*=\s*2/);
    }
  });

  test("declares exactly 2 private subnets (count = 2)", () => {
    const privateSubnetSection = stackContent.match(
      /resource\s+"aws_subnet"\s+"private"\s*\{[\s\S]*?\n\}/m
    );
    expect(privateSubnetSection).toBeTruthy();
    if (privateSubnetSection) {
      expect(privateSubnetSection[0]).toMatch(/count\s*=\s*2/);
    }
  });

  test("public subnets enable map_public_ip_on_launch", () => {
    const publicSubnetSection = stackContent.match(
      /resource\s+"aws_subnet"\s+"public"\s*\{[\s\S]*?\n\}/m
    );
    expect(publicSubnetSection).toBeTruthy();
    if (publicSubnetSection) {
      expect(publicSubnetSection[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    }
  });

  test("declares single Internet Gateway", () => {
    const igwMatches = stackContent.match(/resource\s+"aws_internet_gateway"\s+"this"/g);
    expect(igwMatches).toBeTruthy();
    expect(igwMatches?.length).toBe(1);
  });

  test("declares exactly 1 EIP for NAT", () => {
    const eipMatches = stackContent.match(/resource\s+"aws_eip"\s+"nat"/g);
    expect(eipMatches).toBeTruthy();
    expect(eipMatches?.length).toBe(1);
  });

  test("declares exactly 1 NAT Gateway (shared)", () => {
    const natMatches = stackContent.match(/resource\s+"aws_nat_gateway"\s+"this"/g);
    expect(natMatches).toBeTruthy();
    expect(natMatches?.length).toBe(1);
  });

  test("NAT Gateway is in first public subnet", () => {
    const natSection = stackContent.match(
      /resource\s+"aws_nat_gateway"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(natSection).toBeTruthy();
    if (natSection) {
      expect(natSection[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
    }
  });

  test("declares public route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
  });

  test("public route table routes 0.0.0.0/0 to IGW", () => {
    const publicRTSection = stackContent.match(
      /resource\s+"aws_route_table"\s+"public"\s*\{[\s\S]*?\n\}/m
    );
    expect(publicRTSection).toBeTruthy();
    if (publicRTSection) {
      expect(publicRTSection[0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(publicRTSection[0]).toMatch(/gateway_id/);
    }
  });

  test("declares private route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test("private route table routes 0.0.0.0/0 to NAT Gateway", () => {
    const privateRTSection = stackContent.match(
      /resource\s+"aws_route_table"\s+"private"\s*\{[\s\S]*?\n\}/m
    );
    expect(privateRTSection).toBeTruthy();
    if (privateRTSection) {
      expect(privateRTSection[0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(privateRTSection[0]).toMatch(/nat_gateway_id/);
    }
  });

  test("public route table associations (count = 2)", () => {
    const rtAssocSection = stackContent.match(
      /resource\s+"aws_route_table_association"\s+"public"\s*\{[\s\S]*?\n\}/m
    );
    expect(rtAssocSection).toBeTruthy();
    if (rtAssocSection) {
      expect(rtAssocSection[0]).toMatch(/count\s*=\s*2/);
    }
  });

  test("private route table associations (count = 2)", () => {
    const rtAssocSection = stackContent.match(
      /resource\s+"aws_route_table_association"\s+"private"\s*\{[\s\S]*?\n\}/m
    );
    expect(rtAssocSection).toBeTruthy();
    if (rtAssocSection) {
      expect(rtAssocSection[0]).toMatch(/count\s*=\s*2/);
    }
  });
});

describe("Security Groups - ALB, App, Database", () => {
  test("declares ALB security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("ALB SG allows port 80 from 0.0.0.0/0", () => {
    const albSGSection = stackContent.match(
      /resource\s+"aws_security_group"\s+"alb"\s*\{[\s\S]*?\n\}/m
    );
    expect(albSGSection).toBeTruthy();
    if (albSGSection) {
      expect(albSGSection[0]).toMatch(/ingress\s*{/);
      expect(albSGSection[0]).toMatch(/from_port\s*=\s*80/);
      expect(albSGSection[0]).toMatch(/to_port\s*=\s*80/);
      expect(albSGSection[0]).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
    }
  });

  test("declares App security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
  });

  test("App SG allows port 80 from ALB SG only", () => {
    const appSGSection = stackContent.match(
      /resource\s+"aws_security_group"\s+"app"\s*\{[\s\S]*?\n\}/m
    );
    expect(appSGSection).toBeTruthy();
    if (appSGSection) {
      expect(appSGSection[0]).toMatch(/ingress\s*{/);
      expect(appSGSection[0]).toMatch(/from_port\s*=\s*80/);
      expect(appSGSection[0]).toMatch(/to_port\s*=\s*80/);
      expect(appSGSection[0]).toMatch(/security_groups\s*=\s*\[\s*aws_security_group\.alb\.id\s*\]/);
    }
  });

  test("declares Database security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"db"/);
  });

  test("DB SG allows port 5432 from App SG only", () => {
    const dbSGSection = stackContent.match(
      /resource\s+"aws_security_group"\s+"db"\s*\{[\s\S]*?\n\}/m
    );
    expect(dbSGSection).toBeTruthy();
    if (dbSGSection) {
      expect(dbSGSection[0]).toMatch(/ingress\s*{/);
      expect(dbSGSection[0]).toMatch(/from_port\s*=\s*5432/);
      expect(dbSGSection[0]).toMatch(/to_port\s*=\s*5432/);
      expect(dbSGSection[0]).toMatch(/security_groups\s*=\s*\[\s*aws_security_group\.app\.id\s*\]/);
    }
  });
});

describe("Application Load Balancer Resources", () => {
  test("declares ALB resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"this"/);
  });

  test("ALB is not internal (internet-facing)", () => {
    const albSection = stackContent.match(
      /resource\s+"aws_lb"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(albSection).toBeTruthy();
    if (albSection) {
      expect(albSection[0]).toMatch(/internal\s*=\s*false/);
    }
  });

  test("ALB is type application", () => {
    const albSection = stackContent.match(
      /resource\s+"aws_lb"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(albSection).toBeTruthy();
    if (albSection) {
      expect(albSection[0]).toMatch(/load_balancer_type\s*=\s*"application"/);
    }
  });

  test("ALB uses public subnets", () => {
    const albSection = stackContent.match(
      /resource\s+"aws_lb"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(albSection).toBeTruthy();
    if (albSection) {
      expect(albSection[0]).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    }
  });

  test("declares Target Group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"this"/);
  });

  test("Target Group is HTTP on port 80", () => {
    const tgSection = stackContent.match(
      /resource\s+"aws_lb_target_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(tgSection).toBeTruthy();
    if (tgSection) {
      expect(tgSection[0]).toMatch(/port\s*=\s*80/);
      expect(tgSection[0]).toMatch(/protocol\s*=\s*"HTTP"/);
    }
  });

  test("Target Group has health check on /", () => {
    const tgSection = stackContent.match(
      /resource\s+"aws_lb_target_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(tgSection).toBeTruthy();
    if (tgSection) {
      expect(tgSection[0]).toMatch(/health_check\s*{/);
      expect(tgSection[0]).toMatch(/path\s*=\s*"\/"/);
    }
  });

  test("Target Group uses name_prefix (not name) to avoid length issues", () => {
    const tgSection = stackContent.match(
      /resource\s+"aws_lb_target_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(tgSection).toBeTruthy();
    if (tgSection) {
      expect(tgSection[0]).toMatch(/name_prefix\s*=/);
    }
  });

  test("declares ALB Listener", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"this"/);
  });

  test("Listener is HTTP on port 80", () => {
    const listenerSection = stackContent.match(
      /resource\s+"aws_lb_listener"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(listenerSection).toBeTruthy();
    if (listenerSection) {
      expect(listenerSection[0]).toMatch(/port\s*=\s*80/);
      expect(listenerSection[0]).toMatch(/protocol\s*=\s*"HTTP"/);
    }
  });

  test("Listener forwards to Target Group", () => {
    const listenerSection = stackContent.match(
      /resource\s+"aws_lb_listener"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(listenerSection).toBeTruthy();
    if (listenerSection) {
      expect(listenerSection[0]).toMatch(/type\s*=\s*"forward"/);
      expect(listenerSection[0]).toMatch(/target_group_arn/);
    }
  });

  test("Listener does NOT have tags (unsupported in many provider versions)", () => {
    const listenerSection = stackContent.match(
      /resource\s+"aws_lb_listener"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(listenerSection).toBeTruthy();
    if (listenerSection) {
      expect(listenerSection[0]).not.toMatch(/tags\s*=/);
    }
  });
});

describe("Compute Resources - Launch Template & ASG", () => {
  test("declares Launch Template", () => {
    expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"this"/);
  });

  test("Launch Template uses SSM parameter for AMI", () => {
    const ltSection = stackContent.match(
      /resource\s+"aws_launch_template"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(ltSection).toBeTruthy();
    if (ltSection) {
      expect(ltSection[0]).toMatch(/image_id\s*=\s*data\.aws_ssm_parameter\.al2023\.value/);
    }
  });

  test("Launch Template uses local.instance_type", () => {
    const ltSection = stackContent.match(
      /resource\s+"aws_launch_template"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(ltSection).toBeTruthy();
    if (ltSection) {
      expect(ltSection[0]).toMatch(/instance_type\s*=\s*local\.instance_type/);
    }
  });

  test("declares Auto Scaling Group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"this"/);
  });

  test("ASG uses private subnets", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      expect(asgSection[0]).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    }
  });

  test("ASG has desired=2, min=2, max=4 (constant across envs)", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      expect(asgSection[0]).toMatch(/desired_capacity\s*=\s*2/);
      expect(asgSection[0]).toMatch(/min_size\s*=\s*2/);
      expect(asgSection[0]).toMatch(/max_size\s*=\s*4/);
    }
  });

  test("ASG attaches to Target Group", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      expect(asgSection[0]).toMatch(/target_group_arns/);
    }
  });

  test("ASG health check type is ELB", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      expect(asgSection[0]).toMatch(/health_check_type\s*=\s*"ELB"/);
    }
  });

  test("ASG Environment tag propagates to instances", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      const envTagMatch = asgSection[0].match(/tag\s*\{[\s\S]*?key\s*=\s*"Environment"[\s\S]*?\n  \}/);
      expect(envTagMatch).toBeTruthy();
      if (envTagMatch) {
        expect(envTagMatch[0]).toMatch(/propagate_at_launch\s*=\s*true/);
      }
    }
  });
});

describe("Database Resources - RDS PostgreSQL", () => {
  test("declares DB subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"this"/);
  });

  test("DB subnet group uses private subnets", () => {
    const dbSubnetSection = stackContent.match(
      /resource\s+"aws_db_subnet_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(dbSubnetSection).toBeTruthy();
    if (dbSubnetSection) {
      expect(dbSubnetSection[0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    }
  });

  test("declares RDS instance", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"this"/);
  });

  test("RDS is PostgreSQL", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/engine\s*=\s*"postgres"/);
    }
  });

  test("RDS uses var.db_engine_version (pinned)", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/engine_version\s*=\s*var\.db_engine_version/);
    }
  });

  test("RDS uses local.db_allocated for storage", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/allocated_storage\s*=\s*local\.db_allocated/);
    }
  });

  test("RDS instance_class is fixed (db.t3.medium)", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/instance_class\s*=\s*"db\.t3\.medium"/);
    }
  });

  test("RDS multi_az is false (constant)", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/multi_az\s*=\s*false/);
    }
  });

  test("RDS is not publicly accessible", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/publicly_accessible\s*=\s*false/);
    }
  });

  test("RDS has skip_final_snapshot = true", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/skip_final_snapshot\s*=\s*true/);
    }
  });

  test("RDS uses sensitive variables for username and password", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/username\s*=\s*var\.db_username/);
      expect(rdsSection[0]).toMatch(/password\s*=\s*var\.db_password/);
      expect(rdsSection[0]).not.toMatch(/username\s*=\s*"[^"]*"/);
      expect(rdsSection[0]).not.toMatch(/password\s*=\s*"[^"]*"/);
    }
  });

  test("RDS deletion_protection enabled for prod only", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/deletion_protection\s*=\s*var\.env\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    }
  });

  test("RDS storage is encrypted", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/storage_encrypted\s*=\s*true/);
    }
  });
});

describe("Tagging Standards", () => {
  const taggedResources = [
    "aws_vpc",
    "aws_internet_gateway",
    "aws_subnet",
    "aws_eip",
    "aws_nat_gateway",
    "aws_route_table",
    "aws_security_group",
    "aws_lb",
    "aws_lb_target_group",
    "aws_launch_template",
    "aws_db_subnet_group",
    "aws_db_instance"
  ];

  test.each(taggedResources)("%s resources use merge with local.tags", (resourceType) => {
    const resourceSections = stackContent.match(
      new RegExp(`resource\\s+"${resourceType}"\\s+"\\w+"\\s*\\{[\\s\\S]*?\\n\\}`, "gm")
    );
    expect(resourceSections).toBeTruthy();
    if (resourceSections) {
      const hasTagging = resourceSections.some(section =>
        section.match(/tags\s*=\s*merge\s*\(\s*local\.tags/) ||
        section.match(/tags\s*=\s*local\.tags/)
      );
      expect(hasTagging).toBe(true);
    }
  });

  test("ASG includes Environment tag with propagate_at_launch = true", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      expect(asgSection[0]).toMatch(/key\s*=\s*"Environment"/);
      expect(asgSection[0]).toMatch(/propagate_at_launch\s*=\s*true/);
    }
  });
});

describe("Naming Conventions", () => {
  test("resources follow naming pattern: ${var.name}-${var.env}-<component>", () => {
    // Most resources use Name = "..." pattern
    const normalNaming = [
      /Name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-vpc"/,
      /Name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-igw"/,
      /Name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-alb"/,
      /Name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-db"/
    ];

    normalNaming.forEach(pattern => {
      expect(stackContent).toMatch(pattern);
    });

    // ASG uses tag { key = "Name", value = "..." } structure
    expect(stackContent).toMatch(/value\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-asg"/);
  });

  test("security groups follow naming: ${var.name}-${var.env}-<component>-sg", () => {
    const sgNames = [
      /name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-alb-sg"/,
      /name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-app-sg"/,
      /name\s*=\s*"\$\{var\.name\}-\$\{var\.env\}-db-sg"/
    ];

    sgNames.forEach(pattern => {
      expect(stackContent).toMatch(pattern);
    });
  });
});

describe("Output Declarations", () => {
  const requiredOutputs = [
    "vpc_id",
    "public_subnet_ids",
    "private_subnet_ids",
    "alb_arn",
    "alb_dns_name",
    "target_group_arn",
    "asg_name",
    "rds_endpoint",
    "rds_arn",
    "alb_security_group_id",
    "app_security_group_id",
    "db_security_group_id"
  ];

  test.each(requiredOutputs)("declares output '%s'", (outputName) => {
    const regex = new RegExp(`output\\s+"${outputName}"\\s*{`, "m");
    expect(stackContent).toMatch(regex);
  });

  test("outputs reference correct resource attributes", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*{\s*value\s*=\s*aws_vpc\.this\.id/);
    expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{\s*value\s*=\s*aws_lb\.this\.dns_name/);
    expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{\s*value\s*=\s*aws_db_instance\.this\.endpoint/);
  });
});

describe("Multi-Environment Consistency - Allowed Diffs Only", () => {
  test("instance_type varies by environment via local.instance_type", () => {
    expect(stackContent).toMatch(/instance_type\s*=\s*local\.instance_type/);
  });

  test("allocated_storage varies by environment via local.db_allocated", () => {
    expect(stackContent).toMatch(/allocated_storage\s*=\s*local\.db_allocated/);
  });

  test("Environment tag varies via title(var.env)", () => {
    expect(stackContent).toMatch(/Environment.*title\s*\(\s*var\.env\s*\)/);
  });

  test("ASG capacity is constant (not env-dependent)", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      // Should have hardcoded values, not variables
      expect(asgSection[0]).toMatch(/desired_capacity\s*=\s*2/);
      expect(asgSection[0]).not.toMatch(/desired_capacity\s*=\s*var\./);
    }
  });

  test("RDS multi_az is constant false (not env-dependent)", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/multi_az\s*=\s*false/);
      expect(rdsSection[0]).not.toMatch(/multi_az\s*=\s*var\./);
    }
  });

  test("subnet counts are constant (2 public, 2 private)", () => {
    const publicSubnet = stackContent.match(/resource\s+"aws_subnet"\s+"public"/);
    const privateSubnet = stackContent.match(/resource\s+"aws_subnet"\s+"private"/);
    expect(publicSubnet).toBeTruthy();
    expect(privateSubnet).toBeTruthy();
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{\s*count\s*=\s*2/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{\s*count\s*=\s*2/);
  });

  test("NAT Gateway count is constant (1)", () => {
    const natMatches = stackContent.match(/resource\s+"aws_nat_gateway"\s+"this"/g);
    expect(natMatches?.length).toBe(1);
  });
});

describe("Resource Count Validation", () => {
  test("exactly 1 VPC", () => {
    const matches = stackContent.match(/resource\s+"aws_vpc"\s+"this"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 IGW", () => {
    const matches = stackContent.match(/resource\s+"aws_internet_gateway"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 NAT Gateway", () => {
    const matches = stackContent.match(/resource\s+"aws_nat_gateway"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 ALB", () => {
    const matches = stackContent.match(/resource\s+"aws_lb"\s+"this"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 Target Group", () => {
    const matches = stackContent.match(/resource\s+"aws_lb_target_group"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 Listener", () => {
    const matches = stackContent.match(/resource\s+"aws_lb_listener"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 Launch Template", () => {
    const matches = stackContent.match(/resource\s+"aws_launch_template"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 ASG", () => {
    const matches = stackContent.match(/resource\s+"aws_autoscaling_group"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 1 RDS instance", () => {
    const matches = stackContent.match(/resource\s+"aws_db_instance"/g);
    expect(matches?.length).toBe(1);
  });

  test("exactly 3 Security Groups (alb, app, db)", () => {
    const matches = stackContent.match(/resource\s+"aws_security_group"/g);
    expect(matches?.length).toBe(3);
  });
});

describe("Best Practices & Production Readiness", () => {
  test("no hardcoded credentials in RDS resource", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      // Should not have literal password strings
      expect(rdsSection[0]).not.toMatch(/password\s*=\s*"(?!.*var\.)/);
    }
  });

  test("RDS has backup configuration", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/backup_retention_period/);
      expect(rdsSection[0]).toMatch(/backup_window/);
    }
  });

  test("RDS has maintenance window configured", () => {
    const rdsSection = stackContent.match(
      /resource\s+"aws_db_instance"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(rdsSection).toBeTruthy();
    if (rdsSection) {
      expect(rdsSection[0]).toMatch(/maintenance_window/);
    }
  });

  test("Target Group has lifecycle create_before_destroy", () => {
    const tgSection = stackContent.match(
      /resource\s+"aws_lb_target_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(tgSection).toBeTruthy();
    if (tgSection) {
      expect(tgSection[0]).toMatch(/lifecycle\s*\{/);
      expect(tgSection[0]).toMatch(/create_before_destroy\s*=\s*true/);
    }
  });

  test("Launch Template uses name_prefix for immutability", () => {
    const ltSection = stackContent.match(
      /resource\s+"aws_launch_template"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(ltSection).toBeTruthy();
    if (ltSection) {
      expect(ltSection[0]).toMatch(/name_prefix\s*=/);
    }
  });

  test("ASG uses $Latest for launch template version", () => {
    const asgSection = stackContent.match(
      /resource\s+"aws_autoscaling_group"\s+"this"\s*\{[\s\S]*?\n\}/m
    );
    expect(asgSection).toBeTruthy();
    if (asgSection) {
      expect(asgSection[0]).toMatch(/version\s*=\s*"\$Latest"/);
    }
  });
});
