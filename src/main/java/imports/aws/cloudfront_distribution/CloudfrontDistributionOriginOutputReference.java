package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOriginOutputReference")
public class CloudfrontDistributionOriginOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionOriginOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionOriginOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudfrontDistributionOriginOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCustomHeader(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomHeader>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomHeader> __cast_cd4240 = (java.util.List<imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomHeader>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomHeader __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomOriginConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomOriginConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCustomOriginConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOriginShield(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginOriginShield value) {
        software.amazon.jsii.Kernel.call(this, "putOriginShield", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3OriginConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginS3OriginConfig value) {
        software.amazon.jsii.Kernel.call(this, "putS3OriginConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcOriginConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcOriginConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConnectionAttempts() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionAttempts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomHeader() {
        software.amazon.jsii.Kernel.call(this, "resetCustomHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomOriginConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCustomOriginConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOriginAccessControlId() {
        software.amazon.jsii.Kernel.call(this, "resetOriginAccessControlId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOriginPath() {
        software.amazon.jsii.Kernel.call(this, "resetOriginPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOriginShield() {
        software.amazon.jsii.Kernel.call(this, "resetOriginShield", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3OriginConfig() {
        software.amazon.jsii.Kernel.call(this, "resetS3OriginConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcOriginConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcOriginConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomHeaderList getCustomHeader() {
        return software.amazon.jsii.Kernel.get(this, "customHeader", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomHeaderList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomOriginConfigOutputReference getCustomOriginConfig() {
        return software.amazon.jsii.Kernel.get(this, "customOriginConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomOriginConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginOriginShieldOutputReference getOriginShield() {
        return software.amazon.jsii.Kernel.get(this, "originShield", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginOriginShieldOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginS3OriginConfigOutputReference getS3OriginConfig() {
        return software.amazon.jsii.Kernel.get(this, "s3OriginConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginS3OriginConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfigOutputReference getVpcOriginConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcOriginConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionAttemptsInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionAttemptsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "customHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomOriginConfig getCustomOriginConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "customOriginConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginCustomOriginConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOriginAccessControlIdInput() {
        return software.amazon.jsii.Kernel.get(this, "originAccessControlIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOriginIdInput() {
        return software.amazon.jsii.Kernel.get(this, "originIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOriginPathInput() {
        return software.amazon.jsii.Kernel.get(this, "originPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOriginOriginShield getOriginShieldInput() {
        return software.amazon.jsii.Kernel.get(this, "originShieldInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginOriginShield.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOriginS3OriginConfig getS3OriginConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "s3OriginConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginS3OriginConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfig getVpcOriginConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcOriginConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionAttempts() {
        return software.amazon.jsii.Kernel.get(this, "connectionAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionAttempts(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionAttempts", java.util.Objects.requireNonNull(value, "connectionAttempts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionTimeout() {
        return software.amazon.jsii.Kernel.get(this, "connectionTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionTimeout", java.util.Objects.requireNonNull(value, "connectionTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOriginAccessControlId() {
        return software.amazon.jsii.Kernel.get(this, "originAccessControlId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOriginAccessControlId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "originAccessControlId", java.util.Objects.requireNonNull(value, "originAccessControlId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOriginId() {
        return software.amazon.jsii.Kernel.get(this, "originId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOriginId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "originId", java.util.Objects.requireNonNull(value, "originId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOriginPath() {
        return software.amazon.jsii.Kernel.get(this, "originPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOriginPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "originPath", java.util.Objects.requireNonNull(value, "originPath is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOrigin value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
