package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.520Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateCreditSpecificationOutputReference")
public class LaunchTemplateCreditSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateCreditSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateCreditSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplateCreditSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCpuCredits() {
        software.amazon.jsii.Kernel.call(this, "resetCpuCredits", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCpuCreditsInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuCreditsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCpuCredits() {
        return software.amazon.jsii.Kernel.get(this, "cpuCredits", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCpuCredits(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cpuCredits", java.util.Objects.requireNonNull(value, "cpuCredits is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCreditSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCreditSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCreditSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
