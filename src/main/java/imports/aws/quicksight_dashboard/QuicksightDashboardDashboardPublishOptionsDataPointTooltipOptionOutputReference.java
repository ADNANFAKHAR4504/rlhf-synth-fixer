package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.103Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference")
public class QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAvailabilityStatus() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityStatus() {
        return software.amazon.jsii.Kernel.get(this, "availabilityStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityStatus", java.util.Objects.requireNonNull(value, "availabilityStatus is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
