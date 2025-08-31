package imports.aws.ivschat_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.426Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivschatLoggingConfiguration.IvschatLoggingConfigurationDestinationConfigurationOutputReference")
public class IvschatLoggingConfigurationDestinationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IvschatLoggingConfigurationDestinationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IvschatLoggingConfigurationDestinationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IvschatLoggingConfigurationDestinationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirehose(final @org.jetbrains.annotations.NotNull imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehose value) {
        software.amazon.jsii.Kernel.call(this, "putFirehose", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehose() {
        software.amazon.jsii.Kernel.call(this, "resetFirehose", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference getFirehose() {
        return software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehoseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationS3OutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehose getFirehoseInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseInput", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationFirehose.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfigurationS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ivschat_logging_configuration.IvschatLoggingConfigurationDestinationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
