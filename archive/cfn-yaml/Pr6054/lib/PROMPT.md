Design a CloudFormation template that implements a fully automated active-passive disaster recovery architecture within a single AWS region for a financial services transaction system. The solution should ensure high availability, data consistency, and automated failover between primary and standby environments while meeting strict RTO/RPO objectives.

In this setup, use Route53 to configure health checks and failover routing policies that intelligently switch traffic between the primary and standby endpoints based on both application health and database connectivity. The failover process should be triggered automatically through Lambda functions, which evaluate multiple failure signals and perform controlled failover actions in under 30 seconds.

Provision an Aurora RDS cluster with automated backups, point-in-time recovery, and replication lag under 1 second between primary and standby instances. Implement S3 buckets for storing application artifacts and configuration files, ensuring versioning, KMS encryption with customer-managed keys, and lifecycle policies that align with compliance retention standards.

Use CloudWatch alarms combined with SNS notifications to continuously monitor database health, service uptime, and failover events. Alarms must use composite logic to prevent false-positive triggers. The system should log all failover actions and recovery events for auditing.

Set up DynamoDB for session state management using on-demand billing and Contributor Insights enabled for performance tracking. Additionally, store all failover configurations, state data, and recovery parameters securely in Systems Manager Parameter Store.

Use CloudWatch Events (EventBridge) to orchestrate recovery workflows, ensuring automatic reactivation of the standby environment during a failover. All components, including RDS, Lambda, and DynamoDB, must communicate through private subnets or VPC endpoints to maintain internal network security.

IAM roles must follow the principle of least privilege, granting only the permissions required for health monitoring, failover orchestration, and data access. The final CloudFormation stack should deploy all resources in a secure VPC with private subnets for backend services and public subnets only for load balancers and DNS endpoints.

The output should be a single deployable CloudFormation template that encapsulates all disaster recovery resources — Route53, Lambda, Aurora, DynamoDB, CloudWatch, SNS, S3, and supporting IAM configurations — enabling automated failover, monitoring, and recovery with minimal downtime and zero manual intervention.
