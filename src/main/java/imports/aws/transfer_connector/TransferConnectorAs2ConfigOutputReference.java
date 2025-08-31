package imports.aws.transfer_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.563Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferConnector.TransferConnectorAs2ConfigOutputReference")
public class TransferConnectorAs2ConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferConnectorAs2ConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferConnectorAs2ConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferConnectorAs2ConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMdnSigningAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetMdnSigningAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageSubject() {
        software.amazon.jsii.Kernel.call(this, "resetMessageSubject", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompressionInput() {
        return software.amazon.jsii.Kernel.get(this, "compressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalProfileIdInput() {
        return software.amazon.jsii.Kernel.get(this, "localProfileIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMdnResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "mdnResponseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMdnSigningAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "mdnSigningAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageSubjectInput() {
        return software.amazon.jsii.Kernel.get(this, "messageSubjectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPartnerProfileIdInput() {
        return software.amazon.jsii.Kernel.get(this, "partnerProfileIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSigningAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "signingAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompression() {
        return software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compression", java.util.Objects.requireNonNull(value, "compression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionAlgorithm", java.util.Objects.requireNonNull(value, "encryptionAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalProfileId() {
        return software.amazon.jsii.Kernel.get(this, "localProfileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalProfileId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localProfileId", java.util.Objects.requireNonNull(value, "localProfileId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMdnResponse() {
        return software.amazon.jsii.Kernel.get(this, "mdnResponse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMdnResponse(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mdnResponse", java.util.Objects.requireNonNull(value, "mdnResponse is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMdnSigningAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "mdnSigningAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMdnSigningAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mdnSigningAlgorithm", java.util.Objects.requireNonNull(value, "mdnSigningAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageSubject() {
        return software.amazon.jsii.Kernel.get(this, "messageSubject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageSubject(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageSubject", java.util.Objects.requireNonNull(value, "messageSubject is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPartnerProfileId() {
        return software.amazon.jsii.Kernel.get(this, "partnerProfileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPartnerProfileId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "partnerProfileId", java.util.Objects.requireNonNull(value, "partnerProfileId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "signingAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSigningAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "signingAlgorithm", java.util.Objects.requireNonNull(value, "signingAlgorithm is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_connector.TransferConnectorAs2Config getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_connector.TransferConnectorAs2Config.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_connector.TransferConnectorAs2Config value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
