# Random IDs for unique naming

resource "random_id" "s3_encryption_suffix" {
  byte_length = 4
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "random_id" "flow_log_suffix" {
  byte_length = 4
}

resource "random_id" "ec2_role_suffix" {
  byte_length = 4
}

resource "random_id" "web_suffix" {
  byte_length = 4
}

resource "random_id" "main" {
  byte_length = 4
}

resource "random_id" "web_servers" {
  byte_length = 4
}

resource "random_id" "maintenance_window" {
  byte_length = 4
}


resource "random_id" "unauthorized" {
  byte_length = 4
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Random ID for IAM Role Policy name suffix
resource "random_id" "ec2_policy_suffix" {
  byte_length = 4
}

# Random ID for IAM Instance Profile name suffix
resource "random_id" "ec2_profile_suffix" {
  byte_length = 4
}

# Random ID for SSM Patch Task
resource "random_id" "patch_task" {
  byte_length = 4
}

# Random ID for CloudTrail naming
resource "random_id" "cloudtrail" {
  byte_length = 4
}
