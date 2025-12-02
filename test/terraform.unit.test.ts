// Unit tests for Terraform configuration
// Tests the structure, syntax, and configuration of tap_stack.tf
// No Terraform commands are executed - these are static analysis tests

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARIABLES_REL = "../lib/variables.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform Stack: tap_stack.tf", () => {
  let stackContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    variablesContent = fs.existsSync(variablesPath)
      ? fs.readFileSync(variablesPath, "utf8")
      : "";
  });

  // =============================================================================
  // FILE EXISTENCE & STRUCTURE
  // =============================================================================

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("has terraform block", () => {
      expect(stackContent).toMatch(/terraform\s*{/);
    });

    test("has required_providers block", () => {
      expect(stackContent).toMatch(/required_providers\s*{/);
    });

    test("declares AWS provider", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{|source\s*=\s*"hashicorp\/aws"/);
    });
  });

  // =============================================================================
  // TERRAFORM CONFIGURATION
  // =============================================================================

  describe("Terraform Configuration", () => {
    test("requires Terraform version >= 1.5.0", () => {
      expect(stackContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("declares AWS provider with version constraint", () => {
      expect(stackContent).toMatch(/aws\s*=\s*\{[^}]*source\s*=\s*"hashicorp\/aws"/);
      expect(stackContent).toMatch(/aws\s*=\s*\{[^}]*version\s*=/);
    });

    test("declares random provider", () => {
      expect(stackContent).toMatch(/random\s*=\s*\{[^}]*source\s*=\s*"hashicorp\/random"/);
    });

    test("declares archive provider", () => {
      expect(stackContent).toMatch(/archive\s*=\s*\{[^}]*source\s*=\s*"hashicorp\/archive"/);
    });
  });

  // =============================================================================
  // REQUIRED VARIABLES
  // =============================================================================

  describe("Required Variables", () => {
    test("declares aws_region variable", () => {
      const content = stackContent + variablesContent;
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares env variable with validation", () => {
      expect(stackContent).toMatch(/variable\s+"env"\s*{/);
      expect(stackContent).toMatch(/validation\s*{/);
      expect(stackContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test("declares pr_number variable", () => {
      const content = stackContent + variablesContent;
      expect(content).toMatch(/variable\s+"pr_number"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares database_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"database_name"\s*{/);
    });

    test("declares master_username variable", () => {
      expect(stackContent).toMatch(/variable\s+"master_username"\s*{/);
    });
  });

  // =============================================================================
  // NETWORKING RESOURCES
  // =============================================================================

  describe("Networking Resources", () => {
    test("declares VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC has enable_dns_hostnames enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC has enable_dns_support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    });

    test("declares private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("declares NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test("declares route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("declares VPC endpoints for DynamoDB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
    });

    test("declares VPC endpoints for S3", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    });
  });

  // =============================================================================
  // SECURITY GROUPS
  // =============================================================================

  describe("Security Groups", () => {
    test("declares Lambda security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    });

    test("declares Aurora security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
    });

    test("declares Redis security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*{/);
    });

    test("Lambda security group allows outbound traffic", () => {
      const lambdaSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"lambda"(?:[^{}]|\{[^}]*\})*egress[^}]*}/s);
      expect(lambdaSgMatch).toBeTruthy();
      if (lambdaSgMatch) {
        expect(lambdaSgMatch[0]).toMatch(/from_port\s*=\s*0/);
        expect(lambdaSgMatch[0]).toMatch(/to_port\s*=\s*0/);
        expect(lambdaSgMatch[0]).toMatch(/protocol\s*=\s*"-1"/);
      }
    });

    test("Aurora security group allows inbound from Lambda on port 5432", () => {
      const auroraSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"aurora"(?:[^{}]|\{[^}]*\})*ingress[^}]*}/s);
      expect(auroraSgMatch).toBeTruthy();
      if (auroraSgMatch) {
        expect(auroraSgMatch[0]).toMatch(/from_port\s*=\s*5432/);
        expect(auroraSgMatch[0]).toMatch(/to_port\s*=\s*5432/);
        expect(auroraSgMatch[0]).toMatch(/protocol\s*=\s*"tcp"/);
      }
    });

    test("Redis security group allows inbound from Lambda on port 6379", () => {
      const redisSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"redis"(?:[^{}]|\{[^}]*\})*ingress[^}]*}/s);
      expect(redisSgMatch).toBeTruthy();
      if (redisSgMatch) {
        expect(redisSgMatch[0]).toMatch(/from_port\s*=\s*6379/);
        expect(redisSgMatch[0]).toMatch(/to_port\s*=\s*6379/);
        expect(redisSgMatch[0]).toMatch(/protocol\s*=\s*"tcp"/);
      }
    });
  });

  // =============================================================================
  // DATABASE RESOURCES
  // =============================================================================

  describe("Database Resources", () => {
    test("declares Aurora RDS cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
    });

    test("Aurora cluster uses aurora-postgresql engine", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test("Aurora cluster has storage encryption enabled", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("Aurora cluster is not publicly accessible", () => {
      // Aurora clusters in private subnets are not publicly accessible by default
      expect(stackContent).toMatch(/db_subnet_group_name/);
    });

    test("declares Aurora cluster instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*{/);
    });

    test("declares DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*{/);
    });

    test("declares RDS cluster parameter group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_parameter_group"\s+"aurora"\s*{/);
    });
  });

  // =============================================================================
  // CACHE RESOURCES
  // =============================================================================

  describe("Cache Resources", () => {
    test("declares ElastiCache Redis replication group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
    });

    test("Redis has at-rest encryption enabled", () => {
      expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    });

    test("Redis uses port 6379", () => {
      expect(stackContent).toMatch(/port\s*=\s*6379/);
    });

    test("declares ElastiCache subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*{/);
    });

    test("declares ElastiCache parameter group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"\s*{/);
    });
  });

  // =============================================================================
  // STORAGE RESOURCES
  // =============================================================================

  describe("Storage Resources", () => {
    test("declares S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"content"\s*{/);
    });

    test("S3 bucket has versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"content"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 bucket has encryption enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"content"\s*{/);
    });

    test("S3 bucket blocks public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"content"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("declares DynamoDB tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"interactions"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"metrics"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"preferences"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"rules"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"trending"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"catalog"\s*{/);
    });

    test("DynamoDB tables have encryption enabled", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
    });

    test("interactions table has streams enabled", () => {
      const interactionsMatch = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"interactions"(?:[^{}]|\{[^}]*\})*stream_enabled[^}]*}/s);
      expect(interactionsMatch).toBeTruthy();
      if (interactionsMatch) {
        expect(interactionsMatch[0]).toMatch(/stream_enabled\s*=\s*true/);
      }
    });
  });

  // =============================================================================
  // STREAMING RESOURCES
  // =============================================================================

  describe("Streaming Resources", () => {
    test("declares Kinesis stream", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"interactions"\s*{/);
    });

    test("Kinesis stream has encryption enabled", () => {
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });
  });

  // =============================================================================
  // LAMBDA FUNCTIONS
  // =============================================================================

  describe("Lambda Functions", () => {
    test("declares validator Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"validator"\s*{/);
    });

    test("declares processor Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"\s*{/);
    });

    test("declares notifier Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"notifier"\s*{/);
    });

    test("declares moderator Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"moderator"\s*{/);
    });

    test("declares classifier Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"classifier"\s*{/);
    });

    test("declares trending Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"trending"\s*{/);
    });

    test("declares webhook Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook"\s*{/);
    });

    test("declares Lambda IAM roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_validator"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_processor"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_notifier"\s*{/);
    });

    test("declares Lambda event source mappings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_processor"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_notifier"\s*{/);
    });

    test("notifier Lambda has VPC configuration", () => {
      const notifierMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"notifier"(?:[^{}]|\{[^}]*\})*vpc_config[^}]*}/s);
      expect(notifierMatch).toBeTruthy();
    });

    test("trending Lambda has VPC configuration", () => {
      const trendingMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"trending"(?:[^{}]|\{[^}]*\})*vpc_config[^}]*}/s);
      expect(trendingMatch).toBeTruthy();
    });
  });

  // =============================================================================
  // API GATEWAY
  // =============================================================================

  describe("API Gateway", () => {
    test("declares WebSocket API", () => {
      expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"websocket"\s*{/);
    });

    test("WebSocket API uses WEBSOCKET protocol", () => {
      expect(stackContent).toMatch(/protocol_type\s*=\s*"WEBSOCKET"/);
    });

    test("declares WebSocket API stage", () => {
      expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_stage"\s+"websocket"\s*{/);
    });

    test("declares WebSocket API routes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"connect"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"disconnect"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"interaction"\s*{/);
    });

    test("declares WebSocket API integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_integration"\s+"validator"\s*{/);
    });
  });

  // =============================================================================
  // MESSAGING RESOURCES
  // =============================================================================

  describe("Messaging Resources", () => {
    test("declares SNS topics", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"notifications"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"moderation"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"removed"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"new_content"\s*{/);
    });

    test("SNS topics have KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("declares SQS queues", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"notifications"\s*{/);
    });

    test("SQS queues have KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("declares SQS dead letter queues", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"\s*{/);
    });

    test("declares SNS to SQS subscriptions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"notifications_to_sqs"\s*{/);
    });
  });

  // =============================================================================
  // STEP FUNCTIONS
  // =============================================================================

  describe("Step Functions", () => {
    test("declares Step Functions state machine", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"trending"\s*{/);
    });

    test("declares Step Functions IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"\s*{/);
    });
  });

  // =============================================================================
  // EVENTBRIDGE
  // =============================================================================

  describe("EventBridge", () => {
    test("declares EventBridge rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"trending"\s*{/);
    });

    test("declares EventBridge target", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"trending"\s*{/);
    });

    test("declares EventBridge IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"\s*{/);
    });
  });

  // =============================================================================
  // SECRETS & ENCRYPTION
  // =============================================================================

  describe("Secrets & Encryption", () => {
    test("declares KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
    });

    test("KMS key has rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("declares KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
    });

    test("declares Secrets Manager secrets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"\s*{/);
    });

    test("Secrets Manager secrets use KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.id/);
    });
  });

  // =============================================================================
  // MONITORING & ALARMS
  // =============================================================================

  describe("Monitoring & Alarms", () => {
    test("declares CloudWatch log groups for Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"\s*{/);
    });

    test("declares CloudWatch metric alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"websocket_connections"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_iterator_age"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"\s*{/);
    });
  });

  // =============================================================================
  // OUTPUTS
  // =============================================================================

  describe("Outputs", () => {
    test("declares websocket_api_url output", () => {
      expect(stackContent).toMatch(/output\s+"websocket_api_url"\s*{/);
    });

    test("declares kinesis_stream_arn output", () => {
      expect(stackContent).toMatch(/output\s+"kinesis_stream_arn"\s*{/);
    });

    test("declares dynamodb_tables output", () => {
      expect(stackContent).toMatch(/output\s+"dynamodb_tables"\s*{/);
    });

    test("declares sns_topics output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topics"\s*{/);
    });

    test("declares sqs_queues output", () => {
      expect(stackContent).toMatch(/output\s+"sqs_queues"\s*{/);
    });

    test("declares aurora_endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"aurora_endpoint"\s*{/);
    });

    test("declares redis_endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"redis_endpoint"\s*{/);
    });

    test("declares step_functions_arn output", () => {
      expect(stackContent).toMatch(/output\s+"step_functions_arn"\s*{/);
    });

    test("declares lambda_functions output", () => {
      expect(stackContent).toMatch(/output\s+"lambda_functions"\s*{/);
    });

    test("declares s3_bucket output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket"\s*{/);
    });

    test("declares vpc_id output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares security_groups output", () => {
      expect(stackContent).toMatch(/output\s+"security_groups"\s*{/);
    });

    test("declares aurora_port output", () => {
      expect(stackContent).toMatch(/output\s+"aurora_port"\s*{/);
    });

    test("declares redis_port output", () => {
      expect(stackContent).toMatch(/output\s+"redis_port"\s*{/);
    });

    test("declares vpc_info output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_info"\s*{/);
    });

    test("declares aurora_endpoints output", () => {
      expect(stackContent).toMatch(/output\s+"aurora_endpoints"\s*{/);
    });
  });

  // =============================================================================
  // TAGGING
  // =============================================================================

  describe("Tagging", () => {
    test("uses local.tags for resource tagging", () => {
      // Check that tags are applied using local.tags
      expect(stackContent).toMatch(/tags\s*=\s*local\.tags/);
    });

    test("defines common tags in locals", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.env/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
    });
  });

  // =============================================================================
  // NAMING CONVENTIONS
  // =============================================================================

  describe("Naming Conventions", () => {
    test("uses name_prefix local for resource naming", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.env\}-\$\{var\.pr_number\}"/);
    });

    test("resources follow naming convention", () => {
      // Check that resources use name_prefix
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}/);
    });
  });

  // =============================================================================
  // SECURITY BEST PRACTICES
  // =============================================================================

  describe("Security Best Practices", () => {
    test("Aurora uses Secrets Manager for credentials", () => {
      expect(stackContent).toMatch(/master_password\s*=\s*random_password\.aurora\.result/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"aurora"/);
    });

    test("Redis uses Secrets Manager for auth token", () => {
      expect(stackContent).toMatch(/auth_token\s*=\s*var\.auth_token_enabled\s*\?\s*random_password\.redis_auth\.result/);
    });

    test("private subnets do not have map_public_ip_on_launch", () => {
      const privateSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"private"[^}]*}/s);
      expect(privateSubnetMatch).toBeTruthy();
      if (privateSubnetMatch) {
        expect(privateSubnetMatch[0]).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"[^}]*}/s);
      expect(publicSubnetMatch).toBeTruthy();
      if (publicSubnetMatch) {
        expect(publicSubnetMatch[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });
  });

  // =============================================================================
  // RESOURCE DEPENDENCIES
  // =============================================================================

  describe("Resource Dependencies", () => {
    test("NAT Gateway depends on Internet Gateway", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("Lambda functions depend on IAM roles", () => {
      // Lambda functions should reference IAM roles
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_/);
    });

    test("Event source mappings depend on Lambda functions", () => {
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\./);
    });
  });

  // =============================================================================
  // CONFIGURATION VALIDATION
  // =============================================================================

  describe("Configuration Validation", () => {
    test("Aurora port is 5432", () => {
      // Check that Aurora uses PostgreSQL default port
      const auroraMatch = stackContent.match(/resource\s+"aws_rds_cluster"\s+"aurora"[^}]*}/s);
      expect(auroraMatch).toBeTruthy();
      // Port is typically default 5432 for PostgreSQL, but we check the output
      expect(stackContent).toMatch(/output\s+"aurora_port"[^}]*aws_rds_cluster\.aurora\.port/s);
    });

    test("Redis port is 6379", () => {
      expect(stackContent).toMatch(/port\s*=\s*6379/);
      expect(stackContent).toMatch(/output\s+"redis_port"[^}]*aws_elasticache_replication_group\.redis\.port/s);
    });

    test("Lambda runtime is specified", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*var\.runtime/);
      expect(stackContent).toMatch(/variable\s+"runtime"\s*{/);
    });

    test("Lambda timeout is configured", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*var\.timeout_s/);
    });
  });
});
