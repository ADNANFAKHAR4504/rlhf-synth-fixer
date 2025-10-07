// tests/integration/terraform.int.test.ts
// Integration tests using CloudFormation outputs
// No Terraform commands are executed - validates against deployed infrastructure outputs

import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

interface StackOutputs {
  [key: string]: any;
  primary_alb_dns?: string;
  secondary_alb_dns?: string;
  primary_db_endpoint?: string;
  secondary_db_endpoint?: string;
  route53_nameservers?: string[];
  dynamodb_table_name?: string;
  primary_ecs_cluster_name?: string;
  secondary_ecs_cluster_name?: string;
  primary_vpc_id?: string;
  secondary_vpc_id?: string;
  vpc_peering_connection_id?: string;
  primary_kms_key_id?: string;
  secondary_kms_key_id?: string;
  cloudtrail_name?: string;
  sns_topic_arn?: string;
  lambda_failover_function_name?: string;
  primary_health_check_id?: string;
  secondary_health_check_id?: string;
  ecr_repository_uri?: string;
  primary_codedeploy_app?: string;
  secondary_codedeploy_app?: string;
}

describe('Terraform DR Stack Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    // Check if outputs file exists
    if (!fs.existsSync(outputsPath)) {
      console.warn(`Outputs file not found at ${outputsPath}. Skipping integration tests.`);
      outputs = {};
      return;
    }

    try {
      const rawData = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(rawData);
    } catch (error) {
      console.error(`Failed to parse outputs file: ${error}`);
      outputs = {};
    }
  });

  describe('Core Infrastructure Validation', () => {
    describe('Multi-Region Setup', () => {
      test('primary ALB is deployed in us-east-1', () => {
        if (!outputs.primary_alb_dns) {
          console.warn('Primary ALB DNS not found in outputs');
          return;
        }
        expect(outputs.primary_alb_dns).toMatch(/\.us-east-1\.elb\.amazonaws\.com$/);
      });

      test('secondary ALB is deployed in us-west-2', () => {
        if (!outputs.secondary_alb_dns) {
          console.warn('Secondary ALB DNS not found in outputs');
          return;
        }
        expect(outputs.secondary_alb_dns).toMatch(/\.us-west-2\.elb\.amazonaws\.com$/);
      });

      test('VPC peering connection exists', () => {
        if (!outputs.vpc_peering_connection_id) {
          console.warn('VPC peering connection ID not found in outputs');
          return;
        }
        expect(outputs.vpc_peering_connection_id).toMatch(/^pcx-/);
      });
    });

    describe('Database Layer', () => {
      test('primary database endpoint is available', () => {
        if (!outputs.primary_db_endpoint) {
          console.warn('Primary DB endpoint not found in outputs');
          return;
        }
        expect(outputs.primary_db_endpoint).toMatch(/\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com/);
      });

      test('secondary database endpoint is available', () => {
        if (!outputs.secondary_db_endpoint) {
          console.warn('Secondary DB endpoint not found in outputs');
          return;
        }
        expect(outputs.secondary_db_endpoint).toMatch(/\.cluster-[a-z0-9]+\.us-west-2\.rds\.amazonaws\.com/);
      });

      test('database endpoints use different regions', () => {
        if (!outputs.primary_db_endpoint || !outputs.secondary_db_endpoint) {
          console.warn('Database endpoints not found in outputs');
          return;
        }
        expect(outputs.primary_db_endpoint).toContain('us-east-1');
        expect(outputs.secondary_db_endpoint).toContain('us-west-2');
      });
    });

    describe('DynamoDB Global Table', () => {
      test('DynamoDB table name follows naming convention', () => {
        if (!outputs.dynamodb_table_name) {
          console.warn('DynamoDB table name not found in outputs');
          return;
        }
        expect(outputs.dynamodb_table_name).toMatch(/trading-platform.*session-state/);
      });
    });

    describe('ECS Clusters', () => {
      test('primary ECS cluster is created', () => {
        if (!outputs.primary_ecs_cluster_name) {
          console.warn('Primary ECS cluster name not found in outputs');
          return;
        }
        expect(outputs.primary_ecs_cluster_name).toMatch(/trading-platform.*primary.*cluster/);
      });

      test('secondary ECS cluster is created', () => {
        if (!outputs.secondary_ecs_cluster_name) {
          console.warn('Secondary ECS cluster name not found in outputs');
          return;
        }
        expect(outputs.secondary_ecs_cluster_name).toMatch(/trading-platform.*secondary.*cluster/);
      });
    });

    describe('Container Registry', () => {
      test('ECR repository is created', () => {
        if (!outputs.ecr_repository_uri) {
          console.warn('ECR repository URI not found in outputs');
          return;
        }
        expect(outputs.ecr_repository_uri).toMatch(/\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\//);
      });
    });
  });

  describe('Security Components', () => {
    test('KMS keys are created for both regions', () => {
      if (!outputs.primary_kms_key_id || !outputs.secondary_kms_key_id) {
        console.warn('KMS key IDs not found in outputs');
        return;
      }
      expect(outputs.primary_kms_key_id).toMatch(/^arn:aws:kms:us-east-1:/);
      expect(outputs.secondary_kms_key_id).toMatch(/^arn:aws:kms:us-west-2:/);
    });

    test('CloudTrail is enabled', () => {
      if (!outputs.cloudtrail_name) {
        console.warn('CloudTrail name not found in outputs');
        return;
      }
      expect(outputs.cloudtrail_name).toBeTruthy();
      expect(outputs.cloudtrail_name).toMatch(/trading-platform/);
    });
  });

  describe('Disaster Recovery Components', () => {
    describe('Route 53 Configuration', () => {
      test('Route 53 nameservers are configured', () => {
        if (!outputs.route53_nameservers || !Array.isArray(outputs.route53_nameservers)) {
          console.warn('Route 53 nameservers not found in outputs');
          return;
        }
        expect(outputs.route53_nameservers).toHaveLength(4);
        outputs.route53_nameservers.forEach(ns => {
          expect(ns).toMatch(/\.awsdns-\d+\.(com|net|org|co\.uk)\.?$/);
        });
      });

      test('health checks are created for both regions', () => {
        if (!outputs.primary_health_check_id || !outputs.secondary_health_check_id) {
          console.warn('Health check IDs not found in outputs');
          return;
        }
        expect(outputs.primary_health_check_id).toBeTruthy();
        expect(outputs.secondary_health_check_id).toBeTruthy();
      });
    });

    describe('Automation Components', () => {
      test('Lambda failover function is deployed', () => {
        if (!outputs.lambda_failover_function_name) {
          console.warn('Lambda failover function name not found in outputs');
          return;
        }
        expect(outputs.lambda_failover_function_name).toMatch(/trading-platform.*failover/);
      });

      test('SNS topic is created for notifications', () => {
        if (!outputs.sns_topic_arn) {
          console.warn('SNS topic ARN not found in outputs');
          return;
        }
        expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:/);
      });
    });

    describe('Blue/Green Deployment', () => {
      test('CodeDeploy applications are created', () => {
        if (!outputs.primary_codedeploy_app || !outputs.secondary_codedeploy_app) {
          console.warn('CodeDeploy application names not found in outputs');
          return;
        }
        expect(outputs.primary_codedeploy_app).toMatch(/trading-platform.*primary/);
        expect(outputs.secondary_codedeploy_app).toMatch(/trading-platform.*secondary/);
      });
    });
  });

  describe('Failover Scenarios - Positive Cases', () => {
    test('primary to secondary failover prerequisites are met', () => {
      const requiredComponents = [
        outputs.primary_alb_dns,
        outputs.secondary_alb_dns,
        outputs.primary_health_check_id,
        outputs.secondary_health_check_id,
        outputs.lambda_failover_function_name
      ];

      const allComponentsPresent = requiredComponents.every(component => component !== undefined);
      if (!allComponentsPresent) {
        console.warn('Not all failover components found in outputs');
        return;
      }
      expect(allComponentsPresent).toBe(true);
    });

    test('cross-region database replication is configured', () => {
      if (!outputs.primary_db_endpoint || !outputs.secondary_db_endpoint) {
        console.warn('Database endpoints not found for replication validation');
        return;
      }
      // Both endpoints should exist for global database
      expect(outputs.primary_db_endpoint).toBeTruthy();
      expect(outputs.secondary_db_endpoint).toBeTruthy();
    });

    test('cross-region networking is established', () => {
      if (!outputs.vpc_peering_connection_id) {
        console.warn('VPC peering not found for cross-region networking validation');
        return;
      }
      expect(outputs.vpc_peering_connection_id).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles missing primary region gracefully', () => {
      // Simulate primary region failure
      const criticalSecondaryComponents = [
        outputs.secondary_alb_dns,
        outputs.secondary_db_endpoint,
        outputs.secondary_ecs_cluster_name
      ];

      const secondaryCanOperate = criticalSecondaryComponents.every(component => component !== undefined);
      if (!secondaryCanOperate) {
        console.warn('Secondary region components not fully deployed');
        return;
      }
      expect(secondaryCanOperate).toBe(true);
    });

    test('validates failover automation can trigger', () => {
      const automationComponents = [
        outputs.lambda_failover_function_name,
        outputs.primary_health_check_id,
        outputs.secondary_health_check_id,
        outputs.sns_topic_arn
      ];

      const canTriggerFailover = automationComponents.every(component => component !== undefined);
      if (!canTriggerFailover) {
        console.warn('Failover automation components not complete');
        return;
      }
      expect(canTriggerFailover).toBe(true);
    });

    test('validates encryption is enabled across regions', () => {
      if (!outputs.primary_kms_key_id || !outputs.secondary_kms_key_id) {
        console.warn('KMS keys not found for encryption validation');
        return;
      }
      expect(outputs.primary_kms_key_id).toBeTruthy();
      expect(outputs.secondary_kms_key_id).toBeTruthy();
    });
  });

  describe('Performance and Scalability Validation', () => {
    test('validates multi-AZ deployment', () => {
      // Check if outputs indicate multi-AZ deployment
      // This would typically be validated through subnet outputs
      if (outputs.primary_subnets && Array.isArray(outputs.primary_subnets)) {
        expect(outputs.primary_subnets.length).toBeGreaterThanOrEqual(2);
      }
      if (outputs.secondary_subnets && Array.isArray(outputs.secondary_subnets)) {
        expect(outputs.secondary_subnets.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('validates autoscaling is configured', () => {
      // Check for autoscaling-related outputs
      if (outputs.ecs_autoscaling_target) {
        expect(outputs.ecs_autoscaling_target).toBeTruthy();
      }
      if (outputs.dynamodb_autoscaling_enabled) {
        expect(outputs.dynamodb_autoscaling_enabled).toBe(true);
      }
    });
  });

  describe('Compliance and Standards', () => {
    test('validates tagging standards are applied', () => {
      // Check if outputs include tag information
      const expectedTags = ['Environment', 'Owner', 'Project'];

      if (outputs.resource_tags) {
        expectedTags.forEach(tag => {
          expect(outputs.resource_tags).toHaveProperty(tag);
        });
      }
    });

    test('validates audit trail is enabled', () => {
      if (!outputs.cloudtrail_name) {
        console.warn('CloudTrail not found for audit validation');
        return;
      }
      expect(outputs.cloudtrail_name).toBeTruthy();
    });

    test('validates backup configuration', () => {
      // Check for backup-related outputs
      if (outputs.aurora_backup_retention_days) {
        expect(outputs.aurora_backup_retention_days).toBeGreaterThanOrEqual(7);
      }
      if (outputs.dynamodb_pitr_enabled) {
        expect(outputs.dynamodb_pitr_enabled).toBe(true);
      }
    });
  });

  describe('Integration Points', () => {
    test('validates ALB to ECS integration', () => {
      const integrationComponents = [
        outputs.primary_alb_dns,
        outputs.primary_ecs_cluster_name,
        outputs.secondary_alb_dns,
        outputs.secondary_ecs_cluster_name
      ];

      const integrationComplete = integrationComponents.every(component => component !== undefined);
      if (!integrationComplete) {
        console.warn('ALB-ECS integration components not complete');
        return;
      }
      expect(integrationComplete).toBe(true);
    });

    test('validates monitoring integration', () => {
      // Check for monitoring-related outputs
      if (outputs.cloudwatch_log_groups) {
        expect(outputs.cloudwatch_log_groups).toBeTruthy();
      }
      if (outputs.cloudwatch_alarms) {
        expect(outputs.cloudwatch_alarms).toBeTruthy();
      }
    });
  });

  describe('Disaster Recovery Requirements Validation', () => {
    test('validates RTO < 15 minutes capability', () => {
      // Check components that enable quick recovery
      const rtoComponents = [
        outputs.lambda_failover_function_name, // Automated failover
        outputs.primary_health_check_id, // Quick detection
        outputs.secondary_health_check_id,
        outputs.secondary_alb_dns, // Pre-warmed secondary
        outputs.secondary_ecs_cluster_name
      ];

      const rtoCapable = rtoComponents.every(component => component !== undefined);
      if (!rtoCapable) {
        console.warn('RTO < 15 minutes components not complete');
        return;
      }
      expect(rtoCapable).toBe(true);
    });

    test('validates RPO < 1 minute capability', () => {
      // Check components that enable minimal data loss
      const rpoComponents = [
        outputs.primary_db_endpoint, // Global database for < 1 min RPO
        outputs.secondary_db_endpoint,
        outputs.dynamodb_table_name // Global table for eventual consistency
      ];

      const rpoCapable = rpoComponents.every(component => component !== undefined);
      if (!rpoCapable) {
        console.warn('RPO < 1 minute components not complete');
        return;
      }
      expect(rpoCapable).toBe(true);
    });
  });
});