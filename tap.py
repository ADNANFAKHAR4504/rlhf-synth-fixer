import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack  # import the actual stack class, not *Props

app = cdk.App()

environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Instantiate the stack with required parameters: scope, id, environment_suffix, and env
stack = TapStack(
    app,
    STACK_NAME,
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION') or 'us-west-2'
    )
)

app.synth()
