package imports.aws.sesv2_email_identity;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.459Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2EmailIdentity.Sesv2EmailIdentityDkimSigningAttributesOutputReference")
public class Sesv2EmailIdentityDkimSigningAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2EmailIdentityDkimSigningAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2EmailIdentityDkimSigningAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2EmailIdentityDkimSigningAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDomainSigningPrivateKey() {
        software.amazon.jsii.Kernel.call(this, "resetDomainSigningPrivateKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomainSigningSelector() {
        software.amazon.jsii.Kernel.call(this, "resetDomainSigningSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNextSigningKeyLength() {
        software.amazon.jsii.Kernel.call(this, "resetNextSigningKeyLength", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCurrentSigningKeyLength() {
        return software.amazon.jsii.Kernel.get(this, "currentSigningKeyLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastKeyGenerationTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "lastKeyGenerationTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningAttributesOrigin() {
        return software.amazon.jsii.Kernel.get(this, "signingAttributesOrigin", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTokens() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tokens", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainSigningPrivateKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "domainSigningPrivateKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainSigningSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "domainSigningSelectorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNextSigningKeyLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "nextSigningKeyLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainSigningPrivateKey() {
        return software.amazon.jsii.Kernel.get(this, "domainSigningPrivateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainSigningPrivateKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainSigningPrivateKey", java.util.Objects.requireNonNull(value, "domainSigningPrivateKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainSigningSelector() {
        return software.amazon.jsii.Kernel.get(this, "domainSigningSelector", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainSigningSelector(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainSigningSelector", java.util.Objects.requireNonNull(value, "domainSigningSelector is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNextSigningKeyLength() {
        return software.amazon.jsii.Kernel.get(this, "nextSigningKeyLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNextSigningKeyLength(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nextSigningKeyLength", java.util.Objects.requireNonNull(value, "nextSigningKeyLength is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_email_identity.Sesv2EmailIdentityDkimSigningAttributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_email_identity.Sesv2EmailIdentityDkimSigningAttributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_email_identity.Sesv2EmailIdentityDkimSigningAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
