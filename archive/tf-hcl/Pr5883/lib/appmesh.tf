# App Mesh
resource "aws_appmesh_mesh" "main" {
  name = "mesh-microservices-${var.environment_suffix}"

  spec {
    egress_filter {
      type = "ALLOW_ALL"
    }
  }

  tags = {
    Name = "mesh-microservices-${var.environment_suffix}"
  }
}

# App Mesh Virtual Nodes
resource "aws_appmesh_virtual_node" "services" {
  for_each = var.service_config

  name      = "vnode-${each.key}-${var.environment_suffix}"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    listener {
      port_mapping {
        port     = each.value.port
        protocol = "http"
      }

      health_check {
        protocol            = "http"
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        timeout_millis      = 5000
        interval_millis     = 30000
      }
    }

    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.main.name
        service_name   = aws_service_discovery_service.services[each.key].name
      }
    }

    dynamic "backend" {
      for_each = [for svc in keys(var.service_config) : svc if svc != each.key]
      content {
        virtual_service {
          virtual_service_name = "${backend.value}.${aws_service_discovery_private_dns_namespace.main.name}"
        }
      }
    }
  }

  tags = {
    Name    = "vnode-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# App Mesh Virtual Services
resource "aws_appmesh_virtual_service" "services" {
  for_each = var.service_config

  name      = "${each.key}.${aws_service_discovery_private_dns_namespace.main.name}"
  mesh_name = aws_appmesh_mesh.main.name

  spec {
    provider {
      virtual_node {
        virtual_node_name = aws_appmesh_virtual_node.services[each.key].name
      }
    }
  }

  tags = {
    Name    = "vservice-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}

# Service Discovery Private DNS Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "microservices.local"
  vpc  = aws_vpc.main.id

  tags = {
    Name = "sd-namespace-${var.environment_suffix}"
  }
}

# Service Discovery Services
resource "aws_service_discovery_service" "services" {
  for_each = var.service_config

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
    Name    = "sd-service-${each.key}-${var.environment_suffix}"
    Service = each.key
  }
}
