# TAP Stack Integration Tests

## What This Is

This is a comprehensive integration test suite for a multi-region AWS infrastructure deployed using CDK. It validates that everything actually works after deployment - not just that CloudFormation says it deployed successfully.

The tests check real AWS resources across us-east-1 and us-east-2: VPCs, ECS clusters, RDS databases, load balancers, and all the networking between them.

## Why These Tests Exist

When you deploy infrastructure with CDK, CloudFormation tells you the stack is complete. But that doesn't mean:
- Your ECS services are actually running
- Your load balancer can route traffic
- Your RDS database is accessible
- Your resources in different regions are configured correctly

These tests actually hit the AWS APIs and verify everything works end-to-end.

## The Problem I Solved

This wasn't straightforward. Here's what made it complicated:

### CDK's Nested Stack Structure is Weird

When CDK deploys, it creates stacks like this:

```
TapStackpr4348                           (Main stack)
├── TapStackpr4348-TapStackvpcuseast1... (Wrapper stack - mostly empty)
└── TapStackpr4348TapStackvpc...VpcStack (The actual VPC resources)
```

The "wrapper" stacks only contain CDK metadata. The real resources live in sibling stacks with similar names. Traditional recursive nested stack discovery doesn't work because the resources aren't actually nested - they're siblings.

### Multi-Region Made It Worse

We deploy to both us-east-1 and us-east-2. You can't just query CloudFormation once - you need to:
1. Query us-east-1 for all stacks
2. Query us-east-2 for all stacks
3. Filter both lists for stacks belonging to your deployment
4. Remember which region each stack came from

### ECS Cluster Names Don't Have Hyphens

When you query ECS, you get cluster names like:
```
TapStackpr4348TapStackecsuseast1pr4348EcsStack...
```

Notice it's "useast1" not "us-east-1". You can't just check `if 'us-east-1' in cluster_name` because it fails. We had to extract the region from the stack name that created the resource.

## How We Solved It

Instead of trying to traverse nested stacks recursively, we:

1. **List ALL stacks in both regions** that start with our base stack name
2. **Track which region each stack is in** as we discover it
3. **Query each stack for resources** and remember the region
4. **Return resources with their region info** so tests can use the right AWS client

The key insight was treating this as a name-filtering problem instead of a hierarchy-traversal problem.

## Prerequisites

- AWS Account with permissions to:
  - Create/read CloudFormation stacks
  - Create/read EC2, ECS, RDS, ELB resources
  - List resources across multiple regions
- Python 3.12+
- AWS CDK infrastructure already deployed
- AWS credentials configured

## Installation

1. Clone the repository:
```bash
git clone <your-repo>
cd <your-repo>
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

The main dependencies are:
- `pytest` - Test framework
- `boto3` - AWS SDK
- `requests` - For HTTP health checks

## Configuration

The tests use environment variables for configuration:

### Required Environment Variables

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"  # Primary region
export CDK_DEFAULT_ACCOUNT="123456789012"  # Your AWS account ID
export ENVIRONMENT_SUFFIX="pr4348"  # Stack suffix (e.g., "dev", "staging", "pr1234")
```

### Stack Naming Convention

The tests look for stacks named: `TapStack{ENVIRONMENT_SUFFIX}`

For example:
- `ENVIRONMENT_SUFFIX=dev` → looks for `TapStackdev`
- `ENVIRONMENT_SUFFIX=pr4348` → looks for `TapStackpr4348`

## Running the Tests

### Run All Tests

```bash
pytest tests/integration/test_tap_stack.py -v
```

### Run Specific Tests

```bash
# Test only VPC resources
pytest tests/integration/test_tap_stack.py::test_vpcs_created_in_both_regions -v

# Test only ECS resources
pytest tests/integration/test_tap_stack.py::test_ecs_clusters_exist_in_both_regions -v

# Test end-to-end connectivity
pytest tests/integration/test_tap_stack.py::test_end_to_end_alb_to_ecs -v
```

### Run with More Detail

```bash
# Show print statements during test runs
pytest tests/integration/test_tap_stack.py -v -s

# Show full tracebacks on failures
pytest tests/integration/test_tap_stack.py -v --tb=long
```

### CI/CD Integration

If you have the integration test script:
```bash
./scripts/integration-tests.sh
```

This script:
1. Detects the project type (CDK + Python)
2. Sets up the environment
3. Runs the test suite
4. Reports results

## What Gets Tested

### Infrastructure Tests

**VPC & Networking**
- VPCs exist in both regions
- Each VPC has at least 4 subnets (2 public, 2 private)
- Internet Gateways are attached
- Resources are properly tagged

**ECS (Elastic Container Service)**
- Clusters exist in both regions
- Services are running with desired task count
- Tasks are in healthy states (RUNNING, PENDING, etc.)
- Services use CODE_DEPLOY controller for blue/green deployments

