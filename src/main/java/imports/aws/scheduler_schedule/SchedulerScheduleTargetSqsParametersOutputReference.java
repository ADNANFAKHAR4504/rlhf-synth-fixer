package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTargetSqsParametersOutputReference")
public class SchedulerScheduleTargetSqsParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SchedulerScheduleTargetSqsParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SchedulerScheduleTargetSqsParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SchedulerScheduleTargetSqsParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMessageGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetMessageGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "messageGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageGroupId() {
        return software.amazon.jsii.Kernel.get(this, "messageGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageGroupId", java.util.Objects.requireNonNull(value, "messageGroupId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
