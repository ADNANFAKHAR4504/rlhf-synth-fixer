package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTargetOutputReference")
public class SchedulerScheduleTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SchedulerScheduleTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SchedulerScheduleTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SchedulerScheduleTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDeadLetterConfig(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig value) {
        software.amazon.jsii.Kernel.call(this, "putDeadLetterConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcsParameters(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters value) {
        software.amazon.jsii.Kernel.call(this, "putEcsParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEventbridgeParameters(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters value) {
        software.amazon.jsii.Kernel.call(this, "putEventbridgeParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisParameters(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetryPolicy(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putRetryPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSagemakerPipelineParameters(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters value) {
        software.amazon.jsii.Kernel.call(this, "putSagemakerPipelineParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqsParameters(final @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters value) {
        software.amazon.jsii.Kernel.call(this, "putSqsParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeadLetterConfig() {
        software.amazon.jsii.Kernel.call(this, "resetDeadLetterConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcsParameters() {
        software.amazon.jsii.Kernel.call(this, "resetEcsParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventbridgeParameters() {
        software.amazon.jsii.Kernel.call(this, "resetEventbridgeParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInput() {
        software.amazon.jsii.Kernel.call(this, "resetInput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisParameters() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRetryPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSagemakerPipelineParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSagemakerPipelineParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSqsParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfigOutputReference getDeadLetterConfig() {
        return software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParametersOutputReference getEcsParameters() {
        return software.amazon.jsii.Kernel.get(this, "ecsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParametersOutputReference getEventbridgeParameters() {
        return software.amazon.jsii.Kernel.get(this, "eventbridgeParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParametersOutputReference getKinesisParameters() {
        return software.amazon.jsii.Kernel.get(this, "kinesisParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicyOutputReference getRetryPolicy() {
        return software.amazon.jsii.Kernel.get(this, "retryPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParametersOutputReference getSagemakerPipelineParameters() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerPipelineParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParametersOutputReference getSqsParameters() {
        return software.amazon.jsii.Kernel.get(this, "sqsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArnInput() {
        return software.amazon.jsii.Kernel.get(this, "arnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig getDeadLetterConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "deadLetterConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters getEcsParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "ecsParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters getEventbridgeParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "eventbridgeParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputInput() {
        return software.amazon.jsii.Kernel.get(this, "inputInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters getKinesisParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy getRetryPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "retryPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters getSagemakerPipelineParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerPipelineParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters getSqsParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "arn", java.util.Objects.requireNonNull(value, "arn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInput() {
        return software.amazon.jsii.Kernel.get(this, "input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInput(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "input", java.util.Objects.requireNonNull(value, "input is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
