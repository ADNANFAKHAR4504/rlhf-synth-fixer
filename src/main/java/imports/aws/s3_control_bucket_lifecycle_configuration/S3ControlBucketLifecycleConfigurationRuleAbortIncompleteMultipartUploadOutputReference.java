package imports.aws.s3_control_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference")
public class S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDaysAfterInitiationInput() {
        return software.amazon.jsii.Kernel.get(this, "daysAfterInitiationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDaysAfterInitiation() {
        return software.amazon.jsii.Kernel.get(this, "daysAfterInitiation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDaysAfterInitiation(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "daysAfterInitiation", java.util.Objects.requireNonNull(value, "daysAfterInitiation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
