import { beforeAll, describe, expect, test } from "@jest/globals";
import fs from "fs";
import path from "path";

const libDir = path.resolve(__dirname, "..", "lib");
const stackPath = path.join(libDir, "tap_stack.tf");
const providerPath = path.join(libDir, "provider.tf");
const runtimeDir = path.join(libDir, "runtime");
const userDataPath = path.join(runtimeDir, "app_user_data.sh.tmpl");
const exampleAppPath = path.join(runtimeDir, "example_app.py");
const lambdaPath = path.join(runtimeDir, "failover_lambda.py");

let stackContent = "";
let providerContent = "";
let userDataContent = "";
let exampleAppContent = "";
let lambdaContent = "";
let resourceNames: string[] = [];
let variableNames: string[] = [];
let dataSourceNames: string[] = [];
let outputNames: string[] = [];

const collect = (pattern: RegExp, formatter: (match: RegExpMatchArray) => string) => {
  const items: string[] = [];
  for (const match of stackContent.matchAll(pattern)) {
    items.push(formatter(match));
  }
  return items;
};

const expectStackToMatch = (regex: RegExp) => {
  expect(stackContent).toMatch(regex);
};

const expectResourceExists = (resource: string) => {
  expect(resourceNames).toContain(resource);
};

const expectVariableHasDefault = (variable: string) => {
  expectStackToMatch(new RegExp(`variable\\s+"${variable}"[\\s\\S]*?default\\s*=`));
};

const expectCollectionIncludes = (collection: string[], expected: string[]) => {
  expected.forEach((item) => {
    expect(collection).toContain(item);
  });
};

const expectResourcesPresent = (resources: string[]) => {
  resources.forEach(expectResourceExists);
};

const REQUIRED_VARIABLES = [
  "app_name",
  "primary_region",
  "secondary_region",
  "vpc_cidr_blocks",
  "database_instance_class",
  "backup_retention_period",
  "environment",
  "kms_deletion_window",
  "route53_domain",
  "ec2_instances_per_region",
  "state_bucket",
  "state_key",
  "state_region",
  "state_lock_table",
];

const CORE_VARIABLES = [
  "app_name",
  "primary_region",
  "secondary_region",
  "vpc_cidr_blocks",
  "database_instance_class",
  "backup_retention_period",
  "environment",
  "kms_deletion_window",
  "route53_domain",
  "ec2_instances_per_region",
];

const STATE_VARIABLES = ["state_bucket", "state_key", "state_region", "state_lock_table"];

const DATA_SOURCES = [
  "aws_availability_zones.primary",
  "aws_availability_zones.secondary",
  "aws_caller_identity.current",
  "aws_ami.amazon_linux",
  "aws_ami.amazon_linux_secondary",
  "archive_file.failover_lambda",
];

const KMS_RESOURCES = [
  "aws_kms_key.primary",
  "aws_kms_alias.primary",
  "aws_kms_key.secondary",
  "aws_kms_alias.secondary",
];

const PRIMARY_NETWORK_RESOURCES = [
  "aws_vpc.primary",
  "aws_subnet.primary_public",
  "aws_subnet.primary_private",
  "aws_subnet.primary_db",
  "aws_internet_gateway.primary",
  "aws_nat_gateway.primary",
  "aws_route_table.primary_public",
  "aws_route_table.primary_private",
  "aws_route_table_association.primary_public",
  "aws_route_table_association.primary_private",
  "aws_route_table_association.primary_db",
];

const SECONDARY_NETWORK_RESOURCES = [
  "aws_vpc.secondary",
  "aws_subnet.secondary_public",
  "aws_subnet.secondary_private",
  "aws_subnet.secondary_db",
  "aws_internet_gateway.secondary",
  "aws_nat_gateway.secondary",
  "aws_route_table.secondary_public",
  "aws_route_table.secondary_private",
  "aws_route_table_association.secondary_public",
  "aws_route_table_association.secondary_private",
  "aws_route_table_association.secondary_db",
];

const SECURITY_GROUP_RESOURCES = [
  "aws_security_group.alb_primary",
  "aws_security_group.alb_secondary",
  "aws_security_group.ec2_primary",
  "aws_security_group.ec2_secondary",
  "aws_security_group.rds_primary",
  "aws_security_group.rds_secondary",
  "aws_security_group.lambda_primary",
  "aws_security_group.lambda_secondary",
];

