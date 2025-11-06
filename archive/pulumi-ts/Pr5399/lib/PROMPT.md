Hey team,

We need to deploy our payment processing web application on AWS using containerization with proper load balancing and auto-scaling. The fintech startup I'm working with has been running into scaling issues with their current setup, and they need a robust solution that can handle traffic spikes during peak payment processing times.

The application is already containerized, and we have the Docker image ready in ECR. What we need now is a complete infrastructure setup that can run these containers reliably across multiple availability zones, automatically scale based on demand, and provide a single entry point for all traffic. The business has specific requirements around task sizing, scaling behavior, and monitoring that we need to implement.

I've been asked to build this using **Pulumi with TypeScript** since that's what our team standardized on. The infrastructure needs to be fully reproducible and follow infrastructure-as-code best practices.

## What we need to build

Create a containerized web application deployment system using **Pulumi with TypeScript** for the payment API service in the ap-southeast-1 region.

### Core Requirements

1. **ECS Cluster and Service**
   - Set up an ECS cluster using Fargate launch type for serverless container management
   - Deploy ECS service with exactly 3 desired tasks distributed across multiple availability zones
   - Configure task definition with 512 CPU units and 1024 MB memory allocation
   - Ensure tasks run in private subnets with NAT gateway access for outbound connectivity
   - Enable container insights for enhanced monitoring and observability

2. **Application Load Balancer**
   - Configure Application Load Balancer to distribute traffic across ECS tasks
   - Set up health checks pointing to the /health endpoint
   - Configure HTTPS listener on port 443 with ACM certificate
   - Create target group with 30-second deregistration delay for graceful shutdowns

3. **Auto-Scaling Configuration**
   - Implement auto-scaling policy based on CPU utilization
   - Set target CPU utilization at 70 percent
   - Configure minimum of 3 tasks and maximum of 10 tasks
   - Ensure scaling policies respond quickly to traffic changes

4. **Logging and Monitoring**
   - Set up CloudWatch log group for container logs
   - Configure 7-day retention period for logs
   - Ensure all container output is captured and accessible

5. **Resource Management**
   - Tag all resources with Environment=production and Project=payment-api
   - Use environmentSuffix in all resource names for uniqueness and environment isolation
   - Follow naming convention: resource-type-environment-suffix
   - Ensure all resources are fully destroyable with no Retain deletion policies

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **ECS with Fargate** for compute - no EC2 instances
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch** for logging and monitoring
- Container image must be pulled from ECR repository in ap-southeast-1 region
- Consider using awsx package for simplified ECS service creation
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **ap-southeast-1** region
- All resources must support clean destruction without manual intervention

### Constraints

- Must use Fargate launch type exclusively - no EC2-based ECS deployments
- ECS tasks must run in private subnets only, with NAT gateway for internet access
- ALB must be internet-facing and placed in public subnets
- HTTPS must be used for ALB listener on port 443 with proper ACM certificate configuration
- Container insights must be enabled at the cluster level
- All resources must be tagged consistently for cost tracking and organization
- No retention policies on resources - everything must be cleanly removable
- Include proper error handling and validation in the code
- Use TypeScript types properly throughout the implementation

## Success Criteria

- **Functionality**: ECS service successfully deploys 3 tasks running the containerized application
- **Load Balancing**: ALB distributes traffic evenly across all healthy tasks with working health checks
- **Networking**: Tasks run in private subnets with NAT gateway for outbound connections
- **Auto-Scaling**: Service automatically scales between 3-10 tasks based on CPU utilization at 70 percent target
- **Monitoring**: Container logs appear in CloudWatch with 7-day retention, accessible for debugging
- **Accessibility**: Application is accessible via ALB DNS endpoint over HTTPS
- **Resource Naming**: All resources include environmentSuffix in their names
- **Security**: Proper security groups isolate ALB and ECS tasks with minimal required access
- **Code Quality**: Clean TypeScript code, well-typed, follows Pulumi best practices
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in the lib/ directory
- ECS cluster with Fargate launch type and container insights enabled
- Task definition with specified CPU and memory allocation
- ECS service configuration with desired count of 3 tasks
- Application Load Balancer with HTTPS listener and health checks
- Target group with 30-second deregistration delay
- Auto-scaling policies for CPU-based scaling between 3-10 tasks
- CloudWatch log group with 7-day retention
- VPC, subnets, and networking components (public and private subnets, NAT gateway)
- Security groups for ALB and ECS tasks
- All resources tagged with Environment=production and Project=payment-api
- Stack outputs exposing the ALB DNS endpoint
- Unit tests verifying resource creation and configuration
- Documentation explaining the deployment and architecture
