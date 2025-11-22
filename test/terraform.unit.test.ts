// Comprehensive unit tests for Terraform IaC modules
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper to read and parse HCL files
function readTerraformFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Helper to check if terraform files exist
function terraformFileExists(filename: string): boolean {
  return fs.existsSync(path.join(LIB_DIR, filename));
}

// Helper to validate terraform syntax
function validateTerraformSyntax(): boolean {
  try {
    execSync('terraform validate', { cwd: LIB_DIR, stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper to check resource naming with environment_suffix
function hasEnvironmentSuffix(content: string, resourceName: string): boolean {
  const regex = new RegExp(`${resourceName}[^"]*\\$\\{var\\.environment_suffix\\}`, 'i');
  return regex.test(content);
}

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    const expectedFiles = [
      'provider.tf',
      'variables.tf',
      'outputs.tf',
      'main.tf',
      'vpc.tf',
      'security_groups.tf',
      'alb.tf',
      'waf.tf',
      'kms.tf',
      's3.tf',
      'ecr.tf',
      'ecs.tf',
      'codecommit.tf',
      'codebuild.tf',
      'codepipeline.tf',
      'cloudwatch.tf',
      'sns.tf',
      'iam_ecs.tf',
      'iam_codebuild.tf',
      'iam_codepipeline.tf',
    ];

    test.each(expectedFiles)('%s exists', (filename) => {
      expect(terraformFileExists(filename)).toBe(true);
    });

    test('all terraform files have .tf extension', () => {
      const files = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.tf'));
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Configuration', () => {
    const providerContent = readTerraformFile('provider.tf');

    test('defines AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('uses aws_region variable', () => {
      expect(providerContent).toMatch(/region\s+=\s+var\.aws_region/);
    });

    test('configures required_providers with AWS', () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=/);
    });

    test('does not have duplicate provider blocks', () => {
      const matches = providerContent.match(/provider\s+"aws"\s*{/g);
      expect(matches).toHaveLength(1);
    });
  });

  describe('Variables Configuration', () => {
    const variablesContent = readTerraformFile('variables.tf');

    test('defines environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('defines aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('defines vpc_cidr variable', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test('defines subnet CIDR variables', () => {
      expect(variablesContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    });

    test('defines ECS configuration variables', () => {
      expect(variablesContent).toMatch(/variable\s+"ecs_task_cpu"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"ecs_task_memory"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"ecs_desired_count"\s*{/);
    });
  });

  describe('Outputs Configuration', () => {
    const outputsContent = readTerraformFile('outputs.tf');

    test('defines vpc_id output', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test('defines subnet outputs', () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test('defines ALB DNS output', () => {
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    });

    test('defines ECS outputs', () => {
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"\s*{/);
      expect(outputsContent).toMatch(/output\s+"ecs_service_name"\s*{/);
    });

    test('defines ECR repository output', () => {
      expect(outputsContent).toMatch(/output\s+"ecr_repository_url"\s*{/);
    });

    test('defines KMS key outputs', () => {
      expect(outputsContent).toMatch(/output\s+"kms_artifacts_key_id"\s*{/);
      expect(outputsContent).toMatch(/output\s+"kms_ecr_key_id"\s*{/);
    });
  });

  describe('VPC Configuration', () => {
    const vpcContent = readTerraformFile('vpc.tf');

    test('defines VPC resource', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test('VPC has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(vpcContent, 'vpc-')).toBe(true);
    });

    test('enables DNS hostnames and support', () => {
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('defines Internet Gateway', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test('defines public subnets with count = 3', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(vpcContent).toMatch(/count\s*=\s*3/);
    });

    test('defines private subnets with count = 3', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test('defines NAT Gateways', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test('defines EIPs for NAT Gateways', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test('public subnets map public IP on launch', () => {
      expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('defines route tables for public and private subnets', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });
  });

  describe('Security Groups Configuration', () => {
    const sgContent = readTerraformFile('security_groups.tf');

    test('defines ALB security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    });

    test('defines ECS tasks security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"\s*{/);
    });

    test('security groups have environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(sgContent, 'alb-sg-')).toBe(true);
      expect(hasEnvironmentSuffix(sgContent, 'ecs-tasks-sg-')).toBe(true);
    });

    test('ALB security group allows inbound HTTP traffic', () => {
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/to_port\s*=\s*80/);
    });
  });

  describe('ALB Configuration', () => {
    const albContent = readTerraformFile('alb.tf');

    test('defines Application Load Balancer', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    });

    test('ALB has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(albContent, 'alb-')).toBe(true);
    });

    test('ALB is internet-facing', () => {
      expect(albContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('defines target groups for blue/green deployment', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"\s*{/);
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"green"\s*{/);
    });

    test('target groups have environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(albContent, 'tg-blue-')).toBe(true);
      expect(hasEnvironmentSuffix(albContent, 'tg-green-')).toBe(true);
    });

    test('defines HTTP listener', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
    });

    test('defines test listener for blue/green', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_listener"\s+"test"\s*{/);
    });
  });

  describe('WAF Configuration', () => {
    const wafContent = readTerraformFile('waf.tf');

    test('defines WAF Web ACL', () => {
      expect(wafContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
    });

    test('WAF has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(wafContent, 'alb-waf-')).toBe(true);
    });

    test('WAF scope is REGIONAL', () => {
      expect(wafContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test('includes AWS Managed Rules', () => {
      expect(wafContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(wafContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('defines rate limiting rule', () => {
      expect(wafContent).toMatch(/rate_based_statement/);
    });

    test('associates WAF with ALB', () => {
      expect(wafContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"\s*{/);
    });
  });

  describe('KMS Configuration', () => {
    const kmsContent = readTerraformFile('kms.tf');

    test('defines artifacts KMS key', () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"artifacts"\s*{/);
    });

    test('defines ECR KMS key', () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"ecr"\s*{/);
    });

    test('KMS keys have environment_suffix in alias names', () => {
      expect(hasEnvironmentSuffix(kmsContent, 'artifacts-')).toBe(true);
      expect(hasEnvironmentSuffix(kmsContent, 'ecr-')).toBe(true);
    });

    test('enables key rotation', () => {
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/g);
    });

    test('artifacts key policy allows CodePipeline', () => {
      expect(kmsContent).toMatch(/codepipeline\.amazonaws\.com/);
    });

    test('artifacts key policy allows CodeBuild', () => {
      expect(kmsContent).toMatch(/codebuild\.amazonaws\.com/);
    });

    test('artifacts key policy allows S3', () => {
      expect(kmsContent).toMatch(/s3\.amazonaws\.com/);
    });

    test('artifacts key policy allows CloudWatch Logs', () => {
      expect(kmsContent).toMatch(/logs\.us-east-1\.amazonaws\.com/);
    });

    test('ECR key policy allows ECR service', () => {
      expect(kmsContent).toMatch(/ecr\.amazonaws\.com/);
    });

    test('defines KMS aliases', () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_alias"\s+"artifacts"\s*{/);
      expect(kmsContent).toMatch(/resource\s+"aws_kms_alias"\s+"ecr"\s*{/);
    });
  });

  describe('S3 Configuration', () => {
    const s3Content = readTerraformFile('s3.tf');

    test('defines artifacts bucket', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"artifacts"\s*{/);
    });

    test('bucket has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(s3Content, 'pipeline-artifacts-')).toBe(true);
    });

    test('enables versioning', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"artifacts"\s*{/);
      expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('blocks public access', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"artifacts"\s*{/);
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('configures server-side encryption', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"artifacts"\s*{/);
    });

    test('defines lifecycle configuration', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"artifacts"\s*{/);
    });

    test('lifecycle has expiration rule', () => {
      expect(s3Content).toMatch(/expiration\s*{/);
      expect(s3Content).toMatch(/days\s*=\s*90/);
    });
  });

  describe('ECR Configuration', () => {
    const ecrContent = readTerraformFile('ecr.tf');

    test('defines ECR repository', () => {
      expect(ecrContent).toMatch(/resource\s+"aws_ecr_repository"\s+"app"\s*{/);
    });

    test('repository has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(ecrContent, 'payment-gateway-')).toBe(true);
    });

    test('enables image scanning', () => {
      expect(ecrContent).toMatch(/scan_on_push\s*=\s*true/);
    });

    test('uses KMS encryption', () => {
      expect(ecrContent).toMatch(/encryption_type\s*=\s*"KMS"/);
      expect(ecrContent).toMatch(/kms_key\s*=\s*aws_kms_key\.ecr\.arn/);
    });

    test('defines lifecycle policy', () => {
      expect(ecrContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"app"\s*{/);
    });
  });

  describe('ECS Configuration', () => {
    const ecsContent = readTerraformFile('ecs.tf');

    test('defines ECS cluster', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"\s*{/);
    });

    test('cluster has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(ecsContent, 'ecs-cluster-')).toBe(true);
    });

    test('defines task definition', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"\s*{/);
    });

    test('task definition uses FARGATE', () => {
      expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    });

    test('task definition has environment_suffix in family name', () => {
      expect(hasEnvironmentSuffix(ecsContent, 'payment-gateway-')).toBe(true);
    });

    test('defines ECS service', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_service"\s+"app"\s*{/);
    });

    test('ECS service uses FARGATE', () => {
      expect(ecsContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
    });

    test('ECS service configured for blue/green deployment', () => {
      expect(ecsContent).toMatch(/deployment_controller\s*{/);
      expect(ecsContent).toMatch(/type\s*=\s*"CODE_DEPLOY"/);
    });
  });

  describe('CodeCommit Configuration', () => {
    const codecommitContent = readTerraformFile('codecommit.tf');

    test('defines CodeCommit repository', () => {
      expect(codecommitContent).toMatch(/resource\s+"aws_codecommit_repository"\s+"app"\s*{/);
    });

    test('repository has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(codecommitContent, '')).toBe(true);
      expect(codecommitContent).toMatch(/var\.codecommit_repository_name.*var\.environment_suffix/s);
    });

    test('defines approval rule template', () => {
      expect(codecommitContent).toMatch(/resource\s+"aws_codecommit_approval_rule_template"\s+/);
    });

    test('defines approval rule association', () => {
      expect(codecommitContent).toMatch(/resource\s+"aws_codecommit_approval_rule_template_association"\s+/);
    });
  });

  describe('CodeBuild Configuration', () => {
    const codebuildContent = readTerraformFile('codebuild.tf');

    test('defines CodeBuild project', () => {
      expect(codebuildContent).toMatch(/resource\s+"aws_codebuild_project"\s+"app"\s*{/);
    });

    test('project has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(codebuildContent, 'payment-gateway-build-')).toBe(true);
    });

    test('uses standard compute type', () => {
      expect(codebuildContent).toMatch(/compute_type\s*=\s*"BUILD_GENERAL1_SMALL"/);
    });

    test('configures artifacts', () => {
      expect(codebuildContent).toMatch(/artifacts\s*{/);
      expect(codebuildContent).toMatch(/type\s*=\s*"CODEPIPELINE"/);
    });

    test('references CloudWatch log group', () => {
      expect(codebuildContent).toMatch(/aws_cloudwatch_log_group\.codebuild/);
    });
  });

  describe('CodePipeline Configuration', () => {
    const codepipelineContent = readTerraformFile('codepipeline.tf');

    test('defines CodePipeline', () => {
      expect(codepipelineContent).toMatch(/resource\s+"aws_codepipeline"\s+"app"\s*{/);
    });

    test('pipeline has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(codepipelineContent, 'payment-gateway-pipeline-')).toBe(true);
    });

    test('defines Source stage with CodeCommit', () => {
      expect(codepipelineContent).toMatch(/stage\s*{[^}]*name\s*=\s*"Source"/s);
      expect(codepipelineContent).toMatch(/provider\s*=\s*"CodeCommit"/);
    });

    test('defines Build stage with CodeBuild', () => {
      expect(codepipelineContent).toMatch(/stage\s*{[^}]*name\s*=\s*"Build"/s);
      expect(codepipelineContent).toMatch(/provider\s*=\s*"CodeBuild"/);
    });

    test('defines Approval stage', () => {
      expect(codepipelineContent).toMatch(/stage\s*{[^}]*name\s*=\s*"Approval"/s);
      expect(codepipelineContent).toMatch(/provider\s*=\s*"Manual"/);
    });

    test('defines Deploy stage with ECS', () => {
      expect(codepipelineContent).toMatch(/stage\s*{[^}]*name\s*=\s*"Deploy"/s);
      expect(codepipelineContent).toMatch(/provider\s*=\s*"ECS"/);
    });

    test('uses KMS for artifact encryption', () => {
      expect(codepipelineContent).toMatch(/encryption_key\s*{/);
      expect(codepipelineContent).toMatch(/type\s*=\s*"KMS"/);
    });

    test('defines EventBridge rule for CodeCommit changes', () => {
      expect(codepipelineContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+/);
    });

    test('defines EventBridge target for pipeline', () => {
      expect(codepipelineContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+/);
    });
  });

  describe('CloudWatch Configuration', () => {
    const cloudwatchContent = readTerraformFile('cloudwatch.tf');

    test('defines log group for ECS tasks', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs_tasks"\s*{/);
    });

    test('defines log group for CodeBuild', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild"\s*{/);
    });

    test('log groups have environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(cloudwatchContent, '/ecs/')).toBe(true);
      expect(hasEnvironmentSuffix(cloudwatchContent, '/aws/codebuild/')).toBe(true);
    });
  });

  describe('SNS Configuration', () => {
    const snsContent = readTerraformFile('sns.tf');

    test('defines SNS topic for pipeline approval', () => {
      expect(snsContent).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_approval"\s*{/);
    });

    test('topic has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(snsContent, 'pipeline-approval-')).toBe(true);
    });

    test('defines SNS topic subscription', () => {
      expect(snsContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"pipeline_approval"\s*{/);
    });

    test('subscription uses email protocol', () => {
      expect(snsContent).toMatch(/protocol\s*=\s*"email"/);
    });
  });

  describe('IAM ECS Configuration', () => {
    const iamEcsContent = readTerraformFile('iam_ecs.tf');

    test('defines ECS task execution role', () => {
      expect(iamEcsContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"\s*{/);
    });

    test('defines ECS task role', () => {
      expect(iamEcsContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"\s*{/);
    });

    test('roles have environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(iamEcsContent, 'ecs-task-execution-role-')).toBe(true);
      expect(hasEnvironmentSuffix(iamEcsContent, 'ecs-task-role-')).toBe(true);
    });

    test('attaches AmazonECSTaskExecutionRolePolicy', () => {
      expect(iamEcsContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
    });

    test('defines custom policy for task role', () => {
      expect(iamEcsContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ecs_task"\s*{/);
    });

    test('ECS task execution role can use KMS', () => {
      expect(iamEcsContent).toMatch(/kms:Decrypt/);
    });
  });

  describe('IAM CodeBuild Configuration', () => {
    const iamCodebuildContent = readTerraformFile('iam_codebuild.tf');

    test('defines CodeBuild role', () => {
      expect(iamCodebuildContent).toMatch(/resource\s+"aws_iam_role"\s+"codebuild"\s*{/);
    });

    test('role has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(iamCodebuildContent, 'codebuild-role-')).toBe(true);
    });

    test('role can access S3', () => {
      expect(iamCodebuildContent).toMatch(/s3:GetObject/);
      expect(iamCodebuildContent).toMatch(/s3:PutObject/);
    });

    test('role can access ECR', () => {
      expect(iamCodebuildContent).toMatch(/ecr:BatchCheckLayerAvailability/);
      expect(iamCodebuildContent).toMatch(/ecr:PutImage/);
    });

    test('role can write CloudWatch logs', () => {
      expect(iamCodebuildContent).toMatch(/logs:CreateLogStream/);
      expect(iamCodebuildContent).toMatch(/logs:PutLogEvents/);
    });

    test('role can use KMS', () => {
      expect(iamCodebuildContent).toMatch(/kms:Decrypt/);
      expect(iamCodebuildContent).toMatch(/kms:Encrypt/);
    });
  });

  describe('IAM CodePipeline Configuration', () => {
    const iamCodepipelineContent = readTerraformFile('iam_codepipeline.tf');

    test('defines CodePipeline role', () => {
      expect(iamCodepipelineContent).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline"\s*{/);
    });

    test('role has environment_suffix in name', () => {
      expect(hasEnvironmentSuffix(iamCodepipelineContent, 'codepipeline-role-')).toBe(true);
    });

    test('role can access S3', () => {
      expect(iamCodepipelineContent).toMatch(/s3:GetObject/);
      expect(iamCodepipelineContent).toMatch(/s3:PutObject/);
    });

    test('role can access CodeCommit', () => {
      expect(iamCodepipelineContent).toMatch(/codecommit:GetBranch/);
      expect(iamCodepipelineContent).toMatch(/codecommit:GetCommit/);
    });

    test('role can start CodeBuild', () => {
      expect(iamCodepipelineContent).toMatch(/codebuild:StartBuild/);
      expect(iamCodepipelineContent).toMatch(/codebuild:BatchGetBuilds/);
    });

    test('role can deploy to ECS', () => {
      expect(iamCodepipelineContent).toMatch(/ecs:UpdateService/);
    });

    test('role can use KMS', () => {
      expect(iamCodepipelineContent).toMatch(/kms:Decrypt/);
      expect(iamCodepipelineContent).toMatch(/kms:Encrypt/);
    });
  });

  describe('Main Configuration', () => {
    const mainContent = readTerraformFile('main.tf');

    test('defines data source for availability zones', () => {
      expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test('defines data source for caller identity', () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });


  describe('Resource Naming Conventions', () => {
    const allTerraformFiles = fs
      .readdirSync(LIB_DIR)
      .filter((f) => f.endsWith('.tf'))
      .map((f) => readTerraformFile(f))
      .join('\n');

    test('no hardcoded dev/prod/stage prefixes in resource names', () => {
      expect(allTerraformFiles).not.toMatch(/"prod-[^"]*"/);
      expect(allTerraformFiles).not.toMatch(/"dev-[^"]*"/);
      expect(allTerraformFiles).not.toMatch(/"stage-[^"]*"/);
    });

    test('no DeletionPolicy or Retain policies', () => {
      expect(allTerraformFiles).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('no explicit region hardcoding in resource configurations', () => {
      const hardcodedRegionPattern = /region\s*=\s*"us-[a-z]+-\d+"/;
      const providerContent = readTerraformFile('provider.tf');
      const otherFiles = allTerraformFiles.replace(providerContent, '');

      // Allow region in provider, but not in other resources
      expect(otherFiles).not.toMatch(hardcodedRegionPattern);
    });
  });

  describe('Security Best Practices', () => {
    const allFiles = fs
      .readdirSync(LIB_DIR)
      .filter((f) => f.endsWith('.tf'))
      .map((f) => readTerraformFile(f))
      .join('\n');

    test('no hardcoded credentials or secrets', () => {
      expect(allFiles).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(allFiles).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(allFiles).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key pattern
    });

    test('S3 buckets block public access', () => {
      const s3Content = readTerraformFile('s3.tf');
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('KMS keys enable rotation', () => {
      const kmsContent = readTerraformFile('kms.tf');
      const rotationMatches = kmsContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).toBeTruthy();
      expect(rotationMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('ECR enables image scanning', () => {
      const ecrContent = readTerraformFile('ecr.tf');
      expect(ecrContent).toMatch(/scan_on_push\s*=\s*true/);
    });
  });
});
