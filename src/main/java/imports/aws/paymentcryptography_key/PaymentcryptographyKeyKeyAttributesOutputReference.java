package imports.aws.paymentcryptography_key;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.paymentcryptographyKey.PaymentcryptographyKeyKeyAttributesOutputReference")
public class PaymentcryptographyKeyKeyAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PaymentcryptographyKeyKeyAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PaymentcryptographyKeyKeyAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PaymentcryptographyKeyKeyAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putKeyModesOfUse(final @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse value) {
        software.amazon.jsii.Kernel.call(this, "putKeyModesOfUse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKeyModesOfUse() {
        software.amazon.jsii.Kernel.call(this, "resetKeyModesOfUse", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference getKeyModesOfUse() {
        return software.amazon.jsii.Kernel.get(this, "keyModesOfUse", software.amazon.jsii.NativeType.forClass(imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUseOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "keyAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyClassInput() {
        return software.amazon.jsii.Kernel.get(this, "keyClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKeyModesOfUseInput() {
        return software.amazon.jsii.Kernel.get(this, "keyModesOfUseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyUsageInput() {
        return software.amazon.jsii.Kernel.get(this, "keyUsageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "keyAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyAlgorithm", java.util.Objects.requireNonNull(value, "keyAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyClass() {
        return software.amazon.jsii.Kernel.get(this, "keyClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyClass", java.util.Objects.requireNonNull(value, "keyClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyUsage() {
        return software.amazon.jsii.Kernel.get(this, "keyUsage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyUsage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyUsage", java.util.Objects.requireNonNull(value, "keyUsage is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
