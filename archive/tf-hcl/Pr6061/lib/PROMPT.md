# Comprehensive Monitoring and Alerting for E-Commerce Platform

## Business Context

Hey, we've got a critical problem that's costing us money and customers. Our e-commerce platform is running blind—when something breaks, we find out from angry customers on Twitter instead of our own monitoring systems. Last week we had a database connection spike that crashed the checkout flow for twenty minutes during peak hours. We lost thousands in sales and our support team is still dealing with the fallout.

Here's what we're building: a comprehensive monitoring and alerting system that gives us full visibility into our infrastructure health and application performance. We're talking about CloudWatch dashboards showing real-time metrics, intelligent alerting that tells us about problems before customers notice, centralized logging for troubleshooting, and custom metrics tracking our business KPIs like order processing times. When CPU spikes on our web servers, when database connections start climbing, when Lambda functions throw errors—we need to know immediately, not after customers complain.

We're implementing this **using Terraform with HCL** because our entire infrastructure needs to be reproducible and version-controlled. The architecture includes two EC2 web servers behind an Application Load Balancer handling customer traffic, a PostgreSQL database storing order and customer data, Lambda functions processing orders asynchronously, and a complete monitoring layer with CloudWatch collecting metrics, SNS sending encrypted alerts to our on-call engineers, and metric filters tracking security events like failed login attempts.

This pattern is used by companies like Shopify for their merchant dashboards, Zalando for order processing monitoring, and Wayfair for tracking infrastructure health across their e-commerce platform. They all need the same thing: real-time visibility into application performance, proactive alerting when thresholds are breached, and centralized logging for incident response. We're building the same foundation that powers multi-billion dollar e-commerce operations.

The monitoring layer captures metrics from every tier of our stack. CloudWatch collects CPU utilization from our EC2 instances, connection counts and query performance from our RDS database, invocation counts and error rates from our Lambda functions, request latency and health check status from our Application Load Balancer. We've set up alarms with intelligent thresholds—eighty percent CPU triggers a warning, one hundred fifty database connections triggers an alert, five percent Lambda error rate means something's broken, fewer than two healthy hosts on the load balancer indicates infrastructure failure. These thresholds are based on our capacity planning and historical traffic patterns.

We're also implementing custom business metrics that CloudWatch doesn't collect by default. A Lambda function publishes order processing times to a custom namespace called Production/ECommerce. This tells us if our order pipeline is slowing down, which is a leading indicator of customer experience problems. We're tracking failed login attempts using CloudWatch metric filters that parse our application logs looking for authentication failures—this helps us detect credential stuffing attacks or brute force attempts against customer accounts.

All our logs are centralized in CloudWatch Logs with three separate log groups: application logs for normal operations, error logs for exceptions and failures, and audit logs for security events like authentication and authorization. We're retaining logs for thirty days exactly as required by our compliance constraints. This balances our need for historical data during incident investigations with storage costs. CloudWatch Logs charges fifty cents per gigabyte ingested and stored, so thirty-day retention for moderate log volumes costs about three dollars monthly.

The alerting system uses SNS topics with server-side encryption using AWS managed keys as specified in our requirements. When an alarm triggers, SNS publishes to this topic, which in production integrates with PagerDuty to wake up our on-call engineer. We're also building composite alarms that understand the relationship between components—if both web servers are pegged at high CPU and database connections are spiking, that's a different scenario than just one server having a problem. The composite alarm only fires when multiple conditions are true, reducing alert fatigue from false positives.

We've built a CloudWatch dashboard that gives us a single pane of glass for our entire platform. Five widgets showing CPU utilization across both web servers, database connection counts, Lambda invocation and error rates, our custom order processing time metric, and ALB health check status showing how many targets are healthy. All widgets default to showing the last twenty-four hours of data as required, so we can spot trends and correlate events during incident investigations.

The infrastructure we're monitoring is production-grade but sized for cost efficiency. Two t3.micro EC2 instances running our web application, a db.t3.micro PostgreSQL database with twenty gigabytes of storage, and an Application Load Balancer distributing traffic. We're using standard RDS instead of Aurora because Aurora adds fifteen to twenty minutes to deployment time and we get the same CloudWatch metrics from standard RDS. Companies like Etsy and Instacart use this same pattern—start with standard RDS and migrate to Aurora when you need the additional performance and availability features.

