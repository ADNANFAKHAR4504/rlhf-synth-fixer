### Reasoning Trace

---

This is a comprehensive request for a Terraform setup that creates:

1. Two VPCs with peering
2. Complete networking setup (subnets, IGWs, NAT gateways, route tables)
3. Security groups with specific rules
4. VPC Flow Logs to CloudWatch
5. Monitoring with CloudWatch metrics and alarms
6. A Lambda function for traffic analysis
7. EventBridge scheduling
8. SNS notifications
9. Optional CloudWatch dashboard
10. Proper tagging and outputs

I need to create 13 files as requested. Let me break this down systematically:

1. versions.tf - Terraform and provider version constraints
2. providers.tf - AWS provider configuration
3. variables.tf - All input variables with defaults and validations
4. vpcs.tf - VPC resources including subnets, IGWs, NAT gateways
5. peering.tf - VPC peering connection setup
6. routes.tf - Route table updates for peering
7. security-groups.tf - Security groups for both VPCs
8. flow-logs.tf - VPC Flow Logs configuration
9. monitoring.tf - CloudWatch metrics, alarms, SNS, dashboard
10. lambda.tf - Lambda function resources
11. lambda/traffic_analyzer.py - Python code for traffic analysis
12. outputs.tf - Output values
13. README.md - Documentation

Key considerations:

- Daily traffic: 10,000 requests = ~417 requests/hour baseline
- CIDR blocks: VPC-A (10.0.0.0/16), VPC-B (10.1.0.0/16)
- Public subnets: x.0.1.0/24, x.0.2.0/24
- Private subnets: x.0.10.0/24, x.0.11.0/24
- Two availability zones
- Flow logs capture ALL traffic
- Lambda runs hourly

- Anomaly threshold set at 20% above baseline traffic

I'll establish a dynamic monitoring approach that flags unusual network activity. The 20% threshold provides a sensitive yet practical trigger for investigating potential security incidents or unexpected traffic patterns.

### Answer

---

## versions.tf

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}
```

## providers.tf

```hcl
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = "production"
      ManagedBy   = "Terraform"
      Project     = "VPCPeering"
    }
  }
}
```

## variables.tf

```hcl
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_a_cidr" {
  description = "CIDR block for VPC-A"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_a_cidr, 0))
    error_message = "Must be a valid CIDR block"
  }
}

variable "vpc_b_cidr" {
  description = "CIDR block for VPC-B"
  type        = string
  default     = "10.1.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_b_cidr, 0))
    error_message = "Must be a valid CIDR block"
  }
}

variable "allowed_ports" {
  description = "List of allowed ports for security groups"
  type        = list(string)
  default     = ["443", "8080", "3306"]

  validation {
    condition = alltrue([
      for port in var.allowed_ports : tonumber(port) > 0 && tonumber(port) <= 65535
    ])
    error_message = "Ports must be between 1 and 65535"
  }
}

variable "retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30
}

variable "traffic_volume_threshold" {
  description = "Threshold for traffic volume alarms (requests per hour)"
  type        = number
  default     = 500 # ~20% above baseline of 417/hour
}

variable "rejected_connections_threshold" {
  description = "Threshold for rejected connections alarms"
  type        = number
  default     = 50
}

variable "anomaly_threshold_percent" {
  description = "Percentage above baseline to trigger anomaly alerts"
  type        = number
  default     = 20
}

variable "traffic_baseline" {
  description = "Baseline traffic in requests per hour"
  type        = number
  default     = 417 # 10,000 daily / 24 hours
}

variable "lambda_schedule" {
  description = "Schedule expression for Lambda execution"
  type        = string
  default     = "rate(1 hour)"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Must be a valid email address"
  }
}

variable "create_dashboard" {
  description = "Whether to create CloudWatch dashboard"
  type        = bool
  default     = true
}

