package imports.aws.verifiedaccess_instance_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.575Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogsOutputReference")
public class VerifiedaccessInstanceLoggingConfigurationAccessLogsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedaccessInstanceLoggingConfigurationAccessLogsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessInstanceLoggingConfigurationAccessLogsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VerifiedaccessInstanceLoggingConfigurationAccessLogsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisDataFirehose(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisDataFirehose", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeTrustContext() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeTrustContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisDataFirehose() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisDataFirehose", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogVersion() {
        software.amazon.jsii.Kernel.call(this, "resetLogVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference getKinesisDataFirehose() {
        return software.amazon.jsii.Kernel.get(this, "kinesisDataFirehose", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehoseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3OutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTrustContextInput() {
        return software.amazon.jsii.Kernel.get(this, "includeTrustContextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose getKinesisDataFirehoseInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisDataFirehoseInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "logVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeTrustContext() {
        return software.amazon.jsii.Kernel.get(this, "includeTrustContext", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeTrustContext(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeTrustContext", java.util.Objects.requireNonNull(value, "includeTrustContext is required"));
    }

    public void setIncludeTrustContext(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeTrustContext", java.util.Objects.requireNonNull(value, "includeTrustContext is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogVersion() {
        return software.amazon.jsii.Kernel.get(this, "logVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logVersion", java.util.Objects.requireNonNull(value, "logVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogs getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogs.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
