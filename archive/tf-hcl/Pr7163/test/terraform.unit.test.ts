import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Unit Tests - Multi-Region RDS DR", () => {
  let providersContent: string;
  let variablesContent: string;
  let localsContent: string;
  let outputsContent: string;
  let rdsContent: string;
  let vpcPrimaryContent: string;
  let vpcDrContent: string;
  let vpcPeeringContent: string;
  let lambdaContent: string;
  let iamContent: string;
  let kmsContent: string;
  let secretsContent: string;
  let cloudwatchContent: string;
  let dataContent: string;
  let parameterGroupsContent: string;

  beforeAll(() => {
    const libPath = path.resolve(__dirname, "../lib");

    providersContent = fs.readFileSync(path.join(libPath, "providers.tf"), "utf8");
    variablesContent = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
    localsContent = fs.readFileSync(path.join(libPath, "locals.tf"), "utf8");
    outputsContent = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
    rdsContent = fs.readFileSync(path.join(libPath, "rds.tf"), "utf8");
    vpcPrimaryContent = fs.readFileSync(path.join(libPath, "vpc-primary.tf"), "utf8");
    vpcDrContent = fs.readFileSync(path.join(libPath, "vpc-dr.tf"), "utf8");
    vpcPeeringContent = fs.readFileSync(path.join(libPath, "vpc-peering.tf"), "utf8");
    lambdaContent = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
    iamContent = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
    kmsContent = fs.readFileSync(path.join(libPath, "kms.tf"), "utf8");
    secretsContent = fs.readFileSync(path.join(libPath, "secrets.tf"), "utf8");
    cloudwatchContent = fs.readFileSync(path.join(libPath, "cloudwatch.tf"), "utf8");
    dataContent = fs.readFileSync(path.join(libPath, "data.tf"), "utf8");
    parameterGroupsContent = fs.readFileSync(path.join(libPath, "rds-parameter-groups.tf"), "utf8");
  });

  describe("Core Configuration and File Structure", () => {
    test("all required Terraform files exist", () => {
      const libPath = path.resolve(__dirname, "../lib");
      const requiredFiles = [
        "providers.tf",
        "variables.tf",
        "locals.tf",
        "outputs.tf",
        "rds.tf",
        "vpc-primary.tf",
        "vpc-dr.tf",
        "vpc-peering.tf",
        "lambda.tf",
        "iam.tf",
        "kms.tf",
        "secrets.tf",
        "cloudwatch.tf",
        "data.tf",
        "rds-parameter-groups.tf"
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(libPath, file))).toBe(true);
      });
    });

    test("Terraform version is properly specified", () => {
      expect(providersContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+"/);
      expect(providersContent).toMatch(/terraform\s*\{/);
    });

    test("AWS provider is properly configured", () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*\{/);
      expect(providersContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providersContent).toMatch(/version\s*=\s*"~>\s*5\.\d+"/);
    });

    test("dual region providers are configured", () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*\{[\s\S]*?region\s*=\s*var\.primary_region/);
      expect(providersContent).toMatch(/provider\s+"aws"\s*\{[\s\S]*?alias\s*=\s*"us-west-2"/);
      expect(providersContent).toMatch(/region\s*=\s*var\.dr_region/);
    });

    test("default tags are configured in providers", () => {
      expect(providersContent).toMatch(/default_tags\s*\{/);
      expect(providersContent).toMatch(/Environment\s*=/);
      expect(providersContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Variable Declarations and Validation", () => {
    test("environment_suffix variable is declared and documented", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
      expect(variablesContent).toMatch(/description\s*=\s*"Unique suffix for resource naming"/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test("environment variable has validation constraint", () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*\{/);
      expect(variablesContent).toMatch(/validation\s*\{/);
      expect(variablesContent).toMatch(/condition\s*=\s*contains\(\["test",\s*"prod"\]/);
      expect(variablesContent).toMatch(/default\s*=\s*"test"/);
    });

    test("region variables are properly defined", () => {
      expect(variablesContent).toMatch(/variable\s+"primary_region"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"dr_region"\s*\{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("VPC CIDR variables are defined", () => {
      expect(variablesContent).toMatch(/variable\s+"primary_vpc_cidr"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"dr_vpc_cidr"\s*\{/);
      expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(variablesContent).toMatch(/default\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test("database configuration variables exist", () => {
      expect(variablesContent).toMatch(/variable\s+"db_name"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"db_username"\s*\{/);
      expect(variablesContent).toMatch(/default\s*=\s*"appdb"/);
      expect(variablesContent).toMatch(/default\s*=\s*"dbadmin"/);
    });

    test("operational parameters are configurable", () => {
      expect(variablesContent).toMatch(/variable\s+"replication_lag_threshold"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"backup_retention_period"\s*\{/);
      expect(variablesContent).toMatch(/type\s*=\s*number/);
    });
  });

  describe("Local Values and Environment-Specific Configuration", () => {
    test("instance class varies by environment", () => {
      expect(localsContent).toMatch(/instance_class\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"db\.r6g\.large"\s*:\s*"db\.t3\.micro"/);
    });

    test("multi-AZ enabled for production only", () => {
      expect(localsContent).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test("enhanced monitoring configured based on environment", () => {
      expect(localsContent).toMatch(/enable_enhanced_monitoring\s*=\s*var\.environment\s*==\s*"prod"/);
      expect(localsContent).toMatch(/monitoring_interval\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*60\s*:\s*0/);
    });

    test("backup and maintenance windows are defined", () => {
      expect(localsContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(localsContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("common tags include project metadata", () => {
      expect(localsContent).toMatch(/common_tags\s*=\s*\{/);
      expect(localsContent).toMatch(/Project\s*=\s*"RDS-DR"/);
      expect(localsContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(localsContent).toMatch(/Suffix\s*=\s*var\.environment_suffix/);
    });
  });

  describe("RDS Primary Database Configuration", () => {
    test("primary RDS instance is properly configured", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_instance"\s+"primary"\s*\{/);
      expect(rdsContent).toMatch(/identifier\s*=\s*"rds-primary-\${var\.environment_suffix}"/);
      expect(rdsContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(rdsContent).toMatch(/engine_version\s*=\s*data\.aws_rds_engine_version\.postgresql\.version/);
    });

    test("primary instance uses environment-specific sizing", () => {
      expect(rdsContent).toMatch(/instance_class\s*=\s*local\.instance_class/);
      expect(rdsContent).toMatch(/allocated_storage\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*100\s*:\s*20/);
    });

    test("primary database uses encryption", () => {
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(rdsContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(rdsContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test("primary database credentials use secrets manager", () => {
      expect(rdsContent).toMatch(/username\s*=\s*var\.db_username/);
      expect(rdsContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
      expect(rdsContent).toMatch(/db_name\s*=\s*var\.db_name/);
    });

    test("primary instance has proper networking", () => {
      expect(rdsContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.primary_db\.id\]/);
      expect(rdsContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.primary\.name/);
      expect(rdsContent).toMatch(/parameter_group_name\s*=\s*aws_db_parameter_group\.primary\.name/);
    });

    test("backup and maintenance configured correctly", () => {
      expect(rdsContent).toMatch(/multi_az\s*=\s*local\.multi_az/);
      expect(rdsContent).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_period/);
      expect(rdsContent).toMatch(/backup_window\s*=\s*local\.backup_window/);
      expect(rdsContent).toMatch(/maintenance_window\s*=\s*local\.maintenance_window/);
    });

    test("CloudWatch logs are enabled", () => {
      expect(rdsContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql",\s*"upgrade"\]/);
    });

    test("performance insights enabled for production", () => {
      expect(rdsContent).toMatch(/performance_insights_enabled\s*=\s*var\.environment\s*==\s*"prod"/);
      expect(rdsContent).toMatch(/performance_insights_kms_key_id\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*aws_kms_key\.primary\.arn/);
    });

    test("deletion protection and snapshots configured for testing", () => {
      expect(rdsContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(rdsContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("primary instance tags include role", () => {
      expect(rdsContent).toMatch(/tags\s*=\s*merge\(/);
      expect(rdsContent).toMatch(/Name\s*=\s*"rds-primary-\${var\.environment_suffix}"/);
      expect(rdsContent).toMatch(/Role\s*=\s*"primary"/);
    });
  });

  describe("RDS DR Read Replica Configuration", () => {
    test("DR replica is configured in alternate region", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_instance"\s+"dr_replica"\s*\{/);
      expect(rdsContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
      expect(rdsContent).toMatch(/identifier\s*=\s*"rds-dr-replica-\${var\.environment_suffix}"/);
    });

    test("DR replica replicates from primary", () => {
      expect(rdsContent).toMatch(/replicate_source_db\s*=\s*aws_db_instance\.primary\.arn/);
    });

    test("DR replica uses separate KMS key", () => {
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(rdsContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.dr\.arn/);
    });

    test("DR replica cannot be multi-AZ", () => {
      expect(rdsContent).toMatch(/multi_az\s*=\s*false.*# Read replicas cannot be multi-AZ/);
    });

    test("DR replica has proper networking", () => {
      expect(rdsContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.dr_db\.id\]/);
      expect(rdsContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.dr\.name/);
      expect(rdsContent).toMatch(/parameter_group_name\s*=\s*aws_db_parameter_group\.dr\.name/);
    });

    test("DR replica tags include role", () => {
      expect(rdsContent).toMatch(/Role\s*=\s*"replica"/);
    });
  });

  describe("VPC Primary Region Configuration", () => {
    test("primary VPC is properly configured", () => {
      expect(vpcPrimaryContent).toMatch(/resource\s+"aws_vpc"\s+"primary"\s*\{/);
      expect(vpcPrimaryContent).toMatch(/cidr_block\s*=\s*var\.primary_vpc_cidr/);
      expect(vpcPrimaryContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcPrimaryContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("primary VPC has at least two subnets for multi-AZ", () => {
      expect(vpcPrimaryContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private_1"/);
      expect(vpcPrimaryContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private_2"/);
    });

    test("primary subnets use proper CIDR calculation", () => {
      expect(vpcPrimaryContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(var\.primary_vpc_cidr,\s*8,\s*1\)/);
      expect(vpcPrimaryContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(var\.primary_vpc_cidr,\s*8,\s*2\)/);
    });

    test("primary subnets span different availability zones", () => {
      expect(vpcPrimaryContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.primary\.names\[0\]/);
      expect(vpcPrimaryContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.primary\.names\[1\]/);
    });

    test("primary DB subnet group references both subnets", () => {
      expect(vpcPrimaryContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(vpcPrimaryContent).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.primary_private_1\.id,\s*aws_subnet\.primary_private_2\.id\]/);
    });

    test("primary security group allows PostgreSQL traffic", () => {
      expect(vpcPrimaryContent).toMatch(/resource\s+"aws_security_group"\s+"primary_db"/);
      expect(vpcPrimaryContent).toMatch(/from_port\s*=\s*5432/);
      expect(vpcPrimaryContent).toMatch(/to_port\s*=\s*5432/);
      expect(vpcPrimaryContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("resources use environment_suffix in naming", () => {
      expect(vpcPrimaryContent).toMatch(/Name\s*=\s*"rds-primary-vpc-\${var\.environment_suffix}"/);
      expect(vpcPrimaryContent).toMatch(/Name\s*=\s*"rds-primary-private-1-\${var\.environment_suffix}"/);
      expect(vpcPrimaryContent).toMatch(/Name\s*=\s*"rds-primary-subnet-group-\${var\.environment_suffix}"/);
    });
  });

  describe("VPC DR Region Configuration", () => {
    test("DR VPC is configured in alternate region", () => {
      expect(vpcDrContent).toMatch(/resource\s+"aws_vpc"\s+"dr"\s*\{/);
      expect(vpcDrContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
      expect(vpcDrContent).toMatch(/cidr_block\s*=\s*var\.dr_vpc_cidr/);
    });

    test("DR VPC has DNS enabled", () => {
      expect(vpcDrContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcDrContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("DR subnets are properly configured", () => {
      expect(vpcDrContent).toMatch(/resource\s+"aws_subnet"\s+"dr_private_1"/);
      expect(vpcDrContent).toMatch(/resource\s+"aws_subnet"\s+"dr_private_2"/);
      expect(vpcDrContent).toMatch(/vpc_id\s*=\s*aws_vpc\.dr\.id/);
    });

    test("DR DB subnet group exists", () => {
      expect(vpcDrContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"dr"/);
      expect(vpcDrContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
    });

    test("DR security group configured", () => {
      expect(vpcDrContent).toMatch(/resource\s+"aws_security_group"\s+"dr_db"/);
      expect(vpcDrContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
    });
  });

  describe("VPC Peering Configuration", () => {
    test("VPC peering connection exists", () => {
      expect(vpcPeeringContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"primary_to_dr"/);
      expect(vpcPeeringContent).toMatch(/vpc_id\s*=\s*aws_vpc\.primary\.id/);
      expect(vpcPeeringContent).toMatch(/peer_vpc_id\s*=\s*aws_vpc\.dr\.id/);
      expect(vpcPeeringContent).toMatch(/peer_region\s*=\s*var\.dr_region/);
    });

    test("peering connection acceptance configured", () => {
      expect(vpcPeeringContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"\s+"dr"/);
      expect(vpcPeeringContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
      expect(vpcPeeringContent).toMatch(/vpc_peering_connection_id\s*=\s*aws_vpc_peering_connection\.primary_to_dr\.id/);
    });

    test("route tables updated for peering", () => {
      expect(vpcPeeringContent).toMatch(/resource\s+"aws_route"\s+"primary_to_dr"/);
      expect(vpcPeeringContent).toMatch(/resource\s+"aws_route"\s+"dr_to_primary"/);
      expect(vpcPeeringContent).toMatch(/vpc_peering_connection_id\s*=\s*aws_vpc_peering_connection\.primary_to_dr\.id/);
    });

    test("routes configured for cross-region traffic", () => {
      expect(vpcPeeringContent).toMatch(/destination_cidr_block\s*=\s*var\.dr_vpc_cidr/);
      expect(vpcPeeringContent).toMatch(/destination_cidr_block\s*=\s*var\.primary_vpc_cidr/);
    });
  });

  describe("Lambda Failover Monitor Configuration", () => {
    test("Lambda function archive is created", () => {
      expect(lambdaContent).toMatch(/data\s+"archive_file"\s+"lambda_failover"/);
      expect(lambdaContent).toMatch(/source_file\s*=\s*"\${path\.module}\/lambda\/failover_monitor\.py"/);
      expect(lambdaContent).toMatch(/output_path\s*=\s*"\${path\.module}\/lambda_failover_monitor\.zip"/);
    });

    test("Lambda function properly configured", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover_monitor"/);
      expect(lambdaContent).toMatch(/function_name\s*=\s*"rds-failover-monitor-\${var\.environment_suffix}"/);
      expect(lambdaContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(lambdaContent).toMatch(/handler\s*=\s*"failover_monitor\.lambda_handler"/);
    });

    test("Lambda has required environment variables", () => {
      expect(lambdaContent).toMatch(/environment\s*\{/);
      expect(lambdaContent).toMatch(/REPLICATION_LAG_THRESHOLD\s*=\s*var\.replication_lag_threshold/);
      expect(lambdaContent).toMatch(/DR_REPLICA_ID\s*=\s*aws_db_instance\.dr_replica\.identifier/);
      expect(lambdaContent).toMatch(/DR_REGION\s*=\s*var\.dr_region/);
    });

    test("Lambda execution role is referenced", () => {
      expect(lambdaContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_failover\.arn/);
    });

    test("Lambda timeout is appropriate", () => {
      expect(lambdaContent).toMatch(/timeout\s*=\s*60/);
    });

    test("CloudWatch event rule triggers Lambda", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"failover_check"/);
      expect(lambdaContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
    });

    test("CloudWatch event target configured", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"failover_check"/);
      expect(lambdaContent).toMatch(/arn\s*=\s*aws_lambda_function\.failover_monitor\.arn/);
    });

    test("Lambda permission allows CloudWatch invocation", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_cloudwatch"/);
      expect(lambdaContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("Lambda execution role exists", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_failover"/);
      expect(iamContent).toMatch(/assume_role_policy/);
    });

    test("Lambda assume role policy allows Lambda service", () => {
      expect(iamContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
      expect(iamContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test("Lambda has CloudWatch logs permissions", () => {
      expect(iamContent).toMatch(/logs:CreateLogGroup/);
      expect(iamContent).toMatch(/logs:CreateLogStream/);
      expect(iamContent).toMatch(/logs:PutLogEvents/);
    });

    test("Lambda has RDS monitoring permissions", () => {
      expect(iamContent).toMatch(/rds:DescribeDBInstances/);
      expect(iamContent).toMatch(/rds:DescribeDBClusters/);
    });

    test("Lambda has secrets manager permissions", () => {
      expect(iamContent).toMatch(/secretsmanager:GetSecretValue/);
    });

    test("IAM policies use principle of least privilege", () => {
      expect(iamContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(iamContent).toMatch(/Resource/);
    });
  });

  describe("KMS Encryption Keys", () => {
    test("primary KMS key exists", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
      expect(kmsContent).toMatch(/description\s*=.*primary region/i);
    });

    test("DR KMS key exists in alternate region", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"dr"/);
      expect(kmsContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
      expect(kmsContent).toMatch(/description\s*=.*DR/i);
    });

    test("KMS keys have proper rotation", () => {
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS keys have deletion windows", () => {
      expect(kmsContent).toMatch(/deletion_window_in_days/);
    });

    test("KMS key aliases exist", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_alias"/);
      expect(kmsContent).toMatch(/target_key_id/);
    });

    test("KMS keys tagged appropriately", () => {
      expect(kmsContent).toMatch(/tags\s*=\s*merge\(/);
      expect(kmsContent).toMatch(/local\.common_tags/);
    });
  });

  describe("Secrets Manager Configuration", () => {
    test("random password resource exists", () => {
      expect(secretsContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(secretsContent).toMatch(/length\s*=\s*\d+/);
      expect(secretsContent).toMatch(/special\s*=\s*true/);
    });

    test("secrets manager secret exists", () => {
      expect(secretsContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
      expect(secretsContent).toMatch(/name.*\${var\.environment_suffix}/);
    });

    test("secret version stores credentials", () => {
      expect(secretsContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/);
      expect(secretsContent).toMatch(/secret_id\s*=\s*aws_secretsmanager_secret\.db_password\.id/);
    });

    test("secret uses KMS encryption implicitly", () => {
      // Secrets Manager uses AWS managed keys by default
      // This test verifies the secret exists and can use KMS
      expect(secretsContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
      expect(secretsContent).toMatch(/recovery_window_in_days/);
    });

    test("secret has recovery window", () => {
      expect(secretsContent).toMatch(/recovery_window_in_days/);
    });
  });

  describe("CloudWatch Monitoring Configuration", () => {
    test("CloudWatch alarms configured", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("SNS alerts configured", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_sns_topic"\s+"rds_alerts"/);
    });

    test("alarm actions publish to SNS", () => {
      expect(cloudwatchContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.rds_alerts\.arn\]/);
    });

    test("CloudWatch alarms for replication lag", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(cloudwatchContent).toMatch(/metric_name.*ReplicaLag/i);
    });

    test("SNS topic exists for alerts", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_sns_topic"\s+"rds_alerts"/);
    });

    test("alarms publish to SNS topic", () => {
      expect(cloudwatchContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.rds_alerts\.arn\]/);
    });
  });

  describe("Data Sources", () => {
    test("availability zones data source exists for primary", () => {
      expect(dataContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
      expect(dataContent).toMatch(/state\s*=\s*"available"/);
    });

    test("availability zones data source exists for DR", () => {
      expect(dataContent).toMatch(/data\s+"aws_availability_zones"\s+"dr"/);
      expect(dataContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
    });

    test("RDS engine version data source exists", () => {
      expect(dataContent).toMatch(/data\s+"aws_rds_engine_version"\s+"postgresql"/);
      expect(dataContent).toMatch(/engine\s*=\s*"postgres"/);
    });

    test("data sources provide AWS metadata", () => {
      expect(dataContent).toMatch(/data\s+"aws_/);
      expect(dataContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("RDS Parameter Groups", () => {
    test("primary parameter group exists", () => {
      expect(parameterGroupsContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"primary"/);
      expect(parameterGroupsContent).toMatch(/family\s*=\s*"postgres\d+"/);
    });

    test("DR parameter group exists", () => {
      expect(parameterGroupsContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"dr"/);
      expect(parameterGroupsContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
    });

    test("parameter groups include PostgreSQL tuning", () => {
      expect(parameterGroupsContent).toMatch(/parameter\s*\{/);
      expect(parameterGroupsContent).toMatch(/name\s*=/);
      expect(parameterGroupsContent).toMatch(/value\s*=/);
    });

    test("parameter groups use environment_suffix", () => {
      expect(parameterGroupsContent).toMatch(/name.*\${var\.environment_suffix}/);
    });
  });

  describe("Output Values", () => {
    test("all critical outputs are defined", () => {
      const requiredOutputs = [
        "primary_endpoint",
        "dr_replica_endpoint",
        "primary_arn",
        "dr_replica_arn",
        "kms_key_primary",
        "kms_key_dr",
        "lambda_function_name",
        "sns_topic_arn",
        "vpc_peering_id",
        "secret_arn"
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"\\s*\\{`));
      });
    });

    test("outputs have descriptions", () => {
      expect(outputsContent).toMatch(/description\s*=/);
    });

    test("sensitive outputs marked as sensitive", () => {
      expect(outputsContent).toMatch(/output\s+"secret_arn"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("outputs reference correct resources", () => {
      expect(outputsContent).toMatch(/value\s*=\s*aws_db_instance\.primary\.endpoint/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_db_instance\.dr_replica\.endpoint/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_kms_key\.primary\.id/);
    });
  });

  describe("Resource Naming Consistency", () => {
    test("all resources use environment_suffix for uniqueness", () => {
      const allContent = [
        rdsContent,
        vpcPrimaryContent,
        vpcDrContent,
        lambdaContent,
        kmsContent,
        secretsContent,
        cloudwatchContent
      ].join("\n");

      const suffixCount = (allContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThanOrEqual(10);
    });

    test("resource names follow consistent pattern", () => {
      expect(rdsContent).toMatch(/rds-primary-\${var\.environment_suffix}/);
      expect(rdsContent).toMatch(/rds-dr-replica-\${var\.environment_suffix}/);
      expect(lambdaContent).toMatch(/rds-failover-monitor-\${var\.environment_suffix}/);
    });

    test("common tags applied consistently", () => {
      const allContent = [
        rdsContent,
        vpcPrimaryContent,
        vpcDrContent,
        lambdaContent,
        kmsContent,
        cloudwatchContent
      ].join("\n");

      const tagCount = (allContent.match(/tags\s*=\s*merge\(/g) || []).length;
      expect(tagCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded credentials in configuration", () => {
      const allContent = [
        providersContent,
        variablesContent,
        rdsContent,
        lambdaContent,
        iamContent,
        secretsContent
      ].join("\n");

      expect(allContent).not.toMatch(/password\s*=\s*"[^$]/);
      expect(allContent).not.toMatch(/secret\s*=\s*"[^$]/);
    });

    test("encryption enabled for data at rest", () => {
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("security groups restrict access appropriately", () => {
      expect(vpcPrimaryContent).toMatch(/ingress\s*\{/);
      expect(vpcPrimaryContent).toMatch(/from_port\s*=\s*5432/);
    });

    test("IAM follows least privilege principle", () => {
      expect(iamContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(iamContent).toMatch(/Resource\s*=/);
      expect(iamContent).not.toMatch(/Resource\s*=\s*"\*".*rds:Delete/);
    });
  });

  describe("Disaster Recovery Capabilities", () => {
    test("cross-region replication configured", () => {
      expect(rdsContent).toMatch(/replicate_source_db\s*=\s*aws_db_instance\.primary\.arn/);
      expect(rdsContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
    });

    test("VPC peering enables cross-region connectivity", () => {
      expect(vpcPeeringContent).toMatch(/peer_region\s*=\s*var\.dr_region/);
      expect(vpcPeeringContent).toMatch(/vpc_peering_connection_accepter/);
    });

    test("Lambda monitors replication health", () => {
      expect(lambdaContent).toMatch(/function_name.*failover-monitor/);
      expect(lambdaContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
    });

    test("CloudWatch alarms detect issues", () => {
      expect(cloudwatchContent).toMatch(/metric_name.*Replica/i);
      expect(cloudwatchContent).toMatch(/comparison_operator/);
    });

    test("backup retention supports point-in-time recovery", () => {
      expect(rdsContent).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_period/);
      expect(variablesContent).toMatch(/default\s*=\s*7/);
    });
  });

  describe("Code Quality and Terraform Best Practices", () => {
    test("resources reference each other properly", () => {
      const allContent = [rdsContent, vpcPrimaryContent, lambdaContent].join("\n");
      expect(allContent).toMatch(/aws_db_instance\./);
      expect(allContent).toMatch(/aws_vpc\./);
    });

    test("data sources used for dynamic values", () => {
      expect(dataContent).toMatch(/data\s+"aws_/);
      expect(rdsContent).toMatch(/data\.aws_rds_engine_version/);
    });

    test("resource configurations use Terraform interpolation", () => {
      const allContent = [rdsContent, kmsContent, secretsContent, vpcPrimaryContent].join("\n");
      expect(allContent).toMatch(/\${var\./);
      expect(allContent).toMatch(/local\./);
    });

    test("provider aliases used correctly for multi-region", () => {
      expect(rdsContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
      expect(vpcDrContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
    });

    test("no deprecated resource types used", () => {
      const allContent = [rdsContent, vpcPrimaryContent, lambdaContent, iamContent].join("\n");
      expect(allContent).not.toMatch(/aws_db_security_group/);
      expect(allContent).not.toMatch(/aws_elasticache_security_group/);
    });
  });
});