variable "owner_tag" {
  description = "Owner tag value"
  type        = string
  default     = "NetworkTeam"
}
```

## vpcs.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# VPC-A
resource "aws_vpc" "vpc_a" {
  cidr_block           = var.vpc_a_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name  = "VPC-A"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

# VPC-A Subnets
resource "aws_subnet" "vpc_a_public" {
  count                   = 2
  vpc_id                  = aws_vpc.vpc_a.id
  cidr_block              = cidrsubnet(var.vpc_a_cidr, 8, count.index + 1)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name  = "VPC-A-Public-${count.index + 1}"
    Type  = "Public"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_subnet" "vpc_a_private" {
  count             = 2
  vpc_id            = aws_vpc.vpc_a.id
  cidr_block        = cidrsubnet(var.vpc_a_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = {
    Name  = "VPC-A-Private-${count.index + 1}"
    Type  = "Private"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

# VPC-A Internet Gateway
resource "aws_internet_gateway" "vpc_a" {
  vpc_id = aws_vpc.vpc_a.id

  tags = {
    Name  = "VPC-A-IGW"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

# VPC-A NAT Gateways
resource "aws_eip" "vpc_a_nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name  = "VPC-A-NAT-EIP-${count.index + 1}"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_nat_gateway" "vpc_a" {
  count         = 2
  allocation_id = aws_eip.vpc_a_nat[count.index].id
  subnet_id     = aws_subnet.vpc_a_public[count.index].id

  tags = {
    Name  = "VPC-A-NAT-${count.index + 1}"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

# VPC-A Route Tables
resource "aws_route_table" "vpc_a_public" {
  vpc_id = aws_vpc.vpc_a.id

  tags = {
    Name  = "VPC-A-Public-RT"
    Type  = "Public"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_route" "vpc_a_public_internet" {
  route_table_id         = aws_route_table.vpc_a_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.vpc_a.id
}

resource "aws_route_table_association" "vpc_a_public" {
  count          = 2
  subnet_id      = aws_subnet.vpc_a_public[count.index].id
  route_table_id = aws_route_table.vpc_a_public.id
}

resource "aws_route_table" "vpc_a_private" {
  count  = 2
  vpc_id = aws_vpc.vpc_a.id

  tags = {
    Name  = "VPC-A-Private-RT-${count.index + 1}"
    Type  = "Private"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_route" "vpc_a_private_nat" {
  count                  = 2
  route_table_id         = aws_route_table.vpc_a_private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.vpc_a[count.index].id
}

resource "aws_route_table_association" "vpc_a_private" {
  count          = 2
  subnet_id      = aws_subnet.vpc_a_private[count.index].id
  route_table_id = aws_route_table.vpc_a_private[count.index].id
}

# VPC-B
resource "aws_vpc" "vpc_b" {
  cidr_block           = var.vpc_b_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name  = "VPC-B"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

# VPC-B Subnets
resource "aws_subnet" "vpc_b_public" {
  count                   = 2
  vpc_id                  = aws_vpc.vpc_b.id
  cidr_block              = cidrsubnet(var.vpc_b_cidr, 8, count.index + 1)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name  = "VPC-B-Public-${count.index + 1}"
    Type  = "Public"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

resource "aws_subnet" "vpc_b_private" {
  count             = 2
  vpc_id            = aws_vpc.vpc_b.id
  cidr_block        = cidrsubnet(var.vpc_b_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = {
    Name  = "VPC-B-Private-${count.index + 1}"
    Type  = "Private"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

# VPC-B Internet Gateway
resource "aws_internet_gateway" "vpc_b" {
  vpc_id = aws_vpc.vpc_b.id

  tags = {
    Name  = "VPC-B-IGW"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

# VPC-B NAT Gateways
resource "aws_eip" "vpc_b_nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name  = "VPC-B-NAT-EIP-${count.index + 1}"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

resource "aws_nat_gateway" "vpc_b" {
  count         = 2
  allocation_id = aws_eip.vpc_b_nat[count.index].id
  subnet_id     = aws_subnet.vpc_b_public[count.index].id

  tags = {
    Name  = "VPC-B-NAT-${count.index + 1}"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

# VPC-B Route Tables
resource "aws_route_table" "vpc_b_public" {
  vpc_id = aws_vpc.vpc_b.id

  tags = {
    Name  = "VPC-B-Public-RT"
    Type  = "Public"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

resource "aws_route" "vpc_b_public_internet" {
  route_table_id         = aws_route_table.vpc_b_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.vpc_b.id
}

resource "aws_route_table_association" "vpc_b_public" {
  count          = 2
  subnet_id      = aws_subnet.vpc_b_public[count.index].id
  route_table_id = aws_route_table.vpc_b_public.id
}

resource "aws_route_table" "vpc_b_private" {
  count  = 2
  vpc_id = aws_vpc.vpc_b.id

  tags = {
    Name  = "VPC-B-Private-RT-${count.index + 1}"
    Type  = "Private"
    VPC   = "B"
    Owner = var.owner_tag
  }
}

resource "aws_route" "vpc_b_private_nat" {
  count                  = 2
  route_table_id         = aws_route_table.vpc_b_private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.vpc_b[count.index].id
}

resource "aws_route_table_association" "vpc_b_private" {
  count          = 2
  subnet_id      = aws_subnet.vpc_b_private[count.index].id
  route_table_id = aws_route_table.vpc_b_private[count.index].id
}
```

## peering.tf

