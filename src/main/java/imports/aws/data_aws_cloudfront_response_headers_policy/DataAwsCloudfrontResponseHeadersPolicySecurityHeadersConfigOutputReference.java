package imports.aws.data_aws_cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudfrontResponseHeadersPolicy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference")
public class DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyList getContentSecurityPolicy() {
        return software.amazon.jsii.Kernel.get(this, "contentSecurityPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptionsList getContentTypeOptions() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeOptions", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptionsList getFrameOptions() {
        return software.amazon.jsii.Kernel.get(this, "frameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicyList getReferrerPolicy() {
        return software.amazon.jsii.Kernel.get(this, "referrerPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityList getStrictTransportSecurity() {
        return software.amazon.jsii.Kernel.get(this, "strictTransportSecurity", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionList getXssProtection() {
        return software.amazon.jsii.Kernel.get(this, "xssProtection", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudfront_response_headers_policy.DataAwsCloudfrontResponseHeadersPolicySecurityHeadersConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
