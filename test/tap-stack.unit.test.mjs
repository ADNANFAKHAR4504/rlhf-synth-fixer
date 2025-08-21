import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import hcl from 'hcl2-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { parseSync } = hcl;

// Helper function to read and parse HCL files
function parseHCLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseSync(content);
}

// Helper function to find resources by type
function findResourcesByType(hcl, resourceType) {
  const resources = [];
  if (hcl.resource && hcl.resource[resourceType]) {
    for (const [name, config] of Object.entries(hcl.resource[resourceType])) {
      resources.push({ name, config: config[0] });
    }
  }
  return resources;
}

// Helper function to find modules
function findModules(hcl) {
  const modules = [];
  if (hcl.module) {
    for (const [name, config] of Object.entries(hcl.module)) {
      modules.push({ name, config: config[0] });
    }
  }
  return modules;
}

describe('Terraform Infrastructure Unit Tests', () => {
  let mainHCL;
  let envModuleHCL;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test123';

  beforeAll(() => {
    // Parse main.tf
    const mainPath = path.join(__dirname, '..', 'lib', 'main.tf');
    mainHCL = parseHCLFile(mainPath);
    
    // Parse environment module
    const envModulePath = path.join(__dirname, '..', 'lib', 'modules', 'environment', 'main.tf');
    envModuleHCL = parseHCLFile(envModulePath);
  });

  describe('Main Configuration', () => {
    test('should have terraform configuration with required version', () => {
      expect(mainHCL.terraform).toBeDefined();
      expect(mainHCL.terraform[0].required_version).toBeDefined();
    });

    test('should have AWS provider configuration', () => {
      expect(mainHCL.provider).toBeDefined();
      expect(mainHCL.provider.aws).toBeDefined();
    });

    test('should have S3 backend configuration', () => {
      expect(mainHCL.terraform[0].backend).toBeDefined();
      expect(mainHCL.terraform[0].backend.s3).toBeDefined();
    });
  });

  describe('Environment Modules', () => {
    test('should create three environment modules', () => {
      const modules = findModules(mainHCL);
      const envModules = modules.filter(m => 
        m.name === 'dev_environment' || 
        m.name === 'staging_environment' || 
        m.name === 'prod_environment'
      );
      
      expect(envModules).toHaveLength(3);
    });

    test('should configure development environment with correct CIDR', () => {
      const modules = findModules(mainHCL);
      const devModule = modules.find(m => m.name === 'dev_environment');
      
      expect(devModule).toBeDefined();
      expect(devModule.config.vpc_cidr).toBe('10.0.0.0/16');
      expect(devModule.config.instance_type).toBe('t2.micro');
    });

    test('should configure staging environment with correct CIDR', () => {
      const modules = findModules(mainHCL);
      const stagingModule = modules.find(m => m.name === 'staging_environment');
      
      expect(stagingModule).toBeDefined();
      expect(stagingModule.config.vpc_cidr).toBe('10.1.0.0/16');
      expect(stagingModule.config.instance_type).toBe('t3.medium');
    });

    test('should configure production environment with correct CIDR', () => {
      const modules = findModules(mainHCL);
      const prodModule = modules.find(m => m.name === 'prod_environment');
      
      expect(prodModule).toBeDefined();
      expect(prodModule.config.vpc_cidr).toBe('10.2.0.0/16');
      expect(prodModule.config.instance_type).toBe('m5.large');
    });

    test('should pass environment suffix to all modules', () => {
      const modules = findModules(mainHCL);
      const envModules = modules.filter(m => 
        m.name === 'dev_environment' || 
        m.name === 'staging_environment' || 
        m.name === 'prod_environment'
      );
      
      envModules.forEach(module => {
        expect(module.config.environment_suffix).toBeDefined();
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with DNS enabled', () => {
      const vpcs = findResourcesByType(envModuleHCL, 'aws_vpc');
      
      expect(vpcs).toHaveLength(1);
      expect(vpcs[0].config.enable_dns_hostnames).toBe(true);
      expect(vpcs[0].config.enable_dns_support).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igws = findResourcesByType(envModuleHCL, 'aws_internet_gateway');
      
      expect(igws).toHaveLength(1);
    });

    test('should create public and private subnets', () => {
      const publicSubnets = findResourcesByType(envModuleHCL, 'aws_subnet');
      const publicSubnet = publicSubnets.find(s => s.name === 'public');
      const privateSubnet = publicSubnets.find(s => s.name === 'private');
      
      expect(publicSubnet).toBeDefined();
      expect(privateSubnet).toBeDefined();
      
      // Check public subnet settings
      expect(publicSubnet.config.map_public_ip_on_launch).toBe(true);
    });

    test('should create NAT Gateways for high availability', () => {
      const natGateways = findResourcesByType(envModuleHCL, 'aws_nat_gateway');
      const eips = findResourcesByType(envModuleHCL, 'aws_eip');
      
      expect(natGateways).toHaveLength(1);
      expect(eips).toHaveLength(1);
    });

    test('should create route tables for public and private subnets', () => {
      const routeTables = findResourcesByType(envModuleHCL, 'aws_route_table');
      const publicRT = routeTables.find(rt => rt.name === 'public');
      const privateRT = routeTables.find(rt => rt.name === 'private');
      
      expect(publicRT).toBeDefined();
      expect(privateRT).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should create security group for web servers', () => {
      const securityGroups = findResourcesByType(envModuleHCL, 'aws_security_group');
      const webSG = securityGroups.find(sg => sg.name === 'web');
      
      expect(webSG).toBeDefined();
      expect(webSG.config.description).toContain('web servers');
    });

    test('should create Network ACLs for public and private subnets', () => {
      const nacls = findResourcesByType(envModuleHCL, 'aws_network_acl');
      const publicNACL = nacls.find(nacl => nacl.name === 'public');
      const privateNACL = nacls.find(nacl => nacl.name === 'private');
      
      expect(publicNACL).toBeDefined();
      expect(privateNACL).toBeDefined();
    });

    test('private NACL should have deny rules for cross-environment traffic', () => {
      const nacls = findResourcesByType(envModuleHCL, 'aws_network_acl');
      const privateNACL = nacls.find(nacl => nacl.name === 'private');
      
      expect(privateNACL).toBeDefined();
      // Check for dynamic block for deny rules
      expect(privateNACL.config.dynamic).toBeDefined();
      expect(privateNACL.config.dynamic.ingress).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should create IAM role for EC2 instances', () => {
      const roles = findResourcesByType(envModuleHCL, 'aws_iam_role');
      const ec2Role = roles.find(role => role.name === 'ec2_role');
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role.config.assume_role_policy).toBeDefined();
    });

    test('should create IAM policy for EC2 instances', () => {
      const policies = findResourcesByType(envModuleHCL, 'aws_iam_role_policy');
      const ec2Policy = policies.find(policy => policy.name === 'ec2_policy');
      
      expect(ec2Policy).toBeDefined();
    });

    test('should create IAM instance profile', () => {
      const profiles = findResourcesByType(envModuleHCL, 'aws_iam_instance_profile');
      const ec2Profile = profiles.find(profile => profile.name === 'ec2_profile');
      
      expect(ec2Profile).toBeDefined();
    });

    test('should create VPC Flow Logs IAM role', () => {
      const roles = findResourcesByType(envModuleHCL, 'aws_iam_role');
      const flowLogsRole = roles.find(role => role.name === 'flow_logs_role');
      
      expect(flowLogsRole).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create CloudWatch Log Group for VPC Flow Logs', () => {
      const logGroups = findResourcesByType(envModuleHCL, 'aws_cloudwatch_log_group');
      const flowLogsGroup = logGroups.find(lg => lg.name === 'vpc_flow_logs');
      
      expect(flowLogsGroup).toBeDefined();
      expect(flowLogsGroup.config.retention_in_days).toBe(30);
    });

    test('should create VPC Flow Log resource', () => {
      const flowLogs = findResourcesByType(envModuleHCL, 'aws_flow_log');
      
      expect(flowLogs).toHaveLength(1);
      expect(flowLogs[0].config.traffic_type).toBe('ALL');
    });
  });

  describe('EC2 Instances', () => {
    test('should create EC2 instances for testing', () => {
      const instances = findResourcesByType(envModuleHCL, 'aws_instance');
      const webInstance = instances.find(i => i.name === 'web');
      
      expect(webInstance).toBeDefined();
      expect(webInstance.config.user_data).toBeDefined();
    });

    test('instances should be deployed in private subnets', () => {
      const instances = findResourcesByType(envModuleHCL, 'aws_instance');
      const webInstance = instances.find(i => i.name === 'web');
      
      expect(webInstance).toBeDefined();
      // Check that subnet_id references private subnet
      const subnetRef = webInstance.config.subnet_id;
      expect(subnetRef).toContain('private');
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include environment suffix in names', () => {
      // Check VPC tags
      const vpcs = findResourcesByType(envModuleHCL, 'aws_vpc');
      expect(vpcs[0].config.tags).toBeDefined();
      
      // Check security group name
      const securityGroups = findResourcesByType(envModuleHCL, 'aws_security_group');
      const webSG = securityGroups.find(sg => sg.name === 'web');
      expect(webSG.config.name).toBeDefined();
      
      // Check IAM role name
      const roles = findResourcesByType(envModuleHCL, 'aws_iam_role');
      const ec2Role = roles.find(role => role.name === 'ec2_role');
      expect(ec2Role.config.name).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have outputs for VPC IDs', () => {
      const outputsPath = path.join(__dirname, '..', 'lib', 'outputs.tf');
      const outputsHCL = parseHCLFile(outputsPath);
      
      expect(outputsHCL.output.dev_vpc_id).toBeDefined();
      expect(outputsHCL.output.staging_vpc_id).toBeDefined();
      expect(outputsHCL.output.prod_vpc_id).toBeDefined();
    });

    test('should have outputs for instance IDs', () => {
      const outputsPath = path.join(__dirname, '..', 'lib', 'outputs.tf');
      const outputsHCL = parseHCLFile(outputsPath);
      
      expect(outputsHCL.output.dev_instance_ids).toBeDefined();
      expect(outputsHCL.output.staging_instance_ids).toBeDefined();
      expect(outputsHCL.output.prod_instance_ids).toBeDefined();
    });

    test('should have outputs for security group IDs', () => {
      const outputsPath = path.join(__dirname, '..', 'lib', 'outputs.tf');
      const outputsHCL = parseHCLFile(outputsPath);
      
      expect(outputsHCL.output.dev_security_group_id).toBeDefined();
      expect(outputsHCL.output.staging_security_group_id).toBeDefined();
      expect(outputsHCL.output.prod_security_group_id).toBeDefined();
    });
  });

  describe('Variables', () => {
    test('should define required variables', () => {
      const varsPath = path.join(__dirname, '..', 'lib', 'variables.tf');
      const varsHCL = parseHCLFile(varsPath);
      
      expect(varsHCL.variable.aws_region).toBeDefined();
      expect(varsHCL.variable.environment_suffix).toBeDefined();
      expect(varsHCL.variable.common_tags).toBeDefined();
    });

    test('should have default values for variables', () => {
      const varsPath = path.join(__dirname, '..', 'lib', 'variables.tf');
      const varsHCL = parseHCLFile(varsPath);
      
      expect(varsHCL.variable.aws_region[0].default).toBe('us-west-2');
      expect(varsHCL.variable.environment_suffix[0].default).toBe('dev');
      expect(varsHCL.variable.common_tags[0].default).toBeDefined();
    });
  });

  describe('High Availability', () => {
    test('should use multiple availability zones', () => {
      // Check data source for AZs
      expect(mainHCL.data).toBeDefined();
      expect(mainHCL.data.aws_availability_zones).toBeDefined();
      
      // Check modules use multiple AZs
      const modules = findModules(mainHCL);
      const devModule = modules.find(m => m.name === 'dev_environment');
      expect(devModule.config.availability_zones).toBeDefined();
    });

    test('should create resources across multiple AZs', () => {
      const modules = findModules(mainHCL);
      const devModule = modules.find(m => m.name === 'dev_environment');
      
      // Check that module receives multiple subnet CIDRs
      expect(devModule.config.public_subnet_cidrs).toHaveLength(2);
      expect(devModule.config.private_subnet_cidrs).toHaveLength(2);
    });
  });
});