```hcl
resource "aws_vpc_peering_connection" "main" {
  vpc_id      = aws_vpc.vpc_a.id
  peer_vpc_id = aws_vpc.vpc_b.id
  auto_accept = true

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  accepter {
    allow_remote_vpc_dns_resolution = true
  }

  tags = {
    Name        = "VPC-A-to-VPC-B-Peering"
    Description = "Peering connection between VPC-A and VPC-B for internal traffic"
    Owner       = var.owner_tag
  }
}
```

## routes.tf

```hcl
# Routes from VPC-A to VPC-B
resource "aws_route" "vpc_a_to_b_public" {
  route_table_id            = aws_route_table.vpc_a_public.id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}

resource "aws_route" "vpc_a_to_b_private" {
  count                     = 2
  route_table_id            = aws_route_table.vpc_a_private[count.index].id
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}

# Routes from VPC-B to VPC-A
resource "aws_route" "vpc_b_to_a_public" {
  route_table_id            = aws_route_table.vpc_b_public.id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}

resource "aws_route" "vpc_b_to_a_private" {
  count                     = 2
  route_table_id            = aws_route_table.vpc_b_private[count.index].id
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}
```

## security-groups.tf

```hcl
# Security Group for VPC-A
resource "aws_security_group" "vpc_a" {
  name        = "vpc-a-peering-sg"
  description = "Security group for VPC-A peering with VPC-B - allows traffic from VPC-B"
  vpc_id      = aws_vpc.vpc_a.id

  tags = {
    Name        = "VPC-A-Peering-SG"
    VPC         = "A"
    Owner       = var.owner_tag
    Description = "Allows inbound traffic from VPC-B on ports 443 and 8080"
  }
}

resource "aws_security_group_rule" "vpc_a_ingress_443" {
  type              = "ingress"
  security_group_id = aws_security_group.vpc_a.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = [var.vpc_b_cidr]
  description       = "Allow HTTPS from VPC-B"
}

resource "aws_security_group_rule" "vpc_a_ingress_8080" {
  type              = "ingress"
  security_group_id = aws_security_group.vpc_a.id
  protocol          = "tcp"
  from_port         = 8080
  to_port           = 8080
  cidr_blocks       = [var.vpc_b_cidr]
  description       = "Allow port 8080 from VPC-B"
}

resource "aws_security_group_rule" "vpc_a_egress_443" {
  type              = "egress"
  security_group_id = aws_security_group.vpc_a.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = [var.vpc_b_cidr]
  description       = "Allow HTTPS to VPC-B"
}

resource "aws_security_group_rule" "vpc_a_egress_3306" {
  type              = "egress"
  security_group_id = aws_security_group.vpc_a.id
  protocol          = "tcp"
  from_port         = 3306
  to_port           = 3306
  cidr_blocks       = [var.vpc_b_cidr]
  description       = "Allow MySQL to VPC-B"
}

# Security Group for VPC-B
resource "aws_security_group" "vpc_b" {
  name        = "vpc-b-peering-sg"
  description = "Security group for VPC-B peering with VPC-A - allows traffic from VPC-A"
  vpc_id      = aws_vpc.vpc_b.id

  tags = {
    Name        = "VPC-B-Peering-SG"
    VPC         = "B"
    Owner       = var.owner_tag
    Description = "Allows inbound traffic from VPC-A on ports 443 and 3306"
  }
}

resource "aws_security_group_rule" "vpc_b_ingress_443" {
  type              = "ingress"
  security_group_id = aws_security_group.vpc_b.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = [var.vpc_a_cidr]
  description       = "Allow HTTPS from VPC-A"
}

resource "aws_security_group_rule" "vpc_b_ingress_3306" {
  type              = "ingress"
  security_group_id = aws_security_group.vpc_b.id
  protocol          = "tcp"
  from_port         = 3306
  to_port           = 3306
  cidr_blocks       = [var.vpc_a_cidr]
  description       = "Allow MySQL from VPC-A"
}

resource "aws_security_group_rule" "vpc_b_egress_443" {
  type              = "egress"
  security_group_id = aws_security_group.vpc_b.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = [var.vpc_a_cidr]
  description       = "Allow HTTPS to VPC-A"
}

resource "aws_security_group_rule" "vpc_b_egress_8080" {
  type              = "egress"
  security_group_id = aws_security_group.vpc_b.id
  protocol          = "tcp"
  from_port         = 8080
  to_port           = 8080
  cidr_blocks       = [var.vpc_a_cidr]
  description       = "Allow port 8080 to VPC-A"
}
```

## flow-logs.tf

