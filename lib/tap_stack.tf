# tap_stack.tf - VPC Peering with Network Monitoring

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_a_cidr" {
  description = "CIDR block for VPC-A"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_a_cidr, 0))
    error_message = "vpc_a_cidr must be a valid CIDR block."
  }
}

variable "vpc_b_cidr" {
  description = "CIDR block for VPC-B"
  type        = string
  default     = "10.1.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_b_cidr, 0))
    error_message = "vpc_b_cidr must be a valid CIDR block."
  }
}

variable "allowed_ports" {
  description = "List of allowed ports for cross-VPC communication"
  type        = list(string)
  default     = ["443", "8080", "3306"]

  validation {
    condition = alltrue([
      for port in var.allowed_ports : can(tonumber(port)) && tonumber(port) >= 1 && tonumber(port) <= 65535
    ])
    error_message = "All ports must be valid numbers between 1 and 65535."
  }
}

variable "retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.retention_days)
    error_message = "retention_days must be a valid CloudWatch Logs retention value."
  }
}

variable "traffic_volume_threshold" {
  description = "Threshold for traffic volume alarm (number of log entries)"
  type        = number
  default     = 500
}

variable "rejected_connections_threshold" {
  description = "Threshold for rejected connections alarm"
  type        = number
  default     = 50
}

variable "anomaly_threshold_percent" {
  description = "Percentage above baseline to trigger anomaly alert"
  type        = number
  default     = 20

  validation {
    condition     = var.anomaly_threshold_percent > 0 && var.anomaly_threshold_percent <= 100
    error_message = "anomaly_threshold_percent must be between 1 and 100."
  }
}

variable "traffic_baseline" {
  description = "Baseline traffic in requests per hour (10k daily = ~417/hour)"
  type        = number
  default     = 417
}

variable "lambda_schedule" {
  description = "Schedule expression for Lambda execution"
  type        = string
  default     = "rate(1 hour)"
}

variable "alert_email" {
  description = "Email address for alert notifications"
  type        = string
  sensitive   = true
}

variable "create_dashboard" {
  description = "Whether to create CloudWatch dashboard"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "Platform Team"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

resource "random_id" "suffix" {
  byte_length = 4
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  suffix = random_id.suffix.hex

  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Project     = "VPCPeering"
  }

  vpc_a_public_subnets = [
    cidrsubnet(var.vpc_a_cidr, 8, 1),  # 10.0.1.0/24
    cidrsubnet(var.vpc_a_cidr, 8, 2),  # 10.0.2.0/24
  ]

  vpc_a_private_subnets = [
    cidrsubnet(var.vpc_a_cidr, 8, 10), # 10.0.10.0/24
    cidrsubnet(var.vpc_a_cidr, 8, 11), # 10.0.11.0/24
  ]

  vpc_b_public_subnets = [
    cidrsubnet(var.vpc_b_cidr, 8, 1),  # 10.1.1.0/24
    cidrsubnet(var.vpc_b_cidr, 8, 2),  # 10.1.2.0/24
  ]

  vpc_b_private_subnets = [
    cidrsubnet(var.vpc_b_cidr, 8, 10), # 10.1.10.0/24
    cidrsubnet(var.vpc_b_cidr, 8, 11), # 10.1.11.0/24
  ]

  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# ============================================================================
# VPC-A RESOURCES
# ============================================================================

resource "aws_vpc" "vpc_a" {
  cidr_block           = var.vpc_a_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-a-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_subnet" "vpc_a_public" {
  count             = length(local.vpc_a_public_subnets)
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = local.vpc_a_public_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-a-public-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc_a_private" {
  count             = length(local.vpc_a_private_subnets)
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = local.vpc_a_private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-a-private-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "vpc_a" {
  vpc_id = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name = "vpc-a-igw-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_eip" "vpc_a_nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "vpc-a-nat-eip-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_internet_gateway.vpc_a]
}

resource "aws_nat_gateway" "vpc_a" {
  count         = length(local.azs)
  allocation_id = aws_eip.vpc_a_nat[count.index].id
  subnet_id     = aws_subnet.vpc_a_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "vpc-a-nat-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_internet_gateway.vpc_a]
}

resource "aws_route_table" "vpc_a_public" {
  vpc_id = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name = "vpc-a-public-rt-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Public"
  })
}

