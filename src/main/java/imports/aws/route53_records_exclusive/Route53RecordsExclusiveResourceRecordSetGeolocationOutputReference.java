package imports.aws.route53_records_exclusive;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference")
public class Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetContinentCode() {
        software.amazon.jsii.Kernel.call(this, "resetContinentCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCountryCode() {
        software.amazon.jsii.Kernel.call(this, "resetCountryCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubdivisionCode() {
        software.amazon.jsii.Kernel.call(this, "resetSubdivisionCode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContinentCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "continentCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountryCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "countryCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubdivisionCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "subdivisionCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContinentCode() {
        return software.amazon.jsii.Kernel.get(this, "continentCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContinentCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "continentCode", java.util.Objects.requireNonNull(value, "continentCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountryCode() {
        return software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountryCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "countryCode", java.util.Objects.requireNonNull(value, "countryCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubdivisionCode() {
        return software.amazon.jsii.Kernel.get(this, "subdivisionCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubdivisionCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subdivisionCode", java.util.Objects.requireNonNull(value, "subdivisionCode is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
