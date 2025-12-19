output "region_infrastructure" {
  description = "Infrastructure details per region"
  value = merge(
    local.region0 != null ? {
      (local.region0) = {
        vpc_id              = module.networking_r0[0].vpc_id
        alb_dns             = module.compute_r0[0].alb_dns
        rds_endpoint        = module.database_r0[0].rds_endpoint
        dynamodb_table_name = module.database_r0[0].dynamodb_table_name
        cloudtrail_bucket   = module.monitoring_r0[0].cloudtrail_bucket
      }
    } : {},
    local.region1 != null ? {
      (local.region1) = {
        vpc_id              = module.networking_r1[0].vpc_id
        alb_dns             = module.compute_r1[0].alb_dns
        rds_endpoint        = module.database_r1[0].rds_endpoint
        dynamodb_table_name = module.database_r1[0].dynamodb_table_name
        cloudtrail_bucket   = module.monitoring_r1[0].cloudtrail_bucket
      }
    } : {}
  )
}

output "kms_keys" {
  description = "KMS key ARNs per region"
  value = merge(
    local.region0 != null ? { (local.region0) = module.kms_r0[0].kms_key_arn } : {},
    local.region1 != null ? { (local.region1) = module.kms_r1[0].kms_key_arn } : {},
    local.region2 != null ? { (local.region2) = module.kms_r2[0].kms_key_arn } : {}
  )
  sensitive = true
}


