# Task: Multi-Environment Consistency & Replication with CloudFormation

## Task ID: trainr926
## Platform: CloudFormation
## Language: YAML
## Complexity: Hard

## Problem Description

Design a multi-region application infrastructure where Route 53 health checks monitor application endpoints in both us-east-1 and eu-west-1, automatically updating DNS records to failover from primary to secondary region when endpoint health checks fail. Application writes to DynamoDB in us-east-1 automatically replicate to the eu-west-1 replica through global tables, ensuring data consistency across regions. S3 bucket in us-east-1 configured with cross-region replication automatically copies uploaded objects to the eu-west-1 bucket for redundancy. VPC peering connection links us-east-1 VPC with eu-west-1 VPC, allowing EC2 instances and Application Load Balancers in private subnets to communicate across regions through private IP addresses without traversing the public internet. CloudFormation StackSets deploy identical infrastructure topology across both regions with environment-specific parameters.

## Requirements

Your solution should implement the following service integrations:

1. **Route 53 Health Checks and Failover**: Route 53 weighted routing policy directs traffic to Application Load Balancers in both regions, with health checks monitoring ALB endpoints every 30 seconds. When us-east-1 ALB health check fails three consecutive times, Route 53 automatically updates DNS to route all traffic to eu-west-1 ALB.

2. **DynamoDB Global Tables Replication**: Application servers write records to DynamoDB table in us-east-1, triggering automatic replication to eu-west-1 replica table through DynamoDB global tables. Conflicts resolved using last-writer-wins with timestamp-based conflict resolution.

3. **S3 Cross-Region Replication Flow**: S3 bucket in us-east-1 configured with replication rules automatically replicates new object uploads to destination bucket in eu-west-1. Both buckets have versioning enabled to track object changes. IAM replication role grants S3 service permission to replicate objects from source to destination bucket.

4. **VPC Peering Cross-Region Communication**: VPC peering connection established between us-east-1 VPC and eu-west-1 VPC. Route tables in both VPCs updated with routes directing cross-region traffic through peering connection. Security groups allow inbound traffic from peered VPC CIDR blocks for application communication.

5. **CloudFormation StackSets Orchestration**: CloudFormation StackSets deploy VPC, subnets, security groups, EC2 instances, ALBs, DynamoDB tables, and S3 buckets across both regions using single template with region-specific parameters. StackSet execution creates identical infrastructure topology in each region with appropriate resource dependencies.

6. **ALB to EC2 Integration**: Application Load Balancers in each region distribute incoming requests across EC2 instances in multiple availability zones. Target groups perform health checks on EC2 instances every 30 seconds, automatically removing unhealthy instances from rotation.

7. **IAM Cross-Service Permissions**: EC2 instance IAM role grants permissions scoped to specific DynamoDB table ARNs in local region for read and write operations, specific S3 bucket ARNs in local region for object uploads, and CloudWatch metrics namespace for publishing custom metrics. S3 replication IAM role grants S3 service permission to GetObjectVersion from source bucket ARN and ReplicateObject to destination bucket ARN. DynamoDB global tables IAM role grants DynamoDB streams read access scoped to specific stream ARNs for replication.

8. **CloudWatch Monitoring Integration**: EC2 instances publish custom application metrics to CloudWatch in their local region. CloudWatch alarms monitor ALB UnHealthyHostCount metric, triggering SNS notifications when threshold breached. Route 53 health checks integrate with CloudWatch alarms to track endpoint availability.

9. **Infrastructure Dependencies**: CloudFormation template defines explicit dependencies ensuring VPCs created before subnets, subnets created before EC2 instances, IAM roles created before resources that assume them, and S3 buckets created before replication configuration applied.

10. **Parameterized Deployment**: CloudFormation parameters specify environment name, region, VPC CIDR blocks, subnet CIDR ranges, EC2 instance types, and resource naming prefixes. All resources tagged with Environment tag derived from parameters for cost tracking and resource management.

## Environment Details

- **Target Regions**: us-east-1 as primary region and eu-west-1 as secondary region
- **Deployment Method**: CloudFormation StackSets orchestrating cross-region deployment
- **Tagging**: All resources tagged with Environment: Production for cost allocation and resource tracking

## Expected Output

A complete CloudFormation StackSet template in YAML format that deploys synchronized infrastructure across both regions with the following integration flows:

- Route 53 weighted routing policy distributing traffic to ALBs in both regions with automated failover triggered by health check failures
- DynamoDB global tables replicating application data bidirectionally between us-east-1 and eu-west-1 with conflict resolution
- S3 cross-region replication copying objects from us-east-1 source bucket to eu-west-1 destination bucket with versioning
- VPC peering enabling private communication between EC2 instances across regions through updated route tables and security groups
- ALBs distributing requests to EC2 target groups with health check-based traffic routing
- IAM roles scoped with least privilege using specific resource ARNs for EC2 to DynamoDB access, S3 replication service role, and CloudWatch metrics publishing
- CloudFormation changesets tracking infrastructure modifications before applying stack updates

## Constraints

1. Route 53 health checks must monitor ALB endpoints in both us-east-1 and eu-west-1, failing over when primary region health checks fail consecutively
2. DynamoDB global tables must replicate writes from us-east-1 to eu-west-1 with eventual consistency guarantees
3. S3 replication configuration must copy objects from us-east-1 bucket to eu-west-1 bucket with versioning enabled on both buckets
4. VPC peering must connect us-east-1 VPC to eu-west-1 VPC with route table entries directing cross-region traffic through peering connection
5. ALBs in each region must distribute traffic across EC2 instances in multiple availability zones with target group health checks
6. EC2 IAM role must grant specific permissions to access DynamoDB tables, upload to S3 buckets, and publish CloudWatch metrics using explicit resource ARNs - no wildcard resource ARNs allowed
7. S3 replication IAM role must grant S3 service permission to GetObjectVersion from source bucket and ReplicateObject to destination bucket
8. CloudFormation StackSets must deploy identical VPC topology, subnet configuration, security groups, and application resources across both regions
9. All resources must use parameterized naming with stack name prefix for environment identification
10. CloudFormation template must define explicit DependsOn relationships ensuring IAM roles created before EC2 instances, VPCs created before subnets, and buckets created before replication configuration

## Background

Build a globally distributed application architecture where user requests route through Route 53 DNS to Application Load Balancers in either us-east-1 or eu-west-1 based on health checks and weighted routing. Application servers running on EC2 instances behind ALBs write transaction data to DynamoDB tables that automatically replicate across regions through global tables. Static assets uploaded to S3 buckets replicate from primary to secondary region for disaster recovery. VPC peering allows cross-region private communication between application components. CloudFormation StackSets ensure infrastructure consistency across both regions with region-specific parameter values for CIDR blocks and instance types.

## References

- https://aws.amazon.com/cloudformation
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
- https://aws.amazon.com/quickstart/architecture/global-load-balancing/