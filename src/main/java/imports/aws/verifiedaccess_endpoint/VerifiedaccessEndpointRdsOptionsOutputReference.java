package imports.aws.verifiedaccess_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.573Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessEndpoint.VerifiedaccessEndpointRdsOptionsOutputReference")
public class VerifiedaccessEndpointRdsOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedaccessEndpointRdsOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessEndpointRdsOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VerifiedaccessEndpointRdsOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRdsDbClusterArn() {
        software.amazon.jsii.Kernel.call(this, "resetRdsDbClusterArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRdsDbInstanceArn() {
        software.amazon.jsii.Kernel.call(this, "resetRdsDbInstanceArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRdsDbProxyArn() {
        software.amazon.jsii.Kernel.call(this, "resetRdsDbProxyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRdsEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetRdsEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetIds() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRdsDbClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "rdsDbClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRdsDbInstanceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "rdsDbInstanceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRdsDbProxyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "rdsDbProxyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRdsEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "rdsEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRdsDbClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "rdsDbClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRdsDbClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rdsDbClusterArn", java.util.Objects.requireNonNull(value, "rdsDbClusterArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRdsDbInstanceArn() {
        return software.amazon.jsii.Kernel.get(this, "rdsDbInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRdsDbInstanceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rdsDbInstanceArn", java.util.Objects.requireNonNull(value, "rdsDbInstanceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRdsDbProxyArn() {
        return software.amazon.jsii.Kernel.get(this, "rdsDbProxyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRdsDbProxyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rdsDbProxyArn", java.util.Objects.requireNonNull(value, "rdsDbProxyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRdsEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "rdsEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRdsEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rdsEndpoint", java.util.Objects.requireNonNull(value, "rdsEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
