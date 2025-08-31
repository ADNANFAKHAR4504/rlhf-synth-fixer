package imports.aws.quicksight_refresh_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.123Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayOutputReference")
public class QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetDayOfMonth() {
        software.amazon.jsii.Kernel.call(this, "resetDayOfMonth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDayOfWeek() {
        software.amazon.jsii.Kernel.call(this, "resetDayOfWeek", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDayOfMonthInput() {
        return software.amazon.jsii.Kernel.get(this, "dayOfMonthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDayOfWeekInput() {
        return software.amazon.jsii.Kernel.get(this, "dayOfWeekInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDayOfMonth() {
        return software.amazon.jsii.Kernel.get(this, "dayOfMonth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDayOfMonth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dayOfMonth", java.util.Objects.requireNonNull(value, "dayOfMonth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDayOfWeek() {
        return software.amazon.jsii.Kernel.get(this, "dayOfWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDayOfWeek(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dayOfWeek", java.util.Objects.requireNonNull(value, "dayOfWeek is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
