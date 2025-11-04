1. Critical Failures - The error you are seeing is because the argument log_destination_arn is no longer supported in recent versions of the Terraform AWS provider for the aws_flow_log resource. Instead, you should use the log_destination argument, which accepts the ARN of the CloudWatch log group or S3 bucket, depending on your log destination type.

Additional Notes
The log_destination_arn argument was deprecated in favor of log_destination to unify the interface for both S3 and CloudWatch log destinations.

Make sure your AWS provider version is up to date (5.18.1 or later is recommended for full compatibility).

If you are using an older version of the provider, consider upgrading to avoid deprecation warnings and ensure compatibility with AWS API changes.


```

╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 683, in resource "aws_flow_log" "primary":
│  683:   log_destination_arn  = aws_cloudwatch_log_group.primary_flow_logs.arn
│ 
│ An argument named "log_destination_arn" is not expected here.
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 699, in resource "aws_flow_log" "secondary":
│  699:   log_destination_arn  = aws_cloudwatch_log_group.secondary_flow_logs.arn
│ 
│ An argument named "log_destination_arn" is not expected here.
╵

```

2. Medium Failures - Model wrongly used the sg- as wrong prefix in the security groups which is not allowed.


Fix- remvove the sg- from prefix in security groups.
```

╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.primary_alb,
│   on tap_stack.tf line 718, in resource "aws_security_group" "primary_alb":
│  718:   name        = "sg-alb-primary-${local.resource_suffix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.secondary_alb,
│   on tap_stack.tf line 757, in resource "aws_security_group" "secondary_alb":
│  757:   name        = "sg-alb-secondary-${local.resource_suffix}"
│ 
╵

```

3. Critical Failures -

aws_route53_record.primary_failover and secondary_failover saying "ttl": all of records,ttl must be specified occur because you are defining ttl = 60 but missing the records argument, which is mandatory for Route53 records of type non-alias with TTL.

However, in your use case, you are using alias records (to ALBs) with failover routing policy, where:

Alias records do not support TTL. The TTL must be omitted because AWS manages it automatically (fixed 60 seconds internally).

You must use the alias block with required parameters: name, zone_id, and optionally evaluate_target_health.

You should remove ttl and records attributes entirely for alias records.

```
╷
│ Error: Missing required argument
│ 
│   with aws_route53_record.primary_failover,
│   on tap_stack.tf line 1425, in resource "aws_route53_record" "primary_failover":
│ 1425:   ttl      = 60
│ 
│ "ttl": all of `records,ttl` must be specified
╵
╷
│ Error: Missing required argument
│ 
│   with aws_route53_record.secondary_failover,
│   on tap_stack.tf line 1448, in resource "aws_route53_record" "secondary_failover":
│ 1448:   ttl      = 60
│ 
│ "ttl": all of `records,ttl` must be specified
```

4. Critical Failures - The error "InvalidSubnet: No default subnet detected in VPC" for the RDS read replica aws_db_instance.secondary_replica on line 979 is caused because the RDS instance creation expects default subnets in the VPC, but your VPC has only custom subnets without any default subnets.

AWS RDS read replicas require a DB subnet group with subnet IDs of private subnets within the target VPC. It looks like your aws_db_instance.secondary_replica is missing correctly referencing a valid subnet group containing private subnets for the secondary VPC.

How to Fix
Ensure you have defined a aws_db_subnet_group resource for the secondary VPC containing private subnet IDs.

Reference that aws_db_subnet_group.secondary.name in your aws_db_instance.secondary_replica resource's db_subnet_group_name argument.

Make sure your subnets are private subnets (non-public) in the secondary VPC.

```

│ Error: creating RDS DB Instance (read replica) (rds-secondary-replica-dbha): operation error RDS: CreateDBInstanceReadReplica, https response error StatusCode: 400, RequestID: 845faf80-b65a-4a1a-a398-424e699fbc82, InvalidSubnet: No default subnet detected in VPC. Please contact AWS Support to recreate default Subnets.
│ 
│   with aws_db_instance.secondary_replica,
│   on tap_stack.tf line 979, in resource "aws_db_instance" "secondary_replica":
│  979: resource "aws_db_instance" "secondary_replica" {
│ 
╵

```

5. Medium Failure - The timeout issue while creating the ELBv2 Load Balancer (at line 1235) with the error "timeout while waiting for state to become 'active'" typically indicates that the Load Balancer is stuck in the 'provisioning' state and isn't reaching 'active' within the default 10-minute window.

Common Causes:
Resource dependencies: The Load Balancer may depend on resources such as subnets, security groups, or IAM roles, which are not yet fully available or configured properly.

Subnet configuration issues: Subnets used must be properly configured and accessible.

Security groups: Security groups should have the correct inbound and outbound rules.

Subnet availability zones and IPs: Ensure the subnets are available in the specified AZs and have IP addresses available.

Resource limits or quota issues: Account limits for resources like ENIs or IP addresses might be exceeded.

Fix - depends_on Can Solve the Issue
By explicitly specifying depends_on with the resources that must be created or fully initialized before the ALB creation, you make sure Terraform enforces the resource creation order.

This can prevent the load balancer from being created prematurely when dependent resources are still in progress or unavailable.

```

│ Error: waiting for ELBv2 Load Balancer (arn:aws:elasticloadbalancing:us-east-1:***:loadbalancer/app/alb-primary-dbha/7079483ae4c16c64) create: timeout while waiting for state to become 'active' (last state: 'provisioning', timeout: 10m0s)
│ 
│   with aws_lb.primary,
│   on tap_stack.tf line 1235, in resource "aws_lb" "primary":
│ 1235: resource "aws_lb" "primary" {

```
