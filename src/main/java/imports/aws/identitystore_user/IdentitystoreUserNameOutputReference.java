package imports.aws.identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUserNameOutputReference")
public class IdentitystoreUserNameOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IdentitystoreUserNameOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IdentitystoreUserNameOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IdentitystoreUserNameOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFormatted() {
        software.amazon.jsii.Kernel.call(this, "resetFormatted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHonorificPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetHonorificPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHonorificSuffix() {
        software.amazon.jsii.Kernel.call(this, "resetHonorificSuffix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMiddleName() {
        software.amazon.jsii.Kernel.call(this, "resetMiddleName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFamilyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "familyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormattedInput() {
        return software.amazon.jsii.Kernel.get(this, "formattedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGivenNameInput() {
        return software.amazon.jsii.Kernel.get(this, "givenNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHonorificPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "honorificPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHonorificSuffixInput() {
        return software.amazon.jsii.Kernel.get(this, "honorificSuffixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMiddleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "middleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFamilyName() {
        return software.amazon.jsii.Kernel.get(this, "familyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFamilyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "familyName", java.util.Objects.requireNonNull(value, "familyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormatted() {
        return software.amazon.jsii.Kernel.get(this, "formatted", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormatted(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "formatted", java.util.Objects.requireNonNull(value, "formatted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGivenName() {
        return software.amazon.jsii.Kernel.get(this, "givenName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGivenName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "givenName", java.util.Objects.requireNonNull(value, "givenName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHonorificPrefix() {
        return software.amazon.jsii.Kernel.get(this, "honorificPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHonorificPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "honorificPrefix", java.util.Objects.requireNonNull(value, "honorificPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHonorificSuffix() {
        return software.amazon.jsii.Kernel.get(this, "honorificSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHonorificSuffix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "honorificSuffix", java.util.Objects.requireNonNull(value, "honorificSuffix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMiddleName() {
        return software.amazon.jsii.Kernel.get(this, "middleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMiddleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "middleName", java.util.Objects.requireNonNull(value, "middleName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserName getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserName.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserName value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
