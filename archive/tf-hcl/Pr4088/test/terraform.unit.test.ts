// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform CI/CD pipeline configuration
// Tests tap_stack.tf and provider.tf for structure, resources, and best practices

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);

describe("Terraform Configuration Files - Existence", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });
});

describe("provider.tf - Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("declares terraform required_version", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*\d+\.\d+\.\d+"/);
  });

  test("declares AWS provider with correct source", () => {
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("uses AWS provider version >= 5.0", () => {
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });

  test("configures AWS provider with region variable", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe("tap_stack.tf - Required Variables", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares company_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"company_name"\s*{/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares app_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"app_name"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares container_port variable", () => {
    expect(stackContent).toMatch(/variable\s+"container_port"\s*{/);
  });

  test("declares approval_email variable", () => {
    expect(stackContent).toMatch(/variable\s+"approval_email"\s*{/);
  });
});

describe("tap_stack.tf - Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares aws_region data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
  });

  test("declares aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("uses non-deprecated region attribute (id instead of name)", () => {
    expect(stackContent).toMatch(/region\s*=\s*data\.aws_region\.current\.id/);
    expect(stackContent).not.toMatch(/region\s*=\s*data\.aws_region\.current\.name/);
  });
});

describe("tap_stack.tf - Locals Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("defines locals block", () => {
    expect(stackContent).toMatch(/locals\s*{/);
  });

  test("defines account_id from data source", () => {
    expect(stackContent).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
  });

  test("defines name_prefix with naming convention", () => {
    expect(stackContent).toMatch(/name_prefix\s*=.*company_name.*environment/);
  });

  test("defines name_prefix_lower for lowercase requirements", () => {
    expect(stackContent).toMatch(/name_prefix_lower\s*=\s*lower\(/);
  });

  test("defines common_tags", () => {
    expect(stackContent).toMatch(/common_tags\s*=\s*{/);
  });
});

describe("tap_stack.tf - KMS Encryption", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares KMS key resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"pipeline_key"/);
  });

  test("enables KMS key rotation", () => {
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("KMS key has policy allowing CloudWatch Logs", () => {
    expect(stackContent).toMatch(/Allow CloudWatch Logs/);
    expect(stackContent).toMatch(/logs\..*\.amazonaws\.com/);
  });

  test("KMS key has policy for root account", () => {
    expect(stackContent).toMatch(/Enable IAM User Permissions/);
    expect(stackContent).toMatch(/arn:aws:iam::.*:root/);
  });

  test("declares KMS alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"pipeline_key_alias"/);
  });
});

describe("tap_stack.tf - Networking Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("VPC enables DNS hostnames and support", () => {
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("declares public subnets with count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
  });

  test("declares private subnets with count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test("declares internet gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares NAT gateways", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("declares EIP for NAT", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });

  test("declares route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });
});

describe("tap_stack.tf - Security Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ALB security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("ALB security group allows HTTP (80)", () => {
    const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"aws_security_group"|# ====)/);
    expect(albSgMatch?.[0]).toMatch(/from_port\s*=\s*80/);
  });

  test("ALB security group allows HTTPS (443)", () => {
    const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"aws_security_group"|# ====)/);
    expect(albSgMatch?.[0]).toMatch(/from_port\s*=\s*443/);
  });

  test("declares ECS tasks security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
  });
});

describe("tap_stack.tf - ECR Repository", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ECR repository", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"app"/);
  });

  test("ECR repository uses lowercase naming", () => {
    expect(stackContent).toMatch(/name\s*=.*name_prefix_lower/);
  });

  test("ECR enables image scanning", () => {
    expect(stackContent).toMatch(/scan_on_push\s*=\s*true/);
  });

  test("ECR uses KMS encryption", () => {
    expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    expect(stackContent).toMatch(/kms_key\s*=\s*aws_kms_key\.pipeline_key\.arn/);
  });

  test("declares ECR lifecycle policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"app"/);
  });
});

describe("tap_stack.tf - S3 Artifacts Bucket", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"artifacts"/);
  });

  test("S3 bucket uses lowercase naming", () => {
    expect(stackContent).toMatch(/bucket\s*=.*name_prefix_lower/);
  });

  test("S3 bucket has encryption configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"artifacts"/);
  });

  test("S3 bucket uses KMS encryption", () => {
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("S3 bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"artifacts"/);
    expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("S3 bucket blocks public access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"artifacts"/);
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
  });
});

describe("tap_stack.tf - Secrets Manager", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares secrets manager secret", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"app_config"/);
  });

  test("secret uses KMS encryption", () => {
    expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.pipeline_key\.arn/);
  });

  test("declares secret version", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"app_config"/);
  });
});

describe("tap_stack.tf - CloudWatch Logs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ECS log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
  });

  test("declares CodeBuild log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild"/);
  });

  test("log groups use KMS encryption", () => {
    const ecsLogMatch = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"[\s\S]*?(?=resource|# ====)/);
    expect(ecsLogMatch?.[0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.pipeline_key\.arn/);
  });

  test("log groups have retention period", () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
  });
});

