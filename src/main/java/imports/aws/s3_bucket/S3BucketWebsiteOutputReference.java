package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketWebsiteOutputReference")
public class S3BucketWebsiteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketWebsiteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketWebsiteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketWebsiteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetErrorDocument() {
        software.amazon.jsii.Kernel.call(this, "resetErrorDocument", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIndexDocument() {
        software.amazon.jsii.Kernel.call(this, "resetIndexDocument", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedirectAllRequestsTo() {
        software.amazon.jsii.Kernel.call(this, "resetRedirectAllRequestsTo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoutingRules() {
        software.amazon.jsii.Kernel.call(this, "resetRoutingRules", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getErrorDocumentInput() {
        return software.amazon.jsii.Kernel.get(this, "errorDocumentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIndexDocumentInput() {
        return software.amazon.jsii.Kernel.get(this, "indexDocumentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRedirectAllRequestsToInput() {
        return software.amazon.jsii.Kernel.get(this, "redirectAllRequestsToInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoutingRulesInput() {
        return software.amazon.jsii.Kernel.get(this, "routingRulesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getErrorDocument() {
        return software.amazon.jsii.Kernel.get(this, "errorDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setErrorDocument(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "errorDocument", java.util.Objects.requireNonNull(value, "errorDocument is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIndexDocument() {
        return software.amazon.jsii.Kernel.get(this, "indexDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIndexDocument(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "indexDocument", java.util.Objects.requireNonNull(value, "indexDocument is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRedirectAllRequestsTo() {
        return software.amazon.jsii.Kernel.get(this, "redirectAllRequestsTo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRedirectAllRequestsTo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "redirectAllRequestsTo", java.util.Objects.requireNonNull(value, "redirectAllRequestsTo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoutingRules() {
        return software.amazon.jsii.Kernel.get(this, "routingRules", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoutingRules(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routingRules", java.util.Objects.requireNonNull(value, "routingRules is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketWebsite getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketWebsite.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketWebsite value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
