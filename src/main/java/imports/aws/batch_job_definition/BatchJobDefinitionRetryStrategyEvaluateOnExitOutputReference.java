package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference")
public class BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetOnExitCode() {
        software.amazon.jsii.Kernel.call(this, "resetOnExitCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnReason() {
        software.amazon.jsii.Kernel.call(this, "resetOnReason", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnStatusReason() {
        software.amazon.jsii.Kernel.call(this, "resetOnStatusReason", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnExitCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "onExitCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnReasonInput() {
        return software.amazon.jsii.Kernel.get(this, "onReasonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnStatusReasonInput() {
        return software.amazon.jsii.Kernel.get(this, "onStatusReasonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "action", java.util.Objects.requireNonNull(value, "action is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnExitCode() {
        return software.amazon.jsii.Kernel.get(this, "onExitCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnExitCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onExitCode", java.util.Objects.requireNonNull(value, "onExitCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnReason() {
        return software.amazon.jsii.Kernel.get(this, "onReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnReason(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onReason", java.util.Objects.requireNonNull(value, "onReason is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnStatusReason() {
        return software.amazon.jsii.Kernel.get(this, "onStatusReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnStatusReason(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onStatusReason", java.util.Objects.requireNonNull(value, "onStatusReason is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExit value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