**Load Balancers**
- Application Load Balancers are active
- HTTP listeners configured on port 80
- Target groups exist (blue and green)
- Targets are registered and healthy
- Load balancers actually respond to HTTP requests

**RDS (Databases)**
- Database instances exist
- Instances are in available state
- Databases are NOT publicly accessible (security check)
- Security groups are configured

**CodeDeploy**
- ECS applications exist
- Deployment groups configured for blue/green
- Auto-rollback is enabled

**Monitoring**
- CloudWatch alarms are created
- CloudWatch log groups exist

### End-to-End Tests

**Full Stack Connectivity**
- HTTP request flows through ALB to ECS container
- ECS and RDS are in the same VPC (can communicate)
- Multi-region deployment is verified

## Understanding Test Results

### Successful Run

```bash
...
tests/integration/test_tap_stack.py::test_vpcs_created_in_both_regions PASSED
tests/integration/test_tap_stack.py::test_ecs_clusters_exist_in_both_regions PASSED
...
29 passed in 38.45s 
```

### Failed Test

```bash
FAILED tests/integration/test_tap_stack.py::test_vpcs_created_in_both_regions
AssertionError: Expected at least 2 VPCs (one per region), found 1
```

This tells you exactly what's wrong - in this case, only one VPC was found when we expected two.

### Debug Output

The tests include debug output to help troubleshooting:

```bash
DEBUG: Found related stack: TapStackpr4348TapStackvpcuseast1pr4348VpcStackE1559FFC
DEBUG: Checking 17 related stacks for AWS::EC2::VPC
DEBUG: Found AWS::EC2::VPC: vpc-06ff907b3a7b66c44 in us-east-1
VPC exists in us-east-1: vpc-06ff907b3a7b66c44
VPC exists in us-east-2: vpc-0a12b34c56d78e90f
```

## Common Issues

### "Stack does not exist"

```
Stack TapStackpr4348 does not exist. Please deploy it first using: cdk deploy TapStackpr4348
```

**Fix**: Deploy your CDK stack first:
```bash
cdk deploy TapStackpr4348
```

### "AWS credentials not found"

**Fix**: Set your AWS credentials:
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

Or use AWS CLI configuration:
```bash
aws configure
```

### "ClusterNotFoundException"

This usually means the cluster name doesn't match between regions, or the wrong region client is being used.

**Fix**: Check the debug output to see which cluster name is being used and verify it exists:
```bash
aws ecs describe-clusters --clusters <cluster-name> --region us-east-1
```

### Tests Pass But Infrastructure Has Issues

The tests only verify what they're designed to check. If you're having application-level issues (like your app returning 500 errors), you'll need to check:
- ECS task logs in CloudWatch
- Application logs
- Database connectivity from within your container

## Test Architecture (Technical Details)

For those interested in how this actually works under the hood:

### Resource Discovery Flow

1. **`get_all_related_stacks(cfn_clients, base_stack_name)`**
   - Queries CloudFormation in BOTH regions
   - Filters stacks starting with `base_stack_name`
   - Returns: `[{name: "StackName", region: "us-east-1"}, ...]`

2. **`get_stack_resources_by_type(cfn_clients, stack_name, resource_type)`**
   - Loops through all related stacks from step 1
   - Uses the appropriate regional CFN client
   - Queries each stack for resources of the specified type
   - Returns: `[{id: "vpc-123", region: "us-east-1", stack: "VpcStack"}, ...]`

3. **Test functions use the region info**
   - Pick the right AWS client for the resource's region
   - Verify the resource exists and is healthy
   - Report results with region context

### Why This Approach Works

**Stack Name Filtering Instead of Recursion**: CDK creates sibling stacks, not truly nested ones. By filtering all stacks by name prefix, we find everything regardless of nesting structure.

**Region Tracking**: By querying both regions upfront and tracking which region each stack is in, we avoid the "which region should I use?" problem entirely.

**Resource Metadata**: Returning `{id, region, stack}` for each resource gives tests everything they need without making additional AWS API calls.

## Extending the Tests

Want to add more tests? Here's the pattern:

```python
def test_your_new_check(aws_clients, deployed_stack, stack_name):
    """Describe what you're testing."""
    # Get resources with region info
    resource_info = get_stack_resources_by_type(
        aws_clients, 
        stack_name, 
        'AWS::Service::ResourceType'
    )
    
    # Assert something about the resources
    assert len(resource_info) > 0, "No resources found"
    
    # Check each resource
    for resource in resource_info:
        client = aws_clients['service'] if resource['region'] == 'us-east-1' \
                 else aws_clients['service_us_east_2']
        
        # Make assertions
        # ...
        
        print(f"Resource {resource['id']} in {resource['region']} is healthy")
```


## Contributing

When adding tests:
1. Use the existing resource discovery functions
2. Always include region-aware client selection
3. Add descriptive print statements for debugging
4. Test against a real deployed stack before committing


## Questions?

If something doesn't work or the documentation is unclear, open an issue. These tests are complex because the infrastructure is complex, don't hesitate to ask for help.