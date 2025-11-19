# Requirement 8: Structured outputs using nested maps

output "infrastructure" {
  description = "Complete infrastructure configuration"
  value = {
    metadata = {
      environment        = var.environment
      environment_suffix = var.environment_suffix
      project_name       = var.project_name
      regions            = keys(local.regions)
      deployment_time    = timestamp()
    }

    ec2 = {
      east = {
        for key, instance in module.ec2_east : key => {
          tier                   = split("-", key)[0]
          autoscaling_group_name = instance.autoscaling_group_name
          autoscaling_group_arn  = instance.autoscaling_group_arn
          security_group_id      = instance.security_group_id
          launch_template_id     = instance.launch_template_id
        }
      }

      west = {
        for key, instance in module.ec2_west : key => {
          tier                   = split("-", key)[0]
          autoscaling_group_name = instance.autoscaling_group_name
          autoscaling_group_arn  = instance.autoscaling_group_arn
          security_group_id      = instance.security_group_id
          launch_template_id     = instance.launch_template_id
        }
      }
    }

    rds = merge(
      {
        for key, cluster in module.rds_east : key => {
          cluster_id         = cluster.cluster_id
          cluster_arn        = cluster.cluster_arn
          writer_endpoint    = cluster.cluster_endpoint
          reader_endpoint    = cluster.cluster_reader_endpoint
          port               = cluster.cluster_port
          database_name      = cluster.cluster_database_name
          engine             = local.rds_clusters[key].engine
          region             = local.regions[local.rds_clusters[key].region_key].name
          security_group_id  = cluster.security_group_id
          instance_count     = local.rds_clusters[key].instance_count
          instance_endpoints = cluster.instance_endpoints
        }
      },
      {
        for key, cluster in module.rds_west : key => {
          cluster_id         = cluster.cluster_id
          cluster_arn        = cluster.cluster_arn
          writer_endpoint    = cluster.cluster_endpoint
          reader_endpoint    = cluster.cluster_reader_endpoint
          port               = cluster.cluster_port
          database_name      = cluster.cluster_database_name
          engine             = local.rds_clusters[key].engine
          region             = local.regions[local.rds_clusters[key].region_key].name
          security_group_id  = cluster.security_group_id
          instance_count     = local.rds_clusters[key].instance_count
          instance_endpoints = cluster.instance_endpoints
        }
      }
    )

    networking = {
      east = {
        vpc_id             = aws_vpc.east.id
        vpc_cidr           = aws_vpc.east.cidr_block
        public_subnet_ids  = local.east_public_subnet_ids
        private_subnet_ids = local.east_private_subnet_ids
        availability_zones = keys(aws_subnet.east_public)
        load_balancer_arn  = null # Load Balancer not available - create separately if needed
        load_balancer_dns  = null # Load Balancer not available - create separately if needed
      }

      west = {
        vpc_id             = aws_vpc.west.id
        vpc_cidr           = aws_vpc.west.cidr_block
        public_subnet_ids  = local.west_public_subnet_ids
        private_subnet_ids = local.west_private_subnet_ids
        availability_zones = keys(aws_subnet.west_public)
        load_balancer_arn  = null # Load Balancer not available - create separately if needed
        load_balancer_dns  = null # Load Balancer not available - create separately if needed
      }
    }

    optional_features = {
      state_locking = var.enable_state_locking ? {
        enabled        = true
        dynamodb_table = var.enable_state_locking ? aws_dynamodb_table.terraform_locks[0].name : null
        table_arn      = var.enable_state_locking ? aws_dynamodb_table.terraform_locks[0].arn : null
        } : {
        enabled        = false
        dynamodb_table = null
        table_arn      = null
      }

      ssm_secrets = var.enable_ssm_secrets ? {
        enabled         = true
        parameter_paths = [for k, v in aws_ssm_parameter.db_passwords : v.name]
        } : {
        enabled         = false
        parameter_paths = []
      }

      cloudfront = var.enable_cloudfront ? {
        enabled             = true
        distribution_id     = var.enable_cloudfront ? aws_cloudfront_distribution.static_assets[0].id : null
        distribution_domain = var.enable_cloudfront ? aws_cloudfront_distribution.static_assets[0].domain_name : null
        s3_bucket           = var.enable_cloudfront ? aws_s3_bucket.static_assets[0].id : null
        } : {
        enabled             = false
        distribution_id     = null
        distribution_domain = null
        s3_bucket           = null
      }
    }
  }
}

# CI/CD friendly outputs
output "autoscaling_groups" {
  description = "List of all Auto Scaling Group names for CI/CD integration"
  value = flatten([
    [for k, v in module.ec2_east : v.autoscaling_group_name],
    [for k, v in module.ec2_west : v.autoscaling_group_name]
  ])
}

output "rds_endpoints" {
  description = "Map of RDS cluster endpoints for application configuration"
  value = merge(
    {
      for key, cluster in module.rds_east : key => {
        writer = cluster.cluster_endpoint
        reader = cluster.cluster_reader_endpoint
        port   = cluster.cluster_port
      }
    },
    {
      for key, cluster in module.rds_west : key => {
        writer = cluster.cluster_endpoint
        reader = cluster.cluster_reader_endpoint
        port   = cluster.cluster_port
      }
    }
  )
  sensitive = true
}

output "load_balancers" {
  description = "Load balancer endpoints for DNS configuration"
  value = {
    east = {
      arn      = null # Load Balancer not available - create separately if needed
      dns_name = null # Load Balancer not available - create separately if needed
      zone_id  = null # Load Balancer not available - create separately if needed
    }
    west = {
      arn      = null # Load Balancer not available - create separately if needed
      dns_name = null # Load Balancer not available - create separately if needed
      zone_id  = null # Load Balancer not available - create separately if needed
    }
  }
}