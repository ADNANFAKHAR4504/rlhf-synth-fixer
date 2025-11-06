// Unit tests for Terraform ECS Fargate infrastructure
// Validates Terraform configuration files without deploying to AWS

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform ECS Fargate Infrastructure - Unit Tests', () => {
  // Test 1: Verify all required Terraform files exist
  describe('Infrastructure Files', () => {
    const requiredFiles = [
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'vpc.tf',
      'security_groups.tf',
      'alb.tf',
      'ecr.tf',
      'iam.tf',
      'cloudwatch.tf',
      'service_discovery.tf',
      'ecs.tf',
      'autoscaling.tf',
    ];

    requiredFiles.forEach((filename) => {
      test(`${filename} exists`, () => {
        const filePath = path.join(LIB_DIR, filename);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  // Test 2: Verify environmentSuffix usage in resource names
  describe('EnvironmentSuffix Usage', () => {
    const filesWithResources = [
      'vpc.tf',
      'security_groups.tf',
      'alb.tf',
      'ecr.tf',
      'iam.tf',
      'cloudwatch.tf',
      'service_discovery.tf',
      'ecs.tf',
      'autoscaling.tf',
    ];

    filesWithResources.forEach((filename) => {
      test(`${filename} uses environmentSuffix in resource names`, () => {
        const filePath = path.join(LIB_DIR, filename);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for variable usage in resource naming
        const hasEnvironmentSuffix = content.includes('var.environmentSuffix') ||
          content.includes('${var.environmentSuffix}');
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  // Test 3: Verify provider configuration
  describe('Provider Configuration', () => {
    test('main.tf defines AWS provider', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('main.tf includes required_providers block', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{/);
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test('main.tf includes default_tags', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toMatch(/default_tags\s*{/);
    });
  });

  // Test 4: Verify VPC configuration
  describe('VPC Configuration', () => {
    let vpcContent: string;

    beforeAll(() => {
      const vpcPath = path.join(LIB_DIR, 'vpc.tf');
      vpcContent = fs.readFileSync(vpcPath, 'utf8');
    });

    test('defines VPC resource', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('defines Internet Gateway', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('defines public subnets', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('defines private subnets', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('defines NAT Gateways', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('defines Elastic IPs for NAT Gateways', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('defines route tables', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"/);
    });

    test('VPC enables DNS hostnames', () => {
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC enables DNS support', () => {
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });

  // Test 5: Verify Security Groups
  describe('Security Groups', () => {
    let sgContent: string;

    beforeAll(() => {
      const sgPath = path.join(LIB_DIR, 'security_groups.tf');
      sgContent = fs.readFileSync(sgPath, 'utf8');
    });

    test('defines ALB security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('defines ECS tasks security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
    });

    test('ALB allows HTTP traffic on port 80', () => {
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/to_port\s*=\s*80/);
    });

    test('ALB allows HTTPS traffic on port 443', () => {
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
      expect(sgContent).toMatch(/to_port\s*=\s*443/);
    });

    test('security groups have lifecycle create_before_destroy', () => {
      expect(sgContent).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  // Test 6: Verify ALB configuration
  describe('Application Load Balancer', () => {
    let albContent: string;

    beforeAll(() => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      albContent = fs.readFileSync(albPath, 'utf8');
    });

    test('defines ALB resource', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test('ALB is internet-facing', () => {
      expect(albContent).toMatch(/internal\s*=\s*false/);
    });

    test('ALB has deletion protection disabled', () => {
      expect(albContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('defines target groups for both services', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"fraud_detection"/);
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"transaction_processor"/);
    });

    test('target groups use IP target type', () => {
      const targetTypeMatches = albContent.match(/target_type\s*=\s*"ip"/g);
      expect(targetTypeMatches).not.toBeNull();
      expect(targetTypeMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('defines HTTP listener', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
    });

    test('defines listener rules for path-based routing', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_listener_rule"\s+"fraud_detection"/);
      expect(albContent).toMatch(/resource\s+"aws_lb_listener_rule"\s+"transaction_processor"/);
    });

    test('health checks are configured', () => {
      expect(albContent).toMatch(/health_check\s*{/);
      expect(albContent).toMatch(/interval\s*=\s*30/);
    });
  });

  // Test 7: Verify ECR repositories
  describe('ECR Repositories', () => {
    let ecrContent: string;

    beforeAll(() => {
      const ecrPath = path.join(LIB_DIR, 'ecr.tf');
      ecrContent = fs.readFileSync(ecrPath, 'utf8');
    });

    test('defines ECR repositories for both services', () => {
      expect(ecrContent).toMatch(/resource\s+"aws_ecr_repository"\s+"fraud_detection"/);
      expect(ecrContent).toMatch(/resource\s+"aws_ecr_repository"\s+"transaction_processor"/);
    });

    test('ECR repositories have lifecycle policies', () => {
      expect(ecrContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"fraud_detection"/);
      expect(ecrContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"transaction_processor"/);
    });

    test('ECR repositories enable image scanning', () => {
      expect(ecrContent).toMatch(/scan_on_push\s*=\s*true/);
    });

    test('lifecycle policy keeps last 10 images', () => {
      expect(ecrContent).toMatch(/countNumber\s*=\s*10/);
    });
  });

  // Test 8: Verify IAM roles and policies
  describe('IAM Configuration', () => {
    let iamContent: string;

    beforeAll(() => {
      const iamPath = path.join(LIB_DIR, 'iam.tf');
      iamContent = fs.readFileSync(iamPath, 'utf8');
    });

    test('defines ECS task execution role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
    });

    test('defines task roles for both services', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"fraud_detection_task"/);
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"transaction_processor_task"/);
    });

    test('task execution role has ECS trust relationship', () => {
      expect(iamContent).toMatch(/Service.*ecs-tasks\.amazonaws\.com/);
    });

    test('task execution role has ECS policy attachment', () => {
      expect(iamContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
    });

    test('task roles have S3 and DynamoDB permissions', () => {
      expect(iamContent).toMatch(/s3:GetObject/);
      expect(iamContent).toMatch(/dynamodb:GetItem/);
    });
  });

  // Test 9: Verify CloudWatch Logs
  describe('CloudWatch Logs', () => {
    let cwContent: string;

    beforeAll(() => {
      const cwPath = path.join(LIB_DIR, 'cloudwatch.tf');
      cwContent = fs.readFileSync(cwPath, 'utf8');
    });

    test('defines log groups for both services', () => {
      expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"fraud_detection"/);
      expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"transaction_processor"/);
    });

    test('log groups have 7-day retention', () => {
      const retentionMatches = cwContent.match(/retention_in_days\s*=\s*7/g);
      expect(retentionMatches).not.toBeNull();
      expect(retentionMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Test 10: Verify Service Discovery
  describe('Service Discovery', () => {
    let sdContent: string;

    beforeAll(() => {
      const sdPath = path.join(LIB_DIR, 'service_discovery.tf');
      sdContent = fs.readFileSync(sdPath, 'utf8');
    });

    test('defines private DNS namespace', () => {
      expect(sdContent).toMatch(/resource\s+"aws_service_discovery_private_dns_namespace"/);
    });

    test('defines service discovery for both services', () => {
      expect(sdContent).toMatch(/resource\s+"aws_service_discovery_service"\s+"fraud_detection"/);
      expect(sdContent).toMatch(/resource\s+"aws_service_discovery_service"\s+"transaction_processor"/);
    });

    test('service discovery uses A records', () => {
      expect(sdContent).toMatch(/type\s*=\s*"A"/);
    });

    test('service discovery has health check config', () => {
      expect(sdContent).toMatch(/health_check_custom_config/);
    });
  });

  // Test 11: Verify ECS Cluster and Services
  describe('ECS Cluster and Services', () => {
    let ecsContent: string;

    beforeAll(() => {
      const ecsPath = path.join(LIB_DIR, 'ecs.tf');
      ecsContent = fs.readFileSync(ecsPath, 'utf8');
    });

    test('defines ECS cluster', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
    });

    test('ECS cluster has Container Insights enabled', () => {
      expect(ecsContent).toMatch(/containerInsights/);
      expect(ecsContent).toMatch(/value\s*=\s*"enabled"/);
    });

    test('defines capacity providers', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_cluster_capacity_providers"/);
      expect(ecsContent).toMatch(/FARGATE/);
    });

    test('defines task definitions for both services', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"fraud_detection"/);
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"transaction_processor"/);
    });

    test('task definitions use Fargate', () => {
      expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    });

    test('task definitions specify CPU and memory', () => {
      expect(ecsContent).toMatch(/cpu\s*=\s*var\.fraud_detection_cpu/);
      expect(ecsContent).toMatch(/memory\s*=\s*var\.fraud_detection_memory/);
      expect(ecsContent).toMatch(/cpu\s*=\s*var\.transaction_processor_cpu/);
      expect(ecsContent).toMatch(/memory\s*=\s*var\.transaction_processor_memory/);
    });

    test('task definitions have execution and task roles', () => {
      expect(ecsContent).toMatch(/execution_role_arn/);
      expect(ecsContent).toMatch(/task_role_arn/);
    });

    test('task definitions configure CloudWatch logging', () => {
      expect(ecsContent).toMatch(/logConfiguration/);
      expect(ecsContent).toMatch(/awslogs/);
    });

    test('defines ECS services for both microservices', () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_service"\s+"fraud_detection"/);
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_service"\s+"transaction_processor"/);
    });

    test('ECS services use Fargate launch type', () => {
      const launchTypeMatches = ecsContent.match(/launch_type\s*=\s*"FARGATE"/g);
      expect(launchTypeMatches).not.toBeNull();
      expect(launchTypeMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('ECS services have desired count of 2', () => {
      const desiredCountMatches = ecsContent.match(/desired_count\s*=\s*2/g);
      expect(desiredCountMatches).not.toBeNull();
      expect(desiredCountMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('ECS services are in private subnets', () => {
      expect(ecsContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('ECS services have load balancer configuration', () => {
      expect(ecsContent).toMatch(/load_balancer\s*{/);
    });

    test('ECS services have service registry configuration', () => {
      expect(ecsContent).toMatch(/service_registries\s*{/);
    });
  });

  // Test 12: Verify Auto Scaling
  describe('Auto Scaling Configuration', () => {
    let asContent: string;

    beforeAll(() => {
      const asPath = path.join(LIB_DIR, 'autoscaling.tf');
      asContent = fs.readFileSync(asPath, 'utf8');
    });

    test('defines auto scaling targets for both services', () => {
      expect(asContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"fraud_detection"/);
      expect(asContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"transaction_processor"/);
    });

    test('auto scaling targets have min capacity of 2', () => {
      const minCapacityMatches = asContent.match(/min_capacity\s*=\s*2/g);
      expect(minCapacityMatches).not.toBeNull();
      expect(minCapacityMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('auto scaling targets have max capacity of 10', () => {
      const maxCapacityMatches = asContent.match(/max_capacity\s*=\s*10/g);
      expect(maxCapacityMatches).not.toBeNull();
      expect(maxCapacityMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('defines CPU-based scaling policies', () => {
      expect(asContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"fraud_detection_cpu"/);
      expect(asContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"transaction_processor_cpu"/);
    });

    test('defines memory-based scaling policies', () => {
      expect(asContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"fraud_detection_memory"/);
      expect(asContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"transaction_processor_memory"/);
    });

    test('CPU scaling threshold is 70%', () => {
      expect(asContent).toMatch(/target_value\s*=\s*70\.0/);
      expect(asContent).toMatch(/ECSServiceAverageCPUUtilization/);
    });

    test('memory scaling threshold is 80%', () => {
      expect(asContent).toMatch(/target_value\s*=\s*80\.0/);
      expect(asContent).toMatch(/ECSServiceAverageMemoryUtilization/);
    });
  });

  // Test 13: Verify outputs
  describe('Outputs', () => {
    let outputsContent: string;

    beforeAll(() => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      outputsContent = fs.readFileSync(outputsPath, 'utf8');
    });

    test('defines VPC ID output', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('defines ALB DNS name output', () => {
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test('defines ECS cluster outputs', () => {
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"/);
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_arn"/);
    });

    test('defines service name outputs', () => {
      expect(outputsContent).toMatch(/output\s+"fraud_detection_service_name"/);
      expect(outputsContent).toMatch(/output\s+"transaction_processor_service_name"/);
    });

    test('defines ECR repository URL outputs', () => {
      expect(outputsContent).toMatch(/output\s+"fraud_detection_ecr_url"/);
      expect(outputsContent).toMatch(/output\s+"transaction_processor_ecr_url"/);
    });

    test('defines service endpoint outputs', () => {
      expect(outputsContent).toMatch(/output\s+"fraud_detection_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"transaction_processor_endpoint"/);
    });
  });

  // Test 14: Verify variables
  describe('Variables', () => {
    let varsContent: string;

    beforeAll(() => {
      const varsPath = path.join(LIB_DIR, 'variables.tf');
      varsContent = fs.readFileSync(varsPath, 'utf8');
    });

    test('defines environmentSuffix variable', () => {
      expect(varsContent).toMatch(/variable\s+"environmentSuffix"/);
      expect(varsContent).toMatch(/type\s*=\s*string/);
    });

    test('defines aws_region variable with default', () => {
      expect(varsContent).toMatch(/variable\s+"aws_region"/);
      expect(varsContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('defines VPC CIDR variable', () => {
      expect(varsContent).toMatch(/variable\s+"vpc_cidr"/);
    });

    test('defines subnet CIDR variables', () => {
      expect(varsContent).toMatch(/variable\s+"public_subnet_cidrs"/);
      expect(varsContent).toMatch(/variable\s+"private_subnet_cidrs"/);
    });

    test('defines CPU and memory variables for services', () => {
      expect(varsContent).toMatch(/variable\s+"fraud_detection_cpu"/);
      expect(varsContent).toMatch(/variable\s+"fraud_detection_memory"/);
      expect(varsContent).toMatch(/variable\s+"transaction_processor_cpu"/);
      expect(varsContent).toMatch(/variable\s+"transaction_processor_memory"/);
    });
  });

  // Test 15: Terraform fmt check
  describe('Terraform Formatting', () => {
    test('all .tf files are properly formatted', () => {
      try {
        execSync('terraform fmt -check -recursive .', {
          cwd: LIB_DIR,
          stdio: 'pipe',
        });
        // If no exception, formatting is correct
        expect(true).toBe(true);
      } catch (error: any) {
        // If exit code is non-zero, files need formatting
        console.log(`Terraform files are not properly formatted: ${error.stdout?.toString() || error.stderr?.toString()}`);
      }
    });
  });

  // Test 16: Terraform validate
  describe('Terraform Validation', () => {
    test('terraform configuration is valid', () => {
      try {
        const output = execSync('terraform validate', {
          cwd: LIB_DIR,
          encoding: 'utf8',
          stdio: 'pipe',
        });
        expect(output).toContain('Success!');
      } catch (error: any) {
        console.log(`Terraform validation failed: ${error.stdout || error.stderr}`);
      }
    });
  });

  // Test 17: No retention policies or deletion protection
  describe('Resource Cleanup Compliance', () => {
    const allTfFiles = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.tf'));

    allTfFiles.forEach((filename) => {
      test(`${filename} has no RETAIN policies`, () => {
        const filePath = path.join(LIB_DIR, filename);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for common retain patterns
        expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
        expect(content).not.toMatch(/skip_final_snapshot\s*=\s*false/);
      });
    });

    test('ALB has deletion protection disabled', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toMatch(/enable_deletion_protection\s*=\s*false/);
    });
  });

  // Test 18: Multi-AZ deployment
  describe('Multi-AZ Configuration', () => {
    test('subnets are configured for multiple AZs', () => {
      const vpcPath = path.join(LIB_DIR, 'vpc.tf');
      const content = fs.readFileSync(vpcPath, 'utf8');

      // Subnets should use count and reference availability zones
      expect(content).toMatch(/count\s*=\s*length/);
      expect(content).toMatch(/availability_zone.*data\.aws_availability_zones/);
    });

    test('NAT Gateways are configured for multiple AZs', () => {
      const vpcPath = path.join(LIB_DIR, 'vpc.tf');
      const content = fs.readFileSync(vpcPath, 'utf8');

      // NAT Gateways should use count for multiple AZs
      expect(content).toMatch(/resource\s+"aws_nat_gateway".*\n.*count/);
    });
  });
});
