package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermissionOutputReference")
public class ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermissionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermissionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermissionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermissionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOrganizationalUnitArns() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationalUnitArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationArns() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserGroups() {
        software.amazon.jsii.Kernel.call(this, "resetUserGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserIds() {
        software.amazon.jsii.Kernel.call(this, "resetUserIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationalUnitArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "organizationalUnitArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "organizationArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUserGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "userGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUserIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "userIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOrganizationalUnitArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "organizationalUnitArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOrganizationalUnitArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "organizationalUnitArns", java.util.Objects.requireNonNull(value, "organizationalUnitArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOrganizationArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "organizationArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOrganizationArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "organizationArns", java.util.Objects.requireNonNull(value, "organizationArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getUserGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "userGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setUserGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "userGroups", java.util.Objects.requireNonNull(value, "userGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getUserIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "userIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setUserIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "userIds", java.util.Objects.requireNonNull(value, "userIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationLaunchPermission value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