```hcl
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "vpc_a_flow_logs" {
  name              = "/aws/vpc/flowlogs/vpc-a"
  retention_in_days = var.retention_days

  tags = {
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_cloudwatch_log_group" "vpc_b_flow_logs" {
  name              = "/aws/vpc/flowlogs/vpc-b"
  retention_in_days = var.retention_days

  tags = {
    VPC   = "B"
    Owner = var.owner_tag
  }
}

# IAM Role for Flow Logs
data "aws_iam_policy_document" "flow_logs_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "flow_logs" {
  name               = "vpc-flow-logs-role"
  assume_role_policy = data.aws_iam_policy_document.flow_logs_assume_role.json

  tags = {
    Owner = var.owner_tag
  }
}

data "aws_iam_policy_document" "flow_logs_policy" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      aws_cloudwatch_log_group.vpc_a_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_a_flow_logs.arn}:*",
      aws_cloudwatch_log_group.vpc_b_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_b_flow_logs.arn}:*"
    ]
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  role   = aws_iam_role.flow_logs.id
  policy = data.aws_iam_policy_document.flow_logs_policy.json
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_a" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_a_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.vpc_a.id

  tags = {
    Name  = "VPC-A-Flow-Logs"
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_flow_log" "vpc_b" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_b_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.vpc_b.id

  tags = {
    Name  = "VPC-B-Flow-Logs"
    VPC   = "B"
    Owner = var.owner_tag
  }
}
```

## monitoring.tf

```hcl
# SNS Topic
resource "aws_sns_topic" "alerts" {
  name = "vpc-peering-alerts"

  tags = {
    Owner = var.owner_tag
  }
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "lambda.amazonaws.com"]
    }
    actions = ["SNS:Publish"]
    resources = [aws_sns_topic.alerts.arn]
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn    = aws_sns_topic.alerts.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Metric Filters
resource "aws_cloudwatch_log_metric_filter" "vpc_a_traffic_volume" {
  name           = "vpc-a-traffic-volume"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action, log_status]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering/VPC-A"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_traffic_volume" {
  name           = "vpc-b-traffic-volume"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action, log_status]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering/VPC-B"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_a_rejected" {
  name           = "vpc-a-rejected-connections"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action=REJECT, log_status]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering/VPC-A"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_rejected" {
  name           = "vpc-b-rejected-connections"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action=REJECT, log_status]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering/VPC-B"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_a_unexpected_ports" {
  name           = "vpc-a-unexpected-ports"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport!=${join(" && dstport!=", var.allowed_ports)}, protocol, packets, bytes, start, end, action=ACCEPT, log_status]"

  metric_transformation {
    name      = "UnexpectedPortTraffic"
    namespace = "Company/VPCPeering/VPC-A"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_unexpected_ports" {
  name           = "vpc-b-unexpected-ports"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr, dstaddr, srcport, dstport!=${join(" && dstport!=", var.allowed_ports)}, protocol, packets, bytes, start, end, action=ACCEPT, log_status]"

  metric_transformation {
    name      = "UnexpectedPortTraffic"
    namespace = "Company/VPCPeering/VPC-B"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_a_external_traffic" {
  name           = "vpc-a-external-traffic"
  log_group_name = aws_cloudwatch_log_group.vpc_a_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr!=${replace(var.vpc_a_cidr, "/16", "*")} && srcaddr!=${replace(var.vpc_b_cidr, "/16", "*")}, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action, log_status]"

  metric_transformation {
    name      = "ExternalTraffic"
    namespace = "Company/VPCPeering/VPC-A"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_external_traffic" {
  name           = "vpc-b-external-traffic"
  log_group_name = aws_cloudwatch_log_group.vpc_b_flow_logs.name
  pattern        = "[version, account_id, interface_id, srcaddr!=${replace(var.vpc_a_cidr, "/16", "*")} && srcaddr!=${replace(var.vpc_b_cidr, "/16", "*")}, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action, log_status]"

  metric_transformation {
    name      = "ExternalTraffic"
    namespace = "Company/VPCPeering/VPC-B"
    value     = "1"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "vpc_a_traffic_volume" {
  alarm_name          = "vpc-a-high-traffic-volume"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering/VPC-A"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold * 5 / 60
  alarm_description   = "VPC-A traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_traffic_volume" {
  alarm_name          = "vpc-b-high-traffic-volume"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering/VPC-B"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold * 5 / 60
  alarm_description   = "VPC-B traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    VPC   = "B"
    Owner = var.owner_tag
  }
}

resource "aws_cloudwatch_metric_alarm" "vpc_a_rejected_connections" {
  alarm_name          = "vpc-a-rejected-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering/VPC-A"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "VPC-A rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    VPC   = "A"
    Owner = var.owner_tag
  }
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_rejected_connections" {
  alarm_name          = "vpc-b-rejected-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering/VPC-B"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "VPC-B rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    VPC   = "B"
    Owner = var.owner_tag
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "vpc_peering" {
  count = var.create_dashboard ? 1 : 0

  dashboard_name = "vpc-peering-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Company/VPCPeering/VPC-A", "TrafficVolume", { stat = "Sum", period = 300 }],
            ["Company/VPCPeering/VPC-B", "TrafficVolume", { stat = "Sum", period = 300 }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Traffic Volume by VPC"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Company/VPCPeering/VPC-A", "RejectedConnections", { stat = "Sum", period = 300 }],
            ["Company/VPCPeering/VPC-B", "RejectedConnections", { stat = "Sum", period = 300 }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Rejected Connections"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Company/VPCPeering", "TopSourceIPs", { stat = "Maximum" }]
          ]
          period = 3600
          stat   = "Maximum"
          region = var.region
          title  = "Top Source IPs by Request Count"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["Company/VPCPeering", "TrafficAnomaly", { stat = "Maximum" }]
          ]
          period = 3600
          stat   = "Maximum"
          region = var.region
          title  = "Traffic Anomalies Detected"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", dimensions = { FunctionName = "vpc-peering-traffic-analyzer" } }],
            [".", "Errors", { stat = "Sum", dimensions = { FunctionName = "vpc-peering-traffic-analyzer" } }],
            [".", "Duration", { stat = "Average", dimensions = { FunctionName = "vpc-peering-traffic-analyzer" } }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Lambda Analyzer Performance"
        }
      }
    ]
  })
}
```

