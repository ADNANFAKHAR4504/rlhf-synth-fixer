package imports.aws.ecs_task_definition;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition aws_ecs_task_definition}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.138Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinition")
public class EcsTaskDefinition extends com.hashicorp.cdktf.TerraformResource {

    protected EcsTaskDefinition(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsTaskDefinition(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ecs_task_definition.EcsTaskDefinition.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition aws_ecs_task_definition} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EcsTaskDefinition(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EcsTaskDefinition resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EcsTaskDefinition to import. This parameter is required.
     * @param importFromId The id of the existing EcsTaskDefinition that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EcsTaskDefinition to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ecs_task_definition.EcsTaskDefinition.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EcsTaskDefinition resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EcsTaskDefinition to import. This parameter is required.
     * @param importFromId The id of the existing EcsTaskDefinition that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ecs_task_definition.EcsTaskDefinition.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEphemeralStorage(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage value) {
        software.amazon.jsii.Kernel.call(this, "putEphemeralStorage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInferenceAccelerator(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAccelerator>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAccelerator> __cast_cd4240 = (java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAccelerator>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAccelerator __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInferenceAccelerator", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraints>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraints> __cast_cd4240 = (java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraints>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraints __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlacementConstraints", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProxyConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putProxyConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRuntimePlatform(final @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform value) {
        software.amazon.jsii.Kernel.call(this, "putRuntimePlatform", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVolume(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionVolume>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionVolume> __cast_cd4240 = (java.util.List<imports.aws.ecs_task_definition.EcsTaskDefinitionVolume>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_task_definition.EcsTaskDefinitionVolume __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVolume", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCpu() {
        software.amazon.jsii.Kernel.call(this, "resetCpu", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableFaultInjection() {
        software.amazon.jsii.Kernel.call(this, "resetEnableFaultInjection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralStorage() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralStorage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferenceAccelerator() {
        software.amazon.jsii.Kernel.call(this, "resetInferenceAccelerator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpcMode() {
        software.amazon.jsii.Kernel.call(this, "resetIpcMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemory() {
        software.amazon.jsii.Kernel.call(this, "resetMemory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkMode() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPidMode() {
        software.amazon.jsii.Kernel.call(this, "resetPidMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementConstraints() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementConstraints", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProxyConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetProxyConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequiresCompatibilities() {
        software.amazon.jsii.Kernel.call(this, "resetRequiresCompatibilities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuntimePlatform() {
        software.amazon.jsii.Kernel.call(this, "resetRuntimePlatform", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetSkipDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetTaskRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrackLatest() {
        software.amazon.jsii.Kernel.call(this, "resetTrackLatest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolume() {
        software.amazon.jsii.Kernel.call(this, "resetVolume", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArnWithoutRevision() {
        return software.amazon.jsii.Kernel.get(this, "arnWithoutRevision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorageOutputReference getEphemeralStorage() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorageOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAcceleratorList getInferenceAccelerator() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAccelerator", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAcceleratorList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraintsList getPlacementConstraints() {
        return software.amazon.jsii.Kernel.get(this, "placementConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraintsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfigurationOutputReference getProxyConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "proxyConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRevision() {
        return software.amazon.jsii.Kernel.get(this, "revision", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatformOutputReference getRuntimePlatform() {
        return software.amazon.jsii.Kernel.get(this, "runtimePlatform", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatformOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeList getVolume() {
        return software.amazon.jsii.Kernel.get(this, "volume", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionVolumeList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerDefinitionsInput() {
        return software.amazon.jsii.Kernel.get(this, "containerDefinitionsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCpuInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableFaultInjectionInput() {
        return software.amazon.jsii.Kernel.get(this, "enableFaultInjectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage getEphemeralStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorageInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFamilyInput() {
        return software.amazon.jsii.Kernel.get(this, "familyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInferenceAcceleratorInput() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAcceleratorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpcModeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipcModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMemoryInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkModeInput() {
        return software.amazon.jsii.Kernel.get(this, "networkModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPidModeInput() {
        return software.amazon.jsii.Kernel.get(this, "pidModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlacementConstraintsInput() {
        return software.amazon.jsii.Kernel.get(this, "placementConstraintsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration getProxyConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "proxyConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRequiresCompatibilitiesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requiresCompatibilitiesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform getRuntimePlatformInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimePlatformInput", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "skipDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "taskRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTrackLatestInput() {
        return software.amazon.jsii.Kernel.get(this, "trackLatestInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVolumeInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerDefinitions() {
        return software.amazon.jsii.Kernel.get(this, "containerDefinitions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainerDefinitions(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containerDefinitions", java.util.Objects.requireNonNull(value, "containerDefinitions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCpu() {
        return software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCpu(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cpu", java.util.Objects.requireNonNull(value, "cpu is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableFaultInjection() {
        return software.amazon.jsii.Kernel.get(this, "enableFaultInjection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableFaultInjection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableFaultInjection", java.util.Objects.requireNonNull(value, "enableFaultInjection is required"));
    }

    public void setEnableFaultInjection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableFaultInjection", java.util.Objects.requireNonNull(value, "enableFaultInjection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleArn", java.util.Objects.requireNonNull(value, "executionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFamily() {
        return software.amazon.jsii.Kernel.get(this, "family", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFamily(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "family", java.util.Objects.requireNonNull(value, "family is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpcMode() {
        return software.amazon.jsii.Kernel.get(this, "ipcMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpcMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipcMode", java.util.Objects.requireNonNull(value, "ipcMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMemory() {
        return software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMemory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "memory", java.util.Objects.requireNonNull(value, "memory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkMode() {
        return software.amazon.jsii.Kernel.get(this, "networkMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkMode", java.util.Objects.requireNonNull(value, "networkMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPidMode() {
        return software.amazon.jsii.Kernel.get(this, "pidMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPidMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pidMode", java.util.Objects.requireNonNull(value, "pidMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRequiresCompatibilities() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "requiresCompatibilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequiresCompatibilities(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requiresCompatibilities", java.util.Objects.requireNonNull(value, "requiresCompatibilities is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipDestroy() {
        return software.amazon.jsii.Kernel.get(this, "skipDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipDestroy", java.util.Objects.requireNonNull(value, "skipDestroy is required"));
    }

    public void setSkipDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipDestroy", java.util.Objects.requireNonNull(value, "skipDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "taskRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskRoleArn", java.util.Objects.requireNonNull(value, "taskRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTrackLatest() {
        return software.amazon.jsii.Kernel.get(this, "trackLatest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTrackLatest(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "trackLatest", java.util.Objects.requireNonNull(value, "trackLatest is required"));
    }

    public void setTrackLatest(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "trackLatest", java.util.Objects.requireNonNull(value, "trackLatest is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ecs_task_definition.EcsTaskDefinition}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ecs_task_definition.EcsTaskDefinition> {
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
        private final imports.aws.ecs_task_definition.EcsTaskDefinitionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ecs_task_definition.EcsTaskDefinitionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#container_definitions EcsTaskDefinition#container_definitions}.
         * <p>
         * @return {@code this}
         * @param containerDefinitions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#container_definitions EcsTaskDefinition#container_definitions}. This parameter is required.
         */
        public Builder containerDefinitions(final java.lang.String containerDefinitions) {
            this.config.containerDefinitions(containerDefinitions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#family EcsTaskDefinition#family}.
         * <p>
         * @return {@code this}
         * @param family Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#family EcsTaskDefinition#family}. This parameter is required.
         */
        public Builder family(final java.lang.String family) {
            this.config.family(family);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#cpu EcsTaskDefinition#cpu}.
         * <p>
         * @return {@code this}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#cpu EcsTaskDefinition#cpu}. This parameter is required.
         */
        public Builder cpu(final java.lang.String cpu) {
            this.config.cpu(cpu);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}.
         * <p>
         * @return {@code this}
         * @param enableFaultInjection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}. This parameter is required.
         */
        public Builder enableFaultInjection(final java.lang.Boolean enableFaultInjection) {
            this.config.enableFaultInjection(enableFaultInjection);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}.
         * <p>
         * @return {@code this}
         * @param enableFaultInjection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#enable_fault_injection EcsTaskDefinition#enable_fault_injection}. This parameter is required.
         */
        public Builder enableFaultInjection(final com.hashicorp.cdktf.IResolvable enableFaultInjection) {
            this.config.enableFaultInjection(enableFaultInjection);
            return this;
        }

        /**
         * ephemeral_storage block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ephemeral_storage EcsTaskDefinition#ephemeral_storage}
         * <p>
         * @return {@code this}
         * @param ephemeralStorage ephemeral_storage block. This parameter is required.
         */
        public Builder ephemeralStorage(final imports.aws.ecs_task_definition.EcsTaskDefinitionEphemeralStorage ephemeralStorage) {
            this.config.ephemeralStorage(ephemeralStorage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#execution_role_arn EcsTaskDefinition#execution_role_arn}.
         * <p>
         * @return {@code this}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#execution_role_arn EcsTaskDefinition#execution_role_arn}. This parameter is required.
         */
        public Builder executionRoleArn(final java.lang.String executionRoleArn) {
            this.config.executionRoleArn(executionRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#id EcsTaskDefinition#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#id EcsTaskDefinition#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * inference_accelerator block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#inference_accelerator EcsTaskDefinition#inference_accelerator}
         * <p>
         * @return {@code this}
         * @param inferenceAccelerator inference_accelerator block. This parameter is required.
         */
        public Builder inferenceAccelerator(final com.hashicorp.cdktf.IResolvable inferenceAccelerator) {
            this.config.inferenceAccelerator(inferenceAccelerator);
            return this;
        }
        /**
         * inference_accelerator block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#inference_accelerator EcsTaskDefinition#inference_accelerator}
         * <p>
         * @return {@code this}
         * @param inferenceAccelerator inference_accelerator block. This parameter is required.
         */
        public Builder inferenceAccelerator(final java.util.List<? extends imports.aws.ecs_task_definition.EcsTaskDefinitionInferenceAccelerator> inferenceAccelerator) {
            this.config.inferenceAccelerator(inferenceAccelerator);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ipc_mode EcsTaskDefinition#ipc_mode}.
         * <p>
         * @return {@code this}
         * @param ipcMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#ipc_mode EcsTaskDefinition#ipc_mode}. This parameter is required.
         */
        public Builder ipcMode(final java.lang.String ipcMode) {
            this.config.ipcMode(ipcMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#memory EcsTaskDefinition#memory}.
         * <p>
         * @return {@code this}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#memory EcsTaskDefinition#memory}. This parameter is required.
         */
        public Builder memory(final java.lang.String memory) {
            this.config.memory(memory);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#network_mode EcsTaskDefinition#network_mode}.
         * <p>
         * @return {@code this}
         * @param networkMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#network_mode EcsTaskDefinition#network_mode}. This parameter is required.
         */
        public Builder networkMode(final java.lang.String networkMode) {
            this.config.networkMode(networkMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#pid_mode EcsTaskDefinition#pid_mode}.
         * <p>
         * @return {@code this}
         * @param pidMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#pid_mode EcsTaskDefinition#pid_mode}. This parameter is required.
         */
        public Builder pidMode(final java.lang.String pidMode) {
            this.config.pidMode(pidMode);
            return this;
        }

        /**
         * placement_constraints block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#placement_constraints EcsTaskDefinition#placement_constraints}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#placement_constraints EcsTaskDefinition#placement_constraints}
         * <p>
         * @return {@code this}
         * @param placementConstraints placement_constraints block. This parameter is required.
         */
        public Builder placementConstraints(final java.util.List<? extends imports.aws.ecs_task_definition.EcsTaskDefinitionPlacementConstraints> placementConstraints) {
            this.config.placementConstraints(placementConstraints);
            return this;
        }

        /**
         * proxy_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#proxy_configuration EcsTaskDefinition#proxy_configuration}
         * <p>
         * @return {@code this}
         * @param proxyConfiguration proxy_configuration block. This parameter is required.
         */
        public Builder proxyConfiguration(final imports.aws.ecs_task_definition.EcsTaskDefinitionProxyConfiguration proxyConfiguration) {
            this.config.proxyConfiguration(proxyConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#requires_compatibilities EcsTaskDefinition#requires_compatibilities}.
         * <p>
         * @return {@code this}
         * @param requiresCompatibilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#requires_compatibilities EcsTaskDefinition#requires_compatibilities}. This parameter is required.
         */
        public Builder requiresCompatibilities(final java.util.List<java.lang.String> requiresCompatibilities) {
            this.config.requiresCompatibilities(requiresCompatibilities);
            return this;
        }

        /**
         * runtime_platform block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#runtime_platform EcsTaskDefinition#runtime_platform}
         * <p>
         * @return {@code this}
         * @param runtimePlatform runtime_platform block. This parameter is required.
         */
        public Builder runtimePlatform(final imports.aws.ecs_task_definition.EcsTaskDefinitionRuntimePlatform runtimePlatform) {
            this.config.runtimePlatform(runtimePlatform);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}.
         * <p>
         * @return {@code this}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}. This parameter is required.
         */
        public Builder skipDestroy(final java.lang.Boolean skipDestroy) {
            this.config.skipDestroy(skipDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}.
         * <p>
         * @return {@code this}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#skip_destroy EcsTaskDefinition#skip_destroy}. This parameter is required.
         */
        public Builder skipDestroy(final com.hashicorp.cdktf.IResolvable skipDestroy) {
            this.config.skipDestroy(skipDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags EcsTaskDefinition#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags EcsTaskDefinition#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags_all EcsTaskDefinition#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#tags_all EcsTaskDefinition#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#task_role_arn EcsTaskDefinition#task_role_arn}.
         * <p>
         * @return {@code this}
         * @param taskRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#task_role_arn EcsTaskDefinition#task_role_arn}. This parameter is required.
         */
        public Builder taskRoleArn(final java.lang.String taskRoleArn) {
            this.config.taskRoleArn(taskRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}.
         * <p>
         * @return {@code this}
         * @param trackLatest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}. This parameter is required.
         */
        public Builder trackLatest(final java.lang.Boolean trackLatest) {
            this.config.trackLatest(trackLatest);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}.
         * <p>
         * @return {@code this}
         * @param trackLatest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#track_latest EcsTaskDefinition#track_latest}. This parameter is required.
         */
        public Builder trackLatest(final com.hashicorp.cdktf.IResolvable trackLatest) {
            this.config.trackLatest(trackLatest);
            return this;
        }

        /**
         * volume block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#volume EcsTaskDefinition#volume}
         * <p>
         * @return {@code this}
         * @param volume volume block. This parameter is required.
         */
        public Builder volume(final com.hashicorp.cdktf.IResolvable volume) {
            this.config.volume(volume);
            return this;
        }
        /**
         * volume block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#volume EcsTaskDefinition#volume}
         * <p>
         * @return {@code this}
         * @param volume volume block. This parameter is required.
         */
        public Builder volume(final java.util.List<? extends imports.aws.ecs_task_definition.EcsTaskDefinitionVolume> volume) {
            this.config.volume(volume);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ecs_task_definition.EcsTaskDefinition}.
         */
        @Override
        public imports.aws.ecs_task_definition.EcsTaskDefinition build() {
            return new imports.aws.ecs_task_definition.EcsTaskDefinition(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
