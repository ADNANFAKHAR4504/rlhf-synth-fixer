// Comprehensive Integration Tests for Terraform Infrastructure
// Tests validate actual deployment outputs from cfn-outputs/all-outputs.json
// No Terraform commands are executed - uses CI/CD generated outputs

import fs from 'fs';
import path from 'path';

interface DeploymentOutputs {
  [key: string]: string;
}

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: DeploymentOutputs;
  let outputsPath: string;

  beforeAll(() => {
    outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      // Fallback for when outputs don't exist yet (before deployment)
      outputs = {};
    }
  });

  describe('Outputs File Validation', () => {
    test('cfn-outputs/all-outputs.json exists', () => {
      const exists = fs.existsSync(outputsPath);
      expect(exists).toBe(true);
    });

    test('outputs file contains valid JSON', () => {
      expect(outputs).toBeInstanceOf(Object);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Region VPC Infrastructure', () => {
    test('VPC IDs exist for both regions', () => {
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
    });
  });

  describe('Bastion Host Configuration', () => {
    test('bastion public DNS names exist for both regions', () => {
      expect(outputs['bastion_public_dns_use1']).toBeDefined();
      expect(outputs['bastion_public_dns_apse2']).toBeDefined();
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
    });

    test('RDS endpoints follow AWS RDS format', () => {
      // Accept both cluster and instance endpoints
      const rdsPattern = /^[\w-]+(\.(cluster-[\w]+))?\.(.*\.)?rds\.amazonaws\.com:\d+$/;

      expect(outputs['rds_endpoints_use1']).toMatch(rdsPattern);
      expect(outputs['rds_endpoints_apse2']).toMatch(rdsPattern);
    });

    test('RDS endpoints use correct PostgreSQL port', () => {
      expect(outputs['rds_endpoints_use1']).toContain(':5432');
      expect(outputs['rds_endpoints_apse2']).toContain(':5432');
    });
  });

  describe('Container Orchestration', () => {
    test('ECS cluster names exist for both regions', () => {
      expect(outputs['ecs_cluster_names_use1']).toBeDefined();
      expect(outputs['ecs_cluster_names_apse2']).toBeDefined();
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
  });

  describe('Storage Configuration', () => {
    test('S3 bucket names exist for both regions', () => {
      expect(outputs['s3_bucket_names_main_use1']).toBeDefined();
      expect(outputs['s3_bucket_names_main_apse2']).toBeDefined();
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
  });

  describe('Monitoring and Security', () => {
    test('CloudTrail ARNs exist for both regions', () => {
      expect(outputs['cloudtrail_arns_use1']).toBeDefined();
      expect(outputs['cloudtrail_arns_apse2']).toBeDefined();
    });

    test('CloudTrail ARNs follow AWS ARN format', () => {
      const arnPattern = /^arn:aws:cloudtrail:[\w-]+:\d{12}:trail\/.+$/;

      expect(outputs['cloudtrail_arns_use1']).toMatch(arnPattern);
      expect(outputs['cloudtrail_arns_apse2']).toMatch(arnPattern);
    });

    test('WAF WebACL ARNs exist for both regions', () => {
      expect(outputs['waf_web_acl_arns_use1']).toBeDefined();
      expect(outputs['waf_web_acl_arns_apse2']).toBeDefined();
    });

    test('WAF WebACL ARNs follow AWS ARN format', () => {
      const arnPattern = /^arn:aws:wafv2:[\w-]+:\d{12}:(global|regional)\/webacl\/.+$/;

      expect(outputs['waf_web_acl_arns_use1']).toMatch(arnPattern);
      expect(outputs['waf_web_acl_arns_apse2']).toMatch(arnPattern);
    });
  });

  describe('Cross-Region Consistency', () => {
    test('both regions have complete output sets', () => {
      const expectedOutputTypes = [
        'vpc_ids',
        'bastion_public_dns',
        'alb_dns_names',
        'alb_arns',
        'rds_endpoints',
        'ecs_cluster_names',
        's3_bucket_names_main',
        'cloudtrail_arns',
        'waf_web_acl_arns'
      ];

      const regions = ['use1', 'apse2'];

      expectedOutputTypes.forEach(outputType => {
        regions.forEach(region => {
          const key = `${outputType}_${region}`;
          expect(outputs[key]).toBeDefined();
          expect(typeof outputs[key]).toBe('string');
          expect(outputs[key].length).toBeGreaterThan(0);
        });
      });
    });

    test('resource naming follows consistent patterns', () => {
      const projectPrefix = 'iac-aws-nova-model-breaking-development';

      expect(outputs['ecs_cluster_names_use1']).toContain(projectPrefix);
      expect(outputs['ecs_cluster_names_apse2']).toContain(projectPrefix);
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
  });

  describe('Infrastructure Interconnectivity', () => {
    test('ALB and WAF integration points exist', () => {
      // Verify ALB ARNs and WAF ARNs exist for same regions
      const regions = ['use1', 'apse2'];

      regions.forEach(region => {
        expect(outputs[`alb_arns_${region}`]).toBeDefined();
        expect(outputs[`waf_web_acl_arns_${region}`]).toBeDefined();
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
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles empty or malformed outputs gracefully', () => {
      // This test ensures our integration tests are robust
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
    });

    test('validates output format consistency', () => {
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
      expect(outputString).not.toMatch(/[A-Z0-9]{20}/); // AWS access key pattern
    });
  });
});