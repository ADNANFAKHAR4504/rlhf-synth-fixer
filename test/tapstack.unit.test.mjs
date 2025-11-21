/**
 * Unit tests for CloudFormation template validation
 * Tests template structure, resources, parameters, and outputs using validator module
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  loadTemplate,
  validateTemplateStructure,
  validateParameters,
  getResourcesByType,
  validateVPCResources,
  validateNetworkingResources,
  validateSecurityGroups,
  validateECSResources,
  validateLoadBalancerResources,
  validateRDSResources,
  validateSecretsManagerResources,
  validateIAMResources,
  checkEnvironmentSuffixUsage,
  validateResourceCount,
  validateDeletionPolicies,
  validateAll,
} from '../lib/template-validator.mjs';

describe('CloudFormation Template Unit Tests', () => {
  let template;

  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Loading', () => {
    it('should load template successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Template Structure Validation', () => {
    it('should have valid template structure', () => {
      const result = validateTemplateStructure(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing AWSTemplateFormatVersion', () => {
      const invalidTemplate = { Description: 'test', Parameters: {}, Resources: {} };
      const result = validateTemplateStructure(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing AWSTemplateFormatVersion');
    });

    it('should detect missing Description', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Parameters: {}, Resources: {} };
      const result = validateTemplateStructure(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or empty Description');
    });

    it('should detect missing Parameters', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Resources: {} };
      const result = validateTemplateStructure(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid Parameters section');
    });

    it('should detect missing Resources', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Parameters: {} };
      const result = validateTemplateStructure(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid Resources section');
    });
  });

  describe('Parameters Validation', () => {
    it('should have valid parameters', () => {
      const result = validateParameters(template.Parameters);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing EnvironmentSuffix', () => {
      const params = { ContainerImage: {Type: 'String'}, DBUsername: {Type: 'String'} };
      const result = validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: EnvironmentSuffix');
    });

    it('should detect missing ContainerImage', () => {
      const params = { EnvironmentSuffix: {Type: 'String'}, DBUsername: {Type: 'String'} };
      const result = validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: ContainerImage');
    });

    it('should detect missing DBUsername', () => {
      const params = { EnvironmentSuffix: {Type: 'String'}, ContainerImage: {Type: 'String'} };
      const result = validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: DBUsername');
    });

    it('should detect wrong type for EnvironmentSuffix', () => {
      const params = {
        EnvironmentSuffix: {Type: 'Number', AllowedPattern: '[a-z0-9-]+'},
        ContainerImage: {Type: 'String'},
        DBUsername: {Type: 'String'}
      };
      const result = validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EnvironmentSuffix must be of type String');
    });

    it('should detect missing AllowedPattern', () => {
      const params = {
        EnvironmentSuffix: {Type: 'String'},
        ContainerImage: {Type: 'String'},
        DBUsername: {Type: 'String'}
      };
      const result = validateParameters(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EnvironmentSuffix missing AllowedPattern');
    });
  });

  describe('VPC Resources Validation', () => {
    it('should have valid VPC resources', () => {
      const result = validateVPCResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing VPC', () => {
      const result = validateVPCResources({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No VPC resource found');
    });

    it('should detect multiple VPCs', () => {
      const resources = {
        VPC1: { Type: 'AWS::EC2::VPC', Properties: {CidrBlock: '10.0.0.0/16', EnableDnsHostnames: true, EnableDnsSupport: true} },
        VPC2: { Type: 'AWS::EC2::VPC', Properties: {CidrBlock: '10.1.0.0/16', EnableDnsHostnames: true, EnableDnsSupport: true} }
      };
      const result = validateVPCResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Multiple VPC resources found');
    });

    it('should detect missing DNS hostnames', () => {
      const resources = {
        VPC: { Type: 'AWS::EC2::VPC', Properties: {CidrBlock: '10.0.0.0/16', EnableDnsHostnames: false, EnableDnsSupport: true} }
      };
      const result = validateVPCResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('VPC DNS hostnames not enabled');
    });

    it('should detect missing DNS support', () => {
      const resources = {
        VPC: { Type: 'AWS::EC2::VPC', Properties: {CidrBlock: '10.0.0.0/16', EnableDnsHostnames: true, EnableDnsSupport: false} }
      };
      const result = validateVPCResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('VPC DNS support not enabled');
    });

    it('should detect wrong CIDR block', () => {
      const resources = {
        VPC: { Type: 'AWS::EC2::VPC', Properties: {CidrBlock: '172.16.0.0/16', EnableDnsHostnames: true, EnableDnsSupport: true} }
      };
      const result = validateVPCResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('VPC CIDR block is not 10.0.0.0/16');
    });
  });

  describe('Networking Resources Validation', () => {
    it('should have valid networking resources', () => {
      const result = validateNetworkingResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect wrong number of subnets', () => {
      const resources = {
        Subnet1: { Type: 'AWS::EC2::Subnet', Properties: {} }
      };
      const result = validateNetworkingResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 4 subnets, found 1');
    });

    it('should detect wrong number of NAT gateways', () => {
      const resources = {
        Subnet1: { Type: 'AWS::EC2::Subnet', Properties: {} },
        Subnet2: { Type: 'AWS::EC2::Subnet', Properties: {} },
        Subnet3: { Type: 'AWS::EC2::Subnet', Properties: {} },
        Subnet4: { Type: 'AWS::EC2::Subnet', Properties: {} },
        NAT1: { Type: 'AWS::EC2::NatGateway', Properties: {} },
        IGW: { Type: 'AWS::EC2::InternetGateway', Properties: {} }
      };
      const result = validateNetworkingResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 2 NAT gateways, found 1');
    });

    it('should detect wrong number of Internet Gateways', () => {
      const resources = {
        Subnet1: { Type: 'AWS::EC2::Subnet', Properties: {} },
        Subnet2: { Type: 'AWS::EC2::Subnet', Properties: {} },
        Subnet3: { Type: 'AWS::EC2::Subnet', Properties: {} },
        Subnet4: { Type: 'AWS::EC2::Subnet', Properties: {} },
        NAT1: { Type: 'AWS::EC2::NatGateway', Properties: {} },
        NAT2: { Type: 'AWS::EC2::NatGateway', Properties: {} }
      };
      const result = validateNetworkingResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 Internet gateway, found 0');
    });
  });

  describe('Security Groups Validation', () => {
    it('should have valid security groups', () => {
      const result = validateSecurityGroups(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect insufficient security groups', () => {
      const resources = {
        SG1: { Type: 'AWS::EC2::SecurityGroup', Properties: {} }
      };
      const result = validateSecurityGroups(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected at least 3 security groups, found 1');
    });
  });

  describe('ECS Resources Validation', () => {
    it('should have valid ECS resources', () => {
      const result = validateECSResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing ECS cluster', () => {
      const resources = {
        Service: { Type: 'AWS::ECS::Service', Properties: {} },
        TaskDef: { Type: 'AWS::ECS::TaskDefinition', Properties: {RequiresCompatibilities: ['FARGATE']} }
      };
      const result = validateECSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 ECS cluster, found 0');
    });

    it('should detect missing ECS service', () => {
      const resources = {
        Cluster: { Type: 'AWS::ECS::Cluster', Properties: {} },
        TaskDef: { Type: 'AWS::ECS::TaskDefinition', Properties: {RequiresCompatibilities: ['FARGATE']} }
      };
      const result = validateECSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 ECS service, found 0');
    });

    it('should detect missing task definition', () => {
      const resources = {
        Cluster: { Type: 'AWS::ECS::Cluster', Properties: {} },
        Service: { Type: 'AWS::ECS::Service', Properties: {} }
      };
      const result = validateECSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 task definition, found 0');
    });

    it('should detect missing Fargate compatibility', () => {
      const resources = {
        Cluster: { Type: 'AWS::ECS::Cluster', Properties: {} },
        Service: { Type: 'AWS::ECS::Service', Properties: {} },
        TaskDef: { Type: 'AWS::ECS::TaskDefinition', Properties: {RequiresCompatibilities: ['EC2']} }
      };
      const result = validateECSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task definition must support FARGATE');
    });
  });

  describe('Load Balancer Resources Validation', () => {
    it('should have valid load balancer resources', () => {
      const result = validateLoadBalancerResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing ALB', () => {
      const resources = {
        TG: { Type: 'AWS::ElasticLoadBalancingV2::TargetGroup', Properties: {TargetType: 'ip'} },
        Listener: { Type: 'AWS::ElasticLoadBalancingV2::Listener', Properties: {} }
      };
      const result = validateLoadBalancerResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 ALB, found 0');
    });

    it('should detect missing target group', () => {
      const resources = {
        ALB: { Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer', Properties: {} },
        Listener: { Type: 'AWS::ElasticLoadBalancingV2::Listener', Properties: {} }
      };
      const result = validateLoadBalancerResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 target group, found 0');
    });

    it('should detect wrong target type', () => {
      const resources = {
        ALB: { Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer', Properties: {} },
        TG: { Type: 'AWS::ElasticLoadBalancingV2::TargetGroup', Properties: {TargetType: 'instance'} },
        Listener: { Type: 'AWS::ElasticLoadBalancingV2::Listener', Properties: {} }
      };
      const result = validateLoadBalancerResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Target group must have TargetType of ip for Fargate');
    });

    it('should detect missing listener', () => {
      const resources = {
        ALB: { Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer', Properties: {} },
        TG: { Type: 'AWS::ElasticLoadBalancingV2::TargetGroup', Properties: {TargetType: 'ip'} }
      };
      const result = validateLoadBalancerResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 listener, found 0');
    });
  });

  describe('RDS Resources Validation', () => {
    it('should have valid RDS resources', () => {
      const result = validateRDSResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing DB cluster', () => {
      const resources = {
        Instance: { Type: 'AWS::RDS::DBInstance', Properties: {} },
        SubnetGroup: { Type: 'AWS::RDS::DBSubnetGroup', Properties: {} }
      };
      const result = validateRDSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 DB cluster, found 0');
    });

    it('should detect wrong engine type', () => {
      const resources = {
        Cluster: { Type: 'AWS::RDS::DBCluster', Properties: {Engine: 'postgres'} },
        Instance: { Type: 'AWS::RDS::DBInstance', Properties: {} },
        SubnetGroup: { Type: 'AWS::RDS::DBSubnetGroup', Properties: {} }
      };
      const result = validateRDSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('DB cluster must use aurora-mysql engine');
    });

    it('should detect missing DB instance', () => {
      const resources = {
        Cluster: { Type: 'AWS::RDS::DBCluster', Properties: {Engine: 'aurora-mysql'} },
        SubnetGroup: { Type: 'AWS::RDS::DBSubnetGroup', Properties: {} }
      };
      const result = validateRDSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 DB instance, found 0');
    });

    it('should detect missing DB subnet group', () => {
      const resources = {
        Cluster: { Type: 'AWS::RDS::DBCluster', Properties: {Engine: 'aurora-mysql'} },
        Instance: { Type: 'AWS::RDS::DBInstance', Properties: {} }
      };
      const result = validateRDSResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 DB subnet group, found 0');
    });
  });

  describe('Secrets Manager Resources Validation', () => {
    it('should have valid secrets manager resources', () => {
      const result = validateSecretsManagerResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing secret', () => {
      const resources = {
        Attachment: { Type: 'AWS::SecretsManager::SecretTargetAttachment', Properties: {} }
      };
      const result = validateSecretsManagerResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 secret, found 0');
    });

    it('should detect missing secret attachment', () => {
      const resources = {
        Secret: { Type: 'AWS::SecretsManager::Secret', Properties: {} }
      };
      const result = validateSecretsManagerResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 1 secret attachment, found 0');
    });
  });

  describe('IAM Resources Validation', () => {
    it('should have valid IAM resources', () => {
      const result = validateIAMResources(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect insufficient IAM roles', () => {
      const resources = {
        Role1: { Type: 'AWS::IAM::Role', Properties: {AssumeRolePolicyDocument: {Statement: [{Principal: {Service: ['ecs-tasks.amazonaws.com']}}]}} }
      };
      const result = validateIAMResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected at least 2 IAM roles, found 1');
    });

    it('should detect insufficient ECS task roles', () => {
      const resources = {
        Role1: { Type: 'AWS::IAM::Role', Properties: {AssumeRolePolicyDocument: {Statement: [{Principal: {Service: ['ecs-tasks.amazonaws.com']}}]}} },
        Role2: { Type: 'AWS::IAM::Role', Properties: {AssumeRolePolicyDocument: {Statement: [{Principal: {Service: ['lambda.amazonaws.com']}}]}} }
      };
      const result = validateIAMResources(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected at least 2 ECS task-related IAM roles');
    });
  });

  describe('Resource Count Validation', () => {
    it('should have valid resource count', () => {
      const result = validateResourceCount(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.count).toBe(40);
    });

    it('should detect wrong resource count', () => {
      const resources = {
        Resource1: { Type: 'AWS::EC2::VPC', Properties: {} }
      };
      const result = validateResourceCount(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected 40 resources, found 1');
    });
  });

  describe('Deletion Policies Validation', () => {
    it('should not have Retain deletion policies', () => {
      const result = validateDeletionPolicies(template.Resources);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect Retain deletion policy', () => {
      const resources = {
        Bucket: { Type: 'AWS::S3::Bucket', Properties: {}, DeletionPolicy: 'Retain' }
      };
      const result = validateDeletionPolicies(resources);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Resource Bucket has DeletionPolicy=Retain');
    });

    it('should warn about Retain update replace policy', () => {
      const resources = {
        Bucket: { Type: 'AWS::S3::Bucket', Properties: {}, UpdateReplacePolicy: 'Retain' }
      };
      const result = validateDeletionPolicies(resources);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Resource Bucket has UpdateReplacePolicy=Retain');
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should use EnvironmentSuffix in resource names', () => {
      const usage = checkEnvironmentSuffixUsage(template.Resources);
      expect(usage.totalNamingPoints).toBeGreaterThan(0);
      expect(usage.usingSuffix).toBeGreaterThan(0);
    });

    it('should calculate zero percentage for empty resources', () => {
      const usage = checkEnvironmentSuffixUsage({});
      expect(usage.totalNamingPoints).toBe(0);
      expect(usage.usingSuffix).toBe(0);
      expect(usage.percentage).toBe(0);
    });
  });

  describe('Get Resources By Type', () => {
    it('should get resources by type', () => {
      const vpcs = getResourcesByType(template.Resources, 'AWS::EC2::VPC');
      expect(vpcs.length).toBeGreaterThan(0);
      expect(vpcs[0].name).toBe('VPC');
    });

    it('should return empty array for non-existent type', () => {
      const resources = getResourcesByType(template.Resources, 'AWS::NonExistent::Resource');
      expect(resources.length).toBe(0);
    });
  });

  describe('Comprehensive Validation', () => {
    it('should have all validation categories', () => {
      const result = validateAll(template);
      expect(result.results.structure).toBeDefined();
      expect(result.results.parameters).toBeDefined();
      expect(result.results.vpc).toBeDefined();
      expect(result.results.networking).toBeDefined();
      expect(result.results.securityGroups).toBeDefined();
      expect(result.results.ecs).toBeDefined();
      expect(result.results.loadBalancer).toBeDefined();
      expect(result.results.rds).toBeDefined();
      expect(result.results.secretsManager).toBeDefined();
      expect(result.results.iam).toBeDefined();
      expect(result.results.resourceCount).toBeDefined();
      expect(result.results.deletionPolicies).toBeDefined();
    });
  });
});
