Act as a Principal AWS Solutions Architect and CDK for Terraform (CDKTF) specialist with expertise in multi-region EKS disaster recovery and service mesh architectures.

Your task is to design and implement a multi-region, highly available, and fault-tolerant Amazon EKS disaster recovery infrastructure for a financial trading platform that must achieve 99.999% uptime and real-time failover between AWS regions.

### Technical Requirements

- Infrastructure as Code: Must be fully implemented using CDKTF with TypeScript.
- Regions:
  - Primary Region: `us-east-2`
  - Disaster Recovery Region: `eu-central-1`
- Networking:
  - Create isolated VPCs with CIDR ranges:
  - Primary: `10.0.0.0/16`
  - DR: `172.16.0.0/16`
  - Include public and private subnets, Internet Gateway, NAT Gateway, and appropriate route tables.
- EKS Configuration:
  - Deploy Amazon EKS clusters in both regions using version `1.27`.
  - Each cluster should have a managed node group with:
  - `min_size`: 2
  - `max_size`: 6
  - `instance_types`: `["m5.xlarge"]`
- Service Mesh:
  - Integrate AWS App Mesh for service discovery, routing, and traffic management between microservices across both regions.
  - Define all mesh components (Virtual Nodes, Virtual Routers, Virtual Services) as Infrastructure as Code using CDKTF custom constructs.
- Disaster Recovery (DR):
  - Implement automated failover between regions based on CloudWatch health metrics.
  - Use Route53 health checks and failover routing policies to direct traffic between EKS clusters.
  - Deploy a global Route53 DNS entry that automatically redirects clients to the healthy region.
- Monitoring & Alarms:
  - Create CloudWatch Alarms to monitor key metrics such as EKS API availability, App Mesh virtual node health, and node group status.
  - Use alarms to trigger Lambda-based failover orchestration or Terraform apply automation for regional switchovers.
- RTO / RPO Targets:
  - Recovery Time Objective (RTO): ≤ 15 minutes
  - Recovery Point Objective (RPO): < 1 minute
- Tagging & Outputs:
  - Tag all resources with `Project: iac-rlhf-amazon`
  - Expose outputs for:
  - `PrimaryEKSClusterName`
  - `DREKSClusterName`
  - `Route53FailoverDNS`
  - `AppMeshName`
- Code Organization:
  - Provide a single main CDKTF stack file in TypeScript.
  - Include logical separation using CDKTF constructs for networking, EKS, App Mesh, and monitoring.
  - Add clear inline comments explaining design decisions and AWS best practices.

### Deliverables

1. Complete CDKTF TypeScript code defining all resources.
2. Minimal supporting Terraform configuration (if required).
3. README section at the bottom of the code with setup and deployment instructions.
