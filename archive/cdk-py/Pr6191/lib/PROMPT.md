Hey team,

We need to build a disaster recovery solution for our document management system. A financial services company has asked us to set up automated S3 bucket replication with comprehensive monitoring to meet their regulatory requirements. They need to ensure critical documents are automatically replicated with proper versioning and lifecycle policies for long-term retention.

The business context is straightforward. They store critical financial documents in S3 and need a robust disaster recovery strategy. If something goes wrong in the primary region, they need to be able to quickly failover to the replica bucket. More importantly, they need confidence that the replication is working correctly at all times, with alerts if anything goes wrong.

The interesting technical challenge here is that they want both buckets in us-east-1, which means we're actually implementing Same-Region Replication (SRR) rather than traditional Cross-Region Replication. This is a valid pattern for disaster recovery within a single region, providing protection against accidental deletions, application bugs, or bucket-level failures. They've also requested Replication Time Control (RTC) to ensure objects are replicated within 15 minutes.

## What we need to build

Create a comprehensive S3 disaster recovery solution using **CDK with Python** that implements same-region replication with monitoring and lifecycle management.

### Core Infrastructure

1. **Primary S3 Bucket (us-east-1)**
   - Versioning enabled for complete object history
   - KMS encryption using a dedicated key
   - Transfer Acceleration enabled for faster uploads
   - Bucket policy enforcing encryption in transit
   - Replication configuration with RTC enabled
   - Resource name must include environmentSuffix

2. **Replica S3 Bucket (us-east-1)**
   - Versioning enabled to support replication
   - KMS encryption using a separate key (different from primary)
   - Lifecycle policy transitioning objects to Glacier after 90 days
   - Bucket policy enforcing encryption in transit
   - Configured as replication destination
   - Resource name must include environmentSuffix

3. **KMS Encryption Keys**
   - Separate KMS key for primary bucket encryption
   - Separate KMS key for replica bucket encryption
   - Keys must grant appropriate permissions for S3 replication
   - Resource names must include environmentSuffix

4. **IAM Replication Role**
   - Minimal permissions for replication (least privilege principle)
   - Permission to read from source bucket
   - Permission to replicate to destination bucket
   - Permission to use both KMS keys for decryption and encryption
   - Role name must include environmentSuffix

### Replication Configuration

5. **S3 Replication Rules**
   - Enable replication for all objects (prefix: empty or all)
   - Replication Time Control (RTC) enabled for 15-minute SLA
   - Delete marker replication enabled
   - Replica modification sync enabled
   - Priority configured appropriately

### Monitoring and Alerting

6. **CloudWatch Alarms**
   - Alarm for replication latency exceeding 15 minutes
   - Based on S3 replication metrics
   - SNS topic for alarm notifications (optional but recommended)
   - Alarm name must include environmentSuffix

7. **CloudWatch Dashboard**
   - Dashboard showing replication health metrics
   - Replication latency over time
   - Number of operations pending replication
   - Bytes pending replication
   - Dashboard name must include environmentSuffix

8. **CloudWatch Logs for Replication Metrics**
   - Log group for S3 replication metrics
   - Proper retention policy (e.g., 7 days)
   - Log group name must include environmentSuffix

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Deploy to **us-east-1** region for both buckets (Same-Region Replication)
- Use **S3** for primary and replica buckets with versioning
- Use **S3 Replication** with Replication Time Control (RTC)
- Use **S3 Transfer Acceleration** on primary bucket
- Use **S3 Glacier** for lifecycle transitions (after 90 days)
- Use **KMS** for encryption with separate keys per bucket
- Use **CloudWatch** for alarms, dashboard, and logs
- Use **IAM** roles with least privilege for replication
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix pattern

### Constraints

- All resources must be destroyable (no Retain policies, no DeletionProtection)
- Bucket policies must enforce encryption in transit (deny unencrypted requests)
- IAM roles must follow least privilege principle
- Replication latency SLA is 15 minutes (configure RTC accordingly)
- Lifecycle policy must transition to Glacier after exactly 90 days
- Delete marker replication must be enabled
- Both KMS keys must be in us-east-1 (same region as buckets)

## Success Criteria

- Functionality: Primary bucket replicates all objects to replica bucket within 15 minutes
- Reliability: Delete markers are replicated, versioning preserved across buckets
- Security: KMS encryption on both buckets, encryption in transit enforced, least privilege IAM
- Monitoring: CloudWatch alarms trigger when replication latency exceeds 15 minutes
- Lifecycle: Objects older than 90 days in replica bucket transition to Glacier
- Resource Naming: All resources include environmentSuffix
- Code Quality: Python, well-tested, documented

## What to deliver

- Complete CDK Python implementation with all infrastructure components
- S3 buckets with versioning and encryption
- KMS keys for both buckets
- IAM replication role with minimal permissions
- S3 replication configuration with RTC enabled
- CloudWatch alarms for replication latency
- CloudWatch dashboard for monitoring replication health
- CloudWatch Logs for replication metrics
- Lifecycle policies on replica bucket
- Unit tests for all components
- Stack outputs including:
  - Primary bucket URL and ARN
  - Replica bucket URL and ARN
  - Replication role ARN
  - Replication configuration ID
  - CloudWatch dashboard URL
- Documentation and deployment instructions
