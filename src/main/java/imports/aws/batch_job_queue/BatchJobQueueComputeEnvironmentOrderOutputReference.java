package imports.aws.batch_job_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.135Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobQueue.BatchJobQueueComputeEnvironmentOrderOutputReference")
public class BatchJobQueueComputeEnvironmentOrderOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobQueueComputeEnvironmentOrderOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobQueueComputeEnvironmentOrderOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BatchJobQueueComputeEnvironmentOrderOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeEnvironmentInput() {
        return software.amazon.jsii.Kernel.get(this, "computeEnvironmentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOrderInput() {
        return software.amazon.jsii.Kernel.get(this, "orderInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "computeEnvironment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeEnvironment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeEnvironment", java.util.Objects.requireNonNull(value, "computeEnvironment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOrder() {
        return software.amazon.jsii.Kernel.get(this, "order", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOrder(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "order", java.util.Objects.requireNonNull(value, "order is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_queue.BatchJobQueueComputeEnvironmentOrder value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
