# outputs.tf - Infrastructure Analysis Module Outputs

# EC2 Compliance Outputs
output "ec2_instance_analysis" {
  description = "EC2 instance compliance analysis"
  value = {
    total_instances = length(local.ec2_instances)
    approved_types  = local.approved_instance_types
    violations = {
      unapproved_instance_types = local.ec2_type_violations
      cost_warnings             = local.ec2_cost_warnings
    }
    cost_analysis = {
      individual_costs   = local.ec2_costs
      total_monthly_cost = local.total_ec2_cost
    }
    compliance_status = length(local.ec2_type_violations) == 0 ? "PASS" : "FAIL"
  }
}

# RDS Compliance Outputs
output "rds_database_analysis" {
  description = "RDS database compliance analysis"
  value = {
    total_databases = length(local.rds_databases)
    violations = {
      backup_compliance_failures = local.rds_backup_violations
    }
    compliance_status = length(local.rds_backup_violations) == 0 ? "PASS" : "FAIL"
  }
}

# S3 Compliance Outputs
output "s3_bucket_analysis" {
  description = "S3 bucket compliance analysis"
  value = {
    total_buckets = length(local.s3_buckets)
    violations = {
      security_compliance_failures = local.s3_compliance_violations
    }
    compliance_status = length(local.s3_compliance_violations) == 0 ? "PASS" : "FAIL"
  }
}

# Security Group Compliance Outputs
output "security_group_analysis" {
  description = "Security group compliance analysis"
  value = {
    total_security_groups = length(local.security_groups)
    allowed_public_ports  = local.allowed_public_ports
    violations = {
      unrestricted_access_rules = local.sg_violations
    }
    compliance_status = length(local.sg_violations) == 0 ? "PASS" : "FAIL"
  }
}

# Tagging Compliance Outputs
output "tagging_compliance_analysis" {
  description = "Tagging compliance analysis"
  value = {
    total_resources = local.total_resources
    required_tags   = local.required_tags
    violations = {
      resources_with_missing_tags = local.resources_with_tag_violations
    }
    compliance_metrics = {
      compliant_resources     = local.compliant_resources
      non_compliant_resources = length(local.resources_with_tag_violations)
      compliance_percentage   = local.compliance_percentage
    }
    compliance_status = length(local.resources_with_tag_violations) == 0 ? "PASS" : "FAIL"
  }
}

# Overall Compliance Summary
output "compliance_summary" {
  description = "Overall compliance summary across all checks"
  value = {
    total_resources_analyzed = local.total_resources
    total_violations         = local.total_violations
    compliance_by_category = {
      ec2_instances   = length(local.ec2_type_violations) == 0 ? "PASS" : "FAIL"
      rds_databases   = length(local.rds_backup_violations) == 0 ? "PASS" : "FAIL"
      s3_buckets      = length(local.s3_compliance_violations) == 0 ? "PASS" : "FAIL"
      security_groups = length(local.sg_violations) == 0 ? "PASS" : "FAIL"
      tagging         = length(local.resources_with_tag_violations) == 0 ? "PASS" : "FAIL"
    }
    overall_compliance_percentage = local.compliance_percentage
    overall_status                = local.total_violations == 0 ? "PASS" : "FAIL"
    timestamp                     = timestamp()
  }
}

# Cost Summary
output "cost_summary" {
  description = "Infrastructure cost analysis"
  value = {
    ec2_total_monthly_cost = local.total_ec2_cost
    cost_warnings_count    = length(local.ec2_cost_warnings)
    high_cost_instances    = local.ec2_cost_warnings
  }
}

# Machine-readable JSON output for CI/CD
output "cicd_report" {
  description = "Machine-readable compliance report for CI/CD integration"
  value = jsonencode({
    report_timestamp   = timestamp()
    environment_suffix = var.environment_suffix
    compliance = {
      overall_status        = local.total_violations == 0 ? "PASS" : "FAIL"
      compliance_percentage = local.compliance_percentage
      total_violations      = local.total_violations
    }
    categories = {
      ec2 = {
        status           = length(local.ec2_type_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.ec2_type_violations)
      }
      rds = {
        status           = length(local.rds_backup_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.rds_backup_violations)
      }
      s3 = {
        status           = length(local.s3_compliance_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.s3_compliance_violations)
      }
      security_groups = {
        status           = length(local.sg_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.sg_violations)
      }
      tagging = {
        status           = length(local.resources_with_tag_violations) == 0 ? "PASS" : "FAIL"
        violations_count = length(local.resources_with_tag_violations)
      }
    }
    costs = {
      total_monthly_estimate    = local.total_ec2_cost
      high_cost_instances_count = length(local.ec2_cost_warnings)
    }
  })
}
