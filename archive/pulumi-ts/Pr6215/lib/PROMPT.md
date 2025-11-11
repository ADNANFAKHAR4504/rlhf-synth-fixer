# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**
> Language: **ts**
> Region: **eu-west-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a microservices architecture on Kubernetes with service mesh integration. The configuration must: 1. Define three Kubernetes Deployments for payment-api, fraud-detector, and notification-service using pre-built container images from ECR. 2. Create corresponding Kubernetes Services for each deployment with ClusterIP type. 3. Configure Istio VirtualServices and DestinationRules for traffic management with mTLS enabled. 4. Implement NetworkPolicies that only allow payment-api to communicate with fraud-detector, and fraud-detector to communicate with notification-service. 5. Set up ConfigMaps containing service URLs and feature flags for each service. 6. Create Secrets for database connection strings and third-party API keys. 7. Configure HorizontalPodAutoscaler for each deployment targeting 50% CPU utilization. 8. Create an Istio Gateway and VirtualService to expose the payment-api externally. Expected output: A complete Pulumi TypeScript program that creates all resources with proper typing and exports the external gateway URL, internal service endpoints, and autoscaler status.

---

## Additional Context

### Background
A fintech startup needs to deploy their microservices architecture on Kubernetes with proper service mesh integration for secure inter-service communication. Their payment processing services require strict network policies and observability for compliance.

### Constraints and Requirements
- Use Pulumi's native Kubernetes provider (not YAML manifests)
- Deploy exactly 3 microservices: payment-api, fraud-detector, and notification-service
- Configure Istio service mesh with strict mTLS between services
- Implement Kubernetes NetworkPolicies to allow only specific service-to-service communication
- Use Kubernetes ConfigMaps for non-sensitive configuration and Secrets for API keys
- Deploy each service with exactly 2 replicas and appropriate resource limits
- Configure Horizontal Pod Autoscaling based on CPU utilization (50% threshold)
- Export the Istio ingress gateway URL and service endpoints as stack outputs

### Environment Setup
Kubernetes cluster (EKS 1.28) deployed in eu-west-2 with Istio 1.19 service mesh pre-installed. The cluster spans 3 availability zones with managed node groups using t3.medium instances. Requires Pulumi CLI 3.x with TypeScript, kubectl configured, and istioctl available. VPC already configured with private subnets for pods and public subnets for load balancers. Container images are stored in private ECR repositories in the same region.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **eu-west-2**
