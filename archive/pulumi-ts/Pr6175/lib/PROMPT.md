# Trading Application Multi-Region Failover System

Hey team,

We've been asked to build an automated failover system for our critical trading application. The business just went through a recent regional outage that caused some downtime, and leadership wants to ensure we can maintain 99.99% uptime going forward. This is a financial services company handling real-time trading operations, so any downtime directly impacts revenue and customer trust.

I've been tasked with implementing this using **Pulumi with TypeScript**. The core challenge here is building a multi-region architecture that can automatically detect failures in our primary region and seamlessly redirect traffic to a standby region without manual intervention. We need real-time health monitoring, automated DNS failover, and synchronized data across regions.

The architecture needs to span two AWS regions - eu-south-1 as our primary and eu-central-1 as our standby. Under normal conditions, all traffic should flow to the primary region, but if health checks detect issues, Route 53 should automatically reroute everything to the standby region. We also need to maintain session state across regions using DynamoDB global tables so users don't lose their trading sessions during a failover event.

## What we need to build

Create a multi-region failover infrastructure using **Pulumi with TypeScript** that provides automated cross-region disaster recovery for a trading application.

### Core Requirements

1. **Multi-Region Networking**
   - VPCs in both eu-south-1 and eu-central-1 regions
   - Each VPC needs 2 public subnets and 2 private subnets spanning different availability zones
   - Proper routing and internet gateway configuration for public subnets

2. **Application Load Balancing**
   - Deploy Application Load Balancers in both regions
   - Configure target groups that point to Auto Scaling Groups
   - Set up health checks on the ALB endpoints

3. **Auto Scaling Infrastructure**
   - Create Auto Scaling Groups in both regions with Launch Templates
   - Primary region should run with desired capacity of 2 instances
   - Standby region should maintain 1 instance on standby
   - Use Amazon Linux 2 AMI with t3.medium instance types
   - Configure scaling policies based on CPU utilization metrics

4. **DNS-Based Failover**
   - Set up Route 53 hosted zone with weighted routing policy
   - Configure health checks monitoring the primary ALB endpoint with 10-second intervals
   - Initially route 100% of traffic to primary region, 0% to standby
   - Automatic failover triggers when health check fails for 3 consecutive periods

5. **Global Data Replication**
   - Create DynamoDB global table named 'trading-sessions'
   - Use 'sessionId' as the partition key
   - Enable cross-region replication between eu-south-1 and eu-central-1

6. **Monitoring and Alerting**
   - Deploy SNS topics in both regions for failover event notifications
   - Configure CloudWatch alarms monitoring Route 53 health check status
   - Enable Auto Scaling Group metrics for monitoring instance health
   - Set up alarms to trigger on primary region health check failures

7. **IAM and Security**
   - Create IAM roles for EC2 instances with least privilege access
   - Grant permissions for DynamoDB access and CloudWatch metrics
   - Implement encryption at rest and in transit for all data stores

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use Application Load Balancer for distributing traffic across instances
- Use Auto Scaling Groups with Launch Templates for compute resources
- Use Route 53 for DNS management and health-based routing
- Use DynamoDB Global Tables for session state replication
- Use CloudWatch for monitoring and alarms
- Use SNS for notification delivery
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **eu-south-1** (primary) and **eu-central-1** (standby) regions

### Constraints

- Route 53 health checks must use 10-second intervals for rapid failure detection
- Weighted routing policy starts with 100% primary, 0% standby until failover
- Deploy identical ALB and Auto Scaling configurations in both regions
- Primary region Auto Scaling desired capacity: 2, standby region: 1
- All resources must be tagged with Environment:Production and FailoverRole:Primary or FailoverRole:Standby
- CloudWatch alarms trigger after 3 consecutive health check failures
- All resources must be destroyable - no Retain deletion policies
- Include proper error handling and logging throughout the infrastructure
- Follow principle of least privilege for all IAM policies
- Enable encryption for DynamoDB tables and data in transit

## Success Criteria

- **Functionality**: Complete multi-region infrastructure that automatically fails over when primary region becomes unhealthy
- **Performance**: Health checks detect failures within 30 seconds and trigger DNS failover
- **Reliability**: System maintains 99.99% uptime through automated regional failover
- **Security**: All data encrypted at rest and in transit, IAM roles follow least privilege
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: TypeScript code with proper typing, well-tested, comprehensive documentation
- **Monitoring**: Full observability with CloudWatch metrics, alarms, and SNS notifications

## What to deliver

- Complete Pulumi TypeScript implementation with all required AWS resources
- VPC networking infrastructure in both eu-south-1 and eu-central-1
- Application Load Balancers with target groups in both regions
- Auto Scaling Groups with Launch Templates and scaling policies
- Route 53 hosted zone with health checks and weighted routing records
- DynamoDB global table for session state management
- SNS topics for failover notifications
- CloudWatch alarms for health check monitoring
- IAM roles and policies for EC2 instance permissions
- Unit tests validating resource creation and configuration
- Documentation including deployment instructions and architecture overview
