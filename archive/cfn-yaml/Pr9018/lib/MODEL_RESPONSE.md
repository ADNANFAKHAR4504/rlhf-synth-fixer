#  **model_response**

## Functional scope (build everything new)

Below is the requested CloudFormation template written in YAML and designed to create a complete multi-AZ application infrastructure from scratch. The template includes VPC construction, subnet distribution across three Availability Zones, public and private routing layers, internet and NAT gateways, application-tier compute with ALB and Auto Scaling, a high-availability PostgreSQL RDS instance, and an encrypted S3 storage layer configured for secure cross-region-ready replication. All resource names incorporate the EnvironmentSuffix parameter to avoid conflicts and follow strict validation rules, encryption settings, tagging conventions, and high-availability best practices.

## Requirements to be implemented

The template defines parameters for environmental identifiers, allowed CIDR ranges, and destination replication region, followed by creation of a dedicated Secrets Manager secret used as the password source for RDS. The S3 section provisions both a source bucket and a replica bucket, customer-managed KMS keys, and an IAM role enabling replication actions. IAM roles for EC2 access, CloudWatch integration, and RDS IAM authentication are also included. The compute layer uses a launch template with Amazon Linux 2, installs a web server, and pushes logs to CloudWatch. Auto Scaling policies react to CPU utilization alarms. All components are modular, isolated, encrypted, and tagged appropriately.

## Deliverable

The final output consists of a single, complete CloudFormation YAML file named TapStack.yml, containing parameters, networking constructs, routing, security groups, IAM roles, buckets, replication settings, launch template configuration, autoscaling logic, RDS setup, secrets generation, access logging, CloudWatch alarms, and stack outputs. It is fully deployable as is and meets all defined constraints and best practices.



