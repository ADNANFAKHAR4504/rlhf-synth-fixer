package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference")
public class ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetLaunchTemplateId() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplateId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplateName() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplateName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplateVersion() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplateVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateIdInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateNameInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchTemplateId() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchTemplateId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchTemplateId", java.util.Objects.requireNonNull(value, "launchTemplateId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchTemplateName() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchTemplateName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchTemplateName", java.util.Objects.requireNonNull(value, "launchTemplateName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchTemplateVersion() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchTemplateVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchTemplateVersion", java.util.Objects.requireNonNull(value, "launchTemplateVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
