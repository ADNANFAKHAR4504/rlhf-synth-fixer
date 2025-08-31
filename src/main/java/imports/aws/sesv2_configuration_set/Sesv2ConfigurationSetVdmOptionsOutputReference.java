package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsOutputReference")
public class Sesv2ConfigurationSetVdmOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetVdmOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetVdmOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetVdmOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDashboardOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDashboardOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGuardianOptions(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions value) {
        software.amazon.jsii.Kernel.call(this, "putGuardianOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDashboardOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDashboardOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGuardianOptions() {
        software.amazon.jsii.Kernel.call(this, "resetGuardianOptions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference getDashboardOptions() {
        return software.amazon.jsii.Kernel.get(this, "dashboardOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference getGuardianOptions() {
        return software.amazon.jsii.Kernel.get(this, "guardianOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions getDashboardOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "dashboardOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsDashboardOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions getGuardianOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "guardianOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptionsGuardianOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
