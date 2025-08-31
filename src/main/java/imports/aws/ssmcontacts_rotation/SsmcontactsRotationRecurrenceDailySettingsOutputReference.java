package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceDailySettingsOutputReference")
public class SsmcontactsRotationRecurrenceDailySettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmcontactsRotationRecurrenceDailySettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmcontactsRotationRecurrenceDailySettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsmcontactsRotationRecurrenceDailySettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHourOfDayInput() {
        return software.amazon.jsii.Kernel.get(this, "hourOfDayInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinuteOfHourInput() {
        return software.amazon.jsii.Kernel.get(this, "minuteOfHourInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHourOfDay() {
        return software.amazon.jsii.Kernel.get(this, "hourOfDay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHourOfDay(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "hourOfDay", java.util.Objects.requireNonNull(value, "hourOfDay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinuteOfHour() {
        return software.amazon.jsii.Kernel.get(this, "minuteOfHour", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinuteOfHour(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minuteOfHour", java.util.Objects.requireNonNull(value, "minuteOfHour is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
