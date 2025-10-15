import { beforeAll, describe, expect, test } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

const libDir = path.resolve(__dirname, "..", "lib");
const stackPath = path.join(libDir, "tap_stack.tf");
const providerPath = path.join(libDir, "provider.tf");

let stackContent: string;
let providerContent: string;

beforeAll(() => {
  expect(fs.existsSync(stackPath)).toBe(true);
  expect(fs.existsSync(providerPath)).toBe(true);
  stackContent = fs.readFileSync(stackPath, "utf8");
  providerContent = fs.readFileSync(providerPath, "utf8");
});

describe("Disaster Recovery Terraform Stack", () => {
  describe("File Presence", () => {
    test("tap_stack.tf and provider.tf exist with content", () => {
      expect(stackContent.length).toBeGreaterThan(1000);
      expect(providerContent.length).toBeGreaterThan(100);
    });
  });

  describe("Provider Configuration", () => {
    test("configures required providers and versions", () => {
      expect(providerContent).toMatch(/required_providers\s*\{/);
      expect(providerContent).toMatch(/aws\s*=\s*{\s*source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0(\.0)?"/);
      expect(providerContent).toMatch(/random\s*=\s*{\s*source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.0\.0"/);
    });

    test("defines primary and secondary AWS provider aliases", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*region\s*=\s*var\.primary_region[\s\S]*?default_tags/);
      const aliasMatches = providerContent.match(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"(primary|secondary)"/g);
      expect(aliasMatches).not.toBeNull();
      expect(aliasMatches!.length).toBeGreaterThanOrEqual(2);
      expect(providerContent).toMatch(/alias\s*=\s*"primary"[\s\S]*region\s*=\s*var\.primary_region/);
      expect(providerContent).toMatch(/alias\s*=\s*"secondary"[\s\S]*region\s*=\s*var\.secondary_region/);
    });

    test("uses common tag locals for default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*\{\s*tags\s*=\s*local\.common_tags/);
    });
  });

  describe("Variable Definitions", () => {
    const requiredVariables = [
      { name: "primary_region", pattern: /default\s*=\s*"[A-Za-z0-9-]+"/ },
      { name: "secondary_region", pattern: /default\s*=\s*"[A-Za-z0-9-]+"/ },
      { name: "domain_name", pattern: /default\s*=\s*"trading-platform-domain-iac\.com"/ },
      { name: "rds_instance_class", pattern: /default\s*=\s*"db\.r6g\.xlarge"/ },
      { name: "app_instance_count", pattern: /default\s*=\s*[0-9]+/ },
    ];

    test("declares all required variables with defaults", () => {
      requiredVariables.forEach(({ name, pattern }) => {
        const declarationRegex = new RegExp(`variable\\s+"${name}"`, "m");
        expect(stackContent).toMatch(declarationRegex);
        const defaultRegex = new RegExp(`variable\\s+"${name}"[\\s\\S]*?${pattern.source}`, "m");
        expect(stackContent).toMatch(defaultRegex);
      });
    });

    test("parameterizes VPC CIDR blocks for both regions", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_blocks"[\s\S]*?type\s*=\s*object\({[\s\S]*primary[\s\S]*secondary/);
      expect(stackContent).toMatch(/default\s*=\s*{\s*primary\s*=\s*".+\/\d+"\s*secondary\s*=\s*".+\/\d+"\s*}/);
    });
  });

  describe("Locals and Tagging", () => {
    test("defines locals for naming, tags, and health checks", () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*resource_prefix/);
      expect(stackContent).toMatch(/locals[\s\S]*common_tags\s*=\s*{[\s\S]*Environment/);
      expect(stackContent).toMatch(/locals[\s\S]*primary_tags\s*=\s*merge/);
      expect(stackContent).toMatch(/locals[\s\S]*secondary_tags\s*=\s*merge/);
      expect(stackContent).toMatch(/locals[\s\S]*health_check_config\s*=\s*{/);
      expect(stackContent).toMatch(/locals[\s\S]*dns_ttl\s*=/);
    });

    test("generates unique deployment suffix with random_id", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"deployment"/);
      expect(stackContent).toMatch(/local\.unique_suffix/);
    });
  });

  describe("Networking", () => {
    test("provisions mirrored VPCs and subnets in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"[\s\S]*provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"[\s\S]*provider\s*=\s*aws\.secondary/);
      ["public", "private", "data"].forEach((tier) => {
        const primaryRegex = new RegExp(`resource\\s+"aws_subnet"\\s+"primary_${tier}"[\\s\\S]*provider\\s*=\\s*aws\\.primary`);
        const secondaryRegex = new RegExp(`resource\\s+"aws_subnet"\\s+"secondary_${tier}"[\\s\\S]*provider\\s*=\\s*aws\\.secondary`);
        expect(stackContent).toMatch(primaryRegex);
        expect(stackContent).toMatch(secondaryRegex);
      });
      expect(stackContent).toMatch(/aws_nat_gateway\.primary/);
      expect(stackContent).toMatch(/aws_nat_gateway\.secondary/);
    });

    test("isolates data tier and associates routing appropriately", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"db_primary"/);
      expect(stackContent).toMatch(/aws_route_table_association"\s+"primary_data"/);
      expect(stackContent).toMatch(/aws_route_table_association"\s+"secondary_data"/);
    });
  });

  describe("Application Tier", () => {
    test("creates EC2 instances per region tied to app_instance_count", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"app_primary"[\s\S]*count\s*=\s*var\.app_instance_count/);
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"app_secondary"[\s\S]*count\s*=\s*var\.app_instance_count/);
      expect(stackContent).toMatch(/aws_lb_target_group_attachment"\s+"primary"[\s\S]*aws_instance\.app_primary\[count\.index\]/);
      expect(stackContent).toMatch(/aws_lb_target_group_attachment"\s+"secondary"[\s\S]*aws_instance\.app_secondary\[count\.index\]/);
    });

    test("configures security groups allowing only load balancer ingress", () => {
      expect(stackContent).toMatch(/aws_security_group"\s+"alb_primary"[\s\S]*ingress[\s\S]*from_port\s*=\s*80/);
      expect(stackContent).toMatch(/aws_security_group"\s+"app_primary"[\s\S]*aws_security_group\.alb_primary\.id/);
      expect(stackContent).toMatch(/aws_security_group"\s+"db_primary"[\s\S]*security_groups\s*=\s*\[aws_security_group\.app_primary\.id\]/);
    });
  });

  describe("Load Balancing", () => {
    test("deploys ALBs in both regions with cross-zone balancing", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"[\s\S]*enable_cross_zone_load_balancing\s*=\s*true/);
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"[\s\S]*enable_cross_zone_load_balancing\s*=\s*true/);
    });

    test("configures health checks with shared local settings", () => {
      expect(stackContent).toMatch(/aws_lb_target_group"\s+"primary"[\s\S]*health_check[\s\S]*path\s*=\s*local\.health_check_config\.path/);
      expect(stackContent).toMatch(/aws_lb_target_group"\s+"secondary"[\s\S]*health_check[\s\S]*matcher\s*=\s*local\.health_check_config\.matcher/);
    });

    test("outputs ALB DNS names for Route53 integration", () => {
      expect(stackContent).toMatch(/output\s+"alb_primary_dns"[\s\S]*aws_lb\.primary\.dns_name/);
      expect(stackContent).toMatch(/output\s+"alb_secondary_dns"[\s\S]*aws_lb\.secondary\.dns_name/);
    });
  });

  describe("Route53 Failover", () => {
    test("creates hosted zone and health checks for failover", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"[\s\S]*name\s*=\s*var\.domain_name/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"primary"[\s\S]*resource_path\s*=\s*"\/health"/);
    });

    test("defines failover routing records with PRIMARY and SECONDARY identifiers", () => {
      expect(stackContent).toMatch(/aws_route53_record"\s+"primary"[\s\S]*set_identifier\s*=\s*"PRIMARY"[\s\S]*failover_routing_policy/);
      expect(stackContent).toMatch(/aws_route53_record"\s+"secondary"[\s\S]*set_identifier\s*=\s*"SECONDARY"[\s\S]*failover_routing_policy/);
    });
  });

  describe("RDS Multi-Region", () => {
    test("provisions primary database and cross-region read replica", () => {
      expect(stackContent).toMatch(/aws_db_instance"\s+"primary"[\s\S]*instance_class\s*=\s*var\.rds_instance_class/);
      expect(stackContent).toMatch(/aws_db_instance"\s+"secondary"[\s\S]*replicate_source_db\s*=\s*aws_db_instance\.primary\.arn/);
      expect(stackContent).toMatch(/aws_db_subnet_group"\s+"primary"[\s\S]*aws_subnet\.primary_data/);
    });

    test("links failover automation Lambda to RDS replica", () => {
      expect(stackContent).toMatch(/aws_lambda_function"\s+"failover"[\s\S]*SECONDARY_DB_ID\s*=\s*aws_db_instance\.secondary\.id/);
    });
  });

  describe("DynamoDB Global Tables", () => {
    test("defines DynamoDB table with global secondary index and streams", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"primary"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/global_secondary_index[\s\S]*name\s*=\s*"status-index"/);
    });

    test("enables point in time recovery for DynamoDB table", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true\s*}/);
    });

    test("configures cross-region replica for global table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"primary"[\s\S]*replica\s*{\s*region_name\s*=\s*var\.secondary_region/);
    });
  });

  describe("Failover Orchestration Lambda", () => {
    test("creates IAM role and policy with required permissions", () => {
      expect(stackContent).toMatch(/aws_iam_role"\s+"lambda_failover"/);
      expect(stackContent).toMatch(/aws_iam_role_policy"\s+"lambda_failover"[\s\S]*"rds:PromoteReadReplica"/);
      expect(stackContent).toMatch(/"route53:ChangeResourceRecordSets"/);
      expect(stackContent).toMatch(/"cloudwatch:PutMetricData"/);
    });

    test("defines Lambda function with failover environment and runtime", () => {
      expect(stackContent).toMatch(/aws_lambda_function"\s+"failover"[\s\S]*runtime\s*=\s*"python3\.11"/);
      expect(stackContent).toMatch(/environment\s*{\s*variables\s*=\s*{[\s\S]*SECONDARY_REGION[\s\S]*SECONDARY_DB_ID[\s\S]*SECONDARY_ALB_DNS/);
    });

    test("sets up CloudWatch event trigger and permissions for Lambda", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_event_rule"\s+"failover_trigger"/);
      expect(stackContent).toMatch(/aws_cloudwatch_event_target"\s+"failover_lambda"/);
      expect(stackContent).toMatch(/aws_lambda_permission"\s+"allow_cloudwatch"/);
    });
  });

  describe("Observability and Alarms", () => {
    test("creates CloudWatch alarms and log groups", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm"\s+"primary_health"/);
      expect(stackContent).toMatch(/aws_cloudwatch_log_group"\s+"lambda_failover"/);
    });
  });

  describe("Outputs", () => {
    test("exposes critical resource identifiers and endpoints", () => {
      const requiredOutputs = [
        "vpc_primary_id",
        "vpc_secondary_id",
        "subnets_primary_public",
        "subnets_secondary_public",
        "alb_primary_dns",
        "alb_secondary_dns",
        "route53_zone_id",
        "route53_health_check_id",
        "rds_primary_endpoint",
        "rds_secondary_endpoint",
        "dynamodb_table_arn",
        "lambda_failover_arn",
        "instances_primary_ids",
        "instances_secondary_ids",
      ];
      requiredOutputs.forEach((outputName) => {
        const regex = new RegExp(`output\\s+"${outputName}"`);
        expect(stackContent).toMatch(regex);
      });
    });
  });
});
