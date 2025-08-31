package imports.aws.data_aws_ecs_task_execution;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution aws_ecs_task_execution}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.629Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecution")
public class DataAwsEcsTaskExecution extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsEcsTaskExecution(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEcsTaskExecution(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution aws_ecs_task_execution} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsEcsTaskExecution(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEcsTaskExecution resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEcsTaskExecution to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEcsTaskExecution that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsEcsTaskExecution to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEcsTaskExecution resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEcsTaskExecution to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEcsTaskExecution that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCapacityProviderStrategy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategy> __cast_cd4240 = (java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCapacityProviderStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOverrides(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides value) {
        software.amazon.jsii.Kernel.call(this, "putOverrides", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlacementConstraints(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraints>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraints> __cast_cd4240 = (java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraints>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraints __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlacementConstraints", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlacementStrategy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategy> __cast_cd4240 = (java.util.List<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlacementStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCapacityProviderStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityProviderStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientToken() {
        software.amazon.jsii.Kernel.call(this, "resetClientToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredCount() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableEcsManagedTags() {
        software.amazon.jsii.Kernel.call(this, "resetEnableEcsManagedTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableExecuteCommand() {
        software.amazon.jsii.Kernel.call(this, "resetEnableExecuteCommand", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroup() {
        software.amazon.jsii.Kernel.call(this, "resetGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchType() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementConstraints() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementConstraints", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlatformVersion() {
        software.amazon.jsii.Kernel.call(this, "resetPlatformVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPropagateTags() {
        software.amazon.jsii.Kernel.call(this, "resetPropagateTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReferenceId() {
        software.amazon.jsii.Kernel.call(this, "resetReferenceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartedBy() {
        software.amazon.jsii.Kernel.call(this, "resetStartedBy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategyList getCapacityProviderStrategy() {
        return software.amazon.jsii.Kernel.get(this, "capacityProviderStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfigurationOutputReference getNetworkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverridesOutputReference getOverrides() {
        return software.amazon.jsii.Kernel.get(this, "overrides", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverridesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraintsList getPlacementConstraints() {
        return software.amazon.jsii.Kernel.get(this, "placementConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraintsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategyList getPlacementStrategy() {
        return software.amazon.jsii.Kernel.get(this, "placementStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategyList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTaskArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "taskArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCapacityProviderStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityProviderStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "clientTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredCountInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableEcsManagedTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "enableEcsManagedTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableExecuteCommandInput() {
        return software.amazon.jsii.Kernel.get(this, "enableExecuteCommandInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "groupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration getNetworkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "networkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides getOverridesInput() {
        return software.amazon.jsii.Kernel.get(this, "overridesInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlacementConstraintsInput() {
        return software.amazon.jsii.Kernel.get(this, "placementConstraintsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlacementStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "placementStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "platformVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPropagateTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "propagateTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReferenceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "referenceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartedByInput() {
        return software.amazon.jsii.Kernel.get(this, "startedByInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "taskDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientToken() {
        return software.amazon.jsii.Kernel.get(this, "clientToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientToken", java.util.Objects.requireNonNull(value, "clientToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCluster() {
        return software.amazon.jsii.Kernel.get(this, "cluster", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCluster(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cluster", java.util.Objects.requireNonNull(value, "cluster is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredCount() {
        return software.amazon.jsii.Kernel.get(this, "desiredCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredCount", java.util.Objects.requireNonNull(value, "desiredCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableEcsManagedTags() {
        return software.amazon.jsii.Kernel.get(this, "enableEcsManagedTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableEcsManagedTags(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableEcsManagedTags", java.util.Objects.requireNonNull(value, "enableEcsManagedTags is required"));
    }

    public void setEnableEcsManagedTags(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableEcsManagedTags", java.util.Objects.requireNonNull(value, "enableEcsManagedTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableExecuteCommand() {
        return software.amazon.jsii.Kernel.get(this, "enableExecuteCommand", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableExecuteCommand(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableExecuteCommand", java.util.Objects.requireNonNull(value, "enableExecuteCommand is required"));
    }

    public void setEnableExecuteCommand(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableExecuteCommand", java.util.Objects.requireNonNull(value, "enableExecuteCommand is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroup() {
        return software.amazon.jsii.Kernel.get(this, "group", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "group", java.util.Objects.requireNonNull(value, "group is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchType() {
        return software.amazon.jsii.Kernel.get(this, "launchType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchType", java.util.Objects.requireNonNull(value, "launchType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformVersion() {
        return software.amazon.jsii.Kernel.get(this, "platformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatformVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platformVersion", java.util.Objects.requireNonNull(value, "platformVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPropagateTags() {
        return software.amazon.jsii.Kernel.get(this, "propagateTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPropagateTags(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "propagateTags", java.util.Objects.requireNonNull(value, "propagateTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReferenceId() {
        return software.amazon.jsii.Kernel.get(this, "referenceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReferenceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "referenceId", java.util.Objects.requireNonNull(value, "referenceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartedBy() {
        return software.amazon.jsii.Kernel.get(this, "startedBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartedBy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startedBy", java.util.Objects.requireNonNull(value, "startedBy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskDefinition() {
        return software.amazon.jsii.Kernel.get(this, "taskDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskDefinition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskDefinition", java.util.Objects.requireNonNull(value, "taskDefinition is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cluster DataAwsEcsTaskExecution#cluster}.
         * <p>
         * @return {@code this}
         * @param cluster Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cluster DataAwsEcsTaskExecution#cluster}. This parameter is required.
         */
        public Builder cluster(final java.lang.String cluster) {
            this.config.cluster(cluster);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#task_definition DataAwsEcsTaskExecution#task_definition}.
         * <p>
         * @return {@code this}
         * @param taskDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#task_definition DataAwsEcsTaskExecution#task_definition}. This parameter is required.
         */
        public Builder taskDefinition(final java.lang.String taskDefinition) {
            this.config.taskDefinition(taskDefinition);
            return this;
        }

        /**
         * capacity_provider_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#capacity_provider_strategy DataAwsEcsTaskExecution#capacity_provider_strategy}
         * <p>
         * @return {@code this}
         * @param capacityProviderStrategy capacity_provider_strategy block. This parameter is required.
         */
        public Builder capacityProviderStrategy(final com.hashicorp.cdktf.IResolvable capacityProviderStrategy) {
            this.config.capacityProviderStrategy(capacityProviderStrategy);
            return this;
        }
        /**
         * capacity_provider_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#capacity_provider_strategy DataAwsEcsTaskExecution#capacity_provider_strategy}
         * <p>
         * @return {@code this}
         * @param capacityProviderStrategy capacity_provider_strategy block. This parameter is required.
         */
        public Builder capacityProviderStrategy(final java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionCapacityProviderStrategy> capacityProviderStrategy) {
            this.config.capacityProviderStrategy(capacityProviderStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#client_token DataAwsEcsTaskExecution#client_token}.
         * <p>
         * @return {@code this}
         * @param clientToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#client_token DataAwsEcsTaskExecution#client_token}. This parameter is required.
         */
        public Builder clientToken(final java.lang.String clientToken) {
            this.config.clientToken(clientToken);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#desired_count DataAwsEcsTaskExecution#desired_count}.
         * <p>
         * @return {@code this}
         * @param desiredCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#desired_count DataAwsEcsTaskExecution#desired_count}. This parameter is required.
         */
        public Builder desiredCount(final java.lang.Number desiredCount) {
            this.config.desiredCount(desiredCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}.
         * <p>
         * @return {@code this}
         * @param enableEcsManagedTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}. This parameter is required.
         */
        public Builder enableEcsManagedTags(final java.lang.Boolean enableEcsManagedTags) {
            this.config.enableEcsManagedTags(enableEcsManagedTags);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}.
         * <p>
         * @return {@code this}
         * @param enableEcsManagedTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_ecs_managed_tags DataAwsEcsTaskExecution#enable_ecs_managed_tags}. This parameter is required.
         */
        public Builder enableEcsManagedTags(final com.hashicorp.cdktf.IResolvable enableEcsManagedTags) {
            this.config.enableEcsManagedTags(enableEcsManagedTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}.
         * <p>
         * @return {@code this}
         * @param enableExecuteCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}. This parameter is required.
         */
        public Builder enableExecuteCommand(final java.lang.Boolean enableExecuteCommand) {
            this.config.enableExecuteCommand(enableExecuteCommand);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}.
         * <p>
         * @return {@code this}
         * @param enableExecuteCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#enable_execute_command DataAwsEcsTaskExecution#enable_execute_command}. This parameter is required.
         */
        public Builder enableExecuteCommand(final com.hashicorp.cdktf.IResolvable enableExecuteCommand) {
            this.config.enableExecuteCommand(enableExecuteCommand);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#group DataAwsEcsTaskExecution#group}.
         * <p>
         * @return {@code this}
         * @param group Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#group DataAwsEcsTaskExecution#group}. This parameter is required.
         */
        public Builder group(final java.lang.String group) {
            this.config.group(group);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#id DataAwsEcsTaskExecution#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#id DataAwsEcsTaskExecution#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#launch_type DataAwsEcsTaskExecution#launch_type}.
         * <p>
         * @return {@code this}
         * @param launchType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#launch_type DataAwsEcsTaskExecution#launch_type}. This parameter is required.
         */
        public Builder launchType(final java.lang.String launchType) {
            this.config.launchType(launchType);
            return this;
        }

        /**
         * network_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#network_configuration DataAwsEcsTaskExecution#network_configuration}
         * <p>
         * @return {@code this}
         * @param networkConfiguration network_configuration block. This parameter is required.
         */
        public Builder networkConfiguration(final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionNetworkConfiguration networkConfiguration) {
            this.config.networkConfiguration(networkConfiguration);
            return this;
        }

        /**
         * overrides block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#overrides DataAwsEcsTaskExecution#overrides}
         * <p>
         * @return {@code this}
         * @param overrides overrides block. This parameter is required.
         */
        public Builder overrides(final imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverrides overrides) {
            this.config.overrides(overrides);
            return this;
        }

        /**
         * placement_constraints block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_constraints DataAwsEcsTaskExecution#placement_constraints}
         * <p>
         * @return {@code this}
         * @param placementConstraints placement_constraints block. This parameter is required.
         */
        public Builder placementConstraints(final com.hashicorp.cdktf.IResolvable placementConstraints) {
            this.config.placementConstraints(placementConstraints);
            return this;
        }
        /**
         * placement_constraints block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_constraints DataAwsEcsTaskExecution#placement_constraints}
         * <p>
         * @return {@code this}
         * @param placementConstraints placement_constraints block. This parameter is required.
         */
        public Builder placementConstraints(final java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementConstraints> placementConstraints) {
            this.config.placementConstraints(placementConstraints);
            return this;
        }

        /**
         * placement_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_strategy DataAwsEcsTaskExecution#placement_strategy}
         * <p>
         * @return {@code this}
         * @param placementStrategy placement_strategy block. This parameter is required.
         */
        public Builder placementStrategy(final com.hashicorp.cdktf.IResolvable placementStrategy) {
            this.config.placementStrategy(placementStrategy);
            return this;
        }
        /**
         * placement_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#placement_strategy DataAwsEcsTaskExecution#placement_strategy}
         * <p>
         * @return {@code this}
         * @param placementStrategy placement_strategy block. This parameter is required.
         */
        public Builder placementStrategy(final java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionPlacementStrategy> placementStrategy) {
            this.config.placementStrategy(placementStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#platform_version DataAwsEcsTaskExecution#platform_version}.
         * <p>
         * @return {@code this}
         * @param platformVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#platform_version DataAwsEcsTaskExecution#platform_version}. This parameter is required.
         */
        public Builder platformVersion(final java.lang.String platformVersion) {
            this.config.platformVersion(platformVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#propagate_tags DataAwsEcsTaskExecution#propagate_tags}.
         * <p>
         * @return {@code this}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#propagate_tags DataAwsEcsTaskExecution#propagate_tags}. This parameter is required.
         */
        public Builder propagateTags(final java.lang.String propagateTags) {
            this.config.propagateTags(propagateTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#reference_id DataAwsEcsTaskExecution#reference_id}.
         * <p>
         * @return {@code this}
         * @param referenceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#reference_id DataAwsEcsTaskExecution#reference_id}. This parameter is required.
         */
        public Builder referenceId(final java.lang.String referenceId) {
            this.config.referenceId(referenceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#started_by DataAwsEcsTaskExecution#started_by}.
         * <p>
         * @return {@code this}
         * @param startedBy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#started_by DataAwsEcsTaskExecution#started_by}. This parameter is required.
         */
        public Builder startedBy(final java.lang.String startedBy) {
            this.config.startedBy(startedBy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#tags DataAwsEcsTaskExecution#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#tags DataAwsEcsTaskExecution#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution}.
         */
        @Override
        public imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution build() {
            return new imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecution(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
