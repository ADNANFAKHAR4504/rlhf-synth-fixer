package imports.aws.ssmcontacts_contact_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.507Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsContactChannel.SsmcontactsContactChannelDeliveryAddressOutputReference")
public class SsmcontactsContactChannelDeliveryAddressOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmcontactsContactChannelDeliveryAddressOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmcontactsContactChannelDeliveryAddressOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmcontactsContactChannelDeliveryAddressOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSimpleAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "simpleAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSimpleAddress() {
        return software.amazon.jsii.Kernel.get(this, "simpleAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSimpleAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "simpleAddress", java.util.Objects.requireNonNull(value, "simpleAddress is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_contact_channel.SsmcontactsContactChannelDeliveryAddress getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_contact_channel.SsmcontactsContactChannelDeliveryAddress.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_contact_channel.SsmcontactsContactChannelDeliveryAddress value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
