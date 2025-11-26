# Autoscaler integrations (service account, eventing, monitoring)

locals {
  autoscaler_alarm_targets = {
    frontend = aws_eks_node_group.frontend.resources[0].autoscaling_groups[0].name
    backend  = aws_eks_node_group.backend.resources[0].autoscaling_groups[0].name
  }
}

resource "kubernetes_service_account" "cluster_autoscaler" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name      = "cluster-autoscaler-${var.environment_suffix}"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.cluster_autoscaler.arn
    }

    labels = {
      "app.kubernetes.io/name"       = "cluster-autoscaler"
      "app.kubernetes.io/managed-by" = "terraform"
      environment                    = "production"
    }
  }

  depends_on = [
    aws_iam_role.cluster_autoscaler,
    aws_iam_openid_connect_provider.eks,
    aws_eks_cluster.main
  ]
}

resource "aws_sns_topic" "eks_alerts" {
  name = local.sns_topic_name
  # KMS encryption removed to avoid key state issues
  # kms_master_key_id = aws_kms_key.eks.arn

  tags = local.common_tags
}

resource "aws_sns_topic_policy" "eks_alerts" {
  arn = aws_sns_topic.eks_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudwatch.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.eks_alerts.arn
    }]
  })
}

resource "aws_cloudwatch_metric_alarm" "node_scale_up" {
  for_each = local.autoscaler_alarm_targets

  alarm_name          = "${local.cluster_name}-${each.key}-scale-up"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DesiredCapacity"
  namespace           = "AWS/AutoScaling"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Detects when the ${each.key} node group scales up."
  alarm_actions       = [aws_sns_topic.eks_alerts.arn]

  dimensions = {
    AutoScalingGroupName = each.value
  }

  tags = local.common_tags

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend
  ]
}

resource "aws_cloudwatch_metric_alarm" "node_scale_down" {
  for_each = local.autoscaler_alarm_targets

  alarm_name          = "${local.cluster_name}-${each.key}-scale-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DesiredCapacity"
  namespace           = "AWS/AutoScaling"
  period              = 300
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Detects when the ${each.key} node group scales down below desired capacity."
  alarm_actions       = [aws_sns_topic.eks_alerts.arn]

  dimensions = {
    AutoScalingGroupName = each.value
  }

  tags = local.common_tags

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend
  ]
}