resource "aws_route" "vpc_a_public_internet" {
  route_table_id         = aws_route_table.vpc_a_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.vpc_a.id
}

resource "aws_route_table_association" "vpc_a_public" {
  count          = length(aws_subnet.vpc_a_public)
  subnet_id      = aws_subnet.vpc_a_public[count.index].id
  route_table_id = aws_route_table.vpc_a_public.id
}

resource "aws_route_table" "vpc_a_private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name = "vpc-a-private-rt-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-A"
    Type = "Private"
  })
}

resource "aws_route" "vpc_a_private_nat" {
  count                  = length(aws_route_table.vpc_a_private)
  route_table_id         = aws_route_table.vpc_a_private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.vpc_a[count.index].id
}

resource "aws_route_table_association" "vpc_a_private" {
  count          = length(aws_subnet.vpc_a_private)
  subnet_id      = aws_subnet.vpc_a_private[count.index].id
  route_table_id = aws_route_table.vpc_a_private[count.index].id
}

# ============================================================================
# VPC-B RESOURCES
# ============================================================================

resource "aws_vpc" "vpc_b" {
  cidr_block           = var.vpc_b_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-b-${local.suffix}"
    VPC  = "VPC-B"
  })
}

resource "aws_subnet" "vpc_b_public" {
  count             = length(local.vpc_b_public_subnets)
  vpc_id            = aws_vpc.vpc_b.id
  cidr_block        = local.vpc_b_public_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-b-public-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc_b_private" {
  count             = length(local.vpc_b_private_subnets)
  vpc_id            = aws_vpc.vpc_b.id
  cidr_block        = local.vpc_b_private_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "vpc-b-private-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "vpc_b" {
  vpc_id = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name = "vpc-b-igw-${local.suffix}"
    VPC  = "VPC-B"
  })
}

resource "aws_eip" "vpc_b_nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "vpc-b-nat-eip-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_internet_gateway.vpc_b]
}

resource "aws_nat_gateway" "vpc_b" {
  count         = length(local.azs)
  allocation_id = aws_eip.vpc_b_nat[count.index].id
  subnet_id     = aws_subnet.vpc_b_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "vpc-b-nat-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_internet_gateway.vpc_b]
}

resource "aws_route_table" "vpc_b_public" {
  vpc_id = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name = "vpc-b-public-rt-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Public"
  })
}

resource "aws_route" "vpc_b_public_internet" {
  route_table_id         = aws_route_table.vpc_b_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.vpc_b.id
}

resource "aws_route_table_association" "vpc_b_public" {
  count          = length(aws_subnet.vpc_b_public)
  subnet_id      = aws_subnet.vpc_b_public[count.index].id
  route_table_id = aws_route_table.vpc_b_public.id
}

resource "aws_route_table" "vpc_b_private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name = "vpc-b-private-rt-${count.index + 1}-${local.suffix}"
    VPC  = "VPC-B"
    Type = "Private"
  })
}

resource "aws_route" "vpc_b_private_nat" {
  count                  = length(aws_route_table.vpc_b_private)
  route_table_id         = aws_route_table.vpc_b_private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.vpc_b[count.index].id
}

resource "aws_route_table_association" "vpc_b_private" {
  count          = length(aws_subnet.vpc_b_private)
  subnet_id      = aws_subnet.vpc_b_private[count.index].id
  route_table_id = aws_route_table.vpc_b_private[count.index].id
}

# ============================================================================
# VPC PEERING CONNECTION
# ============================================================================

resource "aws_vpc_peering_connection" "a_to_b" {
  vpc_id      = aws_vpc.vpc_a.id
  peer_vpc_id = aws_vpc.vpc_b.id
  auto_accept = true

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  accepter {
    allow_remote_vpc_dns_resolution = true
  }

  tags = merge(local.common_tags, {
    Name = "vpc-a-to-vpc-b-peering-${local.suffix}"
    Side = "Requester"
  })
}

