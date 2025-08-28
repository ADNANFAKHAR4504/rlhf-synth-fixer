The deployment is failing because of an in monitoring module.

## Error
aws_cloudwatch_dashboard has reference to undeclared resource. 
A managed resource "aws_cloudwatch_metric_filter" "error_logs" has not been declared in module.monitoring.
Secrets should be created dynamically, using random_password resource.

Please creates the resources that are mentioned in the requirements and generate the complete response for all (vpc, iam, secrets, ec2 and monitoring) modules main.tf, variables.tf and outputs.tf