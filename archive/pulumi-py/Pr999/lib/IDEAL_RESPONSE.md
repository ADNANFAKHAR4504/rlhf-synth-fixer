This Pulumi implementation defines a TapStackArgs class for configuration and a TapStack ComponentResource for deploying a multi-region AWS infrastructure that matches the high-availability, security, and compliance requirements from the prompt.

Configuration (TapStackArgs)
environment_suffix defaults to "dev".

team_name is fixed to "tap".

project_name is "iac-aws-nova-model-breaking".

regions contains three AWS regions for multi-region deployment.

availability_zones_per_region is set to 3.

get_resource_name(service_name) ensures strict <team>-<env>-<service> naming.

get_default_tags() returns required tags (Owner, Purpose, Environment, Project, ManagedBy).

Core Resource Structure (TapStack)
The TapStack constructor:

Stores configuration and tags.

Initializes resource dictionaries for providers, networking, IAM, security groups, compute, database, and load balancers.

Calls helper methods in sequence to build the stack:

_create_providers()

Creates a unique aws.Provider per region to avoid URN conflicts.

_create_iam_resources()

Creates EC2 and RDS IAM roles with least-privilege policies.

Adds an instance profile for EC2.

Attaches managed policies for CloudWatch and RDS Enhanced Monitoring.

_create_vpc_infrastructure()

Creates one VPC per region (vpcs) with DNS support.

Falls back to the default VPC if VpcLimitExceeded occurs, pulling existing subnets via _get_existing_subnets().

If a new VPC is created, _create_new_networking_infrastructure() builds public and private subnets, Internet Gateway, NAT Gateway, route tables, and associations across AZs.

_create_security_groups()

Creates a web security group allowing HTTP/HTTPS from anywhere and SSH only from the VPC CIDR.

Creates a DB security group allowing access only from the web SG.

_create_database_infrastructure()

Creates an RDS subnet group using private subnets.

Provisions a PostgreSQL RDS instance with encryption, backups, PITR, monitoring via rds_monitoring_role, and tags.

_create_compute_infrastructure()

Retrieves the latest Amazon Linux 2 AMI.

Creates an ALB with public subnets and a target group with health checks.

Adds an ALB listener on HTTP port 80 forwarding to the target group.

Defines a launch template with HTTPD user data and security group access.

Creates an Auto Scaling Group in private subnets linked to the ALB target group, with min=1, max=6, desired=2.

Attaches scale-up and scale-down policies triggered by CPU CloudWatch alarms.

_create_monitoring_infrastructure()

Creates a CloudWatch Log Group with retention.

Creates a CloudWatch Dashboard per region aggregating ASG, ALB, and RDS metrics.

Outputs
vpc_ids: maps each region to its VPC ID.

database_endpoints: maps each region to its RDS endpoint.

load_balancer_dns: maps each region to its ALB DNS name.

