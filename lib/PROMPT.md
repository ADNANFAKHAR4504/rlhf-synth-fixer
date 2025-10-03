We need a CDK project in TypeScript to build a fully resilient, multi-region setup for our main web application. The goal is to survive a full regional outage, so we'll deploy active-passive across eu-west-2 as our primary region and eu-west-3 as our standby. The entire architecture should be defined in a single CDK project that can deploy both regional stacks.

In each of the two regions, start by setting up a VPC. Once the VPCs are up, establish a VPC peering connection between them to allow for private, cross-region communication. Inside each VPC, deploy an Application Load Balancer and an Auto Scaling group of EC2 instances. The Auto Scaling group should be configured with step scaling policies to react appropriately to changes in CPU load. The instances within a region will need to share files, so set up an EFS file system in each VPC for them to mount.

For the database, set up a Multi-AZ RDS instance in our primary region (eu-west-2) and make sure automated backups are enabled. In the standby region (eu-west-3), provision a cross-region read replica that replicates from the primary instance.

The failover will be managed by Route 53. You'll need to configure a failover routing policy with health checks that monitor the primary region's ALB. If that health check fails, Route 53 must automatically redirect all user traffic to the standby ALB in eu-west-3.

For security, create a customer-managed KMS key in each region to encrypt the EFS and RDS data at rest. All IAM roles and security groups must be locked down with strict, least-privilege permissions. To test our setup, let's also use AWS Fault Injection Simulator (FIS). Define a simple FIS experiment that simulates a failure of the primary ALB, which will allow us to verify that the Route 53 failover works as expected.

Finally, to formalize our resilience posture, the CDK app should also define an application in AWS Resilience Hub. This will allow us to continuously assess our architecture against our recovery time objectives.

Please provide the final infrastructure code in separate, labeled code blocks for the main CDK project files
