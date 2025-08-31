package imports.aws.lb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.530Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListener.LbListenerMutualAuthenticationOutputReference")
public class LbListenerMutualAuthenticationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbListenerMutualAuthenticationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbListenerMutualAuthenticationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LbListenerMutualAuthenticationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAdvertiseTrustStoreCaNames() {
        software.amazon.jsii.Kernel.call(this, "resetAdvertiseTrustStoreCaNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnoreClientCertificateExpiry() {
        software.amazon.jsii.Kernel.call(this, "resetIgnoreClientCertificateExpiry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrustStoreArn() {
        software.amazon.jsii.Kernel.call(this, "resetTrustStoreArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdvertiseTrustStoreCaNamesInput() {
        return software.amazon.jsii.Kernel.get(this, "advertiseTrustStoreCaNamesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreClientCertificateExpiryInput() {
        return software.amazon.jsii.Kernel.get(this, "ignoreClientCertificateExpiryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModeInput() {
        return software.amazon.jsii.Kernel.get(this, "modeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustStoreArnInput() {
        return software.amazon.jsii.Kernel.get(this, "trustStoreArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdvertiseTrustStoreCaNames() {
        return software.amazon.jsii.Kernel.get(this, "advertiseTrustStoreCaNames", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdvertiseTrustStoreCaNames(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "advertiseTrustStoreCaNames", java.util.Objects.requireNonNull(value, "advertiseTrustStoreCaNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIgnoreClientCertificateExpiry() {
        return software.amazon.jsii.Kernel.get(this, "ignoreClientCertificateExpiry", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIgnoreClientCertificateExpiry(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ignoreClientCertificateExpiry", java.util.Objects.requireNonNull(value, "ignoreClientCertificateExpiry is required"));
    }

    public void setIgnoreClientCertificateExpiry(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ignoreClientCertificateExpiry", java.util.Objects.requireNonNull(value, "ignoreClientCertificateExpiry is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMode() {
        return software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mode", java.util.Objects.requireNonNull(value, "mode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustStoreArn() {
        return software.amazon.jsii.Kernel.get(this, "trustStoreArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustStoreArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustStoreArn", java.util.Objects.requireNonNull(value, "trustStoreArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerMutualAuthentication getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerMutualAuthentication.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerMutualAuthentication value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
