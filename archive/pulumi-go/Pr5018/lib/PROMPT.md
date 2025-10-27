Hey, we need to build infrastructure for a manufacturing company's IoT monitoring system. They have sensors on the factory floor tracking equipment performance and need to predict maintenance issues before they happen.

Here's what we need to set up **using Pulumi with Go**:

The system should handle real-time sensor data coming from IoT devices. We need a Kinesis Data Stream to ingest all this data - make sure encryption is enabled on the stream. The processing will run on ECS using Fargate containers in eu-central-2 region. These containers need to be in private subnets for security, so we'll need NAT Gateways for outbound connectivity.

For storage, set up an RDS PostgreSQL database to hold the processed results. This is important - all database credentials must be stored in AWS Secrets Manager with automatic rotation enabled every 30 days. No hardcoded passwords anywhere. The RDS instance should have encryption at rest enabled and run in multiple availability zones for high availability.

The networking setup needs to be solid. Create a VPC with at least 2 public subnets and 2 private subnets across different availability zones. Put the NAT Gateways in the public subnets with Elastic IPs, and make sure the private subnet route tables point to these NAT Gateways for internet access. The ECS tasks should only run in private subnets - no direct internet exposure.

For the ECS setup, we need an ECS cluster with a Fargate task definition. The container can use a placeholder image for now. Create an ECS service that runs the tasks in the private subnets. Set up proper IAM roles - the task role needs permissions to read from Kinesis and write to RDS, while the execution role needs access to pull images and write logs to CloudWatch.

Security groups are critical here. Lock down the RDS security group to only allow traffic from the ECS tasks. The ECS security group should allow necessary outbound traffic through the NAT Gateway.

Since this is for industrial use, we need to comply with manufacturing data standards. Make sure all data is encrypted in transit and at rest. The company mentioned they want to use some of AWS's newer capabilities, so if there are any recent features for ECS log handling or RDS improvements, include those.

Can you generate the complete infrastructure code? Make sure each resource is properly named with a consistent suffix pattern, handle all dependencies correctly, and include proper error checking. Output one code block per file so it's easy to extract.
