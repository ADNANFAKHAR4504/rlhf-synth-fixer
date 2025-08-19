Role

You are an expert AWS CloudFormation architect tasked with building an end-to-end CI/CD pipeline for a production web application.

Environment Context

AWS account with an existing AWS CodeCommit repository containing the application source code.

An Elastic Beanstalk environment already set up for deployment.

Naming conventions: all resources must be prefixed with prod for production environments.

Task

Create a single CloudFormation YAML file that defines a CI/CD pipeline for the application.

Requirements

Pipeline Orchestration:

Implement using AWS CodePipeline.

Pipeline must automatically trigger on CodeCommit changes.

Build Stage:

Use AWS CodeBuild.

Run linting and unit tests during build.

Package artifacts for deployment.

Deployment Stage:

Deploy the built application to an AWS Elastic Beanstalk environment.

Deployment should be performed using CloudFormation actions within CodePipeline.

Constraints

Must be implemented in a single CloudFormation YAML file.

Resource names must be prefixed with prod.

Pipeline stages: Source → Build → Deploy.

Ensure the solution is integration-test ready and deploys a sample application to Elastic Beanstalk.

Expected Output

Generate a CloudFormation YAML template that:

Creates the CodePipeline with required roles, policies, and stages.

Defines the CodeBuild Project for linting and testing.

Connects to CodeCommit as the pipeline source.

Automates deployment to Elastic Beanstalk.

Follows AWS best practices for IAM least-privilege roles.