// Unit tests for CI/CD Pipeline Terraform infrastructure
// Target: 90%+ coverage of CI/CD pipeline infrastructure

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const PIPELINE_FILES_DIR = "../lib/pipeline_files";

const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const pipelineFilesPath = path.resolve(__dirname, PIPELINE_FILES_DIR);

describe("CI/CD Pipeline Infrastructure - File Structure", () => {
  test("tap_stack.tf file exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[FAIL] Expected stack file at: ${stackPath}`);
    }
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

  test("pipeline_files directory exists", () => {
    const exists = fs.existsSync(pipelineFilesPath);
    expect(exists).toBe(true);
  });

  test("tap_stack.tf has non-zero content", () => {
    const stats = fs.statSync(stackPath);
    expect(stats.size).toBeGreaterThan(100);
  });

  test("pipeline_files directory contains Dockerfile", () => {
    const dockerfilePath = path.join(pipelineFilesPath, "Dockerfile");
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  test("pipeline_files directory contains docker_install.sh", () => {
    const scriptPath = path.join(pipelineFilesPath, "docker_install.sh");
    expect(fs.existsSync(scriptPath)).toBe(true);
  });
});

describe("CI/CD Pipeline Infrastructure - Provider Configuration", () => {
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
    expect(providerContent).toMatch(/version\s*=\s*">=\s*\d+\.\d+"/);
  });

  test("provider.tf configures S3 backend", () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf configures default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
  });
});

describe("CI/CD Pipeline Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares environment variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares source_bucket_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"source_bucket_name"\s*{/);
  });

  test("declares source_key_prefix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"source_key_prefix"\s*{/);
  });

  test("declares notification_emails variable", () => {
    expect(variablesContent).toMatch(/variable\s+"notification_emails"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares ECS resource variables", () => {
    expect(variablesContent).toMatch(/variable\s+"ecs_cpu"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"ecs_memory"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"ecs_desired_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares container_port variable", () => {
    expect(variablesContent).toMatch(/variable\s+"container_port"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares image_tag variable", () => {
    expect(variablesContent).toMatch(/variable\s+"image_tag"\s*{/);
  });
});

describe("CI/CD Pipeline Infrastructure - VPC Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("queries availability zones", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    expect(stackContent).toMatch(/state\s*=\s*"available"/);
  });

  test("creates VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*8,\s*count\.index\)/);
    expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates Elastic IP for NAT Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    // Verify no count (single EIP, not multiple)
    const eipBlock = stackContent.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?(?=resource|$)/);
    expect(eipBlock).toBeTruthy();
    expect(eipBlock![0]).not.toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("creates NAT Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    // Verify no count (single NAT Gateway, not multiple)
    const natBlock = stackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?(?=resource|$)/);
    expect(natBlock).toBeTruthy();
    expect(natBlock![0]).not.toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\.id/);
    expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
  });

  test("creates private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*8,\s*count\.index\s*\+\s*10\)/);
  });

  test("creates public route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(stackContent).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("creates public route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("creates private route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    // Verify no count (single route table, shared by both private subnets)
    const rtBlock = stackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?(?=resource|$)/);
    expect(rtBlock).toBeTruthy();
    expect(rtBlock![0]).not.toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/route\s*{[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id/);
  });

  test("creates private route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
    expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
  });
});

describe("CI/CD Pipeline Infrastructure - S3 Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates source S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"source"\s*{/);
    expect(stackContent).toMatch(/bucket\s*=\s*"\$\{var\.source_bucket_name\}-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
  });

  test("configures source bucket versioning", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"source"\s*{/);
    expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures source bucket encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"source"\s*{/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("configures source bucket public access block", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"source"\s*{/);
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("creates artifacts S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"artifacts"\s*{/);
    expect(stackContent).toMatch(/bucket\s*=\s*"\$\{var\.project_name\}-artifacts-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
  });

  test("configures artifacts bucket versioning", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"artifacts"\s*{/);
  });

  test("configures artifacts bucket encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"artifacts"\s*{/);
  });

  test("creates archive_file for pipeline files", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"docker_build_zip"\s*{/);
    expect(stackContent).toMatch(/type\s*=\s*"zip"/);
    expect(stackContent).toMatch(/source_dir\s*=\s*"pipeline_files\/"/);
  });

  test("uploads pipeline files to source bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_object"\s+"pipeline_files"\s*{/);
    expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.source\.bucket/);
  });

  test("enables EventBridge notifications on source bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"source"\s*{/);
    expect(stackContent).toMatch(/eventbridge\s*=\s*true/);
  });
});