const SECRET_RESOURCES = [
  "random_password.db_password",
  "aws_secretsmanager_secret.db_credentials",
  "aws_secretsmanager_secret_version.db_credentials",
];

const AURORA_RESOURCES = [
  "aws_db_subnet_group.primary",
  "aws_db_subnet_group.secondary",
  "aws_rds_global_cluster.main",
  "aws_rds_cluster.primary",
  "aws_rds_cluster.secondary",
  "aws_rds_cluster_instance.primary",
  "aws_rds_cluster_instance.secondary",
];

const ALB_COMPUTE_RESOURCES = [
  "aws_lb.primary",
  "aws_lb.secondary",
  "aws_lb_target_group.primary",
  "aws_lb_target_group.secondary",
  "aws_lb_listener.primary",
  "aws_lb_listener.secondary",
  "aws_instance.primary",
  "aws_instance.secondary",
  "aws_lb_target_group_attachment.primary",
  "aws_lb_target_group_attachment.secondary",
];

const EC2_IAM_RESOURCES = [
  "aws_iam_role.ec2",
  "aws_iam_role_policy.ec2_app",
  "aws_iam_role_policy.ec2_app_secondary",
  "aws_iam_instance_profile.ec2",
  "aws_iam_instance_profile.ec2_secondary",
  "aws_iam_role_policy_attachment.ec2_ssm",
  "aws_iam_role_policy_attachment.ec2_cwagent",
];

const ROUTE53_RESOURCES = [
  "aws_route53_zone.main",
  "aws_route53_health_check.primary",
  "aws_route53_record.primary",
  "aws_route53_record.secondary",
];

const FAILOVER_RESOURCES = [
  "aws_iam_role.lambda_failover",
  "aws_iam_role_policy.lambda_failover",
  "aws_lambda_function.failover",
];

const EVENTBRIDGE_RESOURCES = [
  "aws_cloudwatch_event_rule.health_check_failure",
  "aws_cloudwatch_event_target.health_lambda",
  "aws_lambda_permission.allow_eventbridge_health",
];

const NETWORK_OUTPUTS = [
  "primary_vpc_id",
  "secondary_vpc_id",
  "primary_alb_dns",
  "secondary_alb_dns",
  "primary_alb_arn",
  "secondary_alb_arn",
  "aurora_global_writer_endpoint",
  "aurora_primary_writer_endpoint",
  "aurora_primary_reader_endpoint",
  "aurora_secondary_writer_endpoint",
  "aurora_secondary_reader_endpoint",
];
const OPERATIONAL_OUTPUTS = [
  "aurora_global_cluster_id",
  "route53_zone_id",
  "route53_nameservers",
  "application_url",
  "lambda_function_arn",
  "primary_ec2_instance_ids",
  "secondary_ec2_instance_ids",
];
const SECURITY_OUTPUTS = [
  "primary_kms_key_id",
  "secondary_kms_key_id",
  "secrets_manager_secret_arn",
  "primary_alb_security_group_id",
  "primary_ec2_security_group_id",
  "primary_rds_security_group_id",
  "primary_lambda_security_group_id",
  "secondary_alb_security_group_id",
  "secondary_ec2_security_group_id",
  "secondary_rds_security_group_id",
  "secondary_lambda_security_group_id",
  "eventbridge_health_rule_arn",
];

beforeAll(() => {
  [stackPath, providerPath, userDataPath, exampleAppPath, lambdaPath].forEach((file) => {
    expect(fs.existsSync(file)).toBe(true);
  });

  stackContent = fs.readFileSync(stackPath, "utf8");
  providerContent = fs.readFileSync(providerPath, "utf8");
  userDataContent = fs.readFileSync(userDataPath, "utf8");
  exampleAppContent = fs.readFileSync(exampleAppPath, "utf8");
  lambdaContent = fs.readFileSync(lambdaPath, "utf8");

  resourceNames = collect(/resource\s+"([^"]+)"\s+"([^"]+)"/g, (m) => `${m[1]}.${m[2]}`);
  variableNames = collect(/variable\s+"([^"]+)"/g, (m) => m[1]);
  dataSourceNames = collect(/data\s+"([^"]+)"\s+"([^"]+)"/g, (m) => `${m[1]}.${m[2]}`);
  outputNames = collect(/output\s+"([^"]+)"/g, (m) => m[1]);
});

