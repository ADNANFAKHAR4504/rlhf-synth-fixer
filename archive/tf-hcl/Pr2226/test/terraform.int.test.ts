// Comprehensive Integration Tests for Terraform Infrastructure
// Tests validate actual deployment outputs from live AWS infrastructure
// These tests REQUIRE deployed infrastructure - they will fail if deployment outputs are missing

import fs from 'fs';
import path from 'path';

interface DeploymentOutputs {
  [key: string]: string;
}

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: DeploymentOutputs;
  let flatOutputsPath: string;
  let allOutputsPath: string;

  beforeAll(() => {
    // Use flat-outputs.json as it's easier to work with for integration tests
    flatOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
    allOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

    // These tests require deployed infrastructure - fail if outputs don't exist
    if (!fs.existsSync(flatOutputsPath)) {
      throw new Error(`Integration tests require deployed infrastructure. Missing: ${flatOutputsPath}`);
    }

    const outputsContent = fs.readFileSync(flatOutputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Ensure we have actual outputs from deployment
    if (!outputs || Object.keys(outputs).length === 0) {
      throw new Error('Integration tests require actual deployment outputs, but flat-outputs.json is empty');
    }
  });

  describe('Deployment Outputs Validation', () => {
    test('cfn-outputs/flat-outputs.json exists and contains deployment outputs', () => {
      expect(fs.existsSync(flatOutputsPath)).toBe(true);
      expect(outputs).toBeInstanceOf(Object);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('all expected output keys are present', () => {
      const expectedKeys = [
        'vpc_ids_use1', 'vpc_ids_apse2',
        'private_subnet_ids_use1_a', 'private_subnet_ids_use1_b',
        'private_subnet_ids_apse2_a', 'private_subnet_ids_apse2_b',
        'bastion_public_dns_use1', 'bastion_public_dns_apse2',
        'alb_dns_names_use1', 'alb_dns_names_apse2',
        'alb_arns_use1', 'alb_arns_apse2',
        'rds_endpoints_use1', 'rds_endpoints_apse2',
        'ecs_cluster_names_use1', 'ecs_cluster_names_apse2',
        's3_bucket_names_main_use1', 's3_bucket_names_main_apse2'
      ];

      expectedKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe('string');
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });

    test('conditional outputs exist when features are enabled', () => {
      // CloudTrail and WAF outputs may be null if features are disabled
      const conditionalKeys = [
        'cloudtrail_arns_use1', 'cloudtrail_arns_apse2',
        'waf_web_acl_arns_use1', 'waf_web_acl_arns_apse2'
      ];

      conditionalKeys.forEach(key => {
        // Key should exist but value may be null or empty if feature is disabled
        expect(outputs).toHaveProperty(key);
      });
    });
  });

  describe('Multi-Region VPC Infrastructure', () => {
    test('VPC IDs exist for both regions and follow AWS format', () => {
      expect(outputs['vpc_ids_use1']).toBeDefined();
      expect(outputs['vpc_ids_apse2']).toBeDefined();

      expect(outputs['vpc_ids_use1']).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(outputs['vpc_ids_apse2']).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    test('private subnet IDs exist for both regions and AZs', () => {
      const regions = ['use1', 'apse2'];
      const azs = ['a', 'b'];

      regions.forEach(region => {
        azs.forEach(az => {
          const key = `private_subnet_ids_${region}_${az}`;
          expect(outputs[key]).toBeDefined();
          expect(outputs[key]).toMatch(/^subnet-[a-f0-9]{17}$/);
        });
      });
    });

    test('VPC and subnet IDs are unique across regions', () => {
      const vpcIds = [
        outputs['vpc_ids_use1'],
        outputs['vpc_ids_apse2']
      ];

      const uniqueVpcIds = new Set(vpcIds);
      expect(uniqueVpcIds.size).toBe(2);

      // Ensure subnets are unique within each region
      const subnetIds = [
        outputs['private_subnet_ids_use1_a'],
        outputs['private_subnet_ids_use1_b'],
        outputs['private_subnet_ids_apse2_a'],
        outputs['private_subnet_ids_apse2_b']
      ];
      const uniqueSubnetIds = new Set(subnetIds);
      expect(uniqueSubnetIds.size).toBe(4);
    });
  });

  describe('Bastion Host Configuration', () => {
    test('bastion public DNS names exist for both regions', () => {
      expect(outputs['bastion_public_dns_use1']).toBeDefined();
      expect(outputs['bastion_public_dns_apse2']).toBeDefined();
      expect(outputs['bastion_public_dns_use1'].length).toBeGreaterThan(0);
      expect(outputs['bastion_public_dns_apse2'].length).toBeGreaterThan(0);
    });

    test('bastion DNS names follow AWS EC2 format', () => {
      const dnsPattern = /^ec2-\d+-\d+-\d+-\d+\.(.*\.)?compute(-1)?\.amazonaws\.com$/;

      expect(outputs['bastion_public_dns_use1']).toMatch(dnsPattern);
      expect(outputs['bastion_public_dns_apse2']).toMatch(dnsPattern);
    });

    test('bastion DNS names contain correct region indicators', () => {
      expect(outputs['bastion_public_dns_use1']).toMatch(/compute-1\.amazonaws\.com$/);
      expect(outputs['bastion_public_dns_apse2']).toMatch(/ap-southeast-2\.compute\.amazonaws\.com$/);
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('ALB DNS names exist for both regions', () => {
      expect(outputs['alb_dns_names_use1']).toBeDefined();
      expect(outputs['alb_dns_names_apse2']).toBeDefined();
      expect(outputs['alb_dns_names_use1'].length).toBeGreaterThan(0);
      expect(outputs['alb_dns_names_apse2'].length).toBeGreaterThan(0);
    });

    test('ALB DNS names follow AWS ELB format', () => {
      const elbPattern = /^[\w-]+\.[\w-]+\.elb\.amazonaws\.com$/;

      expect(outputs['alb_dns_names_use1']).toMatch(elbPattern);
      expect(outputs['alb_dns_names_apse2']).toMatch(elbPattern);
    });

    test('ALB DNS names contain correct region indicators', () => {
      expect(outputs['alb_dns_names_use1']).toContain('us-east-1');
      expect(outputs['alb_dns_names_apse2']).toContain('ap-southeast-2');
    });

    test('ALB ARNs exist and follow AWS ARN format', () => {
      const arnPattern = /^arn:aws:elasticloadbalancing:[\w-]+:\d{12}:loadbalancer\/app\/.+$/;

      expect(outputs['alb_arns_use1']).toBeDefined();
      expect(outputs['alb_arns_apse2']).toBeDefined();

      expect(outputs['alb_arns_use1']).toMatch(arnPattern);
      expect(outputs['alb_arns_apse2']).toMatch(arnPattern);
    });

    test('ALB ARNs contain correct regions', () => {
      expect(outputs['alb_arns_use1']).toContain(':us-east-1:');
      expect(outputs['alb_arns_apse2']).toContain(':ap-southeast-2:');
    });
  });

  describe('Database Configuration', () => {
    test('RDS endpoints exist for both regions', () => {
      expect(outputs['rds_endpoints_use1']).toBeDefined();
      expect(outputs['rds_endpoints_apse2']).toBeDefined();
      expect(outputs['rds_endpoints_use1'].length).toBeGreaterThan(0);
      expect(outputs['rds_endpoints_apse2'].length).toBeGreaterThan(0);
    });

    test('RDS endpoints follow AWS RDS format', () => {
      // Accept both cluster and instance endpoints
      const rdsPattern = /^[\w-]+(\.(cluster-[\w]+))?(\.(.*\.)?rds\.amazonaws\.com):\d+$/;

      expect(outputs['rds_endpoints_use1']).toMatch(rdsPattern);
      expect(outputs['rds_endpoints_apse2']).toMatch(rdsPattern);
    });

    test('RDS endpoints use correct PostgreSQL port', () => {
      expect(outputs['rds_endpoints_use1']).toContain(':5432');
      expect(outputs['rds_endpoints_apse2']).toContain(':5432');
    });

    test('RDS endpoints contain region-specific hostnames', () => {
      expect(outputs['rds_endpoints_use1']).toMatch(/us-east-1.*rds\.amazonaws\.com/);
      expect(outputs['rds_endpoints_apse2']).toMatch(/ap-southeast-2.*rds\.amazonaws\.com/);
    });
  });

  describe('Container Orchestration', () => {
    test('ECS cluster names exist for both regions', () => {
      expect(outputs['ecs_cluster_names_use1']).toBeDefined();
      expect(outputs['ecs_cluster_names_apse2']).toBeDefined();
      expect(outputs['ecs_cluster_names_use1'].length).toBeGreaterThan(0);
      expect(outputs['ecs_cluster_names_apse2'].length).toBeGreaterThan(0);
    });

    test('ECS cluster names follow naming convention', () => {
      const clusterPattern = /^iac-aws-nova-model-breaking-\w+-cluster-\w+$/;

      expect(outputs['ecs_cluster_names_use1']).toMatch(clusterPattern);
      expect(outputs['ecs_cluster_names_apse2']).toMatch(clusterPattern);
    });

    test('ECS cluster names contain correct region suffixes', () => {
      expect(outputs['ecs_cluster_names_use1']).toContain('-use1');
      expect(outputs['ecs_cluster_names_apse2']).toContain('-apse2');
    });

    test('ECS cluster names are unique across regions', () => {
      expect(outputs['ecs_cluster_names_use1']).not.toBe(outputs['ecs_cluster_names_apse2']);
    });
  });

  describe('Storage Configuration', () => {
    test('S3 bucket names exist for both regions', () => {
      expect(outputs['s3_bucket_names_main_use1']).toBeDefined();
      expect(outputs['s3_bucket_names_main_apse2']).toBeDefined();
      expect(outputs['s3_bucket_names_main_use1'].length).toBeGreaterThan(0);
      expect(outputs['s3_bucket_names_main_apse2'].length).toBeGreaterThan(0);
    });

    test('S3 bucket names follow AWS naming requirements', () => {
      const bucketPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

      expect(outputs['s3_bucket_names_main_use1']).toMatch(bucketPattern);
      expect(outputs['s3_bucket_names_main_apse2']).toMatch(bucketPattern);
    });

    test('S3 bucket names are unique across regions', () => {
      const bucketNames = [
        outputs['s3_bucket_names_main_use1'],
        outputs['s3_bucket_names_main_apse2']
      ];

      const uniqueBucketNames = new Set(bucketNames);
      expect(uniqueBucketNames.size).toBe(2);
    });

    test('S3 bucket names contain region indicators', () => {
      expect(outputs['s3_bucket_names_main_use1']).toContain('-use1-');
      expect(outputs['s3_bucket_names_main_apse2']).toContain('-apse2-');
    });

    test('S3 bucket names contain project identifier', () => {
      expect(outputs['s3_bucket_names_main_use1']).toContain('tap-development-main-use1');
      expect(outputs['s3_bucket_names_main_apse2']).toContain('tap-development-main-apse2');
    });
  });

  describe('Monitoring and Security', () => {
    test('CloudTrail ARNs are present and valid when enabled', () => {
      // CloudTrail may be null if disabled in configuration
      if (outputs['cloudtrail_arns_use1'] && outputs['cloudtrail_arns_use1'] !== 'null') {
        const arnPattern = /^arn:aws:cloudtrail:[\w-]+:\d{12}:trail\/.+$/;
        expect(outputs['cloudtrail_arns_use1']).toMatch(arnPattern);
        expect(outputs['cloudtrail_arns_use1']).toContain(':us-east-1:');
      }

      if (outputs['cloudtrail_arns_apse2'] && outputs['cloudtrail_arns_apse2'] !== 'null') {
        const arnPattern = /^arn:aws:cloudtrail:[\w-]+:\d{12}:trail\/.+$/;
        expect(outputs['cloudtrail_arns_apse2']).toMatch(arnPattern);
        expect(outputs['cloudtrail_arns_apse2']).toContain(':ap-southeast-2:');
      }
    });

    test('WAF WebACL ARNs are present and valid when enabled', () => {
      // WAF may be null if disabled in configuration
      if (outputs['waf_web_acl_arns_use1'] && outputs['waf_web_acl_arns_use1'] !== 'null') {
        const arnPattern = /^arn:aws:wafv2:[\w-]+:\d{12}:(global|regional)\/webacl\/.+$/;
        expect(outputs['waf_web_acl_arns_use1']).toMatch(arnPattern);
        expect(outputs['waf_web_acl_arns_use1']).toContain(':us-east-1:');
      }

      if (outputs['waf_web_acl_arns_apse2'] && outputs['waf_web_acl_arns_apse2'] !== 'null') {
        const arnPattern = /^arn:aws:wafv2:[\w-]+:\d{12}:(global|regional)\/webacl\/.+$/;
        expect(outputs['waf_web_acl_arns_apse2']).toMatch(arnPattern);
        expect(outputs['waf_web_acl_arns_apse2']).toContain(':ap-southeast-2:');
      }
    });

    test('monitoring and security outputs contain expected keys', () => {
      // These keys should exist even if values are null
      expect(outputs).toHaveProperty('cloudtrail_arns_use1');
      expect(outputs).toHaveProperty('cloudtrail_arns_apse2');
      expect(outputs).toHaveProperty('waf_web_acl_arns_use1');
      expect(outputs).toHaveProperty('waf_web_acl_arns_apse2');
    });
  });

  describe('Cross-Region Consistency', () => {
    test('both regions have complete core output sets', () => {
      const coreOutputTypes = [
        'vpc_ids',
        'bastion_public_dns',
        'alb_dns_names',
        'alb_arns',
        'rds_endpoints',
        'ecs_cluster_names',
        's3_bucket_names_main'
      ];

      const regions = ['use1', 'apse2'];

      coreOutputTypes.forEach(outputType => {
        regions.forEach(region => {
          const key = `${outputType}_${region}`;
          expect(outputs[key]).toBeDefined();
          expect(typeof outputs[key]).toBe('string');
          expect(outputs[key].length).toBeGreaterThan(0);
        });
      });
    });

    test('resource naming follows consistent patterns across regions', () => {
      const projectPrefix = 'iac-aws-nova-model-breaking-development';

      expect(outputs['ecs_cluster_names_use1']).toContain(projectPrefix);
      expect(outputs['ecs_cluster_names_apse2']).toContain(projectPrefix);
      expect(outputs['s3_bucket_names_main_use1']).toContain('tap-development-main-use1');
      expect(outputs['s3_bucket_names_main_apse2']).toContain('tap-development-main-apse2');
    });

    test('all outputs contain environment information', () => {
      const outputs_with_env = [
        outputs['ecs_cluster_names_use1'],
        outputs['ecs_cluster_names_apse2'],
        outputs['s3_bucket_names_main_use1'],
        outputs['s3_bucket_names_main_apse2']
      ];

      outputs_with_env.forEach(output => {
        expect(output).toContain('development');
      });
    });

    test('region-specific resources contain correct region identifiers', () => {
      // US East 1 resources
      expect(outputs['ecs_cluster_names_use1']).toContain('-use1');
      expect(outputs['s3_bucket_names_main_use1']).toContain('-use1-');

      // AP Southeast 2 resources  
      expect(outputs['ecs_cluster_names_apse2']).toContain('-apse2');
      expect(outputs['s3_bucket_names_main_apse2']).toContain('-apse2-');
    });
  });

  describe('Infrastructure Interconnectivity', () => {
    test('ALB integration points exist for both regions', () => {
      // Verify ALB ARNs exist for both regions
      const regions = ['use1', 'apse2'];

      regions.forEach(region => {
        expect(outputs[`alb_arns_${region}`]).toBeDefined();
        expect(outputs[`alb_dns_names_${region}`]).toBeDefined();
        // WAF may be null if disabled, so just check the keys exist
        expect(outputs).toHaveProperty(`waf_web_acl_arns_${region}`);
      });
    });

    test('VPC and subnet relationships are logically consistent', () => {
      const regions = ['use1', 'apse2'];

      regions.forEach(region => {
        const vpcId = outputs[`vpc_ids_${region}`];
        const subnetA = outputs[`private_subnet_ids_${region}_a`];
        const subnetB = outputs[`private_subnet_ids_${region}_b`];

        expect(vpcId).toBeDefined();
        expect(subnetA).toBeDefined();
        expect(subnetB).toBeDefined();
        expect(subnetA).not.toBe(subnetB);

        // Subnets should be different but in same VPC (can't directly test without AWS API)
        expect(subnetA).toMatch(/^subnet-[a-f0-9]{17}$/);
        expect(subnetB).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });

    test('infrastructure components have logical relationships', () => {
      // ALB and ECS should exist in same regions
      expect(outputs['alb_arns_use1']).toBeDefined();
      expect(outputs['ecs_cluster_names_use1']).toBeDefined();
      expect(outputs['alb_arns_apse2']).toBeDefined();
      expect(outputs['ecs_cluster_names_apse2']).toBeDefined();

      // RDS and bastion should exist for database access
      expect(outputs['rds_endpoints_use1']).toBeDefined();
      expect(outputs['bastion_public_dns_use1']).toBeDefined();
      expect(outputs['rds_endpoints_apse2']).toBeDefined();
      expect(outputs['bastion_public_dns_apse2']).toBeDefined();
    });
  });

  describe('Output Validation and Security', () => {
    test('outputs object is properly structured', () => {
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('validates output key naming convention', () => {
      const allOutputKeys = Object.keys(outputs);

      expect(allOutputKeys.length).toBeGreaterThan(0);

      // Ensure all keys follow expected naming patterns
      allOutputKeys.forEach(key => {
        expect(key).toMatch(/^[a-z0-9_]+$/); // lowercase with underscores and numbers
      });
    });

    test('verifies no sensitive information in outputs', () => {
      const outputString = JSON.stringify(outputs);

      // Common sensitive patterns that shouldn't appear
      expect(outputString.toLowerCase()).not.toContain('password');
      expect(outputString.toLowerCase()).not.toContain('secret');
      expect(outputString.toLowerCase()).not.toContain('key');
      expect(outputString).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key pattern
    });

    test('all output values are non-empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (value !== null && value !== 'null') {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });
});