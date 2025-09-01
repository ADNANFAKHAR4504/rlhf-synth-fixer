#!/bin/bash

# Fix CDKTF resource conflicts by cleaning up existing resources
# Usage: ./scripts/fix-resource-conflicts.sh [cleanup|import] [environment-suffix]

set -e

ACTION="${1:-cleanup}"
ENVIRONMENT_SUFFIX="${2:-${ENVIRONMENT_SUFFIX:-pr2472}}"

echo "🔧 Fixing resource conflicts for environment: $ENVIRONMENT_SUFFIX"
echo "Action: $ACTION"

# AWS regions to check
REGIONS=("us-east-1" "us-west-2")

function cleanup_resources() {
    echo "🗑️  Cleaning up existing resources that conflict with CDKTF deployment..."
    echo "ℹ️  This script is idempotent - safe to run multiple times"
    
    for REGION in "${REGIONS[@]}"; do
        echo "Processing region: $REGION"
        
        # Set AWS region for commands
        export AWS_DEFAULT_REGION=$REGION
        
        # 1. Delete CloudWatch Log Groups
        LOG_GROUP_NAME="/aws/ec2/tap-log-group-$REGION-$ENVIRONMENT_SUFFIX"
        echo "Checking CloudWatch Log Group: $LOG_GROUP_NAME"
        if aws logs describe-log-groups --region $REGION --log-group-name-prefix "$LOG_GROUP_NAME" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "tap-log-group"; then
            echo "  ❌ Deleting existing CloudWatch Log Group: $LOG_GROUP_NAME"
            aws logs delete-log-group --region $REGION --log-group-name "$LOG_GROUP_NAME" 2>/dev/null || echo "  ⚠️  Failed to delete log group (may not exist or already deleted)"
        else
            echo "  ✅ CloudWatch Log Group does not exist"
        fi
        
        # 2. Delete DB Subnet Groups
        DB_SUBNET_GROUP_NAME="tap-db-subnet-group-$REGION-$ENVIRONMENT_SUFFIX"
        echo "Checking DB Subnet Group: $DB_SUBNET_GROUP_NAME"
        if aws rds describe-db-subnet-groups --region $REGION --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" >/dev/null 2>&1; then
            echo "  ❌ Deleting existing DB Subnet Group: $DB_SUBNET_GROUP_NAME"
            aws rds delete-db-subnet-group --region $REGION --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" 2>/dev/null || echo "  ⚠️  Failed to delete DB subnet group (may be in use or already deleted)"
        else
            echo "  ✅ DB Subnet Group does not exist"
        fi
        
        # 3. Check for other conflicting resources (ALBs, ASGs, RDS instances)
        ALB_NAME="tap-alb-$REGION-$ENVIRONMENT_SUFFIX"
        echo "Checking ALB: $ALB_NAME"
        if aws elbv2 describe-load-balancers --region $REGION --names "$ALB_NAME" >/dev/null 2>&1; then
            echo "  ⚠️  ALB exists: $ALB_NAME (manual cleanup may be required)"
        else
            echo "  ✅ ALB does not exist"
        fi
        
        # 4. Check ASG
        ASG_NAME="tap-asg-$REGION-$ENVIRONMENT_SUFFIX"
        echo "Checking ASG: $ASG_NAME"
        if aws autoscaling describe-auto-scaling-groups --region $REGION --auto-scaling-group-names "$ASG_NAME" --query 'AutoScalingGroups[0].AutoScalingGroupName' --output text 2>/dev/null | grep -q "tap-asg"; then
            echo "  ⚠️  ASG exists: $ASG_NAME (manual cleanup may be required)"
        else
            echo "  ✅ ASG does not exist"
        fi
        
        # 5. Check RDS Database
        DB_IDENTIFIER="tap-database-$REGION-$ENVIRONMENT_SUFFIX"
        echo "Checking RDS Database: $DB_IDENTIFIER"
        if aws rds describe-db-instances --region $REGION --db-instance-identifier "$DB_IDENTIFIER" >/dev/null 2>&1; then
            echo "  ⚠️  RDS Database exists: $DB_IDENTIFIER (manual cleanup may be required due to deletion protection)"
        else
            echo "  ✅ RDS Database does not exist"
        fi
        
        echo "Completed region: $REGION"
        echo "---"
    done
    
    echo "✅ Resource cleanup completed!"
    echo "💡 Note: Some resources may require manual cleanup if they have dependencies or protection enabled"
}