describe("tap_stack.tf static verification", () => {
  test("stack file exists, is substantial, and does not declare providers", () => {
    expect(stackContent.length).toBeGreaterThan(5000);
    expect(stackContent.split("\n").length).toBeGreaterThan(300);
    expect(stackContent).not.toMatch(/TODO/i);
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  describe("locals definitions", () => {
    test("defines resource prefix and base tagging locals", () => {
      expectStackToMatch(/locals\s*{[\s\S]*resource_prefix/);
      expectStackToMatch(/locals[\s\S]*common_tags\s*=\s*{/);
    });

    test("common tags include compliance scope and team ownership", () => {
      expectStackToMatch(/common_tags[\s\S]*ComplianceScope\s*=\s*"financial-services"/);
      expectStackToMatch(/common_tags[\s\S]*team\s*=\s*2/);
    });

    test("computes subnet cidr maps for both regions", () => {
      expectStackToMatch(/locals[\s\S]*primary_subnet_cidrs/);
      expectStackToMatch(/locals[\s\S]*secondary_subnet_cidrs/);
    });

    test("sets az count and feature toggles", () => {
      expectStackToMatch(/locals[\s\S]*az_count\s*=\s*3/);
      expectStackToMatch(/locals[\s\S]*enable_guardduty/);
      expectStackToMatch(/locals[\s\S]*lambda_runtime/);
    });
  });

  describe("input variables", () => {
    test("declares core infrastructure variables", () => {
      expectCollectionIncludes(variableNames, CORE_VARIABLES);
    });

    test("declares state management variables", () => {
      expectCollectionIncludes(variableNames, STATE_VARIABLES);
    });

    test("each required variable specifies a default value", () => {
      REQUIRED_VARIABLES.forEach(expectVariableHasDefault);
    });

    test("environment variable enforces allowed values", () => {
      expectStackToMatch(/variable\s+"environment"[\s\S]*validation/);
      expectStackToMatch(/variable\s+"environment"[\s\S]*contains\(\s*\["prod",\s*"staging"\]/);
    });
  });

  describe("data sources", () => {
    test("defines required data sources across regions", () => {
      expectCollectionIncludes(dataSourceNames, DATA_SOURCES);
    });

    test("secondary availability zones use provider alias", () => {
      expectStackToMatch(/data\s+"aws_availability_zones"\s+"secondary"[\s\S]*provider\s*=\s*aws\.secondary/);
    });
  });

  describe("kms and encryption", () => {
    test("declares customer managed keys and aliases in both regions", () => {
      expectResourcesPresent(KMS_RESOURCES);
    });

    test("kms keys enable rotation and honor deletion windows", () => {
      expectStackToMatch(/resource\s+"aws_kms_key"\s+"primary"[\s\S]*enable_key_rotation\s*=\s*true/);
      expectStackToMatch(/resource\s+"aws_kms_key"\s+"secondary"[\s\S]*enable_key_rotation\s*=\s*true/);
      expectStackToMatch(/resource\s+"aws_kms_key"\s+"primary"[\s\S]*deletion_window_in_days\s*=\s*var\.kms_deletion_window/);
    });
  });

  describe("primary region networking", () => {
    test("declares foundational primary networking resources", () => {
      expectResourcesPresent(PRIMARY_NETWORK_RESOURCES);
    });

    test("primary private subnets route through NAT gateways", () => {
      expectStackToMatch(/resource\s+"aws_route_table"\s+"primary_private"[\s\S]*nat_gateway_id/);
    });

    test("primary public subnets assign public IPs on launch", () => {
      expectStackToMatch(/resource\s+"aws_subnet"\s+"primary_public"[\s\S]*map_public_ip_on_launch\s*=\s*true/);
    });
  });

  describe("secondary region networking", () => {
    test("declares mirrored secondary networking resources", () => {
      expectResourcesPresent(SECONDARY_NETWORK_RESOURCES);
    });

    test("secondary networking explicitly references secondary provider", () => {
      expectStackToMatch(/resource\s+"aws_subnet"\s+"secondary_public"[\s\S]*provider\s*=\s*aws\.secondary/);
    });

    test("secondary private route tables rely on NAT gateways", () => {
      expectStackToMatch(/resource\s+"aws_route_table"\s+"secondary_private"[\s\S]*aws_nat_gateway\.secondary/);
    });
  });

  describe("network security groups", () => {
    test("creates security groups for load balancers, compute, database, and lambda", () => {
      expectResourcesPresent(SECURITY_GROUP_RESOURCES);
    });

    test("security groups include ingress and egress controls", () => {
      expectStackToMatch(/resource\s+"aws_security_group"\s+"alb_primary"[\s\S]*ingress[\s\S]*443/);
      expectStackToMatch(/resource\s+"aws_security_group"\s+"ec2_primary"[\s\S]*egress/);
      expectStackToMatch(/resource\s+"aws_security_group"\s+"lambda_secondary"[\s\S]*egress/);
    });
  });

  describe("secrets management", () => {
    test("provisions password generation and secret storage resources", () => {
      expectResourcesPresent(SECRET_RESOURCES);
    });

    test("secrets use strong password policy and replicate to secondary region", () => {
      expectStackToMatch(/resource\s+"random_password"\s+"db_password"[\s\S]*length\s*=\s*32/);
      expectStackToMatch(/resource\s+"random_password"\s+"db_password"[\s\S]*override_special/);
      expectStackToMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"[\s\S]*replica\s*{/);
    });
  });

  describe("aurora global database", () => {
    test("defines subnet groups, global cluster, and regional clusters", () => {
      expectResourcesPresent(AURORA_RESOURCES);
    });

    test("aurora clusters enforce encryption with regional kms keys", () => {
      expectStackToMatch(/resource\s+"aws_rds_cluster"\s+"primary"[\s\S]*kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expectStackToMatch(/resource\s+"aws_rds_cluster"\s+"secondary"[\s\S]*kms_key_id\s*=\s*aws_kms_key\.secondary\.arn/);
      expectStackToMatch(/resource\s+"aws_rds_global_cluster"\s+"main"[\s\S]*storage_encrypted\s*=\s*true/);
    });

    test("aurora instances enable enhanced monitoring", () => {
      expectStackToMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"[\s\S]*monitoring_interval/);
    });
  });

  describe("application load balancing and compute", () => {
    test("creates application load balancers, listeners, and target attachments", () => {
      expectResourcesPresent(ALB_COMPUTE_RESOURCES);
    });

    test("load balancers enable cross-zone balancing and health checks", () => {
      expectStackToMatch(/resource\s+"aws_lb"\s+"primary"[\s\S]*enable_cross_zone_load_balancing\s*=\s*true/);
      expectStackToMatch(/resource\s+"aws_lb_target_group"\s+"primary"[\s\S]*health_check/);
    });

    test("ec2 instances apply templated user data and shared logging", () => {
      expectStackToMatch(/resource\s+"aws_instance"\s+"primary"[\s\S]*user_data\s*=\s*templatefile/);
      expectStackToMatch(/resource\s+"aws_instance"\s+"secondary"[\s\S]*log_group/);
    });

    test("ec2 root volumes enforce encryption via kms", () => {
      expectStackToMatch(/resource\s+"aws_instance"\s+"primary"[\s\S]*root_block_device[\s\S]*kms_key_id/);
    });
  });

  describe("ec2 iam scaffolding", () => {
    test("provides iam roles, profiles, and policy attachments for compute hosts", () => {
      expectResourcesPresent(EC2_IAM_RESOURCES);
    });

    test("application policies allow secret access and kms decryption", () => {
      expectStackToMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_app"[\s\S]*secretsmanager:GetSecretValue/);
      expectStackToMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_app"[\s\S]*kms:Decrypt/);
    });

    test("ec2 role trust policy permits instance assumption", () => {
      expectStackToMatch(/resource\s+"aws_iam_role"\s+"ec2"[\s\S]*Service\s*=\s*"ec2.amazonaws.com"/);
    });
  });

  describe("route53 failover dns", () => {
    test("defines hosted zone, health check, and failover records", () => {
      expectResourcesPresent(ROUTE53_RESOURCES);
    });

    test("dns records implement primary and secondary failover strategy", () => {
      expectStackToMatch(/resource\s+"aws_route53_record"\s+"primary"[\s\S]*failover_routing_policy/);
      expectStackToMatch(/resource\s+"aws_route53_record"\s+"secondary"[\s\S]*alias\s*{/);
      expectStackToMatch(/resource\s+"aws_route53_health_check"\s+"primary"[\s\S]*resource_path\s*=\s*"\/health"/);
    });
  });

  describe("failover automation", () => {
    test("creates iam role, policy, and lambda function", () => {
      expectResourcesPresent(FAILOVER_RESOURCES);
    });

    test("lambda function uses packaged archive and handler", () => {
      expectStackToMatch(/data\s+"archive_file"\s+"failover_lambda"/);
      expectStackToMatch(/resource\s+"aws_lambda_function"\s+"failover"[\s\S]*filename\s*=\s*data\.archive_file\.failover_lambda\.output_path/);
      expectStackToMatch(/resource\s+"aws_lambda_function"\s+"failover"[\s\S]*handler\s*=\s*"failover_lambda\.handler"/);
      expectStackToMatch(/resource\s+"aws_lambda_function"\s+"failover"[\s\S]*source_code_hash/);
    });
  });

  describe("eventbridge integration", () => {
    test("registers route53 EventBridge rule with target and permission", () => {
      expectResourcesPresent(EVENTBRIDGE_RESOURCES);
    });

    test("event pattern and permission invoke failover lambda", () => {
      expectStackToMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"health_check_failure"[\s\S]*"aws.route53"/);
      expectStackToMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_health"[\s\S]*principal\s*=\s*"events.amazonaws.com"/);
    });
  });

  describe("rds enhanced monitoring", () => {
    test("configures monitoring role with managed policy attachment", () => {
      expectResourceExists("aws_iam_role.rds_monitoring");
      expectResourceExists("aws_iam_role_policy_attachment.rds_monitoring");
      expectStackToMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_monitoring"[\s\S]*AmazonRDSEnhancedMonitoringRole/);
    });
  });

  describe("stack outputs", () => {
    test("exposes network-oriented outputs for cross-region visibility", () => {
      expectCollectionIncludes(outputNames, NETWORK_OUTPUTS);
    });

    test("exposes operational and security outputs", () => {
      expectCollectionIncludes(outputNames, [...OPERATIONAL_OUTPUTS, ...SECURITY_OUTPUTS]);
    });
  });
});

describe("supporting files validation", () => {
  describe("provider.tf configuration", () => {
    test("declares required providers", () => {
      expect(providerContent).toMatch(/terraform\s*{[\s\S]*required_providers/);
    });

    test("configures primary and secondary provider blocks", () => {
      expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*region\s*=\s*var\.primary_region/);
      expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*default_tags/);
      expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*alias\s*=\s*"secondary"/);
      expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*region\s*=\s*var\.secondary_region/);
    });
  });

  describe("ec2 user data template", () => {
    test("installs dependencies and CloudWatch agent", () => {
      expect(userDataContent).toMatch(/yum install -y python3 python3-pip/);
      expect(userDataContent).toMatch(/amazon-cloudwatch-agent-ctl/);
    });

    test("manages example app systemd service lifecycle", () => {
      expect(userDataContent).toMatch(/example-app\.service/);
      expect(userDataContent).toMatch(/systemctl restart example-app.service/);
    });
  });

  describe("example flask application", () => {
    test("exposes health and data routes", () => {
      expect(exampleAppContent).toMatch(/@app\.route\("\/health"/);
      expect(exampleAppContent).toMatch(/@app\.route\("\/data"/);
    });

    test("includes failure controls and database helpers", () => {
      expect(exampleAppContent).toMatch(/@app\.route\("\/trigger-failure"/);
      expect(exampleAppContent).toMatch(/def get_db_connection/);
    });
  });

  describe("failover lambda implementation", () => {
    test("contains helper and failover invocation", () => {
      expect(lambdaContent).toMatch(/def _cluster_members/);
      expect(lambdaContent).toMatch(/failover_global_cluster/);
    });

    test("waits for cluster availability and returns success payload", () => {
      expect(lambdaContent).toMatch(/get_waiter\("db_cluster_available"\)/);
      expect(lambdaContent).toMatch(/return {\s*"statusCode": 200/);
    });
  });
});