The VPC architecture follows security best practices with public subnets for the load balancer and web servers, private subnets for the database, proper security group segmentation, and an internet gateway for outbound connectivity. The database lives in private subnets with no public internet access, security groups only allow PostgreSQL traffic from the web server security group, and everything is encrypted at rest using KMS customer-managed keys.

Cost-wise, this entire monitoring stack runs under fifty dollars per month if cleanup fails. The two EC2 instances cost fifteen dollars, the load balancer sixteen dollars, the database thirteen dollars, CloudWatch logs about three dollars with thirty-day retention, and the custom metrics thirty cents each. The monitoring components themselves—alarms, dashboards, SNS topics—are essentially free under AWS pricing. We're getting enterprise-grade observability for the cost of a few lattes.

Deployment time is carefully optimized to stay under our thirty-minute window. VPC and networking components create in three minutes, EC2 instances in three minutes, the load balancer in four minutes, RDS in eight to ten minutes, and all the CloudWatch components in two to three minutes. Everything runs in parallel where possible, so total deployment time is around twenty-five minutes. Terraform destroy takes twelve to fifteen minutes to cleanly tear down everything.

## Technical Requirements

### VPC and Networking Infrastructure

We need a VPC in us-east-1 with CIDR block 10.0.0.0/16 providing sixty-five thousand private IP addresses. Create two public subnets in different availability zones: 10.0.1.0/24 in us-east-1a and 10.0.2.0/24 in us-east-1b. These public subnets host our Application Load Balancer and EC2 web servers. Also create two private subnets: 10.0.11.0/24 in us-east-1a and 10.0.12.0/24 in us-east-1b for our RDS database.

Enable DNS hostnames and DNS resolution on the VPC so our resources can resolve public DNS names and be assigned DNS hostnames. Create an internet gateway and attach it to the VPC. Build a public route table with a default route pointing to the internet gateway, then associate both public subnets with this route table. Create a private route table with only local routes and associate the private subnets with it.

The security group architecture needs three groups. First, an ALB security group allowing inbound HTTP on port eighty from anywhere on the internet since this is our internet-facing load balancer, and outbound to the EC2 security group on port eighty. Second, an EC2 security group allowing inbound on port eighty only from the ALB security group, and outbound to anywhere for software updates and CloudWatch metric publishing. Third, an RDS security group allowing inbound PostgreSQL traffic on port 5432 only from the EC2 security group.

Don't create the security groups with inline rules—use separate aws_security_group_rule resources to avoid circular dependency problems when the ALB security group needs to reference the EC2 security group and vice versa. Create the DB subnet group spanning both private subnets before creating the RDS instance since RDS requires a subnet group for placement.

### EC2 Web Server Instances

Launch two EC2 instances using the latest Amazon Linux 2 AMI in us-east-1. Use t3.micro instance type which provides two virtual CPUs and one gigabyte of memory, sufficient for our web application and cost-effective for testing. Place one instance in the first public subnet, the other in the second public subnet for high availability across availability zones.

Enable detailed monitoring on both instances so CloudWatch collects metrics at one-minute intervals instead of five-minute intervals. This gives us faster detection of problems. Associate the instances with the EC2 security group and attach an IAM instance profile that grants permissions for publishing CloudWatch metrics if needed.

Set disable_api_termination to false explicitly so terraform destroy can terminate the instances without manual intervention. This is critical for cleanup during testing. Assign public IP addresses to both instances so they can reach the internet gateway for software updates and AWS API calls.

Tag the instances with descriptive names following our naming pattern: ec2-web-1-production and ec2-web-2-production. Include the required tags Environment set to production and Project set to monitoring for cost tracking and compliance.

### Application Load Balancer Configuration

Create an internet-facing Application Load Balancer in the public subnets across both availability zones. This distributes incoming HTTP traffic across our two EC2 instances and performs health checks to route traffic only to healthy instances. The ALB needs the ALB security group and should be tagged appropriately with Environment production and Project monitoring.