## lambda.tf

```hcl
# Lambda Function Archive
data "archive_file" "traffic_analyzer" {
  type        = "zip"
  source_file = "${path.module}/lambda/traffic_analyzer.py"
  output_path = "${path.module}/traffic_analyzer.zip"
}

# Lambda IAM Role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_traffic_analyzer" {
  name               = "vpc-peering-traffic-analyzer-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Owner = var.owner_tag
  }
}

data "aws_iam_policy_document" "lambda_traffic_analyzer" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${var.region}:*:*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:StartQuery",
      "logs:GetQueryResults",
      "logs:DescribeLogGroups"
    ]
    resources = [
      aws_cloudwatch_log_group.vpc_a_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_a_flow_logs.arn}:*",
      aws_cloudwatch_log_group.vpc_b_flow_logs.arn,
      "${aws_cloudwatch_log_group.vpc_b_flow_logs.arn}:*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [aws_sns_topic.alerts.arn]
  }
}

resource "aws_iam_role_policy" "lambda_traffic_analyzer" {
  role   = aws_iam_role.lambda_traffic_analyzer.id
  policy = data.aws_iam_policy_document.lambda_traffic_analyzer.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_traffic_analyzer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function
resource "aws_lambda_function" "traffic_analyzer" {
  filename         = data.archive_file.traffic_analyzer.output_path
  function_name    = "vpc-peering-traffic-analyzer"
  role             = aws_iam_role.lambda_traffic_analyzer.arn
  handler          = "traffic_analyzer.lambda_handler"
  source_code_hash = data.archive_file.traffic_analyzer.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      VPC_A_LOG_GROUP     = aws_cloudwatch_log_group.vpc_a_flow_logs.name
      VPC_B_LOG_GROUP     = aws_cloudwatch_log_group.vpc_b_flow_logs.name
      TRAFFIC_BASELINE    = var.traffic_baseline
      SNS_TOPIC_ARN       = aws_sns_topic.alerts.arn
      ALLOWED_PORTS       = join(",", var.allowed_ports)
      ANOMALY_THRESHOLD   = var.anomaly_threshold_percent
    }
  }

  tags = {
    Owner = var.owner_tag
  }
}

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name                = "vpc-peering-traffic-analyzer-schedule"
  description         = "Trigger traffic analysis Lambda"
  schedule_expression = var.lambda_schedule

  tags = {
    Owner = var.owner_tag
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "TrafficAnalyzerLambda"
  arn       = aws_lambda_function.traffic_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.traffic_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}
```

## lambda/traffic_analyzer.py

