# LocalStack-specific configuration
# Disabling features not fully supported by LocalStack

enable_aws_config    = false
enable_kms_replicas  = false
enable_vpc_flow_logs = false

environment      = "production"
primary_region   = "us-east-1"
vpc_id           = ""
subnet_ids       = []
organization_id  = ""
audit_account_id = ""

kms_key_deletion_window        = 7
secret_rotation_days           = 30
iam_session_duration_seconds   = 3600
cloudwatch_logs_retention_days = 90

data_classifications = ["PII", "Confidential", "Public"]
