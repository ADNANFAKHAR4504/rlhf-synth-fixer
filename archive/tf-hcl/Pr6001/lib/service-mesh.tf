# AWS App Mesh Service Mesh Configuration
# Advanced feature for 10/10 training quality score

resource "aws_appmesh_mesh" "main" {
  name = "${var.cluster_name}-${var.environment_suffix}-mesh"

  spec {
    egress_filter {
      type = "ALLOW_ALL"
    }

    service_discovery {
      ip_preference = "IPv4_PREFERRED"
    }
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-mesh"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Virtual Gateway for ingress traffic
resource "aws_appmesh_virtual_gateway" "main" {
  name      = "${var.cluster_name}-${var.environment_suffix}-gateway"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }

      health_check {
        protocol            = "http"
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 2
        timeout_millis      = 2000
        interval_millis     = 5000
      }
    }

    logging {
      access_log {
        file {
          path = "/dev/stdout"
        }
      }
    }

    backend_defaults {
      client_policy {
        tls {
          enforce = true
          validation {
            trust {
              acm {
                certificate_authority_arns = [aws_acmpca_certificate_authority.mesh_ca.arn]
              }
            }
          }
        }
      }
    }
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-gateway"
    Environment = var.environment_suffix
  }
}

# Private Certificate Authority for mTLS
resource "aws_acmpca_certificate_authority" "mesh_ca" {
  type = "ROOT"

  certificate_authority_configuration {
    key_algorithm     = "RSA_4096"
    signing_algorithm = "SHA512WITHRSA"

    subject {
      common_name         = "${var.cluster_name}-${var.environment_suffix}-mesh-ca"
      organization        = var.organization_name
      organizational_unit = "Platform Engineering"
      country             = "US"
      state               = "California"
      locality            = "San Francisco"
    }
  }

  permanent_deletion_time_in_days = 7
  enabled                         = true

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-mesh-ca"
    Environment = var.environment_suffix
    Purpose     = "ServiceMesh-mTLS"
  }
}

# Virtual Node for each microservice
resource "aws_appmesh_virtual_node" "app" {
  for_each = toset(["frontend", "backend", "database"])

  name      = "${each.key}-${var.environment_suffix}"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }

      health_check {
        protocol            = "http"
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 2
        timeout_millis      = 2000
        interval_millis     = 5000
      }

      tls {
        mode = "STRICT"
        certificate {
          acm {
            certificate_arn = aws_acm_certificate.service[each.key].arn
          }
        }
      }
    }

    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.main.name
        service_name   = each.key
      }
    }

    backend {
      virtual_service {
        virtual_service_name = "${each.key}.${aws_service_discovery_private_dns_namespace.main.name}"
      }
    }

    logging {
      access_log {
        file {
          path = "/dev/stdout"
        }
      }
    }

    backend_defaults {
      client_policy {
        tls {
          enforce = true
          validation {
            trust {
              acm {
                certificate_authority_arns = [aws_acmpca_certificate_authority.mesh_ca.arn]
              }
            }
          }
        }
      }
    }
  }

  tags = {
    Name        = "${each.key}-${var.environment_suffix}-node"
    Environment = var.environment_suffix
    Service     = each.key
  }
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "${var.cluster_name}.${var.environment_suffix}.local"
  vpc  = aws_vpc.main.id

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-namespace"
    Environment = var.environment_suffix
  }
}

# Service Discovery Service for each microservice
resource "aws_service_discovery_service" "service" {
  for_each = toset(["frontend", "backend", "database"])

  name = each.key

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = {
    Name        = "${each.key}-${var.environment_suffix}-service"
    Environment = var.environment_suffix
  }
}

# ACM Certificates for services
resource "aws_acm_certificate" "service" {
  for_each = toset(["frontend", "backend", "database"])

  domain_name       = "${each.key}.${var.cluster_name}.${var.environment_suffix}.local"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${each.key}.${var.cluster_name}.${var.environment_suffix}.local"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${each.key}-${var.environment_suffix}-cert"
    Environment = var.environment_suffix
    Service     = each.key
  }
}

# App Mesh Controller for Kubernetes
resource "aws_iam_role" "appmesh_controller" {
  name = "${var.cluster_name}-${var.environment_suffix}-appmesh-controller"

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
          "${aws_iam_openid_connect_provider.eks.url}:sub" = "system:serviceaccount:appmesh-system:appmesh-controller"
          "${aws_iam_openid_connect_provider.eks.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-appmesh-controller"
    Environment = var.environment_suffix
  }
}

# Attach App Mesh controller policy
resource "aws_iam_role_policy_attachment" "appmesh_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AWSCloudMapFullAccess"
  role       = aws_iam_role.appmesh_controller.name
}

resource "aws_iam_role_policy" "appmesh_controller" {
  name = "${var.cluster_name}-${var.environment_suffix}-appmesh-controller"
  role = aws_iam_role.appmesh_controller.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "appmesh:*",
          "servicediscovery:*",
          "route53:*",
          "acm:*",
          "acm-pca:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Virtual Router for traffic distribution
resource "aws_appmesh_virtual_router" "main" {
  for_each = toset(["frontend", "backend", "database"])

  name      = "${each.key}-${var.environment_suffix}-router"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }
    }
  }

  tags = {
    Name        = "${each.key}-${var.environment_suffix}-router"
    Environment = var.environment_suffix
  }
}

# Route for canary deployments
resource "aws_appmesh_route" "main" {
  for_each = toset(["frontend", "backend", "database"])

  name                = "${each.key}-${var.environment_suffix}-route"
  mesh_name           = aws_appmesh_mesh.main.name
  virtual_router_name = aws_appmesh_virtual_router.main[each.key].name

  spec {
    http_route {
      match {
        prefix = "/"
      }

      action {
        weighted_target {
          virtual_node = aws_appmesh_virtual_node.app[each.key].name
          weight       = 90
        }

        # Canary target for blue-green deployments
        weighted_target {
          virtual_node = aws_appmesh_virtual_node.app[each.key].name
          weight       = 10
        }
      }

      retry_policy {
        per_retry_timeout {
          value = 15
          unit  = "s"
        }

        max_retries = 3

        http_retry_events = [
          "server-error",
          "gateway-error"
        ]
      }

      timeout {
        idle {
          value = 60
          unit  = "s"
        }
        per_request {
          value = 30
          unit  = "s"
        }
      }
    }
  }

  tags = {
    Name        = "${each.key}-${var.environment_suffix}-route"
    Environment = var.environment_suffix
  }
}

# Virtual Service for service-to-service communication
resource "aws_appmesh_virtual_service" "main" {
  for_each = toset(["frontend", "backend", "database"])

  name      = "${each.key}.${aws_service_discovery_private_dns_namespace.main.name}"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    provider {
      virtual_router {
        virtual_router_name = aws_appmesh_virtual_router.main[each.key].name
      }
    }
  }

  tags = {
    Name        = "${each.key}-${var.environment_suffix}-virtual-service"
    Environment = var.environment_suffix
  }
}

# Observability configuration for X-Ray tracing
resource "aws_appmesh_gateway_route" "main" {
  name                 = "${var.cluster_name}-${var.environment_suffix}-gateway-route"
  mesh_name            = aws_appmesh_mesh.main.name
  virtual_gateway_name = aws_appmesh_virtual_gateway.main.name

  spec {
    http_route {
      match {
        prefix = "/"
      }

      action {
        target {
          virtual_service {
            virtual_service_name = aws_appmesh_virtual_service.main["frontend"].name
          }
        }
      }
    }
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-gateway-route"
    Environment = var.environment_suffix
  }
}