Create a production-ready Terraform configuration in HCL that deploys an Amazon EKS cluster supporting mixed architecture workloads (x86 and ARM64). The implementation must be contained entirely within a single file named main.tf. A default provider.tf file will already be provided for AWS configuration, so do not create or modify any provider blocks.

You must adhere to the following constraints:
Node groups must use managed nodes with both x86 and ARM64 instance types (t3.medium for x86, t4g.medium for ARM64). All worker nodes must be deployed in private subnets only.
The EKS cluster endpoint must be private with public access restricted to specific company CIDR blocks. IAM Roles for Service Accounts (IRSA) must be enabled for the cluster.

Both node groups must have auto-scaling enabled with:
Minimum 2 nodes
Maximum 10 nodes
Desired capacity of 3 nodes

All resources must include the following tags:
Environment = "production"
Project = "platform-migration"
Owner = "devops-team"

EKS cluster logging must be enabled for all types:
api, audit, authenticator, controllerManager, scheduler
Proper IAM roles and policies must be created for the EKS cluster and node groups.
Security groups must allow necessary communication between the control plane and worker nodes.

Outputs must include:
EKS cluster endpoint
Certificate authority data
Cluster security group ID

The solution will run in the us-west-2 region across 3 availability zones with a VPC that includes both public and private subnets, NAT gateways for outbound internet access, and an Application Load Balancer for ingress. Ensure the generated code is modular, secure, and production-ready.