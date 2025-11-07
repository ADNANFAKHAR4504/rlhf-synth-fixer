I'm trying to create a single, ci-cd pipeline to be used in github actions workflow, in YAML format. The goal is to use this one template to deploy our infrastructure for dev, staging, and production environments just by changing some parameters.

It's really important that stack deployed using this ci-cd pipeline should includes the following features, but the key importance is the ci-cd piepline setup here

Single Template: It has to be just one YAML file that can handle all environments.
Parameters for Environments: I want to use parameters to manage the differences, especially a key parameter like EnvType (with allowed values dev, staging, prod). This way, we avoid duplicating the template for each environment.

Environment-Specific Settings:
Tagging: All resources should be tagged properly, especially with a tag for the environment (e.g., Environment: dev).

IAM Policies: It needs to create specific IAM roles and policies that are locked down based on which environment is being deployed.

Unique Naming: All the resources (like VPCs, Lambdas, etc.) must have names that include the environment (e.g., dev-vpc, prod-lambda) to prevent any conflicts.

Networking:
It needs to build a VPC with subnets to keep all the resources for that environment isolated.
The template should also output key info, like the VPCId, so other stacks can use it.

Serverless Part:
I'd like to include a basic serverless workflow, so please add an AWS Lambda function and an AWS Step Function.

Storage & DB:
S3: Please add an S3 bucket that has a lifecycle policy set up (e.g., to move old data to cheaper storage).
RDS: It also needs an RDS database instance that is secured using a KMS key for encryption and has a backup retention policy configured.

Monitoring & Deployment:
Alarms: Can you add a couple of CloudWatch alarms to monitor resource health (like CPU on the RDS instance)?
Regional Support: The template should be written in a way that it would work in any region.

What I'm looking for in the output:
A single, complete YAML file that's ready to run the ci-cd piepline. It should be well-structured with Parameters,Mappings and conditions