# ============================================================================
# PEERING ROUTES
# ============================================================================

# VPC-A public route table to VPC-B
resource "aws_route" "vpc_a_public_to_vpc_b" {
  route_table_id            = aws_route_table.vpc_a_public.id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-A private route tables to VPC-B
resource "aws_route" "vpc_a_private_to_vpc_b" {
  count                     = length(aws_route_table.vpc_a_private)
  route_table_id            = aws_route_table.vpc_a_private[count.index].id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-B public route table to VPC-A
resource "aws_route" "vpc_b_public_to_vpc_a" {
  route_table_id            = aws_route_table.vpc_b_public.id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# VPC-B private route tables to VPC-A
resource "aws_route" "vpc_b_private_to_vpc_a" {
  count                     = length(aws_route_table.vpc_b_private)
  route_table_id            = aws_route_table.vpc_b_private[count.index].id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.a_to_b.id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

resource "aws_security_group" "vpc_a" {
  name_prefix = "vpc-a-peering-sg-${local.suffix}"
  description = "Security group for VPC-A allowing traffic from VPC-B"
  vpc_id      = aws_vpc.vpc_a.id

  tags = merge(local.common_tags, {
    Name        = "vpc-a-peering-sg-${local.suffix}"
    VPC         = "VPC-A"
    Description = "Allows traffic from VPC-B on ports 443 and 8080"
  })
}

resource "aws_vpc_security_group_ingress_rule" "vpc_a_from_vpc_b" {
  for_each = toset(["443", "8080"])

  security_group_id = aws_security_group.vpc_a.id
  cidr_ipv4         = var.vpc_b_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-a-ingress-${each.value}-${local.suffix}"
  })
}

resource "aws_vpc_security_group_egress_rule" "vpc_a_to_vpc_b" {
  for_each = toset(["443", "8080"])

  security_group_id = aws_security_group.vpc_a.id
  cidr_ipv4         = var.vpc_b_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-a-egress-${each.value}-${local.suffix}"
  })
}

resource "aws_security_group" "vpc_b" {
  name_prefix = "vpc-b-peering-sg-${local.suffix}"
  description = "Security group for VPC-B allowing traffic from VPC-A"
  vpc_id      = aws_vpc.vpc_b.id

  tags = merge(local.common_tags, {
    Name        = "vpc-b-peering-sg-${local.suffix}"
    VPC         = "VPC-B"
    Description = "Allows traffic from VPC-A on ports 443 and 3306"
  })
}

resource "aws_vpc_security_group_ingress_rule" "vpc_b_from_vpc_a" {
  for_each = toset(["443", "3306"])

  security_group_id = aws_security_group.vpc_b.id
  cidr_ipv4         = var.vpc_a_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-b-ingress-${each.value}-${local.suffix}"
  })
}

resource "aws_vpc_security_group_egress_rule" "vpc_b_to_vpc_a" {
  for_each = toset(["443", "3306"])

  security_group_id = aws_security_group.vpc_b.id
  cidr_ipv4         = var.vpc_a_cidr
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  ip_protocol       = "tcp"

  tags = merge(local.common_tags, {
    Name = "vpc-b-egress-${each.value}-${local.suffix}"
  })
}

# ============================================================================
# IAM ROLE FOR VPC FLOW LOGS
# ============================================================================

