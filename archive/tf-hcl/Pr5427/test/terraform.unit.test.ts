// Comprehensive unit tests for ECS Terraform infrastructure
// Tests validate configuration without running terraform init/apply

import fs from 'fs';
import { parse } from 'hcl2-parser';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read and parse HCL files
function readHCLFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to parse HCL content
async function parseHCL(content: string): Promise<any> {
  try {
    return await parse(content);
  } catch (error) {
    console.error('HCL parsing error:', error);
    return null;
  }
}

describe('Terraform Infrastructure - File Structure', () => {
  const requiredFiles = [
    'provider.tf',
    'variables.tf',
    'main.tf',
    'ecs_services.tf',
    'iam.tf',
    'security_groups.tf',
    'cloudwatch.tf',
    'alb.tf',
    'data.tf',
    'locals.tf',
    'outputs.tf'
  ];

  test.each(requiredFiles)('%s file exists', (filename) => {
    const filePath = path.join(LIB_DIR, filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('all terraform files are non-empty', () => {
    requiredFiles.forEach((filename) => {
      const content = readHCLFile(filename);
      expect(content.length).toBeGreaterThan(0);
    });
  });
});

describe('Provider Configuration - provider.tf', () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readHCLFile('provider.tf');
  });

  test('contains terraform block', () => {
    expect(providerContent).toMatch(/terraform\s*{/);
  });

  test('specifies required AWS provider', () => {
    expect(providerContent).toMatch(/provider\s+"aws"/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test('has S3 backend configuration', () => {
    expect(providerContent).toMatch(/backend\s+"s3"/);
  });

  test('uses aws_region variable', () => {
    expect(providerContent).toMatch(/var\.aws_region/);
  });

  test('does NOT have hardcoded region', () => {
    expect(providerContent).not.toMatch(/region\s*=\s*"eu-central-1"/);
  });
});

describe('Variables Configuration - variables.tf', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readHCLFile('variables.tf');
  });

  test('declares aws_region variable', () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"/);
  });

  test('declares environment variable', () => {
    expect(variablesContent).toMatch(/variable\s+"environment"/);
  });

  test('declares environment_suffix variable', () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
  });

  test('declares services variable with proper structure', () => {
    expect(variablesContent).toMatch(/variable\s+"services"/);
    expect(variablesContent).toMatch(/cpu/);
    expect(variablesContent).toMatch(/memory/);
    expect(variablesContent).toMatch(/port/);
    expect(variablesContent).toMatch(/desired_count/);
    expect(variablesContent).toMatch(/health_check_path/);
  });

  test('has correct CPU and memory allocations', () => {
    // Web service: 256 CPU / 512 MB
    expect(variablesContent).toMatch(/cpu\s*=\s*256/);
    expect(variablesContent).toMatch(/memory\s*=\s*512/);
    // API service: 512 CPU / 1024 MB
    expect(variablesContent).toMatch(/cpu\s*=\s*512/);
    expect(variablesContent).toMatch(/memory\s*=\s*1024/);
    // Worker service: 1024 CPU / 2048 MB  
    expect(variablesContent).toMatch(/cpu\s*=\s*1024/);
    expect(variablesContent).toMatch(/memory\s*=\s*2048/);
  });

  test('declares log_retention_days variable', () => {
    expect(variablesContent).toMatch(/variable\s+"log_retention_days"/);
    expect(variablesContent).toMatch(/dev\s*=\s*7/);
    expect(variablesContent).toMatch(/prod\s*=\s*30/);
  });

  test('declares VPC and networking variables', () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_id"/);
    expect(variablesContent).toMatch(/variable\s+"private_subnet_ids"/);
    expect(variablesContent).toMatch(/variable\s+"alb_arn"/);
  });
});

