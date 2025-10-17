Objective:
Generate a TypeScript file named `cloudSetup.ts` that defines a complete AWS CloudFormation stack using AWS CDK or SDK constructs.
Important: Ensure a string suffix variable is appended to all resource names where needed.

---

### Problem Statement

Develop a CloudFormation stack using TypeScript to set up a cloud environment with the following requirements:

1. Region:
 Deploy the stack in the us-east-1 region.

2. VPC:
 Create a VPC with at least one public subnet and one private subnet.

3. IAM Role:
 Create an IAM role with restricted permissions, intended for use by EC2 instances.

4. S3 Buckets:
 Enable logging for all S3 buckets and configure cross-region replication.

5. RDS:
 Set up an RDS PostgreSQL instance, placed within a private subnet.

6. NAT Gateway:
 Ensure public subnets are associated with a NAT Gateway.

7. EC2 Instances:
 All EC2 instances must use a specified AMI ID for consistency.

8. Application Load Balancer (ALB):
 Implement an ALB to handle web traffic for EC2 instances.

9. Idempotency:
 The script must be idempotent, supporting repeated deployments without failure.

10. Template Length:
Ensure the total template length is under 50,000 characters.

11. TypeScript:
Code must be written in TypeScript, using AWS SDK or CDK features.

12. Resource Naming:
Resource names must include a string suffix variable to ensure uniqueness.

---

### Environment

This task involves setting up a secured cloud environment using AWS CloudFormation defined in TypeScript.
The environment includes a VPC, EC2 instances, load balancers, RDS, and S3, located in the us-east-1 region, and must adhere to all specified constraints.

---

### Constraints

- The stack must be deployed in the us-east-1 region.
- A VPC with at least one public and one private subnet is required.
- Idempotency must be ensured for repeat deployments.
- Logging must be enabled for all S3 buckets.
- An IAM role with specific permissions for EC2 instances should be created.
- Use TypeScript to define the CloudFormation stack.
- Ensure the CloudFormation template remains under 50,000 characters.
- Create an RDS PostgreSQL instance in a private subnet.
- Public subnets must be associated with a NAT Gateway.
- All EC2 instances must be launched with a specified AMI ID.
- An ALB should be included for the web servers.
- S3 buckets should be configured for cross-region replication.
- Resource names must append a string suffix variable for uniqueness.

---

### Instructions

- Do not change or omit any requirements or constraints.
- Output only a valid TypeScript file named `cloudSetup.ts` using AWS CDK or SDK constructs.
- Use best practices for security, scalability, and operational excellence.
- The configuration must be ready for deployment, supporting CloudFormation rollback and failure mechanisms.
- All resource names must include a string suffix variable.
- All constraint items must be strictly enforced.

---

Expected Output:
A single TypeScript file, `cloudSetup.ts`, implementing all requirements and constraints above, ready for deployment as a CloudFormation stack.


.