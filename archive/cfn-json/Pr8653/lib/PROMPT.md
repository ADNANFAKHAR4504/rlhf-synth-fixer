I need to build a secure web application infrastructure on AWS using CloudFormation. We're handling sensitive user data so security is critical. The setup needs to follow AWS Well-Architected Framework best practices.

Here's what I need deployed in us-east-1:

### Network Setup

Set up a VPC with public and private subnets across at least 2 Availability Zones. The public subnets handle internet-facing traffic while the private subnets host the application and database tiers. Include NAT Gateways for outbound access from private subnets and an Internet Gateway for public connectivity.

### Compute Layer

Deploy EC2 instances in the private subnet for the application server. These shouldn't have direct internet access - they should route through the NAT Gateway instead. Use Systems Manager for administration rather than SSH so we don't need to expose port 22.

### Database Tier

Put RDS in the private subnet with encryption at rest using a KMS customer-managed key. Enable SSL/TLS for connections in transit. Configure automated encrypted backups and Multi-AZ deployment for high availability. The database must not be publicly accessible.

### Load Balancer

Deploy an Application Load Balancer in the public subnet to handle incoming traffic. Set up HTTPS termination with ACM certificates, configure proper health checks, and define target group settings.

### Security Controls

Create Security Groups following least privilege - only open necessary ports like HTTPS/443 and HTTP/80 for the ALB, and the database port for RDS. Restrict source IPs where possible and add Network ACLs as an additional layer. No overly permissive 0.0.0.0/0 rules unless absolutely required.

### Encryption Requirements

All data must be encrypted both in transit and at rest:
- HTTPS/TLS for web traffic
- RDS with encryption and SSL enforcement
- EBS volume encryption for EC2 instances
- KMS for key management

### IAM Configuration

Create IAM roles with minimal permissions for EC2 instances. Set up proper service roles for RDS, ALB, and other services. Use instance profiles for EC2 to access AWS services. No hardcoded credentials.

### Monitoring

Enable VPC Flow Logs for network visibility, CloudTrail for API logging, and CloudWatch for monitoring all components. Set appropriate log retention.

### Additional Items

Configure AWS Config for compliance monitoring and implement a tagging strategy. Note that GuardDuty isn't included since it's a regional service that may conflict with existing deployments.

### Output

Provide a single valid YAML CloudFormation template that deploys this infrastructure with defense-in-depth security. Include parameters for flexibility and outputs for key identifiers and endpoints.
