// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for tap_stack.tf - Failure Recovery and High Availability
// Validates all components against requirements without running Terraform commands

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
let stackContent: string;

beforeAll(() => {
  if (!fs.existsSync(STACK_PATH)) {
    throw new Error(`Stack file not found at: ${STACK_PATH}`);
  }
  stackContent = fs.readFileSync(STACK_PATH, "utf8");
});

describe("File Structure & Basic Validation", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
  });

  test("file is not empty", () => {
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("does NOT declare provider block (provider.tf owns it)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("contains no module blocks (must be self-contained)", () => {
    expect(stackContent).not.toMatch(/\bmodule\s+"[^"]+"\s*{/);
  });

  test("is a single-file stack with all resources inline", () => {
    expect(stackContent).toContain("resource");
    expect(stackContent).toContain("variable");
    expect(stackContent).toContain("output");
  });
});

describe("Variable Declarations - Core Variables", () => {
  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares environment_suffix variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares primary_region variable with default", () => {
    const varSection = stackContent.match(
      /variable\s+"primary_region"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/default\s*=\s*"us-east-1"/);
    }
  });

  test("declares dr_region variable with default", () => {
    const varSection = stackContent.match(
      /variable\s+"dr_region"\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/
    );
    expect(varSection).toBeTruthy();
    if (varSection) {
      expect(varSection[0]).toMatch(/default\s*=\s*"us-east-2"/);
    }
  });

  test("declares vpc_cidr_primary variable", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
  });

  test("declares vpc_cidr_dr variable", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr_dr"\s*{/);
  });

  test("declares availability_zones_count variable", () => {
    expect(stackContent).toMatch(/variable\s+"availability_zones_count"\s*{/);
  });
});

describe("Data Sources", () => {
  test("declares primary availability zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
  });

  test("declares DR availability zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"dr"/);
  });

  test("DR availability zones use provider alias", () => {
    const dataSection = stackContent.match(
      /data\s+"aws_availability_zones"\s+"dr"\s*\{[\s\S]*?\n\}/m
    );
    expect(dataSection).toBeTruthy();
    if (dataSection) {
      expect(dataSection[0]).toMatch(/provider\s*=\s*aws\.dr/);
    }
  });
});

describe("Secrets Manager & Random Password", () => {
  test("declares random_password resource for database", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
  });

  test("random password has length of 32", () => {
    const resourceSection = stackContent.match(
      /resource\s+"random_password"\s+"db_password"\s*\{[\s\S]*?\n\}/m
    );
    expect(resourceSection).toBeTruthy();
    if (resourceSection) {
      expect(resourceSection[0]).toMatch(/length\s*=\s*32/);
    }
  });

  test("declares secrets manager secret for database password", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
  });

  test("declares secrets manager secret version", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/);
  });
});

describe("IAM Resources - S3 Replication", () => {
  test("declares S3 replication IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
  });

  test("S3 replication role has correct assume role policy", () => {
    const roleSection = stackContent.match(
      /resource\s+"aws_iam_role"\s+"s3_replication"[\s\S]*?assume_role_policy\s*=\s*jsonencode\([\s\S]*?\}\s*\)/
    );
    expect(roleSection).toBeTruthy();
    if (roleSection) {
      expect(roleSection[0]).toMatch(/s3\.amazonaws\.com/);
    }
  });

  test("declares S3 replication IAM policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_replication"/);
  });

  test("attaches S3 replication policy to role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_replication"/);
  });
});

describe("VPC Resources - Primary Region", () => {
  test("declares primary VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
  });

  test("primary VPC enables DNS hostnames", () => {
    const vpcSection = stackContent.match(
      /resource\s+"aws_vpc"\s+"primary"\s*\{[\s\S]*?\n\}/m
    );
    expect(vpcSection).toBeTruthy();
    if (vpcSection) {
      expect(vpcSection[0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    }
  });

  test("declares primary private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"/);
  });

  test("declares primary public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"/);
  });

  test("declares primary internet gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
  });

  test("declares primary NAT gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
  });

  test("declares primary EIP for NAT gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"primary_nat"/);
  });

  test("declares primary public route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"/);
  });

  test("declares primary private route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_private"/);
  });
});

