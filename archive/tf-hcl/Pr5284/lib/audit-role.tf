# audit-role.tf - Cross-account audit role setup

# Trust policy for cross-account audit role
data "aws_iam_policy_document" "audit_trust_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = var.audit_account_ids
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.audit_external_id]
    }
  }
}

# Cross-account audit role
resource "aws_iam_role" "audit" {
  count                = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  name                 = "${local.name_prefix}-audit-role"
  assume_role_policy   = data.aws_iam_policy_document.audit_trust_policy.json
  max_session_duration = 43200 # 12 hours

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Audit policy - read-only access (using AWS managed policy instead of custom)
resource "aws_iam_role_policy_attachment" "audit_viewonly" {
  count      = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  role       = aws_iam_role.audit[0].name
  policy_arn = "arn:aws:iam::aws:policy/ViewOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "audit_security" {
  count      = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  role       = aws_iam_role.audit[0].name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

# Custom audit policy for additional read-only permissions
resource "aws_iam_policy" "audit" {
  count       = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  name        = "${local.name_prefix}-audit-policy"
  description = "Additional read-only policy for cross-account auditing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AdditionalReadAccess"
        Effect = "Allow"
        Action = [
          "config:Deliver*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "datasync:Describe*",
          "datasync:List*",
          "dax:Describe*",
          "dax:ListTags",
          "directconnect:Describe*",
          "dms:Describe*",
          "dms:ListTagsForResource",
          "dynamodb:DescribeBackup",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:DescribeGlobalTable",
          "dynamodb:DescribeGlobalTableSettings",
          "dynamodb:DescribeLimits",
          "dynamodb:DescribeReservedCapacity",
          "dynamodb:DescribeReservedCapacityOfferings",
          "dynamodb:DescribeStream",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:ListBackups",
          "dynamodb:ListGlobalTables",
          "dynamodb:ListStreams",
          "dynamodb:ListTables",
          "dynamodb:ListTagsOfResource",
          "ec2:Describe*",
          "ecr:DescribeImageScanFindings",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetLifecyclePolicy",
          "ecr:GetRepositoryPolicy",
          "ecr:ListImages",
          "ecs:Describe*",
          "ecs:List*",
          "eks:DescribeCluster",
          "eks:ListClusters",
          "elasticache:Describe*",
          "elasticache:ListTagsForResource",
          "elasticbeanstalk:Describe*",
          "elasticfilesystem:DescribeFileSystems",
          "elasticfilesystem:DescribeLifecycleConfiguration",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:DescribeMountTargetSecurityGroups",
          "elasticfilesystem:DescribeTags",
          "elasticloadbalancing:Describe*",
          "elasticmapreduce:Describe*",
          "elasticmapreduce:ListBootstrapActions",
          "elasticmapreduce:ListClusters",
          "elasticmapreduce:ListInstances",
          "elasticmapreduce:ListSteps",
          "es:Describe*",
          "es:ListDomainNames",
          "es:ListTags",
          "events:DescribeRule",
          "events:ListRuleNamesByTarget",
          "events:ListRules",
          "events:ListTargetsByRule",
          "firehose:Describe*",
          "firehose:List*",
          "fsx:Describe*",
          "glacier:DescribeVault",
          "glacier:GetVaultAccessPolicy",
          "glacier:ListVaults",
          "glue:GetCatalogImportStatus",
          "glue:GetDatabase",
          "glue:GetDatabases",
          "glue:GetTable",
          "glue:GetTables",
          "glue:GetPartition",
          "glue:GetPartitions",
          "guardduty:Get*",
          "guardduty:List*",
          "iam:Generate*",
          "iam:Get*",
          "iam:List*",
          "iam:SimulateCustomPolicy",
          "iam:SimulatePrincipalPolicy",
          "inspector:Describe*",
          "inspector:Get*",
          "inspector:List*",
          "iot:Describe*",
          "iot:GetPolicy",
          "iot:GetPolicyVersion",
          "iot:List*",
          "kinesis:Describe*",
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:ListStreams",
          "kinesis:ListTagsForStream",
          "kinesisanalytics:Describe*",
          "kinesisanalytics:Discover*",
          "kinesisanalytics:GetApplicationState",
          "kinesisanalytics:ListApplications",
          "kinesisvideo:Describe*",
          "kinesisvideo:GetDataEndpoint",
          "kinesisvideo:GetHLSStreamingSessionURL",
          "kinesisvideo:GetMedia",
          "kinesisvideo:GetMediaForFragmentList",
          "kinesisvideo:ListFragments",
          "kinesisvideo:ListStreams",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "lambda:Get*",
          "lambda:List*",
          "logs:Describe*",
          "logs:FilterLogEvents",
          "logs:Get*",
          "logs:ListTagsLogGroup",
          "logs:TestMetricFilter",
          "mq:Describe*",
          "mq:List*",
          "organizations:Describe*",
          "organizations:List*",
          "rds:Describe*",
          "rds:List*",
          "redshift:Describe*",
          "redshift:ViewQueriesInConsole",
          "route53:Get*",
          "route53:List*",
          "route53:TestDNSAnswer",
          "route53domains:CheckDomainAvailability",
          "route53domains:GetDomainDetail",
          "route53domains:GetOperationDetail",
          "route53domains:ListDomains",
          "route53domains:ListOperations",
          "route53domains:ListTagsForDomain",
          "s3:GetAccelerateConfiguration",
          "s3:GetAnalyticsConfiguration",
          "s3:GetBucketAcl",
          "s3:GetBucketCORS",
          "s3:GetBucketLocation",
          "s3:GetBucketLogging",
          "s3:GetBucketNotification",
          "s3:GetBucketPolicy",
          "s3:GetBucketPolicyStatus",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketTagging",
          "s3:GetBucketVersioning",
          "s3:GetBucketWebsite",
          "s3:GetEncryptionConfiguration",
          "s3:GetInventoryConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetMetricsConfiguration",
          "s3:GetObjectAcl",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging",
          "s3:GetReplicationConfiguration",
          "s3:ListAllMyBuckets",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListBucketVersions",
          "s3:ListMultipartUploadParts",
          "sagemaker:Describe*",
          "sagemaker:List*",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetResourcePolicy",
          "secretsmanager:ListSecrets",
          "secretsmanager:ListSecretVersionIds",
          "securityhub:Describe*",
          "securityhub:Get*",
          "securityhub:List*",
          "servicecatalog:Describe*",
          "servicecatalog:List*",
          "servicecatalog:SearchProducts",
          "servicecatalog:ScanProvisionedProducts",
          "ses:Describe*",
          "ses:Get*",
          "ses:List*",
          "shield:Describe*",
          "shield:List*",
          "sns:GetTopicAttributes",
          "sns:ListSubscriptions",
          "sns:ListSubscriptionsByTopic",
          "sns:ListTopics",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ListDeadLetterSourceQueues",
          "sqs:ListQueues",
          "sqs:ListQueueTags",
          "ssm:Describe*",
          "ssm:Get*",
          "ssm:List*",
          "states:DescribeActivity",
          "states:DescribeExecution",
          "states:DescribeStateMachine",
          "states:GetExecutionHistory",
          "states:ListActivities",
          "states:ListExecutions",
          "states:ListStateMachines",
          "storagegateway:Describe*",
          "storagegateway:List*",
          "support:*",
          "tag:GetResources",
          "tag:GetTagKeys",
          "tag:GetTagValues",
          "transfer:Describe*",
          "transfer:List*",
          "trustedadvisor:Describe*",
          "waf:Get*",
          "waf:List*",
          "wafv2:Get*",
          "wafv2:List*",
          "waf-regional:Get*",
          "waf-regional:List*",
          "workspaces:Describe*",
          "xray:BatchGetTraces",
          "xray:GetEncryptionConfig",
          "xray:GetServiceGraph",
          "xray:GetTraceGraph",
          "xray:GetTraceSummaries"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyModifyActions"
        Effect = "Deny"
        Action = [
          "*:Create*",
          "*:Delete*",
          "*:Put*",
          "*:Update*",
          "*:Modify*",
          "*:Attach*",
          "*:Detach*",
          "*:Start*",
          "*:Stop*",
          "*:Terminate*",
          "*:Reboot*",
          "*:Reset*",
          "*:Change*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach audit policy to audit role
resource "aws_iam_role_policy_attachment" "audit" {
  count      = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  role       = aws_iam_role.audit[0].name
  policy_arn = aws_iam_policy.audit[0].arn
}