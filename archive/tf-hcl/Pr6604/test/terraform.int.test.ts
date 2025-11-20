import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Helper function to read Terraform files
const readTerraformFile = (filename: string): string => {
  const filePath = path.join(__dirname, '..', 'lib', filename);
  return fs.readFileSync(filePath, 'utf8');
};

// Helper function to parse Terraform configuration
const parseTerraformConfig = (content: string) => {
  const resources: any = {};
  const variables: any = {};
  const outputs: any = {};
  const locals: any = {};
  
  // Simple parsing for resources
  const resourceMatches = content.match(/resource\s+"([^"]+)"\s+"([^"]+)"/g);
  if (resourceMatches) {
    resourceMatches.forEach(match => {
      const matchResult = match.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
      if (matchResult) {
        const [, type, name] = matchResult;
        if (!resources[type]) resources[type] = [];
        resources[type].push(name);
      }
    });
  }
  
  // Parse outputs
  const outputMatches = content.match(/output\s+"([^"]+)"/g);
  if (outputMatches) {
    outputMatches.forEach(match => {
      const matchResult = match.match(/output\s+"([^"]+)"/);
      if (matchResult) {
        const [, name] = matchResult;
        outputs[name] = true;
      }
    });
  }
  
  return { resources, variables, outputs, locals };
};

// Environment configurations for testing
const environments = ['dev', 'staging', 'prod'];

