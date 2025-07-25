Prompt: High-Availability, Multi-Region Infrastructure Migration with AWS CDK and TypeScript
You are tasked with migrating an organization's on-premise infrastructure to a highly available, secure, and scalable multi-region architecture on AWS. The entire infrastructure must be defined and managed using the AWS Cloud Development Kit (CDK) with TypeScript.

The primary goal is to maintain or exceed existing service-level agreements (SLAs) by deploying resilient services across the us-east-1, eu-west-1, and ap-southeast-1 regions.

Requirements:
Multi-Region Deployment Strategy: Design the CDK application to be region-aware, capable of deploying consistent infrastructure stacks to all three target regions (us-east-1, eu-west-1, ap-southeast-1).

High Availability and SLAs: Implement a multi-AZ architecture within each region for critical components. This should include services like EC2 instances within an Auto Scaling Group behind an Application Load Balancer to ensure uptime and resilience.

Comprehensive Security:

Enforce encryption at rest for all storage services (e.g., EBS volumes, S3 buckets, RDS databases) using customer-managed AWS KMS keys.

Ensure all data in transit is encrypted, for example, by configuring HTTPS listeners on load balancers.

Strict Tagging Convention: Apply a consistent tagging strategy to all resources created by the CDK. Tags must follow the specific format env-resource-name (e.g., prod-web-server-asg, dev-main-database).

Intelligent Autoscaling: Configure autoscaling policies for compute resources based on performance metrics like CPU utilization or request count per target. The strategy should balance performance with cost-effectiveness.

Robust Monitoring and Alerting: Establish a comprehensive monitoring framework using AWS CloudWatch. Create custom alarms for key performance indicators (KPIs) and operational metrics (e.g., high CPU, unhealthy host count, application latency) to ensure prompt issue detection.

Idempotent and Reproducible Deployments: The CDK application must be designed to produce identical infrastructure when deployed multiple times, ensuring consistency across all environments.

Infrastructure Testing: Write unit tests for your CDK stacks and constructs using the Jest framework. The tests must validate that the created resources comply with the specified requirements, such as encryption settings, tagging conventions, and security group rules.

Expected Output:
Generate a complete and functional AWS CDK project in TypeScript that fulfills all the outlined requirements. The project should be well-structured to handle multi-region deployments. All CDK stacks must synthesize and deploy successfully, and the provided Jest tests must validate the compliance of the generated infrastructure. The final deliverable should include the CDK application code, testing files, and clear documentation in a README.md file.