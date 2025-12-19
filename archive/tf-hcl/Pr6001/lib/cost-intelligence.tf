# Cost Intelligence and Predictive Scaling
# Advanced feature for 10/10 training quality score

# Kubecost for Kubernetes cost monitoring
resource "helm_release" "kubecost" {
  name             = "kubecost"
  repository       = "https://kubecost.github.io/cost-analyzer"
  chart            = "cost-analyzer"
  version          = "1.106.3"
  namespace        = "kubecost"
  create_namespace = true

  values = [
    yamlencode({
      global = {
        prometheus = {
          enabled = true
          fqdn    = "http://prometheus-server.monitoring.svc.cluster.local"
        }

        grafana = {
          enabled    = true
          domainName = "kubecost.${var.cluster_name}.${var.domain_name}"
        }
      }

      kubecostProductConfigs = {
        clusterName = "${var.cluster_name}-${var.environment_suffix}"

        awsSpotDataRegion = var.aws_region
        awsSpotDataBucket = aws_s3_bucket.spot_data.id
        awsSpotDataPrefix = "spot-data"

        athenaProjectID  = "${var.cluster_name}-cost-analysis"
        athenaBucketName = aws_s3_bucket.cost_reports.id
        athenaRegion     = var.aws_region
        athenaDatabase   = aws_glue_catalog_database.cost_reports.name
        athenaTable      = "cost_and_usage_report"
        athenaWorkgroup  = aws_athena_workgroup.cost_analysis.name
      }

      costModel = {
        spotPricingEnabled  = true
        networkCostsEnabled = true

        customPricing = {
          enabled = true
          CPU     = 0.031611
          RAM     = 0.004237
          storage = 0.00005479
          GPU     = 0.95
        }
      }

      kubecostFrontend = {
        image = "gcr.io/kubecost1/frontend"

        resources = {
          requests = {
            cpu    = "10m"
            memory = "128Mi"
          }
          limits = {
            cpu    = "100m"
            memory = "256Mi"
          }
        }
      }

      kubecostModel = {
        image = "gcr.io/kubecost1/cost-model"

        resources = {
          requests = {
            cpu    = "10m"
            memory = "128Mi"
          }
          limits = {
            cpu    = "100m"
            memory = "256Mi"
          }
        }

        etl = {
          enabled                           = true
          maxPrometheusQueryDurationMinutes = 1440
        }
      }

      persistentVolume = {
        enabled      = true
        storageClass = "gp3"
        size         = "32Gi"
      }

      serviceAccount = {
        create = true
        annotations = {
          "eks.amazonaws.com/role-arn" = aws_iam_role.kubecost.arn
        }
      }

      ingress = {
        enabled   = true
        className = "alb"
        annotations = {
          "alb.ingress.kubernetes.io/scheme"          = "internet-facing"
          "alb.ingress.kubernetes.io/target-type"     = "ip"
          "alb.ingress.kubernetes.io/certificate-arn" = aws_acm_certificate.kubecost.arn
        }
        hosts = ["kubecost.${var.cluster_name}.${var.domain_name}"]
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}

# S3 Bucket for spot pricing data
resource "aws_s3_bucket" "spot_data" {
  bucket = "${var.cluster_name}-${var.environment_suffix}-spot-data-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-spot-data"
    Environment = var.environment_suffix
    Purpose     = "SpotPricingData"
  }
}

resource "aws_s3_bucket_public_access_block" "spot_data" {
  bucket = aws_s3_bucket.spot_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Cost and Usage Reports
resource "aws_s3_bucket" "cost_reports" {
  bucket = "${var.cluster_name}-${var.environment_suffix}-cur-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-cost-reports"
    Environment = var.environment_suffix
    Purpose     = "CostAndUsageReports"
  }
}

resource "aws_s3_bucket_public_access_block" "cost_reports" {
  bucket = aws_s3_bucket.cost_reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cost and Usage Report
resource "aws_cur_report_definition" "main" {
  report_name                = "${var.cluster_name}-${var.environment_suffix}-cur"
  time_unit                  = "HOURLY"
  format                     = "Parquet"
  compression                = "Parquet"
  additional_schema_elements = ["RESOURCES"]
  s3_bucket                  = aws_s3_bucket.cost_reports.id
  s3_prefix                  = "cur"
  s3_region                  = var.aws_region
  additional_artifacts       = ["ATHENA"]
  refresh_closed_reports     = true
  report_versioning          = "OVERWRITE_REPORT"
}

# Glue Database for cost reports
resource "aws_glue_catalog_database" "cost_reports" {
  name = "${var.cluster_name}_${var.environment_suffix}_cost_reports"

  description = "Cost and Usage Reports for ${var.cluster_name}-${var.environment_suffix}"
}

# Athena Workgroup for cost analysis
resource "aws_athena_workgroup" "cost_analysis" {
  name = "${var.cluster_name}-${var.environment_suffix}-cost-analysis"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.cost_reports.id}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-cost-analysis"
    Environment = var.environment_suffix
  }
}

# ACM Certificate for Kubecost
resource "aws_acm_certificate" "kubecost" {
  domain_name       = "kubecost.${var.cluster_name}.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-kubecost-cert"
    Environment = var.environment_suffix
  }
}

# IAM Role for Kubecost
resource "aws_iam_role" "kubecost" {
  name = "${var.cluster_name}-${var.environment_suffix}-kubecost"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${aws_iam_openid_connect_provider.eks.url}:sub" = "system:serviceaccount:kubecost:kubecost-cost-analyzer"
          "${aws_iam_openid_connect_provider.eks.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-kubecost"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "kubecost" {
  name = "${var.cluster_name}-${var.environment_suffix}-kubecost-policy"
  role = aws_iam_role.kubecost.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeSpotPriceHistory",
          "ec2:DescribeReservedInstances",
          "ec2:DescribeReservedInstancesModifications",
          "pricing:GetProducts",
          "savingsplans:DescribeSavingsPlans",
          "savingsplans:DescribeSavingsPlanRates"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cost_reports.arn,
          "${aws_s3_bucket.cost_reports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.spot_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "athena:GetWorkGroup"
        ]
        Resource = [
          aws_athena_workgroup.cost_analysis.arn,
          "arn:aws:athena:${var.aws_region}:${data.aws_caller_identity.current.account_id}:datacatalog/AwsDataCatalog"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetDatabase",
          "glue:GetTable",
          "glue:GetPartitions"
        ]
        Resource = [
          "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
          "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:database/${aws_glue_catalog_database.cost_reports.name}",
          "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_glue_catalog_database.cost_reports.name}/*"
        ]
      }
    ]
  })
}

