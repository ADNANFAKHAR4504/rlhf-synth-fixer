I'm working on a large-scale enterprise CloudFormation setup that needs enhanced security features across multiple AWS regions. I need your help implementing security configurations using Python with AWS CDK.

Here's what I need to accomplish:

**Security Requirements:**

1. **IAM Security**
   - Create IAM Roles with policies that follow the least privilege principle
   - Enforce Multi-Factor Authentication (MFA) for IAM users accessing the AWS Management Console
   - Regularly review IAM policies using AWS IAM Access Analyzer

2. **S3 Bucket Security**
   - Ensure all S3 buckets are created private by default
   - Implement server-side encryption using AWS KMS
   - Enable detailed access logging for all S3 buckets
   - Configure logging for all S3 bucket access actions

3. **Database Security**
   - Secure RDS databases by applying encryption at rest using KMS keys
   - Encrypt all RDS instances at rest using KMS

4. **Network Security**
   - Connect private subnets across regions using VPC peering
   - Restrict SSH access to EC2 instances to a specific IP range
   - Use VPC peering to connect all private subnets

5. **Monitoring & Compliance**
   - Enable CloudTrail across all regions for audit logging and monitoring API calls in every region
   - Set up AWS Config to track all configuration changes
   - Utilize AWS Artifact for compliance-related documentation

**Current Code:**

I already have a Python CDK stack file at `lib/tap_stack.py` with the following structure:

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create separate stacks for each resource type
    # Create the DynamoDB stack as a nested stack

    # ! DO not create resources directly in this stack.
    # ! Instead, instantiate separate stacks for each resource type.

    # class NestedDynamoDBStack(NestedStack):
    #   def __init__(self, scope, id, props=None, **kwargs):
    #     super().__init__(scope, id, **kwargs)
    #     # Use the original DynamoDBStack logic here
    #     self.ddb_stack = DynamoDBStack(self, "Resource", props=db_props)
    #     self.table = self.ddb_stack.table

    # db_props = DynamoDBStackProps(
    #     environment_suffix=environment_suffix
    # )

    # dynamodb_stack = NestedDynamoDBStack(
    #     self,
    #     f"DynamoDBStack{environment_suffix}",
    #     props=db_props
    # )

    # # Make the table available as a property of this stack
    # self.table = dynamodb_stack.table
```

**IMPORTANT REQUIREMENTS:**

1. **You MUST update the existing `lib/tap_stack.py` file** - Do NOT create new stack files or provide a completely new implementation
2. Work within the existing TapStack class structure
3. Follow the pattern shown in the commented example - create nested stacks for each resource type (IAM, S3, RDS, VPC, etc.)
4. The solution should include proper error handling and follow AWS CDK best practices
5. Include appropriate CloudFormation outputs for each resource created
6. Ensure all resources use the `environment_suffix` variable for naming consistency

**What I need from you:**

Please provide the complete updated `lib/tap_stack.py` code that implements all the security requirements listed above. The code should:

- Create nested stacks for IAM, S3, RDS, VPC, CloudTrail, and AWS Config resources
- Follow the existing code structure and patterns
- Include all necessary imports
- Implement all security features mentioned in the requirements
- Include unit tests to validate IAM policies, VPC configurations, and ensure security features are correctly applied

Remember: Update the existing code structure, don't create a completely new stack from scratch!
