package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceOutputReference")
public class SsmcontactsRotationRecurrenceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmcontactsRotationRecurrenceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmcontactsRotationRecurrenceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsmcontactsRotationRecurrenceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDailySettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettings> __cast_cd4240 = (java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDailySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMonthlySettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettings> __cast_cd4240 = (java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMonthlySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putShiftCoverages(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoverages>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoverages> __cast_cd4240 = (java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoverages>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoverages __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putShiftCoverages", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWeeklySettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettings> __cast_cd4240 = (java.util.List<imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWeeklySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDailySettings() {
        software.amazon.jsii.Kernel.call(this, "resetDailySettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonthlySettings() {
        software.amazon.jsii.Kernel.call(this, "resetMonthlySettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShiftCoverages() {
        software.amazon.jsii.Kernel.call(this, "resetShiftCoverages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeeklySettings() {
        software.amazon.jsii.Kernel.call(this, "resetWeeklySettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettingsList getDailySettings() {
        return software.amazon.jsii.Kernel.get(this, "dailySettings", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettingsList getMonthlySettings() {
        return software.amazon.jsii.Kernel.get(this, "monthlySettings", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoveragesList getShiftCoverages() {
        return software.amazon.jsii.Kernel.get(this, "shiftCoverages", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoveragesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettingsList getWeeklySettings() {
        return software.amazon.jsii.Kernel.get(this, "weeklySettings", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettingsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDailySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "dailySettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMonthlySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "monthlySettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfOnCallsInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfOnCallsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRecurrenceMultiplierInput() {
        return software.amazon.jsii.Kernel.get(this, "recurrenceMultiplierInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getShiftCoveragesInput() {
        return software.amazon.jsii.Kernel.get(this, "shiftCoveragesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWeeklySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "weeklySettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfOnCalls() {
        return software.amazon.jsii.Kernel.get(this, "numberOfOnCalls", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfOnCalls(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfOnCalls", java.util.Objects.requireNonNull(value, "numberOfOnCalls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRecurrenceMultiplier() {
        return software.amazon.jsii.Kernel.get(this, "recurrenceMultiplier", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRecurrenceMultiplier(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "recurrenceMultiplier", java.util.Objects.requireNonNull(value, "recurrenceMultiplier is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrence value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
