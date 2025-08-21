Here is a prompt designed for that purpose, mirroring the structure and detail of your Terraform example while focusing on AWS CDK and TypeScript.

***

**Prompt:**

You are an expert AWS Solutions Architect specializing in Infrastructure as Code with TypeScript and the AWS Cloud Development Kit (CDK). Your mission is to create a secure and robust application environment. This requires you to write a complete CDK stack in TypeScript to meet the following specifications, with a particular focus on how different resources communicate with each other.

1.  **Networking:** Design a Virtual Private Cloud (VPC) with a highly available configuration. The VPC must include at least two public and two private subnets, distributed across two different Availability Zones.
2.  **Database:** Deploy an Amazon RDS instance within the private subnets. This database must use the PostgreSQL engine (version 13 or higher) and be configured for Multi-AZ for high availability.
3.  **Application Tier:** Launch a fleet of `t3.micro` EC2 instances in the public subnets. These instances will host the application.
4.  **Resource Connectivity:** The EC2 instances must be able to securely connect to the RDS database. You need to configure the appropriate security groups and network access rules to enable this specific traffic flow while adhering to the principle of least privilege.
5.  **Data Storage:** Create an S3 bucket to store application artifacts. The bucket must have server-side encryption enabled using SSE-S3.
6.  **Identity and Access Management:** Create an IAM role with a restrictive policy, granting only the necessary permissions for the EC2 instances to read from and write to the S3 bucket. The EC2 instances should assume this role.
7.  **Observability:** Enable AWS CloudTrail to log all management events across the AWS account.
8.  **Tagging:** Apply the tag `Environment: Production` to all resources within the stack.

**Expected Output:**

A single, complete, and runnable TypeScript file for the CDK stack. The code should be fully commented to explain the purpose of each resource, the security group rules, and the connections between the EC2 instances, the RDS database, and the S3 bucket. The final output should be a validated, deployable CDK stack that demonstrates best practices for secure and connected AWS infrastructure.