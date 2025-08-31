package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionViewerCertificateOutputReference")
public class CloudfrontDistributionViewerCertificateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionViewerCertificateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionViewerCertificateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontDistributionViewerCertificateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAcmCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetAcmCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudfrontDefaultCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetCloudfrontDefaultCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamCertificateId() {
        software.amazon.jsii.Kernel.call(this, "resetIamCertificateId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumProtocolVersion() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumProtocolVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslSupportMethod() {
        software.amazon.jsii.Kernel.call(this, "resetSslSupportMethod", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAcmCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "acmCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudfrontDefaultCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudfrontDefaultCertificateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamCertificateIdInput() {
        return software.amazon.jsii.Kernel.get(this, "iamCertificateIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMinimumProtocolVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumProtocolVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslSupportMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "sslSupportMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAcmCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "acmCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAcmCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "acmCertificateArn", java.util.Objects.requireNonNull(value, "acmCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCloudfrontDefaultCertificate() {
        return software.amazon.jsii.Kernel.get(this, "cloudfrontDefaultCertificate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCloudfrontDefaultCertificate(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cloudfrontDefaultCertificate", java.util.Objects.requireNonNull(value, "cloudfrontDefaultCertificate is required"));
    }

    public void setCloudfrontDefaultCertificate(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cloudfrontDefaultCertificate", java.util.Objects.requireNonNull(value, "cloudfrontDefaultCertificate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamCertificateId() {
        return software.amazon.jsii.Kernel.get(this, "iamCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamCertificateId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamCertificateId", java.util.Objects.requireNonNull(value, "iamCertificateId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMinimumProtocolVersion() {
        return software.amazon.jsii.Kernel.get(this, "minimumProtocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMinimumProtocolVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "minimumProtocolVersion", java.util.Objects.requireNonNull(value, "minimumProtocolVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslSupportMethod() {
        return software.amazon.jsii.Kernel.get(this, "sslSupportMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslSupportMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslSupportMethod", java.util.Objects.requireNonNull(value, "sslSupportMethod is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionViewerCertificate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionViewerCertificate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionViewerCertificate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
