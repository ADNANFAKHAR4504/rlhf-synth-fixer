#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

environments = ['dev', 'prod']
regions = ['us-east-1', 'us-west-2']

for env in environments:
    for region in regions:
        region_code = 'use1' if region == 'us-east-1' else 'usw2'
        stack_name = f'tap-{env}-{region_code}'
        
        TapStack(
            app,
            stack_name,
            env=cdk.Environment(region=region),
            env_name=env,
            region_code=region_code
        )

app.synth()
