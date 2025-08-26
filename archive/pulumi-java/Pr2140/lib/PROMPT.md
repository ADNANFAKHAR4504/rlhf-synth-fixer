Using Pulumi's Java SDK, implement a multi-region, multi-account AWS web application deployment strategy that meets the following requirements:

1. Using com.pulumi.aws.cloudformation.StackSet, orchestrate deployments across AWS accounts and regions and ensure consistency and replication of resources.
2. Define and deploy an Elastic Load Balancer (ELB) and Configure Auto Scaling Groups (ASGs) for application servers.
3. Provision a DynamoDB table for application state management.
4. Implement IAM roles for StackSet administrators and configure execution roles for trusted access across accounts.
5. Ensure encryption at rest and in transit for all resources.
6. Provide application endpoints as stack outputs 
7. Expose logging dashboards for monitoring.
8. The solution should follow a modular design, organizing resources into a components package.