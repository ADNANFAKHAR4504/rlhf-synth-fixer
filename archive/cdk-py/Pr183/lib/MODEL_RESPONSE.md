#!/usr/bin/env python3 import os

from aws_cdk import core

from cdk_cicd_pipeline.pipeline_stack import PipelineStack from cdk_cicd_pipeline.infra_stack import InfraStack

app = core.App()

Define the infrastructure stacks for each region

infra_us_east_1 = InfraStack(app, "InfraStackUsEast1", env={'region': 'us-east-1'}) infra_us_east_2 = InfraStack(app, "InfraStackUsEast2", env={'region': 'us-east-2'})

Define the CI/CD pipeline stack

pipeline_stack = PipelineStack(app, "PipelineStack", infra_us_east_1, infra_us_east_2)

app.synth()

#app.py #!/usr/bin/env python3 import os

from aws_cdk import core

from cdk_cicd_pipeline.pipeline_stack import PipelineStack from cdk_cicd_pipeline.infra_stack import InfraStack

app = core.App()

Define the infrastructure stacks for each region

infra_us_east_1 = InfraStack(app, "InfraStackUsEast1", env={'region': 'us-east-1'}) infra_us_east_2 = InfraStack(app, "InfraStackUsEast2", env={'region': 'us-east-2'})

Define the CI/CD pipeline stack

pipeline_stack = PipelineStack(app, "PipelineStack", infra_us_east_1, infra_us_east_2)

app.synth()

#infra_stack.py

from aws_cdk import ( aws_ec2 as ec2, aws_ecs as ecs, aws_ecr as ecr, aws_elasticloadbalancingv2 as elbv2, aws_rds as rds, aws_secretsmanager as secretsmanager, aws_iam as iam, core )

class InfraStack(core.Stack): def init(self, scope: core.Construct, id: str, **kwargs) -> None: super().init(scope, id, **kwargs)

1    # VPC
2    vpc = ec2.Vpc(self, "VPC", max_azs=2)
3
4    # ECS Cluster
5    cluster = ecs.Cluster(self, "ECSCluster", vpc=vpc)
6
7    # ECR Repository
8    ecr_repo = ecr.Repository(self, "ECRRepo")
9
10    # RDS
11    rds_instance = rds.DatabaseInstance(self, "RDSInstance",
12        engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_12_3),
13        credentials=rds.Credentials.from_generated_secret("admin"),
14        vpc=vpc,
15        multi_az=True,
16        instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
17        allocated_storage=20
18    )
19
20    # Secrets Manager
21    secret = secretsmanager.Secret(self, "Secret",
22        secret_name="db-credentials",
23        generate_secret_string=secretsmanager.SecretStringGenerator(
24            secret_string_template='{"username": "admin"}',
25            generate_string_key="password"
26        )
27    )
28
29    # IAM Role for ECS
30    task_role = iam.Role(self, "TaskRole",
31        assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
32    )
33
34    secret.grant_read(task_role)
35
36    # ECS Fargate Service
37    task_definition = ecs.FargateTaskDefinition(self, "TaskDef",
38        memory_limit_mib=512,
39        cpu=256,
40        task_role=task_role
41    )
42
43    container = task_definition.add_container("web",
44        image=ecs.ContainerImage.from_ecr_repository(ecr_repo),
45        environment={
46            "DB_HOST": rds_instance.db_instance_endpoint_address,
47            "DB_SECRET_ARN": secret.secret_arn
48        },
49        logging=ecs.LogDriver.aws_logs(stream_prefix="ecs")
50    )
51
52    port_mapping = ecs.PortMapping(container_port=80, host_port=80)
53    container.add_port_mappings(port_mapping)
54
55    service = ecs.FargateService(self, "Service",
56        cluster=cluster,
57        task_definition=task_definition,
58        desired_count=2,
59        assign_public_ip=True
60    )
61
62    # Load Balancer
63    lb = elbv2.ApplicationLoadBalancer(self, "LB", vpc=vpc, internet_facing=True)
64    listener = lb.add_listener("Listener", port=80)
65    listener.add_targets("ECS", port=80, targets=[service])
66    listener.connections.allow_default_port_from_any_ipv4("Open to the world")
67
68    # Outputs
69    core.CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name)

