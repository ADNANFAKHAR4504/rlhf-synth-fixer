You are a seasoned AWS Infrastructure Engineer specializing in Infrastructure as Code (IaC) with extensive experience using CDKTF and TypeScript.

I require you to develop production-grade CDKTF TypeScript code that establishes a secure and well-structured AWS infrastructure for the **Tap** project. The implementation must adhere to AWS security standards, promote modular architecture, and implement minimal privilege IAM policies.

### Requirements Overview

1. **Deployment Configuration & Resource Naming**
   - All resources must be provisioned in the `us-west-1` region
   - Apply consistent tagging to every resource using this format:
     `{ key: "Name", value: "Tap-ResourceName" }`

2. **Network Architecture**
   - Create a VPC using the CIDR block `10.0.0.0/16`
   - Implement both public and private subnets spanning a minimum of two Availability Zones
   - Ensure private subnets have no direct Internet Gateway access
   - Configure NAT Gateway to enable controlled outbound internet access from private subnets
   - Enable VPC Flow Logs to capture all subnet traffic for monitoring purposes

3. **Compute Resources & Access Management**
   - Deploy an EC2 instance within one of the public subnets
   - Attach an IAM role with restricted permissions allowing access only to a designated S3 bucket
   - Implement comprehensive encryption for data both in transit and at rest

4. **Security Measures**
   - Design Security Groups with precise rules allowing only necessary application traffic
   - Avoid overly permissive rules such as `0.0.0.0/0` unless absolutely essential for functionality

5. **Project Structure**
   - Organize code across exactly two files:
     - `lib/modules.ts` → Contains reusable infrastructure modules
     - `lib/tap-stack.ts` → Main stack implementation that integrates all components
   - Utilize constructs and templates for clean, maintainable, and scalable code
   - Ensure the solution is well-documented, structured, and deployment-ready

### Expected Output

Provide a complete CDKTF TypeScript project consisting of the two specified files, fully implementing all requirements and prepared for immediate deployment.
