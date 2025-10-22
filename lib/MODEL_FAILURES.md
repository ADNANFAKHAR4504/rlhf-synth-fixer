### model failure

### 1. Networking - Missing NAT Gateway and Private Routing

Model Response:
The model creates private subnets and a private route table (aws_route_table.private) but never defines a NAT Gateway (aws_nat_gateway) or corresponding Elastic IP (aws_eip). As a result, EC2 instances in private subnets cannot access the internet for updates or package downloads.

Example failure snippet:

resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id
}


No aws_nat_gateway or route to nat_gateway_id is ever declared.

Ideal Response Implements:
Defines an aws_eip and aws_nat_gateway in each public subnet, with private route tables explicitly routing 0.0.0.0/0 traffic through those NAT gateways, ensuring secure outbound connectivity from private instances.

### 2. Security - Hardcoded RDS Password (No Secrets Manager)

Model Response:
The model stores the RDS password directly as a Terraform variable:

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}


Although marked as sensitive, this still allows the plaintext value to appear in terraform.tfvars or CLI input — a compliance and audit risk.

Ideal Response Implements:
Uses AWS Secrets Manager:

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}-db-password"
}


and retrieves it dynamically in the RDS resource using data "aws_secretsmanager_secret_version", ensuring no plaintext credentials are stored in Terraform code.

### 3. Security Groups - Inline Rules Reduce Reusability

Model Response:
Security groups use inline ingress/egress blocks:

resource "aws_security_group" "web" {
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


This limits flexibility for future rule management and complicates cross-referencing between services.

Ideal Response Implements:
Defines all rules using discrete aws_security_group_rule resources, improving modularity and enabling better auditing and rule reusability:

resource "aws_security_group_rule" "web_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.web.id
  cidr_blocks       = ["0.0.0.0/0"]
}

### 4. Application Logic - Incomplete EC2 User Data (No Monitoring or Health)

Model Response:
The EC2 launch template installs Docker but omits critical bootstrapping steps:

user_data = base64encode(var.user_data_script)


This script does not:

Configure CloudWatch agent

Register the instance with the ALB target group dynamically

Include health checks or service validation logic

Ideal Response Implements:
A user_data script that:

Installs and configures CloudWatch agent with a JSON file

Automatically joins the ALB target group

Logs startup progress for monitoring

### 5. Availability - Single ALB and ASG Without Multi-AZ Awareness

Model Response:
Although the configuration defines two subnets per type, the ALB and ASG do not ensure balanced distribution across AZs. The private route tables lack redundancy.

Ideal Response Implements:
Associates each subnet and NAT Gateway with a unique Availability Zone, creating high availability. The ALB and ASG explicitly reference subnets across multiple AZs, ensuring fault tolerance.

### 6. Observability - No CloudWatch Alarms or Logs

Model Response:
The configuration lacks any aws_cloudwatch_log_group or aws_cloudwatch_metric_alarm resources. This means no operational visibility into EC2, ALB, or RDS components.

Ideal Response Implements:
Creates log groups for ALB and EC2 and sets up CPU and health-based alarms:

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  statistic           = "Average"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 80
}

### 7. Maintainability - No Modular or Reusable Constructs

Model Response:
All infrastructure components are defined inline within a single main.tf. This tightly couples resources and reduces clarity for large-scale production environments.

Ideal Response Implements:
Uses reusable Terraform modules for networking, compute, and database — improving maintainability, testing, and scalability.

### 8. Migration Context - Missing Old Region Cleanup and Validation

Model Response:
Although it defines an alias provider for us-west-1, it doesn’t actually use it to import or decommission old resources, leaving migration incomplete.

Ideal Response Implements:
Uses the alias provider to reference and compare existing resources (e.g., data "aws_instance" "old_app" { provider = aws.old_region }) and performs stateful migration validation.