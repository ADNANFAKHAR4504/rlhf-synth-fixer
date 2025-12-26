use_localstack     = false # Set to true when deploying to LocalStack
env                = "dev"
environment_suffix = "synth291325"
owner              = "qa-automation"
purpose            = "iac-compliance-testing"
target_account_id  = "000000000000" # LocalStack default account ID
external_id        = "test-external-id-291325"

# Override default roles with test-specific configurations
roles = {
  security-auditor = {
    description          = "SOC 2 compliance auditor with focused read-only access"
    max_session_duration = 3600
    trusted_principals   = ["arn:aws:iam::000000000000:root"] # LocalStack-compatible principal
    require_external_id  = false                              # Simplified for LocalStack
    require_mfa          = false                              # Simplified for LocalStack
    inline_policies = {
      audit-read-access = {
        actions = [
          "iam:Get*",
          "iam:List*",
          "logs:Describe*",
          "logs:Get*",
          "config:Get*",
          "config:List*",
          "config:Describe*",
          "cloudtrail:Get*",
          "cloudtrail:List*",
          "cloudtrail:Describe*",
          "s3:GetBucketPolicy",
          "s3:GetBucketLogging",
          "s3:GetBucketVersioning"
        ]
        resources  = ["*"]
        conditions = {} # Simplified for LocalStack - conditions not fully supported
      }
    }
    managed_policy_arns = []
  }

  ci-deployer = {
    description          = "CI/CD deployment role with resource-scoped permissions"
    max_session_duration = 3600
    trusted_principals   = ["arn:aws:iam::000000000000:root"] # LocalStack-compatible principal
    require_external_id  = false                              # Simplified for LocalStack
    require_mfa          = false
    inline_policies = {
      deployment-access = {
        actions = [
          "lambda:CreateFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:TagResource",
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        resources = [
          "arn:aws:lambda:*:000000000000:function:corp-*",
          "arn:aws:s3:::corp-deployment-artifacts-dev/*"
        ]
        conditions = {} # Simplified for LocalStack - conditions not fully supported
      }
    }
    managed_policy_arns = []
  }

  breakglass = {
    description          = "Emergency access with MFA and short session"
    max_session_duration = 3600
    trusted_principals   = ["arn:aws:iam::000000000000:root"] # LocalStack-compatible principal
    require_external_id  = false
    require_mfa          = false # Simplified for LocalStack
    inline_policies = {
      emergency-access = {
        actions    = ["iam:*", "ec2:*", "s3:*", "lambda:*"]
        resources  = ["*"]
        conditions = {} # Simplified for LocalStack - conditions not fully supported
      }
    }
    managed_policy_arns = []
  }
}