import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const libPath = join(__dirname, '../lib');

// Helper function to read all Terraform files
function readTerraformFiles(): string {
  const tfFiles = readdirSync(libPath).filter(file => file.endsWith('.tf'));
  return tfFiles
    .map(file => {
      const path = join(libPath, file);
      return existsSync(path) ? readFileSync(path, 'utf-8') : '';
    })
    .join('\n');
}

const terraformCode = readTerraformFiles();

describe('Terraform Infrastructure Unit Tests - ECS Fargate Application', () => {

  describe('File Structure', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'provider.tf', 'variables.tf', 'locals.tf', 'main.tf',
        'networking.tf', 'security.tf', 'ecr.tf', 'iam.tf',
        'database.tf', 'secrets.tf', 'compute.tf', 'alb.tf',
        'dns.tf', 'monitoring.tf', 'autoscaling.tf', 'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const path = join(libPath, file);
        expect(existsSync(path)).toBe(true);
      });
    });

    test('should not have provider block outside provider.tf', () => {
      const filesExceptProvider = readdirSync(libPath)
        .filter(file => file.endsWith('.tf') && file !== 'provider.tf')
        .map(file => readFileSync(join(libPath, file), 'utf-8'))
        .join('\n');

      expect(filesExceptProvider).not.toMatch(/provider\s+"aws"\s*{/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable', () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('should define environment_suffix variable', () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('should define create_vpc variable with default true', () => {
      expect(terraformCode).toMatch(/variable\s+"create_vpc"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*true/);
    });

    test('should define enable_https variable with default false', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_https"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*false/);
    });

    test('should define enable_route53 variable with default false', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_route53"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*false/);
    });

    test('should define vpc_cidr variable', () => {
      expect(terraformCode).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test('should define availability_zones_count variable', () => {
      expect(terraformCode).toMatch(/variable\s+"availability_zones_count"\s*{/);
    });

    test('should define database variables', () => {
      expect(terraformCode).toMatch(/variable\s+"database_name"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"database_master_username"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"db_instance_class"\s*{/);
    });

    test('should define ECS task configuration variables', () => {
      expect(terraformCode).toMatch(/variable\s+"task_cpu"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"task_memory"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*"4096"/);
      expect(terraformCode).toMatch(/default\s*=\s*"8192"/);
    });

    test('should define auto-scaling variables', () => {
      expect(terraformCode).toMatch(/variable\s+"min_tasks"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"max_tasks"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"cpu_target_value"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*3/);
      expect(terraformCode).toMatch(/default\s*=\s*15/);
      expect(terraformCode).toMatch(/default\s*=\s*70/);
    });
  });

  describe('Data Sources', () => {
    test('should define aws_caller_identity data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should define aws_availability_zones data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('should define aws_elb_service_account data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_elb_service_account"/);
    });
  });

  describe('Locals and Random Resources', () => {
    test('should define locals block with environment_suffix', () => {
      expect(terraformCode).toMatch(/locals\s*{/);
      expect(terraformCode).toMatch(/environment_suffix/);
    });

    test('should define random_string for environment suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"suffix"/);
    });

    test('should compute name_prefix in locals', () => {
      expect(terraformCode).toMatch(/name_prefix/);
    });
  });

  describe('Networking Resources', () => {
    test('should define VPC resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('should define Internet Gateway', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should define public subnets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('should define private subnets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should define NAT gateways', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(terraformCode).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should define route tables', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(terraformCode).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('should define VPC endpoints for ECR', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"/);
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"/);
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
    });

    test('should define VPC endpoints for CloudWatch and Secrets Manager', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_endpoint"\s+"logs"/);
      expect(terraformCode).toMatch(/resource\s+"aws_vpc_endpoint"\s+"secretsmanager"/);
    });
  });

  describe('ECR Resources', () => {
    test('should define ECR repository', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_repository"\s+"app"/);
    });

    test('should enable image scanning on ECR', () => {
      expect(terraformCode).toMatch(/image_scanning_configuration/);
      expect(terraformCode).toMatch(/scan_on_push\s*=\s*true/);
    });

    test('should define ECR lifecycle policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"app"/);
    });

    test('should define ECR repository policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_repository_policy"\s+"app"/);
    });
  });

  describe('Security Groups', () => {
    test('should define ALB security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('should allow HTTP and HTTPS on ALB security group', () => {
      const albSgMatch = terraformCode.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]{0,1000}/);
      expect(albSgMatch).toBeTruthy();
      expect(terraformCode).toMatch(/from_port\s*=\s*80/);
      expect(terraformCode).toMatch(/from_port\s*=\s*443/);
    });

    test('should define ECS tasks security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
    });

    test('should allow traffic from ALB to ECS on port 8080', () => {
      expect(terraformCode).toMatch(/from_port\s*=\s*8080/);
      expect(terraformCode).toMatch(/to_port\s*=\s*8080/);
    });

    test('should define RDS security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('should allow PostgreSQL traffic on port 5432', () => {
      expect(terraformCode).toMatch(/from_port\s*=\s*5432/);
      expect(terraformCode).toMatch(/to_port\s*=\s*5432/);
    });

    test('should define VPC endpoints security group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should define ECS task execution role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
    });

    test('should define ECS task role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
    });

    test('should define RDS monitoring role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
    });

    test('should not use wildcard (*) for resource ARNs in custom policies', () => {
      const customPolicies = terraformCode.match(/resource\s+"aws_iam_role_policy"[\s\S]+?policy\s*=\s*jsonencode\([\s\S]+?\}\)/g) || [];
      customPolicies.forEach(policy => {
        // Allow wildcard only for ecr:GetAuthorizationToken which requires it
        if (!policy.includes('GetAuthorizationToken')) {
          const resourceMatches = policy.match(/"Resource"\s*[=:]\s*\[[\s\S]*?\]/g) || [];
          resourceMatches.forEach(resource => {
            if (!resource.includes('GetAuthorizationToken')) {
              expect(resource).not.toMatch(/"Resource"\s*[=:]\s*\[\s*"\*"\s*\]/);
            }
          });
        }
      });
    });

    test('should use specific secret ARNs in IAM policies', () => {
      expect(terraformCode).toMatch(/aws_secretsmanager_secret\.rds_credentials\.arn/);
      expect(terraformCode).toMatch(/aws_secretsmanager_secret\.app_secrets\.arn/);
    });
  });

  describe('RDS Aurora Resources', () => {
    test('should define RDS subnet group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"/);
    });

    test('should define RDS Aurora cluster', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
      expect(terraformCode).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('should allow configurable Aurora PostgreSQL engine version', () => {
      expect(terraformCode).toMatch(/engine_version\s*=\s*var\.aurora_engine_version\s*==\s*""\s*\?\s*null\s*:\s*var\.aurora_engine_version/);
    });

    test('should enable storage encryption', () => {
      expect(terraformCode).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should have 7-day backup retention', () => {
      expect(terraformCode).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test('should skip final snapshot for testing', () => {
      expect(terraformCode).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('should define writer and reader instances', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_writer"/);
      expect(terraformCode).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_reader"/);
    });

    test('should use conditional Performance Insights', () => {
      const writerMatch = terraformCode.match(/resource\s+"aws_rds_cluster_instance"\s+"aurora_writer"[\s\S]{0,500}/);
      expect(writerMatch).toBeTruthy();
      expect(terraformCode).toMatch(/performance_insights_enabled\s*=\s*can\(regex/);
    });

    test('should define KMS key for RDS', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(terraformCode).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe('Secrets Manager', () => {
    test('should define RDS credentials secret', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
    });

    test('should define secret version with connection details', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
      expect(terraformCode).toMatch(/username/);
      expect(terraformCode).toMatch(/password/);
      expect(terraformCode).toMatch(/host/);
      expect(terraformCode).toMatch(/connection_string/);
    });

    test('should generate random password for RDS via Secrets Manager data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_secretsmanager_random_password"\s+"rds_password"/);
      expect(terraformCode).toMatch(/password_length\s*=\s*32/);
      expect(terraformCode).toContain('exclude_characters  = "/@\\" "');
    });

    test('should define app secrets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"app_secrets"/);
    });
  });

  describe('ECS Resources', () => {
    test('should define ECS cluster', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
    });

    test('should enable Container Insights', () => {
      expect(terraformCode).toMatch(/containerInsights/);
      expect(terraformCode).toMatch(/value\s*=\s*"enabled"/);
    });

    test('should define ECS task definition', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"/);
    });

    test('should use awsvpc network mode', () => {
      expect(terraformCode).toMatch(/network_mode\s*=\s*"awsvpc"/);
    });

    test('should use FARGATE launch type', () => {
      expect(terraformCode).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    });

    test('should reference ECR repository', () => {
      expect(terraformCode).toMatch(/aws_ecr_repository\.app\.repository_url/);
    });

    test('should define ECS service', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecs_service"\s+"app"/);
    });

    test('should have ECS service with enable_execute_command', () => {
      expect(terraformCode).toMatch(/enable_execute_command\s*=\s*true/);
    });
  });

  describe('ALB Resources', () => {
    test('should define Application Load Balancer', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(terraformCode).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('should disable deletion protection', () => {
      expect(terraformCode).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('should define S3 bucket for ALB logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
    });

    test('should enable S3 bucket versioning', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"alb_logs"/);
      expect(terraformCode).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should enable S3 bucket encryption', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"alb_logs"/);
      expect(terraformCode).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('should block public access on S3 bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"alb_logs"/);
      expect(terraformCode).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('should define blue and green target groups', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
      expect(terraformCode).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
    });

    test('should configure health checks on /health endpoint', () => {
      expect(terraformCode).toMatch(/path\s*=\s*"\/health"/);
      expect(terraformCode).toMatch(/interval\s*=\s*30/);
    });

    test('should define HTTP listener', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(terraformCode).toMatch(/port\s*=\s*"80"/);
    });

    test('should define conditional HTTPS listener', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.enable_https/);
    });

    test('should define WAF web ACL', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test('should include AWS managed rule sets in WAF', () => {
      expect(terraformCode).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(terraformCode).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('should include rate limiting in WAF', () => {
      expect(terraformCode).toMatch(/rate_based_statement/);
      expect(terraformCode).toMatch(/limit\s*=\s*10000/);
    });

    test('should associate WAF with ALB', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });
  });

  describe('Auto-scaling Resources', () => {
    test('should define auto-scaling target', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs"/);
    });

    test('should define CPU-based scaling policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_cpu"/);
      expect(terraformCode).toMatch(/ECSServiceAverageCPUUtilization/);
    });

    test('should define memory-based scaling policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_memory"/);
      expect(terraformCode).toMatch(/ECSServiceAverageMemoryUtilization/);
    });

    test('should define request count scaling policy', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_alb_request_count"/);
      expect(terraformCode).toMatch(/ALBRequestCountPerTarget/);
    });
  });

  describe('Monitoring Resources', () => {
    test('should define CloudWatch log group', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs_tasks"/);
      expect(terraformCode).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('should define CloudWatch dashboard', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test('should define CloudWatch alarms', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu_high"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_target_health"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"/);
    });

    test('should define SNS topic for alerts', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });
  });

  describe('DNS Resources', () => {
    test('should define conditional Route53 record', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route53_record"\s+"app"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.enable_route53/);
    });

    test('should define conditional Route53 health check', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route53_health_check"\s+"app"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.enable_route53/);
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('should use local.name_prefix extensively for resource naming', () => {
      const namePrefixMatches = (terraformCode.match(/\$\{local\.name_prefix\}/g) || []).length;
      // Should have at least 30 occurrences across all resources
      expect(namePrefixMatches).toBeGreaterThan(30);
    });

    test('should define environment_suffix computation in locals', () => {
      expect(terraformCode).toMatch(/environment_suffix\s*=\s*var\.environment_suffix/);
      expect(terraformCode).toMatch(/name_prefix\s*=.*local\.environment_suffix/);
    });

    test('should use local.name_prefix in critical resources', () => {
      expect(terraformCode).toMatch(/\$\{local\.name_prefix\}-cluster/); // ECS cluster
      expect(terraformCode).toMatch(/\$\{local\.name_prefix\}-alb/); // ALB
      expect(terraformCode).toMatch(/\$\{local\.name_prefix\}-aurora-cluster/); // RDS
      expect(terraformCode).toMatch(/\$\{local\.name_prefix\}-app/); // ECR
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const requiredOutputs = [
        'vpc_id', 'ecr_repository_url', 'alb_dns_name', 'alb_url',
        'ecs_cluster_id', 'ecs_service_name', 'rds_cluster_endpoint',
        'cloudwatch_log_group', 'blue_target_group_arn', 'green_target_group_arn',
        'environment_suffix', 'aws_region'
      ];

      requiredOutputs.forEach(output => {
        expect(terraformCode).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test('should define conditional Route53 outputs', () => {
      expect(terraformCode).toMatch(/output\s+"route53_record_fqdn"/);
      expect(terraformCode).toMatch(/var\.enable_route53\s*\?/);
    });
  });

  describe('Common Tags', () => {
    test('should use common_tags variable', () => {
      expect(terraformCode).toMatch(/variable\s+"common_tags"\s*{/);
    });

    test('should merge tags in locals', () => {
      expect(terraformCode).toMatch(/merge\(/);
      expect(terraformCode).toMatch(/local\.common_tags/);
    });
  });
});