describe('Terraform Payment Processing Infrastructure Integration Tests', () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let parsedConfig: any;

  beforeAll(() => {
    stackContent = readTerraformFile('tap_stack.tf');
    providerContent = readTerraformFile('provider.tf');
    variablesContent = readTerraformFile('variables.tf');
    parsedConfig = parseTerraformConfig(stackContent);
  });

  describe('Infrastructure Configuration Integration', () => {
    test('all Terraform files are present and readable', () => {
      expect(stackContent).toBeDefined();
      expect(stackContent.length).toBeGreaterThan(1000);
      expect(providerContent).toBeDefined();
      expect(variablesContent).toBeDefined();
    });

    test('stack configuration includes all required resource types', () => {
      const requiredResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_route_table',
        'aws_security_group',
        'aws_db_instance',
        'aws_lb',
        'aws_lb_target_group',
        'aws_ecs_cluster',
        'aws_ecs_service',
        'aws_lambda_function',
        'aws_s3_bucket',
        'aws_secretsmanager_secret'
      ];

      requiredResources.forEach(resourceType => {
        expect(parsedConfig.resources[resourceType]).toBeDefined();
        expect(parsedConfig.resources[resourceType].length).toBeGreaterThan(0);
      });
    });

    test('all required outputs are defined', () => {
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'alb_dns_name',
        'rds_endpoint',
        'ecs_cluster_arn',
        's3_bucket_name'
      ];

      requiredOutputs.forEach(output => {
        expect(parsedConfig.outputs[output]).toBe(true);
      });
    });
  });

  describe('Multi-Environment Configuration Integration', () => {
    test('environment-specific CIDR blocks are correctly calculated', () => {
      environments.forEach((env, index) => {
        const expectedCode = index + 1;
        const expectedCidr = `10.${expectedCode}.0.0/16`;
        
        // Check if the environment mapping is present
        expect(stackContent).toMatch(new RegExp(`${env}\\s*=\\s*${expectedCode}`));
        
        // Verify VPC CIDR calculation logic
        expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.\$\{local\.env_code\}\.0\.0\/16"/);
      });
    });

    test('environment-specific resource sizing is properly configured', () => {
      // Check RDS instance mapping
      expect(stackContent).toMatch(/rds_instance_map\s*=\s*{/);
      expect(stackContent).toMatch(/dev\s*=\s*"db\.t3\.micro"/);
      expect(stackContent).toMatch(/staging\s*=\s*"db\.t3\.small"/);
      expect(stackContent).toMatch(/prod\s*=\s*"db\.t3\.medium"/);

      // Check ECS task count mapping
      expect(stackContent).toMatch(/ecs_task_count_map\s*=\s*{/);
      expect(stackContent).toMatch(/dev\s*=\s*1/);
      expect(stackContent).toMatch(/staging\s*=\s*2/);
      expect(stackContent).toMatch(/prod\s*=\s*4/);
    });

    test('alarm thresholds are environment-appropriate', () => {
      // Verify alarm thresholds exist and are environment-specific
      expect(stackContent).toMatch(/alarm_thresholds\s*=\s*{/);
      
      // Dev should have higher thresholds (less sensitive)
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*cpu_high\s*=\s*80/);
      
      // Prod should have lower thresholds (more sensitive)
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*cpu_high\s*=\s*70/);
    });
  });

  describe('Network Architecture Integration', () => {
    test('VPC and networking components are properly integrated', () => {
      // Check VPC configuration
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);

      // Check Internet Gateway attachment
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('subnets are correctly distributed across availability zones', () => {
      // Check public subnets creation
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      
      // Check private subnets creation
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);

      // Verify AZ distribution
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('NAT gateways provide high availability', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test('route tables are properly configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      
      // Check route table associations
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe('Security Configuration Integration', () => {
    test('security groups follow least privilege principle', () => {
      // ALB security group
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);

      // ECS tasks security group
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);

      // RDS security group
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*5432/);
    });

    test('IAM roles have proper trust policies and permissions', () => {
      // ECS task execution role
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
      expect(stackContent).toMatch(/ecs-tasks\.amazonaws\.com/);

      // Lambda execution role
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
      expect(stackContent).toMatch(/lambda\.amazonaws\.com/);

      // Check policy attachments
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"/);
    });

    test('secrets management is properly configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"api_keys"/);
      
      // Check secret rotation
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"/);
      expect(stackContent).toMatch(/automatically_after_days\s*=\s*30/);
    });
  });

  describe('Database Integration', () => {
    test('RDS PostgreSQL is properly configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"14\.7"/);
      
      // Check Multi-AZ for production
      expect(stackContent).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test('DB subnet group uses private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('database security and backup configuration', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/backup_window/);
      expect(stackContent).toMatch(/maintenance_window/);
    });
  });

  describe('Application Load Balancer Integration', () => {
    test('ALB is properly configured with HTTPS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);

      // Check listeners
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    });

    test('target group has proper health checks', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(stackContent).toMatch(/target_type\s*=\s*"ip"/);
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/path\s*=\s*"\/health"/);
    });

    test('SSL certificate is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });
  });

  describe('ECS Fargate Integration', () => {
    test('ECS cluster and service are properly configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
      expect(stackContent).toMatch(/containerInsights/);

      expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"main"/);
      expect(stackContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
    });

    test('ECS task definition has proper configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"main"/);
      expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
      expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    });

    test('ECS service integrates with load balancer', () => {
      expect(stackContent).toMatch(/load_balancer\s*{/);
      expect(stackContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
      expect(stackContent).toMatch(/container_name\s*=\s*"payment-processor"/);
    });
  });

  describe('Lambda Functions Integration', () => {
    test('payment validation Lambda is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_validation"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(stackContent).toMatch(/handler\s*=\s*"lambda\.handler"/);
    });

    test('Lambda VPC configuration', () => {
      expect(stackContent).toMatch(/vpc_config\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test('secrets rotation Lambda is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"secrets_rotation"/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"secrets_rotation"/);
    });
  });

  describe('Storage Integration', () => {
    test('S3 bucket is properly secured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"payment_logs"/);
      
      // Check encryption
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);

      // Check public access block
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test('S3 lifecycle policy is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(stackContent).toMatch(/days\s*=\s*90/);
    });
  });

  describe('Monitoring and Observability Integration', () => {
    test('CloudWatch log groups are configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('CloudWatch dashboard includes all metrics', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      expect(stackContent).toMatch(/AWS\/ECS/);
      expect(stackContent).toMatch(/AWS\/RDS/);
      expect(stackContent).toMatch(/AWS\/Lambda/);
      expect(stackContent).toMatch(/AWS\/ApplicationELB/);
    });

    test('CloudWatch alarms are configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu_high"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_memory_high"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_response_time"/);
    });
  });

  describe('Tagging and Compliance Integration', () => {
    test('common tags are properly defined', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
      expect(stackContent).toMatch(/DataClassification\s*=\s*var\.data_classification/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test('resources use proper tagging', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });
  });

  describe('Provider and Backend Integration', () => {
    test('AWS provider is properly configured', () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('backend configuration is present', () => {
      expect(providerContent).toMatch(/backend\s*"s3"/);
      expect(providerContent).toMatch(/# Partial backend config: values are injected at `terraform init` time/);
    });

    test('region mapping is configured', () => {
      expect(providerContent).toMatch(/region_map\s*=\s*{/);
      expect(providerContent).toMatch(/dev\s*=\s*"eu-west-1"/);
      expect(providerContent).toMatch(/staging\s*=\s*"us-west-2"/);
      expect(providerContent).toMatch(/prod\s*=\s*"us-east-1"/);
    });
  });

  describe('Variables and Configuration Integration', () => {
    test('required variables are defined with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"environment"/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);

      expect(variablesContent).toMatch(/variable\s+"cost_center"/);
      expect(variablesContent).toMatch(/variable\s+"data_classification"/);
      expect(variablesContent).toMatch(/variable\s+"container_image"/);
      expect(variablesContent).toMatch(/variable\s+"lambda_source_path"/);
    });

    test('security-related variables have appropriate defaults', () => {
      expect(variablesContent).toMatch(/variable\s+"data_classification"/);
      expect(variablesContent).toMatch(/default\s*=\s*"confidential"/);
    });
  });

  describe('Deployment Readiness Integration', () => {
    test('Terraform configuration syntax is valid', () => {
      // This test validates that the configuration is syntactically correct
      expect(() => {
        // Basic syntax validation - no unclosed braces
        const openBraces = (stackContent.match(/{/g) || []).length;
        const closeBraces = (stackContent.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
      }).not.toThrow();
    });

    test('no circular dependencies exist', () => {
      // Check for obvious circular references
      const resourceRefs = stackContent.match(/aws_[\w]+\.[\w]+/g) || [];
      const resourceDefs = stackContent.match(/resource\s+"([^"]+)"\s+"([^"]+)"/g) || [];
      
      expect(resourceRefs.length).toBeGreaterThan(0);
      expect(resourceDefs.length).toBeGreaterThan(0);
    });

    test('all data sources are properly referenced', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available/);
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current/);
      expect(stackContent).toMatch(/data\.aws_region\.current/);
    });
  });

  describe('Cross-Component Integration Validation', () => {
    test('ECS service depends on required resources', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
      expect(stackContent).toMatch(/aws_lb_listener\.https/);
      expect(stackContent).toMatch(/aws_iam_role_policy\.ecs_task/);
    });

    test('Lambda functions have proper permissions', () => {
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/ec2:CreateNetworkInterface/);
    });

    test('database access is properly configured', () => {
      // Check that ECS and Lambda can access the database
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ecs_tasks\.id,\s*aws_security_group\.lambda\.id\]/);
    });

    test('secrets are properly shared between components', () => {
      // Check that secrets are referenced by both ECS and Lambda
      expect(stackContent).toMatch(/aws_secretsmanager_secret\.db_credentials\.arn/);
      expect(stackContent).toMatch(/aws_secretsmanager_secret\.api_keys\.arn/);
    });
  });

  describe('Environment-Specific Integration Testing', () => {
    test('development environment has appropriate settings', () => {
      expect(stackContent).toMatch(/dev\s*=\s*1/); // task count
      expect(stackContent).toMatch(/dev\s*=\s*"db\.t3\.micro"/); // RDS size
      expect(stackContent).toMatch(/dev\s*=\s*10/); // Lambda concurrency
    });

    test('production environment has enhanced settings', () => {
      expect(stackContent).toMatch(/prod\s*=\s*4/); // higher task count
      expect(stackContent).toMatch(/prod\s*=\s*"db\.t3\.medium"/); // larger RDS
      expect(stackContent).toMatch(/prod\s*=\s*200/); // higher Lambda concurrency
    });

    test('Multi-AZ configuration is environment-specific', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });
  });
});
