# PROMPT.md

## AWS CDK Enterprise Infrastructure Requirements

You are a senior AWS Solutions Architect and CDK expert proficient in TypeScript. Your task is to design and generate a complete AWS CDK application that meets enterprise security, scalability, and availability standards. Always explain your architectural reasoning, connect related resources properly, and ensure the output is production-ready and compliant with all stated constraints.

## Problem Statement

Design and implement an enterprise-level cloud environment using AWS CloudFormation with AWS CDK written in TypeScript. This environment hosts a web application requiring high availability, secure communications, and optimized resource utilization across two AWS regions.

## Environment Requirements

- AWS CloudFormation as the IaC backend
- AWS CDK in TypeScript as the development framework
- Deployment spans two regions using existing VPC identifiers and subnet configurations
- Must comply with security and cost-efficiency standards, while providing full observability and automated incident management

## Key Requirements

1. Enable HTTPS using TLS 1.2 with a custom domain
2. Integrate a CI/CD pipeline using AWS CodePipeline and CodeBuild
3. Configure load balancing with autoscaling policies
4. Implement health checks and automatic replacement of unhealthy instances
5. Ensure data encryption at rest using AES-256 and enforce least-privilege IAM roles

## Constraint Items

- HTTPS traffic via TLS 1.2 only
- Use a custom domain managed in Route 53
- Infrastructure must be cost-optimized and sustainable
- Autoscaling with defined CPU/memory thresholds
- Perform instance health checks and auto-replace on failure
- Maintain API logs for audits (CloudTrail)
- Deploy into existing VPCs/subnets
- Enforce least privilege IAM policies
- Implement CI/CD pipeline (CodePipeline + CodeBuild)
- Multi-region deployment for HA and DR
- Encrypt data with AES-256
- Use S3 for static content with versioning
- Add CloudWatch alarms for CPU and memory metrics
- Manage DNS with Route 53
- EC2 instances preloaded with standard AMIs
- Infrastructure code strictly in TypeScript CDK
- Deploy RDS with automatic daily snapshots and scaling

## Expected Output

Generate a production-grade TypeScript CDK application that:

- Defines stacks for networking, compute, storage, and CI/CD components
- Includes proper resource interconnections (e.g., ALB → ASG → EC2, CI/CD → S3 → CodeBuild)
- Implements all constraints and best practices for security and cost efficiency
- Contains TypeScript code for:
  - `main.ts` (entry point)
  - `stack.ts` (CDK stack definitions)
  - Optional constructs for shared resources (IAM roles, alarms, encryption)
- Adds unit tests for validation (using Jest or CDK assertions)
- Documents architectural reasoning inline as comments

## Style and Reasoning Guidelines

- Always explain architecture choices before generating code
- Use clear, modular CDK constructs (e.g., `ApplicationLoadBalancedFargateService`, `PipelineProject`)
- Emphasize connections between resources (not isolated blocks)
- Include comments explaining why each AWS service is configured that way
- Prioritize security, availability, and maintainability
- Output should be cleanly formatted TypeScript with no placeholder text

## Final Instruction

Generate the final output as a complete CDK TypeScript project meeting all above specifications, ready for deployment.