package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorCapacityProvisionedCapacityOutputReference")
public class MskconnectConnectorCapacityProvisionedCapacityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorCapacityProvisionedCapacityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorCapacityProvisionedCapacityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorCapacityProvisionedCapacityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMcuCount() {
        software.amazon.jsii.Kernel.call(this, "resetMcuCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMcuCountInput() {
        return software.amazon.jsii.Kernel.get(this, "mcuCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWorkerCountInput() {
        return software.amazon.jsii.Kernel.get(this, "workerCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMcuCount() {
        return software.amazon.jsii.Kernel.get(this, "mcuCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMcuCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "mcuCount", java.util.Objects.requireNonNull(value, "mcuCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWorkerCount() {
        return software.amazon.jsii.Kernel.get(this, "workerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWorkerCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "workerCount", java.util.Objects.requireNonNull(value, "workerCount is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacityProvisionedCapacity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
