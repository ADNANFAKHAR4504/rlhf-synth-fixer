package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacityAutoscalingOutputReference")
public class MskconnectConnectorCapacityAutoscalingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorCapacityAutoscalingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorCapacityAutoscalingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorCapacityAutoscalingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putScaleInPolicy(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putScaleInPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScaleOutPolicy(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putScaleOutPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMcuCount() {
        software.amazon.jsii.Kernel.call(this, "resetMcuCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScaleInPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetScaleInPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScaleOutPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetScaleOutPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicyOutputReference getScaleInPolicy() {
        return software.amazon.jsii.Kernel.get(this, "scaleInPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference getScaleOutPolicy() {
        return software.amazon.jsii.Kernel.get(this, "scaleOutPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxWorkerCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maxWorkerCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMcuCountInput() {
        return software.amazon.jsii.Kernel.get(this, "mcuCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinWorkerCountInput() {
        return software.amazon.jsii.Kernel.get(this, "minWorkerCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy getScaleInPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleInPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleInPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy getScaleOutPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleOutPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxWorkerCount() {
        return software.amazon.jsii.Kernel.get(this, "maxWorkerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxWorkerCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxWorkerCount", java.util.Objects.requireNonNull(value, "maxWorkerCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMcuCount() {
        return software.amazon.jsii.Kernel.get(this, "mcuCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMcuCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "mcuCount", java.util.Objects.requireNonNull(value, "mcuCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinWorkerCount() {
        return software.amazon.jsii.Kernel.get(this, "minWorkerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinWorkerCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minWorkerCount", java.util.Objects.requireNonNull(value, "minWorkerCount is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
