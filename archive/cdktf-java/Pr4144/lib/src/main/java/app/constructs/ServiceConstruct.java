package app.constructs;

import app.config.AppConfig;
import app.config.ServiceConfig;
import com.hashicorp.cdktf.providers.aws.appautoscaling_policy.AppautoscalingPolicy;
import com.hashicorp.cdktf.providers.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration;
import com.hashicorp.cdktf.providers.aws.appautoscaling_policy.AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification;
import com.hashicorp.cdktf.providers.aws.appautoscaling_target.AppautoscalingTarget;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsService;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceDeploymentController;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceLoadBalancer;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceNetworkConfiguration;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceServiceRegistries;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.EcsTaskDefinition;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupEgress;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupIngress;
import software.constructs.Construct;

import java.util.List;

public class ServiceConstruct extends BaseConstruct {

    private final EcsService service;

    private final EcsTaskDefinition taskDefinition;

    private final SecurityGroup securityGroup;

    public ServiceConstruct(final Construct scope, final String id, final ServiceConfig serviceConfig) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        ServiceConfig.DeploymentConfig deploymentConfig = serviceConfig.deploymentConfig();

        // Create CloudWatch Log Group
        CloudwatchLogGroup logGroup = CloudwatchLogGroup.Builder.create(this, "log-group")
                .name(String.format("/ecs/%s/%s", appConfig.appName(), serviceConfig.serviceName()))
                .retentionInDays(deploymentConfig.logRetentionDays())
                .tags(appConfig.tags())
                .build();

        // Create IAM roles
        IamRole taskExecutionRole = createTaskExecutionRole(appConfig, serviceConfig);
        IamRole taskRole = createTaskRole(appConfig, serviceConfig);

        // Create Security Group
        this.securityGroup = SecurityGroup.Builder.create(this, "sg")
                .vpcId(deploymentConfig.vpcId())
                .name(String.format("%s-%s-sg", appConfig.appName(), serviceConfig.serviceName()))
                .description(String.format("Security group for %s service", serviceConfig.serviceName()))
                .ingress(List.of(SecurityGroupIngress.builder()
                        .fromPort(serviceConfig.containerPort())
                        .toPort(serviceConfig.containerPort())
                        .protocol("tcp")
                        .cidrBlocks(List.of("10.0.0.0/16"))
                        .description("Allow traffic from VPC")
                        .build()))
                .egress(List.of(SecurityGroupEgress.builder()
                        .fromPort(0)
                        .toPort(0)
                        .protocol("-1")
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("Allow all outbound traffic")
                        .build()))
                .tags(appConfig.tags())
                .build();

        // Create Task Definition
        String containerDefinitions = createContainerDefinitions(serviceConfig, logGroup.getName(), appConfig.region());

        this.taskDefinition = EcsTaskDefinition.Builder.create(this, "task-def")
                .family(String.format("%s-%s", appConfig.appName(), serviceConfig.serviceName()))
                .networkMode("awsvpc")
                .requiresCompatibilities(List.of("FARGATE"))
                .cpu(String.valueOf(serviceConfig.cpu()))
                .memory(String.valueOf(serviceConfig.memory()))
                .executionRoleArn(taskExecutionRole.getArn())
                .taskRoleArn(taskRole.getArn())
                .containerDefinitions(containerDefinitions)
                .tags(appConfig.tags())
                .build();

        // Create ECS Service
        this.service = EcsService.Builder.create(this, "service")
                .name(serviceConfig.serviceName())
                .cluster(deploymentConfig.clusterId())
                .taskDefinition(taskDefinition.getArn())
                .desiredCount(serviceConfig.desiredCount())
                .launchType("FARGATE")
                .deploymentController(EcsServiceDeploymentController.builder()
                        .type("ECS")
                        .build())
                .networkConfiguration(EcsServiceNetworkConfiguration.builder()
                        .subnets(deploymentConfig.subnetIds())
                        .securityGroups(List.of(securityGroup.getId()))
                        .assignPublicIp(false)
                        .build())
                .loadBalancer(List.of(EcsServiceLoadBalancer.builder()
                        .targetGroupArn(deploymentConfig.targetGroup().get(id).getArn())
                        .containerName(serviceConfig.serviceName())
                        .containerPort(serviceConfig.containerPort())
                        .build()))
                .serviceRegistries(EcsServiceServiceRegistries.builder()
                        .registryArn(deploymentConfig.serviceDiscovery().get(id).getArn())
                        .build())
                .healthCheckGracePeriodSeconds(serviceConfig.healthCheckGracePeriod())
                .deploymentMinimumHealthyPercent(100)
                .deploymentMaximumPercent(200)
                .enableExecuteCommand(true)
                .tags(appConfig.tags())
                .build();