```python
import json
import os
import time
import boto3
from datetime import datetime, timedelta
from collections import defaultdict

logs_client = boto3.client('logs')
cloudwatch_client = boto3.client('cloudwatch')
sns_client = boto3.client('sns')

VPC_A_LOG_GROUP = os.environ['VPC_A_LOG_GROUP']
VPC_B_LOG_GROUP = os.environ['VPC_B_LOG_GROUP']
TRAFFIC_BASELINE = int(os.environ['TRAFFIC_BASELINE'])
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ALLOWED_PORTS = os.environ['ALLOWED_PORTS'].split(',')
ANOMALY_THRESHOLD = float(os.environ['ANOMALY_THRESHOLD'])


def lambda_handler(event, context):
    print(f"Starting traffic analysis at {datetime.now()}")

    # Time range for the last hour
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)

    # Analyze both VPCs
    vpc_a_results = analyze_vpc_logs('VPC-A', VPC_A_LOG_GROUP, start_time, end_time)
    vpc_b_results = analyze_vpc_logs('VPC-B', VPC_B_LOG_GROUP, start_time, end_time)

    # Combine results
    all_results = {
        'VPC-A': vpc_a_results,
        'VPC-B': vpc_b_results,
        'timestamp': end_time.isoformat()
    }

    # Check for anomalies
    anomalies = detect_anomalies(all_results)

    # Push metrics
    push_metrics(all_results)

    # Send alerts if anomalies detected
    if anomalies:
        send_alert(anomalies)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'results': all_results,
            'anomalies': anomalies
        })
    }


def analyze_vpc_logs(vpc_name, log_group, start_time, end_time):
    query = """
    fields @timestamp, srcaddr, dstaddr, srcport, dstport, protocol, bytes, packets, action
    | filter @timestamp >= %d and @timestamp <= %d
    | stats count() as total_requests,
            sum(bytes) as total_bytes,
            sum(packets) as total_packets by srcaddr, dstaddr, dstport, action
    """ % (int(start_time.timestamp() * 1000), int(end_time.timestamp() * 1000))

    try:
        # Start query
        response = logs_client.start_query(
            logGroupName=log_group,
            startTime=int(start_time.timestamp()),
            endTime=int(end_time.timestamp()),
            queryString=query
        )

        query_id = response['queryId']

        # Wait for query to complete
        status = None
        while status not in ['Complete', 'Failed', 'Cancelled']:
            time.sleep(1)
            response = logs_client.get_query_results(queryId=query_id)
            status = response['status']

        if status == 'Complete':
            return process_query_results(response['results'])
        else:
            print(f"Query failed with status: {status}")
            return {}

    except Exception as e:
        print(f"Error analyzing {vpc_name} logs: {str(e)}")
        return {}


def process_query_results(results):
    processed = {
        'total_requests': 0,
        'requests_per_source': defaultdict(int),
        'rejected_connections': 0,
        'traffic_by_port': defaultdict(int),
        'unexpected_ports': set(),
        'external_sources': set()
    }

    for row in results:
        row_data = {field['field']: field['value'] for field in row}

        requests = int(row_data.get('total_requests', 0))
        srcaddr = row_data.get('srcaddr', 'unknown')
        dstport = row_data.get('dstport', 'unknown')
        action = row_data.get('action', 'unknown')

        processed['total_requests'] += requests
        processed['requests_per_source'][srcaddr] += requests

        if action == 'REJECT':
            processed['rejected_connections'] += requests

        if dstport != 'unknown':
            processed['traffic_by_port'][dstport] += requests

            if dstport not in ALLOWED_PORTS:
                processed['unexpected_ports'].add(dstport)

        # Check for external sources (not from 10.0.0.0/8)
        if srcaddr != 'unknown' and not srcaddr.startswith('10.'):
            processed['external_sources'].add(srcaddr)

    # Convert sets to lists for JSON serialization
    processed['unexpected_ports'] = list(processed['unexpected_ports'])
    processed['external_sources'] = list(processed['external_sources'])

    return processed


def detect_anomalies(results):
    anomalies = []

    for vpc, data in results.items():
        if vpc in ['VPC-A', 'VPC-B']:
            total_requests = data.get('total_requests', 0)

            # Check for traffic spike
            threshold = TRAFFIC_BASELINE * (1 + ANOMALY_THRESHOLD / 100)
            if total_requests > threshold:
                anomalies.append({
                    'vpc': vpc,
                    'type': 'traffic_spike',
                    'message': f"Traffic spike detected: {total_requests} requests (baseline: {TRAFFIC_BASELINE})",
                    'severity': 'high'
                })

            # Check for unexpected ports
            unexpected_ports = data.get('unexpected_ports', [])
            if unexpected_ports:
                anomalies.append({
                    'vpc': vpc,
                    'type': 'unexpected_ports',
                    'message': f"Unexpected port traffic detected: {', '.join(unexpected_ports)}",
                    'severity': 'medium'
                })

            # Check for external sources
            external_sources = data.get('external_sources', [])
            if external_sources:
                anomalies.append({
                    'vpc': vpc,
                    'type': 'external_sources',
                    'message': f"External source IPs detected: {', '.join(external_sources[:5])}",
                    'severity': 'high'
                })

            # Check for high rejection rate
            rejected = data.get('rejected_connections', 0)
            if total_requests > 0:
                rejection_rate = (rejected / total_requests) * 100
                if rejection_rate > 10:  # More than 10% rejections
                    anomalies.append({
                        'vpc': vpc,
                        'type': 'high_rejection_rate',
                        'message': f"High rejection rate: {rejection_rate:.1f}% ({rejected} rejected)",
                        'severity': 'medium'
                    })

    return anomalies


def push_metrics(results):
    metric_data = []

    for vpc, data in results.items():
        if vpc in ['VPC-A', 'VPC-B']:
            # Total requests metric
            metric_data.append({
                'MetricName': 'TotalRequests',
                'Value': data.get('total_requests', 0),
                'Unit': 'Count',
                'Timestamp': datetime.now(),
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc}
                ]
            })

            # Top source IPs metric
            top_sources = sorted(
                data.get('requests_per_source', {}).items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]

            for i, (ip, count) in enumerate(top_sources):
                metric_data.append({
                    'MetricName': 'TopSourceIPs',
                    'Value': count,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(),
                    'Dimensions': [
                        {'Name': 'VPC', 'Value': vpc},
                        {'Name': 'SourceIP', 'Value': ip},
                        {'Name': 'Rank', 'Value': str(i + 1)}
                    ]
                })

            # Anomaly detection metric
            if any(a['vpc'] == vpc for a in detect_anomalies(results)):
                metric_data.append({
                    'MetricName': 'TrafficAnomaly',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(),
                    'Dimensions': [
                        {'Name': 'VPC', 'Value': vpc}
                    ]
                })

    # Push metrics in batches of 25
    for i in range(0, len(metric_data), 25):
        batch = metric_data[i:i+25]
        try:
            cloudwatch_client.put_metric_data(
                Namespace='Company/VPCPeering',
                MetricData=batch
            )
        except Exception as e:
            print(f"Error pushing metrics: {str(e)}")


def send_alert(anomalies):
    subject = f"VPC Peering Traffic Anomalies Detected - {len(anomalies)} issues"

    message_lines = [
        "VPC Peering Traffic Analysis Alert",
        f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"Total Anomalies: {len(anomalies)}",
        "",
        "Details:"
    ]

    for anomaly in anomalies:
        message_lines.extend([
            "",
            f"VPC: {anomaly['vpc']}",
            f"Type: {anomaly['type']}",
            f"Severity: {anomaly['severity']}",
            f"Message: {anomaly['message']}"
        ])

    message = "\n".join(message_lines)

    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"Alert sent successfully for {len(anomalies)} anomalies")
    except Exception as e:
        print(f"Error sending alert: {str(e)}")
```