Set enable_deletion_protection to false so terraform destroy can clean up the load balancer during testing. In production you'd enable this to prevent accidental deletion. Configure the ALB with a listener on port eighty for HTTP traffic—in production you'd use HTTPS with an ACM certificate, but certificates require DNS validation which is a manual step we're avoiding.

Create a target group with target type instance, protocol HTTP, port eighty, and the VPC ID. Configure health checks to ping path slash on port eighty with a thirty-second interval, healthy threshold of two consecutive successes, and unhealthy threshold of two consecutive failures. Set the deregistration delay to thirty seconds instead of the three hundred second default so targets drain faster during testing.

Register both EC2 instances with the target group using aws_lb_target_group_attachment resources. Create an ALB listener rule that forwards all traffic from the load balancer listener to this target group. The health checks take sixty to ninety seconds to stabilize after the infrastructure is created.

### RDS PostgreSQL Database

Create an RDS PostgreSQL instance using db.t3.micro instance class which provides two virtual CPUs, one gigabyte of memory, and is the smallest instance type suitable for production workloads. Allocate twenty gigabytes of gp3 storage which provides baseline performance of three thousand IOPS and one hundred twenty-five megabytes per second throughput. Use PostgreSQL engine version fourteen for compatibility and long-term support.

Place the database in the DB subnet group spanning our two private subnets. Set publicly_accessible to false so the database has no public IP address and can't be reached from the internet. Enable storage encryption using a customer-managed KMS key to demonstrate encryption best practices. Set the master username to adminuser and generate the password using the random_password resource with sixteen characters, no special characters to avoid database compatibility issues.

Enable automated backups with a retention period of seven days. This is the minimum for production systems and enables point-in-time recovery. For testing, skip_final_snapshot must be true and deletion_protection must be false so terraform destroy can clean up the database without manual intervention. These settings are critical for automated testing environments.

Don't enable Multi-AZ deployment since it adds fifteen to twenty minutes to deployment time and doubles the cost. For testing, single-AZ is sufficient. Use the default parameter group instead of creating a custom one since some parameter changes require database restarts. The database takes eight to ten minutes to become available after creation.

Store the generated database password in AWS Secrets Manager for secure storage and retrieval. Set recovery_window_in_days to zero for immediate deletion during testing—production would use seven to thirty days. The secret should be encrypted using the default AWS managed key for Secrets Manager.

### KMS Customer-Managed Key for RDS Encryption

Create a KMS customer-managed key for encrypting the RDS database at rest. The key policy must grant the root account full administrative permissions and specifically allow the RDS service principal access to use the key for encryption operations. Include permissions for Decrypt, GenerateDataKey, and CreateGrant since RDS needs these for encryption and managing encrypted snapshots.

Enable automatic key rotation as a security best practice—AWS rotates the key material annually while keeping the same key ID. Set deletion_window_in_days to seven which is the minimum, allowing terraform destroy to schedule key deletion during cleanup. Create a key alias like kms-rds-production for easier reference in code and console.

### CloudWatch Log Groups

Create three CloudWatch log groups for centralized logging. The first log group at path /aws/ecommerce/application receives application-level logs like user requests, transactions, and business logic events. The second at /aws/ecommerce/error receives error-level logs including exceptions, stack traces, and failure events. The third at /aws/ecommerce/audit receives security and compliance events like authentication attempts, authorization decisions, and sensitive data access.

Set retention_in_days to thirty exactly for all three log groups as specified in the constraints. This balances compliance requirements with storage costs. CloudWatch Logs charges fifty cents per gigabyte ingested and fifty cents per gigabyte stored per month, so thirty-day retention for moderate log volumes costs two to three dollars monthly.

The log groups use default encryption with AWS managed keys. Log streams are created automatically when applications write logs to the groups—we don't need to pre-create streams.

### CloudWatch Metric Filter for Security Events

Create a metric filter on the application log group to track failed login attempts. The filter pattern should match log entries indicating authentication failures. For example, if logs contain text like "failed login" or "authentication failed", the pattern would be designed to catch these entries.

