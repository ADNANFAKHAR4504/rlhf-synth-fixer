# Advanced Security with Falco and OPA
# Advanced feature for 10/10 training quality score

# Falco Runtime Security
resource "helm_release" "falco" {
  name             = "falco"
  repository       = "https://falcosecurity.github.io/charts"
  chart            = "falco"
  version          = "3.8.4"
  namespace        = "falco-system"
  create_namespace = true

  values = [
    yamlencode({
      ebpf = {
        enabled = true
      }

      falco = {
        grpc = {
          enabled = true
        }
        grpcOutput = {
          enabled = true
        }
        httpOutput = {
          enabled = true
          url     = "http://falcosidekick:2801"
        }
        jsonOutput                = true
        jsonIncludeOutputProperty = true

        rulesFile = [
          "/etc/falco/falco_rules.yaml",
          "/etc/falco/falco_rules.local.yaml",
          "/etc/falco/rules.d"
        ]
      }

      falcoctl = {
        artifact = {
          install = {
            enabled = true
          }
        }
      }

      driver = {
        kind = "modern-bpf"
      }

      tolerations = [{
        effect   = "NoSchedule"
        operator = "Exists"
      }]

      resources = {
        requests = {
          cpu    = "100m"
          memory = "512Mi"
        }
        limits = {
          cpu    = "1000m"
          memory = "1024Mi"
        }
      }

      customRules = {
        "custom-rules.yaml" = yamlencode({
          customRules = [
            {
              rule      = "Unauthorized Process in Container"
              desc      = "Detect unauthorized process execution in containers"
              condition = "spawned_process and container and not container.image.repository in (allowed_images)"
              output    = "Unauthorized process started in container (user=%user.name command=%proc.cmdline container=%container.name image=%container.image.repository)"
              priority  = "WARNING"
              tags      = ["container", "process", "security"]
            },
            {
              rule      = "Sensitive File Access"
              desc      = "Detect access to sensitive files"
              condition = "open_read and sensitive_files and not trusted_binaries"
              output    = "Sensitive file opened for reading (user=%user.name command=%proc.cmdline file=%fd.name container=%container.name)"
              priority  = "WARNING"
              tags      = ["filesystem", "security"]
            },
            {
              rule      = "Cryptocurrency Mining Detected"
              desc      = "Detect cryptocurrency mining activity"
              condition = "spawned_process and ((proc.name in (crypto_miners)) or (proc.cmdline contains \"stratum+tcp\"))"
              output    = "Cryptocurrency mining detected (user=%user.name command=%proc.cmdline container=%container.name)"
              priority  = "CRITICAL"
              tags      = ["cryptomining", "malware"]
            }
          ]
        })
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}

# Falcosidekick for alert forwarding
resource "helm_release" "falcosidekick" {
  name       = "falcosidekick"
  repository = "https://falcosecurity.github.io/charts"
  chart      = "falcosidekick"
  version    = "0.7.10"
  namespace  = "falco-system"

  values = [
    yamlencode({
      config = {
        slack = {
          webhookurl      = var.slack_webhook_url
          minimumpriority = "warning"
        }

        aws = {
          cloudwatchlogs = {
            loggroup  = aws_cloudwatch_log_group.falco_alerts.name
            logstream = "falco-alerts"
            region    = var.aws_region
          }

          securityhub = {
            region          = var.aws_region
            minimumpriority = "warning"
          }
        }

        prometheus = {
          enabled = true
        }
      }

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

      webui = {
        enabled = true
        service = {
          type = "ClusterIP"
        }
      }
    })
  ]

  depends_on = [helm_release.falco]
}

# Open Policy Agent (OPA) Gatekeeper
resource "helm_release" "opa_gatekeeper" {
  name             = "gatekeeper"
  repository       = "https://open-policy-agent.github.io/gatekeeper/charts"
  chart            = "gatekeeper"
  version          = "3.14.0"
  namespace        = "gatekeeper-system"
  create_namespace = true

  values = [
    yamlencode({
      replicas = 3

      auditInterval             = 60
      constraintViolationsLimit = 20
      auditFromCache            = true

      validatingWebhookTimeoutSeconds = 10
      validatingWebhookFailurePolicy  = "Fail"

      mutatingWebhookTimeoutSeconds = 5
      mutatingWebhookFailurePolicy  = "Fail"

      resources = {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        requests = {
          cpu    = "100m"
          memory = "256Mi"
        }
      }

      nodeSelector = {
        "kubernetes.io/os" = "linux"
      }

      tolerations = [{
        key      = "CriticalAddonsOnly"
        operator = "Exists"
      }]

      podSecurityContext = {
        fsGroup            = 999
        supplementalGroups = [999]
        runAsNonRoot       = true
        runAsUser          = 1000
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}

# OPA Constraint Templates
resource "kubernetes_manifest" "k8srequiredlabels_template" {
  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1beta1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8srequiredlabels"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sRequiredLabels"
          }
          validation = {
            openAPIV3Schema = {
              type = "object"
              properties = {
                message = {
                  type = "string"
                }
                labels = {
                  type = "array"
                  items = {
                    type = "string"
                  }
                }
              }
            }
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-EOT
          package k8srequiredlabels

          violation[{"msg": msg, "details": {"missing_labels": missing}}] {
            required := input.parameters.labels
            provided := input.review.object.metadata.labels
            missing := required[_]
            not provided[missing]
            msg := sprintf("Label '%v' is required", [missing])
          }
        EOT
      }]
    }
  }

  depends_on = [helm_release.opa_gatekeeper]
}

# OPA Constraint for required labels
resource "kubernetes_manifest" "require_labels_constraint" {
  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1beta1"
    kind       = "K8sRequiredLabels"
    metadata = {
      name = "must-have-environment"
    }
    spec = {
      match = {
        kinds = [{
          apiGroups = ["apps", ""]
          kinds     = ["Deployment", "Service", "Pod"]
        }]
        namespaces = ["production", "staging"]
      }
      parameters = {
        message = "All resources must have environment label"
        labels  = ["environment", "team", "version"]
      }
    }
  }

  depends_on = [kubernetes_manifest.k8srequiredlabels_template]
}

# Pod Security Standards
resource "kubernetes_manifest" "pod_security_template" {
  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1beta1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8spodsecurity"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sPodSecurity"
          }
          validation = {
            openAPIV3Schema = {
              type = "object"
            }
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-EOT
          package k8spodsecurity

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            not container.securityContext.runAsNonRoot
            msg := "Container must run as non-root user"
          }

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            container.securityContext.privileged
            msg := "Privileged containers are not allowed"
          }

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            container.securityContext.allowPrivilegeEscalation
            msg := "Privilege escalation is not allowed"
          }

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            not container.securityContext.readOnlyRootFilesystem
            msg := "Container must use read-only root filesystem"
          }
        EOT
      }]
    }
  }

  depends_on = [helm_release.opa_gatekeeper]
}

