package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOutputReference")
public class PipesPipeTargetParametersEcsTaskParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersEcsTaskParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersEcsTaskParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersEcsTaskParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCapacityProviderStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOverrides(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverrides value) {
        software.amazon.jsii.Kernel.call(this, "putOverrides", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlacementConstraint(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraint>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraint> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraint>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraint __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlacementConstraint", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategy> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlacementStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCapacityProviderStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityProviderStrategy", software.amazon.jsii.NativeType.VOID);
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

    public void resetLaunchType() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementConstraint() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementConstraint", software.amazon.jsii.NativeType.VOID);
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

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskCount() {
        software.amazon.jsii.Kernel.call(this, "resetTaskCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList getCapacityProviderStrategy() {
        return software.amazon.jsii.Kernel.get(this, "capacityProviderStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference getNetworkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference getOverrides() {
        return software.amazon.jsii.Kernel.get(this, "overrides", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList getPlacementConstraint() {
        return software.amazon.jsii.Kernel.get(this, "placementConstraint", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList getPlacementStrategy() {
        return software.amazon.jsii.Kernel.get(this, "placementStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCapacityProviderStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityProviderStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration getNetworkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "networkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverrides getOverridesInput() {
        return software.amazon.jsii.Kernel.get(this, "overridesInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverrides.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlacementConstraintInput() {
        return software.amazon.jsii.Kernel.get(this, "placementConstraintInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTaskCountInput() {
        return software.amazon.jsii.Kernel.get(this, "taskCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskDefinitionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "taskDefinitionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTaskCount() {
        return software.amazon.jsii.Kernel.get(this, "taskCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTaskCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "taskCount", java.util.Objects.requireNonNull(value, "taskCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskDefinitionArn() {
        return software.amazon.jsii.Kernel.get(this, "taskDefinitionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskDefinitionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskDefinitionArn", java.util.Objects.requireNonNull(value, "taskDefinitionArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
