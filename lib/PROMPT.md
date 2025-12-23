Need a production-ready AWS infrastructure for hosting our web application. Building with CDK Python. The setup needs to be secure, scalable, and follow AWS best practices.

## Infrastructure Components

**Networking**
- VPC in us-east-2 spanning three AZs with public and private subnets
- NAT Gateway connecting private subnets to internet
- Security groups controlling traffic between all components

**Load Balancing and Compute**
- ALB in public subnets routing HTTP/HTTPS traffic to EC2 instances
- EC2 instances running in private subnets behind the ALB
- Auto Scaling Group monitoring CloudWatch CPU metrics to scale instances up or down

**Database**
- RDS MySQL instance in isolated private subnet accessed only by EC2 instances
- KMS encryption enabled for data at rest
- Database credentials stored in Secrets Manager

**Static Content**
- S3 bucket serving static files publicly
- Bucket encrypted with KMS for security
- IAM policies allowing EC2 instances to read/write objects

**Monitoring**
- CloudWatch alarms watching EC2 CPU, RDS connections, and ALB response times
- CloudWatch Logs collecting application logs from EC2 instances

**Backup**
- AWS Backup taking daily snapshots of RDS database

## Service Integration

The traffic flow works like this: Users hit the ALB in public subnets, which routes requests to EC2 instances in private subnets. EC2 instances connect to RDS database for data storage and to S3 bucket for static files. CloudWatch monitors all services and triggers Auto Scaling when CPU exceeds 70%. Security groups ensure EC2 only accepts traffic from ALB, and RDS only accepts connections from EC2.

## Configuration

Use cdk.json or environment variables to configure:
- Instance types and RDS class
- Environment: dev or prod
- Project name for resource naming

## Resource Naming

Follow this pattern: myapp-dev-vpc, myapp-prod-web-asg, myapp-dev-database

## Expected Outputs

- tap_stack.py with modular infrastructure code
- tap.py as CDK app entry point
- Unit tests validating individual resources
- Integration tests checking full deployment