resource "aws_iam_role" "flow_logs" {
  name_prefix = "vpc-flow-logs-role-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-role-${local.suffix}"
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "vpc-flow-logs-policy-${local.suffix}"
  role        = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH LOG GROUPS
# ============================================================================

resource "aws_cloudwatch_log_group" "vpc_a_flow_logs" {
  name              = "/aws/vpc/flowlogs/vpc-a-${local.suffix}"
  retention_in_days = var.retention_days

  tags = merge(local.common_tags, {
    Name = "vpc-a-flow-logs-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_cloudwatch_log_group" "vpc_b_flow_logs" {
  name              = "/aws/vpc/flowlogs/vpc-b-${local.suffix}"
  retention_in_days = var.retention_days

  tags = merge(local.common_tags, {
    Name = "vpc-b-flow-logs-${local.suffix}"
    VPC  = "VPC-B"
  })
}

# ============================================================================
# VPC FLOW LOGS
# ============================================================================

resource "aws_flow_log" "vpc_a" {
  vpc_id               = aws_vpc.vpc_a.id
  traffic_type         = "ALL"
  iam_role_arn         = aws_iam_role.flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_a_flow_logs.arn

  tags = merge(local.common_tags, {
    Name = "vpc-a-flow-log-${local.suffix}"
    VPC  = "VPC-A"
  })
}

resource "aws_flow_log" "vpc_b" {
  vpc_id               = aws_vpc.vpc_b.id
  traffic_type         = "ALL"
  iam_role_arn         = aws_iam_role.flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_b_flow_logs.arn

  tags = merge(local.common_tags, {
    Name = "vpc-b-flow-log-${local.suffix}"
    VPC  = "VPC-B"
  })
}

# ============================================================================
# CLOUDWATCH METRIC FILTERS
# ============================================================================

resource "aws_cloudwatch_log_metric_filter" "vpc_a_traffic_volume" {
  name           = "vpc-a-traffic-volume-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_a_rejected_connections" {
  name           = "vpc-a-rejected-connections-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_traffic_volume" {
  name           = "vpc-b-traffic-volume-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_rejected_connections" {
  name           = "vpc-b-rejected-connections-${local.suffix}"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

# ============================================================================
# SNS TOPIC FOR ALERTS
# ============================================================================

resource "aws_sns_topic" "alerts" {
  name_prefix = "vpc-peering-alerts-${local.suffix}"

  tags = merge(local.common_tags, {
    Name = "vpc-peering-alerts-${local.suffix}"
  })
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "vpc_a_traffic_volume" {
  alarm_name          = "vpc-a-high-traffic-volume-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold
  alarm_description   = "Alert when VPC-A traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-a-traffic-volume-alarm-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_a_traffic_volume]
}

resource "aws_cloudwatch_metric_alarm" "vpc_a_rejected_connections" {
  alarm_name          = "vpc-a-high-rejected-connections-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "Alert when VPC-A rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-a-rejected-connections-alarm-${local.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_a_rejected_connections]
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_traffic_volume" {
  alarm_name          = "vpc-b-high-traffic-volume-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold
  alarm_description   = "Alert when VPC-B traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-b-traffic-volume-alarm-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_b_traffic_volume]
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_rejected_connections" {
  alarm_name          = "vpc-b-high-rejected-connections-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "Alert when VPC-B rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "vpc-b-rejected-connections-alarm-${local.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_b_rejected_connections]
}

# ============================================================================
# IAM ROLE FOR LAMBDA
# ============================================================================

resource "aws_iam_role" "lambda_traffic_analyzer" {
  name_prefix = "lambda-traffic-analyzer-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "lambda-traffic-analyzer-role-${local.suffix}"
  })
}

resource "aws_iam_role_policy" "lambda_traffic_analyzer" {
  name_prefix = "lambda-traffic-analyzer-policy-${local.suffix}"
  role        = aws_iam_role.lambda_traffic_analyzer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:StartQuery",
          "logs:GetQueryResults",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          aws_cloudwatch_log_group.vpc_a_flow_logs.arn,
          aws_cloudwatch_log_group.vpc_b_flow_logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "Company/VPCPeering"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTION
# ============================================================================

data "archive_file" "lambda_traffic_analyzer" {
  type        = "zip"
  source_file = "${path.module}/lambda/traffic_analyzer.py"
  output_path = "${path.module}/.terraform/lambda/traffic_analyzer.zip"
}

resource "aws_lambda_function" "traffic_analyzer" {
  filename         = data.archive_file.lambda_traffic_analyzer.output_path
  function_name    = "vpc-traffic-analyzer-${local.suffix}"
  role             = aws_iam_role.lambda_traffic_analyzer.arn
  handler          = "traffic_analyzer.lambda_handler"
  source_code_hash = data.archive_file.lambda_traffic_analyzer.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      VPC_A_LOG_GROUP      = aws_cloudwatch_log_group.vpc_a_flow_logs.name
      VPC_B_LOG_GROUP      = aws_cloudwatch_log_group.vpc_b_flow_logs.name
      TRAFFIC_BASELINE     = tostring(var.traffic_baseline)
      SNS_TOPIC_ARN        = aws_sns_topic.alerts.arn
      ALLOWED_PORTS        = join(",", var.allowed_ports)
      ANOMALY_THRESHOLD    = tostring(var.anomaly_threshold_percent)
      VPC_A_CIDR           = var.vpc_a_cidr
      VPC_B_CIDR           = var.vpc_b_cidr
    }
  }

  tags = merge(local.common_tags, {
    Name = "vpc-traffic-analyzer-${local.suffix}"
  })
}

resource "aws_cloudwatch_log_group" "lambda_traffic_analyzer" {
  name              = "/aws/lambda/vpc-traffic-analyzer-${local.suffix}"
  retention_in_days = var.retention_days

  tags = merge(local.common_tags, {
    Name = "lambda-traffic-analyzer-logs-${local.suffix}"
  })
}

# ============================================================================
# EVENTBRIDGE RULE FOR LAMBDA
# ============================================================================

resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name_prefix         = "vpc-traffic-analyzer-schedule-${local.suffix}"
  description         = "Trigger Lambda traffic analyzer on schedule"
  schedule_expression = var.lambda_schedule

  tags = merge(local.common_tags, {
    Name = "lambda-schedule-${local.suffix}"
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.traffic_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.traffic_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}

# ============================================================================
# CLOUDWATCH DASHBOARD (OPTIONAL)
# ============================================================================

resource "aws_cloudwatch_dashboard" "vpc_peering" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = "vpc-peering-monitoring-${local.suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering", "TrafficVolume", { stat = "Sum", label = "VPC-A Traffic" }],
            ["Company/VPCPeering", "TrafficVolume", { stat = "Sum", label = "VPC-B Traffic" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "VPC Traffic Volume"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering", "RejectedConnections", { stat = "Sum", label = "VPC-A Rejected" }],
            ["Company/VPCPeering", "RejectedConnections", { stat = "Sum", label = "VPC-B Rejected" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Rejected Connections"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration (avg)" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Execution Metrics"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.vpc_a_flow_logs.name}' | fields @timestamp, srcaddr, dstaddr, srcport, dstport, action | filter action = 'REJECT' | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Rejected Connections (VPC-A)"
        }
      }
    ]
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_a_id" {
  description = "ID of VPC-A"
  value       = aws_vpc.vpc_a.id
}

output "vpc_b_id" {
  description = "ID of VPC-B"
  value       = aws_vpc.vpc_b.id
}

output "vpc_a_cidr" {
  description = "CIDR block of VPC-A"
  value       = aws_vpc.vpc_a.cidr_block
}

output "vpc_b_cidr" {
  description = "CIDR block of VPC-B"
  value       = aws_vpc.vpc_b.cidr_block
}

output "peering_connection_id" {
  description = "ID of VPC peering connection"
  value       = aws_vpc_peering_connection.a_to_b.id
}

output "vpc_a_security_group_id" {
  description = "Security group ID for VPC-A"
  value       = aws_security_group.vpc_a.id
}

output "vpc_b_security_group_id" {
  description = "Security group ID for VPC-B"
  value       = aws_security_group.vpc_b.id
}

output "vpc_a_log_group_name" {
  description = "CloudWatch log group name for VPC-A Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_a_flow_logs.name
}

output "vpc_b_log_group_name" {
  description = "CloudWatch log group name for VPC-B Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_b_flow_logs.name
}

output "lambda_function_arn" {
  description = "ARN of traffic analyzer Lambda function"
  value       = aws_lambda_function.traffic_analyzer.arn
}

output "lambda_function_name" {
  description = "Name of traffic analyzer Lambda function"
  value       = aws_lambda_function.traffic_analyzer.function_name
}

output "sns_topic_arn" {
  description = "ARN of SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value = var.create_dashboard ? "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.vpc_peering[0].dashboard_name}" : "Dashboard not created"
}

output "alert_email" {
  description = "Email address receiving alerts"
  value       = var.alert_email
  sensitive   = true
}
