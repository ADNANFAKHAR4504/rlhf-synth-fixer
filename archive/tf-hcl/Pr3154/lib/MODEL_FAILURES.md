Generted response by model had following errors -

1. Model used wrong DB version for Postgres DB and used the lower version which failed the deployment.

2. Model was unable to create the ACM certificate and failed the deployment.

3. Model made some mistakes in the launch template which caused the auto scaling deployment failures.

```

│ Error: creating RDS DB Instance (production-tap-postgres): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: a95d2cf7-f96c-4bdd-a1b5-7fb4a39acf9d, api error InvalidParameterCombination: Cannot find version 15.5 for postgres
│ 
│   with aws_db_instance.postgres,
│   on tap_stack.tf line 527, in resource "aws_db_instance" "postgres":
│  527: resource "aws_db_instance" "postgres" {
│ 
╵
╷
│ Error: waiting for ACM Certificate (arn:aws:acm:us-west-1:***:certificate/470c1349-e685-44df-b30f-ef0a0c17dd8b) to be issued: timeout while waiting for state to become 'true' (last state: 'false', timeout: 5m0s)
│ 
│   with aws_acm_certificate.main,
│   on tap_stack.tf line 702, in resource "aws_acm_certificate" "main":
│  702: resource "aws_acm_certificate" "main" {
│ 
╵
╷
│ Error: Missing Resource Identity After Create: The Terraform provider unexpectedly returned no resource identity after having no errors in the resource create. This is always a problem with the provider and should be reported to the provider developer
│ 
│   with aws_acm_certificate.main,
│   on tap_stack.tf line 702, in resource "aws_acm_certificate" "main":
│  702: resource "aws_acm_certificate" "main" {
│ 
╵
╷
│ Error: creating Auto Scaling Group (production-tap-asg): operation error Auto Scaling: CreateAutoScalingGroup, https response error StatusCode: 400, RequestID: a79138fc-3b26-4e45-b037-6562d603cf1f, api error InvalidQueryParameter: Invalid launch template: When a network interface is provided, the security groups must be a part of it.
│ 
│   with aws_autoscaling_group.main,
│   on tap_stack.tf line 738, in resource "aws_autoscaling_group" "main":
│  738: resource "aws_autoscaling_group" "main" {

```
