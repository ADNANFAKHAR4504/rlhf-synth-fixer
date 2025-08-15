**Prompt:**

You are an expert AWS Solutions Architect specializing in Infrastructure as Code with TypeScript and the AWS Cloud Development Kit (CDK). Your mission is to create a highly available, scalable, and secure application environment. This requires you to write a complete CDK project in TypeScript to meet the following specifications, with a critical focus on how resources are interconnected and managed across multiple regions.

1.  **Multi-Region Deployment:** The solution must be deployable to two different AWS regions (e.g., `us-east-1` and `us-west-2`). The project structure should be organized to support this multi-region strategy.
2.  **Networking:** In each region, deploy a Virtual Private Cloud (VPC) with public and private subnets to segregate network traffic and securely host different tiers of the application.
3.  **Application Tier:** In the public subnets of each region, configure an Application Load Balancer (ALB). This ALB will distribute traffic to an Auto Scaling Group of EC2 instances in the private subnets. The Auto Scaling Group must have policies to dynamically adjust capacity based on traffic patterns.
4.  **Database Tier:** In the private subnets of each region, deploy an Amazon RDS database instance using a Multi-AZ configuration for high availability and automated backups.
5.  **Resource Connectivity:** The application tier (EC2 instances) must be able to securely connect to the database tier (RDS instance). You must configure the appropriate security groups and network access controls to enable this specific traffic flow while adhering to the principle of least privilege. The ALB must also be securely configured to route traffic to the EC2 instances.
6.  **Modularity and Organization:** The code must be modular and reusable. Use CDK Constructs to abstract and organize components like the VPC and the application tier, making the code clean and maintainable.
7.  **Monitoring and Tagging:** Integrate AWS CloudWatch for monitoring and logging. All resources within the stack must be tagged with `Environment: Production`, `Project: MultiRegionApp`, and `Owner: [Prakhar-Jain]`.
8.  **Scalability:** The architecture should be inherently scalable and able to adapt to varying loads.

**Expected Output:**

A complete and runnable CDK project in TypeScript, including a clear `lib` directory with modular constructs and a `bin` file to define and deploy the stacks. The code should be fully commented to explain the purpose of each resource, the security configurations, and, most importantly, the secure connections between all resources across the regions. The final output should be a validated, deployable CDK solution that serves as a best-practice example for secure, scalable, and multi-regional AWS infrastructure.