describe("CI/CD Pipeline Infrastructure - ECR Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates ECR repository", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"app"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*var\.project_name/);
  });

  test("configures ECR repository immutability", () => {
    expect(stackContent).toMatch(/image_tag_mutability\s*=\s*"IMMUTABLE"/);
  });

  test("enables image scanning on push", () => {
    expect(stackContent).toMatch(/image_scanning_configuration\s*{/);
    expect(stackContent).toMatch(/scan_on_push\s*=\s*true/);
  });

  test("configures ECR encryption", () => {
    expect(stackContent).toMatch(/encryption_configuration\s*{/);
    expect(stackContent).toMatch(/encryption_type\s*=\s*"AES256"/);
  });

  test("creates ECR lifecycle policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"app"\s*{/);
    expect(stackContent).toMatch(/rulePriority\s*=\s*1/);
    expect(stackContent).toMatch(/countType\s*=\s*"imageCountMoreThan"/);
    expect(stackContent).toMatch(/countNumber\s*=\s*10/);
  });
});

describe("CI/CD Pipeline Infrastructure - CodeBuild Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CodeBuild project", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codebuild_project"\s+"docker_build"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-build"/);
  });

  test("CodeBuild project has service role", () => {
    expect(stackContent).toMatch(/service_role\s*=\s*aws_iam_role\.codebuild\.arn/);
  });

  test("CodeBuild uses CODEPIPELINE artifacts", () => {
    expect(stackContent).toMatch(/artifacts\s*{[\s\S]*?type\s*=\s*"CODEPIPELINE"/);
  });

  test("CodeBuild environment has privileged mode enabled", () => {
    expect(stackContent).toMatch(/environment\s*{[\s\S]*?privileged_mode\s*=\s*true/);
  });

  test("CodeBuild uses standard:7.0 image", () => {
    expect(stackContent).toMatch(/image\s*=\s*"aws\/codebuild\/standard:7\.0"/);
  });

  test("CodeBuild has ECR_REPO_URI environment variable", () => {
    expect(stackContent).toMatch(/environment_variable\s*{[\s\S]*?name\s*=\s*"ECR_REPO_URI"/);
    expect(stackContent).toMatch(/value\s*=\s*aws_ecr_repository\.app\.repository_url/);
  });

  test("CodeBuild source uses CODEPIPELINE type", () => {
    expect(stackContent).toMatch(/source\s*{[\s\S]*?type\s*=\s*"CODEPIPELINE"/);
  });

  test("CodeBuild buildspec contains Docker build commands", () => {
    expect(stackContent).toMatch(/buildspec\s*=\s*<<-EOF/);
    expect(stackContent).toMatch(/docker build/);
    expect(stackContent).toMatch(/docker push/);
    expect(stackContent).toMatch(/docker login/);
  });

  test("CodeBuild buildspec creates imagedefinitions.json", () => {
    expect(stackContent).toMatch(/imagedefinitions\.json/);
  });

  test("CodeBuild logs to CloudWatch", () => {
    expect(stackContent).toMatch(/logs_config\s*{[\s\S]*?cloudwatch_logs/);
  });
});

describe("CI/CD Pipeline Infrastructure - CodePipeline Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CodePipeline", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codepipeline"\s+"main"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*var\.project_name/);
  });

  test("CodePipeline has IAM role", () => {
    expect(stackContent).toMatch(/role_arn\s*=\s*aws_iam_role\.codepipeline\.arn/);
  });

  test("CodePipeline artifact store uses artifacts bucket", () => {
    expect(stackContent).toMatch(/artifact_store\s*{[\s\S]*?location\s*=\s*aws_s3_bucket\.artifacts\.bucket/);
  });

  test("CodePipeline has Source stage with S3 action", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Source"/);
    expect(stackContent).toMatch(/category\s*=\s*"Source"/);
    expect(stackContent).toMatch(/owner\s*=\s*"AWS"/);
    expect(stackContent).toMatch(/provider\s*=\s*"S3"/);
    expect(stackContent).toMatch(/S3Bucket\s*=\s*aws_s3_bucket\.source\.bucket/);
  });

  test("CodePipeline has Build stage with CodeBuild action", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Build"/);
    expect(stackContent).toMatch(/category\s*=\s*"Build"/);
    expect(stackContent).toMatch(/provider\s*=\s*"CodeBuild"/);
    expect(stackContent).toMatch(/ProjectName\s*=\s*aws_codebuild_project\.docker_build\.name/);
  });

  test("CodePipeline has Deploy stage with ECS action", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Deploy"/);
    expect(stackContent).toMatch(/category\s*=\s*"Deploy"/);
    expect(stackContent).toMatch(/provider\s*=\s*"ECS"/);
    expect(stackContent).toMatch(/ClusterName\s*=\s*aws_ecs_cluster\.main\.name/);
    expect(stackContent).toMatch(/ServiceName\s*=\s*aws_ecs_service\.app\.name/);
    expect(stackContent).toMatch(/FileName\s*=\s*"imagedefinitions\.json"/);
  });
});

