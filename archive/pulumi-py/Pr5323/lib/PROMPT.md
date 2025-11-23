Hey there! We’re looking for a modular Pulumi Python solution to build a consistent AWS infrastructure. Please implement:

- Cross-region capability: Can be deployed into multiple regions with consistent naming and tagging.
- Core resources: Include VPCs, subnets, and routing that align with best practices for high availability and security in both regions.
- Compute and scaling: Set up auto-scaling groups with sensible minimum and maximum sizes and health-aware replacement policies.
- Identity and access: Define IAM roles with least-privilege permissions for resources to operate securely, and attach these roles to compute resources as needed.
- Storage and logs: Provision S3 buckets with versioning enabled and server-side encryption; ensure logs are delivered securely to CloudWatch Logs.
- Networking security: Implement security groups to enforce strict access controls and minimize exposure.
- Observability: Enable CloudWatch monitoring and alerts for key resources, with clear logging of deployment and runtime activity.
- Outputs and governance: Tag resources consistently with Environment, Team, and CostCenter, and produce outputs that include region-specific identifiers (VPC IDs, subnet IDs, instance or ASG ARNs).
- Consistent Naming: In addition to the tags, each resource's name should include both the Region (normalized i.e. useast1) and Environment Suffixs (pr1234) environment variables.
- Modularity and reuse: Structure the Pulumi Python code into reusable modules for VPC, compute, storage, IAM, and monitoring, with clear interfaces and documentation.
- Deployment and validation: Ensure the setup is repeatable, with validations to confirm resources exist and meet the defined constraints.

Notes:

- The solution should be fully declarative in Pulumi Python and leverage best practices.
- Emphasize maintainability, testability, and secure defaults.
