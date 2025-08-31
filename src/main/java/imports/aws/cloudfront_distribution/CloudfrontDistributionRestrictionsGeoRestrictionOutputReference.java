package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionRestrictionsGeoRestrictionOutputReference")
public class CloudfrontDistributionRestrictionsGeoRestrictionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionRestrictionsGeoRestrictionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionRestrictionsGeoRestrictionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontDistributionRestrictionsGeoRestrictionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLocations() {
        software.amazon.jsii.Kernel.call(this, "resetLocations", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLocationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "locationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRestrictionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "restrictionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLocations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "locations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLocations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "locations", java.util.Objects.requireNonNull(value, "locations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRestrictionType() {
        return software.amazon.jsii.Kernel.get(this, "restrictionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRestrictionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "restrictionType", java.util.Objects.requireNonNull(value, "restrictionType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionRestrictionsGeoRestriction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionRestrictionsGeoRestriction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionRestrictionsGeoRestriction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
