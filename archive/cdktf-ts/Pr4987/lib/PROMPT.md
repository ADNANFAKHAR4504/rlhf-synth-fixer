Act as a Principal AWS Solutions Architect and CDK for Terraform (CDKTF) specialist.

Your task is to design and implement a multi-region disaster recovery architecture for a financial trading system requiring 99.999% uptime, an RTO of ≤ 5 minutes, and an RPO of ≤ 1 second.

### Technical Specifications

- Regions:
  - Primary: `us-east-1`
  - Secondary (DR): `us-west-2`
- AWS Services:
  - Amazon Aurora (multi-AZ primary with cross-region read replica — _no Aurora Global Cluster_)
  - AWS Route 53 for DNS failover
  - Application Load Balancer for routing
  - Auto Scaling Groups for compute redundancy
  - AWS CloudWatch for monitoring and alarms
  - AWS Systems Manager for failover orchestration

### Disaster Recovery Workflow

1. CloudWatch alarms detect primary region failure
2. Systems Manager or Lambda triggers DNS switch in Route 53
3. Application rehydrates using the Aurora read replica in the DR region

### Security & Compliance

- Encryption at rest using AWS KMS
- TLS-based encryption in transit
- IAM least-privilege access model
- Compliance with GDPR and financial industry standards

### IaC & Code Guidelines

- Implement entirely using CDKTF (TypeScript)
- Single `main.ts` file with modular constructs:
  - Networking
  - Compute
  - Database
  - DR orchestration
  - Security
- Include outputs:
  - `PrimaryDBClusterEndpoint`
  - `ReplicaDBClusterEndpoint`
  - `PrimaryALBEndpoint`
  - `Route53FailoverDNS`
