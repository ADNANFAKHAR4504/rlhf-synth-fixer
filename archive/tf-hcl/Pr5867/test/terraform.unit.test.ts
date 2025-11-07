import fs from 'fs';
import path from 'path';

describe('Payment Processing Infrastructure Unit Tests', () => {
  let tapStackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    const libDir = path.join(__dirname, '..', 'lib');
    tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    providerContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
  });

  describe('File Structure', () => {
    test('tap_stack.tf exists and is readable', () => {
      expect(tapStackContent).toBeDefined();
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test('variables.tf exists and is readable', () => {
      expect(variablesContent).toBeDefined();
      expect(variablesContent.length).toBeGreaterThan(0);
    });

    test('outputs.tf exists and is readable', () => {
      expect(outputsContent).toBeDefined();
      expect(outputsContent.length).toBeGreaterThan(0);
    });

    test('provider.tf exists and is readable', () => {
      expect(providerContent).toBeDefined();
      expect(providerContent.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is configured', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test('AWS provider uses variable region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('Terraform version constraint is specified', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=/);
    });

    test('AWS provider version is constrained', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"[\s\S]*?version\s*=\s*">=\s*5\.0"/);
    });

    test('S3 backend is configured', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });
  });

  describe('Data Sources', () => {
    test('AWS caller identity data source is defined', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('AWS region data source is defined', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('Route53 zone data source is conditionally defined', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_route53_zone"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });
  });

  describe('Variables Definition', () => {
    const requiredVariables = [
      'aws_region',
      'project_name',
      'environment',
      'cost_center',
      'vpc_cidr',
      'availability_zones',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'database_subnet_cidrs',
      'postgres_engine_version',
      'database_name',
      'db_username',
      'db_instance_class',
      'container_image',
      'container_port',
      'fargate_cpu',
      'fargate_memory',
      'desired_count',
      'min_capacity',
      'max_capacity',
      'health_check_path',
      'certificate_arn',
      'domain_name',
      'route53_weight',
      'create_www_record',
      'notification_email'
    ];

    requiredVariables.forEach(variableName => {
      test(`Variable "${variableName}" is defined`, () => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variableName}"`));
      });
    });

    test('Variables have descriptions', () => {
      const variableBlocks = variablesContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g);
      expect(variableBlocks).toBeDefined();
      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('Variables have type definitions', () => {
      const variableBlocks = variablesContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g);
      expect(variableBlocks).toBeDefined();
      variableBlocks.forEach(block => {
        expect(block).toMatch(/type\s*=/);
      });
    });

    test('Route53 weight variable has validation', () => {
      expect(variablesContent).toMatch(/validation\s*\{[^}]*condition[^}]*route53_weight/);
    });

    test('DB instance class variable has validation', () => {
      expect(variablesContent).toMatch(/validation\s*\{[^}]*condition[^}]*db_instance_class/);
    });
  });

  describe('KMS Configuration', () => {
    test('KMS key is defined for encryption', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"payment_processing"/);
    });

    test('KMS key has rotation enabled', () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS alias is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"payment_processing"/);
    });

    test('KMS key uses dynamic naming', () => {
      expect(tapStackContent).toMatch(/alias\/\$\{var\.project_name\}-\$\{var\.environment\}/);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC resource is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('VPC uses variable CIDR', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('VPC has DNS hostnames enabled', () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC has DNS support enabled', () => {
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });
  });

  describe('Subnet Configuration', () => {
    test('Public subnets are defined with count', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('Private subnets are defined with count', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('Database subnets are defined with count', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('Public subnets use variable CIDR blocks', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.public_subnet_cidrs\[count\.index\]/);
    });

    test('Private subnets use variable CIDR blocks', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidrs\[count\.index\]/);
    });

    test('Database subnets use variable CIDR blocks', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.database_subnet_cidrs\[count\.index\]/);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('EIP resources for NAT are defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('NAT Gateway resources are defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('NAT Gateway uses EIP allocation', () => {
      expect(tapStackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });
  });

  describe('Security Groups Configuration', () => {
    test('ALB security group is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('ECS security group is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"ecs"/);
    });

    test('RDS security group is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('Security groups use dynamic naming', () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}/);
    });

    test('Security groups have proper ingress rules', () => {
      expect(tapStackContent).toMatch(/ingress\s*\{[^}]*from_port/);
      expect(tapStackContent).toMatch(/ingress\s*\{[^}]*to_port/);
    });
  });

  describe('RDS Configuration', () => {
    test('DB subnet group is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test('RDS Aurora cluster is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"main"/);
    });

    test('RDS cluster instances are defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"main"/);
    });

    test('RDS cluster uses Aurora PostgreSQL engine', () => {
      expect(tapStackContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('RDS cluster uses variable engine version', () => {
      expect(tapStackContent).toMatch(/engine_version\s*=\s*var\.postgres_engine_version/);
    });

    test('RDS cluster has storage encryption enabled', () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('RDS cluster uses KMS encryption', () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.payment_processing\.arn/);
    });

    test('RDS instances use variable instance class', () => {
      expect(tapStackContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
    });

    test('RDS has performance insights enabled', () => {
      expect(tapStackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });
  });

  describe('IAM Configuration', () => {
    test('ECS execution role is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_execution_role"/);
    });

    test('ECS task role is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_role"/);
    });

    test('RDS monitoring role is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
    });

    test('IAM roles use dynamic naming', () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}/);
    });

    test('IAM role policy attachments are defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    });
  });

  describe('ECS Configuration', () => {
    test('ECS cluster is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
    });

    test('ECS task definition is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"main"/);
    });

    test('ECS service is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ecs_service"\s+"main"/);
    });

    test('ECS cluster has container insights enabled', () => {
      expect(tapStackContent).toMatch(/setting\s*\{\s*name\s*=\s*"containerInsights"\s*value\s*=\s*"enabled"/);
    });

    test('ECS task definition uses Fargate', () => {
      expect(tapStackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    });

    test('ECS task definition uses variable CPU and memory', () => {
      expect(tapStackContent).toMatch(/cpu\s*=\s*var\.fargate_cpu/);
      expect(tapStackContent).toMatch(/memory\s*=\s*var\.fargate_memory/);
    });

    test('ECS service uses variable desired count', () => {
      expect(tapStackContent).toMatch(/desired_count\s*=\s*var\.desired_count/);
    });

    test('ECS service runs in private subnets', () => {
      expect(tapStackContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Application Load Balancer is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test('ALB target group is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });

    test('HTTP listener is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
    });

    test('HTTPS listener is conditionally defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('ALB has deletion protection disabled', () => {
      expect(tapStackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('Target group uses variable health check path', () => {
      expect(tapStackContent).toMatch(/path\s*=\s*var\.health_check_path/);
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('Auto scaling target is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs_target"/);
    });

    test('Auto scaling policy is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_scale_up"/);
    });

    test('Auto scaling uses variable capacity limits', () => {
      expect(tapStackContent).toMatch(/max_capacity\s*=\s*var\.max_capacity/);
      expect(tapStackContent).toMatch(/min_capacity\s*=\s*var\.min_capacity/);
    });
  });

  describe('S3 Configuration', () => {
    test('S3 bucket for logs is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test('S3 bucket versioning is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    });

    test('S3 bucket encryption is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
    });

    test('S3 lifecycle configuration is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
    });

    test('S3 bucket uses random suffix', () => {
      expect(tapStackContent).toMatch(/random_id\.bucket_suffix\.hex/);
    });

    test('S3 lifecycle has 90-day retention', () => {
      expect(tapStackContent).toMatch(/days\s*=\s*90/);
    });
  });

  describe('Systems Manager Configuration', () => {
    test('SSM parameter for DB host is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_host"/);
    });

    test('SSM parameter for DB name is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_name"/);
    });

    test('SSM parameters use hierarchical naming', () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"\/\$\{var\.project_name\}\/\$\{var\.environment\}/);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('CloudWatch log group for ECS is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
    });

    test('CloudWatch alarms are defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_target_health"/);
    });

    test('SNS topic for alerts is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test('CloudWatch alarms use SNS topic', () => {
      expect(tapStackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });
  });

  describe('WAF Configuration', () => {
    test('WAF Web ACL is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test('WAF association with ALB is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });

    test('WAF has SQL injection protection', () => {
      expect(tapStackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });
  });

  describe('Route53 Configuration', () => {
    test('Route53 health check is conditionally defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"alb"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('Route53 weighted routing record is conditionally defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_record"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('Route53 CNAME record for www is conditionally defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route53_record"\s+"www"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.domain_name\s*!=\s*""\s*&&\s*var\.create_www_record\s*\?\s*1\s*:\s*0/);
    });

    test('Route53 weighted routing uses variable weight', () => {
      expect(tapStackContent).toMatch(/weight\s*=\s*var\.route53_weight/);
    });

    test('Route53 health check alarm is defined', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"route53_health_check"/);
    });
  });

  describe('Resource Tagging', () => {
    test('Resources use consistent tagging with variables', () => {
      const tagPattern = /tags\s*=\s*\{[^}]*Name\s*=.*Environment\s*=\s*var\.environment.*CostCenter\s*=\s*var\.cost_center/s;
      expect(tapStackContent).toMatch(tagPattern);
    });

    test('All major resources have Name tags with dynamic values', () => {
      const nameTagPattern = /Name\s*=\s*"\$\{var\.project_name\}/;
      expect(tapStackContent).toMatch(nameTagPattern);
    });

    test('All major resources have Environment tags', () => {
      const envTagPattern = /Environment\s*=\s*var\.environment/;
      expect(tapStackContent).toMatch(envTagPattern);
    });

    test('All major resources have CostCenter tags', () => {
      const costTagPattern = /CostCenter\s*=\s*var\.cost_center/;
      expect(tapStackContent).toMatch(costTagPattern);
    });
  });

  describe('Outputs Configuration', () => {
    const requiredOutputs = [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'database_subnet_ids',
      'rds_cluster_id',
      'rds_cluster_endpoint',
      'ecs_cluster_name',
      'ecs_service_name',
      'load_balancer_dns_name',
      'application_url',
      'application_http_url',
      'application_https_url',
      'kms_key_arn',
      'sns_topic_arn',
      'waf_web_acl_arn'
    ];

    requiredOutputs.forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });

    test('Outputs have descriptions', () => {
      const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*\{[^}]+\}/gs);
      expect(outputBlocks).toBeDefined();
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('Sensitive outputs are marked as sensitive', () => {
      expect(outputsContent).toMatch(/sensitive\s*=\s*true/);
    });

    test('Conditional outputs use proper ternary syntax', () => {
      expect(outputsContent).toMatch(/\?\s*.*:\s*"N\/A/);
    });
  });

  describe('Dynamic Configuration', () => {
    test('Configuration is region agnostic using data sources', () => {
      expect(tapStackContent).toMatch(/data\.aws_region\.current/);
      expect(tapStackContent).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
    });

    test('Availability zones use variable configuration', () => {
      expect(tapStackContent).toMatch(/var\.availability_zones\[count\.index\]/);
    });

    test('CIDR blocks are fully variable based', () => {
      expect(tapStackContent).toMatch(/var\.vpc_cidr/);
      expect(tapStackContent).toMatch(/var\.public_subnet_cidrs/);
      expect(tapStackContent).toMatch(/var\.private_subnet_cidrs/);
      expect(tapStackContent).toMatch(/var\.database_subnet_cidrs/);
    });

    test('No hardcoded resource names', () => {
      expect(tapStackContent).not.toMatch(/payment-processing-[a-z]/);
      expect(tapStackContent).toMatch(/\$\{var\.project_name\}/);
    });

    test('No hardcoded port numbers except for well-known ports', () => {
      const hardcodedPorts = tapStackContent.match(/from_port\s*=\s*\d+/g);
      if (hardcodedPorts) {
        hardcodedPorts.forEach(match => {
          const portMatch = match.match(/\d+/);
          if (portMatch) {
            const port = portMatch[0];
            // Allow well-known ports: 80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL), and 0 (all ports)
            expect(['0', '80', '443', '5432']).toContain(port);
          }
        });
      }
    });

    test('Container configuration uses variables', () => {
      expect(tapStackContent).toMatch(/var\.container_image/);
      expect(tapStackContent).toMatch(/var\.container_port/);
      expect(tapStackContent).toMatch(/var\.fargate_cpu/);
      expect(tapStackContent).toMatch(/var\.fargate_memory/);
    });
  });

  describe('Security Best Practices', () => {
    test('Database credentials use managed password', () => {
      expect(tapStackContent).toMatch(/manage_master_user_password\s*=\s*true/);
    });

    test('Security groups follow least privilege', () => {
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
    });

    test('ECS tasks run without public IP', () => {
      expect(tapStackContent).toMatch(/assign_public_ip\s*=\s*false/);
    });

    test('KMS keys have rotation enabled', () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('S3 bucket has versioning enabled', () => {
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  describe('Conditional Logic', () => {
    test('HTTPS listener is conditional on certificate', () => {
      expect(tapStackContent).toMatch(/var\.certificate_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('Route53 resources are conditional on domain', () => {
      expect(tapStackContent).toMatch(/var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('HTTP listener action is conditional', () => {
      expect(tapStackContent).toMatch(/type\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*"redirect"\s*:\s*"forward"/);
    });
  });
});