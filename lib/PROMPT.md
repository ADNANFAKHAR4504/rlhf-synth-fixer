You are an expert AWS CDK engineer specializing in TypeScript-based Infrastructure-as-Code for large-scale financial and enterprise systems.
Your task is to analyze the given problem, environment, and constraints to build a complete CDK program that deploys AWS infrastructure.
Focus on accurate inter-resource connections, security best practices, and scalable CI/CD design.

Deliverables:

main.ts: CDK entrypoint initializing the app and stack.

tapstack.ts: Full CDK stack containing all resources (CodePipeline, IAM, CodeBuild, S3, SNS, Lambda, etc.) connected logically.

📘 Input Specification
{
  "problem": "Create a CDK program to deploy a multi-stage CI/CD pipeline with integrated security scanning and approval workflows. The configuration must: 1. Set up a CodePipeline with source, build, test, security scan, staging deploy, and production deploy stages 2. Configure CodeCommit as the source repository with branch-based triggers for main and develop branches 3. Implement parallel CodeBuild projects for unit tests, integration tests, and SAST security scanning 4. Create a Lambda function to parse security scan results and halt pipeline if critical vulnerabilities are found 5. Deploy artifacts to separate S3 buckets for staging and production environments with versioning enabled 6. Configure SNS topics for pipeline state changes and approval notifications to different stakeholder groups 7. Implement manual approval actions before production deployment with custom approval rules 8. Set up IAM roles with least privilege access for each pipeline component 9. Add CloudWatch alarms for pipeline failures and stuck executions exceeding 30 minutes 10. Configure artifact encryption using customer-managed KMS keys.",
  "background": "A financial services company needs to establish a multi-stage CI/CD pipeline for their microservices architecture. The pipeline must support automated testing, security scanning, and progressive deployment strategies with manual approval gates for production releases.",
  "environment": "AWS",
  "constraints": [
    "Pipeline must support rollback capabilities by maintaining the last 5 successful build artifacts",
    "Security scan stage must block deployment if OWASP Top 10 vulnerabilities are detected",
    "All pipeline artifacts must be encrypted at rest and in transit using separate KMS keys per environment",
    "Pipeline execution logs must be retained for 90 days for compliance auditing",
    "Approval notifications must be sent to different SNS topics based on environment (staging vs production)",
    "Build stage must cache dependencies to ensure build times remain under 5 minutes"
  ]
}

🧩 Output Requirements

Write clean, production-ready TypeScript CDK code following idiomatic AWS constructs (aws-codepipeline, aws-codebuild, aws-s3, aws-sns, aws-lambda, aws-iam, aws-cloudwatch, etc.).

Ensure resources are properly connected:

CodeCommit → CodePipeline → CodeBuild → Lambda → S3 (staging/prod) → SNS → CloudWatch.

Explicitly configure IAM roles with least privilege (grant only needed permissions).

Use environment-specific KMS keys and enforce encryption for artifacts and buckets.

Include CloudWatch alarms and metrics for failures/stuck executions.

Implement notification rules for SNS topics mapped to approval stages.

Keep constructs modular and logically grouped within the stack.

Comment sections clearly (e.g. // 🔹 Source Stage, // 🔹 Build & Test Stage, // 🔹 Security Scan Stage).

Output both main.ts and tapstack.ts in markdown code blocks.

Do not include explanatory text outside of code. Only output the files.

🎯 Goal

Generate a complete working CDK pipeline in TypeScript that reflects the described requirements — secure, modular, and fully automated.
Focus on:

Correct inter-resource linkage

Realistic AWS resource configuration

Maintainability and clarity of resource relationships

Compliance with all constraints.