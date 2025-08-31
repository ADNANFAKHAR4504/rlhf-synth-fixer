package imports.aws.s3_bucket_object_lock_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketObjectLockConfiguration.S3BucketObjectLockConfigurationRuleAOutputReference")
public class S3BucketObjectLockConfigurationRuleAOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketObjectLockConfigurationRuleAOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketObjectLockConfigurationRuleAOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketObjectLockConfigurationRuleAOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDefaultRetention(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleDefaultRetentionA value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultRetention", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleDefaultRetentionAOutputReference getDefaultRetention() {
        return software.amazon.jsii.Kernel.get(this, "defaultRetention", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleDefaultRetentionAOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleDefaultRetentionA getDefaultRetentionInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRetentionInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleDefaultRetentionA.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleA getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleA.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_object_lock_configuration.S3BucketObjectLockConfigurationRuleA value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
