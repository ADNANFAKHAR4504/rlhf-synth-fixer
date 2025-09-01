#!/bin/bash

set -euo pipefail

# Define all resource names
LOG_GROUPS=(
  "/aws/ec2/tap-log-group-us-east-1-pr2472"
  "/aws/ec2/tap-log-group-us-west-2-pr2472"
)

DB_INSTANCES=(
  "tap-database-us-east-1-pr2472"
  "tap-database-us-west-2-pr2472"
)

DB_SUBNET_GROUPS=(
  "tap-db-subnet-group-us-east-1-pr2472"
  "tap-db-subnet-group-us-west-2-pr2472"
)

LAUNCH_TEMPLATES=(
  "tap-lt-us-east-1-pr2472"
  "tap-lt-us-west-2-pr2472"
)

ALB_NAMES=(
  "tap-alb-us-east-1-pr2472"
  "tap-alb-us-west-2-pr2472"
)

TG_NAMES=(
  "tap-tg-us-east-1-pr2472"
  "tap-tg-us-west-2-pr2472"
)

# Delete CloudWatch Log Groups
echo "Deleting CloudWatch Log Groups..."
for log_group in "${LOG_GROUPS[@]}"; do
  if aws logs describe-log-groups --log-group-name-prefix "$log_group" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$log_group"; then
    aws logs delete-log-group --log-group-name "$log_group"
    echo "Deleted: $log_group"
  else
    echo "Not found: $log_group"
  fi
done

# Delete RDS Database Instances first
echo "Deleting RDS Database Instances..."
for db_instance in "${DB_INSTANCES[@]}"; do
  if aws rds describe-db-instances --db-instance-identifier "$db_instance" &>/dev/null; then
    echo "Deleting database instance: $db_instance"
    aws rds delete-db-instance --db-instance-identifier "$db_instance" --skip-final-snapshot
    echo "Requested delete: $db_instance"
  else
    echo "Not found: $db_instance"
  fi
done

# Wait for RDS instances to be deleted
echo "Waiting for RDS instances to be deleted..."
for db_instance in "${DB_INSTANCES[@]}"; do
  if aws rds describe-db-instances --db-instance-identifier "$db_instance" &>/dev/null; then
    echo "Waiting for $db_instance to be deleted..."
    aws rds wait db-instance-deleted --db-instance-identifier "$db_instance"
    echo "Deleted: $db_instance"
  fi
done

# Delete RDS Subnet Groups (after databases are deleted)
echo "Deleting RDS Subnet Groups..."
for subnet_group in "${DB_SUBNET_GROUPS[@]}"; do
  if aws rds describe-db-subnet-groups --db-subnet-group-name "$subnet_group" &>/dev/null; then
    aws rds delete-db-subnet-group --db-subnet-group-name "$subnet_group"
    echo "Deleted: $subnet_group"
  else
    echo "Not found: $subnet_group"
  fi
done

# Delete Launch Templates
echo "Deleting EC2 Launch Templates..."
for lt_name in "${LAUNCH_TEMPLATES[@]}"; do
  if aws ec2 describe-launch-templates --launch-template-names "$lt_name" &>/dev/null; then
    aws ec2 delete-launch-template --launch-template-name "$lt_name"
    echo "Deleted: $lt_name"
  else
    echo "Not found: $lt_name"
  fi
done

# Delete ALBs and wait for deletion
echo "Deleting Load Balancers..."
for alb_name in "${ALB_NAMES[@]}"; do
  alb_arn=$(aws elbv2 describe-load-balancers --names "$alb_name" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
  if [[ -n "$alb_arn" && "$alb_arn" != "None" ]]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$alb_arn"
    echo "Requested delete: $alb_name"
    echo "Waiting for ALB to be deleted..."
    aws elbv2 wait load-balancers-deleted --load-balancer-arns "$alb_arn"
    echo "Deleted: $alb_name"
  else
    echo "Not found: $alb_name"
  fi
done

# Delete Target Groups (after ALBs are deleted)
echo "Deleting Target Groups..."
for tg_name in "${TG_NAMES[@]}"; do
  tg_arn=$(aws elbv2 describe-target-groups --names "$tg_name" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")
  if [[ -n "$tg_arn" && "$tg_arn" != "None" ]]; then
    aws elbv2 delete-target-group --target-group-arn "$tg_arn"
    echo "Deleted: $tg_name"
  else
    echo "Not found: $tg_name"
  fi
done

echo "✅ All deletions completed."
