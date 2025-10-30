Hey team,

We're building out the infrastructure for our fintech payment processing app and need your help getting this deployed on AWS. The product team has been pushing hard for this, and we need a solid, production-ready setup that can handle real traffic without breaking a sweat.

So here's the deal - we're going with a containerized approach using ECS Fargate. The app container is already sitting in ECR (fintech-app:latest), and we need to get it running across 3 availability zones in us-west-1. Each task should have 4 vCPUs and 8GB of memory since this thing processes payments and needs some horsepower.

For the frontend, we need an Application Load Balancer handling HTTPS traffic on port 443. We already have an ACM certificate ready to go, so just reference that. The ALB should forward traffic to our ECS tasks running on port 8080. Oh, and health checks need to hit the /health endpoint every 30 seconds - the devs have that endpoint ready.

Database-wise, we're using RDS Aurora PostgreSQL with a writer and reader instance (db.t3.micro for now). Make sure the connection is locked down - only ECS tasks should be able to hit the database on port 5432, and only the ALB should reach the ECS tasks.

Auto-scaling is critical here. We need the service to scale between 3 and 15 tasks based on CPU usage, targeting around 70% utilization. This app could see some serious spikes during business hours, so we need it to handle that gracefully.

For DNS, set up a Route53 A record pointing api.fintech-app.com to the load balancer. And all the ECS task logs should flow into CloudWatch with 30-day retention so we can debug issues when they pop up.

One more thing - we need to support blue/green deployments using target group switching. Zero downtime is non-negotiable here since we're handling financial transactions.

What we need from you:

1. Modular Terraform code split into logical files:
   - networking.tf for VPC stuff (use data sources for existing VPC/subnets, don't create new ones)
   - compute.tf for ECS cluster, services, task definitions
   - alb.tf for load balancer configuration
   - database.tf for RDS Aurora setup
   - security.tf for all security groups
   - dns.tf for Route53 records
   - monitoring.tf for CloudWatch log groups
   - autoscaling.tf for ECS auto-scaling policies
   - iam.tf for task execution and task roles (least privilege, please)
   - secrets.tf for Secrets Manager (RDS password goes here)
   - variables.tf for all input variables
   - outputs.tf for important resource IDs and endpoints
   - main.tf to tie everything together

2. Proper tagging on everything - we need Environment, Project, and ManagedBy tags for cost tracking

3. Security best practices:
   - ECS tasks must use awsvpc network mode
   - Database encryption at rest
   - Automated backups with 7-day retention
   - RDS password stored in Secrets Manager (no hardcoding!)
   - WAF web ACL on the ALB for DDoS protection (but disable deletion protection on ALB)
   - ECR image scanning enabled

A few gotchas to watch out for:
- Use Terraform 1.5+ with AWS provider 5.x
- Everything should be in private subnets except the ALB (public subnets)
- NAT gateways for outbound traffic so containers can pull images
- Make sure this can handle 10,000 concurrent users
- Rolling updates should work without any downtime

Let me know if you need clarification on anything. The product team wants to start testing this week, so we're a bit under the gun here.

Thanks!