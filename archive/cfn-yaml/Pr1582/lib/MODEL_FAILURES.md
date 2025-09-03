# Failure Prompt: Minimal CloudFormation Template for Web Application (Incorrect Implementation)

## Objective

Create a basic AWS CloudFormation template for deploying a web application. However, this version **fails** to meet essential infrastructure requirements such as high availability, fault tolerance, and cost management.

## Characteristics of This Failed Implementation

The template may include one or more of the following shortcomings:

1. **Single Availability Zone Deployment**
   - EC2 instances are launched in only **one Availability Zone**, introducing a single point of failure.

2. **No Elastic Load Balancer (ELB)**
   - Incoming traffic is sent directly to a single EC2 instance without using a **Load Balancer** to distribute requests or improve fault tolerance.

3. **Lack of Auto Scaling**
   - The template deploys a **fixed number of EC2 instances** without auto scaling policies. It doesn't scale based on traffic load or health status.

4. **Missing or Inadequate Health Checks**
   - Instances are **not monitored** for availability, and unhealthy instances are **not replaced** automatically.

5. **No Log Persistence or Lifecycle Management**
   - Application logs are **not stored in S3**, or if S3 is used, there is **no lifecycle policy** to transition data to Glacier for cost savings.

6. **No Parameterization or Reusability**
   - The template uses **hardcoded values** (e.g., region, AMI ID, instance type), making it non-reusable across environments.

7. **Security and Tagging**
   - Resources may lack basic security configurations (e.g., properly scoped security groups) and **do not include tags** for cost tracking or organization.

## Deliverable

- A YAML template named `minimal-webapp.yaml` that is functional but **intentionally flawed** and **non-compliant** with AWS best practices for high availability, scalability, and cost optimization.

## Purpose

This failure prompt can be used:
- As a learning contrast to highlight what a **non-resilient, non-scalable** infrastructure looks like.
- For review exercises, audits, or to test the ability to **identify and remediate architectural flaws** in IaC.
