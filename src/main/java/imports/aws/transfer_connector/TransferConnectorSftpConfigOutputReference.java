package imports.aws.transfer_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.563Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferConnector.TransferConnectorSftpConfigOutputReference")
public class TransferConnectorSftpConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferConnectorSftpConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferConnectorSftpConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferConnectorSftpConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTrustedHostKeys() {
        software.amazon.jsii.Kernel.call(this, "resetTrustedHostKeys", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserSecretId() {
        software.amazon.jsii.Kernel.call(this, "resetUserSecretId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTrustedHostKeysInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "trustedHostKeysInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserSecretIdInput() {
        return software.amazon.jsii.Kernel.get(this, "userSecretIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTrustedHostKeys() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "trustedHostKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTrustedHostKeys(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "trustedHostKeys", java.util.Objects.requireNonNull(value, "trustedHostKeys is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserSecretId() {
        return software.amazon.jsii.Kernel.get(this, "userSecretId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserSecretId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userSecretId", java.util.Objects.requireNonNull(value, "userSecretId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_connector.TransferConnectorSftpConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_connector.TransferConnectorSftpConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_connector.TransferConnectorSftpConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
