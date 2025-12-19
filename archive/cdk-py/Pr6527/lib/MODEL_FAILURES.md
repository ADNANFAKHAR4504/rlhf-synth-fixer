# MODEL FAILURES - Infrastructure Changes Required

This document explains the infrastructure code changes that were necessary to fix runtime errors encountered when executing the optimization script from lib/MODEL_RESPONSE.md against deployed AWS resources. The corrected code is shown in lib/IDEAL_RESPONSE.md.

## Context

The MODEL_RESPONSE.md provided a working CDK infrastructure deployment and optimization script based on the requirements in PROMPT.md. However, when the optimization script was executed against real AWS resources, multiple runtime errors occurred due to incorrect AWS API usage patterns and missing error handling for edge cases.

The IDEAL_RESPONSE.md contains the corrected, production-ready code that successfully handles all AWS API requirements and edge cases.

## Infrastructure Changes Required

### Change 1: DynamoDB BillingModeSummary Safe Access

**Location**: lib/optimize.py, Line 968 (IDEAL_RESPONSE) vs original MODEL_RESPONSE

**Original Code in MODEL_RESPONSE**:
```python
billing_mode = table['BillingModeSummary']['BillingMode']
```

**Error Encountered**:
```
KeyError: 'BillingModeSummary'
```

**Root Cause**: When a DynamoDB table is created with PROVISIONED billing mode (the default), AWS does not include the `BillingModeSummary` key in the describe_table response. The key only appears when explicitly set or when using PAY_PER_REQUEST mode.

**Fixed Code in IDEAL_RESPONSE (Line 968)**:
```python
# Get billing mode (default to PROVISIONED if BillingModeSummary doesn't exist)
billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')
```

**Why This Fixes It**: Using nested .get() calls with default values ensures the code doesn't fail when the key is absent, defaulting to 'PROVISIONED' which is the correct assumption for tables without BillingModeSummary.

### Change 2: Aurora ServerlessV2 Scaling Configuration

**Location**: lib/optimize.py, Lines 1634-1643 (IDEAL_RESPONSE) vs original MODEL_RESPONSE

**Original Code in MODEL_RESPONSE**:
```python
self.rds_client.modify_current_db_cluster_capacity(
    DBClusterIdentifier=cluster_id,
    Capacity=config['min_capacity']
)
```

**Error Encountered**:
```
InvalidParameterValue: Only Aurora Serverless clusters can have their capacity modified
```

**Root Cause**: The `modify_current_db_cluster_capacity` API is for Aurora Serverless v1, not v2. Aurora Serverless v2 uses a different API with different parameters.

**Fixed Code in IDEAL_RESPONSE (Lines 1634-1643)**:
```python
# Update ServerlessV2 scaling configuration
self.rds_client.modify_db_cluster(
    DBClusterIdentifier=cluster_id,
    ServerlessV2ScalingConfiguration={
        'MinCapacity': config['min_capacity'],
        'MaxCapacity': config.get('max_capacity', 4)
    },
    BackupRetentionPeriod=config['backup_retention'],
    ApplyImmediately=True
)
```

**Why This Fixes It**: Aurora Serverless v2 requires using modify_db_cluster with the ServerlessV2ScalingConfiguration parameter object containing both MinCapacity and MaxCapacity, not the v1 API.

### Change 3: ElastiCache Node Group ID Retrieval

**Location**: lib/optimize.py, Lines 1671-1686 (IDEAL_RESPONSE) vs original MODEL_RESPONSE

**Original Code in MODEL_RESPONSE**:
```python
self.elasticache_client.modify_replication_group_shard_configuration(
    ReplicationGroupId=replication_group_id,
    NodeGroupCount=new_node_groups,
    NodeGroupsToRetain=[str(i).zfill(4) for i in range(new_node_groups)],
    ApplyImmediately=True
)
```

**Error Encountered**:
```
InvalidParameterValue: The following node group ids are invalid: [0000]
```

**Root Cause**: ElastiCache node group IDs are AWS-generated strings that don't follow a predictable format like "0000", "0001", etc. They must be retrieved from AWS rather than constructed programmatically.

**Fixed Code in IDEAL_RESPONSE (Lines 1671-1686)**:
```python
if new_node_groups < current_node_groups:
    # Scaling in - need to get actual node group IDs from AWS
    response = self.elasticache_client.describe_replication_groups(
        ReplicationGroupId=replication_group_id
    )
    node_groups = response['ReplicationGroups'][0]['NodeGroups']

    # Get the IDs of node groups to retain (keep the first N)
    node_groups_to_retain = [ng['NodeGroupId'] for ng in node_groups[:new_node_groups]]

    self.elasticache_client.modify_replication_group_shard_configuration(
        ReplicationGroupId=replication_group_id,
        NodeGroupCount=new_node_groups,
        NodeGroupsToRetain=node_groups_to_retain,
        ApplyImmediately=True
    )
```

**Why This Fixes It**: By querying the current replication group configuration with describe_replication_groups, we obtain the actual AWS-assigned node group IDs and use those for the modification request instead of hardcoded values.

### Change 4: Lambda Concurrency Configuration

**Location**: lib/optimize.py, Lines 1735-1776 (IDEAL_RESPONSE) vs original MODEL_RESPONSE

**Original Code in MODEL_RESPONSE**:
```python
self.lambda_client.update_function_configuration(
    FunctionName=function_name,
    MemorySize=config['memory_size'],
    Timeout=config['timeout'],
    ReservedConcurrentExecutions=config['reserved_concurrent']
)
```

**Error Encountered (First)**:
```
Unknown parameter in input: "ReservedConcurrentExecutions", must be one of: FunctionName, Runtime, Role, Handler, ...
```

