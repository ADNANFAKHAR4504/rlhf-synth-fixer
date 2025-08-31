package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationIndexDocumentOutputReference")
public class S3BucketWebsiteConfigurationIndexDocumentOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketWebsiteConfigurationIndexDocumentOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketWebsiteConfigurationIndexDocumentOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketWebsiteConfigurationIndexDocumentOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuffixInput() {
        return software.amazon.jsii.Kernel.get(this, "suffixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuffix() {
        return software.amazon.jsii.Kernel.get(this, "suffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuffix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "suffix", java.util.Objects.requireNonNull(value, "suffix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationIndexDocument value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
