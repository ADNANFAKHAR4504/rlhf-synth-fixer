package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersOutputReference")
public class PipesPipeTargetParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeTargetParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeTargetParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeTargetParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBatchJobParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters value) {
        software.amazon.jsii.Kernel.call(this, "putBatchJobParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCloudwatchLogsParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogsParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcsTaskParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters value) {
        software.amazon.jsii.Kernel.call(this, "putEcsTaskParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEventbridgeEventBusParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters value) {
        software.amazon.jsii.Kernel.call(this, "putEventbridgeEventBusParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters value) {
        software.amazon.jsii.Kernel.call(this, "putHttpParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisStreamParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisStreamParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRedshiftDataParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters value) {
        software.amazon.jsii.Kernel.call(this, "putRedshiftDataParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSagemakerPipelineParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters value) {
        software.amazon.jsii.Kernel.call(this, "putSagemakerPipelineParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqsQueueParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters value) {
        software.amazon.jsii.Kernel.call(this, "putSqsQueueParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStepFunctionStateMachineParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters value) {
        software.amazon.jsii.Kernel.call(this, "putStepFunctionStateMachineParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBatchJobParameters() {
        software.amazon.jsii.Kernel.call(this, "resetBatchJobParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchLogsParameters() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogsParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcsTaskParameters() {
        software.amazon.jsii.Kernel.call(this, "resetEcsTaskParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventbridgeEventBusParameters() {
        software.amazon.jsii.Kernel.call(this, "resetEventbridgeEventBusParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpParameters() {
        software.amazon.jsii.Kernel.call(this, "resetHttpParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetInputTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisStreamParameters() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisStreamParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionParameters() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedshiftDataParameters() {
        software.amazon.jsii.Kernel.call(this, "resetRedshiftDataParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSagemakerPipelineParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSagemakerPipelineParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsQueueParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSqsQueueParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepFunctionStateMachineParameters() {
        software.amazon.jsii.Kernel.call(this, "resetStepFunctionStateMachineParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersOutputReference getBatchJobParameters() {
        return software.amazon.jsii.Kernel.get(this, "batchJobParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParametersOutputReference getCloudwatchLogsParameters() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOutputReference getEcsTaskParameters() {
        return software.amazon.jsii.Kernel.get(this, "ecsTaskParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference getEventbridgeEventBusParameters() {
        return software.amazon.jsii.Kernel.get(this, "eventbridgeEventBusParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParametersOutputReference getHttpParameters() {
        return software.amazon.jsii.Kernel.get(this, "httpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParametersOutputReference getKinesisStreamParameters() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParametersOutputReference getLambdaFunctionParameters() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParametersOutputReference getRedshiftDataParameters() {
        return software.amazon.jsii.Kernel.get(this, "redshiftDataParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParametersOutputReference getSagemakerPipelineParameters() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerPipelineParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParametersOutputReference getSqsQueueParameters() {
        return software.amazon.jsii.Kernel.get(this, "sqsQueueParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference getStepFunctionStateMachineParameters() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctionStateMachineParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters getBatchJobParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "batchJobParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters getCloudwatchLogsParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters getEcsTaskParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "ecsTaskParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters getEventbridgeEventBusParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "eventbridgeEventBusParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters getHttpParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "httpParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "inputTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters getKinesisStreamParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters getLambdaFunctionParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters getRedshiftDataParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "redshiftDataParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters getSagemakerPipelineParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerPipelineParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters getSqsQueueParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsQueueParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters getStepFunctionStateMachineParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctionStateMachineParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputTemplate() {
        return software.amazon.jsii.Kernel.get(this, "inputTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputTemplate", java.util.Objects.requireNonNull(value, "inputTemplate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
