package imports.aws.ivschat_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.426Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivschatLoggingConfiguration.IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference")
public class IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStreamNameInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStreamNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStreamName() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStreamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryStreamName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryStreamName", java.util.Objects.requireNonNull(value, "deliveryStreamName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehose getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehose.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehose value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
