package imports.aws.data_aws_ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSsmcontactsRotation.DataAwsSsmcontactsRotationRecurrenceOutputReference")
public class DataAwsSsmcontactsRotationRecurrenceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsSsmcontactsRotationRecurrenceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsSsmcontactsRotationRecurrenceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsSsmcontactsRotationRecurrenceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceDailySettingsList getDailySettings() {
        return software.amazon.jsii.Kernel.get(this, "dailySettings", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceDailySettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceMonthlySettingsList getMonthlySettings() {
        return software.amazon.jsii.Kernel.get(this, "monthlySettings", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceMonthlySettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfOnCalls() {
        return software.amazon.jsii.Kernel.get(this, "numberOfOnCalls", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRecurrenceMultiplier() {
        return software.amazon.jsii.Kernel.get(this, "recurrenceMultiplier", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceShiftCoveragesList getShiftCoverages() {
        return software.amazon.jsii.Kernel.get(this, "shiftCoverages", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceShiftCoveragesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceWeeklySettingsList getWeeklySettings() {
        return software.amazon.jsii.Kernel.get(this, "weeklySettings", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrenceWeeklySettingsList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrence getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrence.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ssmcontacts_rotation.DataAwsSsmcontactsRotationRecurrence value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