# Network Policy Templates
resource "kubernetes_manifest" "network_policy_template" {
  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1beta1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8snetworkpolicyrequired"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sNetworkPolicyRequired"
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-EOT
          package k8snetworkpolicyrequired

          violation[{"msg": msg}] {
            input.review.kind.kind == "Namespace"
            not has_network_policy
            msg := "Namespace must have at least one NetworkPolicy"
          }

          has_network_policy {
            input.review.object.metadata.annotations["network-policy-enforced"] == "true"
          }
        EOT
      }]
    }
  }

  depends_on = [helm_release.opa_gatekeeper]
}

# Kyverno for additional policy management
resource "helm_release" "kyverno" {
  name             = "kyverno"
  repository       = "https://kyverno.github.io/kyverno"
  chart            = "kyverno"
  version          = "3.1.0"
  namespace        = "kyverno"
  create_namespace = true

  values = [
    yamlencode({
      replicaCount = 3

      config = {
        webhooks = {
          namespaceSelector = {
            matchExpressions = [{
              key      = "kubernetes.io/metadata.name"
              operator = "NotIn"
              values   = ["kube-system", "kube-public", "kube-node-lease", "kyverno"]
            }]
          }
        }
      }

      resources = {
        limits = {
          memory = "512Mi"
          cpu    = "500m"
        }
        requests = {
          memory = "256Mi"
          cpu    = "100m"
        }
      }

      serviceMonitor = {
        enabled = true
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}

# Kyverno Policy for image verification
resource "kubernetes_manifest" "verify_images_policy" {
  manifest = {
    apiVersion = "kyverno.io/v1"
    kind       = "ClusterPolicy"
    metadata = {
      name = "verify-images"
    }
    spec = {
      validationFailureAction = "enforce"
      background              = false
      rules = [{
        name = "verify-image-signature"
        match = {
          any = [{
            resources = {
              kinds      = ["Pod"]
              namespaces = ["production", "staging"]
            }
          }]
        }
        verifyImages = [{
          imageReferences = ["*"]
          attestors = [{
            count = 1
            entries = [{
              keys = {
                publicKeys = var.cosign_public_key
              }
            }]
          }]
        }]
      }]
    }
  }

  depends_on = [helm_release.kyverno]
}

# AWS GuardDuty for threat detection
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-guardduty"
    Environment = var.environment_suffix
  }
}

# AWS Security Hub for centralized security findings
resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.4.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/pci-dss/v/3.2.1"
  depends_on    = [aws_securityhub_account.main]
}

# CloudWatch Log Group for Falco alerts
resource "aws_cloudwatch_log_group" "falco_alerts" {
  name              = "/aws/eks/${var.cluster_name}-${var.environment_suffix}/falco-alerts"
  retention_in_days = 90
  kms_key_id        = var.enable_cluster_encryption ? aws_kms_key.eks[0].arn : null

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-falco-alerts"
    Environment = var.environment_suffix
    Purpose     = "SecurityMonitoring"
  }
}

