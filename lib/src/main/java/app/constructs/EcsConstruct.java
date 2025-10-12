package app.constructs;

import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsCluster;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsClusterConfig;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsClusterSetting;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsService;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceConfig;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceDeploymentCircuitBreaker;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceNetworkConfiguration;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.EcsTaskDefinition;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.EcsTaskDefinitionConfig;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachmentConfig;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import software.constructs.Construct;

import java.util.List;

public class EcsConstruct extends BaseConstruct {

    private final EcsCluster cluster;

    private final EcsService service;

    public EcsConstruct(final Construct scope, final String id, final Vpc vpc, final KinesisStream kinesisStream) {
        super(scope, id);

        // ECS Cluster
        this.cluster = new EcsCluster(this, "ecs-cluster", EcsClusterConfig.builder()
                .name(getResourcePrefix() + "-cluster")
                .setting(List.of(EcsClusterSetting.builder()
                        .name("containerInsights")
                        .value("enabled")
                        .build()))
                .build());

        // Task execution role
        IamRole taskExecutionRole = new IamRole(this, "task-execution-role",
                IamRoleConfig.builder()
                        .name(getResourcePrefix() + "-ecs-task-execution-role")
                        .assumeRolePolicy("""
                                {
                                    "Version": "2012-10-17",
                                    "Statement": [{
                                        "Action": "sts:AssumeRole",
                                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                                        "Effect": "Allow"
                                    }]
                                }
                                """)
                        .build());

        new IamRolePolicyAttachment(this, "task-execution-policy",
                IamRolePolicyAttachmentConfig.builder()
                        .role(taskExecutionRole.getName())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy")
                        .build());

        // Task role
        IamRole taskRole = new IamRole(this, "task-role", IamRoleConfig.builder()
                .name(getResourcePrefix() + "-ecs-task-role")
                .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Action": "sts:AssumeRole",
                                "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                                "Effect": "Allow"
                            }]
                        }
                        """)
                .build());

        // Kinesis access policy for task
        new IamRolePolicy(this, "task-kinesis-policy", IamRolePolicyConfig.builder()
                .name("kinesis-access")
                .role(taskRole.getId())
                .policy(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Action": [
                                    "kinesis:DescribeStream",
                                    "kinesis:GetShardIterator",
                                    "kinesis:GetRecords",
                                    "kinesis:ListShards",
                                    "kinesis:PutRecord",
                                    "kinesis:PutRecords"
                                ],
                                "Resource": "%s"
                            }]
                        }
                        """, kinesisStream.getArn()))
                .build());

        // CloudWatch log group for ECS
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, "ecs-logs",
                CloudwatchLogGroupConfig.builder()
                        .name("/ecs/" + getResourcePrefix() + "-log-processor")
                        .retentionInDays(7)
                        .build());

        // Task definition
        EcsTaskDefinition taskDefinition = new EcsTaskDefinition(this, "task-def",
                EcsTaskDefinitionConfig.builder()
                        .family(getResourcePrefix() + "-log-processor")
                        .requiresCompatibilities(List.of("FARGATE"))
                        .networkMode("awsvpc")
                        .cpu("1024")
                        .memory("2048")
                        .executionRoleArn(taskExecutionRole.getArn())
                        .taskRoleArn(taskRole.getArn())
                        .containerDefinitions(String.format("""
                                        [
                                            {
                                                "name": "log-processor",
                                                "image": "%s",
                                                "essential": true,
                                                "environment": [
                                                    {"name": "KINESIS_STREAM", "value": "%s"},
                                                    {"name": "ENVIRONMENT", "value": "%s"}
                                                ],
                                                "logConfiguration": {
                                                    "logDriver": "awslogs",
                                                    "options": {
                                                        "awslogs-group": "%s",
                                                        "awslogs-region": "us-east-1",
                                                        "awslogs-stream-prefix": "ecs"
                                                    }
                                                },
                                                "healthCheck": {
                                                    "command": ["CMD-SHELL", "echo healthy"],
                                                    "interval": 30,
                                                    "timeout": 5,
                                                    "retries": 3,
                                                    "startPeriod": 60
                                                }
                                            }
                                        ]
                                        """,
                                getContainerImage(),
                                kinesisStream.getName(),
                                getEnvironment(),
                                logGroup.getName()))
                        .build());

        // ECS Service
        NetworkingConstruct networking = (NetworkingConstruct) scope.getNode().tryFindChild("networking");

        assert networking != null;
        this.service = new EcsService(this, "ecs-service", EcsServiceConfig.builder()
                .name(getResourcePrefix() + "-log-processor-service")
                .cluster(cluster.getId())
                .taskDefinition(taskDefinition.getArn())
                .desiredCount(2) // Multi-AZ deployment
                .launchType("FARGATE")
                .platformVersion("LATEST")
                .networkConfiguration(EcsServiceNetworkConfiguration.builder()
                        .subnets(networking.getPrivateSubnets().stream()
                                .map(Subnet::getId)
                                .toList())
                        .securityGroups(List.of(networking.getEcsSecurityGroup().getId()))
                        .assignPublicIp(false)
                        .build())
                .deploymentMaximumPercent(200)
                .deploymentMinimumHealthyPercent(100)
                .deploymentCircuitBreaker(EcsServiceDeploymentCircuitBreaker.builder()
                        .enable(true)
                        .rollback(true)
                        .build())
                .enableEcsManagedTags(true)
                .propagateTags("TASK_DEFINITION")
                .build());
    }

    public EcsCluster getCluster() {
        return cluster;
    }

    public EcsService getService() {
        return service;
    }
}
