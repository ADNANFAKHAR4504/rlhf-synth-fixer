# CloudFormation Template Requirements

We need to create a CloudFormation YAML template for our production web application infrastructure. This template should establish a secure and scalable AWS environment.

## Core Requirements

The template needs to generate a complete and valid AWS CloudFormation template in YAML format that sets up infrastructure for a production-grade web application.

### Infrastructure Constraints

Please ensure the following requirements are met:

- Deploy all resources within the `us-west-2` region
- Use AWS IAM roles for managing permissions to S3 buckets (no inline policies or user credentials)
- Enable encryption at rest for all RDS instances
- Create a VPC with both public and private subnets, with NAT gateways providing internet access to private subnets
- Include detailed comments in the YAML explaining each resource's purpose and key configuration decisions

### Infrastructure Components

The template should include these components:

**VPC and Networking**

- New VPC with public and private subnets
- Private subnets configured to route outbound traffic through NAT Gateway

**Web Server Setup**

- Web servers accessible only via load balancer
- Security groups restricting direct public access to server instances

**Database Configuration**

- RDS database instance with encryption at rest enabled

**S3 Integration**

- IAM role with least-privilege policy for S3 bucket access
- Role should be attachable to EC2 instances or Lambda functions as needed

**Security Standards**

- Template must follow production environment security best practices

### Technical Requirements

The generated YAML should be:

- Complete and syntactically correct
- Ready for AWS CloudFormation validation
- Deployable as a single cohesive document
- Compliant with all specified constraints and requirements

### Expected Deliverable

A well-commented YAML CloudFormation template that provisions the requested AWS resources in the `us-west-2` region, following all security and architectural constraints. The template must pass AWS validation and be ready for deployment.
