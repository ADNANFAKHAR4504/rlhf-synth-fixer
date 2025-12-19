// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform commands are executed - only static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform DR Stack Unit Tests - tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Stack file not found at: ${stackPath}`);
    }
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Structure and Basic Requirements", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
    });

    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares multi-region provider aliases", () => {
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });
  });

  describe("Required Variables", () => {
    const requiredVariables = [
      "aws_region",
      "primary_region",
      "secondary_region",
      "vpc_cidr",
      "app_name",
      "environment",
      "owner",
      "project",
      "db_username",
      "db_password",
      "domain_name",
      "container_image",
      "container_port"
    ];

    requiredVariables.forEach(varName => {
      test(`declares variable '${varName}'`, () => {
        const regex = new RegExp(`variable\\s+"${varName}"\\s*{`);
        expect(stackContent).toMatch(regex);
      });
    });

    test("primary_region defaults to us-east-1", () => {
      const match = stackContent.match(/variable\s+"primary_region"[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match?.[1]).toBe("us-east-1");
    });

    test("secondary_region defaults to us-west-2", () => {
      const match = stackContent.match(/variable\s+"secondary_region"[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match?.[1]).toBe("us-west-2");
    });

    test("vpc_cidr defaults to 10.0.0.0/16", () => {
      const match = stackContent.match(/variable\s+"vpc_cidr"[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match?.[1]).toBe("10.0.0.0/16");
    });
  });

  describe("Networking Components", () => {
    describe("VPCs", () => {
      test("creates primary VPC in us-east-1", () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"\s*{[\s\S]*?provider\s*=\s*aws\.primary/);
      });

      test("creates secondary VPC in us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"\s*{[\s\S]*?provider\s*=\s*aws\.secondary/);
      });

      test("VPCs have DNS support enabled", () => {
        expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
        expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      });
    });

    describe("Subnets", () => {
      const subnetTypes = ["public", "private", "db"];
      const regions = ["primary", "secondary"];

      regions.forEach(region => {
        subnetTypes.forEach(type => {
          test(`creates ${region} ${type} subnets`, () => {
            const regex = new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_${type}"\\s*{`);
            expect(stackContent).toMatch(regex);
          });
        });
      });
    });

    describe("Internet Gateways and NAT Gateways", () => {
      test("creates Internet Gateways for both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
      });

      test("creates NAT Gateways for both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"/);
      });

      test("creates Elastic IPs for NAT Gateways", () => {
        expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"primary_nat"/);
        expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"secondary_nat"/);
      });
    });

    describe("VPC Peering", () => {
      test("creates VPC peering connection", () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"primary_to_secondary"/);
      });

      test("creates VPC peering connection accepter", () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"\s+"secondary_accepter"/);
      });

      test("creates routes for VPC peering", () => {
        expect(stackContent).toMatch(/resource\s+"aws_route"\s+"primary_to_secondary"/);
        expect(stackContent).toMatch(/resource\s+"aws_route"\s+"secondary_to_primary"/);
      });
    });
  });

  describe("Security Components", () => {
    describe("KMS Keys", () => {
      test("creates KMS keys for both regions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary"/);
      });

      test("KMS keys have rotation enabled", () => {
        const kmsMatches = stackContent.match(/resource\s+"aws_kms_key"[\s\S]*?enable_key_rotation\s*=\s*true/g);
        expect(kmsMatches).toHaveLength(2);
      });

      test("creates KMS aliases", () => {
        expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"primary"/);
        expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secondary"/);
      });
    });

    describe("Security Groups", () => {
      const securityGroups = [
        { name: "primary_alb", description: "ALB security group for primary region" },
        { name: "primary_ecs", description: "ECS security group for primary region" },
        { name: "primary_db", description: "Database security group for primary region" },
        { name: "secondary_alb", description: "ALB security group for secondary region" },
        { name: "secondary_ecs", description: "ECS security group for secondary region" },
        { name: "secondary_db", description: "Database security group for secondary region" }
      ];

      securityGroups.forEach(sg => {
        test(`creates ${sg.name} security group`, () => {
          const regex = new RegExp(`resource\\s+"aws_security_group"\\s+"${sg.name}"\\s*{`);
          expect(stackContent).toMatch(regex);
        });
      });

      test("ALB security groups allow HTTPS (443) and HTTP (80)", () => {
        const albSgMatches = stackContent.match(/resource\s+"aws_security_group"\s+"(primary|secondary)_alb"[\s\S]*?ingress\s*{[\s\S]*?from_port\s*=\s*(80|443)/g);
        expect(albSgMatches).toBeTruthy();
      });

      test("DB security groups allow PostgreSQL port (5432)", () => {
        const dbSgMatches = stackContent.match(/resource\s+"aws_security_group"\s+"(primary|secondary)_db"[\s\S]*?from_port\s*=\s*5432/g);
        expect(dbSgMatches).toBeTruthy();
      });
    });

    describe("IAM Roles", () => {
      test("creates ECS task execution role", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution_role"/);
      });

      test("creates ECS task role", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_role"/);
      });

      test("creates CodeDeploy role", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"codedeploy_role"/);
      });

      test("creates Lambda execution role for failover automation", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_failover_role"/);
      });
    });
  });

  describe("Database Layer", () => {
    test("creates Aurora Global Database", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_global_cluster"\s+"trading_platform"/);
    });

    test("creates primary Aurora cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"/);
    });

    test("creates secondary Aurora cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"secondary"/);
    });

    test("Aurora clusters have encryption enabled", () => {
      const encryptionMatches = stackContent.match(/storage_encrypted\s*=\s*true/g);
      expect(encryptionMatches).toBeTruthy();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(3); // Global + 2 clusters
    });

    test("Aurora clusters have backup retention configured", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
    });

    test("creates DB subnet groups for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"/);
    });

    test("creates Aurora cluster instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"secondary"/);
    });
  });

  describe("DynamoDB Global Tables", () => {
    test("creates DynamoDB global table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"primary"/);
    });

    test("DynamoDB table has stream enabled", () => {
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    });

    test("DynamoDB table has replica in secondary region", () => {
      expect(stackContent).toMatch(/replica\s*{[\s\S]*?region_name\s*=\s*var\.secondary_region/);
    });

    test("DynamoDB table has encryption enabled", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("DynamoDB table has point-in-time recovery enabled", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("DynamoDB table has autoscaling configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_/);
    });
  });

  describe("ECS Infrastructure", () => {
    test("creates ECS clusters for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"secondary"/);
    });

    test("ECS clusters have container insights enabled", () => {
      expect(stackContent).toMatch(/setting\s*{[\s\S]*?name\s*=\s*"containerInsights"[\s\S]*?value\s*=\s*"enabled"/);
    });

    test("creates ECS task definitions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"secondary"/);
    });

    test("task definitions use Fargate", () => {
      expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    });

    test("creates ECS services", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"secondary"/);
    });

    test("ECS services have health check grace period", () => {
      expect(stackContent).toMatch(/health_check_grace_period_seconds\s*=\s*\d+/);
    });

    test("creates ECR repository", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"/);
    });

    test("ECR has cross-region replication", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecr_replication_configuration"\s+"/);
    });
  });

  describe("Load Balancers", () => {
    test("creates ALBs for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
    });

    test("ALBs have deletion protection enabled", () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*true/);
    });

    test("creates target groups for blue/green deployment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary_blue"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary_green"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary_blue"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary_green"/);
    });

    test("creates HTTPS listeners", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary_https"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary_https"/);
    });

    test("creates ACM certificates", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"secondary"/);
    });
  });

  describe("Route 53 and Failover", () => {
    test("creates Route 53 hosted zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"/);
    });

    test("creates health checks for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"secondary"/);
    });

    test("creates failover routing records", () => {
      expect(stackContent).toMatch(/failover_routing_policy\s*{[\s\S]*?type\s*=\s*"PRIMARY"/);
      expect(stackContent).toMatch(/failover_routing_policy\s*{[\s\S]*?type\s*=\s*"SECONDARY"/);
    });
  });

  describe("Monitoring and Automation", () => {
    test("creates CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"/);
    });

    test("creates CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"/);
    });

    test("creates SNS topics for notifications", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"/);
    });

    test("SNS topics have KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=/);
    });

    test("creates Lambda functions for failover automation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover_automation"/);
    });

    test("Lambda functions have environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{[\s\S]*?variables\s*=/);
    });

    test("creates EventBridge rules for automation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"/);
    });

    test("creates CloudTrail for auditing", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"/);
    });
  });

  describe("Blue/Green Deployment", () => {
    test("creates CodeDeploy applications", () => {
      expect(stackContent).toMatch(/resource\s+"aws_codedeploy_app"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_codedeploy_app"\s+"secondary"/);
    });

    test("creates CodeDeploy deployment groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_codedeploy_deployment_group"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_codedeploy_deployment_group"\s+"secondary"/);
    });

    test("deployment groups have auto-rollback enabled", () => {
      expect(stackContent).toMatch(/auto_rollback_configuration\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("deployment groups use blue/green deployment", () => {
      expect(stackContent).toMatch(/deployment_type\s*=\s*"BLUE_GREEN"/);
    });
  });

  describe("Secrets Management", () => {
    test("creates Systems Manager parameters for secrets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
    });

    test("secrets are encrypted", () => {
      expect(stackContent).toMatch(/type\s*=\s*"SecureString"/);
    });
  });

  describe("Tagging Standards", () => {
    test("resources include required tags", () => {
      const tagMatches = stackContent.match(/tags\s*=\s*{[\s\S]*?Environment\s*=[\s\S]*?Owner\s*=[\s\S]*?Project\s*=/g);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(20); // Should have many tagged resources
    });
  });

  describe("Outputs", () => {
    const requiredOutputs = [
      "primary_alb_dns",
      "secondary_alb_dns",
      "primary_db_endpoint",
      "secondary_db_endpoint",
      "route53_nameservers",
      "dynamodb_table_name",
      "primary_ecs_cluster_name",
      "secondary_ecs_cluster_name"
    ];

    requiredOutputs.forEach(output => {
      test(`declares output '${output}'`, () => {
        const regex = new RegExp(`output\\s+"${output}"\\s*{`);
        expect(stackContent).toMatch(regex);
      });
    });
  });

  describe("Disaster Recovery Requirements", () => {
    test("implements automated failover mechanism", () => {
      expect(stackContent).toMatch(/aws_lambda_function.*failover/);
      expect(stackContent).toMatch(/aws_route53_health_check/);
    });

    test("supports RTO < 15 minutes", () => {
      // Check for automated triggers and quick health checks
      expect(stackContent).toMatch(/failure_threshold\s*=\s*[1-3]/);
      expect(stackContent).toMatch(/request_interval\s*=\s*(10|30)/);
    });

    test("supports RPO < 1 minute", () => {
      // Check for Aurora global database (provides < 1 minute RPO)
      expect(stackContent).toMatch(/aws_rds_global_cluster/);
      // Check for DynamoDB global tables (provides eventual consistency)
      expect(stackContent).toMatch(/replica\s*{/);
    });

    test("implements failover testing mechanism", () => {
      expect(stackContent).toMatch(/aws_lambda_function.*test_failover/);
    });
  });

  describe("Compliance and Best Practices", () => {
    test("uses least privilege IAM policies", () => {
      const policyMatches = stackContent.match(/policy\s*=\s*jsonencode\(/g);
      expect(policyMatches).toBeTruthy();
      expect(policyMatches!.length).toBeGreaterThan(3);
    });

    test("implements encryption at rest", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("implements encryption in transit", () => {
      expect(stackContent).toMatch(/ssl_policy\s*=/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test("uses private subnets for compute resources", () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.(primary|secondary)_private/);
    });

    test("implements proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=/);
    });
  });

  describe("Advanced Features: Chaos Engineering & DR Testing", () => {
    test("implements automated DR drill Lambda", () => {
      expect(stackContent).toMatch(/aws_lambda_function.*automated_dr_drill/);
      expect(stackContent).toMatch(/function_name\s*=\s*.*dr-drill/);
    });

    test("schedules weekly DR drills", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_event_rule.*weekly_dr_drill/);
      expect(stackContent).toMatch(/cron\(0 2 \? \* SUN \*\)/);
    });

    test("connects DR drill Lambda to EventBridge", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_event_target.*dr_drill_target/);
      expect(stackContent).toMatch(/aws_lambda_permission.*allow_eventbridge_dr_drill/);
    });
  });

  describe("Advanced Features: Cost Optimization", () => {
    test("implements AWS Budgets for cost monitoring", () => {
      expect(stackContent).toMatch(/aws_budgets_budget.*dr_infrastructure/);
      expect(stackContent).toMatch(/budget_type\s*=\s*"COST"/);
    });

    test("configures budget alerts at 80% and 100%", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*80/);
      expect(stackContent).toMatch(/threshold\s*=\s*100/);
    });

    test("sets monthly budget limit", () => {
      expect(stackContent).toMatch(/limit_amount\s*=\s*"5000"/);
      expect(stackContent).toMatch(/time_unit\s*=\s*"MONTHLY"/);
    });
  });

  describe("Advanced Features: Observability with X-Ray", () => {
    test("implements X-Ray sampling rule", () => {
      expect(stackContent).toMatch(/aws_xray_sampling_rule.*trading_platform/);
      expect(stackContent).toMatch(/fixed_rate\s*=\s*0\.05/);
    });

    test("implements custom metric for trade execution latency", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*trade_execution_latency/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"TradeExecutionTime"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"TradingPlatform"/);
    });

    test("implements custom metric for error rate", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*error_rate_high/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"ErrorRate"/);
    });

    test("sets SLA threshold for trade execution (500ms)", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*"500"/);
    });
  });

  describe("Advanced Features: Compliance-as-Code", () => {
    test("implements AWS Config recorder", () => {
      expect(stackContent).toMatch(/aws_config_configuration_recorder.*main/);
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
    });

    test("creates S3 bucket for Config logs", () => {
      expect(stackContent).toMatch(/aws_s3_bucket.*config/);
      expect(stackContent).toMatch(/bucket\s*=\s*.*config-/);
    });

    test("implements Config rule for encrypted volumes", () => {
      expect(stackContent).toMatch(/aws_config_config_rule.*encrypted_volumes/);
      expect(stackContent).toMatch(/source_identifier\s*=\s*"ENCRYPTED_VOLUMES"/);
    });

    test("implements Config rule for RDS encryption", () => {
      expect(stackContent).toMatch(/aws_config_config_rule.*rds_encryption/);
      expect(stackContent).toMatch(/source_identifier\s*=\s*"RDS_STORAGE_ENCRYPTED"/);
    });

    test("implements Config rule for CloudTrail", () => {
      expect(stackContent).toMatch(/aws_config_config_rule.*cloudtrail_enabled/);
      expect(stackContent).toMatch(/source_identifier\s*=\s*"CLOUD_TRAIL_ENABLED"/);
    });

    test("implements Config rule for IAM password policy", () => {
      expect(stackContent).toMatch(/aws_config_config_rule.*iam_password_policy/);
      expect(stackContent).toMatch(/source_identifier\s*=\s*"IAM_PASSWORD_POLICY"/);
    });

    test("creates IAM role for AWS Config", () => {
      expect(stackContent).toMatch(/aws_iam_role.*config_role/);
      expect(stackContent).toMatch(/Service.*config\.amazonaws\.com/);
    });
  });

  describe("Advanced Features: Secrets Management with Rotation", () => {
    test("implements Secrets Manager secret", () => {
      expect(stackContent).toMatch(/aws_secretsmanager_secret.*db_master_password/);
      expect(stackContent).toMatch(/Aurora PostgreSQL master password with auto-rotation/);
    });

    test("implements Lambda for secret rotation", () => {
      expect(stackContent).toMatch(/aws_lambda_function.*rotate_secret/);
      expect(stackContent).toMatch(/function_name\s*=\s*.*rotate-secret/);
    });

    test("configures 30-day rotation schedule", () => {
      expect(stackContent).toMatch(/aws_secretsmanager_secret_rotation/);
      expect(stackContent).toMatch(/automatically_after_days\s*=\s*30/);
    });

    test("creates IAM role for rotation Lambda", () => {
      expect(stackContent).toMatch(/aws_iam_role.*lambda_rotation_role/);
    });

    test("grants rotation Lambda permissions", () => {
      expect(stackContent).toMatch(/aws_iam_role_policy.*lambda_rotation_policy/);
      expect(stackContent).toMatch(/secretsmanager:PutSecretValue/);
      expect(stackContent).toMatch(/rds:ModifyDBCluster/);
    });
  });

  describe("Advanced Features: SRE Practices - SLO/SLI Tracking", () => {
    test("implements composite alarm for SLO breach", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_composite_alarm.*slo_breach/);
      expect(stackContent).toMatch(/99\.99% availability/);
    });

    test("implements error budget alarm", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*error_budget_exhausted/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"ErrorBudgetRemaining"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"TradingPlatform\/SLO"/);
    });

    test("implements SLO calculator Lambda", () => {
      expect(stackContent).toMatch(/aws_lambda_function.*slo_calculator/);
      expect(stackContent).toMatch(/SLO_TARGET\s*=\s*"99\.99"/);
    });

    test("schedules hourly SLO calculation", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_event_rule.*slo_calculation/);
      expect(stackContent).toMatch(/rate\(1 hour\)/);
    });

    test("composite alarm combines multiple failure conditions", () => {
      expect(stackContent).toMatch(/alarm_rule.*join/);
      expect(stackContent).toMatch(/ALARM.*trade_execution_latency/);
      expect(stackContent).toMatch(/ALARM.*error_rate_high/);
    });
  });

  describe("Advanced Features: Outputs", () => {
    test("outputs DR drill Lambda name", () => {
      expect(stackContent).toMatch(/output.*dr_drill_lambda_name/);
      expect(stackContent).toMatch(/automated_dr_drill\.function_name/);
    });

    test("outputs Config recorder name", () => {
      expect(stackContent).toMatch(/output.*config_recorder_name/);
    });

    test("outputs Secrets Manager ARN", () => {
      expect(stackContent).toMatch(/output.*secrets_manager_secret_arn/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("outputs SLO breach alarm ARN", () => {
      expect(stackContent).toMatch(/output.*slo_breach_alarm/);
    });

    test("outputs custom metrics configuration", () => {
      expect(stackContent).toMatch(/output.*custom_metrics/);
      expect(stackContent).toMatch(/TradingPlatform\/TradeExecutionTime/);
    });
  });
});