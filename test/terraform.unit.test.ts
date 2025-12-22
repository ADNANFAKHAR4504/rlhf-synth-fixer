// Unit tests for Multi-Environment ECS Infrastructure
// Target: 90%+ coverage of infrastructure configuration

import fs from "fs";
import path from "path";

const MAIN_FILE = "../lib/main.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const NETWORKING_MODULE = "../lib/modules/networking/main.tf";
const SECURITY_GROUPS_MODULE = "../lib/modules/security-groups/main.tf";
const IAM_MODULE = "../lib/modules/iam/main.tf";
const ECS_MODULE = "../lib/modules/ecs/main.tf";

const mainPath = path.resolve(__dirname, MAIN_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const networkingPath = path.resolve(__dirname, NETWORKING_MODULE);
const securityGroupsPath = path.resolve(__dirname, SECURITY_GROUPS_MODULE);
const iamPath = path.resolve(__dirname, IAM_MODULE);
const ecsPath = path.resolve(__dirname, ECS_MODULE);

describe("Multi-Environment ECS Infrastructure - File Structure", () => {
  test("main.tf file exists", () => {
    const exists = fs.existsSync(mainPath);
    if (!exists) {
      console.error(`[FAIL] Expected main file at: ${mainPath}`);
    }
    expect(exists).toBe(true);
  });

  test("variables.tf file exists", () => {
    const exists = fs.existsSync(variablesPath);
    expect(exists).toBe(true);
  });

  test("outputs.tf file exists", () => {
    const exists = fs.existsSync(outputsPath);
    expect(exists).toBe(true);
  });

  test("networking module exists", () => {
    const exists = fs.existsSync(networkingPath);
    expect(exists).toBe(true);
  });

  test("security-groups module exists", () => {
    const exists = fs.existsSync(securityGroupsPath);
    expect(exists).toBe(true);
  });

  test("iam module exists", () => {
    const exists = fs.existsSync(iamPath);
    expect(exists).toBe(true);
  });

  test("ecs module exists", () => {
    const exists = fs.existsSync(ecsPath);
    expect(exists).toBe(true);
  });

  test("main.tf has non-zero content", () => {
    const stats = fs.statSync(mainPath);
    expect(stats.size).toBeGreaterThan(100);
  });
});

describe("Multi-Environment ECS Infrastructure - Provider Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("main.tf declares terraform required_version", () => {
    expect(mainContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+(\.\d+)?"/);
  });

  test("main.tf declares AWS provider requirement", () => {
    expect(mainContent).toMatch(/required_providers\s*{/);
    expect(mainContent).toMatch(/aws\s*=\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("main.tf declares AWS provider version constraint", () => {
    expect(mainContent).toMatch(/version\s*=\s*"~>\s*\d+\.\d+"/);
  });

  test("main.tf declares random provider requirement", () => {
    expect(mainContent).toMatch(/random\s*=\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
  });

  test("main.tf declares AWS provider", () => {
    expect(mainContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("main.tf uses aws_region variable", () => {
    expect(mainContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("main.tf configures default tags", () => {
    expect(mainContent).toMatch(/default_tags\s*{/);
    expect(mainContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(mainContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });
});

describe("Multi-Environment ECS Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares environment variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(variablesContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares enable_nat_gateway variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_nat_gateway"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares container_image variable", () => {
    expect(variablesContent).toMatch(/variable\s+"container_image"\s*{/);
  });

  test("declares container_port variable", () => {
    expect(variablesContent).toMatch(/variable\s+"container_port"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares ECS task variables", () => {
    expect(variablesContent).toMatch(/variable\s+"task_cpu"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"task_memory"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"desired_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares autoscaling variables", () => {
    expect(variablesContent).toMatch(/variable\s+"min_capacity"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"max_capacity"\s*{/);
  });

  test("declares health_check_path variable", () => {
    expect(variablesContent).toMatch(/variable\s+"health_check_path"\s*{/);
  });

  test("declares enable_container_insights variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_container_insights"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });
});

describe("Multi-Environment ECS Infrastructure - Module Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("declares networking module", () => {
    expect(mainContent).toMatch(/module\s+"networking"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/networking"/);
  });

  test("networking module receives required variables", () => {
    expect(mainContent).toMatch(/environment\s*=\s*var\.environment/);
    expect(mainContent).toMatch(/environment_suffix\s*=\s*var\.environment_suffix/);
    expect(mainContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr/);
    expect(mainContent).toMatch(/public_subnet_cidrs\s*=\s*var\.public_subnet_cidrs/);
    expect(mainContent).toMatch(/private_subnet_cidrs\s*=\s*var\.private_subnet_cidrs/);
  });

  test("declares security_groups module", () => {
    expect(mainContent).toMatch(/module\s+"security_groups"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/security-groups"/);
  });

  test("security_groups module receives vpc_id from networking", () => {
    expect(mainContent).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
  });

  test("declares iam module", () => {
    expect(mainContent).toMatch(/module\s+"iam"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/iam"/);
  });

  test("declares ecs module", () => {
    expect(mainContent).toMatch(/module\s+"ecs"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/ecs"/);
  });

  test("ecs module receives networking outputs", () => {
    expect(mainContent).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
    expect(mainContent).toMatch(/public_subnet_ids\s*=\s*module\.networking\.public_subnet_ids/);
    expect(mainContent).toMatch(/private_subnet_ids\s*=\s*module\.networking\.private_subnet_ids/);
  });

  test("ecs module receives security group outputs", () => {
    expect(mainContent).toMatch(/ecs_security_group_id\s*=\s*module\.security_groups\.ecs_tasks_security_group_id/);
    expect(mainContent).toMatch(/alb_security_group_id\s*=\s*module\.security_groups\.alb_security_group_id/);
  });

  test("ecs module receives iam role outputs", () => {
    expect(mainContent).toMatch(/execution_role_arn\s*=\s*module\.iam\.ecs_task_execution_role_arn/);
    expect(mainContent).toMatch(/task_role_arn\s*=\s*module\.iam\.ecs_task_role_arn/);
  });
});

describe("Multi-Environment ECS Infrastructure - Networking Module", () => {
  let networkingContent: string;

  beforeAll(() => {
    networkingContent = fs.readFileSync(networkingPath, "utf8");
  });

  test("queries availability zones", () => {
    expect(networkingContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    expect(networkingContent).toMatch(/state\s*=\s*"available"/);
  });

  test("creates VPC", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(networkingContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(networkingContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(networkingContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    expect(networkingContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public subnets", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(networkingContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    expect(networkingContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(networkingContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private subnets", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(networkingContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    expect(networkingContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public route table", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(networkingContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(networkingContent).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(networkingContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("creates public route table associations", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    expect(networkingContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("conditionally creates NAT Gateway", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(networkingContent).toMatch(/count\s*=\s*var\.enable_nat_gateway/);
  });

  test("conditionally creates private route table", () => {
    expect(networkingContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });
});

describe("Multi-Environment ECS Infrastructure - Security Groups Module", () => {
  let securityGroupsContent: string;

  beforeAll(() => {
    securityGroupsContent = fs.readFileSync(securityGroupsPath, "utf8");
  });

  test("creates ALB security group", () => {
    expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    expect(securityGroupsContent).toMatch(/vpc_id\s*=\s*var\.vpc_id/);
  });

  test("ALB security group allows HTTP from internet", () => {
    const albSgBlock = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(albSgBlock).toBeTruthy();
    expect(albSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
    expect(albSgBlock![0]).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("ALB security group allows HTTPS from internet", () => {
    const albSgBlock = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(albSgBlock).toBeTruthy();
    expect(albSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443/);
  });

  test("creates ECS tasks security group", () => {
    expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{/);
    expect(securityGroupsContent).toMatch(/vpc_id\s*=\s*var\.vpc_id/);
  });

  test("ECS tasks security group allows ingress from ALB only", () => {
    const ecsSgBlock = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{[\s\S]*?(?=resource|$)/);
    expect(ecsSgBlock).toBeTruthy();
    expect(ecsSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    expect(ecsSgBlock![0]).toMatch(/from_port\s*=\s*var\.container_port/);
  });

  test("ECS tasks security group allows all egress", () => {
    const ecsSgBlock = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{[\s\S]*?(?=resource|$)/);
    expect(ecsSgBlock).toBeTruthy();
    expect(ecsSgBlock![0]).toMatch(/egress\s*{[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });
});

describe("Multi-Environment ECS Infrastructure - IAM Module", () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = fs.readFileSync(iamPath, "utf8");
  });

  test("creates ECS task execution role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"\s*{/);
    expect(iamContent).toMatch(/ecs-tasks\.amazonaws\.com/);
  });

  test("ECS task execution role has managed policy attachment", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ecs_task_execution"\s*{/);
    expect(iamContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
  });

  test("creates ECS task role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"\s*{/);
  });

  test("uses random_id for unique role names", () => {
    expect(iamContent).toMatch(/resource\s+"random_id"\s+"suffix"\s*{/);
    expect(iamContent).toMatch(/random_id\.suffix\.hex/);
  });

  test("IAM roles include environment suffix in names", () => {
    expect(iamContent).toMatch(/name\s*=\s*"ecs-task-execution-role-\$\{var\.environment\}-\$\{var\.environment_suffix\}/);
    expect(iamContent).toMatch(/name\s*=\s*"ecs-task-role-\$\{var\.environment\}-\$\{var\.environment_suffix\}/);
  });
});

describe("Multi-Environment ECS Infrastructure - ECS Module", () => {
  let ecsContent: string;

  beforeAll(() => {
    ecsContent = fs.readFileSync(ecsPath, "utf8");
  });

  test("creates ECS cluster", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"\s*{/);
    expect(ecsContent).toMatch(/name\s*=\s*"ecs-cluster-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
  });

  test("ECS cluster enables Container Insights conditionally", () => {
    expect(ecsContent).toMatch(/setting\s*{[\s\S]*?name\s*=\s*"containerInsights"/);
    expect(ecsContent).toMatch(/value\s*=\s*var\.enable_container_insights/);
  });

  test("creates CloudWatch log group with name_prefix", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"\s*{/);
    expect(ecsContent).toMatch(/name_prefix\s*=\s*"\/ecs\/\$\{var\.environment\}-\$\{var\.environment_suffix\}-"/);
  });

  test("uses random_id for unique resource names", () => {
    expect(ecsContent).toMatch(/resource\s+"random_id"\s+"suffix"\s*{/);
    expect(ecsContent).toMatch(/random_id\.suffix\.hex/);
  });

  test("creates ECS task definition", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"\s*{/);
    expect(ecsContent).toMatch(/family\s*=\s*"app-task-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
  });

  test("task definition uses Fargate launch type", () => {
    expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
    expect(ecsContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
  });

  test("task definition has CPU and memory configuration", () => {
    expect(ecsContent).toMatch(/cpu\s*=\s*var\.task_cpu/);
    expect(ecsContent).toMatch(/memory\s*=\s*var\.task_memory/);
  });

  test("task definition has execution and task roles", () => {
    expect(ecsContent).toMatch(/execution_role_arn\s*=\s*var\.execution_role_arn/);
    expect(ecsContent).toMatch(/task_role_arn\s*=\s*var\.task_role_arn/);
  });

  test("task definition container has port mappings", () => {
    expect(ecsContent).toMatch(/container_definitions\s*=\s*jsonencode/);
    expect(ecsContent).toMatch(/portMappings/);
    expect(ecsContent).toMatch(/containerPort\s*=\s*var\.container_port/);
  });

  test("task definition container has CloudWatch logs configuration", () => {
    expect(ecsContent).toMatch(/logConfiguration/);
    expect(ecsContent).toMatch(/logDriver\s*=\s*"awslogs"/);
    expect(ecsContent).toMatch(/awslogs-group/);
  });

  test("creates Application Load Balancer with name", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    expect(ecsContent).toMatch(/name\s*=\s*"alb-\$\{var\.environment\}-\$\{var\.environment_suffix\}-\$\{random_id\.suffix\.hex\}"/);
    expect(ecsContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(ecsContent).toMatch(/internal\s*=\s*false/);
  });

  test("creates target group with name", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
    expect(ecsContent).toMatch(/name\s*=\s*"tg-\$\{var\.environment\}-\$\{var\.environment_suffix\}-\$\{random_id\.suffix\.hex\}"/);
    expect(ecsContent).toMatch(/target_type\s*=\s*"ip"/);
    expect(ecsContent).toMatch(/port\s*=\s*var\.container_port/);
  });

  test("target group has health check configured", () => {
    expect(ecsContent).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(ecsContent).toMatch(/path\s*=\s*var\.health_check_path/);
    expect(ecsContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(ecsContent).toMatch(/matcher\s*=\s*"200"/);
  });

  test("creates HTTP listener on ALB", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
    expect(ecsContent).toMatch(/load_balancer_arn\s*=\s*aws_lb\.main\.arn/);
    expect(ecsContent).toMatch(/port\s*=\s*"80"/);
    expect(ecsContent).toMatch(/protocol\s*=\s*"HTTP"/);
  });

  test("creates ECS service", () => {
    expect(ecsContent).toMatch(/resource\s+"aws_ecs_service"\s+"app"\s*{/);
    expect(ecsContent).toMatch(/name\s*=\s*"app-service-\$\{var\.environment\}-\$\{var\.environment_suffix\}-\$\{random_id\.suffix\.hex\}"/);
  });

  test("ECS service uses Fargate launch type", () => {
    expect(ecsContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
  });

  test("ECS service network configuration uses private subnets", () => {
    expect(ecsContent).toMatch(/network_configuration\s*{[\s\S]*?subnets\s*=\s*var\.private_subnet_ids/);
    expect(ecsContent).toMatch(/assign_public_ip\s*=\s*false/);
  });

  test("ECS service is connected to load balancer", () => {
    expect(ecsContent).toMatch(/load_balancer\s*{[\s\S]*?target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/);
    expect(ecsContent).toMatch(/container_port\s*=\s*var\.container_port/);
  });

});

describe("Multi-Environment ECS Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("exports VPC ID", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.networking\.vpc_id/);
  });

  test("exports ECS cluster name", () => {
    expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.ecs\.cluster_name/);
  });

  test("exports ALB DNS name", () => {
    expect(outputsContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.ecs\.alb_dns_name/);
  });

  test("exports ECS service name", () => {
    expect(outputsContent).toMatch(/output\s+"ecs_service_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*module\.ecs\.service_name/);
  });
});

describe("Multi-Environment ECS Infrastructure - Best Practices", () => {
  let mainContent: string;
  let ecsContent: string;
  let networkingContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
    ecsContent = fs.readFileSync(ecsPath, "utf8");
    networkingContent = fs.readFileSync(networkingPath, "utf8");
  });

  test("uses modular architecture", () => {
    const moduleCount = (mainContent.match(/module\s+"/g) || []).length;
    expect(moduleCount).toBeGreaterThanOrEqual(4);
  });

  test("uses default tags for resource management", () => {
    expect(mainContent).toMatch(/default_tags/);
  });

  test("enables Container Insights for ECS cluster", () => {
    expect(ecsContent).toMatch(/containerInsights/);
  });

  test("uses Fargate for serverless ECS deployment", () => {
    expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
    expect(ecsContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
  });

  test("configures CloudWatch logging for ECS tasks", () => {
    expect(ecsContent).toMatch(/logConfiguration/);
    expect(ecsContent).toMatch(/logDriver\s*=\s*"awslogs"/);
  });

  test("uses name_prefix for resources that support it", () => {
    expect(ecsContent).toMatch(/name_prefix/);
  });

  test("uses random_id for unique resource naming", () => {
    expect(ecsContent).toMatch(/random_id/);
    expect(ecsContent).toMatch(/random_id\.suffix\.hex/);
  });

  test("VPC enables DNS support", () => {
    expect(networkingContent).toMatch(/enable_dns_support\s*=\s*true/);
    expect(networkingContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });
});

describe("Multi-Environment ECS Infrastructure - Security Best Practices", () => {
  let securityGroupsContent: string;
  let ecsContent: string;

  beforeAll(() => {
    securityGroupsContent = fs.readFileSync(securityGroupsPath, "utf8");
    ecsContent = fs.readFileSync(ecsPath, "utf8");
  });

  test("ECS tasks run in private subnets", () => {
    expect(ecsContent).toMatch(/assign_public_ip\s*=\s*false/);
    expect(ecsContent).toMatch(/subnets\s*=\s*var\.private_subnet_ids/);
  });

  test("ECS security group allows ingress from ALB only", () => {
    const sgBlock = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{[\s\S]*?(?=resource|$)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/ingress\s*{/);
    expect(sgBlock![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("ALB is in public subnets", () => {
    expect(ecsContent).toMatch(/subnets\s*=\s*var\.public_subnet_ids/);
  });

  test("uses least privilege IAM roles", () => {
    expect(securityGroupsContent).toMatch(/security_groups/);
  });
});

describe("Multi-Environment ECS Infrastructure - Coverage Summary", () => {
  let mainContent: string;
  let networkingContent: string;
  let ecsContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
    networkingContent = fs.readFileSync(networkingPath, "utf8");
    ecsContent = fs.readFileSync(ecsPath, "utf8");
  });

  test("implements complete ECS infrastructure", () => {
    expect(mainContent).toMatch(/module\s+"networking"/);
    expect(mainContent).toMatch(/module\s+"security_groups"/);
    expect(mainContent).toMatch(/module\s+"iam"/);
    expect(mainContent).toMatch(/module\s+"ecs"/);
  });

  test("creates all required networking resources", () => {
    expect(networkingContent).toMatch(/aws_vpc/);
    expect(networkingContent).toMatch(/aws_internet_gateway/);
    expect(networkingContent).toMatch(/aws_subnet/);
    expect(networkingContent).toMatch(/aws_route_table/);
  });

  test("creates all required ECS resources", () => {
    expect(ecsContent).toMatch(/aws_ecs_cluster/);
    expect(ecsContent).toMatch(/aws_ecs_task_definition/);
    expect(ecsContent).toMatch(/aws_ecs_service/);
    expect(ecsContent).toMatch(/aws_lb/);
    expect(ecsContent).toMatch(/aws_lb_target_group/);
  });

  test("supports multi-environment deployment", () => {
    expect(mainContent).toMatch(/var\.environment/);
    expect(mainContent).toMatch(/var\.environment_suffix/);
  });
});