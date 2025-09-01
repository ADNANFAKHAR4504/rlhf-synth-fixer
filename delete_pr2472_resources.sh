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

ASG_NAMES=(
  "tap-asg-us-east-1-pr2472"
  "tap-asg-us-west-2-pr2472"
)

# Delete CloudWatch Log Groups
echo "Deleting CloudWatch Log Groups..."
# us-east-1 log groups
if aws logs describe-log-groups --region us-east-1 --log-group-name-prefix "/aws/ec2/tap-log-group-us-east-1-pr2472" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "tap-log-group-us-east-1-pr2472"; then
  aws logs delete-log-group --region us-east-1 --log-group-name "/aws/ec2/tap-log-group-us-east-1-pr2472"
  echo "Deleted: /aws/ec2/tap-log-group-us-east-1-pr2472"
else
  echo "Not found: /aws/ec2/tap-log-group-us-east-1-pr2472"
fi

# us-west-2 log groups
if aws logs describe-log-groups --region us-west-2 --log-group-name-prefix "/aws/ec2/tap-log-group-us-west-2-pr2472" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "tap-log-group-us-west-2-pr2472"; then
  aws logs delete-log-group --region us-west-2 --log-group-name "/aws/ec2/tap-log-group-us-west-2-pr2472"
  echo "Deleted: /aws/ec2/tap-log-group-us-west-2-pr2472"
else
  echo "Not found: /aws/ec2/tap-log-group-us-west-2-pr2472"
fi

# Delete RDS Database Instances first
echo "Deleting RDS Database Instances..."
# us-east-1 database
if aws rds describe-db-instances --region us-east-1 --db-instance-identifier "tap-database-us-east-1-pr2472" &>/dev/null; then
  echo "Disabling deletion protection for: tap-database-us-east-1-pr2472"
  aws rds modify-db-instance --region us-east-1 --db-instance-identifier "tap-database-us-east-1-pr2472" --no-deletion-protection --apply-immediately
  echo "Waiting for modification to complete..."
  aws rds wait db-instance-available --region us-east-1 --db-instance-identifier "tap-database-us-east-1-pr2472"
  
  echo "Deleting database instance: tap-database-us-east-1-pr2472"
  aws rds delete-db-instance --region us-east-1 --db-instance-identifier "tap-database-us-east-1-pr2472" --skip-final-snapshot
  echo "Requested delete: tap-database-us-east-1-pr2472"
else
  echo "Not found: tap-database-us-east-1-pr2472"
fi

# us-west-2 database
if aws rds describe-db-instances --region us-west-2 --db-instance-identifier "tap-database-us-west-2-pr2472" &>/dev/null; then
  echo "Disabling deletion protection for: tap-database-us-west-2-pr2472"
  aws rds modify-db-instance --region us-west-2 --db-instance-identifier "tap-database-us-west-2-pr2472" --no-deletion-protection --apply-immediately
  echo "Waiting for modification to complete..."
  aws rds wait db-instance-available --region us-west-2 --db-instance-identifier "tap-database-us-west-2-pr2472"
  
  echo "Deleting database instance: tap-database-us-west-2-pr2472"
  aws rds delete-db-instance --region us-west-2 --db-instance-identifier "tap-database-us-west-2-pr2472" --skip-final-snapshot
  echo "Requested delete: tap-database-us-west-2-pr2472"
else
  echo "Not found: tap-database-us-west-2-pr2472"
fi

# Wait for RDS instances to be deleted
echo "Waiting for RDS instances to be deleted..."
if aws rds describe-db-instances --region us-east-1 --db-instance-identifier "tap-database-us-east-1-pr2472" &>/dev/null; then
  echo "Waiting for tap-database-us-east-1-pr2472 to be deleted..."
  aws rds wait db-instance-deleted --region us-east-1 --db-instance-identifier "tap-database-us-east-1-pr2472"
  echo "Deleted: tap-database-us-east-1-pr2472"
fi

if aws rds describe-db-instances --region us-west-2 --db-instance-identifier "tap-database-us-west-2-pr2472" &>/dev/null; then
  echo "Waiting for tap-database-us-west-2-pr2472 to be deleted..."
  aws rds wait db-instance-deleted --region us-west-2 --db-instance-identifier "tap-database-us-west-2-pr2472"
  echo "Deleted: tap-database-us-west-2-pr2472"
fi

# Delete RDS Subnet Groups (after databases are deleted)
echo "Deleting RDS Subnet Groups..."
if aws rds describe-db-subnet-groups --region us-east-1 --db-subnet-group-name "tap-db-subnet-group-us-east-1-pr2472" &>/dev/null; then
  aws rds delete-db-subnet-group --region us-east-1 --db-subnet-group-name "tap-db-subnet-group-us-east-1-pr2472"
  echo "Deleted: tap-db-subnet-group-us-east-1-pr2472"
else
  echo "Not found: tap-db-subnet-group-us-east-1-pr2472"
fi

if aws rds describe-db-subnet-groups --region us-west-2 --db-subnet-group-name "tap-db-subnet-group-us-west-2-pr2472" &>/dev/null; then
  aws rds delete-db-subnet-group --region us-west-2 --db-subnet-group-name "tap-db-subnet-group-us-west-2-pr2472"
  echo "Deleted: tap-db-subnet-group-us-west-2-pr2472"
else
  echo "Not found: tap-db-subnet-group-us-west-2-pr2472"
fi

