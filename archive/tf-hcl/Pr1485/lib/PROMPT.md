## Prompt

We need to build out a **Terraform configuration** that deploys a highly available, fault-tolerant web application across multiple AWS regions. This replaces the original CloudFormation YAML requirement but must still satisfy all the same functionality and constraints.

### What the stack must include

1. **VPC Setup** Create a VPC with both public and private subnets. Use NAT Gateways and Internet Gateways as needed for access.
2. **Load Balancing & Scaling** Provision an Elastic Load Balancer (ELB/ALB) for distributing traffic, and attach Auto Scaling groups for the application layer to handle demand changes.
3. **User Authentication** Integrate **AWS Cognito** for authentication and authorization.
4. **Database Layer** Deploy an **RDS MySQL** instance with Multi-AZ enabled for high availability, encrypted at rest with **AWS KMS**.
5. **Serverless Logic** Add **AWS Lambda** functions for backend/server-side processing, connected to other services as needed.
6. **API Gateway** Use **Amazon API Gateway** as the front door for all client-facing requests.
7. **Monitoring & Tracing** Enable **AWS X-Ray** for distributed tracing and **CloudWatch Logs** for all services.
8. **Content Delivery** Deploy a **CloudFront distribution** to serve static content globally with low latency.
9. **Security** Apply IAM roles and policies with the principle of least privilege. Encrypt all data at rest (KMS) and in transit (TLS/SSL).
10. **Multi-Region** Distribute infrastructure across **us-east-1** and at least one other region (e.g., us-west-2) for disaster recovery.
11. **Tagging & Standards** Tag all resources consistently (`Environment = Production`, `Application = WebApp`, etc.).

### Deliverables

A single Terraform configuration file:

- **`tap_stack.tf`** Contains all the resources and configurations listed above.

### Requirements

- The Terraform file must be **valid, deployable**, and structured according to best practices.
- All resources must be interconnected correctly (e.g., API Gateway Lambda RDS/S3, ALB Auto Scaling EC2, Cognito for user management).
- The deployment must work seamlessly with `terraform apply` and enforce **high availability, security, and compliance** standards.