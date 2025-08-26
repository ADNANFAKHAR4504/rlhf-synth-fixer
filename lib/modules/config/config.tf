# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "SecConfig-ConfigRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "SecConfig-Config-Role"
    Project = "SecurityConfiguration"
  }
}

# Correct AWS Config service role policy
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "SecConfig-Delivery-Channel"
  s3_bucket_name = var.config_bucket
  s3_key_prefix  = "config"
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "SecConfig-Recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Start the configuration recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name    = "SecConfig-S3-Public-Read-Rule"
    Project = "SecurityConfiguration"
  }
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name    = "SecConfig-Encrypted-Volumes-Rule"
    Project = "SecurityConfiguration"
  }
}