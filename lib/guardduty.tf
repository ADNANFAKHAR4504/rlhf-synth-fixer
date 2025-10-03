# Try to get existing detector
data "aws_guardduty_detector" "existing" {
  count = 1
}

# Create detector only if it doesn't exist
resource "aws_guardduty_detector" "main" {
  count  = length(data.aws_guardduty_detector.existing) == 0 ? 1 : 0
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = merge(
    local.common_tags,
    {
      Name = "security-monitoring-detector-${local.environment_suffix}"
    }
  )
}

# Local value to reference the detector
locals {
  guardduty_detector_id = length(data.aws_guardduty_detector.existing) > 0 ? data.aws_guardduty_detector.existing[0].id : aws_guardduty_detector.main[0].id
}

# Note: Multi-region GuardDuty would require separate provider blocks for each region
# For this deployment, GuardDuty is enabled in the primary region