When the filter matches a log entry, it publishes a metric named FailedLoginAttempts to the Production/ECommerce namespace with a value of one. This increments a counter every time someone fails to authenticate. The metric enables us to create an alarm that triggers when failed login attempts exceed a threshold indicating a potential brute force attack or credential stuffing.

The namespace Production/ECommerce is specified in the constraints and groups all our custom business metrics together. The metric has no dimensions since we're tracking aggregate failed logins across the entire application.

### SNS Topic for Critical Alerts

Create an SNS topic named sns-alerts-production for receiving alarm notifications. Enable server-side encryption using the AWS managed SNS key with the identifier alias/aws/sns as specified in the constraints. The topic uses HTTPS for transport encryption automatically.

Create an email subscription to the topic, but understand it will remain in PendingConfirmation state since email subscriptions require the recipient to click a confirmation link. For testing purposes, we just verify the subscription exists and can receive publishes from CloudWatch. In production this would integrate with PagerDuty, OpsGenie, or Slack for automated incident response.

Tag the topic with Environment production and Project monitoring for cost tracking and compliance.

### CloudWatch Alarms for Infrastructure Monitoring

We need six CloudWatch alarms covering different infrastructure components and using at least three different comparison operators as specified in the constraints.

First, create two EC2 CPU alarms, one per instance, using the GreaterThanThreshold comparison operator. Monitor the CPUUtilization metric in the AWS/EC2 namespace with dimensions for each instance ID. Set the threshold to eighty percent, statistic to Average, period to three hundred seconds, and evaluation periods to two consecutive periods. This means CPU must be above eighty percent for two consecutive five-minute periods before the alarm triggers. Name these alarms alarm-ec2-cpu-1-production and alarm-ec2-cpu-2-production.

Second, create an RDS connection alarm using the GreaterThanOrEqualToThreshold comparison operator. Monitor DatabaseConnections metric in the AWS/RDS namespace with dimension for the RDS instance identifier. Threshold is one hundred fifty connections which approaches the max_connections limit for a db.t3.micro instance. Use one evaluation period since connection spikes happen quickly. Name this alarm-rds-connections-production.

Third, create a Lambda error rate alarm using GreaterThanThreshold with metric math. Calculate error percentage as errors divided by invocations times one hundred. The threshold is five percent—if more than five percent of Lambda invocations fail, something is seriously wrong. Use two evaluation periods to avoid false alarms from transient errors. Name this alarm-lambda-errors-production.

Fourth, create an alarm for the failed login attempts custom metric using GreaterThanThreshold. Monitor FailedLoginAttempts in the Production/ECommerce namespace with threshold of ten attempts in five minutes. This indicates a potential security incident. Use one evaluation period for rapid detection. Name this alarm-failed-logins-production.

Fifth, create an ALB healthy host alarm using the LessThanThreshold comparison operator to satisfy the requirement for three different comparison operators. Monitor HealthyHostCount metric in the AWS/ApplicationELB namespace with dimension for the target group ARN. Set threshold to two—alarm triggers when healthy hosts drop below two, indicating one or both EC2 instances have failed health checks. This is critical infrastructure monitoring. Use one evaluation period. Name this alarm-alb-health-production.

All alarms use five-minute periods which balance detection speed with avoiding false positives except where noted. All alarms publish to the SNS topic when entering ALARM state. Tag all alarms with Environment production and Project monitoring.

The three comparison operators used are GreaterThanThreshold, GreaterThanOrEqualToThreshold, and LessThanThreshold, which satisfies the constraint requiring at least three different comparison operators.

### Composite Alarm for Multi-Component Failures

Create a CloudWatch composite alarm named composite-infrastructure-production that triggers when multiple infrastructure components are degraded simultaneously. The alarm rule should use this logic: ALARM when both EC2 CPU alarms are in ALARM state AND the RDS connection alarm is in ALARM state.

The specific alarm rule syntax should reference the alarm names exactly: ALARM when alarm-ec2-cpu-1-production is ALARM OR alarm-ec2-cpu-2-production is ALARM, and also alarm-rds-connections-production is ALARM. This catches the scenario where web servers are overloaded and the database is saturated with connections, indicating a systemic problem rather than isolated component failure.

