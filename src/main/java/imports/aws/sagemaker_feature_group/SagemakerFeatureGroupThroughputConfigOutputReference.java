package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupThroughputConfigOutputReference")
public class SagemakerFeatureGroupThroughputConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFeatureGroupThroughputConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFeatureGroupThroughputConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFeatureGroupThroughputConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetProvisionedReadCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetProvisionedReadCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisionedWriteCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetProvisionedWriteCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThroughputMode() {
        software.amazon.jsii.Kernel.call(this, "resetThroughputMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedReadCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "provisionedReadCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedWriteCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "provisionedWriteCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThroughputModeInput() {
        return software.amazon.jsii.Kernel.get(this, "throughputModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedReadCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "provisionedReadCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProvisionedReadCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "provisionedReadCapacityUnits", java.util.Objects.requireNonNull(value, "provisionedReadCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedWriteCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "provisionedWriteCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProvisionedWriteCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "provisionedWriteCapacityUnits", java.util.Objects.requireNonNull(value, "provisionedWriteCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThroughputMode() {
        return software.amazon.jsii.Kernel.get(this, "throughputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThroughputMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "throughputMode", java.util.Objects.requireNonNull(value, "throughputMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupThroughputConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
