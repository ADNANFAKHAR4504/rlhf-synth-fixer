package app.stacks;


import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ecs.AwsLogDriverProps;
import software.amazon.awscdk.services.ecs.Cluster;
import software.amazon.awscdk.services.ecs.ContainerDefinition;
import software.amazon.awscdk.services.ecs.ContainerDefinitionOptions;
import software.amazon.awscdk.services.ecs.ContainerImage;
import software.amazon.awscdk.services.ecs.FargateService;
import software.amazon.awscdk.services.ecs.FargateTaskDefinition;
import software.amazon.awscdk.services.ecs.ICluster;
import software.amazon.awscdk.services.ecs.LogDriver;
import software.amazon.awscdk.services.ecs.PortMapping;
import software.amazon.awscdk.services.ecs.Protocol;
import software.amazon.awscdk.services.ecs.Secret;
import software.amazon.awscdk.services.iam.Role;

import software.amazon.awscdk.services.logs.ILogGroup;
import software.amazon.awscdk.services.secretsmanager.ISecret;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public final class ECSStack extends Construct {
    private final ICluster cluster;
    private final FargateService service;

    public ECSStack(final Construct scope, final String id, final ECSStackProps ecsProps) {
        super(scope, id);
        
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        this.cluster = Cluster.Builder.create(this, "WebAppCluster")
                .vpc(ecsProps.getVpc())
                .clusterName("secure-webapp-cluster-" + environmentSuffix)
                .containerInsights(true)
                .build();

        ILogGroup logGroup = ecsProps.getLogGroup();

        FargateTaskDefinition taskDefinition = FargateTaskDefinition.Builder.create(this, "WebAppTaskDef")
                .memoryLimitMiB(512)
                .cpu(256)
                .executionRole(ecsProps.getEcsExecutionRole())
                .taskRole(ecsProps.getEcsTaskRole())
                .build();

        ContainerDefinition container = taskDefinition.addContainer("WebAppContainer", 
                ContainerDefinitionOptions.builder()
                        .image(ContainerImage.fromRegistry("nginx:alpine"))
                        .memoryLimitMiB(512)
                        .logging(LogDriver.awsLogs(AwsLogDriverProps.builder()
                                .logGroup(logGroup)
                                .streamPrefix("webapp")
                                .build()))
                        .secrets(Map.of(
                                "DB_PASSWORD", Secret.fromSecretsManager(ecsProps.getDatabaseSecret(), "password"),
                                "DB_USERNAME", Secret.fromSecretsManager(ecsProps.getDatabaseSecret(), "username")
                        ))
                        .environment(Map.of(
                                "ENV", "production"
                        ))
                        .build());

        container.addPortMappings(PortMapping.builder()
                .containerPort(80)
                .protocol(Protocol.TCP)
                .build());

        this.service = FargateService.Builder.create(this, "WebAppService")
                .cluster(cluster)
                .taskDefinition(taskDefinition)
                .desiredCount(2)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(List.of(ecsProps.getEcsSecurityGroup()))
                .assignPublicIp(false)
                .serviceName("secure-webapp-service-" + environmentSuffix)
                .build();

        Tags.of(this).add("Environment", "production");
        Tags.of(this).add("Project", "SecureWebApp");
    }

    public ICluster getCluster() {
        return cluster;
    }

    public FargateService getService() {
        return service;
    }

    public static final class ECSStackProps {
        private final IVpc vpc;
        private final ISecurityGroup ecsSecurityGroup;

        private final Role ecsTaskRole;
        private final Role ecsExecutionRole;
        private final ISecret databaseSecret;
        private final ILogGroup logGroup;

        @SuppressWarnings("checkstyle:ParameterNumber")
        private ECSStackProps(final IVpc vpcValue, 
                             final ISecurityGroup ecsSecurityGroupValue, 
                             final Role ecsTaskRoleValue, 
                             final Role ecsExecutionRoleValue, final ISecret databaseSecretValue,
                             final ILogGroup logGroupValue) {
            this.vpc = vpcValue;
            this.ecsSecurityGroup = ecsSecurityGroupValue;

            this.ecsTaskRole = ecsTaskRoleValue;
            this.ecsExecutionRole = ecsExecutionRoleValue;
            this.databaseSecret = databaseSecretValue;
            this.logGroup = logGroupValue;
        }

        public static Builder builder() {
            return new Builder();
        }


        
        public IVpc getVpc() { 
            return vpc; 
        }
        
        public ISecurityGroup getEcsSecurityGroup() { 
            return ecsSecurityGroup; 
        }
        

        
        public Role getEcsTaskRole() { 
            return ecsTaskRole; 
        }
        
        public Role getEcsExecutionRole() { 
            return ecsExecutionRole; 
        }
        
        public ISecret getDatabaseSecret() { 
            return databaseSecret; 
        }

        public ILogGroup getLogGroup() {
            return logGroup; 
        }

        @SuppressWarnings("checkstyle:HiddenField")
        public static final class Builder {
            private IVpc vpcValue;
            private ISecurityGroup ecsSecurityGroupValue;

            private Role ecsTaskRoleValue;
            private Role ecsExecutionRoleValue;
            private ISecret databaseSecretValue;
            private ILogGroup logGroupValue;


            
            public Builder vpc(final IVpc vpcParam) { 
                this.vpcValue = vpcParam; 
                return this; 
            }
            
            public Builder ecsSecurityGroup(final ISecurityGroup ecsSecurityGroupParam) { 
                this.ecsSecurityGroupValue = ecsSecurityGroupParam; 
                return this; 
            }
            

            
            public Builder ecsTaskRole(final Role ecsTaskRoleParam) { 
                this.ecsTaskRoleValue = ecsTaskRoleParam; 
                return this; 
            }
            
            public Builder ecsExecutionRole(final Role ecsExecutionRoleParam) { 
                this.ecsExecutionRoleValue = ecsExecutionRoleParam; 
                return this; 
            }
            
            public Builder databaseSecret(final ISecret databaseSecretParam) { 
                this.databaseSecretValue = databaseSecretParam; 
                return this; 
            }

            public Builder logGroup(final ILogGroup logGroupParam) {
                this.logGroupValue = logGroupParam;
                return this;
            }

            public ECSStackProps build() {
                return new ECSStackProps(vpcValue, ecsSecurityGroupValue, 
                                       ecsTaskRoleValue, ecsExecutionRoleValue, databaseSecretValue, logGroupValue);
            }
        }
    }
}