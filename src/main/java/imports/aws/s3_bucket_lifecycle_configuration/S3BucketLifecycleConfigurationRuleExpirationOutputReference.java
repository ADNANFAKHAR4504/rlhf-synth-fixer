package imports.aws.s3_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.256Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRuleExpirationOutputReference")
public class S3BucketLifecycleConfigurationRuleExpirationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketLifecycleConfigurationRuleExpirationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketLifecycleConfigurationRuleExpirationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public S3BucketLifecycleConfigurationRuleExpirationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetDate() {
        software.amazon.jsii.Kernel.call(this, "resetDate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDays() {
        software.amazon.jsii.Kernel.call(this, "resetDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpiredObjectDeleteMarker() {
        software.amazon.jsii.Kernel.call(this, "resetExpiredObjectDeleteMarker", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDateInput() {
        return software.amazon.jsii.Kernel.get(this, "dateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "daysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExpiredObjectDeleteMarkerInput() {
        return software.amazon.jsii.Kernel.get(this, "expiredObjectDeleteMarkerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDate() {
        return software.amazon.jsii.Kernel.get(this, "date", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "date", java.util.Objects.requireNonNull(value, "date is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDays() {
        return software.amazon.jsii.Kernel.get(this, "days", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "days", java.util.Objects.requireNonNull(value, "days is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExpiredObjectDeleteMarker() {
        return software.amazon.jsii.Kernel.get(this, "expiredObjectDeleteMarker", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExpiredObjectDeleteMarker(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "expiredObjectDeleteMarker", java.util.Objects.requireNonNull(value, "expiredObjectDeleteMarker is required"));
    }

    public void setExpiredObjectDeleteMarker(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "expiredObjectDeleteMarker", java.util.Objects.requireNonNull(value, "expiredObjectDeleteMarker is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
