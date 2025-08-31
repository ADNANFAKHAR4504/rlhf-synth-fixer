package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorLogDeliveryOutputReference")
public class MskconnectConnectorLogDeliveryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorLogDeliveryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorLogDeliveryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorLogDeliveryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putWorkerLogDelivery(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery value) {
        software.amazon.jsii.Kernel.call(this, "putWorkerLogDelivery", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryOutputReference getWorkerLogDelivery() {
        return software.amazon.jsii.Kernel.get(this, "workerLogDelivery", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery getWorkerLogDeliveryInput() {
        return software.amazon.jsii.Kernel.get(this, "workerLogDeliveryInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDelivery.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
