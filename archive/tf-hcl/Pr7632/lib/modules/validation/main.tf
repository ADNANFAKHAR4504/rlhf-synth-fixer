variable "workspace" {
  description = "Current workspace"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
}

variable "ecs_task_cpu" {
  description = "ECS task CPU"
  type        = string
}

variable "ecs_task_memory" {
  description = "ECS task memory"
  type        = string
}

locals {
  # Define validation rules based on region and environment
  region_rules = {
    "us-east-1" = {
      expected_vpc_cidr_prefix = "10.0"
      min_ecs_cpu              = 256
      max_ecs_cpu              = 4096
      min_ecs_memory           = 512
      max_ecs_memory           = 8192
    }
    "eu-west-1" = {
      expected_vpc_cidr_prefix = "10.1"
      min_ecs_cpu              = 256
      max_ecs_cpu              = 4096
      min_ecs_memory           = 512
      max_ecs_memory           = 8192
    }
    "ap-southeast-1" = {
      expected_vpc_cidr_prefix = "10.2"
      min_ecs_cpu              = 256
      max_ecs_cpu              = 4096
      min_ecs_memory           = 512
      max_ecs_memory           = 8192
    }
  }

  environment_rules = {
    "prod" = {
      min_ecs_cpu    = 512
      min_ecs_memory = 1024
    }
    "staging" = {
      min_ecs_cpu    = 256
      min_ecs_memory = 512
    }
  }

  current_region_rules = lookup(local.region_rules, var.aws_region, {})
  current_env_rules    = lookup(local.environment_rules, var.environment_suffix, {})

  # Validation checks
  validation_errors = compact([
    # Region validation
    contains(keys(local.region_rules), var.aws_region) ? "" : "Unsupported region: ${var.aws_region}",

    # Environment validation  
    contains(keys(local.environment_rules), var.environment_suffix) ? "" : "Unsupported environment: ${var.environment_suffix}",

    # VPC CIDR validation (should match region pattern)
    length(local.current_region_rules) > 0 && startswith(var.vpc_cidr, local.current_region_rules.expected_vpc_cidr_prefix) ? "" : "VPC CIDR should start with ${lookup(local.current_region_rules, "expected_vpc_cidr_prefix", "10.x")} for region ${var.aws_region}",

    # ECS CPU validation
    tonumber(var.ecs_task_cpu) >= lookup(local.current_env_rules, "min_ecs_cpu", 256) ? "" : "ECS CPU ${var.ecs_task_cpu} is below minimum ${lookup(local.current_env_rules, "min_ecs_cpu", 256)} for environment ${var.environment_suffix}",

    # ECS Memory validation
    tonumber(var.ecs_task_memory) >= lookup(local.current_env_rules, "min_ecs_memory", 512) ? "" : "ECS Memory ${var.ecs_task_memory} is below minimum ${lookup(local.current_env_rules, "min_ecs_memory", 512)} for environment ${var.environment_suffix}",

    # ECS CPU/Memory ratio validation (Memory should be at least 2x CPU for Fargate)
    tonumber(var.ecs_task_memory) >= (tonumber(var.ecs_task_cpu) * 2) ? "" : "ECS Memory ${var.ecs_task_memory} should be at least 2x CPU ${var.ecs_task_cpu} for Fargate"
  ])

  validation_passed = length(local.validation_errors) == 0
}

# Null resource to force validation
resource "null_resource" "validate" {
  triggers = {
    validation_hash = md5(jsonencode({
      workspace   = var.workspace
      region      = var.aws_region
      environment = var.environment_suffix
      vpc_cidr    = var.vpc_cidr
      ecs_cpu     = var.ecs_task_cpu
      ecs_memory  = var.ecs_task_memory
    }))
  }

  provisioner "local-exec" {
    command = local.validation_passed ? "echo 'Validation passed'" : "echo 'Validation failed: ${join(", ", local.validation_errors)}' && exit 1"
  }
}