describe("CI/CD Pipeline Infrastructure - ALB Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates ALB security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("ALB security group allows HTTP from internet", () => {
    const albSgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(albSgBlock).toBeTruthy();
    expect(albSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
    expect(albSgBlock![0]).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("ALB security group allows HTTPS from internet", () => {
    const albSgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource|$)/);
    expect(albSgBlock).toBeTruthy();
    expect(albSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443/);
  });

  test("creates Application Load Balancer in public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(stackContent).toMatch(/internal\s*=\s*false/);
    expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("ALB enables HTTP/2 and cross-zone load balancing", () => {
    expect(stackContent).toMatch(/enable_http2\s*=\s*true/);
    expect(stackContent).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
  });

  test("creates target group for ECS tasks", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
    expect(stackContent).toMatch(/target_type\s*=\s*"ip"/);
    expect(stackContent).toMatch(/port\s*=\s*var\.container_port/);
    expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("target group has health check configured", () => {
    expect(stackContent).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(stackContent).toMatch(/path\s*=/);
    expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
  });

  test("creates HTTP listener on ALB", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
    expect(stackContent).toMatch(/load_balancer_arn\s*=\s*aws_lb\.main\.arn/);
    expect(stackContent).toMatch(/port\s*=\s*"80"/);
    expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    expect(stackContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/);
  });
});

