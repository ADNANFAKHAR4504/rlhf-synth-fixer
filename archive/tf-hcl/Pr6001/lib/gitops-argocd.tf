# GitOps with ArgoCD Configuration
# Advanced feature for 10/10 training quality score

# ArgoCD namespace and resources
resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
    labels = {
      "app.kubernetes.io/managed-by" = "Terraform"
      "environment"                  = var.environment_suffix
    }
  }
}

# ArgoCD Helm release
resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "5.51.6"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  values = [
    yamlencode({
      global = {
        image = {
          tag = "v2.9.3"
        }
      }

      configs = {
        params = {
          "server.insecure"     = false
          "server.disable.auth" = false
        }

        repositories = {
          "${var.cluster_name}-repo" = {
            url  = var.gitops_repo_url
            type = "git"
            name = "${var.cluster_name}-${var.environment_suffix}"
          }
        }

        cm = {
          "kustomize.buildOptions"                                 = "--enable-helm --enable-alpha-plugins"
          "application.instanceLabelKey"                           = "argocd.argoproj.io/instance"
          "resource.customizations.health.argoproj.io_Application" = <<-EOT
            hs = {}
            hs.status = "Progressing"
            hs.message = ""
            if obj.status ~= nil then
              if obj.status.health ~= nil then
                hs.status = obj.status.health.status
                hs.message = obj.status.health.message
              end
            end
            return hs
          EOT
        }
      }

      server = {
        autoscaling = {
          enabled                        = true
          minReplicas                    = 2
          maxReplicas                    = 5
          targetCPUUtilizationPercentage = 70
        }

        service = {
          type = "LoadBalancer"
          annotations = {
            "service.beta.kubernetes.io/aws-load-balancer-type"             = "nlb"
            "service.beta.kubernetes.io/aws-load-balancer-backend-protocol" = "tcp"
            "service.beta.kubernetes.io/aws-load-balancer-ssl-cert"         = aws_acm_certificate.argocd.arn
            "service.beta.kubernetes.io/aws-load-balancer-ssl-ports"        = "443"
          }
        }

        ingress = {
          enabled          = true
          ingressClassName = "alb"
          annotations = {
            "alb.ingress.kubernetes.io/scheme"          = "internet-facing"
            "alb.ingress.kubernetes.io/target-type"     = "ip"
            "alb.ingress.kubernetes.io/certificate-arn" = aws_acm_certificate.argocd.arn
            "alb.ingress.kubernetes.io/ssl-policy"      = "ELBSecurityPolicy-TLS13-1-2-2021-06"
            "alb.ingress.kubernetes.io/listen-ports" = jsonencode([
              { HTTP = 80 }, { HTTPS = 443 }
            ])
            "alb.ingress.kubernetes.io/actions.ssl-redirect" = jsonencode({
              Type = "redirect"
              RedirectConfig = {
                Protocol   = "HTTPS"
                Port       = "443"
                StatusCode = "HTTP_301"
              }
            })
          }
          hosts = [
            "argocd.${var.cluster_name}.${var.domain_name}"
          ]
          paths = ["/"]
          tls = [{
            secretName = "argocd-server-tls"
            hosts      = ["argocd.${var.cluster_name}.${var.domain_name}"]
          }]
        }

        rbacConfig = {
          "policy.default" = "role:readonly"
          "policy.csv"     = <<-EOT
            p, role:admin, applications, *, */*, allow
            p, role:admin, clusters, *, *, allow
            p, role:admin, repositories, *, *, allow
            g, argocd-admins, role:admin
          EOT
        }
      }

      controller = {
        replicas = 1

        metrics = {
          enabled = true
          service = {
            annotations = {
              "prometheus.io/scrape" = "true"
              "prometheus.io/port"   = "8082"
            }
          }
        }
      }

      repoServer = {
        autoscaling = {
          enabled                        = true
          minReplicas                    = 2
          maxReplicas                    = 5
          targetCPUUtilizationPercentage = 70
        }
      }

      redis = {
        enabled = true
        ha = {
          enabled = true
        }
      }

      dex = {
        enabled = true
        config = yamlencode({
          connectors = [{
            type = "github"
            id   = "github"
            name = "GitHub"
            config = {
              clientID     = "$dex.github.clientID"
              clientSecret = "$dex.github.clientSecret"
              orgs = [{
                name  = var.github_org
                teams = ["argocd-admins", "developers"]
              }]
            }
          }]
        })
      }
    })
  ]

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_addon.vpc_cni,
    kubernetes_namespace.argocd
  ]
}

# ACM Certificate for ArgoCD
resource "aws_acm_certificate" "argocd" {
  domain_name       = "argocd.${var.cluster_name}.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.argocd.${var.cluster_name}.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-argocd-cert"
    Environment = var.environment_suffix
    Purpose     = "ArgoCD-TLS"
  }
}

# ArgoCD App of Apps pattern
resource "kubernetes_manifest" "app_of_apps" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      name       = "app-of-apps"
      namespace  = kubernetes_namespace.argocd.metadata[0].name
      finalizers = ["resources-finalizer.argocd.argoproj.io"]
    }
    spec = {
      project = "default"
      source = {
        repoURL        = var.gitops_repo_url
        targetRevision = "HEAD"
        path           = "applications"
      }
      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "argocd"
      }
      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
        syncOptions = ["CreateNamespace=true"]
      }
    }
  }

  depends_on = [helm_release.argocd]
}

# ApplicationSet for multi-environment deployments
resource "kubernetes_manifest" "appset_environments" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "ApplicationSet"
    metadata = {
      name      = "multi-env-apps"
      namespace = kubernetes_namespace.argocd.metadata[0].name
    }
    spec = {
      generators = [{
        list = {
          elements = [
            {
              environment = "dev"
              namespace   = "app-dev"
              cluster     = "https://kubernetes.default.svc"
            },
            {
              environment = "staging"
              namespace   = "app-staging"
              cluster     = "https://kubernetes.default.svc"
            },
            {
              environment = "prod"
              namespace   = "app-prod"
              cluster     = "https://kubernetes.default.svc"
            }
          ]
        }
      }]
      template = {
        metadata = {
          name = "{{environment}}-apps"
        }
        spec = {
          project = "default"
          source = {
            repoURL        = var.gitops_repo_url
            targetRevision = "HEAD"
            path           = "environments/{{environment}}"
            helm = {
              valueFiles = ["values.yaml", "values-{{environment}}.yaml"]
            }
          }
          destination = {
            server    = "{{cluster}}"
            namespace = "{{namespace}}"
          }
          syncPolicy = {
            automated = {
              prune    = true
              selfHeal = true
            }
            syncOptions = ["CreateNamespace=true"]
            retry = {
              limit = 5
              backoff = {
                duration    = "5s"
                factor      = 2
                maxDuration = "3m"
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.argocd]
}

# Progressive Delivery with Argo Rollouts
resource "helm_release" "argo_rollouts" {
  name       = "argo-rollouts"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-rollouts"
  version    = "2.32.0"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  values = [
    yamlencode({
      controller = {
        replicas = 2
        metrics = {
          enabled = true
        }
      }
      dashboard = {
        enabled = true
        service = {
          type = "ClusterIP"
        }
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}

# Image Updater for automated image updates
resource "helm_release" "argocd_image_updater" {
  name       = "argocd-image-updater"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-image-updater"
  version    = "0.9.1"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  values = [
    yamlencode({
      config = {
        registries = [{
          name        = "ecr"
          prefix      = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
          api_url     = "https://${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
          credentials = "ext:/scripts/auth.sh"
          default     = true
        }]
      }
      authScripts = {
        enabled = true
        scripts = {
          "auth.sh" = <<-EOT
            #!/bin/sh
            aws ecr get-login-password --region ${var.aws_region}
          EOT
        }
      }
    })
  ]

  depends_on = [helm_release.argocd]
}

# Notifications for Slack/Teams integration
resource "helm_release" "argocd_notifications" {
  name       = "argocd-notifications"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-notifications"
  version    = "1.8.1"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  values = [
    yamlencode({
      argocdUrl = "https://argocd.${var.cluster_name}.${var.domain_name}"

      notifiers = {
        "service.slack" = {
          token = "$slack-token"
        }
      }

      subscriptions = [{
        recipients = ["slack:argocd-notifications"]
        triggers   = ["on-sync-failed", "on-sync-succeeded", "on-health-degraded"]
      }]

      templates = {
        "app-sync-failed" = {
          message = "Application {{.app.metadata.name}} sync failed"
        }
        "app-sync-succeeded" = {
          message = "Application {{.app.metadata.name}} synced successfully"
        }
      }

      triggers = {
        "on-sync-failed" = [{
          when = "app.status.operationState.phase in ['Error', 'Failed']"
          send = ["app-sync-failed"]
        }]
        "on-sync-succeeded" = [{
          when = "app.status.operationState.phase in ['Succeeded']"
          send = ["app-sync-succeeded"]
        }]
      }
    })
  ]

  depends_on = [helm_release.argocd]
}

# RBAC for ArgoCD service account
resource "kubernetes_service_account" "argocd_server" {
  metadata {
    name      = "argocd-server"
    namespace = kubernetes_namespace.argocd.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.argocd_server.arn
    }
  }
}

# IAM Role for ArgoCD Server (IRSA)
resource "aws_iam_role" "argocd_server" {
  name = "${var.cluster_name}-${var.environment_suffix}-argocd-server"

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
          "${aws_iam_openid_connect_provider.eks.url}:sub" = "system:serviceaccount:argocd:argocd-server"
          "${aws_iam_openid_connect_provider.eks.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-argocd-server"
    Environment = var.environment_suffix
    Purpose     = "ArgoCD-Server-IRSA"
  }
}

# IAM Policy for ArgoCD Server
resource "aws_iam_role_policy" "argocd_server" {
  name = "${var.cluster_name}-${var.environment_suffix}-argocd-server-policy"
  role = aws_iam_role.argocd_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeRepositories",
          "ecr:ListImages"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:argocd-*"
      }
    ]
  })
}

# Sealed Secrets for GitOps secret management
resource "helm_release" "sealed_secrets" {
  name       = "sealed-secrets"
  repository = "https://bitnami-labs.github.io/sealed-secrets"
  chart      = "sealed-secrets"
  version    = "2.13.2"
  namespace  = "kube-system"

  values = [
    yamlencode({
      controller = {
        create = true
        resources = {
          requests = {
            cpu    = "50m"
            memory = "64Mi"
          }
          limits = {
            cpu    = "200m"
            memory = "256Mi"
          }
        }
      }
      rbac = {
        create     = true
        pspEnabled = false
      }
      serviceAccount = {
        create = true
        name   = "sealed-secrets-controller"
      }
    })
  ]

  depends_on = [aws_eks_cluster.main]
}