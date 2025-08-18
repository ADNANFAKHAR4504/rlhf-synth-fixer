## Prompt

You are an AWS Cloud Engineer tasked with deploying a scalable web application infrastructure using AWS CDK with TypeScript, following the latest AWS best practices.

## Instructions

- **Requirements Analysis:**  
  Carefully review the problem statement and all constraints. Ensure the CDK implementation addresses every requirement, especially around security, scaling, tagging, and outputs.
- **AWS CDK Implementation:**  
  - Use AWS CDK with TypeScript, targeting the `us-west-2` region.
  - Your CDK project must include the following files:
    - `bin/tap.ts`: Entry point for the CDK app.
    - `lib/tap-stack.ts`: Stack definition and resource configuration.
    - `cdk.json`: Project configuration.
  - The stack must:
    1. Deploy EC2 instances using a specific AMI ID (provide a placeholder, e.g., `'ami-xxxxxxxx'`).
    2. Use `t2.micro` as the instance type.
    3. Configure security groups to allow inbound HTTP (port 80) and SSH (port 22) access only.
    4. Deploy an Elastic Load Balancer (ELB) in front of the EC2 instances.
    5. Implement Auto Scaling with a minimum of 2 instances and a maximum of 5 instances.
    6. Define an IAM Role and Instance Profile for EC2 instances, with only required permissions.
    7. Output the public DNS of the ELB as a CloudFormation stack output.
    8. Tag all resources with `Environment:Production` and `Application:WebApp`.
    9. Ensure all resources are correctly interconnected, secure, and follow AWS best practices.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Provisions EC2 instances (AMI and type as specified) behind an Elastic Load Balancer.
- Enables Auto Scaling (min 2, max 5).
- Attaches least-privilege IAM Role and Instance Profile to EC2.
- Secures instances with a security group allowing only HTTP and SSH.
- Exports the ELB public DNS in stack outputs.
- Tags every resource with `Environment:Production` and `Application:WebApp`.
- All resources are deployed in the `us-west-2` region.
- Uses the following structure: `bin/tap.ts`, `lib/tap-stack.ts`, `cdk.json`.

## Output Format

- Output the **complete content** for the following three files:
  1. `bin/tap.ts`
  2. `lib/tap-stack.ts`
  3. `cdk.json`
- **Do not** include any explanations, comments, or extra text—**only the code** for each file.
