package imports.aws.elb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.190Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elb.ElbListenerOutputReference")
public class ElbListenerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElbListenerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElbListenerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ElbListenerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetSslCertificateId() {
        software.amazon.jsii.Kernel.call(this, "resetSslCertificateId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstancePortInput() {
        return software.amazon.jsii.Kernel.get(this, "instancePortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLbPortInput() {
        return software.amazon.jsii.Kernel.get(this, "lbPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLbProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "lbProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslCertificateIdInput() {
        return software.amazon.jsii.Kernel.get(this, "sslCertificateIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstancePort() {
        return software.amazon.jsii.Kernel.get(this, "instancePort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstancePort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instancePort", java.util.Objects.requireNonNull(value, "instancePort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceProtocol() {
        return software.amazon.jsii.Kernel.get(this, "instanceProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceProtocol", java.util.Objects.requireNonNull(value, "instanceProtocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLbPort() {
        return software.amazon.jsii.Kernel.get(this, "lbPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLbPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "lbPort", java.util.Objects.requireNonNull(value, "lbPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLbProtocol() {
        return software.amazon.jsii.Kernel.get(this, "lbProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLbProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lbProtocol", java.util.Objects.requireNonNull(value, "lbProtocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslCertificateId() {
        return software.amazon.jsii.Kernel.get(this, "sslCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslCertificateId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslCertificateId", java.util.Objects.requireNonNull(value, "sslCertificateId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elb.ElbListener value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
