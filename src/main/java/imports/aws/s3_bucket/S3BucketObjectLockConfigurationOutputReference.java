package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketObjectLockConfigurationOutputReference")
public class S3BucketObjectLockConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketObjectLockConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketObjectLockConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketObjectLockConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRule(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule value) {
        software.amazon.jsii.Kernel.call(this, "putRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetObjectLockEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetObjectLockEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRule() {
        software.amazon.jsii.Kernel.call(this, "resetRule", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketObjectLockConfigurationRuleOutputReference getRule() {
        return software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfigurationRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectLockEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "objectLockEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule getRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectLockEnabled() {
        return software.amazon.jsii.Kernel.get(this, "objectLockEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectLockEnabled(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectLockEnabled", java.util.Objects.requireNonNull(value, "objectLockEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketObjectLockConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketObjectLockConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