describe("VPC Resources - DR Region", () => {
  test("declares DR VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"dr"/);
  });

  test("DR VPC uses provider alias", () => {
    const vpcSection = stackContent.match(
      /resource\s+"aws_vpc"\s+"dr"\s*\{[\s\S]*?\n\}/m
    );
    expect(vpcSection).toBeTruthy();
    if (vpcSection) {
      expect(vpcSection[0]).toMatch(/provider\s*=\s*aws\.dr/);
    }
  });

  test("declares DR private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_private"/);
  });

  test("declares DR public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_public"/);
  });

  test("declares DR internet gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"dr"/);
  });

  test("declares DR NAT gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"dr"/);
  });
});

describe("Security Groups", () => {
  test("declares primary Aurora security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_primary"/);
  });

  test("declares DR Aurora security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_dr"/);
  });

  test("declares primary Lambda security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_primary"/);
  });

  test("declares DR Lambda security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_dr"/);
  });

  test("Aurora security group allows PostgreSQL on port 5432", () => {
    const sgSection = stackContent.match(
      /resource\s+"aws_security_group"\s+"aurora_primary"[\s\S]*?from_port\s*=\s*5432/
    );
    expect(sgSection).toBeTruthy();
  });
});

describe("KMS Keys for Encryption", () => {
  test("declares primary Aurora KMS key", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora_primary"/);
  });

  test("declares primary Aurora KMS alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"aurora_primary"/);
  });

  test("declares DR Aurora KMS key", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora_dr"/);
  });

  test("declares DR Aurora KMS alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"aurora_dr"/);
  });
});

describe("RDS Aurora - Global Database", () => {
  test("declares RDS global cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_global_cluster"\s+"payments"/);
  });

  test("global cluster uses aurora-postgresql engine", () => {
    const globalSection = stackContent.match(
      /resource\s+"aws_rds_global_cluster"\s+"payments"\s*\{[\s\S]*?\n\}/m
    );
    expect(globalSection).toBeTruthy();
    if (globalSection) {
      expect(globalSection[0]).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    }
  });

  test("global cluster has storage encryption enabled", () => {
    const globalSection = stackContent.match(
      /resource\s+"aws_rds_global_cluster"\s+"payments"\s*\{[\s\S]*?\n\}/m
    );
    expect(globalSection).toBeTruthy();
    if (globalSection) {
      expect(globalSection[0]).toMatch(/storage_encrypted\s*=\s*true/);
    }
  });

  test("declares primary DB subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
  });

  test("declares DR DB subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"dr"/);
  });

  test("declares primary RDS cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"/);
  });

  test("declares DR RDS cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"dr"/);
  });

  test("primary cluster instances (count = 2)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"/);
    const instanceSection = stackContent.match(
      /resource\s+"aws_rds_cluster_instance"\s+"primary"\s*\{[\s\S]*?count\s*=\s*2/
    );
    expect(instanceSection).toBeTruthy();
  });

  test("DR cluster instances (count = 2)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"dr"/);
    const instanceSection = stackContent.match(
      /resource\s+"aws_rds_cluster_instance"\s+"dr"[\s\S]*?count\s*=\s*2/
    );
    expect(instanceSection).toBeTruthy();
  });

  test("primary cluster has backup retention period", () => {
    const clusterSection = stackContent.match(
      /resource\s+"aws_rds_cluster"\s+"primary"[\s\S]*?backup_retention_period\s*=\s*7/
    );
    expect(clusterSection).toBeTruthy();
  });
});

describe("S3 Buckets - Cross-Region Replication", () => {
  test("declares primary S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
  });

  test("declares DR S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"dr"/);
  });

  test("primary bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
  });

  test("DR bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"dr"/);
  });

  test("primary bucket has encryption configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
  });

  test("DR bucket has encryption configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"dr"/);
  });

  test("declares S3 replication configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_dr"/);
  });
});