describe("CI/CD Pipeline Infrastructure - ECS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates ECS cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*var\.project_name/);
  });

  test("ECS cluster enables Container Insights", () => {
    expect(stackContent).toMatch(/setting\s*{[\s\S]*?name\s*=\s*"containerInsights"/);
    expect(stackContent).toMatch(/value\s*=\s*"enabled"/);
  });

  test("creates ECS task definition", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"\s*{/);
    expect(stackContent).toMatch(/family\s*=\s*var\.project_name/);
  });

  test("task definition uses Fargate launch type", () => {
    expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
    expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
  });

  test("task definition has CPU and memory configuration", () => {
    expect(stackContent).toMatch(/cpu\s*=\s*var\.ecs_cpu/);
    expect(stackContent).toMatch(/memory\s*=\s*var\.ecs_memory/);
  });

  test("task definition has execution and task roles", () => {
    expect(stackContent).toMatch(/execution_role_arn\s*=\s*aws_iam_role\.ecs_task_execution\.arn/);
    expect(stackContent).toMatch(/task_role_arn\s*=\s*aws_iam_role\.ecs_task\.arn/);
  });

  test("task definition container has port mappings", () => {
    expect(stackContent).toMatch(/container_definitions\s*=\s*jsonencode/);
    expect(stackContent).toMatch(/portMappings/);
    expect(stackContent).toMatch(/containerPort\s*=\s*var\.container_port/);
  });

  test("task definition container has CloudWatch logs configuration", () => {
    expect(stackContent).toMatch(/logConfiguration/);
    expect(stackContent).toMatch(/logDriver\s*=\s*"awslogs"/);
    expect(stackContent).toMatch(/awslogs-group/);
  });

  test("creates ECS service", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"app"\s*{/);
    expect(stackContent).not.toMatch(/resource\s+"aws_ecs_service"\s+"app"\s*{[\s\S]*?count\s*=\s*length\(var\.private_subnet_ids\)/);
  });

  test("ECS service uses Fargate launch type", () => {
    expect(stackContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
  });

  test("ECS service has deployment configuration", () => {
    expect(stackContent).toMatch(/deployment_minimum_healthy_percent\s*=\s*100/);
    expect(stackContent).toMatch(/deployment_maximum_percent\s*=\s*200/);
  });

  test("ECS service network configuration uses private subnets", () => {
    expect(stackContent).toMatch(/network_configuration\s*{[\s\S]*?subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
    expect(stackContent).toMatch(/assign_public_ip\s*=\s*false/);
  });

  test("ECS service is connected to load balancer", () => {
    expect(stackContent).toMatch(/load_balancer\s*{[\s\S]*?target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/);
    expect(stackContent).toMatch(/container_name\s*=\s*"app"/);
    expect(stackContent).toMatch(/container_port\s*=\s*var\.container_port/);
  });

  test("ECS service ignores task definition changes from pipeline", () => {
    expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*?ignore_changes\s*=\s*\[task_definition\]/);
  });

  test("creates ECS task security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    expect(stackContent).not.toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{[\s\S]*?count\s*=\s*var\.vpc_id/);
    expect(stackContent).toMatch(/egress\s*{[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
  });

  test("ECS task security group allows ingress from ALB only", () => {
    const ecsSgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{[\s\S]*?(?=resource|$)/);
    expect(ecsSgBlock).toBeTruthy();
    expect(ecsSgBlock![0]).toMatch(/ingress\s*{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    expect(ecsSgBlock![0]).toMatch(/from_port\s*=\s*var\.container_port/);
  });
});

describe("CI/CD Pipeline Infrastructure - IAM Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CodePipeline IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-codepipeline-role"/);
  });

  test("CodePipeline role has assume role policy for codepipeline service", () => {
    expect(stackContent).toMatch(/codepipeline\.amazonaws\.com/);
  });

  test("CodePipeline role policy allows S3 access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"codepipeline"\s*{/);
    expect(stackContent).toMatch(/s3:GetObject/);
    expect(stackContent).toMatch(/s3:PutObject/);
  });

  test("CodePipeline role policy allows CodeBuild actions", () => {
    expect(stackContent).toMatch(/codebuild:StartBuild/);
    expect(stackContent).toMatch(/codebuild:BatchGetBuilds/);
  });

  test("CodePipeline role policy allows ECS deployment actions", () => {
    expect(stackContent).toMatch(/ecs:UpdateService/);
    expect(stackContent).toMatch(/ecs:RegisterTaskDefinition/);
    expect(stackContent).toMatch(/iam:PassRole/);
  });

  test("creates CodeBuild IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"codebuild"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-codebuild-role"/);
  });

  test("CodeBuild role has assume role policy for codebuild service", () => {
    expect(stackContent).toMatch(/codebuild\.amazonaws\.com/);
  });

  test("CodeBuild role policy allows CloudWatch Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"codebuild"\s*{/);
    expect(stackContent).toMatch(/logs:CreateLogStream/);
    expect(stackContent).toMatch(/logs:PutLogEvents/);
  });

  test("CodeBuild role policy allows ECR push permissions", () => {
    expect(stackContent).toMatch(/ecr:GetAuthorizationToken/);
    expect(stackContent).toMatch(/ecr:PutImage/);
    expect(stackContent).toMatch(/ecr:CompleteLayerUpload/);
  });

  test("creates ECS task execution role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"\s*{/);
    expect(stackContent).toMatch(/ecs-tasks\.amazonaws\.com/);
  });

  test("ECS task execution role has managed policy attachment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ecs_task_execution"\s*{/);
    expect(stackContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
  });

  test("ECS task execution role has ECR pull policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ecs_task_execution_ecr"\s*{/);
    expect(stackContent).toMatch(/ecr:GetDownloadUrlForLayer/);
    expect(stackContent).toMatch(/ecr:BatchGetImage/);
  });

  test("creates ECS task role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-ecs-task"/);
  });

  test("creates EventBridge IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"events"\s*{/);
    expect(stackContent).toMatch(/events\.amazonaws\.com/);
  });

  test("EventBridge role policy allows pipeline execution", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"events"\s*{/);
    expect(stackContent).toMatch(/codepipeline:StartPipelineExecution/);
  });
});

