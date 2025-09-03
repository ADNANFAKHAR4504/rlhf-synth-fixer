# AWS Cloud Infrastructure Design with Python Pulumi

Hey there! I'm working on a pretty complex cloud infrastructure project and could really use some help. I need to design and implement a production-ready AWS environment using Python Pulumi, and I want to make sure I'm following all the best practices while keeping costs reasonable.

## What I'm Trying to Build

I need to create a robust, scalable AWS infrastructure that can handle production workloads. The environment should include:

**Networking Layer:**
- A VPC with at least two public and two private subnets across different availability zones
- NAT Gateways to give private subnet resources internet access (I know this adds cost, but it's necessary for security)
- Internet Gateway for public subnet access
- Route tables properly configured for traffic flow

**Compute Layer:**
- An Auto Scaling Group that deploys EC2 instances across the private subnets
- Elastic Load Balancer (Application Load Balancer preferred) to distribute incoming traffic
- Security Groups that follow the principle of least privilege - only allow what's absolutely necessary

**Data Layer:**
- RDS database with Multi-AZ deployment for high availability
- Automatic backups enabled with a reasonable retention period
- Encryption at rest and in transit (this is non-negotiable for compliance)
- A Lambda function to handle automatic snapshot retention and cleanup

**Storage Layer:**
- S3 buckets with proper access logging and versioning enabled
- Lifecycle policies to manage costs (maybe move older data to cheaper storage tiers)

**Monitoring & Operations:**
- CloudWatch alarms for CPU, memory, and other key metrics
- SNS notifications when alarms trigger
- Proper logging and monitoring across all components

**Security & Access:**
- IAM roles with least privilege access (no root account usage)
- Separate IAM roles for each service/component
- A bastion host in the public subnet for secure SSH access to private instances
- All resources properly tagged for cost tracking and management

## My Specific Requirements

I'm working with Python Pulumi, so I need the infrastructure defined as code rather than CloudFormation templates. The setup should be:

- **Modular and reusable** - I want to be able to use components in other environments
- **Cost-effective** - I need to implement proper tagging and maybe some cost optimization strategies
- **Production-ready** - This isn't a dev/test environment, so it needs to be robust
- **Compliant** - Following AWS security best practices and compliance requirements

## What I'm Struggling With

I'm not entirely sure about:
- The best way to structure the Pulumi code for reusability
- How to implement the Lambda function for RDS snapshot management
- The most cost-effective way to handle NAT Gateways (maybe using NAT Instances for dev/test?)
- Proper IAM role design that follows least privilege but doesn't break functionality
- CloudWatch alarm thresholds and what metrics are most important to monitor

## Expected Output

I need working Python Pulumi code that I can run to create this infrastructure. **All configuration should be in a single file named `tap_stack.py`**. The code should be:
- Well-organized and documented
- Follow Python and Pulumi best practices
- Include proper error handling and validation
- Be configurable for different environments (dev, staging, prod)
- Successfully deploy all the specified resources when executed

## Budget and Constraints

I have some budget constraints, so I need to be mindful of:
- NAT Gateway costs (they're not cheap!)
- RDS Multi-AZ deployment costs
- CloudWatch data retention and custom metrics
- S3 storage and data transfer costs
