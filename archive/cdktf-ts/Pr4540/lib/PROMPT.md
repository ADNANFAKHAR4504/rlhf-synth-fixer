Act as a Senior AWS Cloud Architect with expertise in Disaster Recovery (DR) and Infrastructure as Code automation using CDK for Terraform (CDKTF) with TypeScript.
Design a highly available single-region disaster recovery architecture for a financial transaction system that handles millions of requests daily and requires 99.999% uptime.
Constraints & Requirements:

- All code should be in one main file.
- Use AWS CDKTF (TypeScript) for all infrastructure definitions.
- Implement the architecture in one region (us-east-1) using Multi-AZ redundancy and automated recovery workflows.
- Use the following AWS services:
  - Route 53 for DNS and health checks
  - Aurora (PostgreSQL) for transactional data
  - ECS Fargate with an Application Load Balancer (ALB) for stateless compute
  - AWS Secrets Manager for credential storage
  - CloudWatch for monitoring and alerting
  - AWS Systems Manager (SSM) for automated DR testing and failover simulation
- Implement automated snapshot-based DR within the same region (e.g., restore to standby cluster in case of failure).
- Ensure all data is encrypted at rest and in transit using KMS.
- Provide modular IaC structure — separate modules for VPC, ECS, Aurora, and Route 53.
- Include outputs for key components (ALB DNS, Aurora endpoint, health check status).
- Add clear comments, logical resource separation, and a README file with deployment and failover testing instructions.
  Deliverables:
- Complete CDKTF TypeScript code implementing the above.
- README.md explaining deployment workflow and how to perform DR/failover simulation using SSM.
  Goal:
  Deliver a single-region, production-ready DR architecture that demonstrates high availability, observability, and automated failover handling without relying on multi-region complexity or Aurora Global Databases
