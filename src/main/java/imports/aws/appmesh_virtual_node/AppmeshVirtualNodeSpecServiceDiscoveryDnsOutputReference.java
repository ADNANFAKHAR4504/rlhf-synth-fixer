package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.048Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecServiceDiscoveryDnsOutputReference")
public class AppmeshVirtualNodeSpecServiceDiscoveryDnsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualNodeSpecServiceDiscoveryDnsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualNodeSpecServiceDiscoveryDnsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualNodeSpecServiceDiscoveryDnsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIpPreference() {
        software.amazon.jsii.Kernel.call(this, "resetIpPreference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseType() {
        software.amazon.jsii.Kernel.call(this, "resetResponseType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostnameInput() {
        return software.amazon.jsii.Kernel.get(this, "hostnameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "ipPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResponseTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "responseTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostname() {
        return software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostname(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostname", java.util.Objects.requireNonNull(value, "hostname is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpPreference() {
        return software.amazon.jsii.Kernel.get(this, "ipPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpPreference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipPreference", java.util.Objects.requireNonNull(value, "ipPreference is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResponseType() {
        return software.amazon.jsii.Kernel.get(this, "responseType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResponseType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "responseType", java.util.Objects.requireNonNull(value, "responseType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscoveryDns getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscoveryDns.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscoveryDns value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