Composite alarms reduce alert fatigue by only notifying when multiple correlated conditions are true. A single web server running hot might be expected during traffic spikes, but when the database is also struggling, that's a real incident requiring immediate attention. The composite alarm publishes to the same SNS topic.

### Lambda Function for Custom Metrics

Build a Lambda function in Python 3.11 that publishes custom business metrics to CloudWatch. The function should be triggered every five minutes by an EventBridge scheduled rule. When invoked, the function generates a simulated order processing time—a random value between fifty and five hundred milliseconds representing how long it takes to process an order through our pipeline—and publishes it to CloudWatch using the put_metric_data API.

The metric name is OrderProcessingTime in the Production/ECommerce namespace as specified in constraints. The metric value is the processing time in milliseconds with unit set to Milliseconds. In production this Lambda would actually measure real order processing times by instrumenting the order pipeline, but for testing we're using simulated data.

Set Lambda timeout to sixty seconds and memory to 256 megabytes. The function needs an IAM execution role granting cloudwatch:PutMetricData permission for the Production/ECommerce namespace, plus the standard Lambda logging permissions for CloudWatch Logs. Package the function code using the archive provider from lambda_function.py file.

Create an EventBridge rule with schedule expression rate 5 minutes that triggers the Lambda function. This publishes new metric data points every five minutes creating a time series we can graph on our dashboard. Add a Lambda permission resource allowing EventBridge to invoke the function.

The function should include comprehensive error handling and logging. Log when it successfully publishes metrics, log any errors from the CloudWatch API, and return a proper response. Name the function lambda-metrics-production.

Add explicit depends_on to the Lambda function resource referencing both the IAM role and any policy attachments. This prevents IAM eventual consistency issues where Lambda tries to assume a role that hasn't fully propagated yet.

### CloudWatch Dashboard

Create a CloudWatch dashboard named dashboard-ecommerce-production with five widgets showing critical metrics. All widgets must display data for the last twenty-four hours as specified in constraints.

Widget one shows EC2 CPU utilization as a line graph. Include CPUUtilization metrics for both EC2 instances on the same chart so we can compare them. Use five-minute period and Average statistic. Set the time range to -PT24H which is ISO 8601 duration format for twenty-four hours. Add a horizontal annotation at eighty percent showing the alarm threshold. Title this widget EC2 CPU Utilization.

Widget two shows RDS database connections as a line graph. Single metric for DatabaseConnections from the AWS/RDS namespace with dimension for the database instance identifier. Add horizontal annotation at one hundred fifty connections showing alarm threshold. This helps us see if we're approaching connection limits during traffic spikes. Use five-minute period and Average statistic. Title this widget RDS Database Connections.

Widget three shows Lambda metrics as a stacked area chart. Include three metrics: Invocations, Errors, and Throttles from the AWS/Lambda namespace for our custom metrics function. Use five-minute period and Sum statistic since we're counting events. The stacked area visualization makes it easy to see error rates relative to total invocations. Title this widget Lambda Metrics.

Widget four shows our custom order processing time metric as a line graph. Metric OrderProcessingTime from Production/ECommerce namespace, statistic Average, twenty-four hour time range. This is a key business KPI indicating application performance from the user perspective. Title this widget Order Processing Time.

Widget five shows ALB target health as a number widget displaying the most recent value. Include HealthyHostCount and UnHealthyHostCount metrics from the AWS/ApplicationELB namespace with dimension for the target group ARN. Use one-hour time range for this widget since it's showing current state not historical trends. Title this widget ALB Target Health.

The dashboard body is JSON that needs to be constructed using jsonencode to ensure proper escaping. Each widget specifies its type, the metrics to display, the time range using -PT24H format, visualization properties like titles and axis labels, and any annotations or thresholds.

### IAM Roles and Policies

We need two IAM roles. First, the EC2 instance profile role allowing EC2 instances to publish CloudWatch metrics if needed. The assume role policy allows ec2.amazonaws.com service principal to assume the role. Attach the AWS managed policy CloudWatchAgentServerPolicy which grants all necessary permissions for publishing custom metrics. Name this role role-ec2-cloudwatch-production.

