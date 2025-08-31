package imports.aws.vpc_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.591Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcEndpoint.VpcEndpointDnsOptionsOutputReference")
public class VpcEndpointDnsOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpcEndpointDnsOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcEndpointDnsOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpcEndpointDnsOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDnsRecordIpType() {
        software.amazon.jsii.Kernel.call(this, "resetDnsRecordIpType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateDnsOnlyForInboundResolverEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateDnsOnlyForInboundResolverEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDnsRecordIpTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsRecordIpTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrivateDnsOnlyForInboundResolverEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsOnlyForInboundResolverEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsRecordIpType() {
        return software.amazon.jsii.Kernel.get(this, "dnsRecordIpType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDnsRecordIpType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dnsRecordIpType", java.util.Objects.requireNonNull(value, "dnsRecordIpType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPrivateDnsOnlyForInboundResolverEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsOnlyForInboundResolverEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPrivateDnsOnlyForInboundResolverEndpoint(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "privateDnsOnlyForInboundResolverEndpoint", java.util.Objects.requireNonNull(value, "privateDnsOnlyForInboundResolverEndpoint is required"));
    }

    public void setPrivateDnsOnlyForInboundResolverEndpoint(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "privateDnsOnlyForInboundResolverEndpoint", java.util.Objects.requireNonNull(value, "privateDnsOnlyForInboundResolverEndpoint is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpc_endpoint.VpcEndpointDnsOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_endpoint.VpcEndpointDnsOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpc_endpoint.VpcEndpointDnsOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
