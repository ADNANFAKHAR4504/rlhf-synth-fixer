package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.074Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference")
public class PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putContainerOverride(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putContainerOverride", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEphemeralStorage(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage value) {
        software.amazon.jsii.Kernel.call(this, "putEphemeralStorage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInferenceAcceleratorOverride(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInferenceAcceleratorOverride", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContainerOverride() {
        software.amazon.jsii.Kernel.call(this, "resetContainerOverride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpu() {
        software.amazon.jsii.Kernel.call(this, "resetCpu", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralStorage() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralStorage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferenceAcceleratorOverride() {
        software.amazon.jsii.Kernel.call(this, "resetInferenceAcceleratorOverride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemory() {
        software.amazon.jsii.Kernel.call(this, "resetMemory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetTaskRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList getContainerOverride() {
        return software.amazon.jsii.Kernel.get(this, "containerOverride", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference getEphemeralStorage() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList getInferenceAcceleratorOverride() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAcceleratorOverride", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContainerOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "containerOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCpuInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage getEphemeralStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorageInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInferenceAcceleratorOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAcceleratorOverrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMemoryInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "taskRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCpu() {
        return software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCpu(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cpu", java.util.Objects.requireNonNull(value, "cpu is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleArn", java.util.Objects.requireNonNull(value, "executionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMemory() {
        return software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMemory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "memory", java.util.Objects.requireNonNull(value, "memory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "taskRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskRoleArn", java.util.Objects.requireNonNull(value, "taskRoleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverrides getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverrides.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverrides value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
