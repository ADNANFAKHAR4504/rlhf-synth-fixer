package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationOutputReference")
public class ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnapshotConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSnapshotConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLaunchTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxParallelLaunches() {
        software.amazon.jsii.Kernel.call(this, "resetMaxParallelLaunches", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfigurationOutputReference getSnapshotConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "snapshotConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxParallelLaunchesInput() {
        return software.amazon.jsii.Kernel.get(this, "maxParallelLaunchesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration getSnapshotConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxParallelLaunches() {
        return software.amazon.jsii.Kernel.get(this, "maxParallelLaunches", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxParallelLaunches(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxParallelLaunches", java.util.Objects.requireNonNull(value, "maxParallelLaunches is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
