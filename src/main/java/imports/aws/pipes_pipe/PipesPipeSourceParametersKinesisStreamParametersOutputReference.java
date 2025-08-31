package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParametersOutputReference")
public class PipesPipeSourceParametersKinesisStreamParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeSourceParametersKinesisStreamParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeSourceParametersKinesisStreamParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeSourceParametersKinesisStreamParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDeadLetterConfig(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig value) {
        software.amazon.jsii.Kernel.call(this, "putDeadLetterConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeadLetterConfig() {
        software.amazon.jsii.Kernel.call(this, "resetDeadLetterConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumBatchingWindowInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumRecordAgeInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumRecordAgeInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumRetryAttempts() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumRetryAttempts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnPartialBatchItemFailure() {
        software.amazon.jsii.Kernel.call(this, "resetOnPartialBatchItemFailure", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParallelizationFactor() {
        software.amazon.jsii.Kernel.call(this, "resetParallelizationFactor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartingPositionTimestamp() {
        software.amazon.jsii.Kernel.call(this, "resetStartingPositionTimestamp", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference getDeadLetterConfig() {
        return software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "batchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig getDeadLetterConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "deadLetterConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumRecordAgeInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumRecordAgeInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumRetryAttemptsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumRetryAttemptsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOnPartialBatchItemFailureInput() {
        return software.amazon.jsii.Kernel.get(this, "onPartialBatchItemFailureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getParallelizationFactorInput() {
        return software.amazon.jsii.Kernel.get(this, "parallelizationFactorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartingPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "startingPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartingPositionTimestampInput() {
        return software.amazon.jsii.Kernel.get(this, "startingPositionTimestampInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumRecordAgeInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "maximumRecordAgeInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumRecordAgeInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumRecordAgeInSeconds", java.util.Objects.requireNonNull(value, "maximumRecordAgeInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumRetryAttempts() {
        return software.amazon.jsii.Kernel.get(this, "maximumRetryAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumRetryAttempts(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumRetryAttempts", java.util.Objects.requireNonNull(value, "maximumRetryAttempts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOnPartialBatchItemFailure() {
        return software.amazon.jsii.Kernel.get(this, "onPartialBatchItemFailure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOnPartialBatchItemFailure(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "onPartialBatchItemFailure", java.util.Objects.requireNonNull(value, "onPartialBatchItemFailure is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getParallelizationFactor() {
        return software.amazon.jsii.Kernel.get(this, "parallelizationFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setParallelizationFactor(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "parallelizationFactor", java.util.Objects.requireNonNull(value, "parallelizationFactor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartingPosition() {
        return software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartingPosition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startingPosition", java.util.Objects.requireNonNull(value, "startingPosition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartingPositionTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "startingPositionTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartingPositionTimestamp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startingPositionTimestamp", java.util.Objects.requireNonNull(value, "startingPositionTimestamp is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
