Hey team,

We need to build a production-grade ECS Fargate deployment for our fraud detection microservices. The finance team has three distinct workload types that need to run on AWS: a customer-facing REST API that needs to scale dynamically with traffic, background workers processing fraud detection jobs from queues, and scheduled batch jobs that run analytics every 6 hours. Each service has different scaling patterns and resource requirements, so we need infrastructure that can handle these varied workloads efficiently.

The current setup is all manual and doesn't have proper monitoring or service discovery. We need to automate the entire deployment using AWS CDK with TypeScript so the team can deploy updates with confidence. The business wants blue-green deployment capabilities with automatic rollbacks if something goes wrong during a deployment.

For service discovery, the microservices need to communicate with each other using DNS-based service discovery rather than hardcoded endpoints. The API service needs to be accessible via an Application Load Balancer with path-based routing, while inter-service communication should use AWS Cloud Map for dynamic service discovery.

## What we need to build

Create a containerized microservices platform using **AWS CDK with TypeScript** for deploying fraud detection services on ECS Fargate.

### Core Requirements

1. **ECS Cluster Configuration**
   - Create ECS cluster with Container Insights enabled for monitoring
   - Configure capacity providers for both Fargate and Fargate Spot
   - Enable CloudWatch Container Insights for enhanced monitoring

2. **Three Service Types with Different Scaling**
   - REST API service: 2-10 tasks with auto-scaling
   - Background worker service: 1-5 tasks with auto-scaling
   - Scheduled job service: runs every 6 hours on a schedule

