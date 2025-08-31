package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference")
public class PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "logGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroupArn", java.util.Objects.requireNonNull(value, "logGroupArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
