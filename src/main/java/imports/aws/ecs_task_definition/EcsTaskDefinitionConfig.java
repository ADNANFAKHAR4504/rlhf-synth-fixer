package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.138Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionConfig")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionConfig.Jsii$Proxy.class)
public interface EcsTaskDefinitionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#container_definitions EcsTaskDefinition#container_definitions}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerDefinitions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#family EcsTaskDefinition#family}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFamily();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#cpu EcsTaskDefinition#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCpu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableFaultInjection() {
        return null;
    }

    /**
     * ephemeral_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ephemeral_storage EcsTaskDefinition#ephemeral_storage}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage getEphemeralStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#execution_role_arn EcsTaskDefinition#execution_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#id EcsTaskDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * inference_accelerator block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#inference_accelerator EcsTaskDefinition#inference_accelerator}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInferenceAccelerator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ipc_mode EcsTaskDefinition#ipc_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpcMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#memory EcsTaskDefinition#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMemory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#network_mode EcsTaskDefinition#network_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#pid_mode EcsTaskDefinition#pid_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPidMode() {
        return null;
    }

    /**
     * placement_constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#placement_constraints EcsTaskDefinition#placement_constraints}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPlacementConstraints() {
        return null;
    }

    /**
     * proxy_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#proxy_configuration EcsTaskDefinition#proxy_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration getProxyConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#requires_compatibilities EcsTaskDefinition#requires_compatibilities}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRequiresCompatibilities() {
        return null;
    }

    /**
     * runtime_platform block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#runtime_platform EcsTaskDefinition#runtime_platform}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform getRuntimePlatform() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags EcsTaskDefinition#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags_all EcsTaskDefinition#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#task_role_arn EcsTaskDefinition#task_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaskRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTrackLatest() {
        return null;
    }

    /**
     * volume block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#volume EcsTaskDefinition#volume}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVolume() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionConfig> {
        java.lang.String containerDefinitions;
        java.lang.String family;
        java.lang.String cpu;
        java.lang.Object enableFaultInjection;
        imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage ephemeralStorage;
        java.lang.String executionRoleArn;
        java.lang.String id;
        java.lang.Object inferenceAccelerator;
        java.lang.String ipcMode;
        java.lang.String memory;
        java.lang.String networkMode;
        java.lang.String pidMode;
        java.lang.Object placementConstraints;
        imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration proxyConfiguration;
        java.util.List<java.lang.String> requiresCompatibilities;
        imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform runtimePlatform;
        java.lang.Object skipDestroy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String taskRoleArn;
        java.lang.Object trackLatest;
        java.lang.Object volume;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getContainerDefinitions}
         * @param containerDefinitions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#container_definitions EcsTaskDefinition#container_definitions}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerDefinitions(java.lang.String containerDefinitions) {
            this.containerDefinitions = containerDefinitions;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getFamily}
         * @param family Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#family EcsTaskDefinition#family}. This parameter is required.
         * @return {@code this}
         */
        public Builder family(java.lang.String family) {
            this.family = family;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#cpu EcsTaskDefinition#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.String cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getEnableFaultInjection}
         * @param enableFaultInjection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}.
         * @return {@code this}
         */
        public Builder enableFaultInjection(java.lang.Boolean enableFaultInjection) {
            this.enableFaultInjection = enableFaultInjection;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getEnableFaultInjection}
         * @param enableFaultInjection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}.
         * @return {@code this}
         */
        public Builder enableFaultInjection(com.hashicorp.cdktf.IResolvable enableFaultInjection) {
            this.enableFaultInjection = enableFaultInjection;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getEphemeralStorage}
         * @param ephemeralStorage ephemeral_storage block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ephemeral_storage EcsTaskDefinition#ephemeral_storage}
         * @return {@code this}
         */
        public Builder ephemeralStorage(imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage ephemeralStorage) {
            this.ephemeralStorage = ephemeralStorage;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#execution_role_arn EcsTaskDefinition#execution_role_arn}.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#id EcsTaskDefinition#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getInferenceAccelerator}
         * @param inferenceAccelerator inference_accelerator block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#inference_accelerator EcsTaskDefinition#inference_accelerator}
         * @return {@code this}
         */
        public Builder inferenceAccelerator(com.hashicorp.cdktf.IResolvable inferenceAccelerator) {
            this.inferenceAccelerator = inferenceAccelerator;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getInferenceAccelerator}
         * @param inferenceAccelerator inference_accelerator block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#inference_accelerator EcsTaskDefinition#inference_accelerator}
         * @return {@code this}
         */
        public Builder inferenceAccelerator(java.util.List<? extends imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAccelerator> inferenceAccelerator) {
            this.inferenceAccelerator = inferenceAccelerator;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getIpcMode}
         * @param ipcMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ipc_mode EcsTaskDefinition#ipc_mode}.
         * @return {@code this}
         */
        public Builder ipcMode(java.lang.String ipcMode) {
            this.ipcMode = ipcMode;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#memory EcsTaskDefinition#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.String memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getNetworkMode}
         * @param networkMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#network_mode EcsTaskDefinition#network_mode}.
         * @return {@code this}
         */
        public Builder networkMode(java.lang.String networkMode) {
            this.networkMode = networkMode;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getPidMode}
         * @param pidMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#pid_mode EcsTaskDefinition#pid_mode}.
         * @return {@code this}
         */
        public Builder pidMode(java.lang.String pidMode) {
            this.pidMode = pidMode;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getPlacementConstraints}
         * @param placementConstraints placement_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#placement_constraints EcsTaskDefinition#placement_constraints}
         * @return {@code this}
         */
        public Builder placementConstraints(com.hashicorp.cdktf.IResolvable placementConstraints) {
            this.placementConstraints = placementConstraints;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getPlacementConstraints}
         * @param placementConstraints placement_constraints block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#placement_constraints EcsTaskDefinition#placement_constraints}
         * @return {@code this}
         */
        public Builder placementConstraints(java.util.List<? extends imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraints> placementConstraints) {
            this.placementConstraints = placementConstraints;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getProxyConfiguration}
         * @param proxyConfiguration proxy_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#proxy_configuration EcsTaskDefinition#proxy_configuration}
         * @return {@code this}
         */
        public Builder proxyConfiguration(imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration proxyConfiguration) {
            this.proxyConfiguration = proxyConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getRequiresCompatibilities}
         * @param requiresCompatibilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#requires_compatibilities EcsTaskDefinition#requires_compatibilities}.
         * @return {@code this}
         */
        public Builder requiresCompatibilities(java.util.List<java.lang.String> requiresCompatibilities) {
            this.requiresCompatibilities = requiresCompatibilities;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getRuntimePlatform}
         * @param runtimePlatform runtime_platform block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#runtime_platform EcsTaskDefinition#runtime_platform}
         * @return {@code this}
         */
        public Builder runtimePlatform(imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform runtimePlatform) {
            this.runtimePlatform = runtimePlatform;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getSkipDestroy}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}.
         * @return {@code this}
         */
        public Builder skipDestroy(java.lang.Boolean skipDestroy) {
            this.skipDestroy = skipDestroy;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getSkipDestroy}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}.
         * @return {@code this}
         */
        public Builder skipDestroy(com.hashicorp.cdktf.IResolvable skipDestroy) {
            this.skipDestroy = skipDestroy;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags EcsTaskDefinition#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags_all EcsTaskDefinition#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getTaskRoleArn}
         * @param taskRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#task_role_arn EcsTaskDefinition#task_role_arn}.
         * @return {@code this}
         */
        public Builder taskRoleArn(java.lang.String taskRoleArn) {
            this.taskRoleArn = taskRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getTrackLatest}
         * @param trackLatest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}.
         * @return {@code this}
         */
        public Builder trackLatest(java.lang.Boolean trackLatest) {
            this.trackLatest = trackLatest;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getTrackLatest}
         * @param trackLatest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}.
         * @return {@code this}
         */
        public Builder trackLatest(com.hashicorp.cdktf.IResolvable trackLatest) {
            this.trackLatest = trackLatest;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getVolume}
         * @param volume volume block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#volume EcsTaskDefinition#volume}
         * @return {@code this}
         */
        public Builder volume(com.hashicorp.cdktf.IResolvable volume) {
            this.volume = volume;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getVolume}
         * @param volume volume block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#volume EcsTaskDefinition#volume}
         * @return {@code this}
         */
        public Builder volume(java.util.List<? extends imports.aws.ecs_task_definition.EcsTaskDefinitionVolume> volume) {
            this.volume = volume;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getDependsOn}
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
         * Sets the value of {@link EcsTaskDefinitionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionConfig#getProvisioners}
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
         * @return a new instance of {@link EcsTaskDefinitionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionConfig {
        private final java.lang.String containerDefinitions;
        private final java.lang.String family;
        private final java.lang.String cpu;
        private final java.lang.Object enableFaultInjection;
        private final imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage ephemeralStorage;
        private final java.lang.String executionRoleArn;
        private final java.lang.String id;
        private final java.lang.Object inferenceAccelerator;
        private final java.lang.String ipcMode;
        private final java.lang.String memory;
        private final java.lang.String networkMode;
        private final java.lang.String pidMode;
        private final java.lang.Object placementConstraints;
        private final imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration proxyConfiguration;
        private final java.util.List<java.lang.String> requiresCompatibilities;
        private final imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform runtimePlatform;
        private final java.lang.Object skipDestroy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String taskRoleArn;
        private final java.lang.Object trackLatest;
        private final java.lang.Object volume;
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
            this.containerDefinitions = software.amazon.jsii.Kernel.get(this, "containerDefinitions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.family = software.amazon.jsii.Kernel.get(this, "family", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableFaultInjection = software.amazon.jsii.Kernel.get(this, "enableFaultInjection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ephemeralStorage = software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage.class));
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inferenceAccelerator = software.amazon.jsii.Kernel.get(this, "inferenceAccelerator", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ipcMode = software.amazon.jsii.Kernel.get(this, "ipcMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkMode = software.amazon.jsii.Kernel.get(this, "networkMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pidMode = software.amazon.jsii.Kernel.get(this, "pidMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementConstraints = software.amazon.jsii.Kernel.get(this, "placementConstraints", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.proxyConfiguration = software.amazon.jsii.Kernel.get(this, "proxyConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration.class));
            this.requiresCompatibilities = software.amazon.jsii.Kernel.get(this, "requiresCompatibilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.runtimePlatform = software.amazon.jsii.Kernel.get(this, "runtimePlatform", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform.class));
            this.skipDestroy = software.amazon.jsii.Kernel.get(this, "skipDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.taskRoleArn = software.amazon.jsii.Kernel.get(this, "taskRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trackLatest = software.amazon.jsii.Kernel.get(this, "trackLatest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.volume = software.amazon.jsii.Kernel.get(this, "volume", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.containerDefinitions = java.util.Objects.requireNonNull(builder.containerDefinitions, "containerDefinitions is required");
            this.family = java.util.Objects.requireNonNull(builder.family, "family is required");
            this.cpu = builder.cpu;
            this.enableFaultInjection = builder.enableFaultInjection;
            this.ephemeralStorage = builder.ephemeralStorage;
            this.executionRoleArn = builder.executionRoleArn;
            this.id = builder.id;
            this.inferenceAccelerator = builder.inferenceAccelerator;
            this.ipcMode = builder.ipcMode;
            this.memory = builder.memory;
            this.networkMode = builder.networkMode;
            this.pidMode = builder.pidMode;
            this.placementConstraints = builder.placementConstraints;
            this.proxyConfiguration = builder.proxyConfiguration;
            this.requiresCompatibilities = builder.requiresCompatibilities;
            this.runtimePlatform = builder.runtimePlatform;
            this.skipDestroy = builder.skipDestroy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.taskRoleArn = builder.taskRoleArn;
            this.trackLatest = builder.trackLatest;
            this.volume = builder.volume;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getContainerDefinitions() {
            return this.containerDefinitions;
        }

        @Override
        public final java.lang.String getFamily() {
            return this.family;
        }

        @Override
        public final java.lang.String getCpu() {
            return this.cpu;
        }

        @Override
        public final java.lang.Object getEnableFaultInjection() {
            return this.enableFaultInjection;
        }

        @Override
        public final imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage getEphemeralStorage() {
            return this.ephemeralStorage;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getInferenceAccelerator() {
            return this.inferenceAccelerator;
        }

        @Override
        public final java.lang.String getIpcMode() {
            return this.ipcMode;
        }

        @Override
        public final java.lang.String getMemory() {
            return this.memory;
        }

        @Override
        public final java.lang.String getNetworkMode() {
            return this.networkMode;
        }

        @Override
        public final java.lang.String getPidMode() {
            return this.pidMode;
        }

        @Override
        public final java.lang.Object getPlacementConstraints() {
            return this.placementConstraints;
        }

        @Override
        public final imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration getProxyConfiguration() {
            return this.proxyConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getRequiresCompatibilities() {
            return this.requiresCompatibilities;
        }

        @Override
        public final imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform getRuntimePlatform() {
            return this.runtimePlatform;
        }

        @Override
        public final java.lang.Object getSkipDestroy() {
            return this.skipDestroy;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.String getTaskRoleArn() {
            return this.taskRoleArn;
        }

        @Override
        public final java.lang.Object getTrackLatest() {
            return this.trackLatest;
        }

        @Override
        public final java.lang.Object getVolume() {
            return this.volume;
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

            data.set("containerDefinitions", om.valueToTree(this.getContainerDefinitions()));
            data.set("family", om.valueToTree(this.getFamily()));
            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getEnableFaultInjection() != null) {
                data.set("enableFaultInjection", om.valueToTree(this.getEnableFaultInjection()));
            }
            if (this.getEphemeralStorage() != null) {
                data.set("ephemeralStorage", om.valueToTree(this.getEphemeralStorage()));
            }
            if (this.getExecutionRoleArn() != null) {
                data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInferenceAccelerator() != null) {
                data.set("inferenceAccelerator", om.valueToTree(this.getInferenceAccelerator()));
            }
            if (this.getIpcMode() != null) {
                data.set("ipcMode", om.valueToTree(this.getIpcMode()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }
            if (this.getNetworkMode() != null) {
                data.set("networkMode", om.valueToTree(this.getNetworkMode()));
            }
            if (this.getPidMode() != null) {
                data.set("pidMode", om.valueToTree(this.getPidMode()));
            }
            if (this.getPlacementConstraints() != null) {
                data.set("placementConstraints", om.valueToTree(this.getPlacementConstraints()));
            }
            if (this.getProxyConfiguration() != null) {
                data.set("proxyConfiguration", om.valueToTree(this.getProxyConfiguration()));
            }
            if (this.getRequiresCompatibilities() != null) {
                data.set("requiresCompatibilities", om.valueToTree(this.getRequiresCompatibilities()));
            }
            if (this.getRuntimePlatform() != null) {
                data.set("runtimePlatform", om.valueToTree(this.getRuntimePlatform()));
            }
            if (this.getSkipDestroy() != null) {
                data.set("skipDestroy", om.valueToTree(this.getSkipDestroy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTaskRoleArn() != null) {
                data.set("taskRoleArn", om.valueToTree(this.getTaskRoleArn()));
            }
            if (this.getTrackLatest() != null) {
                data.set("trackLatest", om.valueToTree(this.getTrackLatest()));
            }
            if (this.getVolume() != null) {
                data.set("volume", om.valueToTree(this.getVolume()));
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
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionConfig.Jsii$Proxy that = (EcsTaskDefinitionConfig.Jsii$Proxy) o;

            if (!containerDefinitions.equals(that.containerDefinitions)) return false;
            if (!family.equals(that.family)) return false;
            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            if (this.enableFaultInjection != null ? !this.enableFaultInjection.equals(that.enableFaultInjection) : that.enableFaultInjection != null) return false;
            if (this.ephemeralStorage != null ? !this.ephemeralStorage.equals(that.ephemeralStorage) : that.ephemeralStorage != null) return false;
            if (this.executionRoleArn != null ? !this.executionRoleArn.equals(that.executionRoleArn) : that.executionRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.inferenceAccelerator != null ? !this.inferenceAccelerator.equals(that.inferenceAccelerator) : that.inferenceAccelerator != null) return false;
            if (this.ipcMode != null ? !this.ipcMode.equals(that.ipcMode) : that.ipcMode != null) return false;
            if (this.memory != null ? !this.memory.equals(that.memory) : that.memory != null) return false;
            if (this.networkMode != null ? !this.networkMode.equals(that.networkMode) : that.networkMode != null) return false;
            if (this.pidMode != null ? !this.pidMode.equals(that.pidMode) : that.pidMode != null) return false;
            if (this.placementConstraints != null ? !this.placementConstraints.equals(that.placementConstraints) : that.placementConstraints != null) return false;
            if (this.proxyConfiguration != null ? !this.proxyConfiguration.equals(that.proxyConfiguration) : that.proxyConfiguration != null) return false;
            if (this.requiresCompatibilities != null ? !this.requiresCompatibilities.equals(that.requiresCompatibilities) : that.requiresCompatibilities != null) return false;
            if (this.runtimePlatform != null ? !this.runtimePlatform.equals(that.runtimePlatform) : that.runtimePlatform != null) return false;
            if (this.skipDestroy != null ? !this.skipDestroy.equals(that.skipDestroy) : that.skipDestroy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.taskRoleArn != null ? !this.taskRoleArn.equals(that.taskRoleArn) : that.taskRoleArn != null) return false;
            if (this.trackLatest != null ? !this.trackLatest.equals(that.trackLatest) : that.trackLatest != null) return false;
            if (this.volume != null ? !this.volume.equals(that.volume) : that.volume != null) return false;
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
            int result = this.containerDefinitions.hashCode();
            result = 31 * result + (this.family.hashCode());
            result = 31 * result + (this.cpu != null ? this.cpu.hashCode() : 0);
            result = 31 * result + (this.enableFaultInjection != null ? this.enableFaultInjection.hashCode() : 0);
            result = 31 * result + (this.ephemeralStorage != null ? this.ephemeralStorage.hashCode() : 0);
            result = 31 * result + (this.executionRoleArn != null ? this.executionRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.inferenceAccelerator != null ? this.inferenceAccelerator.hashCode() : 0);
            result = 31 * result + (this.ipcMode != null ? this.ipcMode.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            result = 31 * result + (this.networkMode != null ? this.networkMode.hashCode() : 0);
            result = 31 * result + (this.pidMode != null ? this.pidMode.hashCode() : 0);
            result = 31 * result + (this.placementConstraints != null ? this.placementConstraints.hashCode() : 0);
            result = 31 * result + (this.proxyConfiguration != null ? this.proxyConfiguration.hashCode() : 0);
            result = 31 * result + (this.requiresCompatibilities != null ? this.requiresCompatibilities.hashCode() : 0);
            result = 31 * result + (this.runtimePlatform != null ? this.runtimePlatform.hashCode() : 0);
            result = 31 * result + (this.skipDestroy != null ? this.skipDestroy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.taskRoleArn != null ? this.taskRoleArn.hashCode() : 0);
            result = 31 * result + (this.trackLatest != null ? this.trackLatest.hashCode() : 0);
            result = 31 * result + (this.volume != null ? this.volume.hashCode() : 0);
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