function import_resources() {
    echo "📥 Importing existing resources into CDKTF state..."
    echo "⚠️  Import functionality requires CDKTF to be synthesized first"
    
    # Check if cdktf.out exists
    if [ ! -d "cdktf.out/stacks/TapStack$ENVIRONMENT_SUFFIX" ]; then
        echo "❌ CDKTF output not found. Please run 'npm run cdktf:synth' first"
        exit 1
    fi
    
    cd "cdktf.out/stacks/TapStack$ENVIRONMENT_SUFFIX"
    
    echo "🔄 Initializing Terraform..."
    terraform init
    
    for REGION in "${REGIONS[@]}"; do
        echo "Processing region: $REGION"
        
        # Import CloudWatch Log Group
        LOG_GROUP_NAME="/aws/ec2/tap-log-group-$REGION-$ENVIRONMENT_SUFFIX"
        RESOURCE_NAME_EAST="aws_cloudwatch_log_group.app-log-group-east"
        RESOURCE_NAME_WEST="aws_cloudwatch_log_group.app-log-group-west"
        
        if [ "$REGION" == "us-east-1" ]; then
            RESOURCE_NAME=$RESOURCE_NAME_EAST
        else
            RESOURCE_NAME=$RESOURCE_NAME_WEST
        fi
        
        echo "Importing CloudWatch Log Group: $LOG_GROUP_NAME -> $RESOURCE_NAME"
        if aws logs describe-log-groups --region $REGION --log-group-name-prefix "$LOG_GROUP_NAME" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "tap-log-group"; then
            terraform import "$RESOURCE_NAME" "$LOG_GROUP_NAME" || echo "  ⚠️  Import failed for log group"
        else
            echo "  ℹ️  Log group does not exist, skipping import"
        fi
        
        # Import DB Subnet Group
        DB_SUBNET_GROUP_NAME="tap-db-subnet-group-$REGION-$ENVIRONMENT_SUFFIX"
        if [ "$REGION" == "us-east-1" ]; then
            DB_RESOURCE_NAME="aws_db_subnet_group.db-subnet-group-east"
        else
            DB_RESOURCE_NAME="aws_db_subnet_group.db-subnet-group-west"
        fi
        
        echo "Importing DB Subnet Group: $DB_SUBNET_GROUP_NAME -> $DB_RESOURCE_NAME"
        if aws rds describe-db-subnet-groups --region $REGION --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" >/dev/null 2>&1; then
            terraform import "$DB_RESOURCE_NAME" "$DB_SUBNET_GROUP_NAME" || echo "  ⚠️  Import failed for DB subnet group"
        else
            echo "  ℹ️  DB subnet group does not exist, skipping import"
        fi
        
        echo "Completed region: $REGION"
        echo "---"
    done
    
    cd ../../../
    echo "✅ Resource import completed!"
}

function show_usage() {
    echo "Usage: $0 [cleanup|import] [environment-suffix]"
    echo ""
    echo "Actions:"
    echo "  cleanup  - Delete existing AWS resources that conflict with CDKTF (default)"
    echo "  import   - Import existing AWS resources into CDKTF state"
    echo ""
    echo "Environment suffix:"
    echo "  Defaults to: pr2472 (or value of ENVIRONMENT_SUFFIX env var)"
    echo ""
    echo "Examples:"
    echo "  $0 cleanup pr2472        # Clean up resources for pr2472 environment"
    echo "  $0 import dev             # Import resources for dev environment"
    echo "  $0                        # Clean up resources for default environment"
}

# Main execution
case "$ACTION" in
    "cleanup")
        cleanup_resources
        ;;
    "import")
        import_resources
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        show_usage
        exit 1
        ;;
esac

echo ""
echo "🚀 Ready for CDKTF deployment!"
echo "💡 You can now run: npm run cdktf:deploy"