Second, the Lambda execution role allowing the custom metrics function to run. The assume role policy allows lambda.amazonaws.com to assume the role. Create a custom inline policy granting cloudwatch:PutMetricData action for resources in the Production/ECommerce namespace. Also grant the necessary CloudWatch Logs permissions for the function's own logging: logs:CreateLogGroup, logs:CreateLogStream, and logs:PutLogEvents. Name this role role-lambda-metrics-production.

Both roles should be tagged appropriately with Environment production and Project monitoring. Follow least privilege principles—don't grant wildcard permissions except where necessary. CloudWatch Logs resources are created dynamically so logs actions might need a wildcard resource, but that's acceptable since it's a low-risk action.

Add explicit depends_on to the Lambda function resource to depend on both the IAM role and its policy attachments. This avoids IAM eventual consistency issues where the Lambda tries to assume a role that hasn't fully propagated yet.

### Resource Naming Pattern

All resources must follow the deterministic naming pattern: resource-type-purpose-environment. Do not use random_string resources for naming. The environment value is production throughout.

Examples: vpc-ecommerce-production, subnet-public-1-production, subnet-public-2-production, subnet-private-1-production, subnet-private-2-production, igw-ecommerce-production, rtb-public-production, rtb-private-production, sg-alb-production, sg-ec2-production, sg-rds-production, dbsubnetgroup-ecommerce-production, ec2-web-1-production, ec2-web-2-production, alb-ecommerce-production, targetgroup-ecommerce-production, rds-ecommerce-production, kms-rds-production as an alias, secret-db-password-production, lambda-metrics-production, sns-alerts-production.

For CloudWatch resources: alarm-ec2-cpu-1-production, alarm-ec2-cpu-2-production, alarm-rds-connections-production, alarm-lambda-errors-production, alarm-failed-logins-production, alarm-alb-health-production, composite-infrastructure-production, dashboard-ecommerce-production, metricfilter-failed-logins-production.

For IAM resources: role-ec2-cloudwatch-production, role-lambda-metrics-production, instanceprofile-ec2-production.

This deterministic naming is critical for integration tests which look up resources by expected names. Tests will fail if resources have random suffixes.

### Cleanup Configuration

For terraform destroy to work without manual intervention, several resources need specific configurations. The RDS instance must have skip_final_snapshot set to true and deletion_protection set to false. These settings are mandatory for testing environments where we need clean automated teardown.

The Application Load Balancer must have enable_deletion_protection set to false. In production this would be true to prevent accidental deletion, but for testing we need clean teardown.

The KMS key must have deletion_window_in_days set to seven which is the minimum allowed. This schedules the key for deletion rather than immediate removal. The Secrets Manager secret must have recovery_window_in_days set to zero for immediate deletion instead of the default thirty-day recovery window.

EC2 instances must have disable_api_termination set to false explicitly to allow terraform destroy to terminate them. CloudWatch Log groups will be deleted along with their log streams when terraform destroy runs—no special configuration needed.

Don't add lifecycle blocks with prevent_destroy on any resources. The VPC and networking components will be destroyed in the correct order automatically based on Terraform's dependency graph. Security groups delete after EC2 instances and load balancers are terminated.

### File Organization

Create three files in the lib directory. File provider.tf contains Terraform version requirement greater than or equal to 1.5, required providers for aws approximately 5.0 which is critical for compatibility with the labeling tool, random approximately 3.5, and archive approximately 2.4 for Lambda packaging. Configure the AWS provider for us-east-1 region with default tags for Environment set to production, Project set to monitoring, ManagedBy set to Terraform, and Owner set to DevOps as specified in the constraints.

Define variables for environment defaulting to production, alert_email for the SNS subscription defaulting to alerts@example.com, and db_username defaulting to adminuser. These variables make the configuration reusable across environments.