describe("CI/CD Pipeline Infrastructure - CloudWatch Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CloudWatch log group for CodeBuild", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\/aws\/codebuild\/\$\{var\.project_name\}"/);
  });

  test("CodeBuild log group has retention period", () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
  });

  test("creates CloudWatch log group for ECS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\/ecs\/\$\{var\.project_name\}"/);
  });
});

describe("CI/CD Pipeline Infrastructure - SNS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates SNS topic for pipeline notifications", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_notifications"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-pipeline-notifications"/);
  });

  test("SNS topic uses KMS encryption", () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
  });

  test("creates SNS topic subscriptions for email notifications", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_notifications"\s*{/);
    expect(stackContent).toMatch(/for_each\s*=\s*toset\(var\.notification_emails\)/);
    expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
  });

  test("creates CodeStar notifications rule", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codestarnotifications_notification_rule"\s+"pipeline"\s*{/);
    expect(stackContent).toMatch(/resource\s*=\s*aws_codepipeline\.main\.arn/);
  });

  test("CodeStar notifications include failure and success events", () => {
    expect(stackContent).toMatch(/codepipeline-pipeline-pipeline-execution-failed/);
    expect(stackContent).toMatch(/codepipeline-pipeline-pipeline-execution-succeeded/);
  });

  test("creates SNS topic policy for CodeStar notifications", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"pipeline_notifications"\s*{/);
    expect(stackContent).toMatch(/codestar-notifications\.amazonaws\.com/);
  });
});

describe("CI/CD Pipeline Infrastructure - EventBridge Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates EventBridge rule for S3 trigger", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_trigger"\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-s3-trigger"/);
  });

  test("EventBridge rule has S3 object created event pattern", () => {
    expect(stackContent).toMatch(/event_pattern\s*=\s*jsonencode/);
    expect(stackContent).toMatch(/source\s*=\s*\[\s*"aws\.s3"\s*\]/);
    expect(stackContent).toMatch(/detail-type\s*=\s*\[\s*"Object Created"\s*\]/);
  });

  test("EventBridge rule filters by source bucket and key prefix", () => {
    expect(stackContent).toMatch(/bucket\s*=\s*{\s*name\s*=\s*\[aws_s3_bucket\.source\.bucket\]/);
    expect(stackContent).toMatch(/prefix\s*=\s*var\.source_key_prefix/);
  });

  test("creates EventBridge target for pipeline", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"pipeline"\s*{/);
    expect(stackContent).toMatch(/arn\s*=\s*aws_codepipeline\.main\.arn/);
    expect(stackContent).toMatch(/role_arn\s*=\s*aws_iam_role\.events\.arn/);
  });
});

describe("CI/CD Pipeline Infrastructure - Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("queries current AWS caller identity", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("queries availability zones", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    expect(stackContent).toMatch(/state\s*=\s*"available"/);
  });
});

