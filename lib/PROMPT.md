
# Provisioning of Infrastructure Environments

This task must be implemented using **Terraform** written in **HCL**.
**Platform:** Terraform
**Language:** HCL
**Region:** us-east-1

Do not change or substitute the platform or language. All infrastructure configuration must be written in Terraform using HCL.

## Background

A fintech company needs to establish secure communication between its production AWS environment and a partner’s AWS account to support real-time payment processing. The partner enforces strict security requirements such as encryption in transit, limited access patterns, and detailed audit logging.

## Objective

Develop a Terraform configuration that establishes a cross-region VPC peering connection between the production VPC and the partner’s VPC.

The configuration must:

1. Create a VPC peering connection with proper requester and accepter settings.
2. Enable DNS resolution across VPCs for cross-account hostname resolution.
3. Update route tables in both environments to permit traffic only between specific subnets.
4. Configure security groups to allow HTTPS (443) and custom API traffic (8443).
5. Enable VPC Flow Logs for both VPCs, storing data in S3 with a 1-minute aggregation interval.
6. Implement IAM roles and policies for cross-account access with least privilege and explicit deny rules.
7. Use Terraform data sources to dynamically retrieve accepter VPC details and validate CIDR compatibility.
8. Configure CloudWatch alarms for peering connection state changes and unusual traffic patterns.
9. Use locals to manage CIDR calculations, common tags, and reusable variables.
10. Output the peering connection ID, DNS resolution status, and the number of configured routes.

## Environment Details

* Multi-account AWS deployment across **us-east-1** and **us-east-2**.
* Production VPC (10.0.0.0/16) in **us-east-1**.
* Partner VPC (172.16.0.0/16) in **us-east-2**.
* Both environments follow a three-tier architecture (public, private, and database subnets) across three Availability Zones.
* Terraform version 1.5+ and AWS provider 5.x.
* Existing components include NAT gateways, Internet gateways, EC2 instances, and S3 VPC endpoints.

## Requirements and Constraints

* DNS resolution must be enabled for cross-account discovery.
* Route tables must only allow traffic to specific CIDR ranges.
* Security groups should restrict access to ports 443 and 8443.
* All resources must be tagged with `Environment`, `Project`, and `CostCenter`.
* Use Terraform data sources instead of hardcoded VPC values.
* Enable VPC Flow Logs with a 1-minute capture interval.
* Separate route tables for public and private subnets.
* Use locals for repeated expressions or calculated values.
* IAM policies must apply the principle of least privilege.
* Peering connections must reject overlapping CIDR ranges.

## Implementation Guidelines

### Platform and Structure

* Use Terraform (HCL) for all resources.
* Organize resources into separate modules for networking, security, monitoring, and IAM.
* Follow standard Terraform best practices.
* Apply consistent naming using the `environment_suffix` variable.

### Security and Compliance

* Enable encryption at rest using AWS KMS.
* Enforce TLS/SSL for encryption in transit.
* Apply least privilege to all IAM roles and policies.
* Enable detailed CloudWatch logging and monitoring.
* Ensure consistent tagging across all resources.

### Testing

* Include unit tests for Terraform modules.
* Perform integration tests to validate full deployment.
* Use `cfn-outputs/flat-outputs.json` for loading test parameters.

### Resource Lifecycle

* The infrastructure must support clean teardown for CI/CD.
* Fetch all secrets from AWS Secrets Manager; do not create new ones.
* Use `DeletionPolicy: Retain` only when necessary.

## Target Region

Deploy all resources in **us-east-1**.


## Success Criteria

* Terraform apply completes successfully.
* All security and compliance controls are met.
* Unit and integration tests pass.
* All resources are properly tagged and named.
* The infrastructure can be destroyed cleanly without residual resources.
