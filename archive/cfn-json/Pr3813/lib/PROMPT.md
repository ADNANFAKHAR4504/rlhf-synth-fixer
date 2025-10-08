I need to build infrastructure for a video streaming platform that handles about 8,300 video files daily. We need a cost-effective storage solution with fast content delivery.

Here's what I need:

Set up an S3 bucket in us-east-2 for storing video files. Configure it with Intelligent-Tiering storage class to automatically optimize costs as access patterns change. The bucket should support Transfer Acceleration for faster uploads from our content creators around the world.

Add CloudFront distribution in front of the S3 bucket to deliver videos quickly to viewers. Make sure the origin is configured properly to work with S3.

Create lifecycle rules that move videos to Glacier Deep Archive after 365 days since we rarely access older content.

Set up S3 Inventory to generate weekly reports so we can analyze our storage usage and file metadata.

Add CloudWatch monitoring with the new CloudWatch Investigations feature to track storage metrics like bucket size and object counts. Include alarms that notify us if storage grows unexpectedly.

Create IAM roles and policies that allow uploads but restrict deletions to prevent accidental data loss. Follow least privilege principles.

Use proper resource naming with a consistent prefix and add tags for environment tracking.

Please provide the complete CloudFormation template in JSON format. Put each resource configuration in the template.
