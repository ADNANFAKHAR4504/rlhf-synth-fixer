# Prompt: Design a Highly Available Web Application Infrastructure using AWS CloudFormation

## Objective

Create an AWS CloudFormation template (`high-availability-webapp.yaml`) that provisions a **highly available**, **fault-tolerant**, and **cost-efficient** infrastructure for a web application following AWS best practices.

## Requirements

Your CloudFormation YAML template must:

1. **High Availability & Fault Tolerance**
   - Deploy compute resources (EC2 instances) across **multiple Availability Zones** within a single AWS Region.
   - Ensure fault tolerance through redundant resource placement.

2. **Traffic Distribution**
   - Use an **Elastic Load Balancer (ELB)** to distribute incoming HTTP or HTTPS traffic across EC2 instances deployed in different AZs.

3. **Auto Scaling**
   - Implement **Auto Scaling** to manage EC2 instances dynamically.
   - Scaling configuration:
     - **Minimum Instances:** 2
     - **Maximum Instances:** 10
     - **Policy:** Based on traffic or CPU utilization
   - Configure **health checks** that monitor instance availability.
   - Unhealthy instances must be automatically terminated and replaced.

4. **Log Persistence and Lifecycle Management**
   - Set up an **Amazon S3 bucket** to store application logs.
   - Apply a **lifecycle policy** to transition logs to **Amazon S3 Glacier** after **30 days** to optimize cost.

5. **Naming and Region Constraints**
   - Follow any **naming conventions** and **region constraints** specified in the environment (if applicable; assume the template should be region-agnostic unless specified).
   - Use **parameters** where applicable to make the template reusable.

## Deliverable

- A valid YAML CloudFormation template named: `high-availability-webapp.yaml`.
- The template should be:
  - **Testable** and **ready for deployment** in an AWS test account.
  - Written with **correct syntax**, **logical structure**, and best practices in Infrastructure-as-Code (IaC).

## Notes

- Use **appropriate IAM roles/policies** if necessary.
- Include **Tags** for resources (e.g., Environment, Name).
- Minimize unnecessary costs while ensuring high availability.
- Optionally, use **Outputs** to provide useful post-deployment values such as ELB DNS, S3 Bucket name, or Auto Scaling Group name.
