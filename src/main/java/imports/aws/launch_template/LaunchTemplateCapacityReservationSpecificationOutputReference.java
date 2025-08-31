package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.515Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateCapacityReservationSpecificationOutputReference")
public class LaunchTemplateCapacityReservationSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateCapacityReservationSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateCapacityReservationSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplateCapacityReservationSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCapacityReservationTarget(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityReservationTarget", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCapacityReservationPreference() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationPreference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationTarget() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationTarget", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationCapacityReservationTargetOutputReference getCapacityReservationTarget() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationTarget", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationCapacityReservationTargetOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCapacityReservationPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget getCapacityReservationTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationTargetInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCapacityReservationPreference() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCapacityReservationPreference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "capacityReservationPreference", java.util.Objects.requireNonNull(value, "capacityReservationPreference is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
