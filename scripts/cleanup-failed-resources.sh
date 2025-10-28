#!/bin/bash

# Cleanup Failed AWS Resources Script
# This script removes failed ElastiCache and other AWS resources before deployment
# to ensure clean deployments in CI/CD pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-"pr5133"}
AWS_REGION=${AWS_REGION:-"eu-west-1"}

echo -e "${YELLOW}🧹 Starting cleanup of failed AWS resources...${NC}"
echo "Environment: ${ENVIRONMENT_SUFFIX}"
echo "Region: ${AWS_REGION}"

# Function to check if AWS CLI is configured
check_aws_config() {
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "${RED}❌ AWS CLI not configured or credentials invalid${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI configured${NC}"
}

# Function to cleanup failed ElastiCache replication groups
cleanup_elasticache() {
    echo -e "${YELLOW}🔍 Checking for failed ElastiCache replication groups...${NC}"
    
    # Get the replication group name
    REDIS_NAME="healthcare-redis-${ENVIRONMENT_SUFFIX}"
    
    # Check if the replication group exists and its status
    STATUS=$(aws elasticache describe-replication-groups \
        --region "${AWS_REGION}" \
        --replication-group-id "${REDIS_NAME}" \
        --query 'ReplicationGroups[0].ReplicationGroupStatus' \
        --output text 2>/dev/null || echo "not-found")
    
    if [ "$STATUS" != "not-found" ] && [ "$STATUS" != "None" ]; then
        echo -e "${YELLOW}🔍 Found ElastiCache replication group: ${REDIS_NAME} (Status: ${STATUS})${NC}"
        
        if [ "$STATUS" = "create-failed" ] || [ "$STATUS" = "deleting" ] || [ "$STATUS" = "deletion-failed" ] || [ "$STATUS" = "modifying" ] || [ "$STATUS" = "snapshotting" ]; then
            echo -e "${RED}⚠️  Found failed ElastiCache replication group: ${REDIS_NAME} (Status: ${STATUS})${NC}"
            echo -e "${YELLOW}🗑️  Attempting to delete failed replication group...${NC}"
            
            # Force delete the replication group
            if aws elasticache delete-replication-group \
                --region "${AWS_REGION}" \
                --replication-group-id "${REDIS_NAME}" \
                --no-retain-primary-cluster 2>/dev/null; then
                
                echo -e "${YELLOW}⏳ Waiting for replication group deletion to complete...${NC}"
                
                # Wait for deletion to complete (max 10 minutes)
                COUNTER=0
                MAX_ATTEMPTS=60
                while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                    if ! aws elasticache describe-replication-groups \
                        --region "${AWS_REGION}" \
                        --replication-group-id "${REDIS_NAME}" >/dev/null 2>&1; then
                        echo -e "${GREEN}✅ ElastiCache replication group deleted successfully${NC}"
                        break
                    fi
                    
                    echo -e "${YELLOW}⏳ Still deleting... (${COUNTER}/${MAX_ATTEMPTS})${NC}"
                    sleep 10
                    COUNTER=$((COUNTER + 1))
                done
                
                if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                    echo -e "${RED}❌ Timeout waiting for replication group deletion${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}❌ Failed to delete replication group${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}⚠️  ElastiCache replication group found in state: ${STATUS}${NC}"
            echo -e "${YELLOW}🗑️  Attempting precautionary deletion for clean deployment...${NC}"
            
            # Attempt to delete the replication group to ensure clean state
            if aws elasticache delete-replication-group \
                --region "${AWS_REGION}" \
                --replication-group-id "${REDIS_NAME}" \
                --no-retain-primary-cluster 2>/dev/null; then
                
                echo -e "${YELLOW}⏳ Waiting for replication group deletion to complete...${NC}"
                
                # Wait for deletion to complete (max 10 minutes)
                COUNTER=0
                MAX_ATTEMPTS=60
                while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                    if ! aws elasticache describe-replication-groups \
                        --region "${AWS_REGION}" \
                        --replication-group-id "${REDIS_NAME}" >/dev/null 2>&1; then
                        echo -e "${GREEN}✅ ElastiCache replication group deleted successfully${NC}"
                        break
                    fi
                    
                    echo -e "${YELLOW}⏳ Still deleting... (${COUNTER}/${MAX_ATTEMPTS})${NC}"
                    sleep 10
                    COUNTER=$((COUNTER + 1))
                done
                
                if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                    echo -e "${RED}❌ Timeout waiting for replication group deletion${NC}"
                    echo -e "${YELLOW}⚠️  Continuing deployment despite cleanup timeout...${NC}"
                fi
            else
                echo -e "${YELLOW}⚠️  Could not delete replication group (may be protected or in transition)${NC}"
                echo -e "${YELLOW}⚠️  Continuing deployment...${NC}"
            fi
        fi
    elif [ "$STATUS" = "not-found" ]; then
        echo -e "${GREEN}✅ No ElastiCache replication group found (clean state)${NC}"
    else
        echo -e "${YELLOW}⚠️  ElastiCache status query returned: ${STATUS}${NC}"
        echo -e "${YELLOW}🗑️  Attempting to delete any existing replication group...${NC}"
        
        # Try to delete regardless of status detection issues
        aws elasticache delete-replication-group \
            --region "${AWS_REGION}" \
            --replication-group-id "${REDIS_NAME}" \
            --no-retain-primary-cluster 2>/dev/null || echo -e "${YELLOW}⚠️  No replication group to delete or deletion failed${NC}"
    fi
}