## outputs.tf

```hcl
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
  description = "ID of the VPC peering connection"
  value       = aws_vpc_peering_connection.main.id
}

output "security_group_vpc_a_id" {
  description = "ID of VPC-A security group"
  value       = aws_security_group.vpc_a.id
}

output "security_group_vpc_b_id" {
  description = "ID of VPC-B security group"
  value       = aws_security_group.vpc_b.id
}

output "cloudwatch_log_group_vpc_a" {
  description = "CloudWatch log group for VPC-A Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_a_flow_logs.name
}

output "cloudwatch_log_group_vpc_b" {
  description = "CloudWatch log group for VPC-B Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_b_flow_logs.name
}

output "lambda_function_arn" {
  description = "ARN of the traffic analyzer Lambda function"
  value       = aws_lambda_function.traffic_analyzer.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = var.create_dashboard ? "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.vpc_peering[0].dashboard_name}" : "Dashboard not created"
}

output "alert_email" {
  description = "Email address for alerts"
  value       = var.alert_email
  sensitive   = true
}
```

## README.md

````markdown
# VPC Peering with Network Monitoring

This Terraform configuration sets up two VPCs with secure peering connection, comprehensive monitoring, and alerting capabilities.

## Overview

- **VPC-A**: 10.0.0.0/16
- **VPC-B**: 10.1.0.0/16
- Traffic capacity: ~10,000 requests per day
- Monitoring: VPC Flow Logs, CloudWatch metrics, Lambda-based analysis
- Alerting: SNS notifications for anomalies and threshold breaches

## Requirements

- Terraform >= 1.5
- AWS Provider >= 5.0
- AWS CLI configured with appropriate credentials

## Usage

1. Clone this repository
2. Create a `terraform.tfvars` file with your configuration
3. Initialize Terraform: `terraform init`
4. Plan deployment: `terraform plan`
5. Apply configuration: `terraform apply`

