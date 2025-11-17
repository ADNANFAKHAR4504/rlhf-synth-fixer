resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "local-${var.environmentSuffix}"
  description = "Private DNS namespace for service discovery"
  vpc         = aws_vpc.main.id

  tags = {
    Name = "service-discovery-namespace-${var.environmentSuffix}"
  }
}

resource "aws_service_discovery_service" "fraud_detection" {
  name = "fraud-detection"

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
    Name = "fraud-detection-service-discovery-${var.environmentSuffix}"
  }
}

resource "aws_service_discovery_service" "transaction_processor" {
  name = "transaction-processor"

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
    Name = "transaction-processor-service-discovery-${var.environmentSuffix}"
  }
}