describe('Main Configuration - main.tf', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readHCLFile('main.tf');
  });

  test('does NOT declare terraform block (should be in provider.tf only)', () => {
    expect(mainContent).not.toMatch(/terraform\s*{[\s\S]*required_version/);
  });

  test('does NOT declare provider block (should be in provider.tf only)', () => {
    expect(mainContent).not.toMatch(/provider\s+"aws"\s*{/);
  });

  test('creates ECS cluster', () => {
    expect(mainContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
  });

  test('ECS cluster has Container Insights enabled', () => {
    expect(mainContent).toMatch(/containerInsights/);
    expect(mainContent).toMatch(/enabled/);
  });

  test('configures FARGATE capacity providers', () => {
    expect(mainContent).toMatch(/resource\s+"aws_ecs_cluster_capacity_providers"/);
    expect(mainContent).toMatch(/FARGATE/);
  });

  test('uses environment_suffix in naming', () => {
    expect(mainContent).toMatch(/local\.cluster_name/);
  });

  test('applies common tags', () => {
    expect(mainContent).toMatch(/local\.common_tags/);
  });
});

describe('ECS Services Configuration - ecs_services.tf', () => {
  let ecsContent: string;

  beforeAll(() => {
    ecsContent = readHCLFile('ecs_services.tf');
  });

  test('creates task definitions for each service', () => {
    expect(ecsContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"services"/);
    expect(ecsContent).toMatch(/for_each\s*=\s*var\.services/);
  });

  test('uses Fargate launch type', () => {
    expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    expect(ecsContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
  });

  test('uses dynamic ECR image references', () => {
    expect(ecsContent).toMatch(/data\.aws_ecr_repository\.services/);
    expect(ecsContent).toMatch(/repository_url/);
  });

  test('configures SSM parameter secrets', () => {
    expect(ecsContent).toMatch(/secrets\s*=/);
    expect(ecsContent).toMatch(/data\.aws_ssm_parameter\.app_secrets/);
  });

  test('configures CloudWatch logging', () => {
    expect(ecsContent).toMatch(/logConfiguration/);
    expect(ecsContent).toMatch(/awslogs/);
    expect(ecsContent).toMatch(/aws_cloudwatch_log_group\.ecs/);
  });

  test('has lifecycle rules to prevent constant redeployments', () => {
    expect(ecsContent).toMatch(/lifecycle\s*{/);
    expect(ecsContent).toMatch(/ignore_changes/);
  });

  test('creates ECS services', () => {
    expect(ecsContent).toMatch(/resource\s+"aws_ecs_service"\s+"services"/);
  });

  test('prevents circular dependency with ALB', () => {
    expect(ecsContent).toMatch(/depends_on\s*=/);
    expect(ecsContent).toMatch(/aws_lb_target_group\.services/);
  });

  test('uses private subnets', () => {
    expect(ecsContent).toMatch(/subnets\s*=\s*var\.private_subnet_ids/);
  });

  test('does not assign public IPs', () => {
    expect(ecsContent).toMatch(/assign_public_ip\s*=\s*false/);
  });

  test('uses environment_suffix in naming', () => {
    expect(ecsContent).toMatch(/local\.env_suffix/);
  });
});

describe('IAM Configuration - iam.tf', () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = readHCLFile('iam.tf');
  });

  test('creates task execution roles', () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_execution"/);
  });

  test('creates task roles', () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
  });

  test('uses managed policies for execution role', () => {
    expect(iamContent).toMatch(/aws_iam_role_policy_attachment/);
    expect(iamContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
  });

  test('has SSM parameter access policy', () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"ecs_ssm"/);
    expect(iamContent).toMatch(/ssm:GetParameter/);
  });

  test('does NOT use wildcard in SSM policy', () => {
    const ssmPolicyMatch = iamContent.match(/resource\s+"aws_iam_policy"\s+"ecs_ssm"[\s\S]*?"aws_iam_policy"[\s\S]*?}/);
    if (ssmPolicyMatch) {
      expect(ssmPolicyMatch[0]).not.toMatch(/Resource.*\*/);
    }
  });

  test('has service-specific policies', () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"service_specific"/);
  });

  test('limits S3 access to specific paths', () => {
    expect(iamContent).toMatch(/s3:GetObject/);
    expect(iamContent).toMatch(/s3:PutObject/);
    expect(iamContent).toMatch(/\${each\.key}/);
  });

  test('uses environment_suffix in role names', () => {
    expect(iamContent).toMatch(/local\.env_suffix/);
  });
});

