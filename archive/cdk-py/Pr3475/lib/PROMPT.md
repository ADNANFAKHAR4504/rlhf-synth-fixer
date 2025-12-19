# Quiz Platform Infrastructure Request

Hey, I need help building out a real-time quiz platform infrastructure using AWS CDK (Python). I've got a base stack file already set up, but I need you to update it with all the necessary resources for the quiz system.

## What I'm Trying to Build

I'm working on a live quiz platform where participants can join in real-time, answer questions as they come in, see their rankings update instantly, and get notified if they win. Think of it like a trivia game show but online.

## Current Code

Here's my existing stack file that needs to be updated (lib/tap_stack.py):

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
    #     self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
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

## What I Need

**IMPORTANT: Please update the existing tap_stack.py file above. Do NOT create new stack files or give me a completely different structure. Work within the existing file and follow the pattern that's already there.**

Here are the AWS services I need integrated:

1. **API Gateway WebSocket API** - For pushing questions to participants in real-time
2. **Lambda Functions (Python 3.10)** - To handle quiz logic, validate answers instantly, and calculate scores
3. **DynamoDB** - Store quiz questions, participant information, and their answers
4. **ElastiCache Redis** - Maintain live leaderboards using sorted sets so rankings update in real-time
5. **EventBridge** - Schedule when quizzes start automatically
6. **SNS** - Send notifications to winners when the quiz ends
7. **Cognito** - Handle participant authentication so only registered users can join
8. **S3** - Store media assets like images or videos that might be part of quiz questions
9. **CloudWatch** - Track metrics like participation rates and engagement
10. **IAM Roles** - Set up proper permissions so everything can talk to each other securely

## Important Requirements

- **Language**: Python for CDK code and Lambda functions should use Python 3.10 runtime
- **No Hardcoding**: Don't hardcode any account IDs, ARNs, or region names. Use parameters or derive them dynamically
- **Cross-Account Compatible**: This needs to work in any AWS account without modification
- **Resource Tags**: Tag all resources with `iac-rlhf-amazon`
- **Real-World Lambda Logic**: The Lambda functions should do something meaningful - validate quiz answers, calculate scores, update leaderboards. No "hello world" stuff please
- **Professional Setup**: Even though this is for testing, make it look production-ready

## How It Should Work

1. Participants authenticate through Cognito
2. They connect via WebSocket to receive questions in real-time
3. When they submit an answer, Lambda validates it immediately and updates their score in DynamoDB
4. The leaderboard in Redis gets updated with the new score using sorted sets
5. CloudWatch tracks how many people are participating
6. EventBridge can trigger quiz sessions at scheduled times
7. When the quiz ends, SNS notifies the winners
8. Any media content for questions is served from S3

Please update the existing tap_stack.py code to implement all of this using nested stacks like the commented example shows. Keep the same structure and naming conventions that are already there.