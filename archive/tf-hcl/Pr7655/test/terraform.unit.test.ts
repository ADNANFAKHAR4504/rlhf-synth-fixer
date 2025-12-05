import fs from 'fs';
import path from 'path';
import { parse } from 'hcl2-parser';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('Main Configuration', () => {
    const mainTfPath = path.join(libDir, 'main.tf');
    let mainTfContent: string;
    let mainTfParsed: any;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
      try {
        mainTfParsed = parse(mainTfContent);
      } catch (e) {
        console.error('Failed to parse main.tf:', e);
      }
    });

    test('main.tf exists', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test('main.tf contains terraform configuration', () => {
      expect(mainTfContent).toContain('terraform {');
    });

    test('main.tf contains required provider AWS', () => {
      expect(mainTfContent).toContain('hashicorp/aws');
    });

    test('main.tf contains S3 backend configuration', () => {
      expect(mainTfContent).toContain('backend "s3"');
    });

    test('main.tf contains workspace configuration', () => {
      expect(mainTfContent).toContain('workspace_key_prefix');
    });

    test('main.tf contains provider configuration', () => {
      expect(mainTfContent).toContain('provider "aws"');
    });

    test('main.tf contains environment-specific configurations', () => {
      expect(mainTfContent).toContain('env_config');
      expect(mainTfContent).toContain('dev');
      expect(mainTfContent).toContain('staging');
      expect(mainTfContent).toContain('prod');
    });

    test('main.tf references VPC module', () => {
      expect(mainTfContent).toContain('module "vpc"');
      expect(mainTfContent).toContain('./modules/vpc');
    });

    test('main.tf references security groups module', () => {
      expect(mainTfContent).toContain('module "security_groups"');
      expect(mainTfContent).toContain('./modules/security_groups');
    });

    test('main.tf references ALB module', () => {
      expect(mainTfContent).toContain('module "alb"');
      expect(mainTfContent).toContain('./modules/alb');
    });

    test('main.tf references RDS module', () => {
      expect(mainTfContent).toContain('module "rds"');
      expect(mainTfContent).toContain('./modules/rds');
    });

    test('main.tf references ASG module', () => {
      expect(mainTfContent).toContain('module "asg"');
      expect(mainTfContent).toContain('./modules/asg');
    });

    test('main.tf contains data sources', () => {
      expect(mainTfContent).toContain('data "aws_availability_zones"');
      expect(mainTfContent).toContain('data "aws_ami"');
    });

    test('main.tf uses environment suffix variable', () => {
      expect(mainTfContent).toContain('environment_suffix');
    });

    test('main.tf contains common tags', () => {
      expect(mainTfContent).toContain('common_tags');
      expect(mainTfContent).toContain('Project');
      expect(mainTfContent).toContain('Environment');
      expect(mainTfContent).toContain('ManagedBy');
    });

    test('no resources have deletion_protection enabled', () => {
      expect(mainTfContent).not.toContain('deletion_protection = true');
    });
  });

  describe('Variables Configuration', () => {
    const variablesTfPath = path.join(libDir, 'variables.tf');
    let variablesTfContent: string;

    beforeAll(() => {
      variablesTfContent = fs.readFileSync(variablesTfPath, 'utf8');
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(variablesTfPath)).toBe(true);
    });

    test('variables.tf contains aws_region variable', () => {
      expect(variablesTfContent).toContain('variable "aws_region"');
    });

    test('variables.tf contains project_name variable', () => {
      expect(variablesTfContent).toContain('variable "project_name"');
    });

    test('variables.tf contains environment_suffix variable', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    test('variables.tf contains db_password variable', () => {
      expect(variablesTfContent).toContain('variable "db_password"');
    });
  });

  describe('Outputs Configuration', () => {
    const outputsTfPath = path.join(libDir, 'outputs.tf');
    let outputsTfContent: string;

    beforeAll(() => {
      outputsTfContent = fs.readFileSync(outputsTfPath, 'utf8');
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(outputsTfPath)).toBe(true);
    });

    test('outputs.tf contains VPC outputs', () => {
      expect(outputsTfContent).toContain('vpc_id');
    });

    test('outputs.tf contains ALB outputs', () => {
      expect(outputsTfContent).toContain('alb_dns_name');
    });

    test('outputs.tf contains RDS outputs', () => {
      expect(outputsTfContent).toContain('db_endpoint');
    });
  });

  describe('VPC Module', () => {
    const vpcMainPath = path.join(libDir, 'modules/vpc/main.tf');
    const vpcVariablesPath = path.join(libDir, 'modules/vpc/variables.tf');
    const vpcOutputsPath = path.join(libDir, 'modules/vpc/outputs.tf');

    test('VPC module files exist', () => {
      expect(fs.existsSync(vpcMainPath)).toBe(true);
      expect(fs.existsSync(vpcVariablesPath)).toBe(true);
      expect(fs.existsSync(vpcOutputsPath)).toBe(true);
    });

    test('VPC module creates VPC resource', () => {
      const content = fs.readFileSync(vpcMainPath, 'utf8');
      expect(content).toContain('resource "aws_vpc"');
    });

    test('VPC module creates public subnets', () => {
      const content = fs.readFileSync(vpcMainPath, 'utf8');
      expect(content).toContain('aws_subnet');
      expect(content).toContain('public');
    });

    test('VPC module creates private subnets', () => {
      const content = fs.readFileSync(vpcMainPath, 'utf8');
      expect(content).toContain('aws_subnet');
      expect(content).toContain('private');
    });

    test('VPC module creates internet gateway', () => {
      const content = fs.readFileSync(vpcMainPath, 'utf8');
      expect(content).toContain('aws_internet_gateway');
    });

    test('VPC module creates route tables', () => {
      const content = fs.readFileSync(vpcMainPath, 'utf8');
      expect(content).toContain('aws_route_table');
    });

    test('VPC module uses environment_suffix in resource names', () => {
      const content = fs.readFileSync(vpcMainPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });
  });

  describe('Security Groups Module', () => {
    const sgMainPath = path.join(libDir, 'modules/security_groups/main.tf');
    const sgVariablesPath = path.join(libDir, 'modules/security_groups/variables.tf');
    const sgOutputsPath = path.join(libDir, 'modules/security_groups/outputs.tf');

    test('Security groups module files exist', () => {
      expect(fs.existsSync(sgMainPath)).toBe(true);
      expect(fs.existsSync(sgVariablesPath)).toBe(true);
      expect(fs.existsSync(sgOutputsPath)).toBe(true);
    });

    test('Security groups module creates ALB security group', () => {
      const content = fs.readFileSync(sgMainPath, 'utf8');
      expect(content).toContain('resource "aws_security_group"');
      expect(content).toContain('alb');
    });

    test('Security groups module creates ASG security group', () => {
      const content = fs.readFileSync(sgMainPath, 'utf8');
      expect(content).toContain('asg');
    });

    test('Security groups module creates DB security group', () => {
      const content = fs.readFileSync(sgMainPath, 'utf8');
      expect(content).toContain('db');
    });

    test('Security groups module uses environment_suffix in resource names', () => {
      const content = fs.readFileSync(sgMainPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });
  });

  describe('ALB Module', () => {
    const albMainPath = path.join(libDir, 'modules/alb/main.tf');
    const albVariablesPath = path.join(libDir, 'modules/alb/variables.tf');
    const albOutputsPath = path.join(libDir, 'modules/alb/outputs.tf');

    test('ALB module files exist', () => {
      expect(fs.existsSync(albMainPath)).toBe(true);
      expect(fs.existsSync(albVariablesPath)).toBe(true);
      expect(fs.existsSync(albOutputsPath)).toBe(true);
    });

    test('ALB module creates load balancer', () => {
      const content = fs.readFileSync(albMainPath, 'utf8');
      expect(content).toContain('resource "aws_lb"');
    });

    test('ALB module creates target group', () => {
      const content = fs.readFileSync(albMainPath, 'utf8');
      expect(content).toContain('aws_lb_target_group');
    });

    test('ALB module creates listener', () => {
      const content = fs.readFileSync(albMainPath, 'utf8');
      expect(content).toContain('aws_lb_listener');
    });

    test('ALB module uses environment_suffix in resource names', () => {
      const content = fs.readFileSync(albMainPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });
  });

  describe('RDS Module', () => {
    const rdsMainPath = path.join(libDir, 'modules/rds/main.tf');
    const rdsVariablesPath = path.join(libDir, 'modules/rds/variables.tf');
    const rdsOutputsPath = path.join(libDir, 'modules/rds/outputs.tf');

    test('RDS module files exist', () => {
      expect(fs.existsSync(rdsMainPath)).toBe(true);
      expect(fs.existsSync(rdsVariablesPath)).toBe(true);
      expect(fs.existsSync(rdsOutputsPath)).toBe(true);
    });

    test('RDS module creates DB instance', () => {
      const content = fs.readFileSync(rdsMainPath, 'utf8');
      expect(content).toContain('resource "aws_db_instance"');
    });

    test('RDS module creates DB subnet group', () => {
      const content = fs.readFileSync(rdsMainPath, 'utf8');
      expect(content).toContain('aws_db_subnet_group');
    });

    test('RDS module uses environment_suffix in resource names', () => {
      const content = fs.readFileSync(rdsMainPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });

    test('RDS module does not have deletion_protection enabled', () => {
      const content = fs.readFileSync(rdsMainPath, 'utf8');
      expect(content).not.toContain('deletion_protection = true');
    });
  });

  describe('ASG Module', () => {
    const asgMainPath = path.join(libDir, 'modules/asg/main.tf');
    const asgVariablesPath = path.join(libDir, 'modules/asg/variables.tf');
    const asgOutputsPath = path.join(libDir, 'modules/asg/outputs.tf');

    test('ASG module files exist', () => {
      expect(fs.existsSync(asgMainPath)).toBe(true);
      expect(fs.existsSync(asgVariablesPath)).toBe(true);
      expect(fs.existsSync(asgOutputsPath)).toBe(true);
    });

    test('ASG module creates launch template', () => {
      const content = fs.readFileSync(asgMainPath, 'utf8');
      expect(content).toContain('resource "aws_launch_template"');
    });

    test('ASG module creates auto scaling group', () => {
      const content = fs.readFileSync(asgMainPath, 'utf8');
      expect(content).toContain('aws_autoscaling_group');
    });

    test('ASG module creates scaling policies', () => {
      const content = fs.readFileSync(asgMainPath, 'utf8');
      expect(content).toContain('aws_autoscaling_policy');
    });

    test('ASG module uses environment_suffix in resource names', () => {
      const content = fs.readFileSync(asgMainPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });
  });

  describe('Environment Configuration', () => {
    const devTfvarsPath = path.join(libDir, 'dev.tfvars');
    const stagingTfvarsPath = path.join(libDir, 'staging.tfvars');
    const prodTfvarsPath = path.join(libDir, 'prod.tfvars');

    test('environment tfvars files exist', () => {
      expect(fs.existsSync(devTfvarsPath)).toBe(true);
      expect(fs.existsSync(stagingTfvarsPath)).toBe(true);
      expect(fs.existsSync(prodTfvarsPath)).toBe(true);
    });

    test('dev.tfvars contains environment_suffix', () => {
      const content = fs.readFileSync(devTfvarsPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });

    test('staging.tfvars contains environment_suffix', () => {
      const content = fs.readFileSync(stagingTfvarsPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });

    test('prod.tfvars contains environment_suffix', () => {
      const content = fs.readFileSync(prodTfvarsPath, 'utf8');
      expect(content).toContain('environment_suffix');
    });
  });

  describe('Module Dependencies', () => {
    const mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');

    test('security groups module depends on VPC', () => {
      expect(mainTfContent).toContain('vpc_id');
      const sgModuleIndex = mainTfContent.indexOf('module "security_groups"');
      const vpcIdIndex = mainTfContent.indexOf('vpc_id', sgModuleIndex);
      const nextModuleIndex = mainTfContent.indexOf('module "alb"', sgModuleIndex);
      expect(vpcIdIndex).toBeGreaterThan(sgModuleIndex);
      expect(vpcIdIndex).toBeLessThan(nextModuleIndex);
    });

    test('ALB module depends on security groups', () => {
      expect(mainTfContent).toContain('alb_security_group_id');
      const albModuleIndex = mainTfContent.indexOf('module "alb"');
      const sgIdIndex = mainTfContent.indexOf('alb_security_group_id', albModuleIndex);
      const nextModuleIndex = mainTfContent.indexOf('module "rds"', albModuleIndex);
      expect(sgIdIndex).toBeGreaterThan(albModuleIndex);
      expect(sgIdIndex).toBeLessThan(nextModuleIndex);
    });

    test('RDS module depends on security groups', () => {
      expect(mainTfContent).toContain('db_security_group_id');
      const rdsModuleIndex = mainTfContent.indexOf('module "rds"');
      const dbSgIdIndex = mainTfContent.indexOf('db_security_group_id', rdsModuleIndex);
      const nextModuleIndex = mainTfContent.indexOf('module "asg"', rdsModuleIndex);
      expect(dbSgIdIndex).toBeGreaterThan(rdsModuleIndex);
      expect(dbSgIdIndex).toBeLessThan(nextModuleIndex);
    });

    test('ASG module depends on ALB and RDS', () => {
      expect(mainTfContent).toContain('target_group_arns');
      expect(mainTfContent).toContain('db_endpoint');
      const asgModuleIndex = mainTfContent.indexOf('module "asg"');
      const tgArnIndex = mainTfContent.indexOf('target_group_arns', asgModuleIndex);
      const dbEndpointIndex = mainTfContent.indexOf('db_endpoint', asgModuleIndex);
      expect(tgArnIndex).toBeGreaterThan(asgModuleIndex);
      expect(dbEndpointIndex).toBeGreaterThan(asgModuleIndex);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all modules use consistent naming pattern', () => {
      const modules = ['vpc', 'security_groups', 'alb', 'rds', 'asg'];
      modules.forEach(moduleName => {
        const modulePath = path.join(libDir, 'modules', moduleName, 'main.tf');
        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content).toMatch(/\$\{var\.project_name\}/);
        expect(content).toMatch(/\$\{var\.environment\}/);
        expect(content).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });
  });
});
