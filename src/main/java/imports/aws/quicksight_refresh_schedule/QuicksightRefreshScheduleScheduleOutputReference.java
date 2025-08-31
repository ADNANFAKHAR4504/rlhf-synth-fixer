package imports.aws.quicksight_refresh_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.123Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleOutputReference")
public class QuicksightRefreshScheduleScheduleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightRefreshScheduleScheduleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightRefreshScheduleScheduleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightRefreshScheduleScheduleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putScheduleFrequency(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequency>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequency> __cast_cd4240 = (java.util.List<imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequency>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequency __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putScheduleFrequency", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetScheduleFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartAfterDateTime() {
        software.amazon.jsii.Kernel.call(this, "resetStartAfterDateTime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyList getScheduleFrequency() {
        return software.amazon.jsii.Kernel.get(this, "scheduleFrequency", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRefreshTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScheduleFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartAfterDateTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "startAfterDateTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRefreshType() {
        return software.amazon.jsii.Kernel.get(this, "refreshType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRefreshType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "refreshType", java.util.Objects.requireNonNull(value, "refreshType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartAfterDateTime() {
        return software.amazon.jsii.Kernel.get(this, "startAfterDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartAfterDateTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startAfterDateTime", java.util.Objects.requireNonNull(value, "startAfterDateTime is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleSchedule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
