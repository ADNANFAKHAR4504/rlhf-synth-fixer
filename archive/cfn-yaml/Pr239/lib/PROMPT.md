You are an expert AWS Solutions Architect and a senior developer specializing in Infrastructure as Code (IaC). Your task is to design and generate a complete, self-contained AWS infrastructure solution in a single file based on the user's requirements.

## Problem Statement

Develop a CloudFormation YAML template to deploy a web application infrastructure that adheres to the following requirements:

1. The application must be deployed in a high availability architecture across multiple availability zones.
2. Include an Application Load Balancer to handle incoming HTTP/HTTPS traffic.
3. Implement a VPC with both public and private subnets.
4. Deploy an Amazon RDS instance with automatic backups enabled for the application's database.
5. Deploy EC2 instances in an Auto Scaling Group across multiple availability zones for the web application.
6. **Install and run a sample NGINX web server on the EC2 instances using UserData, so that the ALB health check and HTTP tests will succeed.**
7. Set up an IAM role with appropriate permissions for application instances to interact with other AWS services.
8. Configure Auto Scaling policies to handle traffic fluctuations and maintain high availability.

## Constraints

- **Tool**: AWS CloudFormation
- **Language**: YAML
- **Single File**: Complete solution must be contained within one YAML file
- **Production Ready**: Must be deployable via AWS CloudFormation console or CLI

## Instructions

Carefully analyze the requirements and adhere to all constraints. Then, perform the following steps:

### 1. Architectural Outline

Before writing any code, provide a brief summary of the proposed architecture inside a `<thinking>` block. Describe the key AWS resources (VPC, Subnets, Internet Gateway, NAT Gateway, ALB, Auto Scaling Group, EC2 instances, RDS, Security Groups, IAM Role) and how they will be securely connected. **Explicitly mention that the EC2 UserData will install and start NGINX.**

### 2. Generate IaC Code

Based on your architecture, generate a **single, self-contained, and runnable CloudFormation template** using YAML.

### 3. Resource Connectivity (Crucial)

- The Application Load Balancer's Security Group must allow inbound HTTP/HTTPS traffic from the internet (`0.0.0.0/0`).
- Create a Security Group for the EC2 instances that only allows inbound traffic from the ALB's Security Group on the application port (80/443).
- The RDS instance's Security Group must only allow inbound traffic on its database port from the EC2 instances' Security Group. Do not expose the database to the internet.
- EC2 instances must be able to access the internet through NAT Gateway for updates and package installation.
- Configure Auto Scaling Group to use the ALB target group for health checks.
- **Ensure the EC2 UserData installs and starts NGINX, and serves a default web page.**

### 4. Security Best Practices

- Place the Application Load Balancer in the **public subnets**.
- Place the EC2 instances in the **private subnets** for security isolation.
- Place the Amazon RDS instance in the **private subnets** for isolation.
- The IAM Role for the EC2 instances should be created with the principle of least privilege, including permissions for CloudWatch Logs, Systems Manager, and basic EC2 operations.
- Use CloudFormation Parameters for sensitive values like the database master password from AWS secret manager
- Enable encryption at rest for the Amazon RDS instance.
- Use a Launch Template for the Auto Scaling Group to ensure consistent instance configuration.
- Configure proper health checks for both ALB and Auto Scaling Group.

### 5. Final Output

Present the final, complete YAML code inside a single code block, adhering strictly to the output requirements.

## Output Requirements

- The entire solution **must** be contained within a single YAML file.
- The file should be a valid CloudFormation template named `Topstack.yml`.
- The YAML must be complete, well-formed, and ready to be deployed via the AWS CloudFormation console or CLI.
- Include a `Description` field at the top of the template explaining its purpose.
- Use `Parameters` for values that might change between environments (e.g., database password, instance types, AMI IDs). Use `Mappings` for values that differ by region (e.g., AMI IDs for different regions).
- Add comments (`#`) to explain complex resource definitions or security group rules.
- Use `Outputs` to export important values like the ALB DNS name, RDS Endpoint address, and Auto Scaling Group name.

## Quality Standards

- **Security First**: Implement least privilege access and proper network isolation
- **High Availability**: Ensure multi-AZ deployment across availability zones with Auto Scaling
- **Best Practices**: Follow AWS CloudFormation best practices and naming conventions
- **Documentation**: Include clear comments and descriptions for maintainability
- **Validation**: Template must pass CloudFormation validation
- **Testability**: Include all necessary resources for comprehensive unit and integration testing
