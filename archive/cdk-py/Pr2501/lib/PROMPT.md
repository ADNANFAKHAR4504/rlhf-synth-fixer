## Web Application Infrastructure Deployment Task

I need help building a robust, production-ready web application infrastructure on AWS using CDK with Python. Here's what I'm looking to accomplish:

### Infrastructure Requirements

**Networking Foundation:**
- Create a VPC in the us-west-2 region with proper CIDR allocation
- Set up three subnets: two public subnets and one private subnet for database isolation
- Configure an Internet Gateway to enable public internet access for web servers
- Implement a NAT Gateway in one of the public subnets for secure outbound access from private resources

**Security & Access Control:**
- Design and implement IAM roles that follow the principle of least privilege for EC2-to-AWS service interactions
- Create security groups for public subnets allowing HTTP (port 80) and SSH (port 22) access from the internet
- Configure security groups for private subnet resources that only allow internal VPC communication
- Ensure no direct internet access to private subnet resources

**Compute & Application Layer:**
- Deploy EC2 instances in both public subnets for high availability
- Pre-configure these instances with Apache HTTP server for immediate web serving capability
- Implement user data scripts for automated application server setup

**Database Layer:**
- Deploy a PostgreSQL database instance in the private subnet for data persistence
- Configure automated backup policies to ensure data protection
- Implement proper database security and access controls

**Operational Excellence:**
- Apply consistent tagging strategy across all resources (Environment: Production, Project: WebApp)
- Include comprehensive error handling throughout the infrastructure code
- Implement proper logging for monitoring and troubleshooting
- Ensure the solution is modular and maintainable

### Technical Constraints

- Use AWS CDK with Python for infrastructure as code
- Target the us-west-2 AWS region specifically
- Follow AWS best practices for security and reliability
- Create a production-grade infrastructure that can scale

### Expected Deliverables

A complete CDK Python application that deploys a functional web application infrastructure capable of:
- Serving web traffic through load-balanced EC2 instances
- Securely connecting to a PostgreSQL database
- Maintaining high availability across multiple availability zones
- Supporting future scaling and maintenance needs

The infrastructure should be immediately usable for deploying a production web application with proper security, monitoring, and backup capabilities in place.

Use python cdk to create all the resources in tap_stack.py. I already have application entrypoint tap.py that bootstraps the cdk app and also a CDK configuration file.(cdk.json)
