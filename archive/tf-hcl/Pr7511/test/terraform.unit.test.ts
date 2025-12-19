import fs from 'fs';
import path from 'path';

describe('Fraud Detection Terraform Configuration - Unit Tests', () => {
  // Paths
  const libPath = path.join(__dirname, '..', 'lib');
  const tapstackPath = path.join(libPath, 'tapstack.tf');
  const variablesPath = path.join(libPath, 'variables.tf');

  // File Contents
  let tapstackTf: string;
  let variablesTf: string;

  beforeAll(() => {
    // Load Terraform files
    tapstackTf = fs.readFileSync(tapstackPath, 'utf8');
    variablesTf = fs.existsSync(variablesPath)
      ? fs.readFileSync(variablesPath, 'utf8')
      : '';
  });

  // ---------------------------------------------------------------------------
  // 1. PROVIDER CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('Provider Configuration', () => {
    test('Terraform version is >= 1.5.0', () => {
      expect(tapstackTf).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('AWS provider is configured with version ~> 5.0', () => {
      expect(tapstackTf).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(tapstackTf).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('Archive provider is configured', () => {
      expect(tapstackTf).toMatch(/source\s*=\s*"hashicorp\/archive"/);
      expect(tapstackTf).toMatch(/version\s*=\s*"~>\s*2\.4"/);
    });

    test('Random provider is configured', () => {
      expect(tapstackTf).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(tapstackTf).toMatch(/version\s*=\s*"~>\s*3\.5"/);
    });

    test('Null provider is configured', () => {
      expect(tapstackTf).toMatch(/source\s*=\s*"hashicorp\/null"/);
      expect(tapstackTf).toMatch(/version\s*=\s*"~>\s*3\.2"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. VARIABLES
  // ---------------------------------------------------------------------------
  describe('Variables Configuration', () => {
    test('env variable exists with validation', () => {
      expect(tapstackTf).toMatch(/variable\s+"env"\s*{/);
      expect(tapstackTf).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\],\s*var\.env\)/);
    });

    test('aws_region variable exists with default', () => {
      expect(tapstackTf).toMatch(/variable\s+"aws_region"\s*{/);
      expect(tapstackTf).toMatch(/default\s*=\s*"us-west-1"/);
    });

    test('project_name variable exists', () => {
      expect(tapstackTf).toMatch(/variable\s+"project_name"\s*{/);
      expect(tapstackTf).toMatch(/default\s*=\s*"fraud-detection"/);
    });

    test('pr_number variable exists', () => {
      expect(tapstackTf).toMatch(/variable\s+"pr_number"\s*{/);
    });

    test('VPC CIDR variables exist', () => {
      expect(tapstackTf).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    });

    test('Kinesis variables exist', () => {
      expect(tapstackTf).toMatch(/variable\s+"kinesis_stream_name"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"kinesis_stream_mode"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"kinesis_retention_hours"\s*{/);
    });

    test('DynamoDB variables exist', () => {
      expect(tapstackTf).toMatch(/variable\s+"dynamodb_table_name"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"dynamodb_billing_mode"\s*{/);
    });

    test('Lambda variables exist', () => {
      expect(tapstackTf).toMatch(/variable\s+"lambda_runtime"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"fraud_scorer_memory"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"fraud_scorer_timeout"\s*{/);
    });

    test('Aurora variables exist', () => {
      expect(tapstackTf).toMatch(/variable\s+"aurora_engine"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"aurora_instance_class"\s*{/);
    });

    test('Redis variables exist', () => {
      expect(tapstackTf).toMatch(/variable\s+"redis_node_type"\s*{/);
      expect(tapstackTf).toMatch(/variable\s+"redis_num_cache_clusters"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. LOCALS
  // ---------------------------------------------------------------------------
  describe('Locals Configuration', () => {
    test('resource_prefix local is defined', () => {
      expect(tapstackTf).toMatch(/resource_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.env\}-\$\{var\.pr_number\}"/);
    });

    test('tags local merges common_tags with default tags', () => {
      expect(tapstackTf).toMatch(/tags\s*=\s*merge\(/);
      expect(tapstackTf).toMatch(/Environment\s*=\s*var\.env/);
      expect(tapstackTf).toMatch(/Project\s*=\s*var\.project_name/);
      expect(tapstackTf).toMatch(/PRNumber\s*=\s*var\.pr_number/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. DATA SOURCES
  // ---------------------------------------------------------------------------
  describe('Data Sources', () => {
    test('aws_caller_identity data source exists', () => {
      expect(tapstackTf).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test('aws_availability_zones data source exists', () => {
      expect(tapstackTf).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(tapstackTf).toMatch(/state\s*=\s*"available"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. NETWORKING
  // ---------------------------------------------------------------------------
  describe('Networking Configuration', () => {
    test('VPC is created with DNS support', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(tapstackTf).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapstackTf).toMatch(/enable_dns_support\s*=\s*true/);
      expect(tapstackTf).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('Public subnets are created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(tapstackTf).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('Private subnets are created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test('Internet Gateway is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(tapstackTf).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('NAT Gateway is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test('Route tables are configured', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(tapstackTf).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('Route table associations exist', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });

    test('Network ACLs are configured', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_network_acl"\s+"public"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_network_acl"\s+"private"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. SECURITY GROUPS
  // ---------------------------------------------------------------------------
  describe('Security Groups Configuration', () => {
    test('Lambda security group exists', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
      expect(tapstackTf).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('Redis security group exists with ingress from Lambda', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*{/);
      expect(tapstackTf).toMatch(/from_port\s*=\s*6379/);
      expect(tapstackTf).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test('Aurora security group exists with ingress from Lambda', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
      expect(tapstackTf).toMatch(/from_port\s*=\s*5432/);
      expect(tapstackTf).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. VPC ENDPOINTS
  // ---------------------------------------------------------------------------
  describe('VPC Endpoints Configuration', () => {
    test('DynamoDB VPC endpoint is conditional and uses Interface type', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*var\.enable_vpc_endpoints\s*\?\s*1\s*:\s*0/);
      expect(tapstackTf).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.dynamodb"/);
      expect(tapstackTf).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    });

    test('Kinesis VPC endpoint is conditional', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kinesis"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*var\.enable_vpc_endpoints\s*\?\s*1\s*:\s*0/);
      expect(tapstackTf).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    });

    test('SageMaker VPC endpoint is conditional', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sagemaker"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*var\.enable_vpc_endpoints\s*\?\s*1\s*:\s*0/);
      expect(tapstackTf).toMatch(/service_name.*sagemaker-runtime/);
    });

    test('SNS VPC endpoint is conditional', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sns"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*var\.enable_vpc_endpoints\s*\?\s*1\s*:\s*0/);
    });

    test('SQS VPC endpoint is conditional', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"\s*{/);
      expect(tapstackTf).toMatch(/count\s*=\s*var\.enable_vpc_endpoints\s*\?\s*1\s*:\s*0/);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. KINESIS
  // ---------------------------------------------------------------------------
  describe('Kinesis Configuration', () => {
    test('Kinesis stream is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_kinesis_stream"\s+"fraud_transactions"\s*{/);
      expect(tapstackTf).toMatch(/retention_period\s*=\s*var\.kinesis_retention_hours/);
    });

    test('Kinesis stream has encryption enabled', () => {
      expect(tapstackTf).toMatch(/encryption_type\s*=\s*"KMS"/);
      expect(tapstackTf).toMatch(/kms_key_id\s*=\s*"alias\/aws\/kinesis"/);
    });

    test('Kinesis stream mode is configurable', () => {
      expect(tapstackTf).toMatch(/stream_mode\s*=\s*var\.kinesis_stream_mode/);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. DYNAMODB
  // ---------------------------------------------------------------------------
  describe('DynamoDB Configuration', () => {
    test('DynamoDB table is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_dynamodb_table"\s+"fraud_scores"\s*{/);
      expect(tapstackTf).toMatch(/hash_key\s*=\s*"transaction_id"/);
      expect(tapstackTf).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test('DynamoDB table has encryption enabled', () => {
      expect(tapstackTf).toMatch(/server_side_encryption\s*{/);
      expect(tapstackTf).toMatch(/enabled\s*=\s*true/);
    });

    test('DynamoDB table has streams enabled', () => {
      expect(tapstackTf).toMatch(/stream_enabled\s*=\s*true/);
      expect(tapstackTf).toMatch(/stream_view_type\s*=\s*var\.dynamodb_stream_view_type/);
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      expect(tapstackTf).toMatch(/point_in_time_recovery\s*{/);
      expect(tapstackTf).toMatch(/enabled\s*=\s*true/);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. S3 BUCKETS
  // ---------------------------------------------------------------------------
  describe('S3 Configuration', () => {
    test('Evidence S3 bucket is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket"\s+"evidence"\s*{/);
    });

    test('Evidence bucket has versioning enabled', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"evidence"\s*{/);
    });

    test('Evidence bucket has encryption enabled', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"evidence"\s*{/);
    });

    test('Evidence bucket has lifecycle configuration', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"evidence"\s*{/);
    });

    test('Evidence bucket has public access block', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"evidence"\s*{/);
    });

    test('Athena results bucket is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. ELASTICACHE REDIS
  // ---------------------------------------------------------------------------
  describe('ElastiCache Redis Configuration', () => {
    test('ElastiCache subnet group is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*{/);
    });

    test('Redis replication group is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
      expect(tapstackTf).toMatch(/node_type\s*=\s*var\.redis_node_type/);
    });

    test('Redis has automatic failover enabled', () => {
      expect(tapstackTf).toMatch(/automatic_failover_enabled\s*=/);
      // Automatic failover is conditional based on number of cache clusters
      expect(tapstackTf).toMatch(/var\.redis_num_cache_clusters\s*>=\s*2\s*\?\s*var\.redis_automatic_failover_enabled/);
    });

    test('Redis uses security group', () => {
      expect(tapstackTf).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.redis\.id\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 12. AURORA
  // ---------------------------------------------------------------------------
  describe('Aurora Configuration', () => {
    test('Aurora cluster is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
      expect(tapstackTf).toMatch(/engine\s*=\s*var\.aurora_engine/);
    });

    test('Aurora cluster instance is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*{/);
      expect(tapstackTf).toMatch(/instance_class\s*=\s*var\.aurora_instance_class/);
    });

    test('Aurora uses secrets manager for credentials', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_credentials"\s*{/);
      expect(tapstackTf).toMatch(/master_username\s*=\s*var\.aurora_master_username/);
    });

    test('Aurora has encryption enabled', () => {
      expect(tapstackTf).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('Aurora KMS key is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_kms_key"\s+"aurora"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_kms_alias"\s+"aurora"\s*{/);
    });

    test('Aurora uses subnet group', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*{/);
    });

    test('Aurora final snapshot identifier is deterministic', () => {
      expect(tapstackTf).toMatch(/final_snapshot_identifier\s*=\s*var\.env\s*!=\s*"dev"\s*\?\s*"\$\{local\.resource_prefix\}-aurora-final-snapshot"\s*:\s*null/);
      // Should NOT use timestamp() for deterministic naming
      expect(tapstackTf).not.toMatch(/final_snapshot_identifier.*timestamp\(\)/);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. SNS/SQS
  // ---------------------------------------------------------------------------
  describe('SNS/SQS Configuration', () => {
    test('SNS fraud alerts topic is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sns_topic"\s+"fraud_alerts"\s*{/);
    });

    test('SNS compliance alerts topic is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sns_topic"\s+"compliance_alerts"\s*{/);
    });

    test('SQS compliance queue is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sqs_queue"\s+"compliance_notifications"\s*{/);
    });

    test('SQS DLQ is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sqs_queue"\s+"compliance_notifications_dlq"\s*{/);
    });

    test('SNS to SQS subscription exists', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"compliance_to_sqs"\s*{/);
    });

    test('SQS queue policy exists', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"compliance_notifications"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. IAM ROLES
  // ---------------------------------------------------------------------------
  describe('IAM Roles Configuration', () => {
    test('Lambda execution role is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*{/);
      expect(tapstackTf).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test('Lambda execution role has policy', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_execution"\s*{/);
    });

    test('Lambda VPC execution role attachment exists', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_vpc_execution"\s*{/);
      expect(tapstackTf).toMatch(/AWSLambdaVPCAccessExecutionRole/);
    });

    test('Step Functions role is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"\s*{/);
      expect(tapstackTf).toMatch(/Service\s*=\s*"states\.amazonaws\.com"/);
    });

    test('EventBridge role is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"\s*{/);
    });

    test('Aurora monitoring role is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_iam_role"\s+"aurora_monitoring"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 15. LAMBDA FUNCTIONS
  // ---------------------------------------------------------------------------
  describe('Lambda Functions Configuration', () => {
    test('Fraud scorer Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"fraud_scorer"\s*{/);
      expect(tapstackTf).toMatch(/runtime\s*=\s*var\.lambda_runtime/);
      expect(tapstackTf).toMatch(/memory_size\s*=\s*var\.fraud_scorer_memory/);
      expect(tapstackTf).toMatch(/timeout\s*=\s*var\.fraud_scorer_timeout/);
    });

    test('Analyzer Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"analyzer"\s*{/);
    });

    test('Aurora updater Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"aurora_updater"\s*{/);
    });

    test('Query history Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"query_history"\s*{/);
    });

    test('Athena query Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"athena_query"\s*{/);
    });

    test('Write evidence Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"write_evidence"\s*{/);
    });

    test('Reconciliation Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"reconciliation"\s*{/);
    });

    test('Secret rotation Lambda is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_function"\s+"secret_rotation"\s*{/);
    });

    test('Lambda functions use VPC configuration', () => {
      expect(tapstackTf).toMatch(/vpc_config\s*{/);
      expect(tapstackTf).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(tapstackTf).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test('Lambda event source mappings exist', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_fraud_scorer"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_analyzer"\s*{/);
    });

    test('Lambda archive files are created', () => {
      expect(tapstackTf).toMatch(/data\s+"archive_file"\s+"fraud_scorer"\s*{/);
      expect(tapstackTf).toMatch(/data\s+"archive_file"\s+"analyzer"\s*{/);
    });

    test('Lambda layer is built using null_resource', () => {
      expect(tapstackTf).toMatch(/resource\s+"null_resource"\s+"lambda_layer_builder"\s*{/);
      expect(tapstackTf).toMatch(/provisioner\s+"local-exec"\s*{/);
    });

    test('Lambda layer version uses dependencies layer', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_lambda_layer_version"\s+"dependencies"\s*{/);
      expect(tapstackTf).toMatch(/filename\s*=\s*"\/tmp\/dependencies_layer\.zip"/);
      expect(tapstackTf).toMatch(/depends_on\s*=\s*\[null_resource\.lambda_layer_builder\]/);
    });

    test('Lambda functions use dependencies layer', () => {
      expect(tapstackTf).toMatch(/layers\s*=\s*\[aws_lambda_layer_version\.dependencies\.arn\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 16. STEP FUNCTIONS
  // ---------------------------------------------------------------------------
  describe('Step Functions Configuration', () => {
    test('Step Functions state machine is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_sfn_state_machine"\s+"fraud_investigation"\s*{/);
      expect(tapstackTf).toMatch(/role_arn\s*=\s*aws_iam_role\.step_functions\.arn/);
    });
  });

  // ---------------------------------------------------------------------------
  // 17. EVENTBRIDGE
  // ---------------------------------------------------------------------------
  describe('EventBridge Configuration', () => {
    test('EventBridge rule is created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"fraud_rate_threshold"\s*{/);
    });

    test('EventBridge target is configured', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"step_functions"\s*{/);
    });

    test('CloudWatch log metric filter exists', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"fraud_detection_rate"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 18. CLOUDWATCH
  // ---------------------------------------------------------------------------
  describe('CloudWatch Configuration', () => {
    test('CloudWatch log groups are created for Lambda functions', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"fraud_scorer"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"analyzer"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"aurora_updater"\s*{/);
    });

    test('CloudWatch alarms are created', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_throttling"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttle"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 19. TAGGING
  // ---------------------------------------------------------------------------
  describe('Tagging Configuration', () => {
    test('Resources include common tags', () => {
      expect(tapstackTf).toMatch(/tags\s*=\s*merge\(local\.tags/);
    });

    test('Resources have Name tags', () => {
      expect(tapstackTf).toMatch(/Name\s*=\s*"\$\{local\.resource_prefix\}/);
    });

    test('Resources include PRNumber tag', () => {
      expect(tapstackTf).toMatch(/PRNumber\s*=\s*var\.pr_number/);
    });
  });

  // ---------------------------------------------------------------------------
  // 20. OUTPUTS
  // ---------------------------------------------------------------------------
  describe('Outputs Configuration', () => {
    test('Kinesis stream ARN output exists', () => {
      expect(tapstackTf).toMatch(/output\s+"kinesis_stream_arn"\s*{/);
    });

    test('DynamoDB table name output exists', () => {
      expect(tapstackTf).toMatch(/output\s+"dynamodb_table_name"\s*{/);
    });

    test('SNS topic ARNs are exported', () => {
      expect(tapstackTf).toMatch(/output\s+"sns_fraud_alerts_arn"\s*{/);
      expect(tapstackTf).toMatch(/output\s+"sns_compliance_alerts_arn"\s*{/);
    });

    test('SQS queue URL output exists', () => {
      expect(tapstackTf).toMatch(/output\s+"sqs_compliance_queue_url"\s*{/);
    });

    test('Aurora endpoints are exported', () => {
      expect(tapstackTf).toMatch(/output\s+"aurora_cluster_endpoint"\s*{/);
      expect(tapstackTf).toMatch(/output\s+"aurora_reader_endpoint"\s*{/);
    });

    test('Redis endpoint is exported', () => {
      expect(tapstackTf).toMatch(/output\s+"redis_endpoint"\s*{/);
    });

    test('Lambda function ARNs are exported', () => {
      expect(tapstackTf).toMatch(/output\s+"lambda_fraud_scorer_arn"\s*{/);
      expect(tapstackTf).toMatch(/output\s+"lambda_analyzer_arn"\s*{/);
    });

    test('Step Functions ARN is exported', () => {
      expect(tapstackTf).toMatch(/output\s+"step_functions_arn"\s*{/);
    });

    test('S3 bucket names are exported', () => {
      expect(tapstackTf).toMatch(/output\s+"s3_evidence_bucket"\s*{/);
      expect(tapstackTf).toMatch(/output\s+"s3_athena_results_bucket"\s*{/);
    });

    test('VPC and subnet IDs are exported', () => {
      expect(tapstackTf).toMatch(/output\s+"vpc_id"\s*{/);
      expect(tapstackTf).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(tapstackTf).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 21. SECURITY CHECKS
  // ---------------------------------------------------------------------------
  describe('Security Configuration', () => {
    test('S3 buckets have public access blocked', () => {
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"evidence"\s*{/);
      expect(tapstackTf).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"athena_results"\s*{/);
    });

    test('DynamoDB has encryption enabled', () => {
      expect(tapstackTf).toMatch(/server_side_encryption\s*{/);
    });

    test('Kinesis has encryption enabled', () => {
      expect(tapstackTf).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test('Aurora has encryption enabled', () => {
      expect(tapstackTf).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('Security groups restrict ingress appropriately', () => {
      // Redis only allows Lambda
      expect(tapstackTf).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
      // Aurora only allows Lambda
      expect(tapstackTf).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });
  });
});
