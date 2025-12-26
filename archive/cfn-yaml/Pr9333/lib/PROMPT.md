We're designing a CloudFormation stack to ensure high availability and failure recovery for a critical web application. The infrastructure needs to be robust enough to handle the loss of an entire availability zone without downtime.

All resources should be distributed across at least two availability zones to ensure redundancy. This includes application instances, databases, and load balancers.

Use AWS Auto Scaling to automatically replace and balance application instances across the remaining zones in case of a failure. This ensures the application remains available even during high traffic or zone outages.

Use Amazon RDS with automatic failover enabled. This will ensure that the database remains operational even if the primary instance becomes unavailable.

Implement an Elastic Load Balancer to distribute traffic across all availability zones. This will improve fault tolerance and ensure users are always routed to healthy instances.

Set up Amazon SNS to notify system administrators of any failover events or critical issues. This will help the team respond quickly to incidents.

All resources should be deployed within a VPC with proper public and private subnet configurations. Security groups should be locked down to allow only necessary inbound and outbound traffic. Resources should also be tagged for better management.

We're looking for a CloudFormation template in YAML that implements the above requirements. The template should:

Be deployable without errors in the us-east-1 region. Include parameters for environment suffix, instance types, and other configurable options. Export key resource identifiers like VPC ID, RDS endpoint, Load Balancer DNS as outputs for integration with other stacks. Pass all provided test cases to simulate failure scenarios.

The goal is to have a production-ready infrastructure that is scalable, secure, and resilient to failures.