        // Configure Auto Scaling
        configureAutoScaling(appConfig, serviceConfig);
    }

    private IamRole createTaskExecutionRole(final AppConfig appConfig, final ServiceConfig serviceConfig) {
        String assumeRolePolicy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Action": "sts:AssumeRole",
                      "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                      },
                      "Effect": "Allow"
                    }
                  ]
                }
                """;

        IamRole role = IamRole.Builder.create(this, "task-execution-role")
                .name(String.format("%s-%s-task-execution", appConfig.appName(), serviceConfig.serviceName()))
                .assumeRolePolicy(assumeRolePolicy)
                .tags(appConfig.tags())
                .build();

        IamRolePolicyAttachment.Builder.create(this, "task-execution-policy")
                .role(role.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy")
                .build();

        return role;
    }

    private IamRole createTaskRole(final AppConfig appConfig, final ServiceConfig serviceConfig) {
        String assumeRolePolicy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Action": "sts:AssumeRole",
                      "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                      },
                      "Effect": "Allow"
                    }
                  ]
                }
                """;

        return IamRole.Builder.create(this, "task-role")
                .name(String.format("%s-%s-task", appConfig.appName(), serviceConfig.serviceName()))
                .assumeRolePolicy(assumeRolePolicy)
                .tags(appConfig.tags())
                .build();
    }

    private String createContainerDefinitions(final ServiceConfig serviceConfig, final String logGroupName,
                                              final String region) {
        return String.format("""
                        [
                          {
                            "name": "%s",
                            "image": "%s",
                            "cpu": 0,
                            "portMappings": [
                              {
                                "containerPort": %d,
                                "protocol": "tcp"
                              }
                            ],
                            "essential": true,
                            "logConfiguration": {
                              "logDriver": "awslogs",
                              "options": {
                                "awslogs-group": "%s",
                                "awslogs-region": "%s",
                                "awslogs-stream-prefix": "ecs"
                              }
                            },
                            "healthCheck": {
                              "command": ["CMD-SHELL", "curl -f http://localhost:%d/ || exit 1"],
                              "interval": 30,
                              "timeout": 5,
                              "retries": 3,
                              "startPeriod": 60
                            }
                          }
                        ]
                        """, serviceConfig.serviceName(), serviceConfig.imageUri(), serviceConfig.containerPort(),
                logGroupName, region, serviceConfig.containerPort()
        );
    }

    private void configureAutoScaling(final AppConfig appConfig, final ServiceConfig serviceConfig) {
        String resourceId = String.format("service/%s-%s-%s/%s",
                appConfig.appName(), "cluster", appConfig.environment(), serviceConfig.serviceName());

        AppautoscalingTarget target = AppautoscalingTarget.Builder.create(this, "scaling-target")
                .maxCapacity(serviceConfig.maxCount())
                .minCapacity(serviceConfig.minCount())
                .resourceId(resourceId)
                .scalableDimension("ecs:service:DesiredCount")
                .serviceNamespace("ecs")
                .dependsOn(List.of(service))
                .build();

        // CPU scaling policy
        AppautoscalingPolicy.Builder.create(this, "cpu-scaling")
                .name(String.format("%s-cpu-scaling", serviceConfig.serviceName()))
                .policyType("TargetTrackingScaling")
                .resourceId(target.getResourceId())
                .scalableDimension(target.getScalableDimension())
                .serviceNamespace(target.getServiceNamespace())
                .targetTrackingScalingPolicyConfiguration(AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.builder()
                        .predefinedMetricSpecification(
                                AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification.builder()
                                .predefinedMetricType("ECSServiceAverageCPUUtilization")
                                .build())
                        .targetValue((double) serviceConfig.targetCpuPercent())
                        .build())
                .build();

        // Memory scaling policy
        AppautoscalingPolicy.Builder.create(this, "memory-scaling")
                .name(String.format("%s-memory-scaling", serviceConfig.serviceName()))
                .policyType("TargetTrackingScaling")
                .resourceId(target.getResourceId())
                .scalableDimension(target.getScalableDimension())
                .serviceNamespace(target.getServiceNamespace())
                .targetTrackingScalingPolicyConfiguration(AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration.builder()
                        .predefinedMetricSpecification(
                                AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification.builder()
                                .predefinedMetricType("ECSServiceAverageMemoryUtilization")
                                .build())
                        .targetValue((double) serviceConfig.targetMemoryPercent())
                        .build())
                .build();
    }

    // Getters
    public EcsService getService() {
        return service;
    }

    public EcsTaskDefinition getTaskDefinition() {
        return taskDefinition;
    }

    public SecurityGroup getSecurityGroup() {
        return securityGroup;
    }
}