describe("Lambda Functions", () => {
  test("declares primary Lambda IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_primary"/);
  });

  test("declares DR Lambda IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_dr"/);
  });

  test("attaches VPC execution role to primary Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_primary_vpc"/);
  });

  test("attaches VPC execution role to DR Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_dr_vpc"/);
  });

  test("declares primary Lambda S3 policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_primary_s3"/);
  });

  test("declares DR Lambda S3 policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_dr_s3"/);
  });

  test("declares primary Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_processor_primary"/);
  });

  test("declares DR Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_processor_dr"/);
  });

  test("Lambda functions use nodejs18.x runtime", () => {
    const lambdaMatches = stackContent.match(/runtime\s*=\s*"nodejs18\.x"/g);
    expect(lambdaMatches).toBeTruthy();
    expect(lambdaMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test("primary Lambda has VPC configuration", () => {
    const lambdaSection = stackContent.match(
      /resource\s+"aws_lambda_function"\s+"payment_processor_primary"[\s\S]*?vpc_config\s*\{/
    );
    expect(lambdaSection).toBeTruthy();
  });

  test("DR Lambda has VPC configuration", () => {
    const lambdaSection = stackContent.match(
      /resource\s+"aws_lambda_function"\s+"payment_processor_dr"[\s\S]*?vpc_config\s*\{/
    );
    expect(lambdaSection).toBeTruthy();
  });

  test("declares Lambda permissions for API Gateway - primary", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_primary"/);
  });

  test("declares Lambda permissions for API Gateway - DR", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_dr"/);
  });
});

describe("API Gateway - Primary Region", () => {
  test("declares primary API Gateway REST API", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"primary"/);
  });

  test("declares primary payment resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"primary_payment"/);
  });

  test("declares primary payment POST method", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"primary_payment_post"/);
  });

  test("declares primary payment integration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"primary_payment"/);
  });

  test("payment integration uses AWS_PROXY", () => {
    const integrationSection = stackContent.match(
      /resource\s+"aws_api_gateway_integration"\s+"primary_payment"[\s\S]*?type\s*=\s*"AWS_PROXY"/
    );
    expect(integrationSection).toBeTruthy();
  });

  test("declares primary health check resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"primary_health"/);
  });

  test("declares primary health check GET method", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"primary_health_get"/);
  });

  test("health check uses MOCK integration", () => {
    const integrationSection = stackContent.match(
      /resource\s+"aws_api_gateway_integration"\s+"primary_health"[\s\S]*?type\s*=\s*"MOCK"/
    );
    expect(integrationSection).toBeTruthy();
  });

  test("declares primary API Gateway deployment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"primary"/);
  });

  test("deployment stage name is 'prod'", () => {
    const deploymentSection = stackContent.match(
      /resource\s+"aws_api_gateway_deployment"\s+"primary"[\s\S]*?stage_name\s*=\s*"prod"/
    );
    expect(deploymentSection).toBeTruthy();
  });
});

describe("API Gateway - DR Region", () => {
  test("declares DR API Gateway REST API", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"dr"/);
  });

  test("DR API Gateway uses provider alias", () => {
    const apiSection = stackContent.match(
      /resource\s+"aws_api_gateway_rest_api"\s+"dr"\s*\{[\s\S]*?\n\}/m
    );
    expect(apiSection).toBeTruthy();
    if (apiSection) {
      expect(apiSection[0]).toMatch(/provider\s*=\s*aws\.dr/);
    }
  });

  test("declares DR payment resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"dr_payment"/);
  });

  test("declares DR payment POST method", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"dr_payment_post"/);
  });

  test("declares DR health check resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"dr_health"/);
  });

  test("declares DR API Gateway deployment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"dr"/);
  });
});

describe("Route53 - DNS Failover", () => {
  test("declares Route53 health check for primary", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"primary"/);
  });

  test("health check monitors HTTPS endpoint", () => {
    const healthCheckSection = stackContent.match(
      /resource\s+"aws_route53_health_check"\s+"primary"[\s\S]*?type\s*=\s*"HTTPS"/
    );
    expect(healthCheckSection).toBeTruthy();
  });

  test("health check monitors /prod/health path", () => {
    const healthCheckSection = stackContent.match(
      /resource\s+"aws_route53_health_check"\s+"primary"[\s\S]*?resource_path\s*=\s*"\/prod\/health"/
    );
    expect(healthCheckSection).toBeTruthy();
  });

  test("declares SNS topic for health check alerts", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"health_check_alerts"/);
  });

  test("declares CloudWatch alarm for health check", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"health_check"/);
  });

  test("declares Route53 hosted zone", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
  });

  test("declares primary Route53 record with failover", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"primary"/);
  });

  test("primary record uses PRIMARY failover policy", () => {
    const recordSection = stackContent.match(
      /resource\s+"aws_route53_record"\s+"primary"[\s\S]*?type\s*=\s*"PRIMARY"/
    );
    expect(recordSection).toBeTruthy();
  });

  test("declares secondary Route53 record with failover", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"secondary"/);
  });

  test("secondary record uses SECONDARY failover policy", () => {
    const recordSection = stackContent.match(
      /resource\s+"aws_route53_record"\s+"secondary"[\s\S]*?type\s*=\s*"SECONDARY"/
    );
    expect(recordSection).toBeTruthy();
  });
});

