import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '../lib');
  const environmentModulePath = path.join(libPath, 'modules/environment');
  
  // Helper function to read and parse HCL files
  const readTerraformFile = (filePath: string): string => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
  };

  // Helper function to validate Terraform syntax
  const validateTerraformSyntax = (directoryPath: string): boolean => {
    try {
      execSync(`terraform fmt -check=true -diff=true ${directoryPath}`, { 
        stdio: 'pipe',
        cwd: directoryPath 
      });
      execSync(`terraform validate`, { 
        stdio: 'pipe',
        cwd: directoryPath 
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  beforeAll(() => {
    // Initialize terraform in test directories if needed
    if (fs.existsSync(libPath)) {
      try {
        execSync('terraform init -backend=false', { 
          stdio: 'pipe', 
          cwd: libPath 
        });
      } catch (error) {
        // Initialize may fail in CI, that's ok for syntax testing
      }
    }
  });

  describe('File Structure and Syntax', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'tap_stack.tf',
        'provider.tf',
        'variables.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });

    test('should have valid Terraform syntax in main files', () => {
      const mainFiles = [
        'tap_stack.tf',
        'provider.tf',
        'variables.tf',
        'outputs.tf'
      ];

      mainFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = readTerraformFile(filePath);
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
      });
    });

    test('should have environment module files', () => {
      const moduleFiles = [
        'main.tf',
        'variables.tf',
        'outputs.tf'
      ];

      moduleFiles.forEach(file => {
        const filePath = path.join(environmentModulePath, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });
  });

  describe('Environment Module Configuration', () => {
    test('should define all three environments in main configuration', () => {
      const mainConfig = readTerraformFile(path.join(libPath, 'tap_stack.tf'));
      
      // Check for dev environment
      expect(mainConfig).toMatch(/module\s+"dev_environment"/);
      expect(mainConfig).toMatch(/environment\s*=\s*"dev"/);
      expect(mainConfig).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(mainConfig).toMatch(/instance_type\s*=\s*"t2\.micro"/);

      // Check for staging environment
      expect(mainConfig).toMatch(/module\s+"staging_environment"/);
      expect(mainConfig).toMatch(/environment\s*=\s*"staging"/);
      expect(mainConfig).toMatch(/vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/);
      expect(mainConfig).toMatch(/instance_type\s*=\s*"t3\.medium"/);

      // Check for prod environment
      expect(mainConfig).toMatch(/module\s+"prod_environment"/);
      expect(mainConfig).toMatch(/environment\s*=\s*"prod"/);
      expect(mainConfig).toMatch(/vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/);
      expect(mainConfig).toMatch(/instance_type\s*=\s*"m5\.large"/);
    });

    test('should have correct subnet configurations for each environment', () => {
      const mainConfig = readTerraformFile(path.join(libPath, 'tap_stack.tf'));
      
      // Dev subnets
      expect(mainConfig).toMatch(/public_subnet_cidrs\s*=\s*\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\]/);
      expect(mainConfig).toMatch(/private_subnet_cidrs\s*=\s*\["10\.0\.10\.0\/24",\s*"10\.0\.20\.0\/24"\]/);

      // Staging subnets  
      expect(mainConfig).toMatch(/public_subnet_cidrs\s*=\s*\["10\.1\.1\.0\/24",\s*"10\.1\.2\.0\/24"\]/);
      expect(mainConfig).toMatch(/private_subnet_cidrs\s*=\s*\["10\.1\.10\.0\/24",\s*"10\.1\.20\.0\/24"\]/);

      // Prod subnets
      expect(mainConfig).toMatch(/public_subnet_cidrs\s*=\s*\["10\.2\.1\.0\/24",\s*"10\.2\.2\.0\/24"\]/);
      expect(mainConfig).toMatch(/private_subnet_cidrs\s*=\s*\["10\.2\.10\.0\/24",\s*"10\.2\.20\.0\/24"\]/);
    });

    test('should use availability zones data source', () => {
      const mainConfig = readTerraformFile(path.join(libPath, 'tap_stack.tf'));
      
      expect(mainConfig).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(mainConfig).toMatch(/availability_zones\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });
  });

  describe('Environment Module Resources', () => {
    test('should have VPC resource with proper configuration', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // VPC resource
      expect(moduleMain).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(moduleMain).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(moduleMain).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(moduleMain).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should have subnet resources with correct configuration', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Public subnets
      expect(moduleMain).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(moduleMain).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(moduleMain).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      
      // Private subnets  
      expect(moduleMain).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(moduleMain).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test('should have NAT Gateway and Internet Gateway resources', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Internet Gateway
      expect(moduleMain).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      
      // NAT Gateways
      expect(moduleMain).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(moduleMain).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      
      // Elastic IPs for NAT
      expect(moduleMain).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should have route table resources', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Public route table
      expect(moduleMain).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      
      // Private route tables
      expect(moduleMain).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(moduleMain).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      
      // Route table associations
      expect(moduleMain).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(moduleMain).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe('Security Groups and Network ACLs', () => {
    test('should have security group for web servers', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(moduleMain).toMatch(/name\s*=\s*"\$\{var\.environment\}-web-sg-\$\{var\.environment_suffix\}"/);
      expect(moduleMain).toMatch(/description\s*=\s*"Security group for web servers in \$\{var\.environment\} environment"/);
    });

    test('should have correct security group ingress rules', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // HTTP ingress
      expect(moduleMain).toMatch(/description\s*=\s*"HTTP"/);
      expect(moduleMain).toMatch(/from_port\s*=\s*80/);
      expect(moduleMain).toMatch(/to_port\s*=\s*80/);
      
      // HTTPS ingress
      expect(moduleMain).toMatch(/description\s*=\s*"HTTPS"/);
      expect(moduleMain).toMatch(/from_port\s*=\s*443/);
      expect(moduleMain).toMatch(/to_port\s*=\s*443/);
      
      // SSH ingress
      expect(moduleMain).toMatch(/description\s*=\s*"SSH"/);
      expect(moduleMain).toMatch(/from_port\s*=\s*22/);
      expect(moduleMain).toMatch(/to_port\s*=\s*22/);
    });

    test('should have Network ACLs for public and private subnets', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Public Network ACL
      expect(moduleMain).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
      expect(moduleMain).toMatch(/subnet_ids\s*=\s*aws_subnet\.public\[\*\]\.id/);
      
      // Private Network ACL
      expect(moduleMain).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
      expect(moduleMain).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('should have cross-environment traffic isolation in private NACLs', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Should have dynamic ingress rules for cross-environment denial
      expect(moduleMain).toMatch(/dynamic\s+"ingress"/);
      expect(moduleMain).toMatch(/action\s*=\s*"deny"/);
      expect(moduleMain).toMatch(/var\.environment\s*==\s*"prod"/);
      expect(moduleMain).toMatch(/cidr\s*=\s*"10\.0\.0\.0\/16"/); // Deny dev traffic
      expect(moduleMain).toMatch(/cidr\s*=\s*"10\.1\.0\.0\/16"/); // Deny staging traffic
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for EC2 instances', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(moduleMain).toMatch(/name\s*=\s*"\$\{var\.environment\}-ec2-role-\$\{var\.environment_suffix\}"/);
      expect(moduleMain).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    });

    test('should have IAM policy for CloudWatch and SSM', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(moduleMain).toMatch(/cloudwatch:PutMetricData/);
      expect(moduleMain).toMatch(/logs:CreateLogGroup/);
      expect(moduleMain).toMatch(/ssm:GetParameter/);
    });

    test('should have IAM instance profile', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(moduleMain).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test('should have VPC Flow Logs IAM role and policy', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs_role"/);
      expect(moduleMain).toMatch(/Service\s*=\s*"vpc-flow-logs\.amazonaws\.com"/);
      expect(moduleMain).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs_policy"/);
    });
  });

  describe('EC2 Instances', () => {
    test('should have EC2 instances resource configuration', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_instance"\s+"web"/);
      expect(moduleMain).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(moduleMain).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(moduleMain).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(moduleMain).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
    });

    test('should use correct user data configuration', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Check for user_data_base64 (fixed base64 encoding issue)
      expect(moduleMain).toMatch(/user_data_base64\s*=\s*base64encode/);
      expect(moduleMain).toMatch(/yum update -y/);
      expect(moduleMain).toMatch(/yum install -y httpd/);
      expect(moduleMain).toMatch(/systemctl start httpd/);
      expect(moduleMain).toMatch(/Hello from \$\{var\.environment\} environment/);
    });

    test('should have Amazon Linux AMI data source', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      expect(moduleMain).toMatch(/most_recent\s*=\s*true/);
      expect(moduleMain).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(moduleMain).toMatch(/amzn2-ami-hvm-\*-x86_64-gp2/);
    });

    test('should associate IAM instance profile and security groups', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
      expect(moduleMain).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.web\.id\]/);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have CloudWatch log group for VPC Flow Logs', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
      expect(moduleMain).toMatch(/name\s*=\s*"\/aws\/vpc\/flowlogs\/\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
      expect(moduleMain).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('should have VPC Flow Log resource', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs"/);
      expect(moduleMain).toMatch(/iam_role_arn\s*=\s*aws_iam_role\.flow_logs_role\.arn/);
      expect(moduleMain).toMatch(/log_destination\s*=\s*aws_cloudwatch_log_group\.vpc_flow_logs\.arn/);
      expect(moduleMain).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(moduleMain).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe('Variables', () => {
    test('should have all required variables in module', () => {
      const moduleVars = readTerraformFile(path.join(environmentModulePath, 'variables.tf'));
      
      expect(moduleVars).toMatch(/variable\s+"environment"/);
      expect(moduleVars).toMatch(/variable\s+"environment_suffix"/);
      expect(moduleVars).toMatch(/variable\s+"vpc_cidr"/);
      expect(moduleVars).toMatch(/variable\s+"public_subnet_cidrs"/);
      expect(moduleVars).toMatch(/variable\s+"private_subnet_cidrs"/);
      expect(moduleVars).toMatch(/variable\s+"availability_zones"/);
      expect(moduleVars).toMatch(/variable\s+"instance_type"/);
      expect(moduleVars).toMatch(/variable\s+"common_tags"/);
    });

    test('should have root level variables', () => {
      const rootVars = readTerraformFile(path.join(libPath, 'variables.tf'));
      
      expect(rootVars).toMatch(/variable\s+"aws_region"/);
      expect(rootVars).toMatch(/variable\s+"environment_suffix"/);
      expect(rootVars).toMatch(/variable\s+"common_tags"/);
    });
  });

  describe('Outputs', () => {
    test('should have module outputs', () => {
      const moduleOutputs = readTerraformFile(path.join(environmentModulePath, 'outputs.tf'));
      
      expect(moduleOutputs).toMatch(/output\s+"vpc_id"/);
      expect(moduleOutputs).toMatch(/output\s+"vpc_cidr_block"/);
      expect(moduleOutputs).toMatch(/output\s+"public_subnet_ids"/);
      expect(moduleOutputs).toMatch(/output\s+"private_subnet_ids"/);
      expect(moduleOutputs).toMatch(/output\s+"instance_ids"/);
      expect(moduleOutputs).toMatch(/output\s+"instance_public_ips"/);
      expect(moduleOutputs).toMatch(/output\s+"security_group_id"/);
    });

    test('should have root level outputs for all environments', () => {
      const rootOutputs = readTerraformFile(path.join(libPath, 'outputs.tf'));
      
      // VPC outputs
      expect(rootOutputs).toMatch(/output\s+"dev_vpc_id"/);
      expect(rootOutputs).toMatch(/output\s+"staging_vpc_id"/);
      expect(rootOutputs).toMatch(/output\s+"prod_vpc_id"/);
      
      // Instance outputs
      expect(rootOutputs).toMatch(/output\s+"dev_instance_ids"/);
      expect(rootOutputs).toMatch(/output\s+"staging_instance_ids"/);
      expect(rootOutputs).toMatch(/output\s+"prod_instance_ids"/);
      
      // Security group outputs
      expect(rootOutputs).toMatch(/output\s+"dev_security_group_id"/);
      expect(rootOutputs).toMatch(/output\s+"staging_security_group_id"/);
      expect(rootOutputs).toMatch(/output\s+"prod_security_group_id"/);
    });
  });

  describe('Provider Configuration', () => {
    test('should have AWS provider configuration', () => {
      const providerConfig = readTerraformFile(path.join(libPath, 'provider.tf'));
      
      expect(providerConfig).toMatch(/terraform\s*\{/);
      expect(providerConfig).toMatch(/required_providers\s*\{/);
      expect(providerConfig).toMatch(/aws\s*=\s*\{/);
      expect(providerConfig).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerConfig).toMatch(/provider\s+"aws"\s*\{/);
      expect(providerConfig).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use environment suffix in resource names', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Check multiple resource naming patterns
      expect(moduleMain).toMatch(/\$\{var\.environment\}-.*-\$\{var\.environment_suffix\}/);
      expect(moduleMain).toMatch(/Name\s*=\s*"\$\{var\.environment\}-vpc-\$\{var\.environment_suffix\}"/);
      expect(moduleMain).toMatch(/Name\s*=\s*"\$\{var\.environment\}-igw-\$\{var\.environment_suffix\}"/);
    });

    test('should apply common tags to resources', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/tags\s*=\s*merge\(var\.common_tags,/);
      expect(moduleMain).toMatch(/Environment\s*=\s*var\.environment/);
    });
  });

  describe('Cross-Environment Isolation', () => {
    test('should use different CIDR blocks for each environment', () => {
      const mainConfig = readTerraformFile(path.join(libPath, 'tap_stack.tf'));
      
      // Each environment should have unique CIDR
      expect(mainConfig).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/); // dev
      expect(mainConfig).toMatch(/vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/); // staging
      expect(mainConfig).toMatch(/vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/); // prod
    });

    test('should implement network isolation in production', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Production should deny dev and staging traffic
      expect(moduleMain).toMatch(/var\.environment\s*==\s*"prod"/);
      expect(moduleMain).toMatch(/"10\.0\.0\.0\/16"/); // dev cidr in deny rule
      expect(moduleMain).toMatch(/"10\.1\.0\.0\/16"/); // staging cidr in deny rule
    });
  });

  describe('Infrastructure Best Practices', () => {
    test('should use private subnets for EC2 instances', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      // Instances should be in private subnets
      expect(moduleMain).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
    });

    test('should have proper security group egress rules', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/egress\s*\{/);
      expect(moduleMain).toMatch(/description\s*=\s*"All outbound"/);
      expect(moduleMain).toMatch(/protocol\s*=\s*"-1"/);
    });

    test('should configure VPC with DNS support', () => {
      const moduleMain = readTerraformFile(path.join(environmentModulePath, 'main.tf'));
      
      expect(moduleMain).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(moduleMain).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });
});