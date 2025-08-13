**Prompt:**

You are an expert AWS Solutions Architect specializing in Infrastructure as Code with TypeScript and the AWS Cloud Development Kit (CDK). Your mission is to create a secure, highly available, and robust networking foundation on AWS. This requires you to write a complete CDK stack in TypeScript to meet the following specifications, with a primary focus on secure and interconnected resource deployment.

1.  **VPC and Subnets:** Deploy a Virtual Private Cloud (VPC) with the CIDR block `10.0.0.0/16`. Within this VPC, create two public subnets and two private subnets, each located in a different Availability Zone for high availability.
2.  **Internet Connectivity:** The public subnets must have an Internet Gateway attached to allow outbound internet access. For the private subnets, configure a NAT Gateway to enable outbound internet connectivity for resources that need it (e.g., for software updates).
3.  **Security:** Implement security groups to control network traffic. The public subnets must allow inbound HTTP (port 80) and SSH (port 22) traffic from anywhere (`0.0.0.0/0`). SSH access to any resources in the private subnets must be explicitly denied.
4.  **IAM and Least Privilege:** Define an IAM role with a policy that strictly adheres to the principle of least privilege. This role should be assumed by any EC2 instances launched within this network, granting them only the minimum permissions required for their function.
5.  **Tagging:** Apply the following standard tags to all resources created by the stack: `Project: MyProject`, `Environment: Production`, `CostCenter: 12345`.
6.  **Resource Lifecycle:** To prevent accidental data loss, configure the stack to retain critical resources, such as S3 buckets or databases, even after a `cdk destroy` command. This can be achieved by setting the `removalPolicy` property on the resource to `RemovalPolicy.RETAIN`.

**Expected Output:**

A single, complete, and runnable TypeScript file for the CDK stack. The code should be fully commented, detailing the purpose of each resource, the logic behind the security group rules, and how the different components of the VPC (gateways, subnets, etc.) are connected. The final output must be a well-structured, validated, and deployable CDK stack that demonstrates best practices for secure and highly available AWS infrastructure.