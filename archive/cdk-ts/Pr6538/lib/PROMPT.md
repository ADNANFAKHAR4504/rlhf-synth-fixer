I need to set up an ECS Fargate infrastructure for our trading analytics application. We're running into issues with downtime during deployments, and the team wants to implement blue/green deployments to eliminate that.

Here's what we're working with: a containerized application that processes real-time market data. It needs to stay up 24/7, so we can't afford any downtime when we push updates. We've decided to go with ECS Fargate since we don't want to manage servers ourselves.

The infrastructure needs to be deployed in us-east-1 because that's where our market data feeds are, and latency matters for this use case. We need it spread across 3 availability zones for redundancy.

Here's the breakdown of what I need:

**Networking:**
- A VPC with 3 availability zones
- Public subnets for the load balancer
- Private subnets for the ECS tasks
- NAT gateways so containers can pull images and make outbound calls

**Container Infrastructure:**
- An ECS cluster set up for Fargate workloads
- Container Insights enabled so we can see what's happening inside the containers
- An ECR repository to store our Docker images
- Image scanning on push to catch vulnerabilities early
- Lifecycle policy to keep only the last 10 images (we don't need to keep everything)

**Application Configuration:**
- Task definition with 2GB memory and 1024 CPU units
- CloudWatch logging configured with 30-day retention
- Health check endpoint at /health
- Container listening on port 8080

**Load Balancing:**
- Application Load Balancer that's internet-facing
- Two target groups (blue and green) for the blue/green switching
- Health checks every 30 seconds, 2 consecutive failures before marking unhealthy
- Initially route traffic to the blue target group

**Deployment:**
- ECS service integrated with CodeDeploy for blue/green deployments
- 5-minute timeout for deployments
- Automatic rollback if something goes wrong
- Service should start with 0 tasks initially (we'll push the image separately)

**Scaling:**
- Auto-scaling between 2 and 10 tasks
- Scale out when CPU hits 70%
- Scale in when CPU drops below 30%
- Cooldown periods to prevent thrashing

**Monitoring:**
- Alarm when CPU usage goes above 80%
- Alarm when we have unhealthy tasks
- Alarm when deployments fail
- SNS topic to send notifications
- All alarms should trigger notifications

**Security:**
- IAM roles with least privilege
- Task execution role that can pull from ECR and write to CloudWatch
- CodeDeploy role with permissions to manage ECS and ALB
- Security groups restricting traffic appropriately

**Outputs:**
- ALB DNS name (so we know where to point our domain)
- ECR repository URI (for CI/CD to push images)
- CodeDeploy application name (for deployment automation)

I'm using AWS CDK v2 with TypeScript. The stack should be named TapStack, and I need to support an environment suffix (like 'dev', 'staging', 'prod') that gets added to resource names.

Can you help me build this out? I want to make sure everything is wired together correctly and follows AWS best practices.
