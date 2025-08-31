package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference")
public class PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEnvironment(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEnvironment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceRequirement(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceRequirement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCommand() {
        software.amazon.jsii.Kernel.call(this, "resetCommand", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironment() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceRequirement() {
        software.amazon.jsii.Kernel.call(this, "resetResourceRequirement", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList getEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList getResourceRequirement() {
        return software.amazon.jsii.Kernel.get(this, "resourceRequirement", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommandInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "commandInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnvironmentInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceRequirementInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceRequirementInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCommand() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCommand(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "command", java.util.Objects.requireNonNull(value, "command is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