describe("CloudWatch Monitoring & Alarms", () => {
  test("declares SNS topic for CloudWatch alarms - primary", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alarms"/);
  });

  test("declares SNS topic for CloudWatch alarms - DR", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alarms_dr"/);
  });

  test("declares Aurora replication lag alarm - primary", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_replication_lag_primary"/);
  });

  test("Aurora replication lag alarm monitors correct metric", () => {
    const alarmSection = stackContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_replication_lag_primary"[\s\S]*?metric_name\s*=\s*"AuroraGlobalDBReplicationLag"/
    );
    expect(alarmSection).toBeTruthy();
  });

  test("declares Aurora replication lag alarm - DR", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_replication_lag_dr"/);
  });

  test("declares API Gateway errors alarm - primary", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_errors_primary"/);
  });

  test("API Gateway alarm monitors 5XXError metric", () => {
    const alarmSection = stackContent.match(
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_errors_primary"[\s\S]*?metric_name\s*=\s*"5XXError"/
    );
    expect(alarmSection).toBeTruthy();
  });

  test("declares API Gateway errors alarm - DR", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_errors_dr"/);
  });

  test("declares Lambda errors alarm - primary", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors_primary"/);
  });

  test("declares Lambda errors alarm - DR", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors_dr"/);
  });
});

describe("Output Declarations", () => {
  test("declares primary API endpoint output", () => {
    expect(stackContent).toMatch(/output\s+"primary_api_endpoint"/);
  });

  test("declares DR API endpoint output", () => {
    expect(stackContent).toMatch(/output\s+"dr_api_endpoint"/);
  });

  test("declares primary health check endpoint output", () => {
    expect(stackContent).toMatch(/output\s+"primary_health_check_endpoint"/);
  });

  test("declares DR health check endpoint output", () => {
    expect(stackContent).toMatch(/output\s+"dr_health_check_endpoint"/);
  });

  test("declares primary Aurora cluster endpoint output", () => {
    expect(stackContent).toMatch(/output\s+"primary_aurora_cluster_endpoint"/);
  });

  test("declares DR Aurora cluster endpoint output", () => {
    expect(stackContent).toMatch(/output\s+"dr_aurora_cluster_endpoint"/);
  });

  test("declares primary S3 bucket name output", () => {
    expect(stackContent).toMatch(/output\s+"primary_s3_bucket_name"/);
  });

  test("declares DR S3 bucket name output", () => {
    expect(stackContent).toMatch(/output\s+"dr_s3_bucket_name"/);
  });

  test("declares primary Lambda function name output", () => {
    expect(stackContent).toMatch(/output\s+"primary_lambda_function_name"/);
  });

  test("declares DR Lambda function name output", () => {
    expect(stackContent).toMatch(/output\s+"dr_lambda_function_name"/);
  });

  test("declares primary VPC ID output", () => {
    expect(stackContent).toMatch(/output\s+"primary_vpc_id"/);
  });

  test("declares DR VPC ID output", () => {
    expect(stackContent).toMatch(/output\s+"dr_vpc_id"/);
  });

  test("declares Route53 health check ID output", () => {
    expect(stackContent).toMatch(/output\s+"route53_health_check_id"/);
  });

  test("declares database secret ARN output", () => {
    expect(stackContent).toMatch(/output\s+"db_secret_arn"/);
  });

  test("database secret output is marked as sensitive", () => {
    const outputSection = stackContent.match(
      /output\s+"db_secret_arn"[\s\S]*?sensitive\s*=\s*true/
    );
    expect(outputSection).toBeTruthy();
  });

  test("declares SNS topics outputs", () => {
    expect(stackContent).toMatch(/output\s+"health_check_alerts_topic_arn"/);
    expect(stackContent).toMatch(/output\s+"cloudwatch_alarms_topic_arn"/);
    expect(stackContent).toMatch(/output\s+"cloudwatch_alarms_dr_topic_arn"/);
  });
});

