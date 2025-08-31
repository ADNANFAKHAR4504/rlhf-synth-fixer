package imports.aws.cloudfront_vpc_origin;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontVpcOrigin.CloudfrontVpcOriginVpcOriginEndpointConfigOutputReference")
public class CloudfrontVpcOriginVpcOriginEndpointConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontVpcOriginVpcOriginEndpointConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontVpcOriginVpcOriginEndpointConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudfrontVpcOriginVpcOriginEndpointConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putOriginSslProtocols(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols> __cast_cd4240 = (java.util.List<imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOriginSslProtocols", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOriginSslProtocols() {
        software.amazon.jsii.Kernel.call(this, "resetOriginSslProtocols", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocolsList getOriginSslProtocols() {
        return software.amazon.jsii.Kernel.get(this, "originSslProtocols", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocolsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArnInput() {
        return software.amazon.jsii.Kernel.get(this, "arnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHttpPortInput() {
        return software.amazon.jsii.Kernel.get(this, "httpPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHttpsPortInput() {
        return software.amazon.jsii.Kernel.get(this, "httpsPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOriginProtocolPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "originProtocolPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOriginSslProtocolsInput() {
        return software.amazon.jsii.Kernel.get(this, "originSslProtocolsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "arn", java.util.Objects.requireNonNull(value, "arn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHttpPort() {
        return software.amazon.jsii.Kernel.get(this, "httpPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHttpPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "httpPort", java.util.Objects.requireNonNull(value, "httpPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHttpsPort() {
        return software.amazon.jsii.Kernel.get(this, "httpsPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHttpsPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "httpsPort", java.util.Objects.requireNonNull(value, "httpsPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOriginProtocolPolicy() {
        return software.amazon.jsii.Kernel.get(this, "originProtocolPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOriginProtocolPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "originProtocolPolicy", java.util.Objects.requireNonNull(value, "originProtocolPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
