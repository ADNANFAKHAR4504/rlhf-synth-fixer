Create a Terraform configuration in HCL to analyze and optimize an existing RDS PostgreSQL deployment for better performance reliability and monitoring. The configuration must define all required AWS resources, vriables, and outputs, and be ready to apply in a production environment

Requirements:

Use terraform version 1.5+ and the AWS provider version >= 5.0 , do follow these strictly

-deploy a multi-AZ RDS PostgreSQL instance in the us-west-2 region.

place the RDS instance only in private subnets across three availability zones. for that first create a VPC and in that create the subnets.

Define a custom DB parameter group optimized for connection management and query performance with:

Changes applied immediately (no restart required)

Connection pooling supporting at least 200 concurrent connections

Configure the RDS instance with:

use a instance class and storage configuration suitable for medium workloads (not too large, something like medium instances)

Automated backups should be retained for 7 days

A preferred backup window during low-traffic hours, use midnight time slots of the us region

A maintenance window during off-peak hours with minor version upgrades enabled, again similar low-traffic hours

Apply proper security group rules allowing database access only from application subnets.

Set up enhanced monitoring with 60 sec (1-minute) granularity and performance Insights enabled.

Ensure monitoring metrics are exported to CloudWatch with 1minute granularity, and integrate with existing custom dashboards.

Create a DB subnet group spanning multiple availability zones.

Define CloudWatch alarms for key metrics, including:

CPU utilization

Database connections

Read and write latency

Implement a tagging strategy for cost allocation and environment identification (e.g., Environment, Owner, CostCenter).

Configure application servers in private subnets to connect to the database through a NAT Gateway for software updates.

Output key values for validation, including:

Database endpoint

Parameter group name

Output:
Give a single .tf file (HCL, terraform file) which will including all resource definitions variables and outputs that can be applied to create a production-rady, optimized, and monitored RDS PostgreSQL environment.