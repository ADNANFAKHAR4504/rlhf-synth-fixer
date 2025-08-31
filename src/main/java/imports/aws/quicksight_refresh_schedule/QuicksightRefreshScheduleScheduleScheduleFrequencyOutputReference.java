package imports.aws.quicksight_refresh_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.123Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleScheduleFrequencyOutputReference")
public class QuicksightRefreshScheduleScheduleScheduleFrequencyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightRefreshScheduleScheduleScheduleFrequencyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightRefreshScheduleScheduleScheduleFrequencyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightRefreshScheduleScheduleScheduleFrequencyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putRefreshOnDay(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay> __cast_cd4240 = (java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRefreshOnDay", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRefreshOnDay() {
        software.amazon.jsii.Kernel.call(this, "resetRefreshOnDay", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeOfTheDay() {
        software.amazon.jsii.Kernel.call(this, "resetTimeOfTheDay", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimezone() {
        software.amazon.jsii.Kernel.call(this, "resetTimezone", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayList getRefreshOnDay() {
        return software.amazon.jsii.Kernel.get(this, "refreshOnDay", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDayList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "intervalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRefreshOnDayInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshOnDayInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeOfTheDayInput() {
        return software.amazon.jsii.Kernel.get(this, "timeOfTheDayInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "timezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInterval() {
        return software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInterval(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "interval", java.util.Objects.requireNonNull(value, "interval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimeOfTheDay() {
        return software.amazon.jsii.Kernel.get(this, "timeOfTheDay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimeOfTheDay(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timeOfTheDay", java.util.Objects.requireNonNull(value, "timeOfTheDay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimezone() {
        return software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timezone", java.util.Objects.requireNonNull(value, "timezone is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequency value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