# Function to cleanup failed RDS instances
cleanup_rds() {
    echo -e "${YELLOW}🔍 Checking for failed RDS instances...${NC}"
    
    # Get the RDS instance name
    RDS_NAME="healthcare-db-${ENVIRONMENT_SUFFIX}"
    
    # Check if the RDS instance exists and its status
    if aws rds describe-db-instances \
        --region "${AWS_REGION}" \
        --db-instance-identifier "${RDS_NAME}" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text >/dev/null 2>&1; then
        
        STATUS=$(aws rds describe-db-instances \
            --region "${AWS_REGION}" \
            --db-instance-identifier "${RDS_NAME}" \
            --query 'DBInstances[0].DBInstanceStatus' \
            --output text 2>/dev/null || echo "not-found")
        
        if [ "$STATUS" = "failed" ] || [ "$STATUS" = "incompatible-restore" ] || [ "$STATUS" = "storage-full" ]; then
            echo -e "${RED}⚠️  Found failed RDS instance: ${RDS_NAME} (Status: ${STATUS})${NC}"
            echo -e "${YELLOW}🗑️  Attempting to delete failed RDS instance...${NC}"
            
            # Delete the RDS instance (skip final snapshot for cleanup)
            if aws rds delete-db-instance \
                --region "${AWS_REGION}" \
                --db-instance-identifier "${RDS_NAME}" \
                --skip-final-snapshot 2>/dev/null; then
                
                echo -e "${YELLOW}⏳ Waiting for RDS instance deletion to complete...${NC}"
                
                # Wait for deletion to complete (max 15 minutes)
                COUNTER=0
                MAX_ATTEMPTS=90
                while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
                    if ! aws rds describe-db-instances \
                        --region "${AWS_REGION}" \
                        --db-instance-identifier "${RDS_NAME}" >/dev/null 2>&1; then
                        echo -e "${GREEN}✅ RDS instance deleted successfully${NC}"
                        break
                    fi
                    
                    echo -e "${YELLOW}⏳ Still deleting... (${COUNTER}/${MAX_ATTEMPTS})${NC}"
                    sleep 10
                    COUNTER=$((COUNTER + 1))
                done
                
                if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
                    echo -e "${RED}❌ Timeout waiting for RDS instance deletion${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}❌ Failed to delete RDS instance${NC}"
                exit 1
            fi
        else
            echo -e "${GREEN}✅ RDS instance is in acceptable state: ${STATUS}${NC}"
        fi
    else
        echo -e "${GREEN}✅ No RDS instance found (clean state)${NC}"
    fi
}

