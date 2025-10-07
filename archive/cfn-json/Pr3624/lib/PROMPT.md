Create a CloudFormation JSON template for a fleet management platform that monitors 15,000 commercial vehicles with predictive maintenance, driver behavior analysis, and fuel optimization in the us-east-2 region.

Infrastructure Requirements:

1. IoT Infrastructure:
   - Configure AWS IoT Core for vehicle telemetry ingestion from 15,000 vehicles
   - Set up IoT rules for data routing to downstream processing services
   - Configure thing registry for vehicle metadata management

2. Data Ingestion and Streaming:
   - Create Kinesis Data Stream with adequate shard capacity for real-time telemetry from 15,000 vehicles
   - Configure stream retention period for data replay capabilities
   - Enable enhanced monitoring for stream metrics

3. Time-Series Data Storage:
   - Create DynamoDB table for vehicle telemetry data with on-demand billing
   - Configure partition key (vehicleId) and sort key (timestamp) for efficient queries
   - Enable DynamoDB Streams for real-time data processing
   - Configure Time-To-Live (TTL) for automatic data expiration (30 days recommended)

4. Vehicle Data Storage:
   - Create DynamoDB table for vehicle profiles with on-demand billing
   - Create DynamoDB table for maintenance records with appropriate indexes
   - Configure point-in-time recovery for critical tables

5. Machine Learning Infrastructure:
   - Set up SageMaker domain and user profile for model development
   - Create SageMaker notebook instance for predictive maintenance model training using AutoML
   - Configure IAM roles with required permissions for SageMaker to access S3 and other resources
   - Deploy SageMaker endpoint for real-time inference

6. Anomaly Detection:
   - Configure CloudWatch Anomaly Detection for real-time vehicle anomaly detection
   - Set up anomaly detectors for key vehicle metrics (engine temperature, fuel consumption)

7. Route Optimization:
   - Create Amazon Location Service tracker for vehicle position tracking
   - Set up route calculator for optimized routing with waypoint optimization
   - Configure geofence collection for geographic boundaries and service areas

8. Data Processing:
   - Create Lambda functions using Python 3.11 runtime for:
     - Real-time telemetry processing from Kinesis streams
     - Critical alert generation based on thresholds
     - ML inference coordination
   - Configure Lambda concurrency limits appropriate for workload
   - Set up environment variables for configuration management

9. Historical Data and Analytics:
   - Create S3 bucket with partitioning by vehicle ID and date for raw telemetry data
   - Enable S3 versioning and lifecycle policies for cost optimization
   - Configure bucket encryption using S3-managed keys

10. Data Cataloging and Querying:
    - Set up AWS Glue crawler for automatic schema discovery
    - Create Glue database and tables for data cataloging
    - Configure Athena workgroup for ad-hoc SQL queries on S3 data
    - Create Athena result bucket for query outputs

11. Business Intelligence:
    - Prepare infrastructure for QuickSight integration (Athena workgroup, Glue database)
    - Note: QuickSight data sources and dashboards should be configured manually due to CloudFormation limitations

12. Workflow Orchestration:
    - Create Step Functions state machine for maintenance scheduling workflows
    - Include states for inspection scheduling, parts ordering, and technician assignment
    - Configure error handling and retry logic

13. Event-Driven Architecture:
    - Set up EventBridge rules for scheduled maintenance reminders
    - Create rules for triggering workflows based on vehicle conditions

14. Notifications:
    - Configure SNS topic for critical vehicle alerts (engine failure, accidents)
    - Set up email subscriptions for operations team
    - Create SES email identity for automated maintenance reports
    - Configure email templates for notifications

15. Monitoring and Observability:
    - Enable CloudWatch Logs for all Lambda functions
    - Create CloudWatch dashboard for fleet metrics visualization
    - Configure anomaly detection on key vehicle metrics (engine temperature, fuel consumption)
    - Set up CloudWatch alarms for system health monitoring

16. API Layer:
    - Create API Gateway REST API for fleet manager interface
    - Define resources and methods for vehicle queries, maintenance scheduling, and analytics
    - Enable CORS for web application access
    - Configure API Gateway logging to CloudWatch

Security and Best Practices:

- Use IAM roles with least privilege principle for all services
- Enable encryption at rest where supported (S3, DynamoDB, Kinesis)
- Configure VPC endpoints where applicable for private connectivity
- Apply consistent resource tagging for cost tracking
- Use CloudFormation parameters for environment-specific values
- Include comprehensive outputs for cross-stack references

Provide the complete CloudFormation template in JSON format with all resources properly configured. Each file should be in a separate code block with the filename clearly indicated as a comment at the top of the code block.
