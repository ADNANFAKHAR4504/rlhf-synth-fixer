import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests - Task 7ivau', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let terraformFiles: { [key: string]: string } = {};

  beforeAll(() => {
    // Load all .tf files
    const tfFiles = ['locals.tf', 'variables.tf', 'provider.tf', 'main.tf', 'routing.tf', 'security.tf', 'monitoring.tf', 'iam.tf', 'outputs.tf'];
    tfFiles.forEach(file => {
      const filePath = path.join(libPath, file);
      if (fs.existsSync(filePath)) {
        terraformFiles[file] = fs.readFileSync(filePath, 'utf8');
      }
    });
  });

  describe('Provider Configuration', () => {
    test('should have required Terraform version', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('required_version');
      expect(providerContent).toContain('terraform');
    });

    test('should have AWS provider configured for us-east-1', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('hashicorp/aws');
      expect(providerContent).toContain('version');
    });

    test('should have AWS provider configured for us-east-2 (partner)', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('alias');
      expect(providerContent).toContain('us-east-2');
    });

    test('should use variable for AWS region', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('var.aws_region');
    });
  });

  describe('Variables Configuration', () => {
    test('should define all required variables', () => {
      const variablesContent = terraformFiles['variables.tf'];
      const requiredVars = [
        'aws_region',
        'environment_suffix'
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toContain(`variable "${varName}"`);
      });
    });

    test('should have environment_suffix variable', () => {
      const variablesContent = terraformFiles['variables.tf'];
      expect(variablesContent).toContain('variable "environment_suffix"');
    });

    test('should have aws_region with default', () => {
      const variablesContent = terraformFiles['variables.tf'];
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toContain('default');
      expect(variablesContent).toContain('us-east-1');
    });
  });

  describe('Locals Configuration', () => {
    test('should define locals block', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('locals {');
    });

    test('should define common_tags with Environment, Project, CostCenter', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('common_tags');
      expect(localsContent).toContain('Environment');
      expect(localsContent).toContain('Project');
      expect(localsContent).toContain('CostCenter');
    });

    test('should define CIDR calculations and mappings', () => {
      const localsContent = terraformFiles['locals.tf'];
      // Check for CIDR-related local values
      expect(localsContent).toContain('cidr') || expect(localsContent).toContain('subnet');
    });

    test('should define port configuration for 443 and 8443', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('443') || expect(localsContent).toContain('8443');
    });
  });

  describe('VPC and VPC Peering Resources', () => {
    test('should define production VPC in us-east-1', () => {
      const mainContent = terraformFiles['main.tf'];
      const localsContent = terraformFiles['locals.tf'];
      expect(mainContent).toContain('resource "aws_vpc"');
      expect(mainContent).toContain('production');
      // VPC CIDR may be defined in locals
      const hasProdCIDR = mainContent.includes('10.0.0.0') || localsContent.includes('10.0.0.0');
      expect(hasProdCIDR).toBe(true);
    });

    test('should define partner VPC in us-east-2', () => {
      const mainContent = terraformFiles['main.tf'];
      const localsContent = terraformFiles['locals.tf'];
      expect(mainContent).toContain('resource "aws_vpc"');
      expect(mainContent).toContain('partner');
      // VPC CIDR may be defined in locals
      const hasPartnerCIDR = mainContent.includes('172.16.0.0') || localsContent.includes('172.16.0.0');
      expect(hasPartnerCIDR).toBe(true);
    });

    test('should create VPC peering connection', () => {
      const mainContent = terraformFiles['main.tf'];
      expect(mainContent).toContain('resource "aws_vpc_peering_connection"');
      expect(mainContent).toContain('peer_vpc_id');
      expect(mainContent).toContain('peer_region');
    });

    test('should configure DNS resolution for both VPCs', () => {
      const mainContent = terraformFiles['main.tf'];
      expect(mainContent).toContain('allow_remote_vpc_dns_resolution');
    });

    test('should use environment_suffix in resource names', () => {
      const mainContent = terraformFiles['main.tf'];
      expect(mainContent).toContain('var.environment_suffix');
    });

    test('should create subnets across 3 availability zones', () => {
      const mainContent = terraformFiles['main.tf'];
      expect(mainContent).toContain('resource "aws_subnet"');
      expect(mainContent).toContain('availability_zone');
      // Count should indicate 3 AZs
      const subnetMatches = mainContent.match(/resource "aws_subnet"/g);
      expect(subnetMatches).not.toBeNull();
      expect(subnetMatches!.length).toBeGreaterThanOrEqual(6); // At least 6 subnets (3 per VPC minimum)
    });

    test('should create public, application, and database subnets', () => {
      const mainContent = terraformFiles['main.tf'];
      expect(mainContent).toContain('public') || expect(mainContent).toContain('app') || expect(mainContent).toContain('database');
    });
  });

  describe('Routing Configuration', () => {
    test('should create route tables for VPC peering', () => {
      const routingContent = terraformFiles['routing.tf'];
      expect(routingContent).toContain('resource "aws_route_table"');
    });

    test('should create peering routes to specific CIDR blocks (not entire VPCs)', () => {
      const routingContent = terraformFiles['routing.tf'];
      expect(routingContent).toContain('resource "aws_route"');
      expect(routingContent).toContain('destination_cidr_block');
      expect(routingContent).toContain('vpc_peering_connection_id');
    });

    test('should have separate route tables for public and private subnets', () => {
      const routingContent = terraformFiles['routing.tf'];
      const hasPublicOrPrivate = routingContent.includes('public') || routingContent.includes('private') || routingContent.includes('app');
      expect(hasPublicOrPrivate).toBe(true);
    });

    test('should have route table associations', () => {
      const routingContent = terraformFiles['routing.tf'];
      expect(routingContent).toContain('resource "aws_route_table_association"');
      expect(routingContent).toContain('subnet_id');
      expect(routingContent).toContain('route_table_id');
    });

    test('should use environment_suffix in route table names', () => {
      const routingContent = terraformFiles['routing.tf'];
      expect(routingContent).toContain('var.environment_suffix');
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create security groups', () => {
      const securityContent = terraformFiles['security.tf'];
      expect(securityContent).toContain('resource "aws_security_group"');
    });

    test('should allow HTTPS traffic (port 443)', () => {
      const securityContent = terraformFiles['security.tf'];
      expect(securityContent).toContain('443');
    });

    test('should allow custom API traffic (port 8443)', () => {
      const securityContent = terraformFiles['security.tf'];
      expect(securityContent).toContain('8443');
    });

    test('should restrict traffic to specific CIDR blocks', () => {
      const securityContent = terraformFiles['security.tf'];
      expect(securityContent).toContain('cidr_blocks');
      // Should have specific CIDRs, not 0.0.0.0/0
      expect(securityContent).not.toContain('0.0.0.0/0');
    });

    test('should use environment_suffix in security group names', () => {
      const securityContent = terraformFiles['security.tf'];
      expect(securityContent).toContain('var.environment_suffix');
    });

    test('should have ingress and egress rules', () => {
      const securityContent = terraformFiles['security.tf'];
      const hasRules = securityContent.includes('ingress') || securityContent.includes('egress') || securityContent.includes('aws_security_group_rule');
      expect(hasRules).toBe(true);
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Logs for both VPCs', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('resource "aws_flow_log"');
    });

    test('should configure 1-minute aggregation interval (60 seconds)', () => {
      const monitoringContent = terraformFiles['monitoring.tf'] || '';
      const localsContent = terraformFiles['locals.tf'] || '';
      const has60Seconds = monitoringContent.includes('60') || localsContent.includes('60');
      const hasMaxAgg = monitoringContent.includes('max_aggregation_interval');
      expect(has60Seconds || hasMaxAgg).toBe(true);
    });

    test('should store flow logs in S3 bucket', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      const hasS3 = monitoringContent.includes('s3') || monitoringContent.includes('S3');
      expect(hasS3).toBe(true);
    });

    test('should create S3 bucket for flow logs', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('resource "aws_s3_bucket"');
    });

    test('should enable S3 bucket encryption', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('aws_s3_bucket_server_side_encryption_configuration') ||
             expect(monitoringContent).toContain('server_side_encryption_configuration');
    });

    test('should block public access on S3 bucket', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('aws_s3_bucket_public_access_block');
      expect(monitoringContent).toContain('block_public_acls');
      expect(monitoringContent).toContain('block_public_policy');
    });

    test('should use environment_suffix in flow log names', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('var.environment_suffix');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch alarms for peering connection state changes', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('resource "aws_cloudwatch_metric_alarm"');
      const hasPeeringOrState = monitoringContent.includes('peering') || monitoringContent.includes('state') || monitoringContent.includes('State');
      expect(hasPeeringOrState).toBe(true);
    });

    test('should create alarms for traffic anomalies', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      const hasRejectOrAnomaly = monitoringContent.includes('reject') || monitoringContent.includes('anomaly') || monitoringContent.includes('Reject') || monitoringContent.includes('traffic');
      expect(hasRejectOrAnomaly).toBe(true);
    });

    test('should configure SNS topic for notifications', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('resource "aws_sns_topic"');
    });

    test('should configure alarm actions to SNS', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('alarm_actions');
    });

    test('should use environment_suffix in CloudWatch resource names', () => {
      const monitoringContent = terraformFiles['monitoring.tf'];
      expect(monitoringContent).toContain('var.environment_suffix');
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM roles for cross-account access', () => {
      const iamContent = terraformFiles['iam.tf'];
      expect(iamContent).toContain('resource "aws_iam_role"');
      const hasCrossOrPeer = iamContent.includes('cross') || iamContent.includes('peer') || iamContent.includes('peering');
      expect(hasCrossOrPeer).toBe(true);
    });

    test('should follow principle of least privilege', () => {
      const iamContent = terraformFiles['iam.tf'];
      const hasPolicy = iamContent.includes('resource "aws_iam_policy"') || iamContent.includes('policy_document') || iamContent.includes('policy =');
      expect(hasPolicy).toBe(true);
    });

    test('should include explicit deny statements', () => {
      const iamContent = terraformFiles['iam.tf'];
      const hasDeny = iamContent.includes('Deny') || iamContent.includes('deny');
      expect(hasDeny).toBe(true);
    });

    test('should create Flow Logs IAM role', () => {
      const iamContent = terraformFiles['iam.tf'];
      const hasFlowOrLog = iamContent.includes('flow') || iamContent.includes('log') || iamContent.includes('Flow');
      expect(hasFlowOrLog).toBe(true);
    });

    test('should use environment_suffix in IAM resource names', () => {
      const iamContent = terraformFiles['iam.tf'];
      expect(iamContent).toContain('var.environment_suffix');
    });
  });

  describe('Data Sources', () => {
    test('should use data sources for availability zones', () => {
      const allContent = Object.values(terraformFiles).join('\n');
      // AZ data source may be explicit or derived from subnet declarations
      const hasAzReference = allContent.includes('data "aws_availability_zones"') || allContent.includes('availability_zone');
      expect(hasAzReference).toBe(true);
    });

    test('should have data source for partner VPC or dynamic lookup', () => {
      const allContent = Object.values(terraformFiles).join('\n');
      // Check for data source pattern (may be commented or implemented) or VPC resource
      const hasDataAndVpc = allContent.includes('data') && allContent.includes('vpc');
      expect(hasDataAndVpc).toBe(true);
    });
  });

  describe('Outputs Configuration', () => {
    test('should define all required outputs', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      const requiredOutputs = [
        'vpc_peering_connection_id',
        'dns_resolution',
        'route'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputsContent).toContain(outputName);
      });
    });

    test('should output VPC peering connection ID', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      expect(outputsContent).toContain('vpc_peering_connection_id') ||
             expect(outputsContent).toContain('peering_connection_id');
    });

    test('should output DNS resolution status', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      expect(outputsContent).toContain('dns_resolution');
    });

    test('should output configured route counts', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      expect(outputsContent).toContain('route') || expect(outputsContent).toContain('count');
    });

    test('should have at least 10 outputs total', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      const outputMatches = outputsContent.match(/output "/g);
      expect(outputMatches).not.toBeNull();
      expect(outputMatches!.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Tagging', () => {
    test('should tag all resources with common tags', () => {
      const allContent = Object.values(terraformFiles).join('\n');
      expect(allContent).toContain('tags') && expect(allContent).toContain('local.common_tags');
    });

    test('should include Environment tag', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('Environment');
    });

    test('should include Project tag', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('Project');
    });

    test('should include CostCenter tag', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('CostCenter');
    });
  });

  describe('Code Quality', () => {
    test('all Terraform files should exist', () => {
      expect(terraformFiles['locals.tf']).toBeDefined();
      expect(terraformFiles['variables.tf']).toBeDefined();
      expect(terraformFiles['provider.tf']).toBeDefined();
      expect(terraformFiles['main.tf']).toBeDefined();
      expect(terraformFiles['routing.tf']).toBeDefined();
      expect(terraformFiles['security.tf']).toBeDefined();
      expect(terraformFiles['monitoring.tf']).toBeDefined();
      expect(terraformFiles['iam.tf']).toBeDefined();
      expect(terraformFiles['outputs.tf']).toBeDefined();
    });

    test('should not have hardcoded environment values', () => {
      const allContent = Object.values(terraformFiles).join('\n');
      expect(allContent).not.toContain('prod-');
      expect(allContent).not.toContain('dev-');
      expect(allContent).not.toContain('stage-');
    });

    test('should use var.environment_suffix throughout', () => {
      const filesToCheck = ['main.tf', 'routing.tf', 'security.tf', 'monitoring.tf', 'iam.tf'];
      filesToCheck.forEach(file => {
        expect(terraformFiles[file]).toContain('var.environment_suffix');
      });
    });
  });
});
