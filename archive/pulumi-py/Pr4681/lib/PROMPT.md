I need help building an AWS S3 infrastructure using Pulumi with Python that's heavily focused on cost optimization while keeping everything compliant. Here's what needs to happen:

1. Create an S3 bucket to start with.

2. Implement intelligent tiering policies that automatically move objects to appropriate storage classes based on access patterns. The system should handle this on its own without manual intervention.

3. Create lifecycle rules that transition compliance data to Glacier after 90 days and Glacier Deep Archive after 365 days. This is a hard requirement for compliance.

4. Set up S3 Inventory reports for all buckets to track storage class distribution and access patterns. I need visibility into what's actually happening.

5. Configure CloudWatch metrics and alarms for monitoring storage costs and unexpected access pattern changes. If something spikes or changes dramatically, I need to be alerted.

6. Implement bucket policies that enforce encryption-in-transit and prevent accidental public access. Security can't be compromised here.

7. Create Lambda functions triggered by S3 events to automatically tag objects based on content type and compliance requirements. This should happen as objects are uploaded.

8. Establish cross-region replication for critical compliance data with optimized storage classes in the replica. The replicated data should also be cost-efficient.

9. Generate cost allocation tags that map storage costs to specific departments and projects. I need to be able to break down costs by business unit.

10. Implement request metrics to identify and optimize high-frequency access patterns. If certain data is getting accessed constantly, I need to know about it and adjust accordingly.

The end goal is a complete Pulumi Python program that reduces our monthly S3 costs by at least 60% while maintaining all compliance requirements, with automated monitoring and optimization built in.