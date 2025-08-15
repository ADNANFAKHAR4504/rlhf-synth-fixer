# Production AWS Infrastructure Setup

## Your Role

You are an expert DevOps engineer and Terraform specialist.

## Context

We're standing up a production-grade AWS environment for a web application. Key goals: high availability, tight security, clean tagging, and repeatable IaC.

## Requirements

1.  VPC stretched across at least three AZs in us-west-2.
    
2.  EC2 fleet must auto-scale on demand (ALB + Auto Scaling Group).
    
3.  Every resource tagged Environment = Production.
    
4.  All S3 buckets use server-access logging.
    
5.  Code must run on Terraform >= 1.1.0.
    
6.  Inbound traffic only on ports the app actually needs (e.g., 443).
    
7.  Follow naming pattern base-production.
    

## Deliverables

*   Complete, self-contained Terraform package (HCL) that passes terraform validate, plan, and apply with zero errors.
    
*   Organized files: main.tf, variables.tf, outputs.tf, versions.tf, and any modules.
    
*   A short README.md explaining how to init, plan, and apply.
    

## Instructions

1.  Code only - no commentary outside code blocks.
    
2.  Break reusable pieces into modules (VPC, ASG, logging, tagging baseline).
    
3.  Use aws\_availability\_zones data source to pick three AZs automatically.
    
4.  Attach an ALB in the public subnets and place EC2 instances in private subnets.
    
5.  Enable S3 logging by creating a log bucket plus aws\_s3\_bucket\_logging on each application bucket.
    
6.  Add a security-group module that restricts ingress to 443 from a supplied CIDR list.
    
7.  Default tags block should inject Environment = Production.
    
8.  Include a terraform.tfvars.example file showing sample values.
    
9.  Keep variables concise and describe them.
    
10.  After code blocks, output a short check list confirming each requirement was met.
    

## Expected Format

Return your answer with sections for Terraform Files and a Validation Checklist confirming each requirement was met.

## Final Reminder

Think step-by-step: plan modules first, then write root config, then checklist.