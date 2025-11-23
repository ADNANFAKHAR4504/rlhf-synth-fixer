#!/usr/bin/env python
from cdktf import App
from stacks.ecs_fargate_stack import EcsFargateStack

app = App()
EcsFargateStack(app, "ecs-fargate-batch-processing")
app.synth()