## Variables

| Variable                         | Description                      | Default                 |
| -------------------------------- | -------------------------------- | ----------------------- |
| `region`                         | AWS region                       | us-east-1               |
| `vpc_a_cidr`                     | CIDR block for VPC-A             | 10.0.0.0/16             |
| `vpc_b_cidr`                     | CIDR block for VPC-B             | 10.1.0.0/16             |
| `allowed_ports`                  | List of allowed ports            | ["443", "8080", "3306"] |
| `retention_days`                 | CloudWatch Logs retention        | 30                      |
| `traffic_volume_threshold`       | Traffic alarm threshold (req/hr) | 500                     |
| `rejected_connections_threshold` | Rejected connections threshold   | 50                      |
| `anomaly_threshold_percent`      | Anomaly detection percentage     | 20                      |
| `traffic_baseline`               | Baseline traffic (req/hr)        | 417                     |
| `lambda_schedule`                | Lambda execution schedule        | rate(1 hour)            |
| `alert_email`                    | Email for alerts                 | (required)              |
| `create_dashboard`               | Create CloudWatch dashboard      | true                    |
| `owner_tag`                      | Owner tag value                  | NetworkTeam             |

## Example Configuration (terraform.tfvars)

```hcl
region                         = "us-east-1"
alert_email                    = "network-alerts@company.com"
traffic_volume_threshold       = 600
rejected_connections_threshold = 100
create_dashboard              = true
owner_tag                     = "NetworkOps"

# Custom schedule for Lambda (every 30 minutes)
lambda_schedule = "rate(30 minutes)"

# Production-ready retention
retention_days = 90
```
````

## Understanding Alerts

### Traffic Spike Alert

- **Trigger**: Traffic exceeds baseline by configured percentage
- **Action**: Review source IPs and traffic patterns in dashboard

### Unexpected Port Traffic

- **Trigger**: Traffic on ports not in allowed_ports list
- **Action**: Verify if legitimate, update security groups if needed

### External Source IPs

- **Trigger**: Traffic from outside 10.0.0.0/8 network
- **Action**: Investigate potential security breach

### High Rejection Rate

- **Trigger**: More than 10% of connections rejected
- **Action**: Review security group rules and application logs

## CloudWatch Logs Insights Queries

### Top Traffic Sources

```
fields srcaddr, dstaddr, bytes
| stats sum(bytes) as total_bytes by srcaddr
| sort total_bytes desc
| limit 10
```

### Rejected Connections by Port

```
fields dstport, action
| filter action = "REJECT"
| stats count() by dstport
| sort count desc
```

### Traffic by Protocol

```
fields protocol, bytes
| stats sum(bytes) as total_bytes by protocol
| sort total_bytes desc
```

### Hourly Traffic Pattern

```
fields @timestamp, bytes
| stats sum(bytes) as total_bytes by bin(1h)
| sort @timestamp desc
```

## Troubleshooting

### Lambda Function Not Executing

1. Check EventBridge rule is enabled
2. Verify Lambda has correct permissions
3. Check CloudWatch Logs for Lambda errors

### No Flow Logs Data

1. Verify VPC Flow Logs are enabled
2. Check IAM role has correct permissions
3. Wait 5-10 minutes for initial logs

### Missing Metrics

1. Ensure metric filters are correctly configured
2. Verify Lambda is running successfully
3. Check CloudWatch namespace: Company/VPCPeering

### Alert Not Received

1. Confirm SNS subscription
2. Check spam folder
3. Verify SNS topic policy allows CloudWatch/Lambda

## Architecture Diagram

```
┌─────────────┐         ┌─────────────┐
│   VPC-A     │ Peering │   VPC-B     │
│ 10.0.0.0/16 │◄───────►│ 10.1.0.0/16 │
└──────┬──────┘         └──────┬──────┘
       │                       │
       ▼                       ▼
  Flow Logs                Flow Logs
       │                       │
       └───────┬───────────────┘
               ▼
         CloudWatch Logs
               │
               ▼
     ┌─────────────────┐
     │ Lambda Analyzer │◄─── EventBridge (hourly)
     └────────┬────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
   Metrics      SNS Alerts
       │             │
       ▼             ▼
  Dashboard    Email Notifs
```

## Security Considerations

1. Security groups restrict traffic to specific ports
2. Flow logs capture ALL traffic for audit trail
3. Lambda function has minimal required permissions
4. SNS topic policy restricts publishers
5. All resources tagged for compliance

## Cost Optimization

1. NAT Gateway costs: ~$45/month per gateway (4 total)
2. VPC Flow
