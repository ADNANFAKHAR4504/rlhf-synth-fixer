package imports.aws.route53_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53Record.Route53RecordGeolocationRoutingPolicyOutputReference")
public class Route53RecordGeolocationRoutingPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecordGeolocationRoutingPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecordGeolocationRoutingPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Route53RecordGeolocationRoutingPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetContinent() {
        software.amazon.jsii.Kernel.call(this, "resetContinent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCountry() {
        software.amazon.jsii.Kernel.call(this, "resetCountry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubdivision() {
        software.amazon.jsii.Kernel.call(this, "resetSubdivision", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContinentInput() {
        return software.amazon.jsii.Kernel.get(this, "continentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountryInput() {
        return software.amazon.jsii.Kernel.get(this, "countryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubdivisionInput() {
        return software.amazon.jsii.Kernel.get(this, "subdivisionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContinent() {
        return software.amazon.jsii.Kernel.get(this, "continent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContinent(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "continent", java.util.Objects.requireNonNull(value, "continent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountry() {
        return software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountry(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "country", java.util.Objects.requireNonNull(value, "country is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubdivision() {
        return software.amazon.jsii.Kernel.get(this, "subdivision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubdivision(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subdivision", java.util.Objects.requireNonNull(value, "subdivision is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
