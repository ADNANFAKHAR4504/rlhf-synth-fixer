You are an expert AWS Solutions Architect with 15 years of experience specializing in DevOps, automation, and Infrastructure as Code (IaC). You are a master of AWS CloudFormation and best practices for building secure, scalable, and resilient CI/CD pipelines.

Objective: Your task is to generate a comprehensive, production-ready AWS CloudFormation template in YAML format. This template will define a complete CI/CD pipeline for deploying a web application, strictly adhering to all requirements and constraints outlined below. The output must be a single, monolithic CloudFormation template.

Core Task Details & Context
Carefully review the following problem statement, environment details, and constraints. The generated CloudFormation template must satisfy every single point listed.

1. Problem Statement
You are tasked with creating a robust CI/CD pipeline for deploying a web application using AWS CloudFormation. The pipeline should enhance deployment speed and reliability while ensuring automated integration and delivery processes. The system must support deployments to both development and production environments with specific stages for building, testing, and deploying applications, incorporating resilience measures such as rollbacks on failure. To complete this task, utilize AWS services including CodePipeline, CodeBuild, and CodeDeploy, integrating CodeCommit for version control and SNS for notifications. Your solution must account for scaling and must be fully parameterized, allowing easy changes to regions and instance types.

2. Environment
The target infrastructure environment leverages the us-east-1 region, uses AWS CodePipeline for orchestration, involves deployment across multiple deployment environments (Development and Production), and operates under a defined corporate tagging strategy. EC2 instance types, SNS topics, and S3 buckets must be parameterized for operational flexibility.

3. Constraints & Requirements

The entire CI/CD pipeline must be fully automated.

The pipeline must be capable of deploying to both development and production environments.

Use AWS CodePipeline as the primary service for orchestrating the CI/CD process.

Integrate AWS CodeBuild for building the application, ensuring that build specifications follow a standard pattern.

Each deployment must leverage AWS CodeDeploy to manage deployments to EC2 instances.

Implement a rollback strategy in case of deployment failures to ensure high availability.

All AWS resources must be defined within the same CloudFormation template.

The AWS Region in which the pipeline operates must be parameterized.

The EC2 instance type for deployments must be parameterized to allow for future scalability.

Include a notification system via SNS for pipeline events, alerting on both failures and successes.

All IAM roles and policies associated with pipeline operations must follow the principle of least privilege.

Incorporate CloudWatch Alarms to monitor the error rates during the deployment process.

Version control the application source code with AWS CodeCommit.

The pipeline must include testing stages using AWS CodeBuild.

Implement a tagging strategy across all resources for cost tracking and management.

Utilize AWS S3 to store any artifact generated during the build process.

Provide a cost estimation for maintaining the proposed pipeline in a separate section after the code.

Instructions for Template Generation
Format: Generate the output as a single, valid CloudFormation template in YAML format.

Structure: Organize the template logically with the following top-level sections:

AWSTemplateFormatVersion

Description

Parameters: Define parameters for all customizable values, including environment names (Dev/Prod), EC2 instance types, SNS notification email, and S3 bucket names. Provide sensible defaults where applicable.

Resources: This is the main section. Group resources logically by service (e.g., IAM Roles, S3 Bucket, CodeCommit Repository, CodeBuild Projects, CodeDeploy Application/Deployment Groups, CodePipeline, and SNS Topic). Add comments to delineate these groups.

Outputs: Expose important values like the CodeCommit repository clone URL and the CodePipeline ARN.

Resource Configuration:

IAM Roles: Create specific IAM roles for CodePipeline, CodeBuild, and CodeDeploy with tightly scoped, least-privilege policies. Do not use overly permissive permissions.

CodePipeline: The pipeline should have distinct stages:

Source: Triggered by a commit to the AWS CodeCommit repository's main branch.

Build: Uses AWS CodeBuild to compile code and run unit tests.

DeployToDev: Deploys the build artifact to the development environment using AWS CodeDeploy. Include a manual approval step before deploying to production.

DeployToProd: Deploys the build artifact to the production environment using AWS CodeDeploy.

CodeDeploy: Configure the CodeDeploy Deployment Group with a rollback configuration that automatically rolls back the deployment on alarm thresholds or deployment failures.

Tagging: Apply a consistent tagging strategy to all taggable resources. Include tags for Project, Environment, and ManagedBy.

Cost Estimation: After the YAML code block, add a markdown section titled "## Monthly Cost Estimation". In this section, provide a brief breakdown of the estimated monthly costs for running this pipeline, considering services like CodePipeline, CodeBuild (based on an assumed build duration), S3 storage, and any other relevant charges. Assume a moderate usage level for your estimation.

Final Output: Your final response should contain only the YAML code block for the CloudFormation template, followed by the cost estimation section as requested. Ensure the code is complete and ready for deployment.