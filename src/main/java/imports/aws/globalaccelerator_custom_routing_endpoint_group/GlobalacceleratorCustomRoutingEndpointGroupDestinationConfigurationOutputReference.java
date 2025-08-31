package imports.aws.globalaccelerator_custom_routing_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.275Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupDestinationConfigurationOutputReference")
public class GlobalacceleratorCustomRoutingEndpointGroupDestinationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlobalacceleratorCustomRoutingEndpointGroupDestinationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlobalacceleratorCustomRoutingEndpointGroupDestinationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlobalacceleratorCustomRoutingEndpointGroupDestinationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFromPortInput() {
        return software.amazon.jsii.Kernel.get(this, "fromPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getProtocolsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "protocolsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getToPortInput() {
        return software.amazon.jsii.Kernel.get(this, "toPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFromPort() {
        return software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFromPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fromPort", java.util.Objects.requireNonNull(value, "fromPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProtocols() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setProtocols(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "protocols", java.util.Objects.requireNonNull(value, "protocols is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getToPort() {
        return software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setToPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "toPort", java.util.Objects.requireNonNull(value, "toPort is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
