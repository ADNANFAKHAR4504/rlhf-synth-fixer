package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.521Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateHibernationOptionsOutputReference")
public class LaunchTemplateHibernationOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LaunchTemplateHibernationOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplateHibernationOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LaunchTemplateHibernationOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfiguredInput() {
        return software.amazon.jsii.Kernel.get(this, "configuredInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getConfigured() {
        return software.amazon.jsii.Kernel.get(this, "configured", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setConfigured(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "configured", java.util.Objects.requireNonNull(value, "configured is required"));
    }

    public void setConfigured(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "configured", java.util.Objects.requireNonNull(value, "configured is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateHibernationOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateHibernationOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateHibernationOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
