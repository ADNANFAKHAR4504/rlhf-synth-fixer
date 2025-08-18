### Prompt for geenrating the Stack config is below
```yaml
Prompt for AI: Cloud- Formation JSON to YAML Migration
Goal: You are an expert AWS CloudFormation specialist with over 10 years of experience in creating robust, scalable, and secure Infrastructure as Code (IaC).

Your primary mission is to convert a set of existing AWS CloudFormation JSON templates into fully functional, deployment-ready YAML temps. These new YAML templates must support a multi-account, multi-region AWS environment while adhering to strict security and naming conventions.

Project Name: IaC - AWS Nova Model Breaking

Environment Setup: The infrastructure is hosted within an AWS Organization that contains separate, dedicated accounts for development, testing, and production.
Networking: Each account has its own distinct VPC and associated networking resources.

Deployment Regions: The templates must be deployable across two AWS regions: us-west-2 and us-east-1.
Naming Convention: All resources must follow the strict naming convention of <Component>-<Environment>-<Region>. For eg, an application server in production in us-east-1 would be named AppServer-production-us-east-1.

Constraints:
You must adhere to the following requirements precisely:

Format Conversion: Convert all provided CloudFormation JSON templates to the YAML format. The YAML must be clean, well-commented, and follow industry best practices for readability and maintainability.

Functional Equivalence: The resulting YAML templates must be 100% functionally equivalent to the original JSON templates. All resources, dependencies, and configurations must be perfectly replicated.

Multi-Region and Multi-Environment Logic:
Parameters: The template must accept an Environment parameter with allowed values: development, testing, and production. This will drive the conditional logic.
Mappings: Implement a Mappings section to manage region-specific values. For instance, create a RegionMap to handle different EC2 AMI IDs for us-west-2 and us-east-1.
Conditions: Implement a Conditions section to manage environment-specific configurations. For example, create an IsProduction condition that evaluates to true only when the Environment parameter is production. This can be used to provision larger instance types or different security settings for the production environment.

Resource Coverage: The templates must define all necessary resources, including but not limited to:

IAM: Roles, Instance Profiles, and Policies.
EC2: Instances, Security Groups, and Elastic IPs.

S3: Buckets with appropriate policies and configurations.
RDS: Database Instances, Subnet Groups, and Parameter Groups.

Critcal Constraint: Security Preservation: You must not alter any security configurations. All IAM permissions, Security Group ingress/egress rules, S3 bucket policies, and RDS security settings from the original JSON templates must be preserved exactly as they are.
Expected Output:
The final deliverable is a set of complete and verified YAML CloudFormation templates. These templates must be ready for immediate deployment via AWS CloudFormation and are expected to pass all existing integration tests for each environment (development, testing, production) without requiring any modifications to the test scripts.
```