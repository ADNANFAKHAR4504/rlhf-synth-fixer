package imports.aws.launch_template;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template aws_launch_template}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplate")
public class LaunchTemplate extends com.hashicorp.cdktf.TerraformResource {

    protected LaunchTemplate(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchTemplate(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.launch_template.LaunchTemplate.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template aws_launch_template} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public LaunchTemplate(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template aws_launch_template} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public LaunchTemplate(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a LaunchTemplate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LaunchTemplate to import. This parameter is required.
     * @param importFromId The id of the existing LaunchTemplate that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LaunchTemplate to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.launch_template.LaunchTemplate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LaunchTemplate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LaunchTemplate to import. This parameter is required.
     * @param importFromId The id of the existing LaunchTemplate that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.launch_template.LaunchTemplate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putBlockDeviceMappings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_template.LaunchTemplateBlockDeviceMappings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_template.LaunchTemplateBlockDeviceMappings> __cast_cd4240 = (java.util.List<imports.aws.launch_template.LaunchTemplateBlockDeviceMappings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_template.LaunchTemplateBlockDeviceMappings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBlockDeviceMappings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCapacityReservationSpecification(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCpuOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCpuOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCpuOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCreditSpecification(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCreditSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCreditSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putElasticGpuSpecifications(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_template.LaunchTemplateElasticGpuSpecifications>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_template.LaunchTemplateElasticGpuSpecifications> __cast_cd4240 = (java.util.List<imports.aws.launch_template.LaunchTemplateElasticGpuSpecifications>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_template.LaunchTemplateElasticGpuSpecifications __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putElasticGpuSpecifications", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putElasticInferenceAccelerator(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator value) {
        software.amazon.jsii.Kernel.call(this, "putElasticInferenceAccelerator", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnclaveOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateEnclaveOptions value) {
        software.amazon.jsii.Kernel.call(this, "putEnclaveOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHibernationOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateHibernationOptions value) {
        software.amazon.jsii.Kernel.call(this, "putHibernationOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIamInstanceProfile(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateIamInstanceProfile value) {
        software.amazon.jsii.Kernel.call(this, "putIamInstanceProfile", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInstanceMarketOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateInstanceMarketOptions value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceMarketOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInstanceRequirements(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateInstanceRequirements value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceRequirements", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLicenseSpecification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_template.LaunchTemplateLicenseSpecification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_template.LaunchTemplateLicenseSpecification> __cast_cd4240 = (java.util.List<imports.aws.launch_template.LaunchTemplateLicenseSpecification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_template.LaunchTemplateLicenseSpecification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLicenseSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMaintenanceOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateMaintenanceOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMaintenanceOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadataOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateMetadataOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMetadataOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMonitoring(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateMonitoring value) {
        software.amazon.jsii.Kernel.call(this, "putMonitoring", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkInterfaces(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_template.LaunchTemplateNetworkInterfaces>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_template.LaunchTemplateNetworkInterfaces> __cast_cd4240 = (java.util.List<imports.aws.launch_template.LaunchTemplateNetworkInterfaces>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_template.LaunchTemplateNetworkInterfaces __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkInterfaces", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlacement(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplatePlacement value) {
        software.amazon.jsii.Kernel.call(this, "putPlacement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrivateDnsNameOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions value) {
        software.amazon.jsii.Kernel.call(this, "putPrivateDnsNameOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTagSpecifications(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_template.LaunchTemplateTagSpecifications>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_template.LaunchTemplateTagSpecifications> __cast_cd4240 = (java.util.List<imports.aws.launch_template.LaunchTemplateTagSpecifications>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_template.LaunchTemplateTagSpecifications __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTagSpecifications", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBlockDeviceMappings() {
        software.amazon.jsii.Kernel.call(this, "resetBlockDeviceMappings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpuOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCpuOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreditSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCreditSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultVersion() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableApiStop() {
        software.amazon.jsii.Kernel.call(this, "resetDisableApiStop", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableApiTermination() {
        software.amazon.jsii.Kernel.call(this, "resetDisableApiTermination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsOptimized() {
        software.amazon.jsii.Kernel.call(this, "resetEbsOptimized", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticGpuSpecifications() {
        software.amazon.jsii.Kernel.call(this, "resetElasticGpuSpecifications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticInferenceAccelerator() {
        software.amazon.jsii.Kernel.call(this, "resetElasticInferenceAccelerator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnclaveOptions() {
        software.amazon.jsii.Kernel.call(this, "resetEnclaveOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHibernationOptions() {
        software.amazon.jsii.Kernel.call(this, "resetHibernationOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamInstanceProfile() {
        software.amazon.jsii.Kernel.call(this, "resetIamInstanceProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageId() {
        software.amazon.jsii.Kernel.call(this, "resetImageId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceInitiatedShutdownBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceMarketOptions() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceMarketOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceRequirements() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceRequirements", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKernelId() {
        software.amazon.jsii.Kernel.call(this, "resetKernelId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLicenseSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetLicenseSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceOptions() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataOptions() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitoring() {
        software.amazon.jsii.Kernel.call(this, "resetMonitoring", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterfaces() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterfaces", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacement() {
        software.amazon.jsii.Kernel.call(this, "resetPlacement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateDnsNameOptions() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateDnsNameOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRamDiskId() {
        software.amazon.jsii.Kernel.call(this, "resetRamDiskId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupNames() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagSpecifications() {
        software.amazon.jsii.Kernel.call(this, "resetTagSpecifications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdateDefaultVersion() {
        software.amazon.jsii.Kernel.call(this, "resetUpdateDefaultVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserData() {
        software.amazon.jsii.Kernel.call(this, "resetUserData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsList getBlockDeviceMappings() {
        return software.amazon.jsii.Kernel.get(this, "blockDeviceMappings", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateBlockDeviceMappingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationOutputReference getCapacityReservationSpecification() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCpuOptionsOutputReference getCpuOptions() {
        return software.amazon.jsii.Kernel.get(this, "cpuOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCpuOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateCreditSpecificationOutputReference getCreditSpecification() {
        return software.amazon.jsii.Kernel.get(this, "creditSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCreditSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateElasticGpuSpecificationsList getElasticGpuSpecifications() {
        return software.amazon.jsii.Kernel.get(this, "elasticGpuSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateElasticGpuSpecificationsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateElasticInferenceAcceleratorOutputReference getElasticInferenceAccelerator() {
        return software.amazon.jsii.Kernel.get(this, "elasticInferenceAccelerator", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateElasticInferenceAcceleratorOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateEnclaveOptionsOutputReference getEnclaveOptions() {
        return software.amazon.jsii.Kernel.get(this, "enclaveOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateEnclaveOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateHibernationOptionsOutputReference getHibernationOptions() {
        return software.amazon.jsii.Kernel.get(this, "hibernationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateHibernationOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateIamInstanceProfileOutputReference getIamInstanceProfile() {
        return software.amazon.jsii.Kernel.get(this, "iamInstanceProfile", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateIamInstanceProfileOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateInstanceMarketOptionsOutputReference getInstanceMarketOptions() {
        return software.amazon.jsii.Kernel.get(this, "instanceMarketOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateInstanceMarketOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateInstanceRequirementsOutputReference getInstanceRequirements() {
        return software.amazon.jsii.Kernel.get(this, "instanceRequirements", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateInstanceRequirementsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLatestVersion() {
        return software.amazon.jsii.Kernel.get(this, "latestVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateLicenseSpecificationList getLicenseSpecification() {
        return software.amazon.jsii.Kernel.get(this, "licenseSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateLicenseSpecificationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateMaintenanceOptionsOutputReference getMaintenanceOptions() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMaintenanceOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateMetadataOptionsOutputReference getMetadataOptions() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMetadataOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateMonitoringOutputReference getMonitoring() {
        return software.amazon.jsii.Kernel.get(this, "monitoring", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMonitoringOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateNetworkInterfacesList getNetworkInterfaces() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaces", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplatePlacementOutputReference getPlacement() {
        return software.amazon.jsii.Kernel.get(this, "placement", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePlacementOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptionsOutputReference getPrivateDnsNameOptions() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsNameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_template.LaunchTemplateTagSpecificationsList getTagSpecifications() {
        return software.amazon.jsii.Kernel.get(this, "tagSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateTagSpecificationsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockDeviceMappingsInput() {
        return software.amazon.jsii.Kernel.get(this, "blockDeviceMappingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification getCapacityReservationSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCpuOptions getCpuOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCpuOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCreditSpecification getCreditSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "creditSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCreditSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiStopInput() {
        return software.amazon.jsii.Kernel.get(this, "disableApiStopInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiTerminationInput() {
        return software.amazon.jsii.Kernel.get(this, "disableApiTerminationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEbsOptimizedInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimizedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getElasticGpuSpecificationsInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticGpuSpecificationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator getElasticInferenceAcceleratorInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticInferenceAcceleratorInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateEnclaveOptions getEnclaveOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "enclaveOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateEnclaveOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateHibernationOptions getHibernationOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "hibernationOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateHibernationOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateIamInstanceProfile getIamInstanceProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "iamInstanceProfileInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateIamInstanceProfile.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "imageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceInitiatedShutdownBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateInstanceMarketOptions getInstanceMarketOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceMarketOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateInstanceMarketOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateInstanceRequirements getInstanceRequirementsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceRequirementsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateInstanceRequirements.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKernelIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "keyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLicenseSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "licenseSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateMaintenanceOptions getMaintenanceOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMaintenanceOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateMetadataOptions getMetadataOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMetadataOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateMonitoring getMonitoringInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMonitoring.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkInterfacesInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfacesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePlacement getPlacementInput() {
        return software.amazon.jsii.Kernel.get(this, "placementInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePlacement.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions getPrivateDnsNameOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsNameOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRamDiskIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ramDiskIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTagSpecificationsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagSpecificationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUpdateDefaultVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "updateDefaultVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserDataInput() {
        return software.amazon.jsii.Kernel.get(this, "userDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultVersion() {
        return software.amazon.jsii.Kernel.get(this, "defaultVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultVersion", java.util.Objects.requireNonNull(value, "defaultVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableApiStop() {
        return software.amazon.jsii.Kernel.get(this, "disableApiStop", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableApiStop(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableApiStop", java.util.Objects.requireNonNull(value, "disableApiStop is required"));
    }

    public void setDisableApiStop(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableApiStop", java.util.Objects.requireNonNull(value, "disableApiStop is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableApiTermination() {
        return software.amazon.jsii.Kernel.get(this, "disableApiTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableApiTermination(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableApiTermination", java.util.Objects.requireNonNull(value, "disableApiTermination is required"));
    }

    public void setDisableApiTermination(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableApiTermination", java.util.Objects.requireNonNull(value, "disableApiTermination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbsOptimized() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEbsOptimized(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ebsOptimized", java.util.Objects.requireNonNull(value, "ebsOptimized is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageId() {
        return software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageId", java.util.Objects.requireNonNull(value, "imageId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceInitiatedShutdownBehavior() {
        return software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceInitiatedShutdownBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceInitiatedShutdownBehavior", java.util.Objects.requireNonNull(value, "instanceInitiatedShutdownBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKernelId() {
        return software.amazon.jsii.Kernel.get(this, "kernelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKernelId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kernelId", java.util.Objects.requireNonNull(value, "kernelId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyName() {
        return software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyName", java.util.Objects.requireNonNull(value, "keyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRamDiskId() {
        return software.amazon.jsii.Kernel.get(this, "ramDiskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRamDiskId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ramDiskId", java.util.Objects.requireNonNull(value, "ramDiskId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupNames", java.util.Objects.requireNonNull(value, "securityGroupNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUpdateDefaultVersion() {
        return software.amazon.jsii.Kernel.get(this, "updateDefaultVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUpdateDefaultVersion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "updateDefaultVersion", java.util.Objects.requireNonNull(value, "updateDefaultVersion is required"));
    }

    public void setUpdateDefaultVersion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "updateDefaultVersion", java.util.Objects.requireNonNull(value, "updateDefaultVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserData() {
        return software.amazon.jsii.Kernel.get(this, "userData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userData", java.util.Objects.requireNonNull(value, "userData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSecurityGroupIds", java.util.Objects.requireNonNull(value, "vpcSecurityGroupIds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.launch_template.LaunchTemplate}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.launch_template.LaunchTemplate> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.launch_template.LaunchTemplateConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * block_device_mappings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#block_device_mappings LaunchTemplate#block_device_mappings}
         * <p>
         * @return {@code this}
         * @param blockDeviceMappings block_device_mappings block. This parameter is required.
         */
        public Builder blockDeviceMappings(final com.hashicorp.cdktf.IResolvable blockDeviceMappings) {
            this.config().blockDeviceMappings(blockDeviceMappings);
            return this;
        }
        /**
         * block_device_mappings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#block_device_mappings LaunchTemplate#block_device_mappings}
         * <p>
         * @return {@code this}
         * @param blockDeviceMappings block_device_mappings block. This parameter is required.
         */
        public Builder blockDeviceMappings(final java.util.List<? extends imports.aws.launch_template.LaunchTemplateBlockDeviceMappings> blockDeviceMappings) {
            this.config().blockDeviceMappings(blockDeviceMappings);
            return this;
        }

        /**
         * capacity_reservation_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_specification LaunchTemplate#capacity_reservation_specification}
         * <p>
         * @return {@code this}
         * @param capacityReservationSpecification capacity_reservation_specification block. This parameter is required.
         */
        public Builder capacityReservationSpecification(final imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification capacityReservationSpecification) {
            this.config().capacityReservationSpecification(capacityReservationSpecification);
            return this;
        }

        /**
         * cpu_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#cpu_options LaunchTemplate#cpu_options}
         * <p>
         * @return {@code this}
         * @param cpuOptions cpu_options block. This parameter is required.
         */
        public Builder cpuOptions(final imports.aws.launch_template.LaunchTemplateCpuOptions cpuOptions) {
            this.config().cpuOptions(cpuOptions);
            return this;
        }

        /**
         * credit_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#credit_specification LaunchTemplate#credit_specification}
         * <p>
         * @return {@code this}
         * @param creditSpecification credit_specification block. This parameter is required.
         */
        public Builder creditSpecification(final imports.aws.launch_template.LaunchTemplateCreditSpecification creditSpecification) {
            this.config().creditSpecification(creditSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#default_version LaunchTemplate#default_version}.
         * <p>
         * @return {@code this}
         * @param defaultVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#default_version LaunchTemplate#default_version}. This parameter is required.
         */
        public Builder defaultVersion(final java.lang.Number defaultVersion) {
            this.config().defaultVersion(defaultVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#description LaunchTemplate#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#description LaunchTemplate#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config().description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}.
         * <p>
         * @return {@code this}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}. This parameter is required.
         */
        public Builder disableApiStop(final java.lang.Boolean disableApiStop) {
            this.config().disableApiStop(disableApiStop);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}.
         * <p>
         * @return {@code this}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}. This parameter is required.
         */
        public Builder disableApiStop(final com.hashicorp.cdktf.IResolvable disableApiStop) {
            this.config().disableApiStop(disableApiStop);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}.
         * <p>
         * @return {@code this}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}. This parameter is required.
         */
        public Builder disableApiTermination(final java.lang.Boolean disableApiTermination) {
            this.config().disableApiTermination(disableApiTermination);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}.
         * <p>
         * @return {@code this}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}. This parameter is required.
         */
        public Builder disableApiTermination(final com.hashicorp.cdktf.IResolvable disableApiTermination) {
            this.config().disableApiTermination(disableApiTermination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ebs_optimized LaunchTemplate#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ebs_optimized LaunchTemplate#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final java.lang.String ebsOptimized) {
            this.config().ebsOptimized(ebsOptimized);
            return this;
        }

        /**
         * elastic_gpu_specifications block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_gpu_specifications LaunchTemplate#elastic_gpu_specifications}
         * <p>
         * @return {@code this}
         * @param elasticGpuSpecifications elastic_gpu_specifications block. This parameter is required.
         */
        public Builder elasticGpuSpecifications(final com.hashicorp.cdktf.IResolvable elasticGpuSpecifications) {
            this.config().elasticGpuSpecifications(elasticGpuSpecifications);
            return this;
        }
        /**
         * elastic_gpu_specifications block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_gpu_specifications LaunchTemplate#elastic_gpu_specifications}
         * <p>
         * @return {@code this}
         * @param elasticGpuSpecifications elastic_gpu_specifications block. This parameter is required.
         */
        public Builder elasticGpuSpecifications(final java.util.List<? extends imports.aws.launch_template.LaunchTemplateElasticGpuSpecifications> elasticGpuSpecifications) {
            this.config().elasticGpuSpecifications(elasticGpuSpecifications);
            return this;
        }

        /**
         * elastic_inference_accelerator block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_inference_accelerator LaunchTemplate#elastic_inference_accelerator}
         * <p>
         * @return {@code this}
         * @param elasticInferenceAccelerator elastic_inference_accelerator block. This parameter is required.
         */
        public Builder elasticInferenceAccelerator(final imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator elasticInferenceAccelerator) {
            this.config().elasticInferenceAccelerator(elasticInferenceAccelerator);
            return this;
        }

        /**
         * enclave_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enclave_options LaunchTemplate#enclave_options}
         * <p>
         * @return {@code this}
         * @param enclaveOptions enclave_options block. This parameter is required.
         */
        public Builder enclaveOptions(final imports.aws.launch_template.LaunchTemplateEnclaveOptions enclaveOptions) {
            this.config().enclaveOptions(enclaveOptions);
            return this;
        }

        /**
         * hibernation_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#hibernation_options LaunchTemplate#hibernation_options}
         * <p>
         * @return {@code this}
         * @param hibernationOptions hibernation_options block. This parameter is required.
         */
        public Builder hibernationOptions(final imports.aws.launch_template.LaunchTemplateHibernationOptions hibernationOptions) {
            this.config().hibernationOptions(hibernationOptions);
            return this;
        }

        /**
         * iam_instance_profile block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#iam_instance_profile LaunchTemplate#iam_instance_profile}
         * <p>
         * @return {@code this}
         * @param iamInstanceProfile iam_instance_profile block. This parameter is required.
         */
        public Builder iamInstanceProfile(final imports.aws.launch_template.LaunchTemplateIamInstanceProfile iamInstanceProfile) {
            this.config().iamInstanceProfile(iamInstanceProfile);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#id LaunchTemplate#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#id LaunchTemplate#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#image_id LaunchTemplate#image_id}.
         * <p>
         * @return {@code this}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#image_id LaunchTemplate#image_id}. This parameter is required.
         */
        public Builder imageId(final java.lang.String imageId) {
            this.config().imageId(imageId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_initiated_shutdown_behavior LaunchTemplate#instance_initiated_shutdown_behavior}.
         * <p>
         * @return {@code this}
         * @param instanceInitiatedShutdownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_initiated_shutdown_behavior LaunchTemplate#instance_initiated_shutdown_behavior}. This parameter is required.
         */
        public Builder instanceInitiatedShutdownBehavior(final java.lang.String instanceInitiatedShutdownBehavior) {
            this.config().instanceInitiatedShutdownBehavior(instanceInitiatedShutdownBehavior);
            return this;
        }

        /**
         * instance_market_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_market_options LaunchTemplate#instance_market_options}
         * <p>
         * @return {@code this}
         * @param instanceMarketOptions instance_market_options block. This parameter is required.
         */
        public Builder instanceMarketOptions(final imports.aws.launch_template.LaunchTemplateInstanceMarketOptions instanceMarketOptions) {
            this.config().instanceMarketOptions(instanceMarketOptions);
            return this;
        }

        /**
         * instance_requirements block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_requirements LaunchTemplate#instance_requirements}
         * <p>
         * @return {@code this}
         * @param instanceRequirements instance_requirements block. This parameter is required.
         */
        public Builder instanceRequirements(final imports.aws.launch_template.LaunchTemplateInstanceRequirements instanceRequirements) {
            this.config().instanceRequirements(instanceRequirements);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_type LaunchTemplate#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_type LaunchTemplate#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config().instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#kernel_id LaunchTemplate#kernel_id}.
         * <p>
         * @return {@code this}
         * @param kernelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#kernel_id LaunchTemplate#kernel_id}. This parameter is required.
         */
        public Builder kernelId(final java.lang.String kernelId) {
            this.config().kernelId(kernelId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#key_name LaunchTemplate#key_name}.
         * <p>
         * @return {@code this}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#key_name LaunchTemplate#key_name}. This parameter is required.
         */
        public Builder keyName(final java.lang.String keyName) {
            this.config().keyName(keyName);
            return this;
        }

        /**
         * license_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#license_specification LaunchTemplate#license_specification}
         * <p>
         * @return {@code this}
         * @param licenseSpecification license_specification block. This parameter is required.
         */
        public Builder licenseSpecification(final com.hashicorp.cdktf.IResolvable licenseSpecification) {
            this.config().licenseSpecification(licenseSpecification);
            return this;
        }
        /**
         * license_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#license_specification LaunchTemplate#license_specification}
         * <p>
         * @return {@code this}
         * @param licenseSpecification license_specification block. This parameter is required.
         */
        public Builder licenseSpecification(final java.util.List<? extends imports.aws.launch_template.LaunchTemplateLicenseSpecification> licenseSpecification) {
            this.config().licenseSpecification(licenseSpecification);
            return this;
        }

        /**
         * maintenance_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#maintenance_options LaunchTemplate#maintenance_options}
         * <p>
         * @return {@code this}
         * @param maintenanceOptions maintenance_options block. This parameter is required.
         */
        public Builder maintenanceOptions(final imports.aws.launch_template.LaunchTemplateMaintenanceOptions maintenanceOptions) {
            this.config().maintenanceOptions(maintenanceOptions);
            return this;
        }

        /**
         * metadata_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#metadata_options LaunchTemplate#metadata_options}
         * <p>
         * @return {@code this}
         * @param metadataOptions metadata_options block. This parameter is required.
         */
        public Builder metadataOptions(final imports.aws.launch_template.LaunchTemplateMetadataOptions metadataOptions) {
            this.config().metadataOptions(metadataOptions);
            return this;
        }

        /**
         * monitoring block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#monitoring LaunchTemplate#monitoring}
         * <p>
         * @return {@code this}
         * @param monitoring monitoring block. This parameter is required.
         */
        public Builder monitoring(final imports.aws.launch_template.LaunchTemplateMonitoring monitoring) {
            this.config().monitoring(monitoring);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name LaunchTemplate#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name LaunchTemplate#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config().name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name_prefix LaunchTemplate#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name_prefix LaunchTemplate#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config().namePrefix(namePrefix);
            return this;
        }

        /**
         * network_interfaces block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interfaces LaunchTemplate#network_interfaces}
         * <p>
         * @return {@code this}
         * @param networkInterfaces network_interfaces block. This parameter is required.
         */
        public Builder networkInterfaces(final com.hashicorp.cdktf.IResolvable networkInterfaces) {
            this.config().networkInterfaces(networkInterfaces);
            return this;
        }
        /**
         * network_interfaces block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interfaces LaunchTemplate#network_interfaces}
         * <p>
         * @return {@code this}
         * @param networkInterfaces network_interfaces block. This parameter is required.
         */
        public Builder networkInterfaces(final java.util.List<? extends imports.aws.launch_template.LaunchTemplateNetworkInterfaces> networkInterfaces) {
            this.config().networkInterfaces(networkInterfaces);
            return this;
        }

        /**
         * placement block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#placement LaunchTemplate#placement}
         * <p>
         * @return {@code this}
         * @param placement placement block. This parameter is required.
         */
        public Builder placement(final imports.aws.launch_template.LaunchTemplatePlacement placement) {
            this.config().placement(placement);
            return this;
        }

        /**
         * private_dns_name_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#private_dns_name_options LaunchTemplate#private_dns_name_options}
         * <p>
         * @return {@code this}
         * @param privateDnsNameOptions private_dns_name_options block. This parameter is required.
         */
        public Builder privateDnsNameOptions(final imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions privateDnsNameOptions) {
            this.config().privateDnsNameOptions(privateDnsNameOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ram_disk_id LaunchTemplate#ram_disk_id}.
         * <p>
         * @return {@code this}
         * @param ramDiskId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ram_disk_id LaunchTemplate#ram_disk_id}. This parameter is required.
         */
        public Builder ramDiskId(final java.lang.String ramDiskId) {
            this.config().ramDiskId(ramDiskId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#security_group_names LaunchTemplate#security_group_names}.
         * <p>
         * @return {@code this}
         * @param securityGroupNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#security_group_names LaunchTemplate#security_group_names}. This parameter is required.
         */
        public Builder securityGroupNames(final java.util.List<java.lang.String> securityGroupNames) {
            this.config().securityGroupNames(securityGroupNames);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags LaunchTemplate#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags LaunchTemplate#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags_all LaunchTemplate#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags_all LaunchTemplate#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * tag_specifications block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tag_specifications LaunchTemplate#tag_specifications}
         * <p>
         * @return {@code this}
         * @param tagSpecifications tag_specifications block. This parameter is required.
         */
        public Builder tagSpecifications(final com.hashicorp.cdktf.IResolvable tagSpecifications) {
            this.config().tagSpecifications(tagSpecifications);
            return this;
        }
        /**
         * tag_specifications block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tag_specifications LaunchTemplate#tag_specifications}
         * <p>
         * @return {@code this}
         * @param tagSpecifications tag_specifications block. This parameter is required.
         */
        public Builder tagSpecifications(final java.util.List<? extends imports.aws.launch_template.LaunchTemplateTagSpecifications> tagSpecifications) {
            this.config().tagSpecifications(tagSpecifications);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}.
         * <p>
         * @return {@code this}
         * @param updateDefaultVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}. This parameter is required.
         */
        public Builder updateDefaultVersion(final java.lang.Boolean updateDefaultVersion) {
            this.config().updateDefaultVersion(updateDefaultVersion);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}.
         * <p>
         * @return {@code this}
         * @param updateDefaultVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}. This parameter is required.
         */
        public Builder updateDefaultVersion(final com.hashicorp.cdktf.IResolvable updateDefaultVersion) {
            this.config().updateDefaultVersion(updateDefaultVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#user_data LaunchTemplate#user_data}.
         * <p>
         * @return {@code this}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#user_data LaunchTemplate#user_data}. This parameter is required.
         */
        public Builder userData(final java.lang.String userData) {
            this.config().userData(userData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#vpc_security_group_ids LaunchTemplate#vpc_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#vpc_security_group_ids LaunchTemplate#vpc_security_group_ids}. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config().vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.launch_template.LaunchTemplate}.
         */
        @Override
        public imports.aws.launch_template.LaunchTemplate build() {
            return new imports.aws.launch_template.LaunchTemplate(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.launch_template.LaunchTemplateConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.launch_template.LaunchTemplateConfig.Builder();
            }
            return this.config;
        }
    }
}