# Outputs
output "validation_passed" {
  description = "Whether all validation checks passed"
  value       = local.validation_passed
}

output "validation_errors" {
  description = "List of validation error messages"
  value       = local.validation_errors
}

output "validation_error_count" {
  description = "Number of validation errors"
  value       = length(local.validation_errors)
}

output "validation_summary" {
  description = "Summary of validation results"
  value = {
    status         = local.validation_passed ? "PASS" : "FAIL"
    total_checks   = 6
    failed_checks  = length(local.validation_errors)
    error_messages = local.validation_errors
    validation_hash = md5(jsonencode({
      workspace   = var.workspace
      region      = var.aws_region
      environment = var.environment_suffix
      vpc_cidr    = var.vpc_cidr
      ecs_cpu     = var.ecs_task_cpu
      ecs_memory  = var.ecs_task_memory
    }))
  }
}

output "expected_config" {
  description = "Expected configuration for current region and environment"
  value = {
    region_rules = local.current_region_rules
    env_rules    = local.current_env_rules
    workspace    = var.workspace
    region       = var.aws_region
    environment  = var.environment_suffix
  }
}

output "current_config" {
  description = "Current configuration values being validated"
  value = {
    workspace       = var.workspace
    aws_region      = var.aws_region
    environment     = var.environment_suffix
    vpc_cidr        = var.vpc_cidr
    ecs_task_cpu    = var.ecs_task_cpu
    ecs_task_memory = var.ecs_task_memory
  }
}

output "supported_regions" {
  description = "List of supported AWS regions"
  value       = keys(local.region_rules)
}

output "supported_environments" {
  description = "List of supported environment types"
  value       = keys(local.environment_rules)
}

output "region_specific_rules" {
  description = "Region-specific validation rules"
  value       = local.region_rules
}

output "environment_specific_rules" {
  description = "Environment-specific validation rules"
  value       = local.environment_rules
}

output "validation_checks_performed" {
  description = "Details of all validation checks performed"
  value = {
    region_supported = {
      check    = "Region is supported"
      input    = var.aws_region
      expected = keys(local.region_rules)
      passed   = contains(keys(local.region_rules), var.aws_region)
    }
    environment_supported = {
      check    = "Environment is supported"
      input    = var.environment_suffix
      expected = keys(local.environment_rules)
      passed   = contains(keys(local.environment_rules), var.environment_suffix)
    }
    vpc_cidr_pattern = {
      check           = "VPC CIDR matches region pattern"
      input           = var.vpc_cidr
      expected_prefix = lookup(local.current_region_rules, "expected_vpc_cidr_prefix", "unknown")
      passed          = length(local.current_region_rules) > 0 && startswith(var.vpc_cidr, local.current_region_rules.expected_vpc_cidr_prefix)
    }
    ecs_cpu_minimum = {
      check        = "ECS CPU meets environment minimum"
      input        = tonumber(var.ecs_task_cpu)
      expected_min = lookup(local.current_env_rules, "min_ecs_cpu", 256)
      passed       = tonumber(var.ecs_task_cpu) >= lookup(local.current_env_rules, "min_ecs_cpu", 256)
    }
    ecs_memory_minimum = {
      check        = "ECS Memory meets environment minimum"
      input        = tonumber(var.ecs_task_memory)
      expected_min = lookup(local.current_env_rules, "min_ecs_memory", 512)
      passed       = tonumber(var.ecs_task_memory) >= lookup(local.current_env_rules, "min_ecs_memory", 512)
    }
    ecs_memory_cpu_ratio = {
      check               = "ECS Memory is at least 2x CPU for Fargate"
      cpu_input           = tonumber(var.ecs_task_cpu)
      memory_input        = tonumber(var.ecs_task_memory)
      expected_min_memory = tonumber(var.ecs_task_cpu) * 2
      passed              = tonumber(var.ecs_task_memory) >= (tonumber(var.ecs_task_cpu) * 2)
    }
  }
}