describe("tap_stack.tf - Application Load Balancer", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ALB", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
  });

  test("ALB is internet-facing", () => {
    expect(stackContent).toMatch(/internal\s*=\s*false/);
  });

  test("declares blue target group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
  });

  test("declares green target group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
  });

  test("target groups use IP target type", () => {
    expect(stackContent).toMatch(/target_type\s*=\s*"ip"/);
  });

  test("target groups have health checks", () => {
    expect(stackContent).toMatch(/health_check\s*{/);
    expect(stackContent).toMatch(/path\s*=\s*"\/health"/);
  });

  test("declares main listener (port 80)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    expect(stackContent).toMatch(/port\s*=\s*"80"/);
  });

  test("declares test listener (port 8080)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"test"/);
    expect(stackContent).toMatch(/port\s*=\s*"8080"/);
  });
});

describe("tap_stack.tf - ECS Cluster", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ECS cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
  });

  test("ECS cluster has Container Insights enabled", () => {
    expect(stackContent).toMatch(/containerInsights/);
    expect(stackContent).toMatch(/value\s*=\s*"enabled"/);
  });

  test("declares ECS capacity providers", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster_capacity_providers"\s+"main"/);
  });

  test("capacity providers include FARGATE", () => {
    expect(stackContent).toMatch(/capacity_providers\s*=\s*\["FARGATE"/);
  });
});

describe("tap_stack.tf - IAM Roles", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ECS task execution role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
  });

  test("declares ECS task role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
  });

  test("declares CodeBuild role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"codebuild"/);
  });

  test("declares CodeDeploy role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"codedeploy"/);
  });

  test("declares CodePipeline role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline"/);
  });

  test("declares Lambda execution role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
  });

  test("ECS task execution role has secrets access", () => {
    expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
  });

  test("CodeBuild role has ECR permissions", () => {
    expect(stackContent).toMatch(/ecr:BatchCheckLayerAvailability/);
    expect(stackContent).toMatch(/ecr:PutImage/);
  });

  test("CodeDeploy role has ECS policy attached", () => {
    expect(stackContent).toMatch(/AWSCodeDeployRoleForECS/);
  });
});

describe("tap_stack.tf - ECS Task and Service", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ECS task definition", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"/);
  });

  test("task definition uses Fargate", () => {
    expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
  });

  test("task definition uses awsvpc network mode", () => {
    expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
  });

  test("declares ECS service", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"app"/);
  });

  test("ECS service uses CODE_DEPLOY deployment controller", () => {
    expect(stackContent).toMatch(/deployment_controller\s*{/);
    expect(stackContent).toMatch(/type\s*=\s*"CODE_DEPLOY"/);
  });

  test("ECS service is in private subnets", () => {
    expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.private/);
  });
});

describe("tap_stack.tf - CodeBuild", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CodeBuild project", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codebuild_project"\s+"app"/);
  });

  test("CodeBuild uses CODEPIPELINE artifacts", () => {
    expect(stackContent).toMatch(/type\s*=\s*"CODEPIPELINE"/);
  });

  test("CodeBuild has privileged mode for Docker", () => {
    expect(stackContent).toMatch(/privileged_mode\s*=\s*true/);
  });

  test("CodeBuild has environment variables", () => {
    expect(stackContent).toMatch(/AWS_ACCOUNT_ID/);
    expect(stackContent).toMatch(/IMAGE_REPO_NAME/);
    expect(stackContent).toMatch(/CONTAINER_NAME/);
  });

  test("CodeBuild has CloudWatch logs configured", () => {
    expect(stackContent).toMatch(/logs_config\s*{/);
    expect(stackContent).toMatch(/cloudwatch_logs/);
  });
});

describe("tap_stack.tf - CodeDeploy", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CodeDeploy application", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codedeploy_app"\s+"app"/);
  });

  test("CodeDeploy uses ECS compute platform", () => {
    expect(stackContent).toMatch(/compute_platform\s*=\s*"ECS"/);
  });

  test("declares CodeDeploy deployment group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codedeploy_deployment_group"\s+"app"/);
  });

  test("deployment group uses valid ECS deployment config", () => {
    expect(stackContent).toMatch(/deployment_config_name\s*=\s*"CodeDeployDefault\.ECS/);
  });

  test("deployment group has auto rollback enabled", () => {
    expect(stackContent).toMatch(/auto_rollback_configuration\s*{/);
    expect(stackContent).toMatch(/enabled\s*=\s*true/);
  });

  test("deployment group uses blue/green deployment", () => {
    expect(stackContent).toMatch(/deployment_type\s*=\s*"BLUE_GREEN"/);
  });

  test("deployment group has target group pair info", () => {
    expect(stackContent).toMatch(/target_group_pair_info\s*{/);
    expect(stackContent).toMatch(/prod_traffic_route/);
    expect(stackContent).toMatch(/test_traffic_route/);
  });

  test("deployment group does NOT use COPY_AUTO_SCALING_GROUP", () => {
    expect(stackContent).not.toMatch(/green_fleet_provisioning_option/);
  });
});

describe("tap_stack.tf - Lambda Function", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"pipeline_validator"/);
  });

  test("declares local_file for Lambda code", () => {
    expect(stackContent).toMatch(/resource\s+"local_file"\s+"lambda_code"/);
  });

  test("declares archive_file for Lambda zip", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
  });

  test("Lambda function has Python runtime", () => {
    expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
  });
});

