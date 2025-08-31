package imports.aws.identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUserAddressesOutputReference")
public class IdentitystoreUserAddressesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IdentitystoreUserAddressesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IdentitystoreUserAddressesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IdentitystoreUserAddressesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCountry() {
        software.amazon.jsii.Kernel.call(this, "resetCountry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFormatted() {
        software.amazon.jsii.Kernel.call(this, "resetFormatted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocality() {
        software.amazon.jsii.Kernel.call(this, "resetLocality", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostalCode() {
        software.amazon.jsii.Kernel.call(this, "resetPostalCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrimary() {
        software.amazon.jsii.Kernel.call(this, "resetPrimary", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegion() {
        software.amazon.jsii.Kernel.call(this, "resetRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreetAddress() {
        software.amazon.jsii.Kernel.call(this, "resetStreetAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountryInput() {
        return software.amazon.jsii.Kernel.get(this, "countryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormattedInput() {
        return software.amazon.jsii.Kernel.get(this, "formattedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalityInput() {
        return software.amazon.jsii.Kernel.get(this, "localityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostalCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "postalCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrimaryInput() {
        return software.amazon.jsii.Kernel.get(this, "primaryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreetAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "streetAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountry() {
        return software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountry(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "country", java.util.Objects.requireNonNull(value, "country is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormatted() {
        return software.amazon.jsii.Kernel.get(this, "formatted", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormatted(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "formatted", java.util.Objects.requireNonNull(value, "formatted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocality() {
        return software.amazon.jsii.Kernel.get(this, "locality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocality(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "locality", java.util.Objects.requireNonNull(value, "locality is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostalCode() {
        return software.amazon.jsii.Kernel.get(this, "postalCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostalCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postalCode", java.util.Objects.requireNonNull(value, "postalCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPrimary() {
        return software.amazon.jsii.Kernel.get(this, "primary", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPrimary(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "primary", java.util.Objects.requireNonNull(value, "primary is required"));
    }

    public void setPrimary(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "primary", java.util.Objects.requireNonNull(value, "primary is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "region", java.util.Objects.requireNonNull(value, "region is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreetAddress() {
        return software.amazon.jsii.Kernel.get(this, "streetAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreetAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streetAddress", java.util.Objects.requireNonNull(value, "streetAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserAddresses getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.identitystore_user.IdentitystoreUserAddresses.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.identitystore_user.IdentitystoreUserAddresses value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
