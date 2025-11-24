// Unit tests for Payment Processing Platform Terraform infrastructure
// Target: 90%+ coverage of payment processing platform infrastructure

import fs from "fs";
import path from "path";

const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const DATA_FILE = "../lib/data.tf";
const LOCALS_FILE = "../lib/locals.tf";
const VPC_FILE = "../lib/vpc.tf";
const SECURITY_GROUPS_FILE = "../lib/security-groups.tf";
const ALB_FILE = "../lib/alb.tf";
const ECS_FILE = "../lib/ecs.tf";
const ECS_AUTOSCALING_FILE = "../lib/ecs-autoscaling.tf";
const RDS_FILE = "../lib/rds.tf";
const ECR_FILE = "../lib/ecr.tf";
const S3_FILE = "../lib/s3.tf";
const VPC_FLOW_LOGS_FILE = "../lib/vpc-flow-logs.tf";
const VPC_ENDPOINTS_FILE = "../lib/vpc-endpoints.tf";
const CLOUDWATCH_FILE = "../lib/cloudwatch.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";

const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const dataPath = path.resolve(__dirname, DATA_FILE);
const localsPath = path.resolve(__dirname, LOCALS_FILE);
const vpcPath = path.resolve(__dirname, VPC_FILE);
const securityGroupsPath = path.resolve(__dirname, SECURITY_GROUPS_FILE);
const albPath = path.resolve(__dirname, ALB_FILE);
const ecsPath = path.resolve(__dirname, ECS_FILE);
const ecsAutoscalingPath = path.resolve(__dirname, ECS_AUTOSCALING_FILE);
const rdsPath = path.resolve(__dirname, RDS_FILE);
const ecrPath = path.resolve(__dirname, ECR_FILE);
const s3Path = path.resolve(__dirname, S3_FILE);
const vpcFlowLogsPath = path.resolve(__dirname, VPC_FLOW_LOGS_FILE);
const vpcEndpointsPath = path.resolve(__dirname, VPC_ENDPOINTS_FILE);
const cloudwatchPath = path.resolve(__dirname, CLOUDWATCH_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);

function readFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function hasResource(content: string, resourceType: string, resourceName: string): boolean {
  const pattern = new RegExp(
    `resource\\s+"${resourceType.replace(/\./g, "\\.")}"\\s+"${resourceName.replace(/\./g, "\\.")}"\\s*{`
  );
  return pattern.test(content);
}

function hasOutput(content: string, outputName: string): boolean {
  const pattern = new RegExp(`output\\s+"${outputName.replace(/\./g, "\\.")}"\\s*{`);
  return pattern.test(content);
}

