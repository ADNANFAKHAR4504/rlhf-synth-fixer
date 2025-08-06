Cloud Infrastructure Setup - AWS with Pulumi Python - Expert - Single
=====================================================================

Project Overview
----------------

**Problem ID:** Cloud\_Environment\_Setup\_Pulumi\_Python\_9fj72k1b7g5n**Environment:** AWS us-west-2, using Pulumi with Python for deploying a production environment**Project Name:** IaC - AWS Nova Model Breaking**Difficulty Level:** Expert

Requirements
------------

### Core Infrastructure

*   Deploy infrastructure in AWS us-west-2 region
    
*   Use Pulumi with Python for Infrastructure as Code
    
*   Ensure all resources are tagged with Environment: Production
    
*   Follow security and redundancy best practices for production-ready environment
    

### Network Infrastructure

*   Create VPC with CIDR block 10.0.0.0/16
    
*   Provision **2 public subnets** in different availability zones
    
*   Provision **2 private subnets** in different availability zones
    
*   Create Internet Gateway for public subnets
    
*   Configure routing tables for public subnets to Internet Gateway
    

### Load Balancing & Compute

*   Deploy Elastic Load Balancer in public subnets
    
*   Launch EC2 instances in private subnets using chosen AMI ID
    
*   Ensure EC2 instances accessible **only** via Elastic Load Balancer
    
*   Configure Security Groups allowing HTTP and SSH from ELB only
    

### Database Layer

*   Create RDS PostgreSQL instance in private subnets
    
*   Ensure RDS is **not publicly accessible**
    
*   No direct internet connectivity to RDS instance
    

Constraints & Security Requirements
-----------------------------------

### Access Control

*   EC2 instances must not be directly accessible from internet
    
*   All traffic to EC2 instances routed through Load Balancer
    
*   RDS instance isolated in private subnets only
    
*   Security Groups configured with principle of least privilege
    

### Tagging Standards

*   All resources tagged with Environment: Production
    
*   Consistent tagging for resource identification and management
    

### High Availability

*   Multi-AZ deployment across different availability zones
    
*   Redundancy for both compute and database layers
    
*   Load balancer distributing traffic across multiple instances
    

Expected Deliverables
---------------------

### Primary Output

*   **\_\_main\_\_.py** file containing Pulumi Python configuration
    
*   Complete infrastructure deployment scripts
    
*   Resource definitions following Pulumi Python best practices
    

### Validation Steps

1.  Run pulumi preview to validate configuration
    
2.  Execute pulumi up to deploy infrastructure
    
3.  Verify all components are properly configured and accessible
    
4.  Test end-to-end connectivity through Load Balancer
    
5.  Confirm RDS isolation and EC2 instance security
    

### Architecture Components
`Internet → IGW → Public Subnets → ELB → Private Subnets → EC2 Instances → RDS`