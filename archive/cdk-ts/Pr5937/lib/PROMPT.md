## Mission

You are the senior AWS DevOps engineer on this project. Deliver a production-ready TypeScript CDK app that stands up the entire CloudFormation stack exactly as described below. Every requirement and constraint is non‑negotiable, and any resource that needs to be globally unique must include a string suffix that follows the existing naming convention.

---

## How to Approach the Work

1. **Read First, Build Second**  
   Review every requirement, environment note, and constraint. Nothing may be dropped, reworded, or reinterpreted.

2. **Implement with CDK v2 in TypeScript**  
   Model the entire architecture with AWS CDK, following CloudFormation best practices and keeping the code tidy and maintainable.

3. **Define Each Required Service**  
   Explicitly configure the full set of services: VPC, Subnets, RDS, Security Groups, IAM, Lambda, S3, Elastic Load Balancer, EC2, Route 53, CloudFront, CloudWatch, a centralized logging solution, and KMS.

4. **Name, Secure, and Tag Responsibly**  
   - **Naming:** Apply the company scheme and add the mandated string suffix wherever uniqueness is required.  
   - **Security:** Stick to least-privilege IAM roles, enforce KMS encryption, and keep inbound security group rules locked to HTTPS (443).  
   - **Tagging:** Every resource must carry `project=cloud-setup` for cost tracking.

5. **Output Expectations**  
   The deliverable is AWS CDK TypeScript code that synthesizes to CloudFormation.

---

## What You Must Build

Create a deployable CDK stack that spans multiple regions. The design must cover everything listed below without exception.

### Core Components and Constraints

1. **VPCs**  
   - Two VPCs: one in any region and one in any other region.  
   - Each VPC needs at least one public subnet and one private subnet.  
   - CIDR ranges may not overlap.

2. **Amazon RDS (SQL)**  
   - Provision an instance encrypted at rest with AWS KMS.

3. **Security Groups**  
   - Permit inbound HTTPS (port 443) traffic only.

4. **IAM Role**  
   - Provide application servers with read-only access to EC2.

5. **Lambda Function**  
   - Trigger the function when objects are uploaded to S3.

6. **Elastic Load Balancer**  
   - Balance traffic across the EC2 instances.

7. **Route 53**  
   - Host the DNS record for the application URL.

8. **CloudFront**  
   - Serve as the CDN in front of the application.

9. **CloudWatch Alarms**  
   - Raise an alarm if EC2 CPU utilization goes above 70%.

10. **Centralized Logging Solution**  
    - Collect and aggregate EC2 logs in one place.

11. **Tagging**  
    - Tag every resource with `project=cloud-setup`.

12. **AWS KMS**  
    - Use KMS for all encryption key management.

13. **Resource Naming**  
    - Follow the company naming scheme and always append the string suffix when uniqueness is required.

---

## Solution Expectations

- Produce a single, deployable TypeScript CDK application.  
- Include all configuration, resource definitions, IAM roles, security settings, tags, and stack outputs.  
- Make sure the stack outputs clearly confirm each resource that is created or configured.  
- The code must pass `cdk synth` and any CDK validation commands.

---

## Success Criteria

- **Multi-region footprint:** VPCs, subnets, and resources span the two specified regions (noted as ` ` and ` ` in the original spec).  
- **Security posture:** IAM roles follow least privilege, ingress is HTTPS-only, and all sensitive data uses KMS encryption.  
- **Tagging discipline:** Every resource is tagged with `project=cloud-setup`.  
- **Operational readiness:** ELB, CloudFront, Lambda triggers, and CloudWatch alarms are in place.  
- **Compliance:** Every numbered requirement and constraint above is implemented exactly as written.  
- **Uniqueness:** Resource names incorporate the required string suffix.  
- **Quality:** The TypeScript code is maintainable, well documented, and production friendly.  
- **Deployability:** The stack compiles, deploys, and passes CDK validation without errors.

---

## Deliverables Checklist

- The full AWS CDK TypeScript implementation.  
- Definitions for VPCs, Subnets, RDS, Security Groups, IAM, Lambda, S3, ELB, EC2, Route 53, CloudFront, CloudWatch, centralized logging, and KMS.  
- Naming that adheres to the company pattern and applies the uniqueness suffix.  
- Stack outputs covering key resource IDs, endpoints, and ARNs.  
- Deployment notes and any operational runbook details needed to keep the stack healthy.

---