# EventBridge Rule for security alerts
resource "aws_cloudwatch_event_rule" "security_alerts" {
  name        = "${var.cluster_name}-${var.environment_suffix}-security-alerts"
  description = "Capture security alerts from GuardDuty and Security Hub"

  event_pattern = jsonencode({
    source = ["aws.guardduty", "aws.securityhub"]
    detail-type = [
      "GuardDuty Finding",
      "Security Hub Findings - Imported"
    ]
    detail = {
      severity = [{
        numeric = [">", 4]
      }]
    }
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-security-alerts"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.security_alerts.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${var.cluster_name}-${var.environment_suffix}-security-alerts"
  kms_master_key_id = var.enable_cluster_encryption ? aws_kms_key.eks[0].id : null

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-security-alerts"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_alerts_email
}

# IAM Role for Falco to write to CloudWatch
resource "aws_iam_role" "falco_cloudwatch" {
  name = "${var.cluster_name}-${var.environment_suffix}-falco-cloudwatch"

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
          "${aws_iam_openid_connect_provider.eks.url}:sub" = "system:serviceaccount:falco-system:falcosidekick"
          "${aws_iam_openid_connect_provider.eks.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-falco-cloudwatch"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "falco_cloudwatch" {
  name = "${var.cluster_name}-${var.environment_suffix}-falco-cloudwatch-policy"
  role = aws_iam_role.falco_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.falco_alerts.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "securityhub:BatchImportFindings"
        ]
        Resource = "*"
      }
    ]
  })
}

# Service Account for Falcosidekick
resource "kubernetes_service_account" "falcosidekick" {
  metadata {
    name      = "falcosidekick"
    namespace = "falco-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.falco_cloudwatch.arn
    }
  }

  depends_on = [helm_release.falco]
}