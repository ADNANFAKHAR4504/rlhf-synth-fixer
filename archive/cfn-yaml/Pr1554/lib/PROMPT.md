# AWS CloudFormation Infrastructure Request

Hey there! I need your help creating a comprehensive AWS CloudFormation template for a web application infrastructure. I'm looking for something that's production-ready, secure, and follows AWS best practices.

## What I'm Looking For

I need you to design and build a complete AWS infrastructure stack in the us-east-1 region. This should be a robust, highly available setup that can handle production workloads.

## Infrastructure Requirements

### Networking & Security
- Set up a VPC with both public and private subnets across two availability zones for redundancy
- Implement proper security groups with least privilege access
- Make sure everything is tagged properly (Environment: Production)
- Follow PCI-DSS compliance standards where applicable

### Compute & Load Balancing
- Create an Auto Scaling Group that can scale from 2 to 10 EC2 instances based on demand
- Put an Application Load Balancer in front of the EC2 instances
- Configure the ALB to handle HTTPS traffic with a proper SSL certificate

### Database
- Deploy a PostgreSQL RDS instance in multi-AZ mode for high availability
- Keep the database in private subnets only - no direct internet access

### Storage & Content Delivery
- Set up S3 buckets with versioning and encryption enabled
- Use CloudFront as a CDN to distribute content globally

### Configuration & Monitoring
- Store application configuration in AWS Parameter Store
- Set up CloudWatch logging with proper retention policies

## Technical Requirements

- Everything needs to be in us-east-1
- The template must pass CloudFormation validation (`aws cloudformation validate-template`)
- Write clean, well-commented YAML code
- Make it production-ready and follow AWS best practices

## What I Need From You

Please create a single CloudFormation YAML file that includes all the components I mentioned above. The template should be comprehensive, secure, and ready to deploy. I want something that I can actually use in production without having to make major modifications.

Thanks for your help!