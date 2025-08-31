package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.231Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionCustomErrorResponseOutputReference")
public class CloudfrontDistributionCustomErrorResponseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionCustomErrorResponseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionCustomErrorResponseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudfrontDistributionCustomErrorResponseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetErrorCachingMinTtl() {
        software.amazon.jsii.Kernel.call(this, "resetErrorCachingMinTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseCode() {
        software.amazon.jsii.Kernel.call(this, "resetResponseCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponsePagePath() {
        software.amazon.jsii.Kernel.call(this, "resetResponsePagePath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getErrorCachingMinTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "errorCachingMinTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getErrorCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "errorCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getResponseCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "responseCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResponsePagePathInput() {
        return software.amazon.jsii.Kernel.get(this, "responsePagePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getErrorCachingMinTtl() {
        return software.amazon.jsii.Kernel.get(this, "errorCachingMinTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setErrorCachingMinTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "errorCachingMinTtl", java.util.Objects.requireNonNull(value, "errorCachingMinTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getErrorCode() {
        return software.amazon.jsii.Kernel.get(this, "errorCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setErrorCode(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "errorCode", java.util.Objects.requireNonNull(value, "errorCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getResponseCode() {
        return software.amazon.jsii.Kernel.get(this, "responseCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setResponseCode(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "responseCode", java.util.Objects.requireNonNull(value, "responseCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResponsePagePath() {
        return software.amazon.jsii.Kernel.get(this, "responsePagePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResponsePagePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "responsePagePath", java.util.Objects.requireNonNull(value, "responsePagePath is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionCustomErrorResponse value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
