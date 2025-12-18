# Prompt
The infrastructure will be deployed across two distinct environments: development and production, both hosted on AWS. Each environment will need its own VPC, ECS cluster, and supporting AWS resources, ensuring complete isolation and the ability to test changes independently before pushing to production.

**Instructions:**

* Your task is to build a robust multi-environment cloud infrastructure using Pulumi/CDK with Typescript, focusing primarily on development and production environments. 
* This infrastructure will host a stateless, highly available application running on AWS ECS with Fargate. 
* The environments must be distinct, isolated, and self-contained, ensuring that changes can be effectively tested in development without affecting production.

**Here is the task you need to translate to pulumi/cdk:**
 Key Requirements:
 * Use Pulumi/CDK infrastructure as code to manage AWS resources.
 * Implement distinct VPCs for development and production purposes.
 * Deploy the application on AWS ECS using AWS Fargate, ensuring high availability across multiple Availability Zones.
 * Configure AWS Systems Manager Parameter Store for storing environment-specific configurations and ensure all configurations are encrypted using AWS KMS.
 * Balance traffic using an Application Load Balancer and manage DNS through AWS Route 53.
 * Implement monitoring with AWS CloudWatch, including setup of logs and enabling ECS Container Insights.
 * Set up Auto Scaling based on workload metrics.
 * Document the setup process, detailing the infrastructure and usage considerations in a comprehensive README.
 
 Expected Output: Provide a fully working Pulumi/CDK script written in TypeScript that can deploy the complete environment as specified. Ensure all provided test cases pass and submit the necessary documentation to guide users through the configurations and deployment processes.