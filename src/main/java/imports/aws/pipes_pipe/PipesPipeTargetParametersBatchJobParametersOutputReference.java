package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersOutputReference")
public class PipesPipeTargetParametersBatchJobParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersBatchJobParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersBatchJobParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersBatchJobParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putArrayProperties(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties value) {
        software.amazon.jsii.Kernel.call(this, "putArrayProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putContainerOverrides(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides value) {
        software.amazon.jsii.Kernel.call(this, "putContainerOverrides", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDependsOn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOn> __cast_cd4240 = (java.util.List<imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDependsOn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetryStrategy(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy value) {
        software.amazon.jsii.Kernel.call(this, "putRetryStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArrayProperties() {
        software.amazon.jsii.Kernel.call(this, "resetArrayProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContainerOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetContainerOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDependsOn() {
        software.amazon.jsii.Kernel.call(this, "resetDependsOn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetRetryStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference getArrayProperties() {
        return software.amazon.jsii.Kernel.get(this, "arrayProperties", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference getContainerOverrides() {
        return software.amazon.jsii.Kernel.get(this, "containerOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOnList getDependsOn() {
        return software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference getRetryStrategy() {
        return software.amazon.jsii.Kernel.get(this, "retryStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties getArrayPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "arrayPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides getContainerOverridesInput() {
        return software.amazon.jsii.Kernel.get(this, "containerOverridesInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDependsOnInput() {
        return software.amazon.jsii.Kernel.get(this, "dependsOnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "jobDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobNameInput() {
        return software.amazon.jsii.Kernel.get(this, "jobNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy getRetryStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "retryStrategyInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobDefinition() {
        return software.amazon.jsii.Kernel.get(this, "jobDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobDefinition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobDefinition", java.util.Objects.requireNonNull(value, "jobDefinition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobName() {
        return software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobName", java.util.Objects.requireNonNull(value, "jobName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
