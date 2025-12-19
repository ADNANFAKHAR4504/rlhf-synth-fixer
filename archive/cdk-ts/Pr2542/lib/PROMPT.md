You are an expert AWS CloudFormation and CDK (TypeScript) architect.  
Your task is to generate **production-ready TypeScript CDK code** that meets the following requirements:

### Context

- Deployment Region: us-east-1
- Migration from on-premises to AWS
- Use AWS CloudFormation with CDK (TypeScript)

### Objectives

1. Networking
   - Create a custom VPC with a configurable CIDR block.
   - Configure **two availability zones** (primary + secondary).
   - Provision **public and private subnets** across both AZs.
   - Ensure NAT Gateways are deployed for private subnet egress.

2. Compute
   - Set up an **ECS Cluster**.
   - Use **Auto Scaling Groups (ASG)** with EC2 instances across multiple AZs for HA.
   - Configure scaling policies based on CPU/Memory usage.

3. Database
   - Deploy an **RDS instance** (Postgres or MySQL).
   - Enable **automatic failover** with read replicas in private subnets.
   - Ensure **automated backups** are enabled.

4. Security
   - Follow **least privilege IAM** principles.
   - Restrict **security groups** (least ingress/egress).
   - Enforce **encryption at rest (SSE, KMS)** and **in transit (TLS)**.

5. Managed Services
   - Use **AWS Secrets Manager** for DB credentials.
   - Use **Route 53** for DNS integration.

### Constraints

- Code must be written in **TypeScript CDK**.
- Ensure **explicit resource dependencies** for correct provisioning order.
- Outputs should include:
  - VPC ID
  - ECS Cluster Name
  - RDS Endpoint
  - Secrets Manager ARN
- All IAM roles/policies must follow **least privilege**.

### Output

- Provide a **single TypeScript CDK file** (e.g., `infra-stack.ts`).
- Include explanatory inline comments for clarity.
- Ensure the stack is deployable without modification.
