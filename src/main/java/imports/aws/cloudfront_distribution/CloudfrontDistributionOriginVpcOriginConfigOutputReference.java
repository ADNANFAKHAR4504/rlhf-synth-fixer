package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOriginVpcOriginConfigOutputReference")
public class CloudfrontDistributionOriginVpcOriginConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionOriginVpcOriginConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionOriginVpcOriginConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontDistributionOriginVpcOriginConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOriginKeepaliveTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetOriginKeepaliveTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOriginReadTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetOriginReadTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOriginKeepaliveTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "originKeepaliveTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOriginReadTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "originReadTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcOriginIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcOriginIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOriginKeepaliveTimeout() {
        return software.amazon.jsii.Kernel.get(this, "originKeepaliveTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOriginKeepaliveTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "originKeepaliveTimeout", java.util.Objects.requireNonNull(value, "originKeepaliveTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOriginReadTimeout() {
        return software.amazon.jsii.Kernel.get(this, "originReadTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOriginReadTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "originReadTimeout", java.util.Objects.requireNonNull(value, "originReadTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcOriginId() {
        return software.amazon.jsii.Kernel.get(this, "vpcOriginId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcOriginId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcOriginId", java.util.Objects.requireNonNull(value, "vpcOriginId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOriginVpcOriginConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
