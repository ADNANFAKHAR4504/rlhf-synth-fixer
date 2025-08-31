package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeLogConfigurationOutputReference")
public class PipesPipeLogConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeLogConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeLogConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeLogConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogsLogDestination(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogsLogDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirehoseLogDestination(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination value) {
        software.amazon.jsii.Kernel.call(this, "putFirehoseLogDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3LogDestination(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination value) {
        software.amazon.jsii.Kernel.call(this, "putS3LogDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogsLogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogsLogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehoseLogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetFirehoseLogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeExecutionData() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeExecutionData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3LogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetS3LogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference getCloudwatchLogsLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsLogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestinationOutputReference getFirehoseLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "firehoseLogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestinationOutputReference getS3LogDestination() {
        return software.amazon.jsii.Kernel.get(this, "s3LogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination getCloudwatchLogsLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsLogDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination getFirehoseLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseLogDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludeExecutionDataInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "includeExecutionDataInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "levelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination getS3LogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3LogDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIncludeExecutionData() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "includeExecutionData", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIncludeExecutionData(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "includeExecutionData", java.util.Objects.requireNonNull(value, "includeExecutionData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLevel() {
        return software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "level", java.util.Objects.requireNonNull(value, "level is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