describe('Security Groups Configuration - security_groups.tf', () => {
  let sgContent: string;

  beforeAll(() => {
    sgContent = readHCLFile('security_groups.tf');
  });

  test('creates security groups for each service', () => {
    expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_services"/);
    expect(sgContent).toMatch(/for_each\s*=\s*var\.services/);
  });

  test('has ingress rules for services with ports', () => {
    expect(sgContent).toMatch(/resource\s+"aws_security_group_rule"\s+"ecs_ingress"/);
  });

  test('restricts ingress to ALB security group', () => {
    expect(sgContent).toMatch(/source_security_group_id/);
    expect(sgContent).toMatch(/data\.aws_lb\.main\.security_groups/);
  });

  test('has egress rules', () => {
    expect(sgContent).toMatch(/resource\s+"aws_security_group_rule"\s+"ecs_egress"/);
  });

  test('has lifecycle rules for security groups', () => {
    expect(sgContent).toMatch(/lifecycle\s*{/);
    expect(sgContent).toMatch(/create_before_destroy/);
  });
});

describe('CloudWatch Configuration - cloudwatch.tf', () => {
  let cwContent: string;

  beforeAll(() => {
    cwContent = readHCLFile('cloudwatch.tf');
  });

  test('creates log groups for each service', () => {
    expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
    expect(cwContent).toMatch(/for_each\s*=\s*local\.log_groups/);
  });

  test('implements environment-based retention policies', () => {
    expect(cwContent).toMatch(/retention_in_days/);
    expect(cwContent).toMatch(/var\.log_retention_days/);
    expect(cwContent).toMatch(/var\.environment/);
  });

  test('creates CloudWatch dashboard', () => {
    expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"ecs"/);
  });

  test('monitors CPU utilization', () => {
    expect(cwContent).toMatch(/CPUUtilization/);
  });

  test('monitors Memory utilization', () => {
    expect(cwContent).toMatch(/MemoryUtilization/);
  });

  test('uses correct AWS region variable', () => {
    expect(cwContent).toMatch(/var\.aws_region/);
  });
});

