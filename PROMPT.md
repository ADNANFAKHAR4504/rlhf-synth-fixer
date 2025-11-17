# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup is expanding globally and needs to deploy their microservices architecture on Kubernetes. They require a production-grade EKS cluster with strict network isolation, automated pod scaling, and integration with their existing monitoring stack.

## Problem Statement
Create a Pulumi TypeScript program to deploy a production-ready EKS cluster with advanced networking and security configurations. The configuration must:

1. Create a VPC with 3 public and 3 private subnets across availability zones.
2. Deploy an EKS cluster version 1.28 with OIDC provider enabled and private endpoint access only.
3. Configure a managed node group with on-demand t3.medium instances (min: 2, max: 6, desired: 3) and spot t3.large instances (min: 1, max: 4, desired: 2).
4. Enable Security Groups for Pods by installing the latest VPC CNI addon with POD_SECURITY_GROUP_ENFORCING_MODE set to 'standard'.
5. Deploy the cluster autoscaler as a Kubernetes deployment with proper IRSA configuration and node selector for on-demand instances.
6. Create three IAM roles (dev-role, staging-role, prod-role) and map them to corresponding Kubernetes RBAC groups.
7. Configure CoreDNS with a custom ConfigMap that forwards *.internal.company.com queries to 10.0.0.2.
8. Deploy AWS Load Balancer Controller with IRSA for ingress management.
9. Create a Fargate profile for running system pods in the kube-system namespace.
10. Output the cluster endpoint, certificate authority data, and kubeconfig command.

**Expected output**: A fully functional EKS cluster with mixed node groups, advanced networking with pod security groups, IRSA-enabled autoscaling, custom DNS forwarding, and role-based access control. The cluster should be accessible only through private endpoints with all worker nodes isolated in private subnets.

## Constraints and Requirements
- Kubernetes RBAC must restrict namespace access based on IAM roles mapped to K8s groups
- OIDC provider must be configured for the cluster to enable IRSA functionality
- Cluster autoscaler must be deployed with IRSA (IAM Roles for Service Accounts) authentication
- Pod-to-pod communication must be encrypted using AWS VPC CNI with Security Groups for Pods
- All worker nodes must run in private subnets with no direct internet access
- EKS cluster must use managed node groups with mixed instance types for cost optimization
- CoreDNS must be configured with custom forward rules for internal DNS resolution

## Environment Setup
Production EKS infrastructure deployed in us-east-1 across 3 availability zones. Uses EKS 1.28 with managed node groups running AL2 EKS-optimized AMIs. VPC with RFC1918 private subnets (10.0.0.0/16) and public subnets for load balancers only. NAT Gateways in each AZ for outbound connectivity. Requires Go 1.21+, Pulumi 3.x CLI, kubectl, and AWS CLI v2 configured with appropriate IAM permissions for EKS, EC2, and IAM operations.

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - VPC: `eks-vpc-${environmentSuffix}`
  - EKS Cluster: `eks-cluster-${environmentSuffix}`
  - Node Group: `eks-nodegroup-${environmentSuffix}`
  - IAM Role: `eks-role-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `clusterName`, `roleName`, `nodeGroupName` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `protect: true` (Pulumi) → Use default `protect: false`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### EKS Clusters
- **CRITICAL**: Use private endpoint access only for production security
- **OIDC Provider**: Must be enabled for IRSA functionality
- **Cluster Version**: Use EKS 1.28 as specified
- **Tagging**: Tag all resources with EnvironmentSuffix for tracking

#### VPC and Networking
- **Subnets**: Create 3 public and 3 private subnets across different AZs
- **NAT Gateways**: Create NAT Gateways for private subnet internet access
  - **Note**: For cost optimization in test environments, can use 1 NAT Gateway
  - **Production**: Should use NAT Gateway per AZ for high availability
- **CIDR**: Use 10.0.0.0/16 as specified in requirements

#### IAM and IRSA
- **OIDC Provider**: Required for IAM Roles for Service Accounts
- **Service Accounts**: Create for cluster autoscaler and AWS Load Balancer Controller
- **IAM to K8s Mapping**: Map IAM roles (dev-role, staging-role, prod-role) to K8s RBAC groups

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `dependsOn` in Pulumi)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Pulumi TypeScript)
```typescript
const cluster = new eks.Cluster(`eks-cluster-${environmentSuffix}`, {
  name: `eks-cluster-${environmentSuffix}`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// name: 'eks-cluster-prod'  // Hardcoded, will fail
```

### Correct IRSA Configuration (Pulumi TypeScript)
```typescript
// Create OIDC provider
const oidcProvider = new iam.OpenIdConnectProvider(`eks-oidc-${environmentSuffix}`, {
  url: cluster.core.oidcProvider.url,
  clientIdLists: ["sts.amazonaws.com"],
  thumbprintLists: [cluster.core.oidcProvider.thumbprint],
});

// Create IAM role for service account
const serviceAccountRole = new iam.Role(`cluster-autoscaler-role-${environmentSuffix}`, {
  assumeRolePolicy: pulumi.all([cluster.core.oidcProvider.url, cluster.core.oidcProvider.arn]).apply(
    ([url, arn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: {
          Federated: arn
        },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringEquals: {
            [`${url.replace("https://", "")}:sub`]: "system:serviceaccount:kube-system:cluster-autoscaler"
          }
        }
      }]
    })
  )
});
```

### Correct VPC Configuration (Pulumi TypeScript)
```typescript
const vpc = new awsx.ec2.Vpc(`eks-vpc-${environmentSuffix}`, {
  cidrBlock: "10.0.0.0/16",
  numberOfAvailabilityZones: 3,
  subnetSpecs: [
    {
      type: awsx.ec2.SubnetType.Public,
      cidrMask: 20,
    },
    {
      type: awsx.ec2.SubnetType.Private,
      cidrMask: 20,
    }
  ],
  tags: {
    Name: `eks-vpc-${environmentSuffix}`,
    EnvironmentSuffix: environmentSuffix,
  },
});
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- EKS cluster deploys successfully with version 1.28
- VPC created with 3 public and 3 private subnets across AZs
- Managed node groups (on-demand and spot) are functional
- Security Groups for Pods are enabled via VPC CNI addon
- Cluster autoscaler deployed with IRSA
- IAM roles mapped to Kubernetes RBAC groups
- CoreDNS configured with custom forwarding rules
- AWS Load Balancer Controller deployed with IRSA
- Fargate profile created for kube-system namespace
- All resources properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- All security and compliance constraints are met
- Tests pass successfully
