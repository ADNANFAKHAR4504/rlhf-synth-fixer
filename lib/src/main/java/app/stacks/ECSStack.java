package app.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
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
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.secretsmanager.ISecret;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public final class ECSStack extends Stack {
    private final ICluster cluster;
    private final FargateService service;

    public ECSStack(final Construct scope, final String id, final ECSStackProps props) {
        super(scope, id, props.getStackProps());
        
        // Get environment suffix from the parent stack
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Create ECS cluster with container insights v2 enabled
        this.cluster = Cluster.Builder.create(this, "WebAppCluster")
                .vpc(props.getVpc())
                .clusterName("secure-webapp-cluster-" + environmentSuffix)
                .containerInsightsV2(true)
                .build();

        // Create log group for ECS tasks with KMS encryption
        LogGroup logGroup = LogGroup.Builder.create(this, "ECSLogGroup")
                .logGroupName("/aws/ecs/secure-webapp-" + environmentSuffix)
                .retention(RetentionDays.ONE_MONTH)
                .encryptionKey(props.getKmsKey())
                .build();

        // Create task definition
        FargateTaskDefinition taskDefinition = FargateTaskDefinition.Builder.create(this, "WebAppTaskDef")
                .memoryLimitMiB(512)
                .cpu(256)
                .executionRole(props.getEcsExecutionRole())
                .taskRole(props.getEcsTaskRole())
                .build();

        // Add container to task definition
        ContainerDefinition container = taskDefinition.addContainer("WebAppContainer", 
                ContainerDefinitionOptions.builder()
                        .image(ContainerImage.fromRegistry("nginx:alpine"))
                        .memoryLimitMiB(512)
                        .logging(LogDriver.awsLogs(AwsLogDriverProps.builder()
                                .logGroup(logGroup)
                                .streamPrefix("webapp")
                                .build()))
                        .secrets(Map.of(
                                "DB_PASSWORD", Secret.fromSecretsManager(props.getDatabaseSecret(), "password"),
                                "DB_USERNAME", Secret.fromSecretsManager(props.getDatabaseSecret(), "username")
                        ))
                        .environment(Map.of(
                                "ENV", "production"
                        ))
                        .build());

        container.addPortMappings(PortMapping.builder()
                .containerPort(80)
                .protocol(Protocol.TCP)
                .build());

        // Create Fargate service
        this.service = FargateService.Builder.create(this, "WebAppService")
                .cluster(cluster)
                .taskDefinition(taskDefinition)
                .desiredCount(2)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(List.of(props.getEcsSecurityGroup()))
                .assignPublicIp(false)
                .serviceName("secure-webapp-service-" + environmentSuffix)
                .build();

        // Add tags
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
        private final StackProps stackProps;
        private final IVpc vpc;
        private final ISecurityGroup ecsSecurityGroup;
        private final IKey kmsKey;
        private final Role ecsTaskRole;
        private final Role ecsExecutionRole;
        private final ISecret databaseSecret;

        private ECSStackProps(final StackProps stackProps, final IVpc vpc, 
                             final ISecurityGroup ecsSecurityGroup, 
                             final IKey kmsKey, final Role ecsTaskRole, 
                             final Role ecsExecutionRole, final ISecret databaseSecret) {
            this.stackProps = stackProps;
            this.vpc = vpc;
            this.ecsSecurityGroup = ecsSecurityGroup;
            this.kmsKey = kmsKey;
            this.ecsTaskRole = ecsTaskRole;
            this.ecsExecutionRole = ecsExecutionRole;
            this.databaseSecret = databaseSecret;
        }

        public static Builder builder() {
            return new Builder();
        }

        public StackProps getStackProps() { 
            return stackProps; 
        }
        
        public IVpc getVpc() { 
            return vpc; 
        }
        
        public ISecurityGroup getEcsSecurityGroup() { 
            return ecsSecurityGroup; 
        }
        
        public IKey getKmsKey() { 
            return kmsKey; 
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

        public static final class Builder {
            private StackProps stackProps;
            private IVpc vpc;
            private ISecurityGroup ecsSecurityGroup;
            private IKey kmsKey;
            private Role ecsTaskRole;
            private Role ecsExecutionRole;
            private ISecret databaseSecret;

            public Builder stackProps(final StackProps stackProps) { 
                this.stackProps = stackProps; 
                return this; 
            }
            
            public Builder vpc(final IVpc vpc) { 
                this.vpc = vpc; 
                return this; 
            }
            
            public Builder ecsSecurityGroup(final ISecurityGroup ecsSecurityGroup) { 
                this.ecsSecurityGroup = ecsSecurityGroup; 
                return this; 
            }
            
            public Builder kmsKey(final IKey kmsKey) { 
                this.kmsKey = kmsKey; 
                return this; 
            }
            
            public Builder ecsTaskRole(final Role ecsTaskRole) { 
                this.ecsTaskRole = ecsTaskRole; 
                return this; 
            }
            
            public Builder ecsExecutionRole(final Role ecsExecutionRole) { 
                this.ecsExecutionRole = ecsExecutionRole; 
                return this; 
            }
            
            public Builder databaseSecret(final ISecret databaseSecret) { 
                this.databaseSecret = databaseSecret; 
                return this; 
            }

            public ECSStackProps build() {
                return new ECSStackProps(stackProps, vpc, ecsSecurityGroup, kmsKey, 
                                       ecsTaskRole, ecsExecutionRole, databaseSecret);
            }
        }
    }
}