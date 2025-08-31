package imports.aws.verifiedaccess_instance_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.575Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference")
public class VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeliveryStream() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryStream", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStreamInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStreamInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStream() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStream", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryStream(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryStream", java.util.Objects.requireNonNull(value, "deliveryStream is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
