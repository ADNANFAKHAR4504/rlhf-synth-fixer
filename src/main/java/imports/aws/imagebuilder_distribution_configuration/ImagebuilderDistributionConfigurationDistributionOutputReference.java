package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionOutputReference")
public class ImagebuilderDistributionConfigurationDistributionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderDistributionConfigurationDistributionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderDistributionConfigurationDistributionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ImagebuilderDistributionConfigurationDistributionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAmiDistributionConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAmiDistributionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putContainerDistributionConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putContainerDistributionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFastLaunchConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration> __cast_cd4240 = (java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFastLaunchConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplateConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration> __cast_cd4240 = (java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplateConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3ExportConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putS3ExportConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSsmParameterConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration> __cast_cd4240 = (java.util.List<imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSsmParameterConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmiDistributionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAmiDistributionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContainerDistributionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetContainerDistributionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFastLaunchConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetFastLaunchConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplateConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplateConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLicenseConfigurationArns() {
        software.amazon.jsii.Kernel.call(this, "resetLicenseConfigurationArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3ExportConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetS3ExportConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSsmParameterConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSsmParameterConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationOutputReference getAmiDistributionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "amiDistributionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationOutputReference getContainerDistributionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "containerDistributionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationList getFastLaunchConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "fastLaunchConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfigurationList getLaunchTemplateConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionS3ExportConfigurationOutputReference getS3ExportConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "s3ExportConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionS3ExportConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationList getSsmParameterConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "ssmParameterConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionSsmParameterConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration getAmiDistributionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "amiDistributionConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionAmiDistributionConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration getContainerDistributionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "containerDistributionConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFastLaunchConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "fastLaunchConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLaunchTemplateConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLicenseConfigurationArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "licenseConfigurationArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration getS3ExportConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ExportConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSsmParameterConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "ssmParameterConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLicenseConfigurationArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "licenseConfigurationArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLicenseConfigurationArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "licenseConfigurationArns", java.util.Objects.requireNonNull(value, "licenseConfigurationArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "region", java.util.Objects.requireNonNull(value, "region is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistribution value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
