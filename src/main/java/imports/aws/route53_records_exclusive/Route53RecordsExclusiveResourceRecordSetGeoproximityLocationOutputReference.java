package imports.aws.route53_records_exclusive;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference")
public class Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCoordinates(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates> __cast_cd4240 = (java.util.List<imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCoordinates", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsRegion() {
        software.amazon.jsii.Kernel.call(this, "resetAwsRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBias() {
        software.amazon.jsii.Kernel.call(this, "resetBias", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoordinates() {
        software.amazon.jsii.Kernel.call(this, "resetCoordinates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalZoneGroup() {
        software.amazon.jsii.Kernel.call(this, "resetLocalZoneGroup", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList getCoordinates() {
        return software.amazon.jsii.Kernel.get(this, "coordinates", software.amazon.jsii.NativeType.forClass(imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "awsRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBiasInput() {
        return software.amazon.jsii.Kernel.get(this, "biasInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCoordinatesInput() {
        return software.amazon.jsii.Kernel.get(this, "coordinatesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalZoneGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "localZoneGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsRegion() {
        return software.amazon.jsii.Kernel.get(this, "awsRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsRegion", java.util.Objects.requireNonNull(value, "awsRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBias() {
        return software.amazon.jsii.Kernel.get(this, "bias", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBias(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bias", java.util.Objects.requireNonNull(value, "bias is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalZoneGroup() {
        return software.amazon.jsii.Kernel.get(this, "localZoneGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalZoneGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localZoneGroup", java.util.Objects.requireNonNull(value, "localZoneGroup is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
