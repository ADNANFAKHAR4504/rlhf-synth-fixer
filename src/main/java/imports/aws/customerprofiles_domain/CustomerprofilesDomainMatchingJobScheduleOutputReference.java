package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingJobScheduleOutputReference")
public class CustomerprofilesDomainMatchingJobScheduleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainMatchingJobScheduleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainMatchingJobScheduleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainMatchingJobScheduleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDayOfTheWeekInput() {
        return software.amazon.jsii.Kernel.get(this, "dayOfTheWeekInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "timeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDayOfTheWeek() {
        return software.amazon.jsii.Kernel.get(this, "dayOfTheWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDayOfTheWeek(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dayOfTheWeek", java.util.Objects.requireNonNull(value, "dayOfTheWeek is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTime() {
        return software.amazon.jsii.Kernel.get(this, "time", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "time", java.util.Objects.requireNonNull(value, "time is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