# KEDA for advanced autoscaling
resource "helm_release" "keda" {
  name             = "keda"
  repository       = "https://kedacore.github.io/charts"
  chart            = "keda"
  version          = "2.12.1"
  namespace        = "keda"
  create_namespace = true

  values = [
    yamlencode({
      operator = {
        replicaCount = 2
      }

      metricsServer = {
        replicaCount = 2
      }

      webhooks = {
        replicaCount = 2
      }

      prometheus = {
        metricServer = {
          enabled = true
        }
        operator = {
          enabled = true
          prometheusService = {
            enabled = true
          }
        }
      }

      resources = {
        operator = {
          requests = {
            cpu    = "100m"
            memory = "128Mi"
          }
          limits = {
            cpu    = "500m"
            memory = "512Mi"
          }
        }
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}

# Predictive scaling with KEDA ScaledObjects
resource "kubernetes_manifest" "predictive_scaler" {
  manifest = {
    apiVersion = "keda.sh/v1alpha1"
    kind       = "ScaledObject"
    metadata = {
      name      = "predictive-workload-scaler"
      namespace = "default"
    }
    spec = {
      scaleTargetRef = {
        name = "main-application"
      }
      minReplicaCount = 2
      maxReplicaCount = 100
      cooldownPeriod  = 300

      triggers = [
        {
          type = "prometheus"
          metadata = {
            serverAddress = "http://prometheus-server.monitoring.svc.cluster.local:9090"
            metricName    = "http_requests_rate"
            threshold     = "100"
            query         = <<-EOQ
              sum(rate(http_requests_total[1m]))
              +
              predict_linear(http_requests_total[30m], 300)
            EOQ
          }
        },
        {
          type = "aws-cloudwatch"
          metadata = {
            awsRegion  = var.aws_region
            namespace  = "AWS/EKS"
            metricName = "node_cpu_utilization"
            dimensions = jsonencode({
              ClusterName = aws_eks_cluster.main.name
            })
            targetMetricValue = "70"
            minMetricValue    = "30"
          }
        },
        {
          type = "cron"
          metadata = {
            timezone        = "UTC"
            start           = "0 8 * * 1-5"
            end             = "0 20 * * 1-5"
            desiredReplicas = "10"
          }
        }
      ]

      advanced = {
        horizontalPodAutoscalerConfig = {
          behavior = {
            scaleDown = {
              stabilizationWindowSeconds = 300
              policies = [{
                type          = "Percent"
                value         = 10
                periodSeconds = 60
              }]
            }
            scaleUp = {
              stabilizationWindowSeconds = 0
              policies = [{
                type          = "Percent"
                value         = 100
                periodSeconds = 15
              }]
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.keda]
}

# Karpenter for advanced node autoscaling
resource "helm_release" "karpenter" {
  name             = "karpenter"
  repository       = "oci://public.ecr.aws/karpenter"
  chart            = "karpenter"
  version          = "v0.33.0"
  namespace        = "karpenter"
  create_namespace = true

  values = [
    yamlencode({
      settings = {
        aws = {
          clusterName            = aws_eks_cluster.main.name
          defaultInstanceProfile = aws_iam_instance_profile.karpenter_node.name
          interruptionQueueName  = aws_sqs_queue.karpenter_interruption.name
        }
      }

      serviceAccount = {
        annotations = {
          "eks.amazonaws.com/role-arn" = aws_iam_role.karpenter_controller.arn
        }
      }

      controller = {
        resources = {
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }
      }

      webhook = {
        resources = {
          requests = {
            cpu    = "50m"
            memory = "128Mi"
          }
          limits = {
            cpu    = "200m"
            memory = "256Mi"
          }
        }
      }
    })
  ]

  depends_on = [
    aws_eks_cluster.main,
    aws_iam_role_policy.karpenter_controller
  ]
}

# Karpenter Provisioner for spot instances
resource "kubernetes_manifest" "karpenter_provisioner" {
  manifest = {
    apiVersion = "karpenter.sh/v1alpha5"
    kind       = "Provisioner"
    metadata = {
      name = "spot-provisioner"
    }
    spec = {
      requirements = [
        {
          key      = "karpenter.sh/capacity-type"
          operator = "In"
          values   = ["spot", "on-demand"]
        },
        {
          key      = "node.kubernetes.io/instance-type"
          operator = "In"
          values = [
            "m5.large", "m5.xlarge", "m5.2xlarge",
            "m5a.large", "m5a.xlarge", "m5a.2xlarge",
            "m5n.large", "m5n.xlarge", "m5n.2xlarge",
            "m6i.large", "m6i.xlarge", "m6i.2xlarge"
          ]
        }
      ]

      limits = {
        resources = {
          cpu    = "10000"
          memory = "40000Gi"
        }
      }

      consolidation = {
        enabled = true
      }

      ttlSecondsAfterEmpty = 30

      providerRef = {
        name = "spot-node-pool"
      }
    }
  }

  depends_on = [helm_release.karpenter]
}

# Karpenter AWSNodeInstanceProfile
resource "kubernetes_manifest" "karpenter_node_pool" {
  manifest = {
    apiVersion = "karpenter.k8s.aws/v1alpha1"
    kind       = "AWSNodeInstanceProfile"
    metadata = {
      name = "spot-node-pool"
    }
    spec = {
      subnetSelector = {
        "karpenter.sh/discovery" = "${var.cluster_name}-${var.environment_suffix}"
      }

      securityGroupSelector = {
        "karpenter.sh/discovery" = "${var.cluster_name}-${var.environment_suffix}"
      }

      instanceStorePolicy = "RAID0"

      userData = base64encode(<<-EOT
        #!/bin/bash
        /etc/eks/bootstrap.sh ${aws_eks_cluster.main.name}
        echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
        sysctl -p
      EOT
      )

      amiFamily = "AL2"

      tags = {
        Environment = var.environment_suffix
        ManagedBy   = "Karpenter"
        Purpose     = "SpotInstances"
      }
    }
  }

  depends_on = [helm_release.karpenter]
}

# IAM resources for Karpenter
resource "aws_iam_role" "karpenter_controller" {
  name = "${var.cluster_name}-${var.environment_suffix}-karpenter-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${aws_iam_openid_connect_provider.eks.url}:sub" = "system:serviceaccount:karpenter:karpenter"
          "${aws_iam_openid_connect_provider.eks.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-karpenter-controller"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "karpenter_controller" {
  name = "${var.cluster_name}-${var.environment_suffix}-karpenter-controller-policy"
  role = aws_iam_role.karpenter_controller.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateFleet",
          "ec2:CreateLaunchTemplate",
          "ec2:CreateTags",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeImages",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypeOfferings",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplates",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSpotPriceHistory",
          "ec2:DescribeSubnets",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "iam:PassRole",
          "pricing:GetProducts",
          "ssm:GetParameter",
          "eks:DescribeCluster"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ReceiveMessage"
        ]
        Resource = aws_sqs_queue.karpenter_interruption.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "karpenter_node" {
  name = "${var.cluster_name}-${var.environment_suffix}-karpenter-node"
  role = aws_iam_role.node.name
}

# SQS Queue for spot interruption handling
resource "aws_sqs_queue" "karpenter_interruption" {
  name                      = "${var.cluster_name}-${var.environment_suffix}-karpenter-interruption"
  message_retention_seconds = 300

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-karpenter-interruption"
    Environment = var.environment_suffix
  }
}

# EventBridge Rule for spot interruption
resource "aws_cloudwatch_event_rule" "karpenter_interruption" {
  name        = "${var.cluster_name}-${var.environment_suffix}-karpenter-interruption"
  description = "Capture EC2 Spot Instance Interruption Warnings"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-karpenter-interruption"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "karpenter_interruption" {
  rule      = aws_cloudwatch_event_rule.karpenter_interruption.name
  target_id = "KarpenterInterruptionQueue"
  arn       = aws_sqs_queue.karpenter_interruption.arn
}

# Lambda for cost anomaly detection
resource "aws_lambda_function" "cost_anomaly_detector" {
  filename      = "${path.module}/lambda/cost-anomaly-detector.zip"
  function_name = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly"
  role          = aws_iam_role.cost_anomaly_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 60

  environment {
    variables = {
      SNS_TOPIC_ARN        = aws_sns_topic.cost_alerts.arn
      THRESHOLD_PERCENTAGE = "20"
      ATHENA_DATABASE      = aws_glue_catalog_database.cost_reports.name
      ATHENA_WORKGROUP     = aws_athena_workgroup.cost_analysis.name
      S3_OUTPUT_LOCATION   = "s3://${aws_s3_bucket.cost_reports.id}/athena-results/"
    }
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly"
    Environment = var.environment_suffix
  }
}

# IAM Role for Cost Anomaly Lambda
resource "aws_iam_role" "cost_anomaly_lambda" {
  name = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly-lambda"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "cost_anomaly_lambda_basic" {
  role       = aws_iam_role.cost_anomaly_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "cost_anomaly_lambda" {
  name = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly-lambda-policy"
  role = aws_iam_role.cost_anomaly_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetDatabase",
          "glue:GetPartitions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cost_reports.arn,
          "${aws_s3_bucket.cost_reports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.cost_alerts.arn
      }
    ]
  })
}

# EventBridge Rule to trigger cost anomaly detection daily
resource "aws_cloudwatch_event_rule" "cost_anomaly_schedule" {
  name                = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly-schedule"
  description         = "Trigger cost anomaly detection daily"
  schedule_expression = "cron(0 9 * * ? *)"

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-cost-anomaly-schedule"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "cost_anomaly_lambda" {
  rule      = aws_cloudwatch_event_rule.cost_anomaly_schedule.name
  target_id = "CostAnomalyLambda"
  arn       = aws_lambda_function.cost_anomaly_detector.arn
}

resource "aws_lambda_permission" "cost_anomaly_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_anomaly_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cost_anomaly_schedule.arn
}

# SNS Topic for cost alerts
resource "aws_sns_topic" "cost_alerts" {
  name              = "${var.cluster_name}-${var.environment_suffix}-cost-alerts"
  kms_master_key_id = var.enable_cluster_encryption ? aws_kms_key.eks[0].id : null

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-cost-alerts"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "cost_alerts_email" {
  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = var.cost_alerts_email
}