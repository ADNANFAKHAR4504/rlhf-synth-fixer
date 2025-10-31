Hey team,

We need to build a highly available web application infrastructure for a fintech startup that processes payment APIs. The business is concerned about downtime and wants automatic failure recovery. I've been asked to create this using **Pulumi with TypeScript** for the ca-central-1 region.

The current situation is that they're running into service interruptions when instances fail or during traffic spikes. They need a system that can automatically detect problems and fix them without manual intervention. The payment processing API needs to stay available no matter what happens to individual servers.

## What we need to build

Create a self-healing infrastructure using **Pulumi with TypeScript** that automatically recovers from failures and scales based on demand.

### Core Requirements

1. **Auto Scaling Group Configuration**
   - Minimum of 2 instances to ensure availability
   - Maximum of 6 instances to handle traffic spikes
   - Instances distributed across at least 2 availability zones (ca-central-1a and ca-central-1b)
   - Use Amazon Linux 2 AMI with t3.micro instance type for cost efficiency

2. **Load Balancing and Health Checks**
   - Application Load Balancer to distribute traffic
   - Health checks on /health endpoint expecting HTTP 200 response
   - Health check interval of 30 seconds with 5 second timeout
   - Health check grace period of 300 seconds for new instances
   - Target group deregistration delay of 30 seconds
   - HTTP listener on port 80

3. **Automatic Scaling Policies**
   - Scale up when CPU utilization exceeds 70% for 2 minutes
   - Scale down when CPU utilization drops below 30% for 5 minutes
   - Auto Scaling cooldown period of 300 seconds between scaling actions

4. **Failure Recovery Automation**
   - ELB health checks enabled to automatically replace unhealthy instances
   - Instance replacement when health checks fail for 3 consecutive periods
   - CloudWatch alarms for high CPU utilization
   - CloudWatch alarms for unhealthy target count

5. **Instance Configuration**
   - User data script to set up simple health check endpoint
   - Instance profile with necessary IAM permissions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **EC2** for Auto Scaling Groups and instances
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch** for monitoring and alarms
- Use **VPC** with public and private subnets across 2 availability zones
- Use **IAM** for service permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ca-central-1** region
- Multi-AZ deployment across ca-central-1a and ca-central-1b exactly

### Constraints

- Must use t3.micro instance type to minimize costs
- Health check path must be /health returning HTTP 200
- CloudWatch alarm evaluation period of 60 seconds
- All resources must be destroyable with no Retain policies
- All resources tagged with Environment=production and ManagedBy=pulumi
- Include proper error handling and resource dependencies
- Instance user data must configure health check endpoint

## Success Criteria

- **Functionality**: Infrastructure automatically replaces failed instances and maintains service availability
- **Performance**: System scales up under load and scales down when idle
- **Reliability**: Minimum of 2 instances always running across multiple availability zones
- **Security**: Proper IAM roles and security groups with least privilege
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript code with proper types, well-structured, documented with inline comments
- **Monitoring**: CloudWatch alarms trigger on unhealthy conditions

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with public and private subnets across 2 AZs
- Application Load Balancer with target group and listener
- Auto Scaling Group with launch configuration
- CloudWatch alarms for CPU and health monitoring
- IAM roles and security groups
- Instance user data script for health endpoint
- All resources properly tagged
- Documentation with deployment instructions