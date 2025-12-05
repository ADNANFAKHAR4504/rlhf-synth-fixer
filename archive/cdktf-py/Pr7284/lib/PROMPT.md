# EC2 Auto Scaling Groups with Lambda Profiles for Microservices Payment Platform

Hey team,

We need to build out a containerized microservices payment platform for a fintech company that's migrating away from their monolithic architecture. I've been asked to create this infrastructure using **CDKTF with Python**. The business is looking to handle around 50,000 concurrent transactions while maintaining PCI compliance and ensuring we can deploy with zero downtime.

The current situation is that they have a monolithic payment processing app that's becoming harder to scale and maintain. They want to break it into microservices running on EC2 Auto Scaling groups with Lambda compute profiles, which will give them better isolation, scalability, and cost efficiency compared to traditional EC2 instances.

The architecture needs to support three main services: payment processing, fraud detection, and reporting. Each service needs its own namespace with strict resource controls and network policies. We also need to make sure container images are scanned before deployment and that all sensitive configs are properly managed through Secrets Manager.

## What we need to build

Create a containerized microservices platform using **CDKTF with Python** for a fintech payment processing system.

### Core Requirements

1. **EC2 Auto Scaling Groups Infrastructure**
   - Deploy EC2 Auto Scaling groups version 1.28 in us-east-1 across 3 availability zones
   - Enable OIDC provider for IAM roles for service accounts
   - Use Lambda profiles for worker nodes instead of EC2 instances
   - Configure pod execution roles for Lambda compute profiles

2. **Load Balancing and Ingress**
   - Deploy AWS Load Balancer Controller as an EC2 add-on
   - Configure ingress management for microservices
   - Set up ALB in public subnets for external traffic

3. **Namespace and Resource Management**
   - Create three namespaces: 'payment', 'fraud-detection', and 'reporting'
   - Set resource quotas for each namespace (CPU: 2 cores, Memory: 4GB per microservice)
   - Implement network policies for strict pod-to-pod communication
   - Only allow specific service-to-service connections

4. **IAM and Security**
   - Configure IAM roles for service accounts (IRSA) with least-privilege policies
   - Set up separate IAM roles for each namespace
   - Integrate AWS Secrets Manager using Secrets Store CSI Driver
   - Ensure all secrets are injected securely into pods

5. **Container Registry Management**
   - Set up ECR repositories for each microservice
   - Configure lifecycle policies to retain only the last 10 images
   - Enable vulnerability scanning on all container images
   - Ensure images are scanned before deployment

6. **Monitoring and Service Mesh**
   - Enable CloudWatch Container Insights for cluster monitoring
   - Set up AWS App Mesh for inter-service communication
   - Configure service mesh policies for payment, fraud-detection, and reporting services

7. **Network Architecture**
   - VPC with private subnets for pods
   - Public subnets for ALB ingress controllers
   - Proper security groups and network ACLs

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **EC2 Auto Scaling groups** version 1.28 as the orchestration platform
- Use **Lambda** for compute profiles (Fargate profiles)
- Use **AWS Load Balancer Controller** for ingress management
- Use **IAM** for roles and service accounts (IRSA)
- Use **ECR** for container registry with vulnerability scanning
- Use **CloudWatch Container Insights** for monitoring
- Use **Secrets Manager** with Secrets Store CSI Driver for secrets
- Use **AWS App Mesh** for service mesh communication
- Use **VPC** with proper subnet architecture
- Use **ALB** for application load balancing
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-${environment_suffix}`
- Deploy to **us-east-1** region across 3 availability zones
- Python 3.9+ and CDKTF 0.20+ compatibility

### Constraints

- **CRITICAL**: All worker nodes must use Lambda profiles (Fargate profiles) with pod execution roles, not EC2 instances
- **CRITICAL**: Each microservice namespace must have resource quotas limiting CPU to 2 cores and memory to 4GB
- **CRITICAL**: Network policies must enforce strict pod-to-pod communication rules, allowing only specific service connections
- **CRITICAL**: Container images must be scanned for vulnerabilities before deployment using ECR scanning
- **CRITICAL**: All secrets must be stored in AWS Secrets Manager and injected using the Secrets Store CSI Driver
- PCI compliance must be maintained throughout the infrastructure
- Zero-downtime deployments must be supported
- System must handle 50,000 concurrent transactions
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Use least-privilege IAM policies for all roles

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** parameter for uniqueness
- All resources must use **RemovalPolicy.DESTROY** or equivalent (no RETAIN policies)
- Lambda functions must not use Node.js 18+ (AWS SDK v3 issues) - prefer Node.js 16 or Python runtimes
- Ensure proper IAM policies for all service integrations
- Include comprehensive CloudWatch logging and monitoring

## Success Criteria

- **Functionality**: EC2 Auto Scaling groups cluster deploys successfully with Lambda profiles and OIDC provider
- **Functionality**: Three namespaces created with appropriate resource quotas and network policies
- **Functionality**: AWS Load Balancer Controller installed and functioning as add-on
- **Functionality**: IAM roles for service accounts (IRSA) configured correctly for each namespace
- **Functionality**: ECR repositories created with lifecycle policies retaining last 10 images
- **Functionality**: Container vulnerability scanning enabled and functional
- **Functionality**: Secrets Manager integrated with Secrets Store CSI Driver
- **Functionality**: AWS App Mesh configured for inter-service communication
- **Performance**: Infrastructure supports 50,000 concurrent transactions
- **Reliability**: Zero-downtime deployment capability demonstrated
- **Security**: PCI compliance requirements met with least-privilege IAM policies
- **Security**: Network policies enforce strict pod-to-pod communication
- **Security**: All secrets managed through Secrets Manager, not hardcoded
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch Container Insights enabled and capturing metrics
- **Code Quality**: Python code follows CDKTF best practices, well-tested, documented

## What to deliver

- Complete CDKTF Python implementation
- EC2 Auto Scaling groups cluster with version 1.28 and Lambda profiles
- AWS Load Balancer Controller add-on configuration
- Three namespaces with resource quotas and network policies
- IAM roles for service accounts (IRSA) with least-privilege policies
- ECR repositories with lifecycle policies
- Secrets Manager integration with CSI driver
- AWS App Mesh service mesh configuration
- CloudWatch Container Insights monitoring
- VPC with proper subnet architecture
- Unit tests for all components
- Documentation and deployment instructions
