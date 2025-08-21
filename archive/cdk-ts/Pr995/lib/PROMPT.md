## Prompt

You are an AWS Cloud Infrastructure Engineer specializing in highly available, secure, and production-grade architectures. Your task is to implement the following requirements using AWS CDK with TypeScript, replacing the original CloudFormation YAML requirement while maintaining all specified functionality and constraints.

## Instructions

- **Requirements Analysis:** 
Carefully review all requirements for high availability, security, CI/CD automation, monitoring, compliance, and resilience across multiple AWS regions. 
- **AWS CDK Implementation:** 
- Use AWS CDK (TypeScript) for all infrastructure as code.
- Organize the solution into:
- `bin/tap.ts`: CDK app entry point.
- `lib/tap-stack.ts`: CDK stack definition with all AWS resources.
- `cdk.json`: CDK project configuration.
- The stack must:
1. Deploy infrastructure spanning both `ap-south-1` and `us-east-2` regions to guarantee availability.
2. Deploy **EC2 instances** within an **Auto Scaling Group** behind an **Elastic Load Balancer** configured for **cross-zone load balancing**.
3. Use **Amazon RDS** with **Multi-AZ deployment**, automated backups, and encryption at rest using **AWS KMS**.
4. Store static assets in **Amazon S3** with restricted public read access and encryption at rest.
5. Configure **IAM roles and policies** for least-privilege access.
6. Implement **logging and monitoring** with **Amazon CloudWatch Logs**, metrics, and alarms for performance and security events.
7. Encrypt all data **at rest** with AWS KMS and **in transit** using SSL/TLS certificates provisioned via **AWS Certificate Manager**.
8. Use **Amazon Route 53** with DNS failover routing policies and health checks for high availability.
9. Implement a **CI/CD pipeline** using **AWS CodePipeline** and **AWS CodeBuild** for automated deployments and updates.
10. Configure **NAT Gateways** and **Internet Gateways** for VPC connectivity following AWS best practices.
11. Apply a consistent naming convention for all resources and tag them appropriately.
- **Security and Compliance:** 
- Follow AWS best practices for network isolation, IAM, and encryption.
- Ensure no hard-coded secrets in the codebase.
- Restrict access to the application through the custom domain and SSL/TLS.
- **Output:** 
- Code must be production-ready, modular, and deployable using `cdk deploy`.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Provisions VPCs, public/private subnets, NAT and Internet Gateways.
- Deploys EC2 in Auto Scaling Groups with ELB cross-zone load balancing.
- Sets up RDS with Multi-AZ, backups, and encryption.
- Uses S3 for static asset storage with access restrictions and encryption.
- Configures IAM roles with least privilege.
- Implements CloudWatch monitoring and logging with alarms.
- Secures traffic with ACM certificates for the custom domain.
- Implements Route 53 failover routing with health checks.
- Includes AWS CodePipeline and CodeBuild for CI/CD.
- Deploys in `ap-south-1` and `us-east-2`.

## Output Format

- Output the **complete content** for the following three files:
1. `bin/tap.ts`
2. `lib/tap-stack.ts`
3. `cdk.json`
- **Do not** include explanations, comments, or extra text**only the code** for each file.