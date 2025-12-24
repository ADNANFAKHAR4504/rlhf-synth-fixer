Need a CloudFormation YAML template for a production-grade AWS environment. I'm setting up the infrastructure for our app and want everything connected properly for security and high availability.

Here's what I need:

**Region Setup**

Deploy everything in us-west-2.

**VPC and Network**

Create a VPC with CIDR 10.0.0.0/16. The RDS database needs to stay inside the VPC - no public access.

**S3 Storage with Logging**

Create an S3 bucket with a globally unique name starting with "myapp-". Enable versioning on it. Also need a separate logging bucket that collects access logs from the main bucket.

**Lambda + S3 Integration**

Deploy a Lambda function that gets triggered by S3 object creation events in the main bucket. The Lambda needs an IAM role that lets it write logs to CloudWatch. This is critical - the Lambda processes files as they're uploaded to S3.

**RDS Database**

Launch an RDS PostgreSQL instance. Must be Multi-AZ for failover protection. Access should be restricted to within the VPC only - the Lambda and other services will connect to it through VPC security groups.

**IAM Security**

Use IAM roles for everything - no IAM users. The Lambda role needs CloudWatch Logs write access. Database connections should use IAM database authentication if possible.

**Resource Tagging**

Tag all resources with Environment: Production so we can track costs and manage them properly.

**Deletion Protection**

Set DeletionPolicy: Retain on the S3 buckets and RDS instance. These are critical data stores and we don't want them accidentally deleted.

**Outputs**

Export the S3 bucket names and the RDS endpoint URL. We'll need these for our application config and connecting other services.

The key thing is making sure all the services connect correctly - Lambda triggers from S3, database stays isolated in VPC, and everything has proper IAM permissions. Want the template to be production-ready and deployable without manual configuration.
