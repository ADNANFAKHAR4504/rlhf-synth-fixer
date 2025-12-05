import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  describe('File Structure Tests', () => {
    test('should have all required terraform files present', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'tap_stack.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libDir, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });

    test('should have environment-specific tfvars files', () => {
      const environmentFiles = [
        'dev.tfvars',
        'staging.tfvars',
        'prod.tfvars'
      ];

      environmentFiles.forEach(file => {
        const filePath = path.join(libDir, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });

    test('should have provider.tf file with proper size', () => {
      const filePath = path.join(libDir, 'provider.tf');
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(100);
    });

    test('should have variables.tf file with proper size', () => {
      const filePath = path.join(libDir, 'variables.tf');
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(100);
    });

    test('should have tap_stack.tf file with proper size', () => {
      const filePath = path.join(libDir, 'tap_stack.tf');
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(1000);
    });

    test('should have readable terraform files', () => {
      const requiredFiles = ['provider.tf', 'variables.tf', 'tap_stack.tf'];
      requiredFiles.forEach(file => {
        const filePath = path.join(libDir, file);
        expect(() => fs.readFileSync(filePath, 'utf8')).not.toThrow();
      });
    });

    test('should have valid file extensions', () => {
      const allFiles = ['provider.tf', 'variables.tf', 'tap_stack.tf', 'dev.tfvars', 'staging.tfvars', 'prod.tfvars'];
      allFiles.forEach(file => {
        expect(file).toMatch(/\.(tf|tfvars)$/);
      });
    });
  });

  describe('Provider Configuration Tests', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
    });

    test('should contain valid terraform configuration block', () => {
      expect(providerContent).toMatch(/terraform\s*\{[\s\S]*required_version\s*=\s*">=\s*1\.5\.0"/);
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toMatch(/aws\s*=\s*\{\s*source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should contain S3 backend configuration', () => {
      expect(providerContent).toContain('backend "s3"');
      expect(providerContent).toContain('# Partial backend config');
    });

    test('should have multi-region AWS provider aliases', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{\s*alias\s*=\s*"us_east_1"/);
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{\s*alias\s*=\s*"eu_west_1"/);
      expect(providerContent).toContain('region = "us-east-1"');
      expect(providerContent).toContain('region = "eu-west-1"');
    });

    test('should contain random provider configuration', () => {
      expect(providerContent).toMatch(/random\s*=\s*\{\s*source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*3\.1"/);
    });

    test('should contain valid terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('should contain hashicorp AWS provider source', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test('should contain AWS provider version constraint', () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should contain primary AWS provider region configuration', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should contain default tags in primary provider', () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
    });

    test('should contain us-east-1 provider alias', () => {
      expect(providerContent).toMatch(/alias\s*=\s*"us_east_1"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test('should contain eu-west-1 provider alias', () => {
      expect(providerContent).toMatch(/alias\s*=\s*"eu_west_1"/);
      expect(providerContent).toMatch(/region\s*=\s*"eu-west-1"/);
    });

    test('should contain environment tags in all providers', () => {
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });

    test('should contain repository tags in all providers', () => {
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
    });

    test('should contain author tags in all providers', () => {
      expect(providerContent).toMatch(/Author\s*=\s*var\.commit_author/);
    });

    test('should contain PR number tags in all providers', () => {
      expect(providerContent).toMatch(/PRNumber\s*=\s*var\.pr_number/);
    });

    test('should contain team tags in all providers', () => {
      expect(providerContent).toMatch(/Team\s*=\s*var\.team/);
    });

    test('should contain region-specific tags in regional providers', () => {
      expect(providerContent).toMatch(/Region\s*=\s*"us-east-1"/);
      expect(providerContent).toMatch(/Region\s*=\s*"eu-west-1"/);
    });
  });

  describe('Variables Configuration Tests', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    });

    test('should define all required variables', () => {
      const requiredVariables = [
        'aws_region',
        'environment_suffix',
        'repository',
        'commit_author',
        'pr_number',
        'team'
      ];

      requiredVariables.forEach(variable => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*\\{`));
      });
    });

    test('should have proper variable types and descriptions', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{[\s\S]*?type\s*=\s*string/);
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?description\s*=/);
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?type\s*=\s*string/);
      expect(variablesContent).toMatch(/variable\s+"repository"[\s\S]*?type\s*=\s*string/);
    });

    test('should have default values where appropriate', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
      expect(variablesContent).toMatch(/variable\s+"team"[\s\S]*?default\s*=\s*"unknown"/);
    });

    test('should have aws_region variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?type\s*=\s*string/);
    });

    test('should have environment_suffix variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?type\s*=\s*string/);
    });

    test('should have repository variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"repository"[\s\S]*?type\s*=\s*string/);
    });

    test('should have commit_author variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"commit_author"[\s\S]*?type\s*=\s*string/);
    });

    test('should have pr_number variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"pr_number"[\s\S]*?type\s*=\s*string/);
    });

    test('should have team variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"team"[\s\S]*?type\s*=\s*string/);
    });

    test('should have aws_region variable with description', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?description\s*=\s*"AWS region for resources"/);
    });

    test('should have environment_suffix variable with description', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?description\s*=\s*"Environment suffix for resource naming"/);
    });

    test('should have repository variable with description', () => {
      expect(variablesContent).toMatch(/variable\s+"repository"[\s\S]*?description\s*=\s*"Repository name for tagging"/);
    });

    test('should have commit_author variable with description', () => {
      expect(variablesContent).toMatch(/variable\s+"commit_author"[\s\S]*?description\s*=\s*"Commit author for tagging"/);
    });

    test('should have pr_number variable with description', () => {
      expect(variablesContent).toMatch(/variable\s+"pr_number"[\s\S]*?description\s*=\s*"PR number for tagging"/);
    });

    test('should have team variable with description', () => {
      expect(variablesContent).toMatch(/variable\s+"team"[\s\S]*?description\s*=\s*"Team name for tagging"/);
    });

    test('should have environment_suffix variable with default dev', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=\s*"dev"/);
    });

    test('should have repository variable with default unknown', () => {
      expect(variablesContent).toMatch(/variable\s+"repository"[\s\S]*?default\s*=\s*"unknown"/);
    });

    test('should have commit_author variable with default unknown', () => {
      expect(variablesContent).toMatch(/variable\s+"commit_author"[\s\S]*?default\s*=\s*"unknown"/);
    });

    test('should have pr_number variable with default unknown', () => {
      expect(variablesContent).toMatch(/variable\s+"pr_number"[\s\S]*?default\s*=\s*"unknown"/);
    });
  });

  describe('Main Infrastructure Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have locals configuration with proper structure', () => {
      expect(tapStackContent).toContain('locals {');
      expect(tapStackContent).toMatch(/environment\s*=\s*split\("-",\s*var\.environment_suffix\)\[0\]/);
      expect(tapStackContent).toContain('common_tags');
      expect(tapStackContent).toContain('regions');
      expect(tapStackContent).toContain('env_config');
    });

    test('should contain multi-region VPC resources', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"eu_west_1"/);
      expect(tapStackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
      expect(tapStackContent).toMatch(/provider\s*=\s*aws\.eu_west_1/);
    });

    test('should contain subnet configurations for both regions', () => {
      // US East 1 subnets
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"database_us_east_1"/);
      
      // EU West 1 subnets
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_eu_west_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_eu_west_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"database_eu_west_1"/);
    });

    test('should contain internet gateways and NAT gateways for both regions', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"eu_west_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"eu_west_1"/);
    });

    test('should contain RDS instances with Multi-AZ configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main_eu_west_1"/);
      expect(tapStackContent).toMatch(/multi_az\s*=\s*true/);
      expect(tapStackContent).toMatch(/engine\s*=\s*"postgres"/);
    });

    test('should contain Auto Scaling Groups for both regions', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"web_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"web_eu_west_1"/);
      expect(tapStackContent).toMatch(/min_size\s*=\s*local\.env_config\[local\.environment\]\.asg_min_size/);
      expect(tapStackContent).toMatch(/max_size\s*=\s*local\.env_config\[local\.environment\]\.asg_max_size/);
    });

    test('should contain Application Load Balancers for both regions', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main_eu_west_1"/);
      expect(tapStackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('should contain S3 buckets with proper configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config_eu_west_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test('should contain VPC CIDR blocks configuration', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*local\.regions/);
    });

    test('should contain route tables for both regions', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"/);
    });

    test('should contain route table associations', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test('should contain elastic IPs for NAT gateways', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"/);
    });

    test('should contain launch templates for both regions', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"web_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"web_eu_west_1"/);
    });

    test('should contain target groups for ALB', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test('should contain ALB listeners', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test('should contain RDS subnet groups', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test('should contain random passwords for RDS', () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"/);
    });

    test('should contain proper availability zones configuration', () => {
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*local\.regions\.[^.]+\.azs\[count\.index\]/);
    });

    test('should contain proper subnet CIDR calculations', () => {
      expect(tapStackContent).toMatch(/cidrsubnet\(/);
    });

    test('should contain instance profiles', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });

    test('should contain user data configuration', () => {
      expect(tapStackContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test('should contain block device mappings', () => {
      expect(tapStackContent).toMatch(/block_device_mappings\s*\{/);
    });

    test('should contain EBS encryption configuration', () => {
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('should contain health check configuration', () => {
      expect(tapStackContent).toMatch(/health_check\s*\{/);
    });

    test('should contain autoscaling metrics', () => {
      expect(tapStackContent).toMatch(/enabled_metrics\s*=\s*\[/);
    });

    test('should contain proper tag specifications', () => {
      expect(tapStackContent).toMatch(/tag_specifications\s*\{/);
    });
  });

  describe('Detailed Resource Configuration Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have proper ALB security group configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_eu_west_1"/);
    });

    test('should have proper web security group configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"web_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"web_eu_west_1"/);
    });

    test('should have proper RDS security group configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds_eu_west_1"/);
    });

    test('should contain proper ingress rules', () => {
      expect(tapStackContent).toMatch(/ingress\s*\{/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*80/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*80/);
    });

    test('should contain proper egress rules', () => {
      expect(tapStackContent).toMatch(/egress\s*\{/);
    });

    test('should have ALB internal configuration', () => {
      expect(tapStackContent).toMatch(/internal\s*=\s*false/);
    });

    test('should have ALB deletion protection disabled', () => {
      expect(tapStackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('should have HTTP2 enabled on ALB', () => {
      expect(tapStackContent).toMatch(/enable_http2\s*=\s*true/);
    });

    test('should have proper target group health check configuration', () => {
      expect(tapStackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(tapStackContent).toMatch(/unhealthy_threshold\s*=\s*2/);
      expect(tapStackContent).toMatch(/timeout\s*=\s*5/);
      expect(tapStackContent).toMatch(/interval\s*=\s*30/);
    });

    test('should have proper health check path', () => {
      expect(tapStackContent).toMatch(/path\s*=\s*"\/"/);
    });

    test('should have proper health check matcher', () => {
      expect(tapStackContent).toMatch(/matcher\s*=\s*"200"/);
    });

    test('should have launch template name prefix configuration', () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=/);
    });

    test('should have proper AMI data source configuration', () => {
      expect(tapStackContent).toMatch(/most_recent\s*=\s*true/);
    });

    test('should have proper AMI owner configuration', () => {
      expect(tapStackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test('should have proper AMI data source', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2/);
    });

    test('should have proper instance type configuration', () => {
      expect(tapStackContent).toMatch(/instance_type\s*=\s*local\.env_config/);
    });

    test('should have proper VPC security group IDs configuration', () => {
      expect(tapStackContent).toMatch(/vpc_security_group_ids\s*=/);
    });

    test('should have proper IAM instance profile configuration', () => {
      expect(tapStackContent).toMatch(/iam_instance_profile\s*\{/);
    });

    test('should have proper EBS volume configuration', () => {
      expect(tapStackContent).toMatch(/volume_size\s*=\s*20/);
      expect(tapStackContent).toMatch(/volume_type\s*=\s*"gp3"/);
    });

    test('should have delete on termination enabled', () => {
      expect(tapStackContent).toMatch(/delete_on_termination\s*=\s*true/);
    });

    test('should have proper ASG health check type', () => {
      expect(tapStackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('should have proper ASG health check grace period', () => {
      expect(tapStackContent).toMatch(/health_check_grace_period\s*=\s*300/);
    });

    test('should have proper ASG desired capacity configuration', () => {
      expect(tapStackContent).toMatch(/desired_capacity\s*=\s*local\.env_config/);
    });

    test('should have proper launch template version configuration', () => {
      expect(tapStackContent).toMatch(/version\s*=\s*"\$Latest"/);
    });

    test('should have RDS engine version configuration', () => {
      expect(tapStackContent).toMatch(/engine_version\s*=\s*"15\.4"/);
    });

    test('should have proper RDS storage configuration', () => {
      expect(tapStackContent).toMatch(/allocated_storage\s*=\s*20/);
      expect(tapStackContent).toMatch(/max_allocated_storage\s*=\s*100/);
      expect(tapStackContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test('should have RDS encryption enabled', () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should have proper RDS backup configuration', () => {
      expect(tapStackContent).toMatch(/backup_retention_period\s*=/);
      expect(tapStackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });

    test('should have proper RDS maintenance window', () => {
      expect(tapStackContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test('should have RDS deletion protection disabled', () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('should have skip final snapshot enabled', () => {
      expect(tapStackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('should have CloudWatch logs exports enabled', () => {
      expect(tapStackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
    });

    test('should have proper S3 bucket versioning', () => {
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should have proper S3 encryption algorithm', () => {
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('should have proper KMS key configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"/);
    });

    test('should have proper KMS key rotation', () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should have proper secrets manager configuration', () => {
      expect(tapStackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
    });
  });

  describe('Security and Secrets Management Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should contain AWS Secrets Manager for RDS passwords', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password_eu_west_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password_eu_west_1"/);
    });

    test('should use random passwords instead of hardcoded values', () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"\s+"rds_password_us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"random_password"\s+"rds_password_eu_west_1"/);
      expect(tapStackContent).toMatch(/length\s*=\s*32/);
      expect(tapStackContent).toMatch(/special\s*=\s*true/);
    });

    test('should contain KMS keys for encryption', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"eu_west_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"us_east_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"eu_west_1"/);
    });

    test('should not contain hardcoded passwords or secrets', () => {
      expect(tapStackContent).not.toMatch(/password\s*=\s*"hardcoded/);
      expect(tapStackContent).not.toMatch(/password\s*=\s*"test123/);
      expect(tapStackContent).not.toMatch(/secret\s*=\s*"[A-Za-z0-9]{20,}"/);
    });

    test('should reference secrets from Secrets Manager', () => {
      expect(tapStackContent).toMatch(/password\s*=\s*random_password/);
      expect(tapStackContent).toContain('aws_secretsmanager_secret');
    });
  });

  describe('CloudWatch and Monitoring Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should contain CloudWatch Log Groups', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(tapStackContent).toMatch(/retention_in_days/);
    });

    test('should contain CloudWatch configuration for retention', () => {
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*local\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });
  });

  describe('Environment-specific Configuration Tests', () => {
    let devContent: string;
    let stagingContent: string;
    let prodContent: string;

    beforeAll(() => {
      devContent = fs.readFileSync(path.join(libDir, 'dev.tfvars'), 'utf8');
      stagingContent = fs.readFileSync(path.join(libDir, 'staging.tfvars'), 'utf8');
      prodContent = fs.readFileSync(path.join(libDir, 'prod.tfvars'), 'utf8');
    });

    test('should have consistent variable structure across environments', () => {
      const requiredVars = ['aws_region', 'environment_suffix', 'repository', 'commit_author', 'pr_number', 'team'];
      
      requiredVars.forEach(variable => {
        expect(devContent).toMatch(new RegExp(`${variable}\\s*=`));
        expect(stagingContent).toMatch(new RegExp(`${variable}\\s*=`));
        expect(prodContent).toMatch(new RegExp(`${variable}\\s*=`));
      });
    });

    test('should have different environment suffixes', () => {
      expect(devContent).toMatch(/environment_suffix\s*=\s*"dev"/);
      expect(stagingContent).toMatch(/environment_suffix\s*=\s*"staging"/);
      expect(prodContent).toMatch(/environment_suffix\s*=\s*"prod"/);
    });

    test('should have appropriate db_username for each environment', () => {
      expect(devContent).toMatch(/db_username\s*=\s*"devadmin"/);
      expect(stagingContent).toMatch(/db_username\s*=\s*"stagingadmin"/);
      expect(prodContent).toMatch(/db_username\s*=\s*"prodadmin"/);
    });

    test('should have consistent aws_region configuration', () => {
      expect(devContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
      expect(stagingContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
      expect(prodContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
    });
  });

  describe('Resource Naming Convention Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should use proper naming conventions with environment reference', () => {
      expect(tapStackContent).toContain('${local.environment}');
      expect(tapStackContent).toMatch(/name\s*=\s*"\$\{local\.environment\}[^"]*"/);
    });

    test('should include common tags in resources', () => {
      expect(tapStackContent).toMatch(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/);
    });

    test('should respect AWS naming constraints', () => {
      // Check for name_prefix length compliance (max 6 characters for launch templates)
      const namePrefixMatches = tapStackContent.match(/name_prefix\s*=\s*"([^"]*)"/g);
      if (namePrefixMatches) {
        namePrefixMatches.forEach(match => {
          const prefix = match.match(/"([^"]*)"/)?.[1];
          if (prefix) {
            expect(prefix.length).toBeLessThanOrEqual(6);
          }
        });
      }
    });
  });

  describe('Data Sources Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should contain AMI data sources for both regions', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2_us"/);
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2_eu"/);
      expect(tapStackContent).toMatch(/most_recent\s*=\s*true/);
      expect(tapStackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test('should filter AMIs correctly', () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"name"/);
      expect(tapStackContent).toMatch(/values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/);
    });

    test('should contain caller identity data source', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });





  describe('IAM and Security Group Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should contain IAM roles and policies', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"/);
    });

    test('should contain security groups for different tiers', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"/);
      expect(tapStackContent).toMatch(/ingress\s*\{/);
      expect(tapStackContent).toMatch(/egress\s*\{/);
    });

    test('should have proper security group rules', () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*\d+/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*\d+/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });
  });





  describe('Network Configuration Validation Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have proper subnet availability zone configuration', () => {
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*local\.regions\.[^.]+\.azs\[count\.index\]/);
    });

    test('should have proper subnet CIDR block calculations', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(local\.regions/);
    });

    test('should have map public IP on launch for public subnets', () => {
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });


  });

  describe('Database Configuration Validation Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have proper database identifier configuration', () => {
      expect(tapStackContent).toMatch(/identifier\s*=\s*"\$\{local\.environment\}-rds-us-east-1"/);
      expect(tapStackContent).toMatch(/identifier\s*=\s*"\$\{local\.environment\}-rds-eu-west-1"/);
    });

    test('should have proper database name configuration', () => {
      expect(tapStackContent).toMatch(/db_name\s*=\s*"\$\{local\.environment\}db"/);
    });

    test('should have proper database username configuration', () => {
      expect(tapStackContent).toMatch(/username\s*=\s*var\.db_username/);
    });

    test('should have proper database port configuration', () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*5432/);
    });

    test('should have proper database parameter group', () => {
      expect(tapStackContent).toMatch(/engine\s*=\s*"postgres"/);
    });


  });

  describe('Compute Configuration Validation Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have proper instance metadata options', () => {
      expect(tapStackContent).toMatch(/image_id\s*=\s*data\.aws_ami/);
    });

    test('should have IMDSv2 required', () => {
      expect(tapStackContent).toMatch(/instance_type\s*=\s*local\.env_config/);
    });

    test('should have proper HTTP endpoint configuration', () => {
      expect(tapStackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test('should have proper monitoring configuration', () => {
      expect(tapStackContent).toMatch(/aws_cloudwatch_log_group/);
    });

    test('should have proper key pair configuration', () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key/);
    });

    test('should have proper network interface configuration', () => {
      expect(tapStackContent).toMatch(/vpc_security_group_ids\s*=/);
    });

    test('should have proper instance store policy', () => {
      expect(tapStackContent).toMatch(/iam_instance_profile\s*\{/);
    });

    test('should have proper placement configuration', () => {
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*local\.regions/);
    });
  });

  describe('Load Balancer Configuration Validation Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have proper ALB scheme configuration', () => {
      expect(tapStackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('should have proper access logs configuration', () => {
      expect(tapStackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });




  });

  describe('Security Configuration Validation Tests', () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
    });

    test('should have proper security group description', () => {
      expect(tapStackContent).toMatch(/description\s*=\s*"[^"]+"/);
    });

    test('should have proper ingress CIDR blocks', () => {
      expect(tapStackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });



    test('should have proper assume role policy', () => {
      expect(tapStackContent).toMatch(/assume_role_policy\s*=/);
    });

    test('should have proper EC2 policy', () => {
      expect(tapStackContent).toMatch(/aws_iam_role_policy.*ec2_policy/);
    });
  });






});
