import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '../lib');

  describe('File Existence Tests', () => {
    test('provider.tf exists', () => {
      const providerTf = path.join(libDir, 'provider.tf');
      expect(fs.existsSync(providerTf)).toBe(true);
    });

    test('variables.tf exists', () => {
      const variablesTf = path.join(libDir, 'variables.tf');
      expect(fs.existsSync(variablesTf)).toBe(true);
    });

    test('main.tf exists', () => {
      const mainTf = path.join(libDir, 'main.tf');
      expect(fs.existsSync(mainTf)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsTf = path.join(libDir, 'outputs.tf');
      expect(fs.existsSync(outputsTf)).toBe(true);
    });
  });

  describe('Provider Configuration Tests', () => {
    test('provider.tf includes AWS provider', () => {
      const providerTf = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(providerTf).toMatch(/provider\s+"aws"/);
    });

    test('provider.tf includes backend configuration', () => {
      const providerTf = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(providerTf).toMatch(/backend\s+"s3"/);
    });

    test('provider.tf uses var.aws_region', () => {
      const providerTf = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(providerTf).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('provider.tf includes default tags', () => {
      const providerTf = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(providerTf).toMatch(/default_tags/);
    });
  });

  describe('Variables Configuration Tests', () => {
    test('variables.tf includes environment_suffix', () => {
      const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);
    });

    test('environment_suffix has validation', () => {
      const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesTf).toMatch(/validation\s*\{/);
    });

    test('variables.tf includes aws_region', () => {
      const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesTf).toMatch(/variable\s+"aws_region"/);
    });

    test('variables.tf includes vpc_cidr', () => {
      const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesTf).toMatch(/variable\s+"vpc_cidr"/);
    });

    test('variables.tf includes azs_count', () => {
      const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesTf).toMatch(/variable\s+"azs_count"/);
    });
  });

  describe('Resource Naming Tests', () => {
    test('all resources use environment_suffix in naming', () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));
      let foundEnvSuffix = false;

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        const resources = content.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];

        if (resources.length > 0) {
          if (content.includes('var.environment_suffix')) {
            foundEnvSuffix = true;
          }
        }
      });

      expect(foundEnvSuffix).toBe(true);
    });

    test('no hardcoded environment names in resource names', () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).not.toMatch(/Name\s*=\s*"[^"]*-prod-/);
        expect(content).not.toMatch(/Name\s*=\s*"[^"]*-dev-/);
        expect(content).not.toMatch(/Name\s*=\s*"[^"]*-staging-/);
      });
    });
  });

  describe('Destroyability Tests', () => {
    test('no prevent_destroy lifecycle policies', () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
      });
    });

    test('no deletion protection enabled', () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).not.toMatch(/enable_deletion_protection\s*=\s*true/);
        expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
      });
    });
  });

  describe('Main Infrastructure Tests', () => {
    test('main.tf includes VPC resource', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('main.tf includes Internet Gateway', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('main.tf includes public subnets', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('main.tf includes private subnets', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('main.tf includes NAT Gateways', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('main.tf includes KMS key', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_kms_key"/);
    });

    test('KMS key has auto-rotation enabled', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('VPC has DNS support enabled', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/enable_dns_support\s*=\s*true/);
      expect(mainTf).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('Subnets use availability zones from data source', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/data\s+"aws_availability_zones"/);
    });

    test('Route tables are properly configured', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('Route table associations are created', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_route_table_association"/);
    });
  });

  describe('Outputs Configuration Tests', () => {
    test('outputs.tf includes vpc_id output', () => {
      const outputsTf = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(outputsTf).toMatch(/output\s+"vpc_id"/);
    });

    test('outputs.tf includes subnet outputs', () => {
      const outputsTf = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(outputsTf).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsTf).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('outputs.tf includes KMS key outputs', () => {
      const outputsTf = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(outputsTf).toMatch(/output\s+"kms_key_id"/);
      expect(outputsTf).toMatch(/output\s+"kms_key_arn"/);
    });
  });

  describe('Data Source Tests', () => {
    test('main.tf includes aws_caller_identity data source', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/data\s+"aws_caller_identity"/);
    });

    test('main.tf includes aws_availability_zones data source', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/data\s+"aws_availability_zones"/);
    });
  });

  describe('Security Configuration Tests', () => {
    test('Network ACLs are configured', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/resource\s+"aws_network_acl"/);
    });

    test('KMS key has deletion window configured', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  describe('Resource Dependencies Tests', () => {
    test('NAT Gateway depends on Internet Gateway', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainTf).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Elastic IPs depend on Internet Gateway', () => {
      const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      const eipSection = mainTf.match(/resource\s+"aws_eip"[\s\S]*?(?=resource|$)/);
      expect(eipSection).toBeTruthy();
      if (eipSection) {
        expect(eipSection[0]).toMatch(/depends_on/);
      }
    });
  });

  describe('ECS Configuration Tests', () => {
    test('ecs.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'ecs.tf'))).toBe(true);
    });

    test('ECS cluster is configured', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/resource\s+"aws_ecs_cluster"/);
    });

    test('ECS cluster has Container Insights enabled', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/containerInsights/);
    });

    test('ECS task definition is configured', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/resource\s+"aws_ecs_task_definition"/);
    });

    test('ECS task uses Fargate', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/FARGATE/);
    });

    test('ECS service is configured', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/resource\s+"aws_ecs_service"/);
    });

    test('ECS service has auto-scaling configured', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/resource\s+"aws_appautoscaling_target"/);
      expect(ecsTf).toMatch(/resource\s+"aws_appautoscaling_policy"/);
    });

    test('ECS tasks are deployed in private subnets', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/aws_subnet\.private/);
    });

    test('ECS service uses environment_suffix in naming', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/var\.environment_suffix/);
    });

    test('ECS task definition specifies CPU and memory', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/var\.ecs_task_cpu/);
      expect(ecsTf).toMatch(/var\.ecs_task_memory/);
    });

    test('ECS service has CloudWatch logs configured', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      expect(ecsTf).toMatch(/awslogs/);
    });
  });

  describe('Aurora Database Tests', () => {
    test('aurora.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'aurora.tf'))).toBe(true);
    });

    test('Aurora cluster is configured', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/resource\s+"aws_rds_cluster"/);
    });

    test('Aurora uses PostgreSQL engine', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/aurora-postgresql/);
    });

    test('Aurora uses Serverless v2', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/serverlessv2/);
    });

    test('Aurora scaling configuration is defined', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/serverlessv2_scaling_configuration/);
      expect(auroraTf).toMatch(/var\.aurora_min_capacity/);
      expect(auroraTf).toMatch(/var\.aurora_max_capacity/);
    });

    test('Aurora uses KMS encryption', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/storage_encrypted\s*=\s*true/);
      expect(auroraTf).toMatch(/kms_key_id/);
    });

    test('Aurora has IAM database authentication enabled', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/iam_database_authentication_enabled\s*=\s*true/);
    });

    test('Aurora has backup retention configured', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test('Aurora cluster is deployed in multiple AZs', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/aws_subnet\.private/);
    });

    test('Aurora has skip_final_snapshot for destroyability', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('Aurora uses environment_suffix in naming', () => {
      const auroraTf = fs.readFileSync(path.join(libDir, 'aurora.tf'), 'utf8');
      expect(auroraTf).toMatch(/var\.environment_suffix/);
    });
  });

  describe('ALB Configuration Tests', () => {
    test('alb.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'alb.tf'))).toBe(true);
    });

    test('Application Load Balancer is configured', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test('ALB is deployed in public subnets', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/aws_subnet\.public/);
    });

    test('ALB target group is configured', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test('ALB listener is configured', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test('ALB has health checks configured', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/health_check/);
    });

    test('ALB uses environment_suffix in naming', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/var\.environment_suffix/);
    });

    test('ALB has logging enabled', () => {
      const albTf = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf8');
      expect(albTf).toMatch(/access_logs/);
    });
  });

  describe('S3 Configuration Tests', () => {
    test('s3.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 's3.tf'))).toBe(true);
    });

    test('S3 bucket for logs is configured', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test('S3 bucket for documents is configured', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/resource\s+"aws_s3_bucket"\s+"documents"/);
    });

    test('S3 bucket for static assets is configured', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/resource\s+"aws_s3_bucket"\s+"static_assets"/);
    });

    test('S3 buckets have force_destroy enabled', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      const forceDestroyCount = (s3Tf.match(/force_destroy\s*=\s*true/g) || []).length;
      expect(forceDestroyCount).toBeGreaterThanOrEqual(3);
    });

    test('S3 buckets have versioning enabled', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    });

    test('S3 buckets have KMS encryption', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(s3Tf).toMatch(/aws:kms/);
    });

    test('S3 buckets have public access blocked', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/aws_s3_bucket_public_access_block/);
      expect(s3Tf).toMatch(/block_public_acls\s*=\s*true/);
    });

    test('S3 buckets have lifecycle policies', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/aws_s3_bucket_lifecycle_configuration/);
      expect(s3Tf).toMatch(/GLACIER/);
    });

    test('S3 lifecycle rules have filter block', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      const lifecycleRules = s3Tf.match(/rule\s*\{[\s\S]*?filter\s*\{/g) || [];
      expect(lifecycleRules.length).toBeGreaterThanOrEqual(3);
    });

    test('S3 buckets use environment_suffix in naming', () => {
      const s3Tf = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Tf).toMatch(/var\.environment_suffix/);
    });
  });

  describe('CloudFront Configuration Tests', () => {
    test('cloudfront.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'cloudfront.tf'))).toBe(true);
    });

    test('CloudFront distribution is configured', () => {
      const cloudfrontTf = fs.readFileSync(path.join(libDir, 'cloudfront.tf'), 'utf8');
      expect(cloudfrontTf).toMatch(/resource\s+"aws_cloudfront_distribution"/);
    });

    test('CloudFront uses S3 as origin', () => {
      const cloudfrontTf = fs.readFileSync(path.join(libDir, 'cloudfront.tf'), 'utf8');
      expect(cloudfrontTf).toMatch(/origin/);
      expect(cloudfrontTf).toMatch(/aws_s3_bucket\.static_assets/);
    });

    test('CloudFront OAI is configured', () => {
      const cloudfrontTf = fs.readFileSync(path.join(libDir, 'cloudfront.tf'), 'utf8');
      expect(cloudfrontTf).toMatch(/aws_cloudfront_origin_access_identity/);
    });

    test('CloudFront has caching configured', () => {
      const cloudfrontTf = fs.readFileSync(path.join(libDir, 'cloudfront.tf'), 'utf8');
      expect(cloudfrontTf).toMatch(/default_cache_behavior/);
    });

    test('CloudFront uses environment_suffix in naming', () => {
      const cloudfrontTf = fs.readFileSync(path.join(libDir, 'cloudfront.tf'), 'utf8');
      expect(cloudfrontTf).toMatch(/var\.environment_suffix/);
    });
  });

  describe('WAF Configuration Tests', () => {
    test('waf.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'waf.tf'))).toBe(true);
    });

    test('WAF WebACL is configured', () => {
      const wafTf = fs.readFileSync(path.join(libDir, 'waf.tf'), 'utf8');
      expect(wafTf).toMatch(/resource\s+"aws_wafv2_web_acl"/);
    });

    test('WAF has SQL injection protection', () => {
      const wafTf = fs.readFileSync(path.join(libDir, 'waf.tf'), 'utf8');
      expect(wafTf).toMatch(/SqlInjection/i);
    });

    test('WAF has XSS protection', () => {
      const wafTf = fs.readFileSync(path.join(libDir, 'waf.tf'), 'utf8');
      expect(wafTf).toMatch(/XSS|CrossSiteScripting/i);
    });

    test('WAF uses environment_suffix in naming', () => {
      const wafTf = fs.readFileSync(path.join(libDir, 'waf.tf'), 'utf8');
      expect(wafTf).toMatch(/var\.environment_suffix/);
    });

    test('WAF is associated with ALB', () => {
      const wafTf = fs.readFileSync(path.join(libDir, 'waf.tf'), 'utf8');
      expect(wafTf).toMatch(/aws_wafv2_web_acl_association/);
      expect(wafTf).toMatch(/aws_lb\.main/);
    });
  });

  describe('EventBridge Configuration Tests', () => {
    test('eventbridge.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'eventbridge.tf'))).toBe(true);
    });

    test('EventBridge rule is configured', () => {
      const eventbridgeTf = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(eventbridgeTf).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
    });

    test('EventBridge uses cron expression', () => {
      const eventbridgeTf = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(eventbridgeTf).toMatch(/cron/);
    });

    test('EventBridge target is configured', () => {
      const eventbridgeTf = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(eventbridgeTf).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
    });

    test('EventBridge targets ECS task', () => {
      const eventbridgeTf = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(eventbridgeTf).toMatch(/ecs_target/);
    });

    test('EventBridge uses environment_suffix in naming', () => {
      const eventbridgeTf = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(eventbridgeTf).toMatch(/var\.environment_suffix/);
    });
  });

  describe('CloudWatch Configuration Tests', () => {
    test('cloudwatch.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'cloudwatch.tf'))).toBe(true);
    });

    test('CloudWatch log groups are configured (in ECS or CloudWatch)', () => {
      const ecsTf = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf8');
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      const hasLogGroups = ecsTf.includes('aws_cloudwatch_log_group') || cloudwatchTf.includes('aws_cloudwatch_log_group');
      expect(hasLogGroups).toBe(true);
    });

    test('CloudWatch dashboard is configured', () => {
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchTf).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
    });

    test('CloudWatch alarms are configured', () => {
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchTf).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('CloudWatch monitors ECS CPU', () => {
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchTf).toMatch(/CPUUtilization/);
    });

    test('CloudWatch monitors ECS memory', () => {
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchTf).toMatch(/MemoryUtilization/);
    });

    test('CloudWatch uses environment_suffix in naming', () => {
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchTf).toMatch(/var\.environment_suffix/);
    });

    test('SNS topic for alarms is configured', () => {
      const cloudwatchTf = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchTf).toMatch(/resource\s+"aws_sns_topic"/);
    });
  });

  describe('Security Configuration Tests', () => {
    test('security.tf file exists', () => {
      expect(fs.existsSync(path.join(libDir, 'security.tf'))).toBe(true);
    });

    test('Security groups are configured', () => {
      const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
      expect(securityTf).toMatch(/resource\s+"aws_security_group"/);
    });

    test('ALB security group allows HTTP/HTTPS', () => {
      const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
      expect(securityTf).toMatch(/from_port\s*=\s*80/);
      expect(securityTf).toMatch(/from_port\s*=\s*443/);
    });

    test('ECS security group is configured', () => {
      const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
      expect(securityTf).toMatch(/ecs/i);
    });

    test('Database security group is configured', () => {
      const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
      expect(securityTf).toMatch(/5432|postgres|database|aurora|rds/i);
    });

    test('Security groups use environment_suffix in naming', () => {
      const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
      expect(securityTf).toMatch(/var\.environment_suffix/);
    });

    test('ACM certificate is configured', () => {
      const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
      expect(securityTf).toMatch(/resource\s+"aws_acm_certificate"/);
    });
  });

  describe('Complete Infrastructure Tests', () => {
    test('All required Terraform files exist', () => {
      const requiredFiles = [
        'provider.tf', 'variables.tf', 'main.tf', 'outputs.tf',
        'security.tf', 'ecs.tf', 'alb.tf', 'aurora.tf', 's3.tf',
        'cloudfront.tf', 'waf.tf', 'eventbridge.tf', 'cloudwatch.tf'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(libDir, file))).toBe(true);
      });
    });

    test('All files use environment_suffix consistently', () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf') && f !== 'provider.tf');

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        if (content.includes('resource "aws_')) {
          expect(content).toMatch(/var\.environment_suffix/);
        }
      });
    });

    test('No resources have prevent_destroy enabled', () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
      });
    });

    test('All encryption uses KMS', () => {
      const files = ['s3.tf', 'aurora.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        if (content.includes('encryption') || content.includes('encrypted')) {
          expect(content).toMatch(/kms_key|kms_master_key/i);
        }
      });
    });
  });
});
