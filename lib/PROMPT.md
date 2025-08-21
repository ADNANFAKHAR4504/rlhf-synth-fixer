Create a full-stack, highly available web application infrastructure in AWS using CDKTF with TypeScript. The infrastructure must be deployed to the us-east-1 region and use your default AWS account settings.

The project is named IaC - AWS Nova Model Breaking, and all resources should be prefixed with MyApp-. All resources must also include the tag Project: MyApp.

Your solution should be organized into two main files:

lib/tap-stack.ts: This file will contain the main CDKTF stack. It should be responsible for orchestrating and instantiating all the components of your infrastructure.

lib/modules.ts: This file should contain all the reusable, modular components for the infrastructure. These components should include, but are not limited to, modules for VPC, S3, RDS, EC2, ALB, Route 53, CloudWatch, and IAM.

The infrastructure itself must meet the following specific requirements:

VPC: A Virtual Private Cloud (VPC) that spans across three Availability Zones for high availability.

Subnets: Both public and private subnets must be created within the VPC to ensure secure access to resources.

EC2 Instances: EC2 instances should be deployed in the private subnets. These instances must be managed by an Auto Scaling group to handle variable load. Each instance should have an associated IAM role that grants read-only access to S3 buckets.

NAT Gateway: A NAT gateway must be set up in one of the public subnets. This gateway will allow instances in the private subnets to access the internet for updates and other necessary communication.

The final output of the CDKTF synthesis must be a single CloudFormation YAML template file named myapp-infrastructure.yaml. This template should successfully deploy the specified infrastructure and adhere to all the given constraints.