/**
 * AWS Infrastructure Unit Tests
 * 
 * This test suite validates the Terraform infrastructure configuration:
 * 1. VPC with public and private subnets across multiple AZs
 * 2. NAT Gateways with Elastic IPs
 * 3. Security Groups for ALB and EC2 instances
 * 4. Auto Scaling Group with CPU-based scaling
 * 5. Application Load Balancer with health checks
 * 6. Proper resource tagging and naming
 * 7. Output definitions for key resources
 */

import fs from "fs";
import path from "path";

/** === File loader === */
const mainTfPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerTfPath = path.resolve(__dirname, "../lib/provider.tf");

function readFileOrThrow(p: string): string {
  if (!fs.existsSync(p)) throw new Error(`File not found at ${p}`);
  return fs.readFileSync(p, "utf8");
}

/** === Helpers: comment strip === */
function stripComments(hcl: string): string {
  // block comments
  let s = hcl.replace(/\/\*[\s\S]*?\*\//g, "");
  // line comments
  s = s.replace(/\/\/[^\n]*\n/g, "\n");
  s = s.replace(/^[ \t]*#[^\n]*\n/gm, "\n");
  return s;
}

describe("AWS Infrastructure Unit Tests", () => {
  const raw = readFileOrThrow(mainTfPath);
  const providerRaw = readFileOrThrow(providerTfPath);
  const hcl = stripComments(raw);
  const providerHcl = stripComments(providerRaw);

  it("is readable and non-trivial", () => {
    expect(raw.length).toBeGreaterThan(1000);
    expect(raw).toContain("resource");
    expect(raw).toContain("variable");
    expect(raw).toContain("output");
  });

  it("does NOT contain provider/terraform blocks (kept in provider.tf)", () => {
    expect(/^\s*provider\s+"/m.test(hcl)).toBe(false);
    expect(/^\s*terraform\s*{/m.test(hcl)).toBe(false);
  });

  it("has proper Terraform version and provider configuration in provider.tf", () => {
    expect(providerHcl).toMatch(/required_version\s*=\s*">= 1.4.0"/);
    expect(providerHcl).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerHcl).toMatch(/version\s*=\s*">= 5.0"/);
    expect(providerHcl).toMatch(/provider\s+"aws"/);
    expect(providerHcl).toMatch(/region\s*=\s*var\.aws_region/);
  });

  it("has default tags configuration in provider.tf", () => {
    expect(providerRaw).toContain("default_tags");
    expect(providerRaw).toContain("Environment = var.environment");
    expect(providerRaw).toContain("Project     = var.project_name");
    expect(providerRaw).toContain("ManagedBy   = \"Terraform\"");
  });

  it("has data sources for AMI and availability zones", () => {
    expect(raw).toMatch(/data\s+"aws_ami"\s+"latest_amazon_linux"/);
    expect(raw).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    expect(raw).toMatch(/most_recent\s*=\s*true/);
    expect(raw).toMatch(/owners\s*=\s*\["amazon"\]/);
  });

  it("has VPC configuration with proper settings", () => {
    expect(raw).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(raw).toContain("cidr_block           = var.vpc_cidr");
    expect(raw).toContain("enable_dns_hostnames = true");
    expect(raw).toContain("enable_dns_support   = true");
    expect(raw).toMatch(/Name\s*=\s*"\$\{(local\.name_prefix|var\.project_name)\}-vpc"/);
  });

  it("has public subnets across multiple AZs", () => {
    expect(raw).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(raw).toContain("vpc_id = aws_vpc.main.id");
    expect(raw).toContain("cidrsubnet(var.vpc_cidr, 8, count.index)");
    expect(raw).toContain("availability_zone = data.aws_availability_zones.available.names[count.index]");
    expect(raw).toContain("map_public_ip_on_launch = true");
    expect(raw).toContain("Type = \"Public\"");
  });

  it("has private subnets across multiple AZs", () => {
    expect(raw).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(raw).toContain("vpc_id = aws_vpc.main.id");
    expect(raw).toContain("cidrsubnet(var.vpc_cidr, 8, count.index + 2)");
    expect(raw).toContain("availability_zone = data.aws_availability_zones.available.names[count.index]");
    expect(raw).toContain("Type = \"Private\"");
  });

  it("has Internet Gateway configuration", () => {
    expect(raw).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    expect(raw).toContain("vpc_id = aws_vpc.main.id");
    expect(raw).toMatch(/Name\s*=\s*"\$\{(local\.name_prefix|var\.project_name)\}-igw"/);
  });

  it("has Elastic IPs for NAT Gateways", () => {
    expect(raw).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    expect(raw).toContain("domain = \"vpc\"");
    expect(raw).toMatch(/Name\s*=\s*"\$\{(local\.name_prefix|var\.project_name)\}-nat-eip-\$\{count\.index \+ 1\}"/);
  });

  it("has NAT Gateways with proper configuration", () => {
    expect(raw).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    expect(raw).toContain("allocation_id = aws_eip.nat[count.index].id");
    expect(raw).toContain("subnet_id     = aws_subnet.public[count.index].id");
    expect(raw).toContain("depends_on = [aws_internet_gateway.main]");
  });

  it("has route tables for public and private subnets", () => {
    expect(raw).toMatch(/resource\s+"aws_route_table"/);
    expect(raw).toContain("gateway_id = aws_internet_gateway.main.id");
    expect(raw).toContain("nat_gateway_id = aws_nat_gateway.main[count.index].id");
  });

  it("has security group for ALB with HTTP and HTTPS", () => {
    expect(raw).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    expect(raw).toContain("description = \"Security group for Application Load Balancer\"");
    expect(raw).toContain("from_port   = 80");
    expect(raw).toContain("to_port     = 80");
    expect(raw).toContain("from_port   = 443");
    expect(raw).toContain("to_port     = 443");
    expect(raw).toContain("protocol    = \"tcp\"");
  });

  it("has security group for EC2 instances", () => {
    expect(raw).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    expect(raw).toContain("description = \"Security group for EC2 instances\"");
    expect(raw).toContain("security_groups = [aws_security_group.alb.id]");
    expect(raw).toContain("from_port       = 80");
    expect(raw).toContain("from_port       = 443");
  });

  it("has launch template with proper configuration", () => {
    expect(raw).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    expect(raw).toContain("image_id      = var.ami_id != \"\" ? var.ami_id : data.aws_ami.latest_amazon_linux.id");
    expect(raw).toContain("instance_type = var.instance_type");
    expect(raw).toContain("associate_public_ip_address = false");
    expect(raw).toContain("security_groups             = [aws_security_group.ec2.id]");
    expect(raw).toContain("user_data = base64encode");
  });

  it("has IAM role and instance profile for EC2", () => {
    expect(raw).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    expect(raw).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    expect(raw).toContain("Service = \"ec2.amazonaws.com\"");
  });

  it("has Application Load Balancer configuration", () => {
    expect(raw).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(raw).toContain("internal           = false");
    expect(raw).toContain("load_balancer_type = \"application\"");
    expect(raw).toContain("security_groups    = [aws_security_group.alb.id]");
    expect(raw).toContain("subnets            = aws_subnet.public[*].id");
    expect(raw).toContain("enable_deletion_protection = false");
  });

  it("has target group with health checks", () => {
    expect(raw).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    expect(raw).toContain("port     = 80");
    expect(raw).toContain("protocol = \"HTTP\"");
    expect(raw).toContain("healthy_threshold   = 2");
    expect(raw).toContain("unhealthy_threshold = 3");
    expect(raw).toContain("interval            = 30");
    expect(raw).toContain("timeout             = 5");
    expect(raw).toContain("path                = \"/\"");
  });

  it("has ALB listener configuration", () => {
    expect(raw).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    expect(raw).toContain("port              = \"80\"");
    expect(raw).toContain("protocol          = \"HTTP\"");
    expect(raw).toContain("type             = \"forward\"");
    // Updated for conditional resource syntax with count
    expect(raw).toContain("target_group_arn = aws_lb_target_group.main[0].arn");
  });

  it("has Auto Scaling Group with proper configuration", () => {
    expect(raw).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    expect(raw).toContain("desired_capacity    = var.desired_capacity");
    expect(raw).toContain("max_size            = var.max_size");
    expect(raw).toContain("min_size            = var.min_size");
    // Updated for conditional resource syntax - uses ternary for LocalStack compatibility
    expect(raw).toContain("target_group_arns   = var.enable_alb ? [aws_lb_target_group.main[0].arn] : []");
    expect(raw).toContain("vpc_zone_identifier = aws_subnet.private[*].id");
    expect(raw).toContain("version = \"$Latest\"");
  });

  it("has auto scaling policies for scale up and down", () => {
    expect(raw).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
    expect(raw).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    expect(raw).toContain("scaling_adjustment     = 1");
    expect(raw).toContain("adjustment_type        = \"ChangeInCapacity\"");
    expect(raw).toContain("cooldown               = 300");
    expect(raw).toContain("scaling_adjustment     = -1");
  });

  it("has CloudWatch alarms for CPU scaling", () => {
    expect(raw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/);
    expect(raw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"/);
    expect(raw).toMatch(/threshold\s*=\s*("80"|var\.cpu_high_threshold)/);
    expect(raw).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    expect(raw).toMatch(/threshold\s*=\s*("20"|var\.cpu_low_threshold)/);
  });

  it("has all required variables defined", () => {
    const requiredVars = [
      "aws_region",
      "environment", 
      "project_name",
      "vpc_cidr",
      "ami_id",
      "instance_type",
      "min_size",
      "desired_capacity",
      "max_size"
    ];
    
    requiredVars.forEach(varName => {
      expect(raw).toMatch(new RegExp(`variable\\s+"${varName}"`));
    });
  });

  it("has comprehensive outputs defined", () => {
    const requiredOutputs = [
      "vpc_id",
      "public_subnet_ids", 
      "private_subnet_ids",
      "alb_dns_name",
      "alb_arn",
      "asg_name",
      "nat_gateway_ips",
      "security_group_ids"
    ];
    
    requiredOutputs.forEach(outputName => {
      expect(raw).toMatch(new RegExp(`output\\s+"${outputName}"`));
    });
  });

  it("has proper resource tagging throughout", () => {
    // Check for common tagging patterns
    expect(raw).toContain("tags = {");
    expect(raw).toContain("Name =");
    expect(raw).toContain("local.common_tags");
  });

  it("uses variables instead of hardcoded values", () => {
    expect(raw).toContain("var.environment");
    expect(raw).toContain("var.project_name");
    expect(raw).toContain("var.vpc_cidr");
    expect(raw).toContain("var.instance_type");
    expect(raw).toContain("var.desired_capacity");
    expect(raw).toContain("var.min_size");
    expect(raw).toContain("var.max_size");
  });

  it("has proper resource dependencies", () => {
    expect(raw).toContain("depends_on = [aws_internet_gateway.main]");
    expect(raw).toContain("vpc_id = aws_vpc.main.id");
    expect(raw).toContain("subnet_id     = aws_subnet.public[count.index].id");
    expect(raw).toContain("security_groups = [aws_security_group.alb.id]");
  });
});