# Delete Auto Scaling Groups first (they depend on Launch Templates)
echo "Deleting Auto Scaling Groups..."
# us-east-1 ASG
if aws autoscaling describe-auto-scaling-groups --region us-east-1 --auto-scaling-group-names "tap-asg-us-east-1-pr2472" --query 'AutoScalingGroups[0].AutoScalingGroupName' --output text 2>/dev/null | grep -q "tap-asg-us-east-1-pr2472"; then
  echo "Deleting ASG: tap-asg-us-east-1-pr2472"
  aws autoscaling update-auto-scaling-group --region us-east-1 --auto-scaling-group-name "tap-asg-us-east-1-pr2472" --desired-capacity 0 --min-size 0 --max-size 0
  echo "Waiting for instances to terminate..."
  sleep 10
  aws autoscaling delete-auto-scaling-group --region us-east-1 --auto-scaling-group-name "tap-asg-us-east-1-pr2472" --force-delete
  echo "Deleted: tap-asg-us-east-1-pr2472"
else
  echo "Not found: tap-asg-us-east-1-pr2472"
fi

# us-west-2 ASG
if aws autoscaling describe-auto-scaling-groups --region us-west-2 --auto-scaling-group-names "tap-asg-us-west-2-pr2472" --query 'AutoScalingGroups[0].AutoScalingGroupName' --output text 2>/dev/null | grep -q "tap-asg-us-west-2-pr2472"; then
  echo "Deleting ASG: tap-asg-us-west-2-pr2472"
  aws autoscaling update-auto-scaling-group --region us-west-2 --auto-scaling-group-name "tap-asg-us-west-2-pr2472" --desired-capacity 0 --min-size 0 --max-size 0
  echo "Waiting for instances to terminate..."
  sleep 10
  aws autoscaling delete-auto-scaling-group --region us-west-2 --auto-scaling-group-name "tap-asg-us-west-2-pr2472" --force-delete
  echo "Deleted: tap-asg-us-west-2-pr2472"
else
  echo "Not found: tap-asg-us-west-2-pr2472"
fi

# Delete Launch Templates (after ASGs are deleted)
echo "Deleting EC2 Launch Templates..."
if aws ec2 describe-launch-templates --region us-east-1 --launch-template-names "tap-lt-us-east-1-pr2472" &>/dev/null; then
  aws ec2 delete-launch-template --region us-east-1 --launch-template-name "tap-lt-us-east-1-pr2472"
  echo "Deleted: tap-lt-us-east-1-pr2472"
else
  echo "Not found: tap-lt-us-east-1-pr2472"
fi

if aws ec2 describe-launch-templates --region us-west-2 --launch-template-names "tap-lt-us-west-2-pr2472" &>/dev/null; then
  aws ec2 delete-launch-template --region us-west-2 --launch-template-name "tap-lt-us-west-2-pr2472"
  echo "Deleted: tap-lt-us-west-2-pr2472"
else
  echo "Not found: tap-lt-us-west-2-pr2472"
fi

# Delete ALBs and wait for deletion
echo "Deleting Load Balancers..."
# us-east-1 ALB
alb_arn_east=$(aws elbv2 describe-load-balancers --region us-east-1 --names "tap-alb-us-east-1-pr2472" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
if [[ -n "$alb_arn_east" && "$alb_arn_east" != "None" ]]; then
  aws elbv2 delete-load-balancer --region us-east-1 --load-balancer-arn "$alb_arn_east"
  echo "Requested delete: tap-alb-us-east-1-pr2472"
  echo "Waiting for ALB to be deleted..."
  aws elbv2 wait load-balancers-deleted --region us-east-1 --load-balancer-arns "$alb_arn_east"
  echo "Deleted: tap-alb-us-east-1-pr2472"
else
  echo "Not found: tap-alb-us-east-1-pr2472"
fi

# us-west-2 ALB
alb_arn_west=$(aws elbv2 describe-load-balancers --region us-west-2 --names "tap-alb-us-west-2-pr2472" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
if [[ -n "$alb_arn_west" && "$alb_arn_west" != "None" ]]; then
  aws elbv2 delete-load-balancer --region us-west-2 --load-balancer-arn "$alb_arn_west"
  echo "Requested delete: tap-alb-us-west-2-pr2472"
  echo "Waiting for ALB to be deleted..."
  aws elbv2 wait load-balancers-deleted --region us-west-2 --load-balancer-arns "$alb_arn_west"
  echo "Deleted: tap-alb-us-west-2-pr2472"
else
  echo "Not found: tap-alb-us-west-2-pr2472"
fi

# Delete Target Groups (after ALBs are deleted)
echo "Deleting Target Groups..."
# us-east-1 Target Group
tg_arn_east=$(aws elbv2 describe-target-groups --region us-east-1 --names "tap-tg-us-east-1-pr2472" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")
if [[ -n "$tg_arn_east" && "$tg_arn_east" != "None" ]]; then
  aws elbv2 delete-target-group --region us-east-1 --target-group-arn "$tg_arn_east"
  echo "Deleted: tap-tg-us-east-1-pr2472"
else
  echo "Not found: tap-tg-us-east-1-pr2472"
fi

# us-west-2 Target Group
tg_arn_west=$(aws elbv2 describe-target-groups --region us-west-2 --names "tap-tg-us-west-2-pr2472" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")
if [[ -n "$tg_arn_west" && "$tg_arn_west" != "None" ]]; then
  aws elbv2 delete-target-group --region us-west-2 --target-group-arn "$tg_arn_west"
  echo "Deleted: tap-tg-us-west-2-pr2472"
else
  echo "Not found: tap-tg-us-west-2-pr2472"
fi

echo "✅ All deletions completed."
