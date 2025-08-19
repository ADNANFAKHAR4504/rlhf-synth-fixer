# Multi-Environment Consistency with AWS CDK (TypeScript)

We need to set up a **CDK stack** that can deploy a consistent infrastructure for our web application across **development, staging, and production** environments.

### Requirements

* All core resources (VPCs, subnets, EC2 instances, RDS databases, S3 buckets) should be defined once and reused across environments.
* Use **parameterization** to handle environment-specific values (e.g. network CIDRs, database endpoints, custom AMI IDs) without duplicating templates.
* Apply **consistent tagging** on all resources, including an `Environment` tag with values `Development`, `Staging`, or `Production`.
* Resource names should follow a convention where the environment name is prefixed (e.g. `dev-`, `staging-`, `prod-`).
* The solution should work in the **us-east-1** region.

### Deliverables

* A working **CDK app in TypeScript** that synthesizes CloudFormation templates for all three environments.
* Templates should be reusable, pass CloudFormation validation, and deploy correctly in each environment.


