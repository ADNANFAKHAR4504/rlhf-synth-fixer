// Unit tests for Terraform multi-region infrastructure
import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');

  describe('File Structure Tests', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'tap_stack.tf',
        'provider.tf',
        'variables.tf',
        'backend.tf',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('documentation files exist', () => {
      const docFiles = ['PROMPT.md', 'MODEL_RESPONSE.md'];

      docFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Provider Configuration Tests', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(
        path.join(libPath, 'provider.tf'),
        'utf8'
      );
    });

    test('terraform version constraints are defined', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test('AWS provider is configured with correct version', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('Random provider is configured', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });

    test('primary region provider is configured', () => {
      expect(providerContent).toMatch(
        /provider\s+"aws"\s*{\s*\n\s*alias\s*=\s*"primary"/m
      );
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region_primary/);
    });

    test('secondary region provider is configured', () => {
      expect(providerContent).toMatch(
        /provider\s+"aws"\s*{\s*\n\s*alias\s*=\s*"secondary"/m
      );
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region_secondary/);
    });

    test('providers use environment suffix in tags', () => {
      expect(providerContent).toMatch(
        /Environment\s*=\s*var\.environment_suffix/
      );
      expect(providerContent).toMatch(
        /Project\s*=\s*"multi-region-ha-\$\{var\.environment_suffix\}"/
      );
    });

    test('availability zones data sources are defined', () => {
      expect(providerContent).toMatch(
        /data\s+"aws_availability_zones"\s+"primary"/
      );
      expect(providerContent).toMatch(
        /data\s+"aws_availability_zones"\s+"secondary"/
      );
    });
  });

  describe('Variables Configuration Tests', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(
        path.join(libPath, 'variables.tf'),
        'utf8'
      );
    });

    test('environment_suffix variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesContent).toMatch(/default\s*=\s*"dev"/);
    });

    test('AWS region variables are defined', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region_primary"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(variablesContent).toMatch(/variable\s+"aws_region_secondary"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('VPC CIDR variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"/);
      expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('RDS configuration variables are defined', () => {
      expect(variablesContent).toMatch(/variable\s+"db_instance_class"/);
      expect(variablesContent).toMatch(/variable\s+"db_allocated_storage"/);
      expect(variablesContent).toMatch(/variable\s+"db_max_allocated_storage"/);
    });
  });

  describe('Backend Configuration Tests', () => {
    let backendContent: string;

    beforeAll(() => {
      backendContent = fs.readFileSync(
        path.join(libPath, 'backend.tf'),
        'utf8'
      );
    });

    test('S3 backend is configured', () => {
      expect(backendContent).toMatch(/backend\s+"s3"/);
    });

    test('backend configuration comments exist', () => {
      expect(backendContent).toMatch(/# bucket = "iac-rlhf-tf-states"/);
      expect(backendContent).toMatch(/# key\s*=/);
      expect(backendContent).toMatch(/# region\s*=/);
    });
  });

  describe('Infrastructure Stack Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(
        path.join(libPath, 'tap_stack.tf'),
        'utf8'
      );
    });

    describe('VPC Configuration', () => {
      test('primary VPC is defined with environment suffix', () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
        expect(stackContent).toMatch(
          /Name\s*=\s*"primary-vpc-\$\{var\.environment_suffix\}"/
        );
        expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      });

      test('secondary VPC is defined with environment suffix', () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
        expect(stackContent).toMatch(
          /Name\s*=\s*"secondary-vpc-\$\{var\.environment_suffix\}"/
        );
      });

      test('DNS support is enabled for VPCs', () => {
        expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
        expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      });
    });

    describe('Networking Components', () => {
      test('Internet Gateways are defined for both regions', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_internet_gateway"\s+"primary"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_internet_gateway"\s+"secondary"/
        );
        expect(stackContent).toMatch(
          /Name\s*=\s*"primary-igw-\$\{var\.environment_suffix\}"/
        );
        expect(stackContent).toMatch(
          /Name\s*=\s*"secondary-igw-\$\{var\.environment_suffix\}"/
        );
      });

      test('public subnets are defined for both regions', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_subnet"\s+"primary_public"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_subnet"\s+"secondary_public"/
        );
        expect(stackContent).toMatch(/count\s*=\s*2/g);
        expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      });

      test('private subnets are defined for both regions', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_subnet"\s+"primary_private"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_subnet"\s+"secondary_private"/
        );
      });

      test('NAT Gateways are configured', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_nat_gateway"\s+"primary"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_nat_gateway"\s+"secondary"/
        );
        expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"primary_nat"/);
        expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"secondary_nat"/);
      });

      test('route tables are configured', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table"\s+"primary_public"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table"\s+"primary_private"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table"\s+"secondary_public"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table"\s+"secondary_private"/
        );
      });

      test('route table associations are defined', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table_association"\s+"primary_public"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table_association"\s+"primary_private"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table_association"\s+"secondary_public"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_route_table_association"\s+"secondary_private"/
        );
      });
    });

    describe('IAM Configuration', () => {
      test('RDS enhanced monitoring role is defined', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/
        );
        expect(stackContent).toMatch(
          /name\s*=\s*"rds-enhanced-monitoring-role-\$\{var\.environment_suffix\}"/
        );
      });

      test('IAM role policy attachment is configured', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_iam_role_policy_attachment"\s+"rds_enhanced_monitoring"/
        );
        expect(stackContent).toMatch(
          /arn:aws:iam::aws:policy\/service-role\/AmazonRDSEnhancedMonitoringRole/
        );
      });
    });

    describe('RDS Configuration', () => {
      test('DB subnet groups are defined for both regions', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_db_subnet_group"\s+"primary"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_db_subnet_group"\s+"secondary"/
        );
        expect(stackContent).toMatch(
          /name\s*=\s*"primary-db-subnet-group-\$\{var\.environment_suffix\}"/
        );
        expect(stackContent).toMatch(
          /name\s*=\s*"secondary-db-subnet-group-\$\{var\.environment_suffix\}"/
        );
      });

      test('security groups for RDS are defined', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_security_group"\s+"rds_primary"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_security_group"\s+"rds_secondary"/
        );
        expect(stackContent).toMatch(
          /name\s*=\s*"rds-primary-sg-\$\{var\.environment_suffix\}"/
        );
        expect(stackContent).toMatch(
          /name\s*=\s*"rds-secondary-sg-\$\{var\.environment_suffix\}"/
        );
      });

      test('security groups allow MySQL port 3306', () => {
        expect(stackContent).toMatch(/from_port\s*=\s*3306/);
        expect(stackContent).toMatch(/to_port\s*=\s*3306/);
        expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      });

      test('DB parameter groups are defined', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_db_parameter_group"\s+"mysql"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_db_parameter_group"\s+"mysql_secondary"/
        );
        expect(stackContent).toMatch(/family\s*=\s*"mysql8\.0"/);
        expect(stackContent).toMatch(
          /name\s*=\s*"custom-mysql8-params-\$\{var\.environment_suffix\}"/
        );
      });

      test('random password generation is configured', () => {
        expect(stackContent).toMatch(
          /resource\s+"random_password"\s+"db_password"/
        );
        expect(stackContent).toMatch(/length\s*=\s*16/);
        expect(stackContent).toMatch(/special\s*=\s*true/);
      });

      test('Secrets Manager is configured for password storage', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_secretsmanager_secret"\s+"db_password"/
        );
        expect(stackContent).toMatch(
          /name\s*=\s*"rds-mysql-password-\$\{var\.environment_suffix\}"/
        );
        expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
      });

      test('RDS instances are defined for both regions', () => {
        expect(stackContent).toMatch(
          /resource\s+"aws_db_instance"\s+"primary"/
        );
        expect(stackContent).toMatch(
          /resource\s+"aws_db_instance"\s+"secondary"/
        );
        expect(stackContent).toMatch(
          /identifier\s*=\s*"mysql-primary-\$\{var\.environment_suffix\}-v2"/
        );
        expect(stackContent).toMatch(
          /identifier\s*=\s*"mysql-secondary-\$\{var\.environment_suffix\}"/
        );
      });

      test('RDS instances have Multi-AZ enabled', () => {
        expect(stackContent).toMatch(/multi_az\s*=\s*true/g);
      });

      test('RDS instances have correct MySQL configuration', () => {
        expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
        expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0(\.\d+)?"/);
        expect(stackContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
      });

      test('RDS storage is encrypted', () => {
        expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/g);
      });

      test('RDS backup is configured', () => {
        expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
        expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      });

      test('RDS monitoring is configured', () => {
        expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
        expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
      });

      test('RDS instances are not publicly accessible', () => {
        expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/g);
      });

      test('RDS deletion protection is disabled for testing', () => {
        expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
        expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
      });
    });

    describe('Outputs Configuration', () => {
      test('primary region outputs are defined', () => {
        expect(stackContent).toMatch(/output\s+"primary_vpc_id"/);
        expect(stackContent).toMatch(/output\s+"primary_rds_endpoint"/);
        expect(stackContent).toMatch(/output\s+"primary_public_subnet_ids"/);
        expect(stackContent).toMatch(/output\s+"primary_private_subnet_ids"/);
      });

      test('secondary region outputs are defined', () => {
        expect(stackContent).toMatch(/output\s+"secondary_vpc_id"/);
        expect(stackContent).toMatch(/output\s+"secondary_rds_endpoint"/);
        expect(stackContent).toMatch(/output\s+"secondary_public_subnet_ids"/);
        expect(stackContent).toMatch(/output\s+"secondary_private_subnet_ids"/);
      });

      test('database secret output is defined', () => {
        expect(stackContent).toMatch(/output\s+"db_secret_arn"/);
      });

      test('sensitive outputs are marked', () => {
        expect(stackContent).toMatch(/sensitive\s*=\s*true/);
      });
    });

    describe('Environment Suffix Usage', () => {
      test('all resource names include environment suffix', () => {
        const resourceNamePatterns = [
          /Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g,
          /name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g,
          /identifier\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g,
        ];

        let totalMatches = 0;
        resourceNamePatterns.forEach(pattern => {
          const matches = stackContent.match(pattern) || [];
          totalMatches += matches.length;
        });

        // We expect at least 20 resources with environment suffix
        expect(totalMatches).toBeGreaterThanOrEqual(20);
      });
    });

    describe('Best Practices', () => {
      test('resources use proper provider aliases', () => {
        expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
      });

      test('resources have proper tags', () => {
        const tagMatches = stackContent.match(/tags\s*=\s*\{/g) || [];
        expect(tagMatches.length).toBeGreaterThanOrEqual(10);
      });

      test('no hardcoded passwords are present', () => {
        expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/);
        expect(stackContent).toMatch(
          /password\s*=\s*random_password\.db_password\.result/
        );
      });

      test('depends_on is used where necessary', () => {
        expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway/);
      });
    });
  });

  describe('Documentation Tests', () => {
    test('PROMPT.md contains requirements', () => {
      const promptContent = fs.readFileSync(
        path.join(libPath, 'PROMPT.md'),
        'utf8'
      );
      expect(promptContent).toMatch(/two.*region/i);
      expect(promptContent).toMatch(/us-east-1/);
      expect(promptContent).toMatch(/us-west-2/);
      expect(promptContent).toMatch(/RDS/);
      expect(promptContent).toMatch(/Multi-AZ/);
    });

    test('MODEL_RESPONSE.md exists and is not empty', () => {
      const modelResponsePath = path.join(libPath, 'MODEL_RESPONSE.md');
      expect(fs.existsSync(modelResponsePath)).toBe(true);
      const content = fs.readFileSync(modelResponsePath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    });
  });
});
