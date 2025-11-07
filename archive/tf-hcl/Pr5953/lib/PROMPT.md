
# Provisioning of Infrastructure Environments

This task must be implemented using **Terraform** written in **HCL**.
**Platform:** Terraform
**Language:** HCL
**Primary Region:** us-east-1
**Partner Region:** us-east-2

Do not change or substitute the platform or language. All infrastructure configuration must be written in Terraform using HCL.

## Background

A fintech company needs to establish secure communication between its production AWS environment and a partner’s AWS account to support real-time payment processing. The partner enforces strict security requirements such as encryption in transit, limited access patterns, and detailed audit logging.

## Objective

Develop a Terraform configuration that establishes a cross-region VPC peering connection between the production VPC and the partner’s VPC.

The configuration must:

1. Create a VPC peering connection with proper requester and accepter settings.
2. Enable DNS resolution across VPCs for cross-account hostname resolution.
3. Update route tables in both environments to permit traffic only between specific application subnets (not public or database subnets).
4. Configure security groups to allow HTTPS (443) and custom API traffic (8443).
5. Enable VPC Flow Logs for both VPCs, storing data in S3 with a 1-minute aggregation interval.
6. Implement IAM roles and policies for cross-account access with least privilege and explicit deny rules.
7. Use Terraform data sources to dynamically retrieve accepter VPC details (with optional partner_vpc_id variable) and validate CIDR compatibility.
8. Configure CloudWatch alarms for peering connection state changes and unusual traffic patterns (rejected connections), with SNS topic subscriptions for email notifications. Use CloudWatch Log Groups and metric filters to generate custom metrics for alarm evaluation.
9. Use locals to manage CIDR calculations, common tags, and reusable variables.
10. Output the peering connection ID, DNS resolution status (for both requester and accepter), the number of configured routes, VPC IDs, security group IDs, Flow Log details, and IAM role ARNs.

## Environment Details

* Multi-account AWS deployment across **us-east-1** and **us-east-2**.
* Production VPC (10.0.0.0/16) in **us-east-1**.
* Partner VPC (172.16.0.0/16) in **us-east-2**.
* Both environments follow a three-tier architecture (public, application, and database subnets) across three Availability Zones.
* Terraform version 1.5+ and AWS provider 5.x.
* The configuration creates Internet Gateways for both VPCs. Other components (NAT gateways, EC2 instances, S3 VPC endpoints) are assumed to be pre-existing or managed separately.

## Requirements and Constraints

* DNS resolution must be enabled for cross-account discovery.
* Route tables must only allow traffic to specific CIDR ranges (application subnet CIDRs only, not full VPC CIDRs).
* Security groups should restrict access to ports 443 (HTTPS) and 8443 (custom API) for both ingress and egress, with rules scoped to specific application subnet CIDRs.
* All resources must be tagged with `Environment`, `Project`, and `CostCenter`.
* Use Terraform data sources to dynamically retrieve VPC details (with optional partner_vpc_id variable for explicit VPC ID specification).
* Enable VPC Flow Logs with a 1-minute aggregation interval (max_aggregation_interval = 60 seconds), storing logs in S3 with lifecycle policies and proper bucket security (public access block, encryption).
* Separate route tables for public, application, and database subnets.
* Use locals for repeated expressions or calculated values (CIDR blocks, tags, ports, aggregation intervals, CIDR validation).
* IAM policies must apply the principle of least privilege with explicit deny statements for dangerous operations (delete, reject peering connections, unauthorized route modifications).
* Peering connections must validate and reject overlapping CIDR ranges (implementation includes CIDR overlap validation in locals).

## Implementation Guidelines

### Platform and Structure

* Use Terraform (HCL) for all resources.
* Organize resources into separate files (main.tf, routing.tf, security.tf, monitoring.tf, iam.tf, locals.tf, variables.tf, outputs.tf, provider.tf) for networking, security, monitoring, and IAM.
* Follow standard Terraform best practices.
* Apply consistent naming using the `environment_suffix` variable.
* Use multiple AWS providers (primary and partner) to manage resources across regions.

### Security and Compliance

* Enable encryption at rest using S3 server-side encryption (AES256) for Flow Logs storage.
* Enforce TLS/SSL for encryption in transit (HTTPS on port 443).
* Apply least privilege to all IAM roles and policies with explicit deny rules.
* Enable detailed CloudWatch logging and monitoring with SNS notifications.
* Ensure consistent tagging across all resources (Environment, Project, CostCenter).
* Configure S3 bucket policies for VPC Flow Logs delivery service, enable public access block, and configure lifecycle policies for log retention.

### Testing

* Include unit tests for Terraform modules.
* Perform integration tests to validate full deployment.
* Use test fixtures or variable files for loading test parameters.

### Resource Lifecycle

* The infrastructure must support clean teardown for CI/CD.
* Fetch all secrets from AWS Secrets Manager; do not create new ones.
* Use Terraform lifecycle blocks (prevent_destroy, create_before_destroy) only when necessary.

## Target Regions

* Primary deployment region: **us-east-1** (production VPC and primary resources)
* Partner deployment region: **us-east-2** (partner VPC and partner-side resources)
* Cross-region VPC peering connects resources across both regions


## Success Criteria

* Terraform apply completes successfully.
* All security and compliance controls are met.
* Unit and integration tests pass.
* All resources are properly tagged and named.
* The infrastructure can be destroyed cleanly without residual resources.