describe("CI/CD Pipeline Infrastructure - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("exports pipeline name", () => {
    expect(stackContent).toMatch(/output\s+"pipeline_name"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_codepipeline\.main\.name/);
  });

  test("exports pipeline ARN", () => {
    expect(stackContent).toMatch(/output\s+"pipeline_arn"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_codepipeline\.main\.arn/);
  });

  test("exports ECR repository URL", () => {
    expect(stackContent).toMatch(/output\s+"ecr_repository_url"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_ecr_repository\.app\.repository_url/);
  });

  test("exports ECS cluster name", () => {
    expect(stackContent).toMatch(/output\s+"ecs_cluster_name"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_ecs_cluster\.main\.name/);
  });

  test("exports ECS service name", () => {
    expect(stackContent).toMatch(/output\s+"ecs_service_name"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_ecs_service\.app\.name/);
    expect(stackContent).not.toMatch(/length\(var\.private_subnet_ids\)/);
  });

  test("exports ALB DNS name", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
  });

  test("exports ALB URL", () => {
    expect(stackContent).toMatch(/output\s+"alb_url"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*"http:\/\/\$\{aws_lb\.main\.dns_name\}"/);
  });

  test("exports VPC ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
  });

  test("exports private subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("exports public subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("exports SNS topic ARN", () => {
    expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_sns_topic\.pipeline_notifications\.arn/);
  });

  test("exports source bucket name", () => {
    expect(stackContent).toMatch(/output\s+"source_bucket_name"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.source\.id/);
  });

  test("exports artifact bucket name", () => {
    expect(stackContent).toMatch(/output\s+"artifact_bucket_name"\s*{/);
    expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.artifacts\.id/);
  });
});

describe("CI/CD Pipeline Infrastructure - Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("uses versioning for S3 buckets", () => {
    const versioningResources = (stackContent.match(/aws_s3_bucket_versioning/g) || []).length;
    expect(versioningResources).toBeGreaterThanOrEqual(2);
  });

  test("enables encryption for S3 buckets", () => {
    const encryptionResources = (stackContent.match(/aws_s3_bucket_server_side_encryption_configuration/g) || []).length;
    expect(encryptionResources).toBeGreaterThanOrEqual(2);
  });

  test("blocks public access on S3 buckets", () => {
    const publicAccessBlock = (stackContent.match(/aws_s3_bucket_public_access_block/g) || []).length;
    expect(publicAccessBlock).toBeGreaterThanOrEqual(2);
  });

  test("uses least privilege IAM policies", () => {
    expect(stackContent).toMatch(/Effect\s*=\s*"Allow"/);
    // CodePipeline shouldn't have wildcard permissions except where necessary
    expect(stackContent).toMatch(/codebuild:StartBuild/);
    expect(stackContent).toMatch(/ecs:UpdateService/);
  });

  test("enables CloudWatch logging for CodeBuild", () => {
    expect(stackContent).toMatch(/logs_config\s*{[\s\S]*?cloudwatch_logs/);
  });

  test("configures log retention periods", () => {
    const retentionConfigs = (stackContent.match(/retention_in_days\s*=\s*\d+/g) || []).length;
    expect(retentionConfigs).toBeGreaterThanOrEqual(2);
  });

  test("enables ECR image scanning", () => {
    expect(stackContent).toMatch(/scan_on_push\s*=\s*true/);
  });

  test("implements ECR lifecycle policy to limit image retention", () => {
    expect(stackContent).toMatch(/aws_ecr_lifecycle_policy/);
    expect(stackContent).toMatch(/countType\s*=\s*"imageCountMoreThan"/);
  });

  test("uses immutable image tags in ECR", () => {
    expect(stackContent).toMatch(/image_tag_mutability\s*=\s*"IMMUTABLE"/);
  });

  test("enables Container Insights for ECS cluster", () => {
    expect(stackContent).toMatch(/containerInsights/);
    expect(stackContent).toMatch(/value\s*=\s*"enabled"/);
  });

  test("configures rolling deployments for ECS service", () => {
    expect(stackContent).toMatch(/deployment_maximum_percent\s*=\s*200/);
    expect(stackContent).toMatch(/deployment_minimum_healthy_percent\s*=\s*100/);
  });

  test("uses Fargate for serverless ECS deployment", () => {
    expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
    expect(stackContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
  });
});

