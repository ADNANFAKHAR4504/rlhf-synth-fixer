To improve our operational visibility, we need to enhance the monitoring and alerting for our secure web application.

Please create a new CloudWatch Dashboard that visualizes key metrics for our EC2 instance and RDS database, including CPU Utilization, Disk I/O, and Network In/Out.

Additionally, set up an SNS topic for critical alerts. The high-CPU CloudWatch alarms we created earlier for both EC2 and RDS should be configured to publish a notification to this SNS topic whenever they go into an ALARM state.
