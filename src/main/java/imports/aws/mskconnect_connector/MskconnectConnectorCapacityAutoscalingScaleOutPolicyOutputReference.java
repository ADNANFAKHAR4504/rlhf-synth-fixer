package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference")
public class MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorCapacityAutoscalingScaleOutPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCpuUtilizationPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetCpuUtilizationPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuUtilizationPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuUtilizationPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCpuUtilizationPercentage() {
        return software.amazon.jsii.Kernel.get(this, "cpuUtilizationPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCpuUtilizationPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cpuUtilizationPercentage", java.util.Objects.requireNonNull(value, "cpuUtilizationPercentage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingScaleOutPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
