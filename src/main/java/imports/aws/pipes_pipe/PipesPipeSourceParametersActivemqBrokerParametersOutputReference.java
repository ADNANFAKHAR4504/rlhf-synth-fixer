package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParametersOutputReference")
public class PipesPipeSourceParametersActivemqBrokerParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeSourceParametersActivemqBrokerParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeSourceParametersActivemqBrokerParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeSourceParametersActivemqBrokerParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCredentials(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials value) {
        software.amazon.jsii.Kernel.call(this, "putCredentials", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumBatchingWindowInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference getCredentials() {
        return software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "batchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials getCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQueueNameInput() {
        return software.amazon.jsii.Kernel.get(this, "queueNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBatchSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "batchSize", java.util.Objects.requireNonNull(value, "batchSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumBatchingWindowInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumBatchingWindowInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumBatchingWindowInSeconds", java.util.Objects.requireNonNull(value, "maximumBatchingWindowInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQueueName() {
        return software.amazon.jsii.Kernel.get(this, "queueName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQueueName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "queueName", java.util.Objects.requireNonNull(value, "queueName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
