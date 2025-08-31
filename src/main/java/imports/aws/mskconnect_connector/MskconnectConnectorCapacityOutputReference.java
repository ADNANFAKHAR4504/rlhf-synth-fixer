package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacityOutputReference")
public class MskconnectConnectorCapacityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorCapacityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorCapacityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorCapacityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAutoscaling(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling value) {
        software.amazon.jsii.Kernel.call(this, "putAutoscaling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProvisionedCapacity(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity value) {
        software.amazon.jsii.Kernel.call(this, "putProvisionedCapacity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoscaling() {
        software.amazon.jsii.Kernel.call(this, "resetAutoscaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisionedCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetProvisionedCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingOutputReference getAutoscaling() {
        return software.amazon.jsii.Kernel.get(this, "autoscaling", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscalingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacityOutputReference getProvisionedCapacity() {
        return software.amazon.jsii.Kernel.get(this, "provisionedCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacityOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling getAutoscalingInput() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityAutoscaling.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity getProvisionedCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "provisionedCapacityInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
