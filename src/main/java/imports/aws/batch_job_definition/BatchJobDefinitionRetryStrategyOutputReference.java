package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionRetryStrategyOutputReference")
public class BatchJobDefinitionRetryStrategyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionRetryStrategyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionRetryStrategyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BatchJobDefinitionRetryStrategyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEvaluateOnExit(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExit>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExit> __cast_cd4240 = (java.util.List<imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExit>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExit __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEvaluateOnExit", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAttempts() {
        software.amazon.jsii.Kernel.call(this, "resetAttempts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEvaluateOnExit() {
        software.amazon.jsii.Kernel.call(this, "resetEvaluateOnExit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExitList getEvaluateOnExit() {
        return software.amazon.jsii.Kernel.get(this, "evaluateOnExit", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExitList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAttemptsInput() {
        return software.amazon.jsii.Kernel.get(this, "attemptsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEvaluateOnExitInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluateOnExitInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAttempts() {
        return software.amazon.jsii.Kernel.get(this, "attempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAttempts(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "attempts", java.util.Objects.requireNonNull(value, "attempts is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
