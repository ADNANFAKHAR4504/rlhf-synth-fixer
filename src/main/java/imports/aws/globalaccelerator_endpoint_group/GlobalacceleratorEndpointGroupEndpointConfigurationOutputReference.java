package imports.aws.globalaccelerator_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorEndpointGroup.GlobalacceleratorEndpointGroupEndpointConfigurationOutputReference")
public class GlobalacceleratorEndpointGroupEndpointConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlobalacceleratorEndpointGroupEndpointConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlobalacceleratorEndpointGroupEndpointConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlobalacceleratorEndpointGroupEndpointConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAttachmentArn() {
        software.amazon.jsii.Kernel.call(this, "resetAttachmentArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientIpPreservationEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetClientIpPreservationEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointId() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeight() {
        software.amazon.jsii.Kernel.call(this, "resetWeight", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttachmentArnInput() {
        return software.amazon.jsii.Kernel.get(this, "attachmentArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getClientIpPreservationEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "clientIpPreservationEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointIdInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWeightInput() {
        return software.amazon.jsii.Kernel.get(this, "weightInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttachmentArn() {
        return software.amazon.jsii.Kernel.get(this, "attachmentArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttachmentArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attachmentArn", java.util.Objects.requireNonNull(value, "attachmentArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getClientIpPreservationEnabled() {
        return software.amazon.jsii.Kernel.get(this, "clientIpPreservationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setClientIpPreservationEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "clientIpPreservationEnabled", java.util.Objects.requireNonNull(value, "clientIpPreservationEnabled is required"));
    }

    public void setClientIpPreservationEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "clientIpPreservationEnabled", java.util.Objects.requireNonNull(value, "clientIpPreservationEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointId() {
        return software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointId", java.util.Objects.requireNonNull(value, "endpointId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWeight() {
        return software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWeight(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "weight", java.util.Objects.requireNonNull(value, "weight is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupEndpointConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
