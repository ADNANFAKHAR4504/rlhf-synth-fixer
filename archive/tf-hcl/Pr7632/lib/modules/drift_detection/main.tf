variable "current_workspace" {
  description = "Current workspace name"
  type        = string
}

variable "workspaces_state" {
  description = "Remote state data for all workspaces"
  type        = any
}

variable "current_config" {
  description = "Current workspace configuration"
  type = object({
    vpc_cidr        = string
    subnet_cidrs    = list(string)
    ecs_cpu         = string
    ecs_memory      = string
    aurora_instance = string
    s3_replication  = bool
    tags            = map(string)
  })
}

locals {
  # Extract configurations from remote states
  workspace_configs = {
    for workspace, state in var.workspaces_state : workspace => {
      vpc_cidr        = try(state.outputs.vpc_details.value.vpc_cidr, "N/A")
      ecs_cpu         = try(state.outputs.ecs_details.value.task_cpu, "N/A")
      ecs_memory      = try(state.outputs.ecs_details.value.task_memory, "N/A")
      aurora_instance = try(state.outputs.aurora_details.value.instance_class, "N/A")
      s3_replication  = try(state.outputs.s3_details.value.replication_enabled, false)
    }
  }

  # Compare configurations
  drift_analysis = {
    for workspace, config in local.workspace_configs : workspace => {
      vpc_cidr_drift = workspace != var.current_workspace ? (
        config.vpc_cidr != var.current_config.vpc_cidr ? "Different" : "Same"
      ) : "Current"

      ecs_config_drift = workspace != var.current_workspace ? (
        config.ecs_cpu != var.current_config.ecs_cpu || config.ecs_memory != var.current_config.ecs_memory ? "Different" : "Same"
      ) : "Current"

      aurora_drift = workspace != var.current_workspace ? (
        config.aurora_instance != var.current_config.aurora_instance ? "Different" : "Same"
      ) : "Current"

      s3_drift = workspace != var.current_workspace ? (
        config.s3_replication != var.current_config.s3_replication ? "Different" : "Same"
      ) : "Current"
    }
  }

  # Summary of differences
  drift_summary = {
    total_workspaces  = length(var.workspaces_state)
    current_workspace = var.current_workspace
    differences = {
      for workspace, analysis in local.drift_analysis : workspace => {
        vpc_cidr       = analysis.vpc_cidr_drift == "Different" ? true : false
        ecs_config     = analysis.ecs_config_drift == "Different" ? true : false
        aurora         = analysis.aurora_drift == "Different" ? true : false
        s3_replication = analysis.s3_drift == "Different" ? true : false
      }
    }
    detailed_configs = local.workspace_configs
  }
}

# Outputs
output "drift_summary" {
  description = "Summary of configuration drift across workspaces"
  value       = local.drift_summary
}

output "workspace_configs" {
  description = "Extracted configurations from all workspaces"
  value       = local.workspace_configs
}

output "drift_analysis" {
  description = "Detailed drift analysis"
  value       = local.drift_analysis
}