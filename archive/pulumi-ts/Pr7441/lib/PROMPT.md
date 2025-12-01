# EC2 Auto Scaling with Advanced Container Orchestration

Hey team,

We need to build a production-ready EC2 Auto Scaling infrastructure with advanced container orchestration features for a fintech startup. They're deploying a microservices architecture and need strict security and compliance controls. The business is moving fast and needs this infrastructure to handle their growing transaction volumes while maintaining security and compliance standards.

This is a critical deployment for their platform. They need the infrastructure to support multiple microservices with proper service mesh communication, cost-effective compute with a spot-instance strategy, and robust observability. The security team has strict requirements around IAM policies and network segmentation.

The infrastructure needs to support auto-scaling based on custom metrics, centralized logging, and network policy enforcement. This is an expert-level task requiring careful integration of multiple AWS services and Kubernetes components.

## What we need to build

Create an EC2 Auto Scaling infrastructure using **Pulumi with TypeScript** for deploying a microservices architecture with advanced container orchestration, security, and observability features.

### Core Requirements

1. **EKS Cluster Setup**
   - Deploy Amazon EKS cluster version 1.28
   - Enable OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Configure proper VPC and networking for the cluster
   - Set up cluster security groups and IAM roles

2. **App Mesh Service Mesh**
   - Configure AWS App Mesh for microservices communication
   - Create virtual nodes for service discovery
   - Set up virtual services for routing
   - Enable mesh-level observability and tracing

3. **Node Groups with Spot Instances**
   - Deploy managed node groups with mixed instance strategy
   - Configure 70% spot instances and 30% on-demand instances
   - Set appropriate instance types and capacity settings
   - Enable auto-scaling for node groups

4. **IAM Roles for Service Accounts (IRSA)**
   - Implement fine-grained IAM policies for service accounts
   - Create service accounts with specific permissions
   - Set up trust relationships with OIDC provider
   - Follow principle of least privilege

5. **Calico CNI Installation**
   - Install Calico CNI using Helm chart
   - Configure network policy enforcement
   - Set up pod-to-pod network security
   - Enable network logging and monitoring

6. **Horizontal Pod Autoscaler**
   - Configure HPA with CloudWatch custom metrics
   - Set up metrics server or CloudWatch adapter
   - Define scaling policies based on application metrics
   - Configure min/max replicas and scaling thresholds

7. **Fluent Bit for Logging**
   - Deploy Fluent Bit as a DaemonSet
   - Configure log aggregation to CloudWatch Logs
   - Set up log groups and retention policies
   - Enable structured logging for microservices

8. **Cluster Autoscaler**
   - Install cluster autoscaler with proper IAM permissions
   - Configure node group tags for autoscaler discovery
   - Set scaling policies and thresholds
   - Enable scale-down and scale-up behaviors

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use Amazon EKS for container orchestration
- Use AWS App Mesh for service mesh
- Use Helm provider for Calico and other chart installations
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be tagged appropriately
- Enable CloudWatch logging and monitoring

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or DeletionProtection)
- All named resources must include environmentSuffix parameter
- Use RemovalPolicy.DESTROY or equivalent for all resources
- FORBIDDEN: DeletionProtection=true, RemovalPolicy.RETAIN, or Retain policies

### Security and Compliance

- Enable encryption at rest where applicable
- Use IAM roles instead of access keys
- Implement network segmentation with security groups
- Enable VPC Flow Logs for network monitoring
- Follow AWS Well-Architected Framework security pillar
- Implement fine-grained IAM policies for service accounts

### Constraints

- EKS version must be 1.28
- Spot instance mix must be 70% spot, 30% on-demand
- All logs must go to CloudWatch Logs
- Network policies must be enforced using Calico
- Cluster autoscaler must have proper IAM permissions and node tags
- All resources must be properly tagged with environment, team, and cost center
- Include proper error handling and validation in the code
- Code must be production-ready with TypeScript type safety

## Success Criteria

- **Functionality**: EKS cluster deployed with all 8 required components working
- **Performance**: Auto-scaling works based on metrics, spot instances reduce costs
- **Reliability**: High availability with proper auto-scaling and health checks
- **Security**: IRSA enabled, fine-grained IAM policies, network policies enforced
- **Observability**: Centralized logging to CloudWatch, mesh telemetry enabled
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-typed, fully tested, documented
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- EKS cluster version 1.28 with OIDC provider
- AWS App Mesh configuration with virtual nodes and services
- Managed node groups with 70/30 spot/on-demand mix
- IRSA implementation with fine-grained IAM policies
- Calico CNI deployed via Helm
- Horizontal Pod Autoscaler with CloudWatch metrics
- Fluent Bit DaemonSet for CloudWatch log aggregation
- Cluster autoscaler with IAM permissions and node tags
- Comprehensive unit tests for all components
- Integration tests validating the complete setup
- Documentation including architecture decisions and deployment instructions
