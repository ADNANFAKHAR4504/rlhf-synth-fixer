// Unit tests for E-Commerce Product Catalog API Infrastructure
// Tests the presence and basic structure of Terraform files

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Files", () => {
  test("main.tf exists", () => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("variables.tf exists", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    expect(fs.existsSync(variablesPath)).toBe(true);
  });

  test("outputs.tf exists", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test("README.md exists", () => {
    const readmePath = path.join(LIB_DIR, "README.md");
    expect(fs.existsSync(readmePath)).toBe(true);
  });
});

describe("Provider Configuration", () => {
  test("provider.tf declares AWS provider", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"/);
  });

  test("provider.tf includes default_tags", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/default_tags/);
  });

  test("provider.tf includes environment_suffix tag", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/Environment\s*=\s*var\.environment_suffix/);
  });
});

describe("Variables Configuration", () => {
  test("variables.tf declares aws_region variable", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"/);
  });

  test("variables.tf declares environment_suffix variable", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"environment_suffix"/);
  });

  test("aws_region defaults to us-east-1", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/default\s*=\s*"us-east-1"/);
  });
});

describe("Main Infrastructure Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("declares VPC resource", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("declares Internet Gateway resource", () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares public subnets", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
  });

  test("declares route table", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
  });

  test("declares ALB security group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("declares EC2 security group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });

  test("declares Application Load Balancer", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
  });

  test("declares target group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
  });

  test("declares ALB listener", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb_listener"/);
  });

  test("declares launch template", () => {
    expect(mainContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
  });

  test("declares Auto Scaling Group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
  });

  test("declares Auto Scaling Policy", () => {
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu_target"/);
  });

  test("declares CloudWatch alarms", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });
});

describe("Resource Naming with environment_suffix", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("VPC name includes environment_suffix", () => {
    expect(mainContent).toMatch(/Name\s*=\s*"vpc-\$\{var\.environment_suffix\}"/);
  });

  test("ALB name includes environment_suffix", () => {
    expect(mainContent).toMatch(/name\s*=\s*"alb-\$\{var\.environment_suffix\}"/);
  });

  test("security group names include environment_suffix", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*"[a-z]+-sg-\$\{var\.environment_suffix\}-"/);
  });

  test("launch template name includes environment_suffix", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*"lt-\$\{var\.environment_suffix\}-"/);
  });

  test("Auto Scaling Group name includes environment_suffix", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*"asg-\$\{var\.environment_suffix\}-"/);
  });
});

describe("Auto Scaling Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("Auto Scaling Group has min_size = 2", () => {
    expect(mainContent).toMatch(/min_size\s*=\s*2/);
  });

  test("Auto Scaling Group has max_size = 6", () => {
    expect(mainContent).toMatch(/max_size\s*=\s*6/);
  });

  test("uses t3.micro instance type", () => {
    expect(mainContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
  });

  test("target tracking policy targets 70% CPU", () => {
    expect(mainContent).toMatch(/target_value\s*=\s*70\.0/);
  });

  test("policy type is TargetTrackingScaling", () => {
    expect(mainContent).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
  });
});

describe("Security Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("ALB security group allows HTTP (port 80)", () => {
    expect(mainContent).toMatch(/from_port\s*=\s*80/);
  });

  test("ALB security group allows HTTPS (port 443)", () => {
    expect(mainContent).toMatch(/from_port\s*=\s*443/);
  });

  test("EC2 security group references ALB security group", () => {
    expect(mainContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("deletion protection is disabled", () => {
    expect(mainContent).toMatch(/enable_deletion_protection\s*=\s*false/);
  });
});

describe("Health Check Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("health check path is /health", () => {
    expect(mainContent).toMatch(/path\s*=\s*"\/health"/);
  });

  test("health check matcher is 200", () => {
    expect(mainContent).toMatch(/matcher\s*=\s*"200"/);
  });

  test("sticky sessions are enabled", () => {
    expect(mainContent).toMatch(/enabled\s*=\s*true/);
  });

  test("Auto Scaling Group uses ELB health check", () => {
    expect(mainContent).toMatch(/health_check_type\s*=\s*"ELB"/);
  });
});

describe("Data Sources", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("uses data source for Amazon Linux 2 AMI", () => {
    expect(mainContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
  });

  test("AMI filter includes amzn2", () => {
    expect(mainContent).toMatch(/amzn2-ami-hvm/);
  });

  test("uses data source for availability zones", () => {
    expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });
});

describe("Outputs Configuration", () => {
  test("outputs.tf declares alb_dns_name output", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    const content = fs.readFileSync(outputsPath, "utf8");
    expect(content).toMatch(/output\s+"alb_dns_name"/);
  });

  test("outputs.tf declares target_group_arn output", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    const content = fs.readFileSync(outputsPath, "utf8");
    expect(content).toMatch(/output\s+"target_group_arn"/);
  });

  test("outputs.tf declares api_endpoint output", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    const content = fs.readFileSync(outputsPath, "utf8");
    expect(content).toMatch(/output\s+"api_endpoint"/);
  });

  test("outputs.tf declares health_check_endpoint output", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    const content = fs.readFileSync(outputsPath, "utf8");
    expect(content).toMatch(/output\s+"health_check_endpoint"/);
  });
});

describe("CloudWatch Monitoring", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("declares high CPU alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
  });

  test("declares unhealthy hosts alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unhealthy_hosts"/);
  });

  test("launch template enables detailed monitoring", () => {
    expect(mainContent).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("Auto Scaling Group has enabled_metrics", () => {
    expect(mainContent).toMatch(/enabled_metrics\s*=/);
  });
});

describe("User Data Script", () => {
  let mainContent: string;

  beforeAll(() => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("user data script installs httpd", () => {
    expect(mainContent).toMatch(/yum install -y httpd/);
  });

  test("user data script creates health endpoint", () => {
    expect(mainContent).toMatch(/\/var\/www\/html\/health/);
  });

  test("user data script starts httpd service", () => {
    expect(mainContent).toMatch(/systemctl start httpd/);
  });

  test("user data script enables httpd service", () => {
    expect(mainContent).toMatch(/systemctl enable httpd/);
  });
});
