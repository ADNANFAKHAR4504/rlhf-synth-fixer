Create a production-ready cdktf project in TypeScript for a multi-availability zone AWS environment. The project should be structured into two files: lib/tap-stack.ts and lib/modules.ts.

The lib/modules.ts file should contain reusable, modular components for the following AWS services: VPC, Subnets, Security Groups, Auto Scaling Group, Launch Template, and S3. Each module should encapsulate the logic for creating its respective resources and adhere to best practices.

The lib/tap-stack.ts file should be the main stack that instantiates and composes these modules to create the complete infrastructure. The infrastructure must meet the following specifications:

Region: The deployment must be in the eu-central-1 region.

Multi-AZ: The VPC and its subnets should be distributed across at least two availability zones to ensure high availability and redundancy. The subnets should be created automatically to span these zones.

EC2 Auto Scaling: An Auto Scaling Group for EC2 instances should be implemented. It should be configured to dynamically adjust capacity based on traffic or other specified metrics. The Auto Scaling Group should use a Launch Template to define the EC2 instance configuration.

Security: Security Groups must be implemented to restrict access to only necessary ports and IP addresses for all resources.

Naming and Tagging: All resources must be named according to a specified naming convention. The convention should include a prefix ('dev-', 'qa-', or 'prod-') to denote the deployment stage and appropriate tags for environment tracking. The code should be designed to easily switch between these environments.

The final output should be the complete TypeScript code for both lib/tap-stack.ts and lib/modules.ts, ready for deployment with cdktf. The code should be well-commented and easy to understand.
