package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference")
public class MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEncryptionType() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionType() {
        return software.amazon.jsii.Kernel.get(this, "encryptionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionType", java.util.Objects.requireNonNull(value, "encryptionType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