describe("Disaster Recovery Architecture", () => {
  test("implements multi-region architecture (primary + DR)", () => {
    expect(stackContent).toMatch(/primary_region/);
    expect(stackContent).toMatch(/dr_region/);
  });

  test("uses provider alias for DR region resources", () => {
    const drProviderMatches = stackContent.match(/provider\s*=\s*aws\.dr/g);
    expect(drProviderMatches).toBeTruthy();
    expect(drProviderMatches!.length).toBeGreaterThan(10);
  });

  test("implements Aurora Global Database for cross-region replication", () => {
    expect(stackContent).toMatch(/aws_rds_global_cluster/);
    expect(stackContent).toMatch(/global_cluster_identifier/);
  });

  test("implements S3 cross-region replication", () => {
    expect(stackContent).toMatch(/aws_s3_bucket_replication_configuration/);
  });

  test("implements Route53 DNS failover", () => {
    expect(stackContent).toMatch(/failover_routing_policy/);
    expect(stackContent).toMatch(/PRIMARY/);
    expect(stackContent).toMatch(/SECONDARY/);
  });

  test("implements health checks for failover", () => {
    expect(stackContent).toMatch(/aws_route53_health_check/);
  });
});

describe("High Availability Features", () => {
  test("deploys resources across multiple availability zones", () => {
    expect(stackContent).toMatch(/availability_zones_count/);
    expect(stackContent).toMatch(/data\.aws_availability_zones/);
  });

  test("implements redundant database instances", () => {
    const primaryInstances = stackContent.match(/aws_rds_cluster_instance.*primary/g);
    const drInstances = stackContent.match(/aws_rds_cluster_instance.*dr/g);
    expect(primaryInstances).toBeTruthy();
    expect(drInstances).toBeTruthy();
  });

  test("implements VPC with public and private subnets", () => {
    expect(stackContent).toMatch(/aws_subnet.*primary_private/);
    expect(stackContent).toMatch(/aws_subnet.*primary_public/);
    expect(stackContent).toMatch(/aws_subnet.*dr_private/);
    expect(stackContent).toMatch(/aws_subnet.*dr_public/);
  });

  test("implements NAT gateways for private subnet internet access", () => {
    expect(stackContent).toMatch(/aws_nat_gateway/);
  });
});

describe("Security Best Practices", () => {
  test("implements KMS encryption for Aurora databases", () => {
    expect(stackContent).toMatch(/aws_kms_key.*aurora_primary/);
    expect(stackContent).toMatch(/aws_kms_key.*aurora_dr/);
  });

  test("implements S3 server-side encryption", () => {
    expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    expect(stackContent).toMatch(/sse_algorithm/);
  });

  test("stores database credentials in Secrets Manager", () => {
    expect(stackContent).toMatch(/aws_secretsmanager_secret.*db_password/);
  });

  test("generates random passwords", () => {
    expect(stackContent).toMatch(/random_password/);
  });

  test("implements security groups for network isolation", () => {
    const securityGroups = stackContent.match(/resource\s+"aws_security_group"/g);
    expect(securityGroups).toBeTruthy();
    expect(securityGroups!.length).toBeGreaterThanOrEqual(4);
  });

  test("Lambda functions run in VPC", () => {
    expect(stackContent).toMatch(/vpc_config\s*\{/);
  });

  test("enables backup retention for RDS", () => {
    expect(stackContent).toMatch(/backup_retention_period/);
  });
});

describe("Monitoring & Alerting", () => {
  test("implements CloudWatch alarms for critical metrics", () => {
    const alarms = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
    expect(alarms).toBeTruthy();
    expect(alarms!.length).toBeGreaterThanOrEqual(6);
  });

  test("implements SNS topics for notifications", () => {
    const topics = stackContent.match(/resource\s+"aws_sns_topic"/g);
    expect(topics).toBeTruthy();
    expect(topics!.length).toBeGreaterThanOrEqual(3);
  });

  test("monitors Aurora replication lag", () => {
    expect(stackContent).toMatch(/AuroraGlobalDBReplicationLag/);
  });

  test("monitors API Gateway errors", () => {
    expect(stackContent).toMatch(/5XXError/);
  });

  test("monitors Lambda errors", () => {
    const lambdaAlarms = stackContent.match(/lambda_errors/g);
    expect(lambdaAlarms).toBeTruthy();
    expect(lambdaAlarms!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Resource Naming & Tagging", () => {
  test("uses environment_suffix for unique resource naming", () => {
    const suffixUsage = stackContent.match(/\$\{var\.environment_suffix\}/g);
    expect(suffixUsage).toBeTruthy();
    expect(suffixUsage!.length).toBeGreaterThan(30);
  });

  test("resources have Name tags", () => {
    const nameTags = stackContent.match(/Name\s*=\s*"/g);
    expect(nameTags).toBeTruthy();
    expect(nameTags!.length).toBeGreaterThan(20);
  });

  test("uses consistent naming convention", () => {
    expect(stackContent).toMatch(/payment-/);
  });
});
