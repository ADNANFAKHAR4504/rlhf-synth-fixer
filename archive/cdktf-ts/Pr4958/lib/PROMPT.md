You are a Principal AWS Solutions Architect and CDKTF expert. Your task is to design and implement a **multi-region disaster recovery (DR) solution** for a financial trading platform. The goal is to simulate a production-grade DR setup while keeping it medium-complexity, fully automatable, and deployable via **CDK for Terraform (CDKTF) in TypeScript**.

### Requirements:

1. **Regions:**
   - Primary: `us-east-1`
   - DR: `us-west-2`
2. **Core Infrastructure Components (per region):**
   - VPC with at least 2 public subnets
   - ECS Fargate cluster for containerized workloads
   - Application Load Balancer (ALB) for traffic routing
   - Aurora PostgreSQL cluster (separate clusters for primary and DR, **no Aurora Global**)
   - Route53 DNS failover with health checks pointing to ALB
   - Secrets Manager to store database credentials (with automatic rotation enabled)
   - CloudWatch alarms to monitor ALB health and support DNS failover
   - KMS encryption for all sensitive data
3. **Security & Best Practices:**
   - Apply least-privilege IAM roles
   - Enable encryption at rest and in transit
   - Tag all resources consistently:
     ```
     Project: iac-rlhf-amazon
     Environment: production
     ManagedBy: CDKTF
     ```
4. **DR Logic:**
   - DNS failover should redirect traffic to DR region when primary ALB is unhealthy
   - Include outputs to identify deployed resources (ALB DNS, Aurora ARNs, ECS service names)
   - No manual user inputs required; hardcode sensible defaults
5. **Output Requirements:**
   - `PrimaryAuroraClusterArn`
   - `DRAuroraClusterArn`
   - `PrimaryAlbDnsName`
   - `DrAlbDnsName`
   - `Route53FailoverDns`
   - `ECSServicePrimary`
   - `ECSServiceDR`
   - `TransitGatewayId` (for inter-region VPC communication)
6. **Code Organization (all in `main.ts`):**
   - Provider setup with aliases for multi-region deployment
   - Networking: VPC, Subnets, Route Tables, IGW
   - Security: Security Groups, IAM Roles
   - Database: Aurora clusters, DB subnet groups, secrets
   - Compute: ECS clusters, Fargate tasks, task definitions, services
   - Load Balancer: ALB, Target Groups, HTTPS listener
   - Route53: Health checks and failover records
   - CloudWatch alarms for failover simulation
   - Outputs for key resources
   - Inline comments explaining architecture choices and best practices
   - README-style comments at the bottom describing deployment and failover testing steps
7. **Constraints:**
   - No Aurora Global Database
   - Keep medium-complexity; realistic production setup but **simplified enough** to deploy successfully in one run
   - All secrets and credentials must be automatically generated; no manual entry
   - Include Transit Gateway attachments for inter-region VPC connectivity
     Deliver a **single-file CDKTF TypeScript solution** that implements this architecture in a realistic, secure, and production-ready manner.