describe("tap_stack.tf - SNS Topic", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares SNS topic", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_alerts"/);
  });

  test("SNS topic uses KMS encryption", () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.pipeline_key\.id/);
  });

  test("declares SNS topic subscription", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"pipeline_alerts_email"/);
  });

  test("SNS subscription uses email protocol", () => {
    expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
  });
});

describe("tap_stack.tf - CodePipeline", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CodePipeline", () => {
    expect(stackContent).toMatch(/resource\s+"aws_codepipeline"\s+"app"/);
  });

  test("pipeline has artifact store with KMS encryption", () => {
    expect(stackContent).toMatch(/artifact_store\s*{/);
    expect(stackContent).toMatch(/encryption_key\s*{/);
  });

  test("pipeline has Source stage", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Source"/);
  });

  test("pipeline has Build stage", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Build"/);
  });

  test("pipeline has Validate stage", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Validate"/);
  });

  test("pipeline has Approval stage", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Approval"/);
  });

  test("pipeline has Deploy stage", () => {
    expect(stackContent).toMatch(/stage\s*{\s*name\s*=\s*"Deploy"/);
  });

  test("Source stage uses S3 provider", () => {
    expect(stackContent).toMatch(/provider\s*=\s*"S3"/);
  });

  test("Build stage uses CodeBuild", () => {
    expect(stackContent).toMatch(/provider\s*=\s*"CodeBuild"/);
  });

  test("Validate stage uses Lambda", () => {
    expect(stackContent).toMatch(/provider\s*=\s*"Lambda"/);
  });

  test("Approval stage uses Manual approval", () => {
    expect(stackContent).toMatch(/provider\s*=\s*"Manual"/);
    expect(stackContent).toMatch(/category\s*=\s*"Approval"/);
  });

  test("Deploy stage uses CodeDeployToECS", () => {
    expect(stackContent).toMatch(/provider\s*=\s*"CodeDeployToECS"/);
  });
});

describe("tap_stack.tf - CloudWatch Alarms", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares high CPU alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
  });

  test("declares high memory alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_memory"/);
  });

  test("declares unhealthy targets alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"target_unhealthy"/);
  });

  test("alarms send to SNS topic", () => {
    expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.pipeline_alerts\.arn\]/);
  });

  test("declares CloudWatch dashboard", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"pipeline"/);
  });
});

describe("tap_stack.tf - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("outputs ALB DNS name", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
  });

  test("outputs ECR repository URL", () => {
    expect(stackContent).toMatch(/output\s+"ecr_repository_url"/);
  });

  test("outputs pipeline name", () => {
    expect(stackContent).toMatch(/output\s+"pipeline_name"/);
  });

  test("outputs ECS cluster name", () => {
    expect(stackContent).toMatch(/output\s+"ecs_cluster_name"/);
  });

  test("outputs ECS service name", () => {
    expect(stackContent).toMatch(/output\s+"ecs_service_name"/);
  });

  test("required outputs are declared", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
    expect(stackContent).toMatch(/output\s+"ecr_repository_url"/);
    expect(stackContent).toMatch(/output\s+"pipeline_name"/);
    expect(stackContent).toMatch(/output\s+"ecs_cluster_name"/);
    expect(stackContent).toMatch(/output\s+"ecs_service_name"/);
  });
});

describe("tap_stack.tf - Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("uses tags on resources", () => {
    const tagMatches = stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g);
    expect(tagMatches).toBeTruthy();
    expect(tagMatches!.length).toBeGreaterThan(10);
  });

  test("does NOT declare provider block (provider.tf handles this)", () => {
    expect(stackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
  });

  test("uses lowercase names for AWS resources requiring it", () => {
    expect(stackContent).toMatch(/name_prefix_lower/);
  });

  test("file includes version and documentation comments", () => {
    expect(stackContent).toMatch(/Version:/);
    expect(stackContent).toMatch(/Author:/);
  });

  test("S3 is used as the pipeline source", () => {
    expect(stackContent).toMatch(/provider\s*=\s*"S3"/);
    expect(stackContent).toMatch(/S3Bucket\s*=/);
  });

  test("uses lifecycle ignore_changes where appropriate", () => {
    expect(stackContent).toMatch(/lifecycle\s*{/);
    expect(stackContent).toMatch(/ignore_changes/);
  });
});

describe("Integration - tap_stack.tf and provider.tf", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("aws_region variable in tap_stack.tf matches provider.tf usage", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"/);
    expect(providerContent).toMatch(/var\.aws_region/);
  });

  test("provider.tf does not duplicate provider declarations", () => {
    const providerMatches = providerContent.match(/provider\s+"aws"/g);
    expect(providerMatches?.length).toBe(1);
  });

  test("both files follow consistent formatting", () => {
    expect(stackContent).toMatch(/# ====/);
    expect(providerContent).toMatch(/#/);
  });
});
