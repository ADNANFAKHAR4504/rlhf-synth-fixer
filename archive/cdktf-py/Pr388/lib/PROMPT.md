# AWS Multi-Environment Setup with CDK for Terraform (Python)

## Objective

Your mission is to act as an expert AWS Solutions Architect. Create a CDK for Terraform (CDKTF) Python application to deploy and manage three isolated AWS environments: development, testing, and production.

## Core Requirements

### 1. CDKTF Setup

- Use CDK for Terraform with Python
- Implement separate stacks for dev, test, and prod environments
- Use CDKTF CLI version 0.20+
- Leverage Python classes and inheritance for code reuse

### 2. Infrastructure Components

- **VPCs**: Separate VPCs with non-overlapping CIDR blocks
  - Dev: 10.1.0.0/16
  - Test: 10.2.0.0/16
  - Prod: 10.3.0.0/16
- **Multi-AZ**: Deploy across at least 2 availability zones per environment
- **Security Groups**: Allow only necessary traffic between components

### 3. State Management

- Use AWS S3 bucket for remote state storage
- Use DynamoDB table for state locking
- Configure remote backend in Python code

### 4. Python Structure

```
cdktf-aws/
├── main.py
├── stacks/
│   ├── __init__.py
│   ├── base_stack.py
│   ├── dev_stack.py
│   ├── test_stack.py
│   └── prod_stack.py
├── constructs/
│   ├── __init__.py
│   ├── vpc_construct.py
│   ├── security_construct.py
│   └── monitoring_construct.py
├── config/
│   ├── dev.py
│   ├── test.py
│   └── prod.py
└── requirements.txt
```

### 5. Security & Access

- Environment-specific IAM roles and policies using Python classes
- Principle of least privilege access
- Proper resource tagging using Python dictionaries

### 6. Monitoring

- CloudWatch logging and monitoring for each environment
- Environment-specific alerts using Python configuration

## Deliverables

1. CDKTF Python application with modular structure
2. Environment-specific configuration files
3. Custom constructs for VPC, security, and monitoring
4. Backend configuration in Python
5. Python unit tests for infrastructure components
6. CI/CD pipeline configuration
7. Documentation for deployment and rollback procedures

## Success Criteria

- All three environments deploy successfully using `cdktf deploy`
- No IP conflicts between environments
- State management works with proper locking
- Resources properly tagged and monitored
- Python code passes linting and type checking
- Unit tests cover core infrastructure components
- CI/CD pipeline runs without errors
