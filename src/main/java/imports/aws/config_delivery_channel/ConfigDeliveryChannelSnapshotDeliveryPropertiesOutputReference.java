package imports.aws.config_delivery_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.376Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configDeliveryChannel.ConfigDeliveryChannelSnapshotDeliveryPropertiesOutputReference")
public class ConfigDeliveryChannelSnapshotDeliveryPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigDeliveryChannelSnapshotDeliveryPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigDeliveryChannelSnapshotDeliveryPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigDeliveryChannelSnapshotDeliveryPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeliveryFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryFrequency() {
        return software.amazon.jsii.Kernel.get(this, "deliveryFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryFrequency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryFrequency", java.util.Objects.requireNonNull(value, "deliveryFrequency is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_delivery_channel.ConfigDeliveryChannelSnapshotDeliveryProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
