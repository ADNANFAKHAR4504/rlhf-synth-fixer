# EKS Infrastructure Setup for Fintech Payment Platform

We're building out the infrastructure for our payment processing platform and need to get an EKS cluster up and running. The team has been working on migrating our microservices from a traditional deployment setup to Kubernetes, and we need this to be production-ready from day one.

## What We Need

The main requirement is an EKS cluster that can handle our payment processing workloads. We're dealing with real-time transactions, so reliability and security are critical. The infrastructure needs to support:

- Multiple node groups for different workload types (critical payment processing, general microservices, and background batch jobs)
- Secure pod-level access to AWS services using IRSA
- Proper RBAC so different teams can work with the cluster safely
- Automatic scaling based on demand
- Full observability with logging and monitoring

## Technical Requirements

**EKS Cluster:**
- Kubernetes version 1.28 or higher
- Private endpoint only (no public access)
- All control plane logs enabled and sent to CloudWatch
- Secrets encryption using KMS

**Node Groups:**
We need three separate node groups:
1. **Critical** - 3 to 5 nodes, t3.large instances, Bottlerocket AMI
   - Tainted for critical workloads only
   - Labeled for payment-processing workloads
2. **General** - 2 to 8 nodes, t3.large instances, Bottlerocket AMI
   - For general microservices
3. **Batch** - 1 to 2 nodes, t3.large instances, Bottlerocket AMI
   - Tainted for batch jobs only

All nodes should be in private subnets with NAT gateway access for outbound internet.

**IRSA Setup:**
We need service accounts configured for:
- Cluster Autoscaler (needs permissions to modify ASGs)
- AWS Load Balancer Controller (needs ELB permissions)
- EBS CSI Driver (needs EBS permissions)

**RBAC:**
Three Kubernetes roles:
- Admin - full access
- Developer - can manage deployments, pods, services, but read-only for secrets/configmaps
- Viewer - read-only access

**Add-ons:**
- AWS Load Balancer Controller (for ingress management)
- Cluster Autoscaler (for dynamic node scaling)
- EBS CSI Driver with gp3 storage class as default

**Network Policies:**
- Namespace isolation for production workloads
- Allow ingress from ingress-nginx and monitoring namespaces
- Pod disruption budgets with 50% minAvailable for critical namespaces

## Infrastructure Details

**VPC:**
- 3 availability zones
- Public subnets for load balancers
- Private subnets for EKS nodes
- NAT gateway in each AZ

**Storage:**
- gp3 EBS volumes with encryption enabled
- Default storage class should be gp3

## Environment

We're deploying to eu-central-1. The team uses AWS CDK v2 with TypeScript, and we have kubectl 1.28+ and AWS CLI v2 configured locally.

## Deliverables

Please provide:
1. `bin/tap.ts` - CDK app entrypoint
2. `lib/tap-stack.ts` - Complete EKS stack implementation

The stack should be named `TapStack` and should accept an optional `environmentSuffix` parameter (defaults to 'dev' if not provided). All resource names should include the environment suffix.

Make sure to include CloudFormation outputs for:
- Cluster endpoint URL
- OIDC provider URL  
- Kubeconfig command