Unspecified




#pipeline_stack.py

from aws_cdk import ( aws_codepipeline as codepipeline, aws_codepipeline_actions as cpactions, aws_codebuild as codebuild, core )

class PipelineStack(core.Stack): def init(self, scope: core.Construct, id: str, infra_us_east_1, infra_us_east_2, **kwargs) -> None: super().init(scope, id, **kwargs)

1    source_output = codepipeline.Artifact()
2    build_output = codepipeline.Artifact()
3
4    pipeline = codepipeline.Pipeline(self, "Pipeline")
5
6    # Source stage
7    source_action = cpactions.GitHubSourceAction(
8        action_name="GitHub",
9        output=source_output,
10        oauth_token=core.SecretValue.secrets_manager("github-token"),
11        owner="OWNER",
12        repo="REPO",
13        branch="main"
14    )
15
16    pipeline.add_stage(
17        stage_name="Source",
18        actions=[source_action]
19    )
20
21    # Build stage
22    project = codebuild.PipelineProject(self, "Build",
23        environment=codebuild.BuildEnvironment(
24            build_image=codebuild.LinuxBuildImage.STANDARD_5_0
25        ),
26        build_spec=codebuild.BuildSpec.from_object({
27            "version": "0.2",
28            "phases": {
29                "install": {
30                    "commands": [
31                        "npm install -g aws-cdk"
32                    ]
33                },
34                "build": {
35                    "commands": [
36                        "cdk synth"
37                    ]
38                }
39            },
40            "artifacts": {
41                "files": [
42                    "**/*"
43                ]
44            }
45        })
46    )
47
48    build_action = cpactions.CodeBuildAction(
49        action_name="CodeBuild",
50        project=project,
51        input=source_output,
52        outputs=[build_output]
53    )
54
55    pipeline.add_stage(
56        stage_name="Build",
57        actions=[build_action]
58    )
59
60    # Deploy stage
61    deploy_us_east_1 = cpactions.CloudFormationCreateUpdateStackAction(
62        action_name="DeployUsEast1",
63        stack_name="InfraStackUsEast1",
64        template_path=build_output.at_path("InfraStackUsEast1.template.json"),
65        admin_permissions=True,
66        region="us-east-1"
67    )
68
69    deploy_us_east_2 = cpactions.CloudFormationCreateUpdateStackAction(
70        action_name="DeployUsEast2",
71        stack_name="InfraStackUsEast2",
72        template_path=build_output.at_path("InfraStackUsEast2.template.json"),
73        admin_permissions=True,
74        region="us-east-2"
75    )
76
77    pipeline.add_stage(
78        stage_name="Deploy",
79        actions=[deploy_us_east_1, deploy_us_east_2]
80    )

Unspecified




#.github/workflows/cicd.yml

name: CI/CD Pipeline

on: push: branches: - main

jobs: build: runs-on: ubuntu-latest

1steps:
2- name: Checkout
3  uses: actions/checkout@v2
4
5- name: Set up Python
6  uses: actions/setup-python@v2
7  with:
8    python-version: 3.8
9
10- name: Install dependencies
11  run: |
12    python -m pip install --upgrade pip
13    pip install -r requirements.txt
14
15- name: Run tests
16  run: pytest
17
18- name: CDK Synth
19  run: cdk synth
20
21- name: Configure AWS credentials
22  uses: aws-actions/configure-aws-credentials@v1
23  with:
24    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
25    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
26    aws-region: us-east-1
27
28- name: Deploy
29  run: cdk deploy --require-approval never