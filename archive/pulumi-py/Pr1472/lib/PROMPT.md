You are an expert AWS infrastructure engineer and Pulumi practitioner.  
Your task is to design and implement a production-grade migration of infrastructure  
from AWS region <SOURCE_REGION> to <TARGET_REGION> using Pulumi with Python.  

## Environment Context
- Project Name: <PROJECT_NAME>
- Services to migrate: <SERVICES_LIST>  
- Constraints: <LIST_CONSTRAINTS>  
- Goal: <HIGH_LEVEL_OBJECTIVE>  

## Requirements
1. Migrate S3 data with consistency guarantees, replicability, and validation steps.  
2. Transition EC2 instances to new region while preserving public IP addresses and ensuring zero downtime for web-facing services.  
3. Transfer RDS databases maintaining data integrity, encryption, and configuration fidelity.  
4. Implement CloudWatch monitoring for health, availability, and performance across all resources post-migration.  
5. Provide backup and recovery strategies for all migrated resources.  
6. Ensure zero downtime, compliance with AWS best practices, and production readiness.  

## Deliverables
- A **single Pulumi program in Python** (`lib/tap_stack.py`) implementing the above migration.  
- Documentation of steps taken, migration strategy, and validation tests.  
- Explicit resource interconnections (S3 ↔ EC2 ↔ RDS ↔ CloudWatch).  
- Backup strategy code and/or process notes included.  

## Output Format
- Return the **Pulumi Python code** inside a single file.  
- Comment sections must explain the rationale for each step.  
- Code must be clean, modular, and production-grade.  
- Include notes on **validation tests** (unit + integration).  

Write the response as if you are delivering production-ready IaC to a senior cloud engineering team. 
Emphasize **clarity, reliability, and AWS best practices**.
