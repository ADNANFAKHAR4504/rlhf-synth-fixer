# Step Functions for Migration Orchestration (Optional Enhancement)

# Step Functions state machine for migration workflow
resource "aws_sfn_state_machine" "migration_workflow" {
  count    = var.enable_step_functions ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-stepfunctions-migration-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions[0].arn

  definition = jsonencode({
    Comment = "Document Processing Migration Workflow"
    StartAt = "CheckMigrationPhase"
    States = {
      CheckMigrationPhase = {
        Type = "Choice"
        Choices = [
          {
            Variable     = "$.phase"
            StringEquals = "planning"
            Next         = "PlanningPhase"
          },
          {
            Variable     = "$.phase"
            StringEquals = "sync"
            Next         = "SyncPhase"
          },
          {
            Variable     = "$.phase"
            StringEquals = "cutover"
            Next         = "CutoverPhase"
          }
        ]
        Default = "MigrationComplete"
      }

      PlanningPhase = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validation.arn
          Payload = {
            action = "validate_infrastructure"
          }
        }
        Next = "WaitForSync"
      }

      WaitForSync = {
        Type    = "Wait"
        Seconds = 60
        Next    = "SyncPhase"
      }

      SyncPhase = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "SyncDocuments"
            States = {
              SyncDocuments = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.data_sync.arn
                  Payload = {
                    action = "sync_documents"
                  }
                }
                End = true
              }
            }
          },
          {
            StartAt = "ValidateReplication"
            States = {
              ValidateReplication = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.validation.arn
                  Payload = {
                    action = "validate_replication"
                  }
                }
                End = true
              }
            }
          }
        ]
        Next = "CheckSyncComplete"
      }

      CheckSyncComplete = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.syncComplete"
            BooleanEquals = true
            Next          = "CutoverPhase"
          }
        ]
        Default = "WaitForSync"
      }

      CutoverPhase = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validation.arn
          Payload = {
            action = "final_validation"
          }
        }
        Next = "MigrationComplete"
      }

      MigrationComplete = {
        Type = "Succeed"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions[0].arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-stepfunctions-migration-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch log group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  count             = var.enable_step_functions ? 1 : 0
  provider          = aws.source
  name              = "/aws/states/doc-proc-${var.source_region}-stepfunctions-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name           = "doc-proc-${var.source_region}-logs-stepfunctions-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}