describe("CI/CD Pipeline Infrastructure - Security Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("ECS tasks run in private subnets", () => {
    expect(stackContent).toMatch(/assign_public_ip\s*=\s*false/);
    expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("ECS security group allows ingress from ALB only (not from internet)", () => {
    const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{[\s\S]*?(?=resource|$)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/egress\s*{/);
    // Should have ingress but only from ALB security group (not from CIDR blocks)
    expect(sgBlock![0]).toMatch(/ingress\s*{/);
    expect(sgBlock![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    // Should not allow ingress with cidr_blocks (only security_groups reference)
    const ingressBlock = sgBlock![0].match(/ingress\s*{[\s\S]*?(?=ingress|egress|resource|$)/);
    expect(ingressBlock).toBeTruthy();
    expect(ingressBlock![0]).not.toMatch(/cidr_blocks/);
  });

  test("SNS topic uses encryption", () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
  });

  test("ECR repository uses encryption", () => {
    expect(stackContent).toMatch(/encryption_configuration\s*{[\s\S]*?encryption_type\s*=\s*"AES256"/);
  });
});

describe("CI/CD Pipeline Infrastructure - Pipeline Integration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("pipeline stages are connected with artifacts", () => {
    expect(stackContent).toMatch(/output_artifacts\s*=\s*\[\s*"source_output"\s*\]/);
    expect(stackContent).toMatch(/input_artifacts\s*=\s*\[\s*"source_output"\s*\]/);
    expect(stackContent).toMatch(/output_artifacts\s*=\s*\[\s*"build_output"\s*\]/);
    expect(stackContent).toMatch(/input_artifacts\s*=\s*\[\s*"build_output"\s*\]/);
  });

  test("pipeline triggers on S3 object upload via EventBridge", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_trigger"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"pipeline"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"source"/);
    expect(stackContent).toMatch(/eventbridge\s*=\s*true/);
  });

  test("pipeline sends notifications via SNS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codestarnotifications_notification_rule"\s+"pipeline"/);
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_notifications"/);
    expect(stackContent).toMatch(/resource\s*=\s*aws_codepipeline\.main\.arn/);
  });

  test("pipeline deployment ignores task definition changes", () => {
    expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*?ignore_changes\s*=\s*\[task_definition\]/);
  });
});

describe("CI/CD Pipeline Infrastructure - Coverage Summary", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates all required S3 resources", () => {
    const s3Buckets = (stackContent.match(/resource\s+"aws_s3_bucket"/g) || []).length;
    expect(s3Buckets).toBeGreaterThanOrEqual(2);
  });

  test("creates all required IAM roles", () => {
    const iamRoles = (stackContent.match(/resource\s+"aws_iam_role"/g) || []).length;
    expect(iamRoles).toBeGreaterThanOrEqual(5);
  });

  test("implements complete CI/CD pipeline", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"source"/);
    expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"app"/);
    expect(stackContent).toMatch(/resource\s+"aws_codebuild_project"\s+"docker_build"/);
    expect(stackContent).toMatch(/resource\s+"aws_codepipeline"\s+"main"/);
    expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
    expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"/);
  });

  test("implements automated deployment pipeline", () => {
    const stages = (stackContent.match(/stage\s*{[\s\S]*?name/g) || []).length;
    expect(stages).toBeGreaterThanOrEqual(2); // Source and Build at minimum
  });

  test("supports containerized application deployment", () => {
    expect(stackContent).toMatch(/aws_ecr_repository/);
    expect(stackContent).toMatch(/aws_ecs_service/);
    expect(stackContent).toMatch(/container_definitions/);
  });
});
