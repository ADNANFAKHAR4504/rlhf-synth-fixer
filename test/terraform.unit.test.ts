// Unit tests for Financial Services Infrastructure Terraform
// Target: 90%+ coverage of infrastructure components

import fs from "fs";
import path from "path";

const MAIN_FILE = "../lib/main.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const VPC_FILE = "../lib/vpc.tf";
const LOCALS_FILE = "../lib/locals.tf";
const DATA_FILE = "../lib/data.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const NETWORKING_MODULE = "../lib/modules/networking/main.tf";
const COMPUTE_MODULE = "../lib/modules/compute/main.tf";
const DATABASE_MODULE = "../lib/modules/database/main.tf";

const mainPath = path.resolve(__dirname, MAIN_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const vpcPath = path.resolve(__dirname, VPC_FILE);
const localsPath = path.resolve(__dirname, LOCALS_FILE);
const dataPath = path.resolve(__dirname, DATA_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const networkingModulePath = path.resolve(__dirname, NETWORKING_MODULE);
const computeModulePath = path.resolve(__dirname, COMPUTE_MODULE);
const databaseModulePath = path.resolve(__dirname, DATABASE_MODULE);

describe("Financial Services Infrastructure - File Structure", () => {
  test("main.tf file exists", () => {
    const exists = fs.existsSync(mainPath);
    expect(exists).toBe(true);
  });

  test("provider.tf file exists", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
  });

  test("variables.tf file exists", () => {
    const exists = fs.existsSync(variablesPath);
    expect(exists).toBe(true);
  });

  test("vpc.tf file exists", () => {
    const exists = fs.existsSync(vpcPath);
    expect(exists).toBe(true);
  });

  test("locals.tf file exists", () => {
    const exists = fs.existsSync(localsPath);
    expect(exists).toBe(true);
  });

  test("data.tf file exists", () => {
    const exists = fs.existsSync(dataPath);
    expect(exists).toBe(true);
  });

  test("outputs.tf file exists", () => {
    const exists = fs.existsSync(outputsPath);
    expect(exists).toBe(true);
  });

  test("networking module main.tf exists", () => {
    const exists = fs.existsSync(networkingModulePath);
    expect(exists).toBe(true);
  });

  test("compute module main.tf exists", () => {
    const exists = fs.existsSync(computeModulePath);
    expect(exists).toBe(true);
  });

  test("database module main.tf exists", () => {
    const exists = fs.existsSync(databaseModulePath);
    expect(exists).toBe(true);
  });
});

describe("Financial Services Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("provider.tf declares terraform required_version", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
  });

  test("provider.tf declares AWS provider requirement", () => {
    expect(providerContent).toMatch(/required_providers\s*{/);
    expect(providerContent).toMatch(/aws\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("provider.tf declares AWS provider version constraint", () => {
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*\d+\.\d+"/);
  });

  test("provider.tf declares random provider requirement", () => {
    expect(providerContent).toMatch(/random\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf configures default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/tags\s*=\s*local\.common_tags/);
  });
});

describe("Financial Services Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares availability_zones variable", () => {
    expect(variablesContent).toMatch(/variable\s+"availability_zones"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares instance_type variable", () => {
    expect(variablesContent).toMatch(/variable\s+"instance_type"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("instance_type has validation", () => {
    expect(variablesContent).toMatch(/validation\s*{/);
    expect(variablesContent).toMatch(/condition\s*=\s*contains/);
  });

  test("declares instance_count variable", () => {
    expect(variablesContent).toMatch(/variable\s+"instance_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares db_instance_class variable", () => {
    expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*{/);
  });

  test("declares db_backup_retention_days variable", () => {
    expect(variablesContent).toMatch(/variable\s+"db_backup_retention_days"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares environment variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares cost_center variable", () => {
    expect(variablesContent).toMatch(/variable\s+"cost_center"\s*{/);
  });
});

describe("Financial Services Infrastructure - Locals Configuration", () => {
  let localsContent: string;

  beforeAll(() => {
    localsContent = fs.readFileSync(localsPath, "utf8");
  });

  test("defines common_tags", () => {
    expect(localsContent).toMatch(/common_tags\s*=\s*{/);
    expect(localsContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(localsContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    expect(localsContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
  });

  test("defines resource_prefix", () => {
    expect(localsContent).toMatch(/resource_prefix\s*=\s*"finserv-\$\{var\.environment_suffix\}"/);
  });
});

describe("Financial Services Infrastructure - Data Sources", () => {
  let dataContent: string;

  beforeAll(() => {
    dataContent = fs.readFileSync(dataPath, "utf8");
  });

  test("queries AWS AMI for Amazon Linux 2023", () => {
    expect(dataContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2023"\s*{/);
    expect(dataContent).toMatch(/most_recent\s*=\s*true/);
    expect(dataContent).toMatch(/owners\s*=\s*\[\s*"amazon"\s*\]/);
    expect(dataContent).toMatch(/filter\s*{[\s\S]*?name\s*=\s*"name"/);
    expect(dataContent).toMatch(/values\s*=\s*\[\s*"al2023-ami-.*-x86_64"\s*\]/);
  });

  test("defines local vpc_id", () => {
    expect(dataContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("defines local private_subnet_ids", () => {
    expect(dataContent).toMatch(/private_subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("defines local public_subnet_ids", () => {
    expect(dataContent).toMatch(/public_subnet_ids\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });
});

describe("Financial Services Infrastructure - VPC Resources", () => {
  let vpcContent: string;

  beforeAll(() => {
    vpcContent = fs.readFileSync(vpcPath, "utf8");
  });

  test("creates VPC", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(vpcContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    expect(vpcContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public subnets", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(vpcContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\)/);
    expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private subnets", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\s*\+\s*length\(var\.availability_zones\)\)/);
  });

  test("creates Elastic IPs for NAT Gateways", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("creates NAT Gateways", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    expect(vpcContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("creates public route table", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(vpcContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(vpcContent).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(vpcContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("creates private route tables", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/route\s*{[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
  });

  test("creates public route table associations", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("creates private route table associations", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(vpcContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
  });
});

describe("Financial Services Infrastructure - Module Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("declares networking module", () => {
    expect(mainContent).toMatch(/module\s+"networking"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/networking"/);
    expect(mainContent).toMatch(/resource_prefix\s*=\s*local\.resource_prefix/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*local\.vpc_id/);
  });

  test("declares compute module", () => {
    expect(mainContent).toMatch(/module\s+"compute"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/compute"/);
    expect(mainContent).toMatch(/resource_prefix\s*=\s*local\.resource_prefix/);
    expect(mainContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(mainContent).toMatch(/instance_count\s*=\s*var\.instance_count/);
  });

  test("declares database module", () => {
    expect(mainContent).toMatch(/module\s+"database"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/database"/);
    expect(mainContent).toMatch(/resource_prefix\s*=\s*local\.resource_prefix/);
    expect(mainContent).toMatch(/db_instance_class\s*=\s*var\.db_instance_class/);
  });
});

describe("Financial Services Infrastructure - Networking Module", () => {
  let networkingContent: string;

  beforeAll(() => {
    networkingContent = fs.readFileSync(networkingModulePath, "utf8");
  });

  test("creates ALB security group", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    expect(networkingContent).toMatch(/vpc_id\s*=\s*var\.vpc_id/);
  });

  test("ALB security group allows HTTP from internet", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?ingress\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("ALB security group allows HTTPS from internet", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?ingress\s*{[\s\S]*?from_port\s*=\s*443/);
  });

  test("creates EC2 security group", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
  });

  test("creates RDS security group", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
  });

  test("creates Application Load Balancer", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    expect(networkingContent).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("creates target group", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
  });

  test("creates HTTP listener", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
  });
});

describe("Financial Services Infrastructure - Compute Module", () => {
  let computeContent: string;

  beforeAll(() => {
    computeContent = fs.readFileSync(computeModulePath, "utf8");
  });

  test("creates IAM role for EC2", () => {
    expect(computeContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"\s*{/);
  });

  test("creates IAM instance profile", () => {
    expect(computeContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
  });

  test("creates launch template", () => {
    expect(computeContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
  });

  test("creates Auto Scaling Group", () => {
    expect(computeContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
  });
});

describe("Financial Services Infrastructure - Database Module", () => {
  let databaseContent: string;

  beforeAll(() => {
    databaseContent = fs.readFileSync(databaseModulePath, "utf8");
  });

  test("creates DB subnet group", () => {
    expect(databaseContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    expect(databaseContent).toMatch(/subnet_ids\s*=\s*var\.private_subnet_ids/);
  });

  test("creates random password for RDS", () => {
    expect(databaseContent).toMatch(/resource\s+"random_password"\s+"db_master"\s*{/);
  });

  test("stores password in SSM Parameter Store", () => {
    expect(databaseContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"\s*{/);
    expect(databaseContent).toMatch(/type\s*=\s*"SecureString"/);
  });

  test("creates RDS Aurora cluster", () => {
    expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster"\s+"main"\s*{/);
    expect(databaseContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
  });

  test("RDS cluster uses db_subnet_group_name", () => {
    expect(databaseContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
  });

  test("RDS cluster has backup configuration", () => {
    expect(databaseContent).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_days/);
  });

  test("creates RDS cluster instances", () => {
    expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"main"\s*{/);
  });
});

describe("Financial Services Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("exports ALB DNS name", () => {
    expect(outputsContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.networking\.alb_dns_name/);
  });

  test("exports ALB ARN", () => {
    expect(outputsContent).toMatch(/output\s+"alb_arn"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.networking\.alb_arn/);
  });

  test("exports autoscaling group name", () => {
    expect(outputsContent).toMatch(/output\s+"autoscaling_group_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.compute\.autoscaling_group_name/);
  });

  test("exports database endpoint", () => {
    expect(outputsContent).toMatch(/output\s+"database_endpoint"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.database\.cluster_endpoint/);
  });

  test("exports database reader endpoint", () => {
    expect(outputsContent).toMatch(/output\s+"database_reader_endpoint"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.database\.cluster_reader_endpoint/);
  });

  test("exports VPC ID", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*local\.vpc_id/);
  });

  test("exports private subnet IDs", () => {
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*local\.private_subnet_ids/);
  });

  test("exports public subnet IDs", () => {
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*local\.public_subnet_ids/);
  });
});

describe("Financial Services Infrastructure - Best Practices", () => {
  let allContent: string;

  beforeAll(() => {
    allContent =
      fs.readFileSync(mainPath, "utf8") +
      fs.readFileSync(vpcPath, "utf8") +
      fs.readFileSync(localsPath, "utf8") +
      fs.readFileSync(networkingModulePath, "utf8") +
      fs.readFileSync(computeModulePath, "utf8") +
      fs.readFileSync(databaseModulePath, "utf8");
  });

  test("uses common tags across resources", () => {
    expect(allContent).toMatch(/common_tags/);
    expect(allContent).toMatch(/merge\([\s\S]*?local\.common_tags/);
  });

  test("uses resource_prefix for naming", () => {
    expect(allContent).toMatch(/resource_prefix/);
  });

  test("VPC resources use common tags", () => {
    expect(vpcPath).toBeTruthy();
    const vpcContent = fs.readFileSync(vpcPath, "utf8");
    expect(vpcContent).toMatch(/tags\s*=\s*merge\([\s\S]*?local\.common_tags/);
  });

  test("modules use common tags", () => {
    expect(allContent).toMatch(/common_tags\s*=\s*local\.common_tags/);
  });

  test("uses environment_suffix for resource naming", () => {
    expect(allContent).toMatch(/environment_suffix/);
  });
});

describe("Financial Services Infrastructure - Security Best Practices", () => {
  let networkingContent: string;
  let databaseContent: string;

  beforeAll(() => {
    networkingContent = fs.readFileSync(networkingModulePath, "utf8");
    databaseContent = fs.readFileSync(databaseModulePath, "utf8");
  });

  test("EC2 instances are in private subnets", () => {
    const computeContent = fs.readFileSync(computeModulePath, "utf8");
    expect(computeContent).toMatch(/private_subnet_ids/);
  });

  test("RDS cluster is in private subnets", () => {
    expect(databaseContent).toMatch(/private_subnet_ids/);
  });

  test("RDS password is stored in SSM Parameter Store", () => {
    expect(databaseContent).toMatch(/aws_ssm_parameter.*db_password/);
    expect(databaseContent).toMatch(/type\s*=\s*"SecureString"/);
  });

  test("security groups have proper ingress rules", () => {
    expect(networkingContent).toMatch(/ingress\s*{/);
  });

  test("security groups have egress rules", () => {
    expect(networkingContent).toMatch(/egress\s*{/);
  });
});

describe("Financial Services Infrastructure - Coverage Summary", () => {
  let allContent: string;

  beforeAll(() => {
    allContent =
      fs.readFileSync(mainPath, "utf8") +
      fs.readFileSync(vpcPath, "utf8") +
      fs.readFileSync(networkingModulePath, "utf8") +
      fs.readFileSync(computeModulePath, "utf8") +
      fs.readFileSync(databaseModulePath, "utf8");
  });

  test("creates VPC infrastructure", () => {
    expect(allContent).toMatch(/aws_vpc/);
    expect(allContent).toMatch(/aws_subnet/);
    expect(allContent).toMatch(/aws_internet_gateway/);
    expect(allContent).toMatch(/aws_nat_gateway/);
  });

  test("creates networking resources", () => {
    expect(allContent).toMatch(/aws_lb/);
    expect(allContent).toMatch(/aws_lb_target_group/);
    expect(allContent).toMatch(/aws_security_group/);
  });

  test("creates compute resources", () => {
    expect(allContent).toMatch(/aws_launch_template/);
    expect(allContent).toMatch(/aws_autoscaling_group/);
    expect(allContent).toMatch(/aws_iam_role/);
  });

  test("creates database resources", () => {
    expect(allContent).toMatch(/aws_rds_cluster/);
    expect(allContent).toMatch(/aws_rds_cluster_instance/);
    expect(allContent).toMatch(/aws_db_subnet_group/);
  });

  test("implements modular architecture", () => {
    expect(allContent).toMatch(/module\s+"networking"/);
    expect(allContent).toMatch(/module\s+"compute"/);
    expect(allContent).toMatch(/module\s+"database"/);
  });
});
