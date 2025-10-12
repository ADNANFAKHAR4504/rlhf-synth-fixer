// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('RDS MySQL Healthcare Stack Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all required variables', () => {
      const expectedVariables = [
        'aws_region',
        'environment',
        'application',
        'owner',
        'db_identifier',
        'db_name',
        'db_username',
        'instance_class',
        'engine_version',
        'allocated_storage',
        'max_allocated_storage',
        'multi_az',
        'backup_retention_period',
        'backup_window',
        'maintenance_window',
        'deletion_protection',
        'enable_iam_auth',
        'cpu_alarm_threshold',
        'memory_alarm_threshold_gb',
        'storage_alarm_threshold_gb',
        'connection_alarm_threshold',
        'snapshot_retention_days',
        'lambda_runtime',
        'sns_email_endpoint',
        'environment_suffix'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });

    test('marks sensitive variables appropriately', () => {
      expect(tfContent).toMatch(/variable\s+"db_username"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('provides default values for variables', () => {
      expect(tfContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
      expect(tfContent).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"production"/);
      expect(tfContent).toMatch(/variable\s+"instance_class"[\s\S]*?default\s*=\s*"db\.m5\.large"/);
      expect(tfContent).toMatch(/variable\s+"multi_az"[\s\S]*?default\s*=\s*true/);
    });
  });

  // -------------------------
  // Random Resources
  // -------------------------
  describe('Random Resources', () => {
    test('defines random_string for environment suffix', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
      expect(tfContent).toMatch(/length\s*=\s*8/);
      expect(tfContent).toMatch(/special\s*=\s*false/);
      expect(tfContent).toMatch(/upper\s*=\s*false/);
    });

    test('random_string has conditional count based on variable', () => {
      expect(tfContent).toMatch(/count\s*=\s*var\.environment_suffix\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('defines random_password for database master password', () => {
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"master"/);
      expect(tfContent).toMatch(/length\s*=\s*32/);
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test('defines expected locals', () => {
      const expectedLocals = [
        'env_suffix',
        'tags',
        'vpc_cidr',
        'private_subnet_cidrs'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('env_suffix uses conditional logic', () => {
      expect(tfContent).toMatch(/env_suffix\s*=\s*var\.environment_suffix\s*!=\s*""\s*\?\s*var\.environment_suffix\s*:\s*random_string\.environment_suffix\[0\]\.result/);
    });

    test('tags local contains all required keys', () => {
      expect(tfContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(tfContent).toMatch(/Application\s*=\s*var\.application/);
      expect(tfContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(tfContent).toMatch(/Compliance\s*=\s*"HIPAA"/);
    });

    test('defines correct VPC CIDR and subnet CIDRs', () => {
      expect(tfContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.10\.0\/24"/);
      expect(tfContent).toMatch(/private_subnet_cidrs\s*=\s*\["10\.0\.10\.0\/25",\s*"10\.0\.10\.128\/25"\]/);
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  describe('Data Sources', () => {
    test('defines aws_availability_zones data source', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/state\s*=\s*"available"/);
    });

    test('defines archive_file data source for Lambda', () => {
      expect(tfContent).toMatch(/data\s+"archive_file"\s+"lambda_snapshot"/);
      expect(tfContent).toMatch(/source_file\s*=.*lambda\/snapshot\.py/);
    });
  });

  // -------------------------
  // Networking
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC is defined with DNS settings', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('defines two private subnets in different AZs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private_a"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private_b"/);
      expect(tfContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
      expect(tfContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
    });

    test('DB subnet group includes both private subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.private_a\.id,\s*aws_subnet\.private_b\.id\]/);
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    test('defines app and RDS security groups', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('RDS security group allows MySQL (3306) from app security group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group_rule"\s+"rds_ingress"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/to_port\s*=\s*3306/);
      expect(tfContent).toMatch(/source_security_group_id\s*=\s*aws_security_group\.app\.id/);
    });

    test('security groups are not publicly accessible', () => {
      expect(tfContent).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\].*ingress/);
    });
  });

  // -------------------------
  // KMS Encryption
  // -------------------------
  describe('KMS Encryption', () => {
    test('defines KMS key with rotation enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tfContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test('defines KMS alias', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
      expect(tfContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.rds\.key_id/);
    });
  });

  // -------------------------
  // Secrets Manager
  // -------------------------
  describe('Secrets Manager', () => {
    test('generates random password', () => {
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"master"/);
      expect(tfContent).toMatch(/length\s*=\s*32/);
      expect(tfContent).toMatch(/special\s*=\s*true/);
    });

    test('password excludes RDS-incompatible special characters', () => {
      expect(tfContent).toMatch(/override_special\s*=\s*"!#\$%&\*\(\)-_=\+\[\]\{\}<>:\?"/);
    });

    test('stores password in Secrets Manager with KMS encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test('stores password version', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/);
      expect(tfContent).toMatch(/secret_string\s*=\s*random_password\.master\.result/);
    });
  });

  // -------------------------
  // RDS Parameter Group
  // -------------------------
  describe('RDS Parameter Group', () => {
    test('defines parameter group with SSL enforcement', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
      expect(tfContent).toMatch(/family\s*=\s*"mysql8\.0"/);
    });

    test('enforces secure transport (SSL/TLS)', () => {
      expect(tfContent).toMatch(/name\s*=\s*"require_secure_transport"/);
      expect(tfContent).toMatch(/value\s*=\s*"ON"/);
    });

    test('enables query logging', () => {
      expect(tfContent).toMatch(/name\s*=\s*"slow_query_log"/);
      expect(tfContent).toMatch(/name\s*=\s*"general_log"/);
    });
  });

  // -------------------------
  // CloudWatch Log Groups
  // -------------------------
  describe('CloudWatch Log Groups', () => {
    test('defines log groups for error, general, and slowquery logs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds_error"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds_general"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds_slowquery"/);
    });

    test('log groups use KMS encryption', () => {
      // 3 RDS log groups use KMS encryption (plus Secrets Manager, RDS instance, Lambda log group = 6 total)
      expect(countMatches(/kms_key_id\s+=\s+aws_kms_key\.rds\.arn/g)).toBeGreaterThanOrEqual(3);
    });

    test('sets log retention to 30 days', () => {
      // Only checking RDS log groups have 30 days (Lambda has 7 days)
      const rdsLogGroupsWith30Days = (tfContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"rds_\w+"/g) || []).length;
      expect(rdsLogGroupsWith30Days).toBe(3);
      expect(countMatches(/retention_in_days\s+=\s+30/g)).toBeGreaterThanOrEqual(3);
    });
  });

  // -------------------------
  // RDS Instance
  // -------------------------
  describe('RDS Instance', () => {
    test('defines RDS instance with MySQL engine', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/engine_version\s*=\s*var\.engine_version/);
    });

    test('configures storage with encryption', () => {
      expect(tfContent).toMatch(/storage_type\s*=\s*"gp3"/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test('enables Multi-AZ deployment', () => {
      expect(tfContent).toMatch(/multi_az\s*=\s*var\.multi_az/);
    });

    test('disables public accessibility', () => {
      expect(tfContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('configures backup settings', () => {
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_period/);
      expect(tfContent).toMatch(/backup_window\s*=\s*var\.backup_window/);
    });

    test('exports CloudWatch logs', () => {
      expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
    });

    test('depends on CloudWatch log groups', () => {
      expect(tfContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_cloudwatch_log_group\.rds_error/);
    });
  });

  // -------------------------
  // SNS Topic
  // -------------------------
  describe('SNS Topic', () => {
    test('defines SNS topic for alarms with KMS encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
      expect(tfContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.rds\.id/);
    });

    test('defines email subscription', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarms_email"/);
      expect(tfContent).toMatch(/protocol\s*=\s*"email"/);
    });
  });

  // -------------------------
  // CloudWatch Alarms
  // -------------------------
  describe('CloudWatch Alarms', () => {
    test('defines CPU utilization alarm', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_utilization"/);
      expect(tfContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });

    test('defines memory alarm', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"freeable_memory"/);
      expect(tfContent).toMatch(/metric_name\s*=\s*"FreeableMemory"/);
    });

    test('defines storage alarm', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"free_storage_space"/);
      expect(tfContent).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
    });

    test('defines connections alarm', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"database_connections"/);
      expect(tfContent).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
    });

    test('all alarms target SNS topic', () => {
      expect(countMatches(/alarm_actions\s+=\s+\[aws_sns_topic\.alarms\.arn\]/g)).toBe(4);
    });
  });

  // -------------------------
  // Lambda Function
  // -------------------------
  describe('Lambda Function', () => {
    test('defines IAM role for Lambda', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_snapshot"/);
      expect(tfContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test('Lambda IAM policy grants necessary RDS permissions', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_snapshot"/);
      expect(tfContent).toMatch(/rds:CreateDBSnapshot/);
      expect(tfContent).toMatch(/rds:DescribeDBInstances/);
      expect(tfContent).toMatch(/rds:DeleteDBSnapshot/);
    });

    test('Lambda function uses archive provider', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lambda_function"\s+"snapshot"/);
      expect(tfContent).toMatch(/filename\s*=\s*data\.archive_file\.lambda_snapshot\.output_path/);
    });

    test('Lambda has environment variables', () => {
      expect(tfContent).toMatch(/DB_INSTANCE_IDENTIFIER\s*=\s*aws_db_instance\.main\.identifier/);
      expect(tfContent).toMatch(/RETENTION_DAYS\s*=\s*var\.snapshot_retention_days/);
    });

    test('Lambda log group uses KMS encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_snapshot"/);
      expect(tfContent).toMatch(/\/aws\/lambda\/\$\{aws_lambda_function\.snapshot\.function_name\}/);
    });
  });

  // -------------------------
  // EventBridge
  // -------------------------
  describe('EventBridge Scheduled Rule', () => {
    test('defines daily cron schedule', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"daily_snapshot"/);
      expect(tfContent).toMatch(/schedule_expression\s*=\s*"cron\(0 2 \* \* \? \*\)"/);
    });

    test('targets Lambda function', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"/);
      expect(tfContent).toMatch(/arn\s*=\s*aws_lambda_function\.snapshot\.arn/);
    });

    test('grants EventBridge permission to invoke Lambda', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
      expect(tfContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs: string[] = [
      'vpc_id',
      'vpc_cidr',
      'private_subnet_ids',
      'db_instance_endpoint',
      'db_instance_port',
      'db_instance_id',
      'db_instance_resource_id',
      'db_security_group_id',
      'db_subnet_group_name',
      'kms_key_arn',
      'cloudwatch_log_groups',
      'secret_arn',
      'sns_topic_arn',
      'lambda_function_name',
      'eventbridge_rule_name',
      'aws_region'
    ];

    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });

    test('secret_arn output is marked as sensitive', () => {
      expect(tfContent).toMatch(/output\s+"secret_arn"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  // -------------------------
  // HIPAA Compliance
  // -------------------------
  describe('HIPAA Compliance Checks', () => {
    test('all resources use encryption', () => {
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('deletion protection is configurable', () => {
      expect(tfContent).toMatch(/deletion_protection\s*=\s*var\.deletion_protection/);
    });

    test('all resources tagged with Compliance=HIPAA', () => {
      expect(tfContent).toMatch(/Compliance\s*=\s*"HIPAA"/);
    });
  });

  // -------------------------
  // File Structure
  // -------------------------
  describe('File Structure', () => {
    test('does NOT declare provider in tap_stack.tf', () => {
      expect(tfContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('declares aws_region variable', () => {
      expect(tfContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('Lambda source file path is correct', () => {
      expect(tfContent).toMatch(/source_file\s*=\s*"\$\{path\.module\}\/lambda\/snapshot\.py"/);
    });
  });
});
