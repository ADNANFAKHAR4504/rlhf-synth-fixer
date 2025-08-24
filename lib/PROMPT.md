Using Pulumi's Java SDK, implement a multi-region, multi-account AWS web application deployment strategy that meets the following requirements:

- Multi-Account, Multi-Region Deployment
    - Use `com.pulumi.aws.cloudformation.StackSet` to orchestrate deployments across AWS accounts and regions.
    - Ensure consistency and replication of resources.

- Web Application Infrastructure
    - Define and deploy an **Elastic Load Balancer (ELB)**.
    - Configure **Auto Scaling Groups (ASGs)** for application servers.
    - Provision a **DynamoDB table** for application state management.

- IAM Roles and Security
    - Implement IAM roles for **StackSet administrators**.
    - Configure **execution roles** for trusted access across accounts.
    - Ensure **encryption at rest and in transit** for all resources.

- Observability and Outputs
    - Provide **application endpoints** as stack outputs.
    - Expose **logging dashboards** for monitoring.

- Constraints
    - The solution **must use `com.pulumi.aws.cloudformation.StackSet`** for managing multi-account, multi-region deployments.

- Design
    - The solution should follow a **modular design**, organizing resources into a `components` package.