3. **Application Load Balancer Setup**
   - Path-based routing: /api/* routes to API service
   - Health check endpoint: /health for service health monitoring
   - TLS termination and proper security groups

4. **Auto-Scaling Configuration**
   - API and worker services scale based on CPU utilization (scale-out at 70%)
   - API and worker services scale based on memory utilization (scale-out at 80%)
   - Proper scaling policies for scale-in and scale-out

5. **Service Discovery**
   - AWS Cloud Map namespace for service discovery
   - DNS records for each service to enable inter-service communication
   - Services can discover each other by DNS name

6. **Task Definitions with Resource Limits**
   - API service: 512 CPU units, 1024 MB memory
   - Worker service: 1024 CPU units, 2048 MB memory
   - Scheduled job service: 256 CPU units, 512 MB memory

7. **Logging and Tracing**
   - CloudWatch log groups with 7-day retention for each service
   - AWS X-Ray sidecar containers for distributed tracing
   - Proper log stream naming and filtering

8. **IAM Task Roles**
   - Least-privilege IAM roles for each task type
   - Access to AWS Secrets Manager for retrieving secrets
   - Access to S3 buckets for data processing
   - Access to SQS queues for worker tasks


9. **CloudWatch Dashboards**
    - Task count metrics for each service
    - CPU and memory utilization graphs
    - Error rate tracking and alarms
    - Visibility into service health

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **ECS Fargate** exclusively (no EC2 launch type)
- Use **Application Load Balancer** for ingress traffic
- Use **AWS Cloud Map** for service discovery
- Use **CloudWatch** for logs and metrics
- Use **X-Ray** for distributed tracing
- Use **RDS Aurora PostgreSQL** in private subnets for database
- No backup retention is required for the database.
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **eu-central-1** region
- VPC spans **3 availability zones** with private subnets for ECS tasks
- Public subnets for Application Load Balancer
- For Load balancing HTTPS/TLS is not required.
- NAT gateways for outbound internet access and only 1 NAT gateway is required.
- As per the requirement no VPC flow logs is required.

### Constraints

- Use Fargate launch type exclusively for all ECS services
- Implement service discovery using AWS Cloud Map with private DNS namespace
- Configure auto-scaling based on both CPU and memory utilization metrics
- Use AWS Secrets Manager for database credentials and API keys (fetch existing secrets, do not create)
- Enable Container Insights and X-Ray tracing for all services
- Deploy services across exactly 3 availability zones for high availability
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation
- Use TypeScript strict mode

### Container Images

- ECR repositories should be created for the three services
- API service image: fraud-api
- Worker service image: fraud-worker
- Job service image: fraud-job
- Images will be pushed separately (infrastructure should reference repository URIs)

## Success Criteria

- Functionality: All three service types deploy successfully with proper task counts
- Performance: Auto-scaling responds correctly to CPU and memory thresholds
- Security: Task IAM roles follow least-privilege, secrets fetched from Secrets Manager
- Resource Naming: All resources include environmentSuffix for unique identification
- Monitoring: CloudWatch dashboards show metrics for all services
- CloudWatch Alarms are not required as per the task requirement.
- Service Discovery: Services can communicate via Cloud Map DNS names
- Code Quality: TypeScript code with types, unit tested, well documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- ECS cluster with Container Insights enabled
- Three ECS Fargate services (API, worker, scheduled job)
- Application Load Balancer with path-based routing
- Auto-scaling policies for API and worker services
- AWS Cloud Map service discovery namespace
- CloudWatch log groups with 7-day retention
- X-Ray sidecar configuration for distributed tracing
- Task IAM roles with access to Secrets Manager, S3, and SQS
- CloudWatch dashboards for monitoring
- RDS Aurora PostgreSQL cluster in private subnets
- VPC with 3 AZs, public and private subnets
- ECR repositories for container images
- Unit tests for all infrastructure components
- Integration tests validating deployed resources
- Documentation with deployment instructions
- Stack outputs including ALB DNS name, Cloud Map namespace, dashboard URLs

## Deployment Instructions

### Initial Infrastructure Deployment

The infrastructure is configured to deploy with ECS services at `desiredCount: 0` to allow successful deployment without requiring container images upfront.

1. **Deploy the infrastructure**:
   ```bash
   cdk deploy TapStack<environmentSuffix>
   ```

2. **Push container images to ECR** (after infrastructure is deployed):
   ```bash
   # Get ECR repository URIs from stack outputs
   aws cloudformation describe-stacks --stack-name TapStack<environmentSuffix> --query 'Stacks[0].Outputs'
   
   # Build and push images
   docker build -t fraud-api:latest ./api
   docker tag fraud-api:latest <api-repo-uri>:latest
   docker push <api-repo-uri>:latest
   
   docker build -t fraud-worker:latest ./worker
   docker tag fraud-worker:latest <worker-repo-uri>:latest
   docker push <worker-repo-uri>:latest
   
   docker build -t fraud-job:latest ./job
   docker tag fraud-job:latest <job-repo-uri>:latest
   docker push <job-repo-uri>:latest
   ```

3. **Scale up ECS services** (once images are available):
   ```bash
   # Scale API service to 2 tasks
   aws ecs update-service \
     --cluster fraud-cluster-<environmentSuffix> \
     --service fraud-api-<environmentSuffix> \
     --desired-count 2
   
   # Scale Worker service to 1 task
   aws ecs update-service \
     --cluster fraud-cluster-<environmentSuffix> \
     --service fraud-worker-<environmentSuffix> \
     --desired-count 1
   ```

4. **Update auto-scaling minimum capacity** (for production):
   ```bash
   # Update API service auto-scaling
   aws application-autoscaling register-scalable-target \
     --service-namespace ecs \
     --scalable-dimension ecs:service:DesiredCount \
     --resource-id service/fraud-cluster-<environmentSuffix>/fraud-api-<environmentSuffix> \
     --min-capacity 2 \
     --max-capacity 10
   
   # Update Worker service auto-scaling
   aws application-autoscaling register-scalable-target \
     --service-namespace ecs \
     --scalable-dimension ecs:service:DesiredCount \
     --resource-id service/fraud-cluster-<environmentSuffix>/fraud-worker-<environmentSuffix> \
     --min-capacity 1 \
     --max-capacity 5
   ```

### Notes

- The scheduled job service will run automatically via EventBridge without manual scaling
- Auto-scaling will work once services are scaled up and container images are available