File main.tf contains all infrastructure resources in logical order: data sources for caller identity, region, and availability zones; random password generation for database; KMS key and alias for RDS encryption; Secrets Manager secret for database password; VPC with DNS settings enabled; internet gateway; public and private subnets in two availability zones; public and private route tables with route table associations; security groups without inline rules; security group rules as separate resources to avoid circular dependencies; DB subnet group spanning private subnets; RDS instance with all security and cleanup configurations; IAM role and instance profile for EC2; EC2 instances with detailed monitoring and termination protection disabled; Application Load Balancer with deletion protection disabled; ALB target group with health checks; target group attachments for both EC2 instances; ALB listener forwarding to target group; CloudWatch log groups for application, error, and audit with thirty-day retention; metric filter for failed logins publishing to Production/ECommerce namespace; SNS topic with AWS managed key encryption; SNS email subscription in PendingConfirmation state; all six CloudWatch alarms including EC2 CPU, RDS connections, Lambda errors, failed logins, and ALB health; composite alarm with alarm rule referencing the individual alarms; IAM role for Lambda with inline policy for metrics and logs; Lambda function with explicit depends_on for IAM; EventBridge rule for five-minute schedule; EventBridge target pointing to Lambda; Lambda permission for EventBridge; CloudWatch dashboard with five widgets showing EC2 CPU, RDS connections, Lambda metrics, order processing time, and ALB health; and comprehensive outputs covering all resources.

File lambda_function.py contains the Lambda handler function lambda_handler that takes event and context parameters, imports the random module and boto3, generates a random order processing time between 50 and 500 milliseconds, creates a CloudWatch client, calls put_metric_data with namespace Production/ECommerce and metric name OrderProcessingTime, logs the successful publication using print statements which automatically go to CloudWatch Logs, includes try-except error handling for CloudWatch API errors, and returns a success response with status code 200. The function should be simple and focused solely on publishing the custom metric.

### Required Outputs

We need comprehensive outputs covering every resource for integration testing. Include vpc_id, public_subnet_ids as a list of both subnet IDs, private_subnet_ids as a list of both subnet IDs, internet_gateway_id, public_route_table_id, private_route_table_id, sg_alb_id for ALB security group, sg_ec2_id for EC2 security group, sg_rds_id for RDS security group, db_subnet_group_name.

For compute resources include ec2_instance_1_id, ec2_instance_2_id, ec2_instance_ids as a list of both IDs, ec2_instance_1_public_ip, ec2_instance_2_public_ip, ec2_public_ips as a list, ec2_iam_role_arn, ec2_instance_profile_arn.

For load balancer include alb_arn, alb_dns_name, alb_zone_id, target_group_arn, alb_listener_arn.

For database include rds_instance_id, rds_instance_arn, rds_endpoint marked as sensitive, rds_db_name, kms_key_id, kms_key_arn, kms_key_alias, db_password_secret_arn marked as sensitive.

For CloudWatch logs include log_group_application_name, log_group_application_arn, log_group_error_name, log_group_error_arn, log_group_audit_name, log_group_audit_arn, metric_filter_name.

For alarms include alarm_ec2_cpu_1_name, alarm_ec2_cpu_1_arn, alarm_ec2_cpu_2_name, alarm_ec2_cpu_2_arn, alarm_rds_connections_name, alarm_rds_connections_arn, alarm_lambda_errors_name, alarm_lambda_errors_arn, alarm_failed_logins_name, alarm_failed_logins_arn, alarm_alb_health_name, alarm_alb_health_arn, composite_alarm_name, composite_alarm_arn.

For SNS include sns_topic_arn, sns_topic_name, sns_subscription_arn.

For Lambda include lambda_function_name, lambda_function_arn, lambda_role_arn, lambda_log_group_name which is /aws/lambda/ concatenated with the function name, eventbridge_rule_name, eventbridge_rule_arn.

For dashboard include dashboard_name, dashboard_arn.

For metadata include custom_metric_namespace hardcoded to Production/ECommerce, aws_region from data source, account_id from data source, environment set to production.

Every output needs a description explaining what it represents. Sensitive outputs like database endpoints and secret ARNs should be marked sensitive equals true.

Include at least forty outputs covering all major resources and their key attributes. Group related outputs together logically in the outputs section—all VPC networking outputs, all compute outputs, all database outputs, all monitoring outputs. This makes the output section easier to navigate and ensures tests can find everything they need without making assumptions about resource names.