**Error Encountered (Second, after initial fix)**:
```
InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [10]
```

**Root Cause**:
1. The update_function_configuration API does not accept ReservedConcurrentExecutions as a parameter
2. AWS requires that at least 10 concurrent executions remain unreserved across the entire account to prevent complete lockout

**Fixed Code in IDEAL_RESPONSE (Lines 1735-1776)**:
```python
# Update function configuration (memory and timeout)
self.lambda_client.update_function_configuration(
    FunctionName=function_name,
    MemorySize=config['memory_size'],
    Timeout=config['timeout']
)

# Set reserved concurrent executions separately
# Note: AWS requires at least 10 unreserved concurrent executions
reserved_concurrent = config.get('reserved_concurrent', 0)

if reserved_concurrent > 0:
    try:
        # Get account concurrency limit
        account_settings = self.lambda_client.get_account_settings()
        account_limit = account_settings['AccountLimit']['ConcurrentExecutions']

        # Only set if it won't violate the minimum unreserved limit
        if (account_limit - reserved_concurrent) >= 10:
            self.lambda_client.put_function_concurrency(
                FunctionName=function_name,
                ReservedConcurrentExecutions=reserved_concurrent
            )
        else:
            logger.warning(
                "Skipping concurrency limit for %s: would violate minimum unreserved limit",
                function_name
            )
    except Exception as e:
        logger.warning(
            "Could not set concurrency for %s: %s", function_name, str(e)
        )
else:
    # Delete concurrency limit if set to 0
    try:
        self.lambda_client.delete_function_concurrency(
            FunctionName=function_name
        )
    except Exception:
        pass  # Ignore if no concurrency limit exists
```

**Why This Fixes It**:
1. Separates the API calls - update_function_configuration for memory/timeout, put_function_concurrency for concurrency limits
2. Checks account limits using get_account_settings before applying to ensure at least 10 unreserved executions remain
3. Gracefully handles the constraint violation with a warning instead of failing
4. Properly handles removing concurrency limits when set to 0

### Change 5: S3 Lifecycle Configuration Filter

**Location**: lib/optimize.py, Lines 1782-1804 (IDEAL_RESPONSE) vs original MODEL_RESPONSE

**Original Code in MODEL_RESPONSE**:
```python
lifecycle_config = {
    'Rules': [
        {
            'ID': 'transition-to-ia',
            'Status': 'Enabled',
            'Transitions': [
                {
                    'Days': config['transition_days'],
                    'StorageClass': 'STANDARD_IA'
                }
            ]
        }
    ]
}
```

**Error Encountered**:
```
MalformedXML: The XML you provided was not well-formed or did not validate against our published schema
```

**Root Cause**: S3 lifecycle rules require a Filter element to be valid according to the S3 XML schema. Even if you want to apply the rule to all objects, an empty filter must be present.

**Fixed Code in IDEAL_RESPONSE (Lines 1782-1804)**:
```python
# Update lifecycle configuration with proper filter
lifecycle_config = {
    'Rules': [
        {
            'ID': 'transition-to-ia',
            'Status': 'Enabled',
            'Filter': {
                'Prefix': ''  # Apply to all objects
            },
            'Transitions': [
                {
                    'Days': config['transition_days'],
                    'StorageClass': 'STANDARD_IA'
                }
            ]
        }
    ]
}
```

**Why This Fixes It**: Adding the Filter element with an empty prefix makes the lifecycle rule valid according to S3's XML schema while still applying to all objects in the bucket.

### Change 6: Lambda Reserved Concurrency in CDK Stack

**Location**: lib/tap_stack.py, Lines 425 (IDEAL_RESPONSE removed this) vs original MODEL_RESPONSE

**Original Code in MODEL_RESPONSE**:
```python
func = lambda_.Function(
    # ... other parameters ...
    memory_size=3008,
    timeout=Duration.seconds(900),
    reserved_concurrent_executions=100,  # This line
    # ... other parameters ...
)
```

**Issue**: While this doesn't cause a deployment error, setting reserved_concurrent_executions=100 for 3 Lambda functions (300 total) in the CDK deployment would violate the account limit when the optimization script tries to set reserved concurrency to 20.

**Fixed Code in IDEAL_RESPONSE (Line 425 - removed)**:
```python
func = lambda_.Function(
    # ... other parameters ...
    memory_size=3008,
    timeout=Duration.seconds(900),
    # reserved_concurrent_executions removed
    # ... other parameters ...
)
```

**Why This Fixes It**: By not setting reserved concurrent executions in the CDK stack, the Lambda functions start with no reserved concurrency, allowing the optimization script to set it to 20 without violating the account limit.

## Summary of Infrastructure Changes

Six changes were made across lib/tap_stack.py and lib/optimize.py to handle AWS API requirements correctly:

1. **DynamoDB** (optimize.py:968): Safe dictionary access for optional BillingModeSummary field
2. **Aurora** (optimize.py:1634-1643): Correct API for ServerlessV2 scaling using modify_db_cluster
3. **ElastiCache** (optimize.py:1671-1686): Dynamic retrieval of AWS-generated node group IDs
4. **Lambda Optimization** (optimize.py:1735-1776): Separate API calls for different configuration parameters with account limit validation
5. **S3 Lifecycle** (optimize.py:1782-1804): Required Filter element in lifecycle configuration
6. **Lambda CDK** (tap_stack.py:425): Removed reserved_concurrent_executions from initial deployment to avoid account limit issues

All changes in optimize.py were to handle AWS API edge cases and requirements. The change in tap_stack.py was to prevent account limit violations when the optimization script runs.

These changes transform the theoretical MODEL_RESPONSE implementation into the production-ready IDEAL_RESPONSE code that correctly handles AWS service constraints, API requirements, and account-level limits.
