package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.850Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobScheduleFrequencyOutputReference")
public class Macie2ClassificationJobScheduleFrequencyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2ClassificationJobScheduleFrequencyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2ClassificationJobScheduleFrequencyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Macie2ClassificationJobScheduleFrequencyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDailySchedule() {
        software.amazon.jsii.Kernel.call(this, "resetDailySchedule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonthlySchedule() {
        software.amazon.jsii.Kernel.call(this, "resetMonthlySchedule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeeklySchedule() {
        software.amazon.jsii.Kernel.call(this, "resetWeeklySchedule", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDailyScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "dailyScheduleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMonthlyScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "monthlyScheduleInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWeeklyScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "weeklyScheduleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDailySchedule() {
        return software.amazon.jsii.Kernel.get(this, "dailySchedule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDailySchedule(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dailySchedule", java.util.Objects.requireNonNull(value, "dailySchedule is required"));
    }

    public void setDailySchedule(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dailySchedule", java.util.Objects.requireNonNull(value, "dailySchedule is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMonthlySchedule() {
        return software.amazon.jsii.Kernel.get(this, "monthlySchedule", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMonthlySchedule(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "monthlySchedule", java.util.Objects.requireNonNull(value, "monthlySchedule is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWeeklySchedule() {
        return software.amazon.jsii.Kernel.get(this, "weeklySchedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWeeklySchedule(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "weeklySchedule", java.util.Objects.requireNonNull(value, "weeklySchedule is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobScheduleFrequency value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
