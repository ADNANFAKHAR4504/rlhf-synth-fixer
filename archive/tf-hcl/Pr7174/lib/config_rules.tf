# Config Rule for encryption compliance in us-east-1
resource "aws_config_config_rule" "encryption_us_east_1" {
  provider = aws.us_east_1
  name     = "encryption-compliance-${var.environment_suffix}-us-east-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.encryption_check["us-east-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_lambda_permission.encryption_check["us-east-1"]
  ]
}

# Config Rule for tagging compliance in us-east-1
resource "aws_config_config_rule" "tagging_us_east_1" {
  provider = aws.us_east_1
  name     = "tagging-compliance-${var.environment_suffix}-us-east-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.tagging_check["us-east-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_lambda_permission.tagging_check["us-east-1"]
  ]
}

# Config Rule for backup compliance in us-east-1
resource "aws_config_config_rule" "backup_us_east_1" {
  provider = aws.us_east_1
  name     = "backup-compliance-${var.environment_suffix}-us-east-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.backup_check["us-east-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_east_1,
    aws_lambda_permission.backup_check["us-east-1"]
  ]
}

# Config Rule for encryption compliance in us-west-2
resource "aws_config_config_rule" "encryption_us_west_2" {
  provider = aws.us_west_2
  name     = "encryption-compliance-${var.environment_suffix}-us-west-2"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.encryption_check["us-west-2"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_west_2,
    aws_lambda_permission.encryption_check["us-west-2"]
  ]
}

# Config Rule for tagging compliance in us-west-2
resource "aws_config_config_rule" "tagging_us_west_2" {
  provider = aws.us_west_2
  name     = "tagging-compliance-${var.environment_suffix}-us-west-2"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.tagging_check["us-west-2"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_west_2,
    aws_lambda_permission.tagging_check["us-west-2"]
  ]
}

# Config Rule for backup compliance in us-west-2
resource "aws_config_config_rule" "backup_us_west_2" {
  provider = aws.us_west_2
  name     = "backup-compliance-${var.environment_suffix}-us-west-2"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.backup_check["us-west-2"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.us_west_2,
    aws_lambda_permission.backup_check["us-west-2"]
  ]
}

# Config Rule for encryption compliance in eu-west-1
resource "aws_config_config_rule" "encryption_eu_west_1" {
  provider = aws.eu_west_1
  name     = "encryption-compliance-${var.environment_suffix}-eu-west-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.encryption_check["eu-west-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.eu_west_1,
    aws_lambda_permission.encryption_check["eu-west-1"]
  ]
}

# Config Rule for tagging compliance in eu-west-1
resource "aws_config_config_rule" "tagging_eu_west_1" {
  provider = aws.eu_west_1
  name     = "tagging-compliance-${var.environment_suffix}-eu-west-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.tagging_check["eu-west-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.eu_west_1,
    aws_lambda_permission.tagging_check["eu-west-1"]
  ]
}

# Config Rule for backup compliance in eu-west-1
resource "aws_config_config_rule" "backup_eu_west_1" {
  provider = aws.eu_west_1
  name     = "backup-compliance-${var.environment_suffix}-eu-west-1"

  source {
    owner             = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.backup_check["eu-west-1"].arn

    source_detail {
      event_source = "aws.config"
      message_type = "ConfigurationItemChangeNotification"
    }

    source_detail {
      event_source = "aws.config"
      message_type = "OversizedConfigurationItemChangeNotification"
    }
  }

  scope {
    compliance_resource_types = [
      "AWS::EC2::Instance",
      "AWS::RDS::DBInstance",
      "AWS::S3::Bucket"
    ]
  }

  depends_on = [
    aws_config_configuration_recorder_status.eu_west_1,
    aws_lambda_permission.backup_check["eu-west-1"]
  ]
}
