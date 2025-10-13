Hey, I’ve got a Terraform project I need your help shaping.

The goal is to design and implement a cross-region disaster recovery setup for a mission-critical app. It needs automated failover, data replication, and it has to meet an RTO of 15 minutes and an RPO of 5 minutes. The primary region is us-east-1 and the secondary region is us-west-2.

Use Terraform (version >= 1.0.0) with the AWS provider (>= 4.0.0). The stack should bring together DynamoDB Global Tables, Aurora Global Database, Application Load Balancers, Auto Scaling Groups, and Lambda functions to handle failover automation. Add CloudWatch alarms and EventBridge rules to orchestrate the detection and recovery flow.

I’ll also need variables for things like VPC CIDRs for both regions, environment name (prod or staging), Aurora instance size, EC2 instance type for app servers, and the min/max capacity for the ASG.

Build the Terraform configuration so it’s production-ready, showing how the regions stay in sync, how traffic shifts on failover, and how those RTO/RPO goals can realistically be achieved.
