# Web Application Deployment with High Availability

I need to deploy a highly available web application in AWS using infrastructure code. The deployment should be production-ready and follow AWS best practices.

## Requirements

### Region and Availability Zones
- Deploy in us-west-2 region
- Use multiple Availability Zones for high availability

### Auto Scaling Configuration
- Implement Auto Scaling Group with minimum 2 instances and maximum 6 instances
- Configure CPU-based scaling policies (scale out when CPU > 70%, scale in when CPU < 30%)
- Use Application Load Balancer for traffic distribution

### Load Balancer and HTTPS Setup
- Deploy Application Load Balancer with HTTPS support
- Use Amazon Certificate Manager for SSL/TLS certificate
- Force HTTPS traffic and automatically redirect HTTP requests to HTTPS
- Configure health checks for application instances

### Storage and Logging
- Create S3 bucket for application logs
- Implement lifecycle policies: transition to Glacier after 30 days, delete after 365 days
- Enable S3 bucket versioning and server-side encryption

### Networking
- Create VPC with public and private subnets across multiple AZs
- Configure Internet Gateway and NAT Gateways for outbound internet access
- Set up proper security groups with least privilege access

### Latest AWS Features (2024-2025)
- Use ALB LCU Reservation feature to set minimum capacity for the load balancer
- Implement EC2 Auto Scaling with ARC zonal shift support for improved fault tolerance

### Tagging
- Apply consistent tags to all resources:
  - Environment: Production
  - App: WebApp

## Output Requirements

Please generate infrastructure code with the following structure:
- One code block per file
- Include all necessary configuration files
- Ensure each file can be created by copy-pasting from the response
- Follow infrastructure-as-code best practices
- Make the solution production-ready with proper error handling

The infrastructure should be deployable and create a secure, scalable web application environment ready for production workloads.