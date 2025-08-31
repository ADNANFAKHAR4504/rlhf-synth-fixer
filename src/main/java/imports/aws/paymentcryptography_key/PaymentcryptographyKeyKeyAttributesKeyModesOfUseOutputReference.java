package imports.aws.paymentcryptography_key;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.paymentcryptographyKey.PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference")
public class PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDecrypt() {
        software.amazon.jsii.Kernel.call(this, "resetDecrypt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeriveKey() {
        software.amazon.jsii.Kernel.call(this, "resetDeriveKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncrypt() {
        software.amazon.jsii.Kernel.call(this, "resetEncrypt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGenerate() {
        software.amazon.jsii.Kernel.call(this, "resetGenerate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoRestrictions() {
        software.amazon.jsii.Kernel.call(this, "resetNoRestrictions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSign() {
        software.amazon.jsii.Kernel.call(this, "resetSign", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnwrap() {
        software.amazon.jsii.Kernel.call(this, "resetUnwrap", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerify() {
        software.amazon.jsii.Kernel.call(this, "resetVerify", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWrap() {
        software.amazon.jsii.Kernel.call(this, "resetWrap", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDecryptInput() {
        return software.amazon.jsii.Kernel.get(this, "decryptInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeriveKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "deriveKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGenerateInput() {
        return software.amazon.jsii.Kernel.get(this, "generateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoRestrictionsInput() {
        return software.amazon.jsii.Kernel.get(this, "noRestrictionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSignInput() {
        return software.amazon.jsii.Kernel.get(this, "signInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUnwrapInput() {
        return software.amazon.jsii.Kernel.get(this, "unwrapInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVerifyInput() {
        return software.amazon.jsii.Kernel.get(this, "verifyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWrapInput() {
        return software.amazon.jsii.Kernel.get(this, "wrapInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDecrypt() {
        return software.amazon.jsii.Kernel.get(this, "decrypt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDecrypt(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "decrypt", java.util.Objects.requireNonNull(value, "decrypt is required"));
    }

    public void setDecrypt(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "decrypt", java.util.Objects.requireNonNull(value, "decrypt is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeriveKey() {
        return software.amazon.jsii.Kernel.get(this, "deriveKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeriveKey(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deriveKey", java.util.Objects.requireNonNull(value, "deriveKey is required"));
    }

    public void setDeriveKey(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deriveKey", java.util.Objects.requireNonNull(value, "deriveKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEncrypt() {
        return software.amazon.jsii.Kernel.get(this, "encrypt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEncrypt(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "encrypt", java.util.Objects.requireNonNull(value, "encrypt is required"));
    }

    public void setEncrypt(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "encrypt", java.util.Objects.requireNonNull(value, "encrypt is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getGenerate() {
        return software.amazon.jsii.Kernel.get(this, "generate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setGenerate(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "generate", java.util.Objects.requireNonNull(value, "generate is required"));
    }

    public void setGenerate(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "generate", java.util.Objects.requireNonNull(value, "generate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getNoRestrictions() {
        return software.amazon.jsii.Kernel.get(this, "noRestrictions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setNoRestrictions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "noRestrictions", java.util.Objects.requireNonNull(value, "noRestrictions is required"));
    }

    public void setNoRestrictions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "noRestrictions", java.util.Objects.requireNonNull(value, "noRestrictions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSign() {
        return software.amazon.jsii.Kernel.get(this, "sign", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSign(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sign", java.util.Objects.requireNonNull(value, "sign is required"));
    }

    public void setSign(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sign", java.util.Objects.requireNonNull(value, "sign is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUnwrap() {
        return software.amazon.jsii.Kernel.get(this, "unwrap", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUnwrap(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "unwrap", java.util.Objects.requireNonNull(value, "unwrap is required"));
    }

    public void setUnwrap(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "unwrap", java.util.Objects.requireNonNull(value, "unwrap is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getVerify() {
        return software.amazon.jsii.Kernel.get(this, "verify", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVerify(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "verify", java.util.Objects.requireNonNull(value, "verify is required"));
    }

    public void setVerify(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "verify", java.util.Objects.requireNonNull(value, "verify is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWrap() {
        return software.amazon.jsii.Kernel.get(this, "wrap", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWrap(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "wrap", java.util.Objects.requireNonNull(value, "wrap is required"));
    }

    public void setWrap(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "wrap", java.util.Objects.requireNonNull(value, "wrap is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
