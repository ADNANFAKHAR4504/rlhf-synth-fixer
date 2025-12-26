# LocalStack-specific variable overrides
# Use this file when deploying to LocalStack with: terraform apply -var-file=localstack.tfvars

use_localstack     = true
env                = "dev"
environment_suffix = "localstack-pr1677"
owner              = "localstack-testing"
purpose            = "iam-localstack-validation"
target_account_id  = "000000000000" # LocalStack default account ID
external_id        = ""             # Not used in LocalStack

# Simplified roles for LocalStack deployment
# Note: Complex IAM conditions are not fully supported in LocalStack
roles = {
  security-auditor = {
    description          = "SOC 2 compliance auditor - LocalStack compatible"
    max_session_duration = 3600
    trusted_principals   = ["arn:aws:iam::000000000000:root"]
    require_external_id  = false
    require_mfa          = false
    inline_policies = {
      audit-read-access = {
        actions = [
          "iam:Get*",
          "iam:List*",
          "logs:Describe*",
          "logs:Get*",
          "s3:GetBucketPolicy",
          "s3:GetBucketLogging",
          "s3:GetBucketVersioning"
        ]
        resources  = ["*"]
        conditions = {}
      }
    }
    managed_policy_arns = []
  }

  ci-deployer = {
    description          = "CI/CD deployment role - LocalStack compatible"
    max_session_duration = 3600
    trusted_principals   = ["arn:aws:iam::000000000000:root"]
    require_external_id  = false
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
        conditions = {}
      }
    }
    managed_policy_arns = []
  }

  breakglass = {
    description          = "Emergency access role - LocalStack compatible"
    max_session_duration = 3600
    trusted_principals   = ["arn:aws:iam::000000000000:root"]
    require_external_id  = false
    require_mfa          = false
    inline_policies = {
      emergency-access = {
        actions    = ["iam:*", "s3:*", "lambda:*"]
        resources  = ["*"]
        conditions = {}
      }
    }
    managed_policy_arns = []
  }
}