# Function to cleanup orphaned subnet groups
cleanup_subnet_groups() {
    echo -e "${YELLOW}🔍 Checking for orphaned subnet groups...${NC}"
    
    # Cleanup ElastiCache subnet group
    ELASTICACHE_SUBNET_GROUP="healthcare-redis-subnet-group-${ENVIRONMENT_SUFFIX}"
    if aws elasticache describe-cache-subnet-groups \
        --region "${AWS_REGION}" \
        --cache-subnet-group-name "${ELASTICACHE_SUBNET_GROUP}" >/dev/null 2>&1; then
        
        echo -e "${YELLOW}🗑️  Deleting orphaned ElastiCache subnet group: ${ELASTICACHE_SUBNET_GROUP}${NC}"
        aws elasticache delete-cache-subnet-group \
            --region "${AWS_REGION}" \
            --cache-subnet-group-name "${ELASTICACHE_SUBNET_GROUP}" || true
    fi
    
    # Cleanup RDS subnet group
    RDS_SUBNET_GROUP="healthcare-rds-subnet-group-${ENVIRONMENT_SUFFIX}"
    if aws rds describe-db-subnet-groups \
        --region "${AWS_REGION}" \
        --db-subnet-group-name "${RDS_SUBNET_GROUP}" >/dev/null 2>&1; then
        
        echo -e "${YELLOW}🗑️  Deleting orphaned RDS subnet group: ${RDS_SUBNET_GROUP}${NC}"
        aws rds delete-db-subnet-group \
            --region "${AWS_REGION}" \
            --db-subnet-group-name "${RDS_SUBNET_GROUP}" || true
    fi
    
    echo -e "${GREEN}✅ Subnet group cleanup completed${NC}"
}

# Function to cleanup Pulumi state locks
cleanup_pulumi_locks() {
    echo -e "${YELLOW}🔍 Checking for Pulumi state locks...${NC}"
    
    # Cancel any stuck Pulumi operations
    STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
    
    echo -e "${YELLOW}🔓 Clearing any stuck Pulumi locks for stack: ${STACK_NAME}${NC}"
    pulumi cancel --stack "${STACK_NAME}" --yes 2>/dev/null || true
    
    echo -e "${GREEN}✅ Pulumi lock cleanup completed${NC}"
}

# Function to cleanup problematic Pulumi state resources
cleanup_pulumi_state() {
    echo -e "${YELLOW}🔍 Checking for problematic Pulumi state resources...${NC}"
    
    STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
    REDIS_URN="urn:pulumi:${STACK_NAME}::TapStack::aws:elasticache/replicationGroup:ReplicationGroup::healthcare-redis-${ENVIRONMENT_SUFFIX}"
    
    echo -e "${YELLOW}🗑️  Attempting to remove failed ElastiCache resource from Pulumi state...${NC}"
    
    # Check if stack exists and try to remove the problematic resource
    if pulumi stack ls --json 2>/dev/null | grep -q "\"name\":\"${STACK_NAME}\""; then
        echo -e "${YELLOW}📋 Stack ${STACK_NAME} found, attempting state cleanup...${NC}"
        
        # Try to remove the problematic ElastiCache resource from state
        pulumi state delete "${REDIS_URN}" --stack "${STACK_NAME}" --yes 2>/dev/null && \
            echo -e "${GREEN}✅ Removed problematic ElastiCache resource from Pulumi state${NC}" || \
            echo -e "${YELLOW}⚠️  Could not remove ElastiCache resource from state (may not exist)${NC}"
    else
        echo -e "${GREEN}✅ No existing stack found (clean state)${NC}"
    fi
}

# Main cleanup execution
main() {
    echo -e "${YELLOW}🚀 Starting comprehensive cleanup process...${NC}"
    
    # Check AWS configuration
    check_aws_config
    
    # Cleanup Pulumi locks first
    cleanup_pulumi_locks
    
    # Cleanup problematic Pulumi state
    cleanup_pulumi_state
    
    # Cleanup failed AWS resources
    cleanup_elasticache
    cleanup_rds
    cleanup_subnet_groups
    
    echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
    echo -e "${GREEN}✅ Ready for fresh deployment${NC}"
}

# Execute main function
main "$@"
