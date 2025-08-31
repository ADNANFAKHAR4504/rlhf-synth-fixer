package imports.aws.data_aws_ecs_task_execution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.630Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcsTaskExecutionConfig.Jsii$Proxy.class)
public interface DataAwsEcsTaskExecutionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cluster DataAwsEcsTaskExecution#cluster}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCluster();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#task_definition DataAwsEcsTaskExecution#task_definition}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskDefinition();

    /**
     * capacity_provider_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#capacity_provider_strategy DataAwsEcsTaskExecution#capacity_provider_strategy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCapacityProviderStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#client_token DataAwsEcsTaskExecution#client_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#desired_count DataAwsEcsTaskExecution#desired_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableEcsManagedTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableExecuteCommand() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#group DataAwsEcsTaskExecution#group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#id DataAwsEcsTaskExecution#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#launch_type DataAwsEcsTaskExecution#launch_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchType() {
        return null;
    }

    /**
     * network_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#network_configuration DataAwsEcsTaskExecution#network_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration getNetworkConfiguration() {
        return null;
    }

    /**
     * overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#overrides DataAwsEcsTaskExecution#overrides}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides getOverrides() {
        return null;
    }

    /**
     * placement_constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_constraints DataAwsEcsTaskExecution#placement_constraints}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPlacementConstraints() {
        return null;
    }

    /**
     * placement_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_strategy DataAwsEcsTaskExecution#placement_strategy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPlacementStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#platform_version DataAwsEcsTaskExecution#platform_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#propagate_tags DataAwsEcsTaskExecution#propagate_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPropagateTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#reference_id DataAwsEcsTaskExecution#reference_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReferenceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#started_by DataAwsEcsTaskExecution#started_by}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartedBy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#tags DataAwsEcsTaskExecution#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcsTaskExecutionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcsTaskExecutionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcsTaskExecutionConfig> {
        java.lang.String cluster;
        java.lang.String taskDefinition;
        java.lang.Object capacityProviderStrategy;
        java.lang.String clientToken;
        java.lang.Number desiredCount;
        java.lang.Object enableEcsManagedTags;
        java.lang.Object enableExecuteCommand;
        java.lang.String group;
        java.lang.String id;
        java.lang.String launchType;
        imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration networkConfiguration;
        imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides overrides;
        java.lang.Object placementConstraints;
        java.lang.Object placementStrategy;
        java.lang.String platformVersion;
        java.lang.String propagateTags;
        java.lang.String referenceId;
        java.lang.String startedBy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getCluster}
         * @param cluster Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cluster DataAwsEcsTaskExecution#cluster}. This parameter is required.
         * @return {@code this}
         */
        public Builder cluster(java.lang.String cluster) {
            this.cluster = cluster;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getTaskDefinition}
         * @param taskDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#task_definition DataAwsEcsTaskExecution#task_definition}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskDefinition(java.lang.String taskDefinition) {
            this.taskDefinition = taskDefinition;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getCapacityProviderStrategy}
         * @param capacityProviderStrategy capacity_provider_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#capacity_provider_strategy DataAwsEcsTaskExecution#capacity_provider_strategy}
         * @return {@code this}
         */
        public Builder capacityProviderStrategy(com.hashicorp.cdktf.IResolvable capacityProviderStrategy) {
            this.capacityProviderStrategy = capacityProviderStrategy;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getCapacityProviderStrategy}
         * @param capacityProviderStrategy capacity_provider_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#capacity_provider_strategy DataAwsEcsTaskExecution#capacity_provider_strategy}
         * @return {@code this}
         */
        public Builder capacityProviderStrategy(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategy> capacityProviderStrategy) {
            this.capacityProviderStrategy = capacityProviderStrategy;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getClientToken}
         * @param clientToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#client_token DataAwsEcsTaskExecution#client_token}.
         * @return {@code this}
         */
        public Builder clientToken(java.lang.String clientToken) {
            this.clientToken = clientToken;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getDesiredCount}
         * @param desiredCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#desired_count DataAwsEcsTaskExecution#desired_count}.
         * @return {@code this}
         */
        public Builder desiredCount(java.lang.Number desiredCount) {
            this.desiredCount = desiredCount;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getEnableEcsManagedTags}
         * @param enableEcsManagedTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}.
         * @return {@code this}
         */
        public Builder enableEcsManagedTags(java.lang.Boolean enableEcsManagedTags) {
            this.enableEcsManagedTags = enableEcsManagedTags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getEnableEcsManagedTags}
         * @param enableEcsManagedTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}.
         * @return {@code this}
         */
        public Builder enableEcsManagedTags(com.hashicorp.cdktf.IResolvable enableEcsManagedTags) {
            this.enableEcsManagedTags = enableEcsManagedTags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getEnableExecuteCommand}
         * @param enableExecuteCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}.
         * @return {@code this}
         */
        public Builder enableExecuteCommand(java.lang.Boolean enableExecuteCommand) {
            this.enableExecuteCommand = enableExecuteCommand;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getEnableExecuteCommand}
         * @param enableExecuteCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}.
         * @return {@code this}
         */
        public Builder enableExecuteCommand(com.hashicorp.cdktf.IResolvable enableExecuteCommand) {
            this.enableExecuteCommand = enableExecuteCommand;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getGroup}
         * @param group Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#group DataAwsEcsTaskExecution#group}.
         * @return {@code this}
         */
        public Builder group(java.lang.String group) {
            this.group = group;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#id DataAwsEcsTaskExecution#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getLaunchType}
         * @param launchType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#launch_type DataAwsEcsTaskExecution#launch_type}.
         * @return {@code this}
         */
        public Builder launchType(java.lang.String launchType) {
            this.launchType = launchType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getNetworkConfiguration}
         * @param networkConfiguration network_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#network_configuration DataAwsEcsTaskExecution#network_configuration}
         * @return {@code this}
         */
        public Builder networkConfiguration(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration networkConfiguration) {
            this.networkConfiguration = networkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getOverrides}
         * @param overrides overrides block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#overrides DataAwsEcsTaskExecution#overrides}
         * @return {@code this}
         */
        public Builder overrides(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides overrides) {
            this.overrides = overrides;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getPlacementConstraints}
         * @param placementConstraints placement_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_constraints DataAwsEcsTaskExecution#placement_constraints}
         * @return {@code this}
         */
        public Builder placementConstraints(com.hashicorp.cdktf.IResolvable placementConstraints) {
            this.placementConstraints = placementConstraints;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getPlacementConstraints}
         * @param placementConstraints placement_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_constraints DataAwsEcsTaskExecution#placement_constraints}
         * @return {@code this}
         */
        public Builder placementConstraints(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraints> placementConstraints) {
            this.placementConstraints = placementConstraints;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getPlacementStrategy}
         * @param placementStrategy placement_strategy block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_strategy DataAwsEcsTaskExecution#placement_strategy}
         * @return {@code this}
         */
        public Builder placementStrategy(com.hashicorp.cdktf.IResolvable placementStrategy) {
            this.placementStrategy = placementStrategy;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getPlacementStrategy}
         * @param placementStrategy placement_strategy block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_strategy DataAwsEcsTaskExecution#placement_strategy}
         * @return {@code this}
         */
        public Builder placementStrategy(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategy> placementStrategy) {
            this.placementStrategy = placementStrategy;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getPlatformVersion}
         * @param platformVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#platform_version DataAwsEcsTaskExecution#platform_version}.
         * @return {@code this}
         */
        public Builder platformVersion(java.lang.String platformVersion) {
            this.platformVersion = platformVersion;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getPropagateTags}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#propagate_tags DataAwsEcsTaskExecution#propagate_tags}.
         * @return {@code this}
         */
        public Builder propagateTags(java.lang.String propagateTags) {
            this.propagateTags = propagateTags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getReferenceId}
         * @param referenceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#reference_id DataAwsEcsTaskExecution#reference_id}.
         * @return {@code this}
         */
        public Builder referenceId(java.lang.String referenceId) {
            this.referenceId = referenceId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getStartedBy}
         * @param startedBy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#started_by DataAwsEcsTaskExecution#started_by}.
         * @return {@code this}
         */
        public Builder startedBy(java.lang.String startedBy) {
            this.startedBy = startedBy;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#tags DataAwsEcsTaskExecution#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcsTaskExecutionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcsTaskExecutionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcsTaskExecutionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcsTaskExecutionConfig {
        private final java.lang.String cluster;
        private final java.lang.String taskDefinition;
        private final java.lang.Object capacityProviderStrategy;
        private final java.lang.String clientToken;
        private final java.lang.Number desiredCount;
        private final java.lang.Object enableEcsManagedTags;
        private final java.lang.Object enableExecuteCommand;
        private final java.lang.String group;
        private final java.lang.String id;
        private final java.lang.String launchType;
        private final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration networkConfiguration;
        private final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides overrides;
        private final java.lang.Object placementConstraints;
        private final java.lang.Object placementStrategy;
        private final java.lang.String platformVersion;
        private final java.lang.String propagateTags;
        private final java.lang.String referenceId;
        private final java.lang.String startedBy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cluster = software.amazon.jsii.Kernel.get(this, "cluster", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskDefinition = software.amazon.jsii.Kernel.get(this, "taskDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityProviderStrategy = software.amazon.jsii.Kernel.get(this, "capacityProviderStrategy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.clientToken = software.amazon.jsii.Kernel.get(this, "clientToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.desiredCount = software.amazon.jsii.Kernel.get(this, "desiredCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enableEcsManagedTags = software.amazon.jsii.Kernel.get(this, "enableEcsManagedTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableExecuteCommand = software.amazon.jsii.Kernel.get(this, "enableExecuteCommand", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.group = software.amazon.jsii.Kernel.get(this, "group", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchType = software.amazon.jsii.Kernel.get(this, "launchType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkConfiguration = software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration.class));
            this.overrides = software.amazon.jsii.Kernel.get(this, "overrides", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides.class));
            this.placementConstraints = software.amazon.jsii.Kernel.get(this, "placementConstraints", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.placementStrategy = software.amazon.jsii.Kernel.get(this, "placementStrategy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.platformVersion = software.amazon.jsii.Kernel.get(this, "platformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.propagateTags = software.amazon.jsii.Kernel.get(this, "propagateTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.referenceId = software.amazon.jsii.Kernel.get(this, "referenceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startedBy = software.amazon.jsii.Kernel.get(this, "startedBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cluster = java.util.Objects.requireNonNull(builder.cluster, "cluster is required");
            this.taskDefinition = java.util.Objects.requireNonNull(builder.taskDefinition, "taskDefinition is required");
            this.capacityProviderStrategy = builder.capacityProviderStrategy;
            this.clientToken = builder.clientToken;
            this.desiredCount = builder.desiredCount;
            this.enableEcsManagedTags = builder.enableEcsManagedTags;
            this.enableExecuteCommand = builder.enableExecuteCommand;
            this.group = builder.group;
            this.id = builder.id;
            this.launchType = builder.launchType;
            this.networkConfiguration = builder.networkConfiguration;
            this.overrides = builder.overrides;
            this.placementConstraints = builder.placementConstraints;
            this.placementStrategy = builder.placementStrategy;
            this.platformVersion = builder.platformVersion;
            this.propagateTags = builder.propagateTags;
            this.referenceId = builder.referenceId;
            this.startedBy = builder.startedBy;
            this.tags = builder.tags;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCluster() {
            return this.cluster;
        }

        @Override
        public final java.lang.String getTaskDefinition() {
            return this.taskDefinition;
        }

        @Override
        public final java.lang.Object getCapacityProviderStrategy() {
            return this.capacityProviderStrategy;
        }

        @Override
        public final java.lang.String getClientToken() {
            return this.clientToken;
        }

        @Override
        public final java.lang.Number getDesiredCount() {
            return this.desiredCount;
        }

        @Override
        public final java.lang.Object getEnableEcsManagedTags() {
            return this.enableEcsManagedTags;
        }

        @Override
        public final java.lang.Object getEnableExecuteCommand() {
            return this.enableExecuteCommand;
        }

        @Override
        public final java.lang.String getGroup() {
            return this.group;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLaunchType() {
            return this.launchType;
        }

        @Override
        public final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration getNetworkConfiguration() {
            return this.networkConfiguration;
        }

        @Override
        public final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides getOverrides() {
            return this.overrides;
        }

        @Override
        public final java.lang.Object getPlacementConstraints() {
            return this.placementConstraints;
        }

        @Override
        public final java.lang.Object getPlacementStrategy() {
            return this.placementStrategy;
        }

        @Override
        public final java.lang.String getPlatformVersion() {
            return this.platformVersion;
        }

        @Override
        public final java.lang.String getPropagateTags() {
            return this.propagateTags;
        }

        @Override
        public final java.lang.String getReferenceId() {
            return this.referenceId;
        }

        @Override
        public final java.lang.String getStartedBy() {
            return this.startedBy;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cluster", om.valueToTree(this.getCluster()));
            data.set("taskDefinition", om.valueToTree(this.getTaskDefinition()));
            if (this.getCapacityProviderStrategy() != null) {
                data.set("capacityProviderStrategy", om.valueToTree(this.getCapacityProviderStrategy()));
            }
            if (this.getClientToken() != null) {
                data.set("clientToken", om.valueToTree(this.getClientToken()));
            }
            if (this.getDesiredCount() != null) {
                data.set("desiredCount", om.valueToTree(this.getDesiredCount()));
            }
            if (this.getEnableEcsManagedTags() != null) {
                data.set("enableEcsManagedTags", om.valueToTree(this.getEnableEcsManagedTags()));
            }
            if (this.getEnableExecuteCommand() != null) {
                data.set("enableExecuteCommand", om.valueToTree(this.getEnableExecuteCommand()));
            }
            if (this.getGroup() != null) {
                data.set("group", om.valueToTree(this.getGroup()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLaunchType() != null) {
                data.set("launchType", om.valueToTree(this.getLaunchType()));
            }
            if (this.getNetworkConfiguration() != null) {
                data.set("networkConfiguration", om.valueToTree(this.getNetworkConfiguration()));
            }
            if (this.getOverrides() != null) {
                data.set("overrides", om.valueToTree(this.getOverrides()));
            }
            if (this.getPlacementConstraints() != null) {
                data.set("placementConstraints", om.valueToTree(this.getPlacementConstraints()));
            }
            if (this.getPlacementStrategy() != null) {
                data.set("placementStrategy", om.valueToTree(this.getPlacementStrategy()));
            }
            if (this.getPlatformVersion() != null) {
                data.set("platformVersion", om.valueToTree(this.getPlatformVersion()));
            }
            if (this.getPropagateTags() != null) {
                data.set("propagateTags", om.valueToTree(this.getPropagateTags()));
            }
            if (this.getReferenceId() != null) {
                data.set("referenceId", om.valueToTree(this.getReferenceId()));
            }
            if (this.getStartedBy() != null) {
                data.set("startedBy", om.valueToTree(this.getStartedBy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcsTaskExecutionConfig.Jsii$Proxy that = (DataAwsEcsTaskExecutionConfig.Jsii$Proxy) o;

            if (!cluster.equals(that.cluster)) return false;
            if (!taskDefinition.equals(that.taskDefinition)) return false;
            if (this.capacityProviderStrategy != null ? !this.capacityProviderStrategy.equals(that.capacityProviderStrategy) : that.capacityProviderStrategy != null) return false;
            if (this.clientToken != null ? !this.clientToken.equals(that.clientToken) : that.clientToken != null) return false;
            if (this.desiredCount != null ? !this.desiredCount.equals(that.desiredCount) : that.desiredCount != null) return false;
            if (this.enableEcsManagedTags != null ? !this.enableEcsManagedTags.equals(that.enableEcsManagedTags) : that.enableEcsManagedTags != null) return false;
            if (this.enableExecuteCommand != null ? !this.enableExecuteCommand.equals(that.enableExecuteCommand) : that.enableExecuteCommand != null) return false;
            if (this.group != null ? !this.group.equals(that.group) : that.group != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.launchType != null ? !this.launchType.equals(that.launchType) : that.launchType != null) return false;
            if (this.networkConfiguration != null ? !this.networkConfiguration.equals(that.networkConfiguration) : that.networkConfiguration != null) return false;
            if (this.overrides != null ? !this.overrides.equals(that.overrides) : that.overrides != null) return false;
            if (this.placementConstraints != null ? !this.placementConstraints.equals(that.placementConstraints) : that.placementConstraints != null) return false;
            if (this.placementStrategy != null ? !this.placementStrategy.equals(that.placementStrategy) : that.placementStrategy != null) return false;
            if (this.platformVersion != null ? !this.platformVersion.equals(that.platformVersion) : that.platformVersion != null) return false;
            if (this.propagateTags != null ? !this.propagateTags.equals(that.propagateTags) : that.propagateTags != null) return false;
            if (this.referenceId != null ? !this.referenceId.equals(that.referenceId) : that.referenceId != null) return false;
            if (this.startedBy != null ? !this.startedBy.equals(that.startedBy) : that.startedBy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cluster.hashCode();
            result = 31 * result + (this.taskDefinition.hashCode());
            result = 31 * result + (this.capacityProviderStrategy != null ? this.capacityProviderStrategy.hashCode() : 0);
            result = 31 * result + (this.clientToken != null ? this.clientToken.hashCode() : 0);
            result = 31 * result + (this.desiredCount != null ? this.desiredCount.hashCode() : 0);
            result = 31 * result + (this.enableEcsManagedTags != null ? this.enableEcsManagedTags.hashCode() : 0);
            result = 31 * result + (this.enableExecuteCommand != null ? this.enableExecuteCommand.hashCode() : 0);
            result = 31 * result + (this.group != null ? this.group.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.launchType != null ? this.launchType.hashCode() : 0);
            result = 31 * result + (this.networkConfiguration != null ? this.networkConfiguration.hashCode() : 0);
            result = 31 * result + (this.overrides != null ? this.overrides.hashCode() : 0);
            result = 31 * result + (this.placementConstraints != null ? this.placementConstraints.hashCode() : 0);
            result = 31 * result + (this.placementStrategy != null ? this.placementStrategy.hashCode() : 0);
            result = 31 * result + (this.platformVersion != null ? this.platformVersion.hashCode() : 0);
            result = 31 * result + (this.propagateTags != null ? this.propagateTags.hashCode() : 0);
            result = 31 * result + (this.referenceId != null ? this.referenceId.hashCode() : 0);
            result = 31 * result + (this.startedBy != null ? this.startedBy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
