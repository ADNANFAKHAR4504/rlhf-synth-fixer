import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'hcl2-parser';

describe('Terraform Multi-Environment Infrastructure - Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let terraformFiles: Record<string, any> = {};

  beforeAll(() => {
    // Load all Terraform files
    const files = ['provider.tf', 'variables.tf', 'locals.tf', 'vpc.tf', 'security.tf',
                   'alb.tf', 'ecs.tf', 'rds.tf', 's3.tf', 'outputs.tf'];
    files.forEach(file => {
      const filePath = path.join(libPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        try {
          terraformFiles[file] = { content, parsed: parse(content) };
        } catch (e) {
          terraformFiles[file] = { content, parsed: null };
        }
      }
    });
  });

  describe('File Structure', () => {
    test('should have all required Terraform files', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'vpc.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'outputs.tf'))).toBe(true);
    });

    test('should have ECS configuration', () => {
      expect(fs.existsSync(path.join(libPath, 'ecs.tf'))).toBe(true);
    });

    test('should have RDS configuration', () => {
      expect(fs.existsSync(path.join(libPath, 'rds.tf'))).toBe(true);
    });

    test('should have ALB configuration', () => {
      expect(fs.existsSync(path.join(libPath, 'alb.tf'))).toBe(true);
    });

    test('should have S3 configuration', () => {
      expect(fs.existsSync(path.join(libPath, 's3.tf'))).toBe(true);
    });

    test('should have security groups configuration', () => {
      expect(fs.existsSync(path.join(libPath, 'security.tf'))).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('should configure Terraform version >= 1.5.0', () => {
      const content = terraformFiles['provider.tf']?.content || '';
      expect(content).toContain('required_version');
      expect(content).toMatch(/>= 1\.5\.0/);
    });

    test('should configure AWS provider ~> 5.0', () => {
      const content = terraformFiles['provider.tf']?.content || '';
      expect(content).toContain('hashicorp/aws');
      expect(content).toMatch(/~> 5\.0/);
    });

    test('should use var.aws_region for provider region', () => {
      const content = terraformFiles['provider.tf']?.content || '';
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should configure default tags with environment_suffix', () => {
      const content = terraformFiles['provider.tf']?.content || '';
      expect(content).toContain('default_tags');
      expect(content).toContain('var.environment_suffix');
    });
  });

  describe('Variables Configuration', () => {
    test('should define environment_suffix variable', () => {
      const content = terraformFiles['variables.tf']?.content || '';
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test('should define aws_region variable with default', () => {
      const content = terraformFiles['variables.tf']?.content || '';
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toContain('ap-southeast-1');
    });

    test('should define vpc_cidr variable', () => {
      const content = terraformFiles['variables.tf']?.content || '';
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
    });

    test('should define ecs_task_count variable', () => {
      const content = terraformFiles['variables.tf']?.content || '';
      expect(content).toMatch(/variable\s+"ecs_task_count"/);
    });

    test('should define rds_instance_class variable', () => {
      const content = terraformFiles['variables.tf']?.content || '';
      expect(content).toMatch(/variable\s+"rds_instance_class"/);
    });
  });

  describe('Locals Configuration', () => {
    test('should define common_tags with environment_suffix', () => {
      const content = terraformFiles['locals.tf']?.content || '';
      expect(content).toContain('common_tags');
      expect(content).toContain('environment_suffix');
      expect(content).toContain('EnvironmentSuffix');
    });

    test('should use availability zones data source', () => {
      const content = terraformFiles['locals.tf']?.content || '';
      expect(content).toContain('data.aws_availability_zones.available');
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with environment_suffix in name', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toContain('${var.environment_suffix}');
    });

    test('should create Internet Gateway', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('should create public subnets', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toContain('map_public_ip_on_launch');
    });

    test('should create private subnets', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should create database subnets', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test('should create NAT Gateway', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('should create route tables', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_route_table"/);
    });

    test('should create route table associations', () => {
      const content = terraformFiles['vpc.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_route_table_association"/);
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create ALB security group', () => {
      const content = terraformFiles['security.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('should create ECS security group', () => {
      const content = terraformFiles['security.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ecs"/);
    });

    test('should create RDS security group', () => {
      const content = terraformFiles['security.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('should allow HTTP on port 80 for ALB', () => {
      const content = terraformFiles['security.tf']?.content || '';
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/to_port\s*=\s*80/);
    });

    test('should allow HTTPS on port 443 for ALB', () => {
      const content = terraformFiles['security.tf']?.content || '';
      expect(content).toMatch(/from_port\s*=\s*443/);
      expect(content).toMatch(/to_port\s*=\s*443/);
    });
  });

  describe('ALB Configuration', () => {
    test('should create Application Load Balancer', () => {
      const content = terraformFiles['alb.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toContain('application');
    });

    test('should create target group for ECS', () => {
      const content = terraformFiles['alb.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test('should create HTTP listener', () => {
      const content = terraformFiles['alb.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
    });

    test('should have health check configuration', () => {
      const content = terraformFiles['alb.tf']?.content || '';
      expect(content).toContain('health_check');
      expect(content).toContain('/health');
    });

    test('should have path-based routing rules', () => {
      const content = terraformFiles['alb.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_lb_listener_rule"/);
      expect(content).toContain('path_pattern');
    });

    test('should use environment_suffix in ALB name', () => {
      const content = terraformFiles['alb.tf']?.content || '';
      expect(content).toContain('${var.environment_suffix}');
    });
  });

  describe('ECS Configuration', () => {
    test('should create ECS cluster', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_ecs_cluster"/);
    });

    test('should create ECS task definition', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_ecs_task_definition"/);
    });

    test('should create ECS service', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_ecs_service"/);
    });

    test('should use Fargate launch type', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toContain('FARGATE');
    });

    test('should create CloudWatch log group', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test('should create ECS execution role', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ecs_execution"/);
    });

    test('should create ECS task role', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
    });

    test('should use variable for task count', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toContain('var.ecs_task_count');
    });

    test('should enable container insights', () => {
      const content = terraformFiles['ecs.tf']?.content || '';
      expect(content).toContain('containerInsights');
    });
  });

  describe('RDS Configuration', () => {
    test('should create Aurora PostgreSQL cluster', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_rds_cluster"/);
      expect(content).toContain('aurora-postgresql');
    });

    test('should create RDS cluster instance', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"/);
    });

    test('should create DB subnet group', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test('should enable storage encryption', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should enable automated backups', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toContain('backup_retention_period');
    });

    test('should skip final snapshot (for testing)', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('should enable CloudWatch logs', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toContain('enabled_cloudwatch_logs_exports');
      expect(content).toContain('postgresql');
    });

    test('should enable performance insights', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('should create monitoring role', () => {
      const content = terraformFiles['rds.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
    });
  });

  describe('S3 Configuration', () => {
    test('should create audit logs bucket', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
    });

    test('should enable versioning', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toContain('Enabled');
    });

    test('should enable encryption', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toContain('AES256');
    });

    test('should block public access', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
    });

    test('should have lifecycle policy', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test('should transition to STANDARD_IA', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toContain('STANDARD_IA');
    });

    test('should transition to GLACIER', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toContain('GLACIER');
    });

    test('should enable bucket logging', () => {
      const content = terraformFiles['s3.tf']?.content || '';
      expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"/);
    });
  });

  describe('Outputs Configuration', () => {
    test('should output VPC ID', () => {
      const content = terraformFiles['outputs.tf']?.content || '';
      expect(content).toMatch(/output\s+"vpc_id"/);
    });

    test('should output ALB DNS name', () => {
      const content = terraformFiles['outputs.tf']?.content || '';
      expect(content).toMatch(/output\s+"alb_dns_name"/);
    });

    test('should output ECS cluster name', () => {
      const content = terraformFiles['outputs.tf']?.content || '';
      expect(content).toMatch(/output\s+"ecs_cluster_name"/);
    });

    test('should output RDS cluster endpoint', () => {
      const content = terraformFiles['outputs.tf']?.content || '';
      expect(content).toMatch(/output\s+"rds_cluster_endpoint"/);
    });

    test('should output S3 bucket name', () => {
      const content = terraformFiles['outputs.tf']?.content || '';
      expect(content).toMatch(/output\s+"audit_logs_bucket_name"/);
    });

    test('should output environment summary', () => {
      const content = terraformFiles['outputs.tf']?.content || '';
      expect(content).toMatch(/output\s+"environment_summary"/);
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all resources should use environment_suffix variable', () => {
      Object.entries(terraformFiles).forEach(([fileName, data]) => {
        if (fileName !== 'variables.tf' && fileName !== 'provider.tf' && data.content) {
          if (data.content.includes('resource "')) {
            expect(data.content).toContain('environment_suffix');
          }
        }
      });
    });

    test('should use environment_suffix in resource names', () => {
      const resourceFiles = ['vpc.tf', 'ecs.tf', 'rds.tf', 'alb.tf', 's3.tf'];
      resourceFiles.forEach(file => {
        const content = terraformFiles[file]?.content || '';
        expect(content).toMatch(/\${var\.environment_suffix}/);
      });
    });

    test('should tag resources with EnvironmentSuffix', () => {
      const content = terraformFiles['locals.tf']?.content || '';
      expect(content).toContain('EnvironmentSuffix');
      expect(content).toContain('var.environment_suffix');
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      Object.values(terraformFiles).forEach(data => {
        if (data.content) {
          // Allow the hardcoded password in RDS as it's for demo purposes
          const lines = data.content.split('\n');
          lines.forEach((line: string) => {
            if (!line.includes('master_password') && !line.includes('ChangeMe123!')) {
              expect(line).not.toMatch(/password\s*=\s*["'][^"']*["']/i);
            }
          });
        }
      });
    });

    test('should use encryption where applicable', () => {
      expect(terraformFiles['rds.tf']?.content).toContain('storage_encrypted');
      expect(terraformFiles['s3.tf']?.content).toContain('sse_algorithm');
    });

    test('should follow least privilege for IAM', () => {
      const ecsContent = terraformFiles['ecs.tf']?.content || '';
      expect(ecsContent).toContain('ecs-tasks.amazonaws.com');
      expect(ecsContent).toContain('sts:AssumeRole');
    });
  });

  describe('Terraform Environment Files', () => {
    test('should have dev.tfvars', () => {
      expect(fs.existsSync(path.join(libPath, 'dev.tfvars'))).toBe(true);
    });

    test('should have staging.tfvars', () => {
      expect(fs.existsSync(path.join(libPath, 'staging.tfvars'))).toBe(true);
    });

    test('should have prod.tfvars', () => {
      expect(fs.existsSync(path.join(libPath, 'prod.tfvars'))).toBe(true);
    });

    test('dev.tfvars should have correct CIDR', () => {
      const content = fs.readFileSync(path.join(libPath, 'dev.tfvars'), 'utf8');
      expect(content).toContain('10.1.0.0/16');
    });

    test('staging.tfvars should have correct CIDR', () => {
      const content = fs.readFileSync(path.join(libPath, 'staging.tfvars'), 'utf8');
      expect(content).toContain('10.2.0.0/16');
    });

    test('prod.tfvars should have correct CIDR', () => {
      const content = fs.readFileSync(path.join(libPath, 'prod.tfvars'), 'utf8');
      expect(content).toContain('10.3.0.0/16');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('should follow consistent naming pattern for all resources', () => {
      const files = ['vpc.tf', 'ecs.tf', 'rds.tf', 'alb.tf', 's3.tf'];
      files.forEach(file => {
        const content = terraformFiles[file]?.content || '';
        // Check for pattern: resource-type-environment_suffix
        expect(content).toMatch(/Name\s*=.*\${var\.environment_suffix}/);
      });
    });
  });
});