function countResourceOccurrences(content: string, resourceType: string): number {
  const pattern = new RegExp(`resource\\s+"${resourceType.replace(/\./g, "\\.")}"`, "g");
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

describe("Payment Processing Platform Infrastructure - File Structure", () => {
  test("provider.tf file exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("variables.tf file exists", () => {
    expect(fs.existsSync(variablesPath)).toBe(true);
  });

  test("data.tf file exists", () => {
    expect(fs.existsSync(dataPath)).toBe(true);
  });

  test("locals.tf file exists", () => {
    expect(fs.existsSync(localsPath)).toBe(true);
  });

  test("outputs.tf file exists", () => {
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test("vpc.tf file exists", () => {
    expect(fs.existsSync(vpcPath)).toBe(true);
  });

  test("security-groups.tf file exists", () => {
    expect(fs.existsSync(securityGroupsPath)).toBe(true);
  });

  test("alb.tf file exists", () => {
    expect(fs.existsSync(albPath)).toBe(true);
  });

  test("ecs.tf file exists", () => {
    expect(fs.existsSync(ecsPath)).toBe(true);
  });

  test("ecs-autoscaling.tf file exists", () => {
    expect(fs.existsSync(ecsAutoscalingPath)).toBe(true);
  });

  test("rds.tf file exists", () => {
    expect(fs.existsSync(rdsPath)).toBe(true);
  });

  test("ecr.tf file exists", () => {
    expect(fs.existsSync(ecrPath)).toBe(true);
  });

  test("s3.tf file exists", () => {
    expect(fs.existsSync(s3Path)).toBe(true);
  });

  test("vpc-flow-logs.tf file exists", () => {
    expect(fs.existsSync(vpcFlowLogsPath)).toBe(true);
  });

  test("vpc-endpoints.tf file exists", () => {
    expect(fs.existsSync(vpcEndpointsPath)).toBe(true);
  });

  test("cloudwatch.tf file exists", () => {
    expect(fs.existsSync(cloudwatchPath)).toBe(true);
  });
});

describe("Payment Processing Platform Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readFileContent(providerPath);
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

  test("provider.tf declares random provider", () => {
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
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    expect(providerContent).toMatch(/Project\s*=\s*"payment-processing-app"/);
    expect(providerContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });
});

describe("Payment Processing Platform Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readFileContent(variablesPath);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"default"/);
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("declares availability_zones_count variable", () => {
    expect(variablesContent).toMatch(/variable\s+"availability_zones_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
    expect(variablesContent).toMatch(/default\s*=\s*3/);
  });

  test("declares container_image variable", () => {
    expect(variablesContent).toMatch(/variable\s+"container_image"\s*{/);
  });

  test("declares container_port variable", () => {
    expect(variablesContent).toMatch(/variable\s+"container_port"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares ECS resource variables", () => {
    expect(variablesContent).toMatch(/variable\s+"ecs_task_cpu"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"ecs_task_memory"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"ecs_desired_count"\s*{/);
  });

  test("declares ECS autoscaling variables", () => {
    expect(variablesContent).toMatch(/variable\s+"ecs_min_capacity"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"ecs_max_capacity"\s*{/);
  });

  test("declares database variables", () => {
    expect(variablesContent).toMatch(/variable\s+"db_name"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"db_username"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"db_backup_retention_period"\s*{/);
  });

  test("declares feature flags", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_container_insights"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"enable_vpc_flow_logs"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("variables have proper descriptions", () => {
    expect(variablesContent).toMatch(/description\s*=\s*"[^"]+"/);
  });

  test("environment_suffix has validation", () => {
    expect(variablesContent).toMatch(/validation\s*{/);
    expect(variablesContent).toMatch(/condition\s*=\s*length\(var\.environment_suffix\)\s*>\s*0/);
  });
});

describe("Payment Processing Platform Infrastructure - Data Sources", () => {
  let dataContent: string;

  beforeAll(() => {
    dataContent = readFileContent(dataPath);
  });

  test("queries availability zones", () => {
    expect(dataContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    expect(dataContent).toMatch(/state\s*=\s*"available"/);
  });

  test("queries current AWS caller identity", () => {
    expect(dataContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("queries current AWS region", () => {
    expect(dataContent).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
  });
});

describe("Payment Processing Platform Infrastructure - Locals Configuration", () => {
  let localsContent: string;

  beforeAll(() => {
    localsContent = readFileContent(localsPath);
  });

  test("declares locals block", () => {
    expect(localsContent).toMatch(/locals\s*{/);
  });

  test("defines availability zones using slice", () => {
    expect(localsContent).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names/);
  });

  test("defines public subnet CIDRs", () => {
    expect(localsContent).toMatch(/public_subnet_cidrs\s*=/);
    expect(localsContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*8,\s*i\)/);
  });

  test("defines private subnet CIDRs", () => {
    expect(localsContent).toMatch(/private_subnet_cidrs\s*=/);
    expect(localsContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*8,\s*i\s*\+\s*10\)/);
  });

  test("defines database subnet CIDRs", () => {
    expect(localsContent).toMatch(/database_subnet_cidrs\s*=/);
    expect(localsContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*8,\s*i\s*\+\s*20\)/);
  });

  test("defines name prefix using environment suffix", () => {
    expect(localsContent).toMatch(/name_prefix\s*=\s*"payment-app-\$\{var\.environment_suffix\}"/);
  });

  test("defines common tags", () => {
    expect(localsContent).toMatch(/common_tags\s*=\s*{/);
    expect(localsContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    expect(localsContent).toMatch(/Project\s*=\s*"payment-processing-app"/);
    expect(localsContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });
});

describe("Payment Processing Platform Infrastructure - VPC Resources", () => {
  let vpcContent: string;

  beforeAll(() => {
    vpcContent = readFileContent(vpcPath);
  });

  test("creates VPC", () => {
    expect(hasResource(vpcContent, "aws_vpc", "main")).toBe(true);
    expect(vpcContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(hasResource(vpcContent, "aws_internet_gateway", "main")).toBe(true);
    expect(vpcContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public subnets with count", () => {
    expect(hasResource(vpcContent, "aws_subnet", "public")).toBe(true);
    expect(vpcContent).toMatch(/count\s*=\s*var\.availability_zones_count/);
    expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private subnets with count", () => {
    expect(hasResource(vpcContent, "aws_subnet", "private")).toBe(true);
    expect(vpcContent).toMatch(/count\s*=\s*var\.availability_zones_count/);
  });

  test("creates database subnets with count", () => {
    expect(hasResource(vpcContent, "aws_subnet", "database")).toBe(true);
    expect(vpcContent).toMatch(/count\s*=\s*var\.availability_zones_count/);
  });

  test("subnets use dynamic availability zones", () => {
    expect(vpcContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
  });

  test("creates NAT Gateway", () => {
    expect(hasResource(vpcContent, "aws_nat_gateway", "main")).toBe(true);
    expect(vpcContent).toMatch(/count\s*=\s*var\.availability_zones_count/);
  });

  test("creates Elastic IP for NAT Gateway", () => {
    expect(hasResource(vpcContent, "aws_eip", "nat")).toBe(true);
    expect(vpcContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("creates route tables", () => {
    expect(hasResource(vpcContent, "aws_route_table", "public")).toBe(true);
    expect(hasResource(vpcContent, "aws_route_table", "private")).toBe(true);
    expect(hasResource(vpcContent, "aws_route_table", "database")).toBe(true);
  });

  test("public route table has internet gateway route", () => {
    expect(hasResource(vpcContent, "aws_route", "public_internet")).toBe(true);
    expect(vpcContent).toMatch(/resource\s+"aws_route"\s+"public_internet"[\s\S]*?destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/s);
    expect(vpcContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("private route table routes through NAT Gateway", () => {
    expect(hasResource(vpcContent, "aws_route", "private_nat")).toBe(true);
    expect(vpcContent).toMatch(/resource\s+"aws_route"\s+"private_nat"[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/s);
  });

  test("creates route table associations", () => {
    expect(hasResource(vpcContent, "aws_route_table_association", "public")).toBe(true);
    expect(hasResource(vpcContent, "aws_route_table_association", "private")).toBe(true);
    expect(hasResource(vpcContent, "aws_route_table_association", "database")).toBe(true);
  });

  test("VPC resources use common tags", () => {
    expect(vpcContent).toMatch(/tags\s*=\s*merge\s*\(/);
    expect(vpcContent).toMatch(/local\.common_tags/);
  });
});

describe("Payment Processing Platform Infrastructure - Security Groups", () => {
  let securityGroupsContent: string;

  beforeAll(() => {
    securityGroupsContent = readFileContent(securityGroupsPath);
  });

  test("creates ALB security group", () => {
    expect(hasResource(securityGroupsContent, "aws_security_group", "alb")).toBe(true);
    expect(securityGroupsContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("ALB security group allows HTTP from internet", () => {
    expect(securityGroupsContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
    expect(securityGroupsContent).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("ALB security group allows HTTPS from internet", () => {
    expect(securityGroupsContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443/);
  });

  test("creates ECS task security group", () => {
    expect(hasResource(securityGroupsContent, "aws_security_group", "ecs_tasks")).toBe(true);
  });

  test("ECS task security group allows ingress from ALB only", () => {
    expect(securityGroupsContent).toMatch(/ingress\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    expect(securityGroupsContent).toMatch(/from_port\s*=\s*var\.container_port/);
  });

  test("creates RDS security group", () => {
    expect(hasResource(securityGroupsContent, "aws_security_group", "rds")).toBe(true);
  });

  test("RDS security group allows ingress from ECS tasks", () => {
    expect(securityGroupsContent).toMatch(/ingress\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.ecs_tasks\.id\]/);
    expect(securityGroupsContent).toMatch(/from_port\s*=\s*5432/);
  });
});

describe("Payment Processing Platform Infrastructure - ALB Resources", () => {
  let albContent: string;

  beforeAll(() => {
    albContent = readFileContent(albPath);
  });

  test("creates Application Load Balancer", () => {
    expect(hasResource(albContent, "aws_lb", "main")).toBe(true);
    expect(albContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(albContent).toMatch(/internal\s*=\s*false/);
  });

  test("ALB is in public subnets", () => {
    expect(albContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("ALB uses ALB security group", () => {
    expect(albContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("creates target group for ECS tasks", () => {
    expect(hasResource(albContent, "aws_lb_target_group", "app")).toBe(true);
    expect(albContent).toMatch(/target_type\s*=\s*"ip"/);
    expect(albContent).toMatch(/port\s*=\s*var\.container_port/);
  });

  test("target group has health check configured", () => {
    expect(albContent).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(albContent).toMatch(/path\s*=\s*"\//);
    expect(albContent).toMatch(/matcher\s*=\s*"200"/);
  });

  test("creates HTTP listener on ALB", () => {
    expect(hasResource(albContent, "aws_lb_listener", "http")).toBe(true);
    expect(albContent).toMatch(/port\s*=\s*"80"/);
  });

  test("creates HTTPS listener on ALB", () => {
    expect(hasResource(albContent, "aws_lb_listener", "https")).toBe(true);
    expect(albContent).toMatch(/port\s*=\s*"443"/);
  });
});

describe("Payment Processing Platform Infrastructure - ECS Resources", () => {
  let ecsContent: string;

  beforeAll(() => {
    ecsContent = readFileContent(ecsPath);
  });

  test("creates ECS cluster", () => {
    expect(hasResource(ecsContent, "aws_ecs_cluster", "main")).toBe(true);
  });

  test("ECS cluster enables Container Insights conditionally", () => {
    expect(ecsContent).toMatch(/setting\s*{[\s\S]*?name\s*=\s*"containerInsights"/);
    expect(ecsContent).toMatch(/value\s*=\s*var\.enable_container_insights\s*\?\s*"enabled"\s*:\s*"disabled"/);
  });

  test("creates ECS task definition", () => {
    expect(hasResource(ecsContent, "aws_ecs_task_definition", "app")).toBe(true);
  });

  test("task definition uses Fargate launch type", () => {
    expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
    expect(ecsContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
  });

  test("task definition has CPU and memory configuration", () => {
    expect(ecsContent).toMatch(/cpu\s*=\s*var\.ecs_task_cpu/);
    expect(ecsContent).toMatch(/memory\s*=\s*var\.ecs_task_memory/);
  });

  test("task definition has execution and task roles", () => {
    expect(ecsContent).toMatch(/execution_role_arn\s*=\s*aws_iam_role\.ecs_task_execution\.arn/);
    expect(ecsContent).toMatch(/task_role_arn\s*=\s*aws_iam_role\.ecs_task\.arn/);
  });

  test("task definition container has port mappings", () => {
    expect(ecsContent).toMatch(/container_definitions\s*=\s*jsonencode/);
    expect(ecsContent).toMatch(/portMappings/);
    expect(ecsContent).toMatch(/containerPort\s*=\s*var\.container_port/);
  });

  test("task definition container uses container_image variable", () => {
    expect(ecsContent).toMatch(/image\s*=\s*var\.container_image/);
  });

  test("task definition container has CloudWatch logs configuration", () => {
    expect(ecsContent).toMatch(/logConfiguration/);
    expect(ecsContent).toMatch(/logDriver\s*=\s*"awslogs"/);
    expect(ecsContent).toMatch(/awslogs-group/);
  });

  test("creates ECS service", () => {
    expect(hasResource(ecsContent, "aws_ecs_service", "app")).toBe(true);
  });

  test("ECS service network configuration uses private subnets", () => {
    expect(ecsContent).toMatch(/network_configuration\s*{[\s\S]*?subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
    expect(ecsContent).toMatch(/assign_public_ip\s*=\s*false/);
  });

  test("ECS service is connected to load balancer", () => {
    expect(ecsContent).toMatch(/load_balancer\s*{[\s\S]*?target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/);
  });

  test("ECS service uses desired count", () => {
    expect(ecsContent).toMatch(/desired_count\s*=\s*var\.ecs_desired_count/);
  });
});

describe("Payment Processing Platform Infrastructure - ECS Autoscaling", () => {
  let autoscalingContent: string;

  beforeAll(() => {
    autoscalingContent = readFileContent(ecsAutoscalingPath);
  });

  test("creates ECS autoscaling target", () => {
    expect(hasResource(autoscalingContent, "aws_appautoscaling_target", "ecs")).toBe(true);
    expect(autoscalingContent).toMatch(/min_capacity\s*=\s*var\.ecs_min_capacity/);
    expect(autoscalingContent).toMatch(/max_capacity\s*=\s*var\.ecs_max_capacity/);
  });

  test("creates ECS autoscaling policy", () => {
    expect(hasResource(autoscalingContent, "aws_appautoscaling_policy", "ecs_cpu")).toBe(true);
  });

  test("autoscaling uses CPU utilization metric", () => {
    expect(autoscalingContent).toMatch(/ECSServiceAverageCPUUtilization/);
    expect(autoscalingContent).toMatch(/target_value\s*=\s*70\.0/);
  });

  test("creates memory-based autoscaling policy", () => {
    expect(hasResource(autoscalingContent, "aws_appautoscaling_policy", "ecs_memory")).toBe(true);
    expect(autoscalingContent).toMatch(/ECSServiceAverageMemoryUtilization/);
  });
});

describe("Payment Processing Platform Infrastructure - RDS Resources", () => {
  let rdsContent: string;

  beforeAll(() => {
    rdsContent = readFileContent(rdsPath);
  });

  test("creates Aurora cluster", () => {
    expect(hasResource(rdsContent, "aws_rds_cluster", "main")).toBe(true);
    expect(rdsContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    expect(rdsContent).toMatch(/database_name\s*=\s*var\.db_name/);
    expect(rdsContent).toMatch(/master_username\s*=\s*var\.db_username/);
  });

  test("Aurora cluster uses database subnet group", () => {
    expect(rdsContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
  });

  test("Aurora cluster uses RDS security group", () => {
    expect(rdsContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
  });

  test("Aurora cluster has backup configuration", () => {
    expect(rdsContent).toMatch(/backup_retention_period\s*=\s*var\.db_backup_retention_period/);
    expect(rdsContent).toMatch(/preferred_backup_window\s*=\s*"03:00-04:00"/);
  });

  test("Aurora cluster has encryption enabled", () => {
    expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(rdsContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });

  test("creates Aurora cluster instances", () => {
    expect(hasResource(rdsContent, "aws_rds_cluster_instance", "main")).toBe(true);
    expect(rdsContent).toMatch(/count\s*=\s*2/);
  });

  test("Aurora cluster instances are in database subnets", () => {
    expect(hasResource(rdsContent, "aws_db_subnet_group", "main")).toBe(true);
    expect(rdsContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
  });

  test("creates KMS key for RDS encryption", () => {
    expect(hasResource(rdsContent, "aws_kms_key", "rds")).toBe(true);
    expect(rdsContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates RDS monitoring IAM role", () => {
    expect(hasResource(rdsContent, "aws_iam_role", "rds_monitoring")).toBe(true);
  });
});

describe("Payment Processing Platform Infrastructure - ECR Resources", () => {
  let ecrContent: string;

  beforeAll(() => {
    ecrContent = readFileContent(ecrPath);
  });

  test("creates ECR repository", () => {
    expect(hasResource(ecrContent, "aws_ecr_repository", "app")).toBe(true);
  });

  test("configures ECR repository immutability", () => {
    expect(ecrContent).toMatch(/image_tag_mutability\s*=\s*"MUTABLE"/);
  });

  test("enables image scanning on push", () => {
    expect(ecrContent).toMatch(/image_scanning_configuration\s*{[\s\S]*?scan_on_push\s*=\s*true/);
  });

  test("configures ECR encryption", () => {
    expect(ecrContent).toMatch(/encryption_configuration\s*{[\s\S]*?encryption_type\s*=\s*"AES256"/);
  });

  test("creates ECR lifecycle policy", () => {
    expect(hasResource(ecrContent, "aws_ecr_lifecycle_policy", "app")).toBe(true);
  });
});

describe("Payment Processing Platform Infrastructure - S3 Resources", () => {
  let s3Content: string;
  let flowLogsS3Content: string;

  beforeAll(() => {
    s3Content = readFileContent(s3Path);
    flowLogsS3Content = readFileContent(vpcFlowLogsPath);
  });

  test("creates S3 bucket for ALB logs", () => {
    expect(hasResource(s3Content, "aws_s3_bucket", "alb_logs")).toBe(true);
  });

  test("configures ALB logs bucket versioning", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_versioning", "alb_logs")).toBe(true);
    expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures ALB logs bucket encryption", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_server_side_encryption_configuration", "alb_logs")).toBe(true);
    expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("configures ALB logs bucket public access block", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_public_access_block", "alb_logs")).toBe(true);
    expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("creates S3 bucket for VPC Flow Logs", () => {
    expect(hasResource(flowLogsS3Content, "aws_s3_bucket", "vpc_flow_logs")).toBe(true);
  });

  test("configures VPC Flow Logs bucket versioning", () => {
    expect(hasResource(flowLogsS3Content, "aws_s3_bucket_versioning", "vpc_flow_logs")).toBe(true);
  });

  test("configures VPC Flow Logs bucket encryption", () => {
    expect(hasResource(flowLogsS3Content, "aws_s3_bucket_server_side_encryption_configuration", "vpc_flow_logs")).toBe(true);
    expect(flowLogsS3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("configures VPC Flow Logs bucket public access block", () => {
    expect(hasResource(flowLogsS3Content, "aws_s3_bucket_public_access_block", "vpc_flow_logs")).toBe(true);
  });
});

describe("Payment Processing Platform Infrastructure - VPC Flow Logs", () => {
  let flowLogsContent: string;

  beforeAll(() => {
    flowLogsContent = readFileContent(vpcFlowLogsPath);
  });

  test("creates VPC Flow Logs conditionally", () => {
    expect(hasResource(flowLogsContent, "aws_flow_log", "main")).toBe(true);
    expect(flowLogsContent).toMatch(/count\s*=\s*var\.enable_vpc_flow_logs/);
  });

  test("VPC Flow Logs configured for S3 destination", () => {
    expect(flowLogsContent).toMatch(/log_destination_type\s*=\s*"s3"/);
    expect(flowLogsContent).toMatch(/log_destination\s*=\s*aws_s3_bucket\.vpc_flow_logs\.arn/);
  });

  test("VPC Flow Logs captures ALL traffic", () => {
    expect(flowLogsContent).toMatch(/traffic_type\s*=\s*"ALL"/);
  });

  test("VPC Flow Logs attached to main VPC", () => {
    expect(flowLogsContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });
});

describe("Payment Processing Platform Infrastructure - VPC Endpoints", () => {
  let endpointsContent: string;

  beforeAll(() => {
    endpointsContent = readFileContent(vpcEndpointsPath);
  });

  test("creates VPC endpoints for AWS services", () => {
    expect(hasResource(endpointsContent, "aws_vpc_endpoint", "s3")).toBe(true);
    expect(hasResource(endpointsContent, "aws_vpc_endpoint", "ecr_api")).toBe(true);
    expect(hasResource(endpointsContent, "aws_vpc_endpoint", "ecr_dkr")).toBe(true);
  });

  test("VPC endpoints use Gateway endpoint for S3", () => {
    expect(endpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"[\s\S]*?vpc_endpoint_type\s*=\s*"Gateway"/s);
  });

  test("VPC endpoints use Interface endpoint for ECR", () => {
    expect(endpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"[\s\S]*?vpc_endpoint_type\s*=\s*"Interface"/s);
  });

  test("VPC endpoints are in private subnets", () => {
    expect(endpointsContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("creates security group for VPC endpoints", () => {
    expect(hasResource(endpointsContent, "aws_security_group", "vpc_endpoints")).toBe(true);
  });
});

describe("Payment Processing Platform Infrastructure - CloudWatch Resources", () => {
  let cloudwatchContent: string;
  let ecsContent: string;

  beforeAll(() => {
    cloudwatchContent = readFileContent(cloudwatchPath);
    ecsContent = readFileContent(ecsPath);
  });

  test("creates CloudWatch dashboard", () => {
    expect(hasResource(cloudwatchContent, "aws_cloudwatch_dashboard", "main")).toBe(true);
  });

  test("creates CloudWatch log group for ECS", () => {
    expect(hasResource(ecsContent, "aws_cloudwatch_log_group", "ecs")).toBe(true);
  });

  test("CloudWatch log group has retention period", () => {
    const allCloudwatchContent = cloudwatchContent + ecsContent;
    expect(allCloudwatchContent).toMatch(/retention_in_days\s*=\s*\d+/);
  });
});

describe("Payment Processing Platform Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readFileContent(outputsPath);
  });

  test("exports VPC ID", () => {
    expect(hasOutput(outputsContent, "vpc_id")).toBe(true);
    expect(outputsContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
  });

  test("exports subnet IDs", () => {
    expect(hasOutput(outputsContent, "public_subnet_ids")).toBe(true);
    expect(hasOutput(outputsContent, "private_subnet_ids")).toBe(true);
    expect(hasOutput(outputsContent, "database_subnet_ids")).toBe(true);
  });

  test("exports ALB information", () => {
    expect(hasOutput(outputsContent, "alb_dns_name")).toBe(true);
    expect(hasOutput(outputsContent, "alb_zone_id")).toBe(true);
    expect(hasOutput(outputsContent, "alb_arn")).toBe(true);
  });

  test("exports ECS information", () => {
    expect(hasOutput(outputsContent, "ecs_cluster_name")).toBe(true);
    expect(hasOutput(outputsContent, "ecs_cluster_arn")).toBe(true);
    expect(hasOutput(outputsContent, "ecs_service_name")).toBe(true);
  });

  test("exports RDS information", () => {
    expect(hasOutput(outputsContent, "rds_cluster_endpoint")).toBe(true);
    expect(hasOutput(outputsContent, "rds_cluster_reader_endpoint")).toBe(true);
    expect(hasOutput(outputsContent, "rds_cluster_port")).toBe(true);
  });

  test("exports ECR information", () => {
    expect(hasOutput(outputsContent, "ecr_repository_url")).toBe(true);
    expect(hasOutput(outputsContent, "ecr_repository_arn")).toBe(true);
  });

  test("outputs have proper descriptions", () => {
    expect(outputsContent).toMatch(/description\s*=\s*"[^"]+"/);
  });
});

describe("Payment Processing Platform Infrastructure - Best Practices", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [
      VPC_FILE,
      ALB_FILE,
      ECS_FILE,
      RDS_FILE,
      ECR_FILE,
      S3_FILE,
      VPC_FLOW_LOGS_FILE,
      SECURITY_GROUPS_FILE,
    ];
    allContent = files.map((file) => readFileContent(path.resolve(__dirname, file))).join("\n");
  });

  test("uses versioning for S3 buckets", () => {
    const versioningResources = countResourceOccurrences(allContent, "aws_s3_bucket_versioning");
    expect(versioningResources).toBeGreaterThanOrEqual(2);
  });

  test("enables encryption for S3 buckets", () => {
    const encryptionResources = countResourceOccurrences(
      allContent,
      "aws_s3_bucket_server_side_encryption_configuration"
    );
    expect(encryptionResources).toBeGreaterThanOrEqual(2);
  });

  test("blocks public access on S3 buckets", () => {
    const publicAccessBlock = countResourceOccurrences(allContent, "aws_s3_bucket_public_access_block");
    expect(publicAccessBlock).toBeGreaterThanOrEqual(2);
  });

  test("enables ECR image scanning", () => {
    expect(allContent).toMatch(/scan_on_push\s*=\s*true/);
  });

  test("uses image tag mutability configuration in ECR", () => {
    expect(allContent).toMatch(/image_tag_mutability\s*=\s*"MUTABLE"/);
  });

  test("enables Container Insights for ECS cluster conditionally", () => {
    expect(allContent).toMatch(/containerInsights/);
  });

  test("uses Fargate for serverless ECS deployment", () => {
    expect(allContent).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
    expect(allContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
  });

  test("configures log retention periods", () => {
    const retentionConfigs = (allContent.match(/retention_in_days\s*=\s*\d+/g) || []).length;
    expect(retentionConfigs).toBeGreaterThanOrEqual(1);
  });
});

describe("Payment Processing Platform Infrastructure - Security Best Practices", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [
      VPC_FILE,
      ALB_FILE,
      ECS_FILE,
      RDS_FILE,
      ECR_FILE,
      SECURITY_GROUPS_FILE,
    ];
    allContent = files.map((file) => readFileContent(path.resolve(__dirname, file))).join("\n");
  });

  test("ECS tasks run in private subnets", () => {
    expect(allContent).toMatch(/assign_public_ip\s*=\s*false/);
    expect(allContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("RDS database is in database subnets", () => {
    expect(allContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    expect(allContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
  });

  test("ECS security group allows ingress from ALB only", () => {
    expect(allContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("RDS security group allows ingress from ECS tasks only", () => {
    expect(allContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ecs_tasks\.id\]/);
  });

  test("ECR repository uses encryption", () => {
    expect(allContent).toMatch(/encryption_configuration\s*{[\s\S]*?encryption_type\s*=\s*"AES256"/);
  });

  test("RDS cluster uses encryption", () => {
    expect(allContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(allContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });
});

describe("Payment Processing Platform Infrastructure - Coverage Summary", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [
      VPC_FILE,
      ALB_FILE,
      ECS_FILE,
      RDS_FILE,
      ECR_FILE,
      S3_FILE,
      SECURITY_GROUPS_FILE,
      CLOUDWATCH_FILE,
      VPC_FLOW_LOGS_FILE,
      VPC_ENDPOINTS_FILE,
      ECS_AUTOSCALING_FILE,
    ];
    allContent = files.map((file) => readFileContent(path.resolve(__dirname, file))).join("\n");
  });

  test("implements complete infrastructure stack", () => {
    expect(hasResource(allContent, "aws_vpc", "main")).toBe(true);
    expect(hasResource(allContent, "aws_lb", "main")).toBe(true);
    expect(hasResource(allContent, "aws_ecs_cluster", "main")).toBe(true);
    expect(hasResource(allContent, "aws_ecs_service", "app")).toBe(true);
    expect(hasResource(allContent, "aws_rds_cluster", "main")).toBe(true);
    expect(hasResource(allContent, "aws_ecr_repository", "app")).toBe(true);
  });

  test("implements autoscaling for ECS", () => {
    expect(hasResource(allContent, "aws_appautoscaling_target", "ecs")).toBe(true);
    expect(hasResource(allContent, "aws_appautoscaling_policy", "ecs_cpu")).toBe(true);
  });

  test("implements VPC endpoints for private connectivity", () => {
    expect(hasResource(allContent, "aws_vpc_endpoint", "s3")).toBe(true);
    expect(hasResource(allContent, "aws_vpc_endpoint", "ecr_api")).toBe(true);
  });

  test("implements monitoring and logging", () => {
    expect(hasResource(allContent, "aws_cloudwatch_log_group", "ecs")).toBe(true);
    expect(hasResource(allContent, "aws_flow_log", "main")).toBe(true);
    expect(hasResource(allContent, "aws_cloudwatch_dashboard", "main")).toBe(true);
  });
});