describe('ALB Configuration - alb.tf', () => {
  let albContent: string;

  beforeAll(() => {
    albContent = readHCLFile('alb.tf');
  });

  test('creates target groups for services with ports', () => {
    expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"services"/);
    expect(albContent).toMatch(/if\s+v\.port\s*>\s*0/);
  });

  test('configures target groups for IP target type', () => {
    expect(albContent).toMatch(/target_type\s*=\s*"ip"/);
  });

  test('has proper health check configuration', () => {
    expect(albContent).toMatch(/health_check\s*{/);
    expect(albContent).toMatch(/healthy_threshold\s*=\s*3/);
    expect(albContent).toMatch(/unhealthy_threshold\s*=\s*2/);
    expect(albContent).toMatch(/timeout\s*=\s*5/);
    expect(albContent).toMatch(/interval\s*=\s*30/);
  });

  test('has short deregistration delay', () => {
    expect(albContent).toMatch(/deregistration_delay\s*=\s*30/);
  });

  test('has lifecycle rules for target groups', () => {
    expect(albContent).toMatch(/lifecycle\s*{/);
    expect(albContent).toMatch(/create_before_destroy/);
  });

  test('creates listener rules', () => {
    expect(albContent).toMatch(/resource\s+"aws_lb_listener_rule"\s+"services"/);
  });

  test('uses path-based routing', () => {
    expect(albContent).toMatch(/path_pattern/);
  });
});

describe('Data Sources Configuration - data.tf', () => {
  let dataContent: string;

  beforeAll(() => {
    dataContent = readHCLFile('data.tf');
  });

  test('references ECR repositories dynamically', () => {
    expect(dataContent).toMatch(/data\s+"aws_ecr_repository"\s+"services"/);
  });

  test('references SSM parameters for secrets', () => {
    expect(dataContent).toMatch(/data\s+"aws_ssm_parameter"\s+"app_secrets"/);
    expect(dataContent).toMatch(/database_url/);
    expect(dataContent).toMatch(/api_key/);
    expect(dataContent).toMatch(/jwt_secret/);
  });

  test('gets current AWS account info', () => {
    expect(dataContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test('references existing VPC', () => {
    expect(dataContent).toMatch(/data\s+"aws_vpc"\s+"main"/);
  });

  test('references existing ALB', () => {
    expect(dataContent).toMatch(/data\s+"aws_lb"\s+"main"/);
  });

  test('references ALB listener', () => {
    expect(dataContent).toMatch(/data\s+"aws_lb_listener"\s+"main"/);
  });
});

describe('Locals Configuration - locals.tf', () => {
  let localsContent: string;

  beforeAll(() => {
    localsContent = readHCLFile('locals.tf');
  });

  test('defines common tags', () => {
    expect(localsContent).toMatch(/common_tags\s*=/);
    expect(localsContent).toMatch(/Environment/);
    expect(localsContent).toMatch(/ManagedBy/);
  });

  test('includes EnvironmentSuffix in tags', () => {
    expect(localsContent).toMatch(/EnvironmentSuffix/);
  });

  test('computes effective environment suffix', () => {
    expect(localsContent).toMatch(/env_suffix\s*=/);
    expect(localsContent).toMatch(/var\.environment_suffix/);
  });

  test('defines service-specific tags using merge', () => {
    expect(localsContent).toMatch(/service_tags\s*=/);
    expect(localsContent).toMatch(/merge\s*\(/);
  });

  test('defines cluster name with naming convention', () => {
    expect(localsContent).toMatch(/cluster_name\s*=/);
    expect(localsContent).toMatch(/env_suffix/);
  });

  test('defines log group names', () => {
    expect(localsContent).toMatch(/log_groups\s*=/);
  });

  test('defines ECR repository names', () => {
    expect(localsContent).toMatch(/ecr_repos\s*=/);
  });
});

describe('Outputs Configuration - outputs.tf', () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readHCLFile('outputs.tf');
  });

  test('outputs cluster name', () => {
    expect(outputsContent).toMatch(/output\s+"cluster_name"/);
  });

  test('outputs service names', () => {
    expect(outputsContent).toMatch(/output\s+"service_names"/);
  });

  test('outputs task definition ARNs', () => {
    expect(outputsContent).toMatch(/output\s+"task_definition_arns"/);
  });

  test('outputs log groups', () => {
    expect(outputsContent).toMatch(/output\s+"log_groups"/);
  });

  test('outputs security group IDs', () => {
    expect(outputsContent).toMatch(/output\s+"security_group_ids"/);
  });

  test('outputs target group ARNs', () => {
    expect(outputsContent).toMatch(/output\s+"target_group_arns"/);
  });

  test('outputs ECR repository URLs', () => {
    expect(outputsContent).toMatch(/output\s+"ecr_repository_urls"/);
  });
});

describe('Infrastructure Requirements Validation', () => {
  test('naming convention uses environment-service-resourcetype pattern', () => {
    const files = ['ecs_services.tf', 'iam.tf', 'security_groups.tf'];
    files.forEach((file) => {
      const content = readHCLFile(file);
      // Check that files use environment_suffix in naming
      expect(content).toMatch(/local\.env_suffix/);
      expect(content).toMatch(/var\.environment/);
    });
  });

  test('no hardcoded sensitive values', () => {
    const files = ['ecs_services.tf', 'iam.tf', 'data.tf'];
    files.forEach((file) => {
      const content = readHCLFile(file);
      // Check for common patterns of hardcoded secrets
      expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/api[_-]?key\s*=\s*"[^"]+"/i);
    });
  });

  test('uses Fargate exclusively (no EC2)', () => {
    const ecsContent = readHCLFile('ecs_services.tf');
    expect(ecsContent).toMatch(/FARGATE/);
    expect(ecsContent).not.toMatch(/EC2/);
    expect(ecsContent).not.toMatch(/launch_type\s*=\s*"EC2"/);
  });

  test('all files use consistent tagging', () => {
    const resourceFiles = ['main.tf', 'ecs_services.tf', 'iam.tf', 'security_groups.tf', 'cloudwatch.tf', 'alb.tf'];
    resourceFiles.forEach((file) => {
      const content = readHCLFile(file);
      if (content.includes('resource "aws_')) {
        expect(content).toMatch(/tags\s*=/);
      }
    });
  });

  test('total code is modular and under 1000 lines', () => {
    const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
    let totalLines = 0;
    files.forEach((file) => {
      const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      totalLines += content.split('\n').length;
    });
    expect(totalLines).toBeLessThan(1000);
  });
});

describe('Security Best Practices', () => {
  test('IAM policies follow least-privilege principle', () => {
    const iamContent = readHCLFile('iam.tf');
    // Check that policies are specific, not using wildcards excessively
    const wildcardResources = (iamContent.match(/Resource\s*=\s*"\*"/g) || []).length;
    expect(wildcardResources).toBe(0);
  });

  test('security groups have descriptive descriptions', () => {
    const sgContent = readHCLFile('security_groups.tf');
    expect(sgContent).toMatch(/description\s*=/);
  });

  test('ECS tasks do not have public IPs', () => {
    const ecsContent = readHCLFile('ecs_services.tf');
    expect(ecsContent).toMatch(/assign_public_ip\s*=\s*false/);
  });
});
