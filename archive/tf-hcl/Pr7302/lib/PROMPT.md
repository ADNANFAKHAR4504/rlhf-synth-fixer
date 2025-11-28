Hey team,

We need to modernize our e-commerce platform infrastructure to handle peak shopping seasons better. The current monolithic deployment can't scale effectively, and our development team needs isolated environments for testing without impacting production stability. I've been asked to create this using **Terraform with HCL** to deploy production-ready EC2 Auto Scaling groups for our containerized microservices.

The business is experiencing significant challenges during high-traffic periods. Our current setup doesn't provide the flexibility or scalability needed for a modern microservices architecture. We need an infrastructure that can automatically scale based on demand, maintain high availability across multiple zones, and provide secure, isolated compute resources for different types of workloads.

The infrastructure will support our frontend services, backend APIs, and data-processing workloads, each with different resource requirements. We also need to ensure proper security controls, encrypted communication between services, and automated scaling that responds quickly to load changes.

## What we need to build

Create a production-ready EC2 Auto Scaling infrastructure using **Terraform with HCL** for containerized microservices deployment in the eu-central-1 region.

### Core Requirements

1. **EC2 Auto Scaling Groups**
   - Deploy EC2 Auto Scaling groups version 1.28 with OIDC provider enabled
   - Configure across 3 availability zones for high availability
   - Enable cluster autoscaler with min 2, max 10 nodes per group
   - Autoscaling must respond within 90 seconds to load changes

2. **Managed Node Groups**
   - Create frontend node group using t3.large instances
   - Create backend node group using m5.xlarge instances
   - Create data-processing node group using c5.2xlarge instances
   - Each microservice must have dedicated node groups

3. **IAM and Security**
   - Implement IRSA (IAM Roles for Service Accounts) for pod-level AWS service access
   - Configure proper IAM policies and trust relationships
   - Enable OIDC provider for secure authentication

4. **Load Balancing and Ingress**
   - Deploy ALB (Application Load Balancer) ingress controller using Helm provider
   - Configure ALB in public subnets for external access
   - Ensure proper health checks and routing

5. **EC2 Add-ons**
   - Enable vpc-cni add-on with latest version
   - Enable kube-proxy add-on with latest version
   - Enable coredns add-on with latest version

6. **Service Mesh**
   - Deploy Istio service mesh for encrypted pod-to-pod communication
   - Enforce zero-trust network policies between namespaces
   - Ensure all inter-service communication is encrypted

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2 Auto Scaling groups** for compute resources
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Secrets Manager** for secrets storage and runtime injection
- Use **Amazon ECR** for container image storage with vulnerability scanning
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **eu-central-1** region across 3 availability zones

### Network Architecture

- Create dedicated VPC with 10.0.0.0/16 CIDR
- Private subnets for worker nodes with NAT gateways for outbound traffic
- Public subnets for load balancers
- Proper security group rules and network ACLs

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** variable for unique naming
- All resources must be destroyable (no Retain policies, use DESTROY removal policy)
- Container images must be scanned for vulnerabilities before deployment
- Secrets must be stored in AWS Secrets Manager and injected at runtime
- Network policies must enforce zero-trust communication between namespaces

### Constraints

- Terraform version 1.5 or higher required
- AWS CLI v2 must be configured with appropriate permissions
- All container images must be scanned for vulnerabilities before deployment
- Pod-to-pod communication must be encrypted using service mesh
- Cluster autoscaling must respond within 90 seconds to load changes
- Each microservice must have dedicated node groups with specific instance types
- Secrets must be stored in AWS Secrets Manager and injected at runtime
- Network policies must enforce zero-trust communication between namespaces
- All resources must be destroyable (FORBIDDEN: DeletionPolicy: Retain or RemovalPolicy: RETAIN)

## Success Criteria

- Functionality: All 6 mandatory requirements implemented and working
- Performance: Autoscaling responds within 90 seconds to load changes
- Reliability: High availability across 3 availability zones
- Security: IRSA enabled, secrets in Secrets Manager, encrypted pod communication
- Resource Naming: All resources include environmentSuffix variable
- Code Quality: Clean HCL code, well-structured, properly documented

## What to deliver

- Complete Terraform HCL implementation in lib/ directory
- EC2 Auto Scaling groups version 1.28 with OIDC provider
- Three managed node groups with specified instance types
- ALB ingress controller configured via Helm provider
- Cluster autoscaler configuration
- All required EC2 add-ons enabled
- VPC with proper subnet configuration
- IAM roles and policies for IRSA
- Security groups and network policies
- Variables file with environmentSuffix parameter
- Provider configuration for eu-central-1
- Documentation explaining the architecture and deployment process
