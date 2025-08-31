package imports.aws.opsworks_custom_layer;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer aws_opsworks_custom_layer}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksCustomLayer.OpsworksCustomLayer")
public class OpsworksCustomLayer extends com.hashicorp.cdktf.TerraformResource {

    protected OpsworksCustomLayer(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksCustomLayer(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.opsworks_custom_layer.OpsworksCustomLayer.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer aws_opsworks_custom_layer} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OpsworksCustomLayer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OpsworksCustomLayer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksCustomLayer to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksCustomLayer that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OpsworksCustomLayer to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_custom_layer.OpsworksCustomLayer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OpsworksCustomLayer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksCustomLayer to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksCustomLayer that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_custom_layer.OpsworksCustomLayer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCloudwatchConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerCloudwatchConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEbsVolume(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolume>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolume> __cast_cd4240 = (java.util.List<imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolume>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolume __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEbsVolume", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLoadBasedAutoScaling(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling value) {
        software.amazon.jsii.Kernel.call(this, "putLoadBasedAutoScaling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoAssignElasticIps() {
        software.amazon.jsii.Kernel.call(this, "resetAutoAssignElasticIps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoAssignPublicIps() {
        software.amazon.jsii.Kernel.call(this, "resetAutoAssignPublicIps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoHealing() {
        software.amazon.jsii.Kernel.call(this, "resetAutoHealing", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomConfigureRecipes() {
        software.amazon.jsii.Kernel.call(this, "resetCustomConfigureRecipes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomDeployRecipes() {
        software.amazon.jsii.Kernel.call(this, "resetCustomDeployRecipes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomInstanceProfileArn() {
        software.amazon.jsii.Kernel.call(this, "resetCustomInstanceProfileArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomJson() {
        software.amazon.jsii.Kernel.call(this, "resetCustomJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetCustomSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomSetupRecipes() {
        software.amazon.jsii.Kernel.call(this, "resetCustomSetupRecipes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomShutdownRecipes() {
        software.amazon.jsii.Kernel.call(this, "resetCustomShutdownRecipes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomUndeployRecipes() {
        software.amazon.jsii.Kernel.call(this, "resetCustomUndeployRecipes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDrainElbOnShutdown() {
        software.amazon.jsii.Kernel.call(this, "resetDrainElbOnShutdown", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsVolume() {
        software.amazon.jsii.Kernel.call(this, "resetEbsVolume", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticLoadBalancer() {
        software.amazon.jsii.Kernel.call(this, "resetElasticLoadBalancer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstallUpdatesOnBoot() {
        software.amazon.jsii.Kernel.call(this, "resetInstallUpdatesOnBoot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceShutdownTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceShutdownTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBasedAutoScaling() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBasedAutoScaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSystemPackages() {
        software.amazon.jsii.Kernel.call(this, "resetSystemPackages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseEbsOptimizedInstances() {
        software.amazon.jsii.Kernel.call(this, "resetUseEbsOptimizedInstances", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerCloudwatchConfigurationOutputReference getCloudwatchConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerCloudwatchConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolumeList getEbsVolume() {
        return software.amazon.jsii.Kernel.get(this, "ebsVolume", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolumeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingOutputReference getLoadBasedAutoScaling() {
        return software.amazon.jsii.Kernel.get(this, "loadBasedAutoScaling", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoAssignElasticIpsInput() {
        return software.amazon.jsii.Kernel.get(this, "autoAssignElasticIpsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoAssignPublicIpsInput() {
        return software.amazon.jsii.Kernel.get(this, "autoAssignPublicIpsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoHealingInput() {
        return software.amazon.jsii.Kernel.get(this, "autoHealingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerCloudwatchConfiguration getCloudwatchConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerCloudwatchConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomConfigureRecipesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customConfigureRecipesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomDeployRecipesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customDeployRecipesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomInstanceProfileArnInput() {
        return software.amazon.jsii.Kernel.get(this, "customInstanceProfileArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "customJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomSetupRecipesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customSetupRecipesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomShutdownRecipesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customShutdownRecipesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomUndeployRecipesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customUndeployRecipesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDrainElbOnShutdownInput() {
        return software.amazon.jsii.Kernel.get(this, "drainElbOnShutdownInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsVolumeInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsVolumeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getElasticLoadBalancerInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticLoadBalancerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInstallUpdatesOnBootInput() {
        return software.amazon.jsii.Kernel.get(this, "installUpdatesOnBootInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInstanceShutdownTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceShutdownTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling getLoadBasedAutoScalingInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBasedAutoScalingInput", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getShortNameInput() {
        return software.amazon.jsii.Kernel.get(this, "shortNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStackIdInput() {
        return software.amazon.jsii.Kernel.get(this, "stackIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSystemPackagesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "systemPackagesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseEbsOptimizedInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "useEbsOptimizedInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoAssignElasticIps() {
        return software.amazon.jsii.Kernel.get(this, "autoAssignElasticIps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoAssignElasticIps(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoAssignElasticIps", java.util.Objects.requireNonNull(value, "autoAssignElasticIps is required"));
    }

    public void setAutoAssignElasticIps(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoAssignElasticIps", java.util.Objects.requireNonNull(value, "autoAssignElasticIps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoAssignPublicIps() {
        return software.amazon.jsii.Kernel.get(this, "autoAssignPublicIps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoAssignPublicIps(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoAssignPublicIps", java.util.Objects.requireNonNull(value, "autoAssignPublicIps is required"));
    }

    public void setAutoAssignPublicIps(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoAssignPublicIps", java.util.Objects.requireNonNull(value, "autoAssignPublicIps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoHealing() {
        return software.amazon.jsii.Kernel.get(this, "autoHealing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoHealing(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoHealing", java.util.Objects.requireNonNull(value, "autoHealing is required"));
    }

    public void setAutoHealing(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoHealing", java.util.Objects.requireNonNull(value, "autoHealing is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomConfigureRecipes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customConfigureRecipes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomConfigureRecipes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customConfigureRecipes", java.util.Objects.requireNonNull(value, "customConfigureRecipes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomDeployRecipes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customDeployRecipes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomDeployRecipes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customDeployRecipes", java.util.Objects.requireNonNull(value, "customDeployRecipes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomInstanceProfileArn() {
        return software.amazon.jsii.Kernel.get(this, "customInstanceProfileArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomInstanceProfileArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customInstanceProfileArn", java.util.Objects.requireNonNull(value, "customInstanceProfileArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomJson() {
        return software.amazon.jsii.Kernel.get(this, "customJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customJson", java.util.Objects.requireNonNull(value, "customJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customSecurityGroupIds", java.util.Objects.requireNonNull(value, "customSecurityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomSetupRecipes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customSetupRecipes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomSetupRecipes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customSetupRecipes", java.util.Objects.requireNonNull(value, "customSetupRecipes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomShutdownRecipes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customShutdownRecipes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomShutdownRecipes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customShutdownRecipes", java.util.Objects.requireNonNull(value, "customShutdownRecipes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomUndeployRecipes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customUndeployRecipes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomUndeployRecipes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customUndeployRecipes", java.util.Objects.requireNonNull(value, "customUndeployRecipes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDrainElbOnShutdown() {
        return software.amazon.jsii.Kernel.get(this, "drainElbOnShutdown", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDrainElbOnShutdown(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "drainElbOnShutdown", java.util.Objects.requireNonNull(value, "drainElbOnShutdown is required"));
    }

    public void setDrainElbOnShutdown(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "drainElbOnShutdown", java.util.Objects.requireNonNull(value, "drainElbOnShutdown is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getElasticLoadBalancer() {
        return software.amazon.jsii.Kernel.get(this, "elasticLoadBalancer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setElasticLoadBalancer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "elasticLoadBalancer", java.util.Objects.requireNonNull(value, "elasticLoadBalancer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInstallUpdatesOnBoot() {
        return software.amazon.jsii.Kernel.get(this, "installUpdatesOnBoot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInstallUpdatesOnBoot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "installUpdatesOnBoot", java.util.Objects.requireNonNull(value, "installUpdatesOnBoot is required"));
    }

    public void setInstallUpdatesOnBoot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "installUpdatesOnBoot", java.util.Objects.requireNonNull(value, "installUpdatesOnBoot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInstanceShutdownTimeout() {
        return software.amazon.jsii.Kernel.get(this, "instanceShutdownTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInstanceShutdownTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "instanceShutdownTimeout", java.util.Objects.requireNonNull(value, "instanceShutdownTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getShortName() {
        return software.amazon.jsii.Kernel.get(this, "shortName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setShortName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "shortName", java.util.Objects.requireNonNull(value, "shortName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackId() {
        return software.amazon.jsii.Kernel.get(this, "stackId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStackId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stackId", java.util.Objects.requireNonNull(value, "stackId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSystemPackages() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "systemPackages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSystemPackages(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "systemPackages", java.util.Objects.requireNonNull(value, "systemPackages is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseEbsOptimizedInstances() {
        return software.amazon.jsii.Kernel.get(this, "useEbsOptimizedInstances", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseEbsOptimizedInstances(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useEbsOptimizedInstances", java.util.Objects.requireNonNull(value, "useEbsOptimizedInstances is required"));
    }

    public void setUseEbsOptimizedInstances(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useEbsOptimizedInstances", java.util.Objects.requireNonNull(value, "useEbsOptimizedInstances is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.opsworks_custom_layer.OpsworksCustomLayer}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.opsworks_custom_layer.OpsworksCustomLayer> {
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
        private final imports.aws.opsworks_custom_layer.OpsworksCustomLayerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.opsworks_custom_layer.OpsworksCustomLayerConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#name OpsworksCustomLayer#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#name OpsworksCustomLayer#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#short_name OpsworksCustomLayer#short_name}.
         * <p>
         * @return {@code this}
         * @param shortName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#short_name OpsworksCustomLayer#short_name}. This parameter is required.
         */
        public Builder shortName(final java.lang.String shortName) {
            this.config.shortName(shortName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#stack_id OpsworksCustomLayer#stack_id}.
         * <p>
         * @return {@code this}
         * @param stackId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#stack_id OpsworksCustomLayer#stack_id}. This parameter is required.
         */
        public Builder stackId(final java.lang.String stackId) {
            this.config.stackId(stackId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_elastic_ips OpsworksCustomLayer#auto_assign_elastic_ips}.
         * <p>
         * @return {@code this}
         * @param autoAssignElasticIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_elastic_ips OpsworksCustomLayer#auto_assign_elastic_ips}. This parameter is required.
         */
        public Builder autoAssignElasticIps(final java.lang.Boolean autoAssignElasticIps) {
            this.config.autoAssignElasticIps(autoAssignElasticIps);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_elastic_ips OpsworksCustomLayer#auto_assign_elastic_ips}.
         * <p>
         * @return {@code this}
         * @param autoAssignElasticIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_elastic_ips OpsworksCustomLayer#auto_assign_elastic_ips}. This parameter is required.
         */
        public Builder autoAssignElasticIps(final com.hashicorp.cdktf.IResolvable autoAssignElasticIps) {
            this.config.autoAssignElasticIps(autoAssignElasticIps);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_public_ips OpsworksCustomLayer#auto_assign_public_ips}.
         * <p>
         * @return {@code this}
         * @param autoAssignPublicIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_public_ips OpsworksCustomLayer#auto_assign_public_ips}. This parameter is required.
         */
        public Builder autoAssignPublicIps(final java.lang.Boolean autoAssignPublicIps) {
            this.config.autoAssignPublicIps(autoAssignPublicIps);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_public_ips OpsworksCustomLayer#auto_assign_public_ips}.
         * <p>
         * @return {@code this}
         * @param autoAssignPublicIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_assign_public_ips OpsworksCustomLayer#auto_assign_public_ips}. This parameter is required.
         */
        public Builder autoAssignPublicIps(final com.hashicorp.cdktf.IResolvable autoAssignPublicIps) {
            this.config.autoAssignPublicIps(autoAssignPublicIps);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_healing OpsworksCustomLayer#auto_healing}.
         * <p>
         * @return {@code this}
         * @param autoHealing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_healing OpsworksCustomLayer#auto_healing}. This parameter is required.
         */
        public Builder autoHealing(final java.lang.Boolean autoHealing) {
            this.config.autoHealing(autoHealing);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_healing OpsworksCustomLayer#auto_healing}.
         * <p>
         * @return {@code this}
         * @param autoHealing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#auto_healing OpsworksCustomLayer#auto_healing}. This parameter is required.
         */
        public Builder autoHealing(final com.hashicorp.cdktf.IResolvable autoHealing) {
            this.config.autoHealing(autoHealing);
            return this;
        }

        /**
         * cloudwatch_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#cloudwatch_configuration OpsworksCustomLayer#cloudwatch_configuration}
         * <p>
         * @return {@code this}
         * @param cloudwatchConfiguration cloudwatch_configuration block. This parameter is required.
         */
        public Builder cloudwatchConfiguration(final imports.aws.opsworks_custom_layer.OpsworksCustomLayerCloudwatchConfiguration cloudwatchConfiguration) {
            this.config.cloudwatchConfiguration(cloudwatchConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_configure_recipes OpsworksCustomLayer#custom_configure_recipes}.
         * <p>
         * @return {@code this}
         * @param customConfigureRecipes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_configure_recipes OpsworksCustomLayer#custom_configure_recipes}. This parameter is required.
         */
        public Builder customConfigureRecipes(final java.util.List<java.lang.String> customConfigureRecipes) {
            this.config.customConfigureRecipes(customConfigureRecipes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_deploy_recipes OpsworksCustomLayer#custom_deploy_recipes}.
         * <p>
         * @return {@code this}
         * @param customDeployRecipes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_deploy_recipes OpsworksCustomLayer#custom_deploy_recipes}. This parameter is required.
         */
        public Builder customDeployRecipes(final java.util.List<java.lang.String> customDeployRecipes) {
            this.config.customDeployRecipes(customDeployRecipes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_instance_profile_arn OpsworksCustomLayer#custom_instance_profile_arn}.
         * <p>
         * @return {@code this}
         * @param customInstanceProfileArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_instance_profile_arn OpsworksCustomLayer#custom_instance_profile_arn}. This parameter is required.
         */
        public Builder customInstanceProfileArn(final java.lang.String customInstanceProfileArn) {
            this.config.customInstanceProfileArn(customInstanceProfileArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_json OpsworksCustomLayer#custom_json}.
         * <p>
         * @return {@code this}
         * @param customJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_json OpsworksCustomLayer#custom_json}. This parameter is required.
         */
        public Builder customJson(final java.lang.String customJson) {
            this.config.customJson(customJson);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_security_group_ids OpsworksCustomLayer#custom_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param customSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_security_group_ids OpsworksCustomLayer#custom_security_group_ids}. This parameter is required.
         */
        public Builder customSecurityGroupIds(final java.util.List<java.lang.String> customSecurityGroupIds) {
            this.config.customSecurityGroupIds(customSecurityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_setup_recipes OpsworksCustomLayer#custom_setup_recipes}.
         * <p>
         * @return {@code this}
         * @param customSetupRecipes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_setup_recipes OpsworksCustomLayer#custom_setup_recipes}. This parameter is required.
         */
        public Builder customSetupRecipes(final java.util.List<java.lang.String> customSetupRecipes) {
            this.config.customSetupRecipes(customSetupRecipes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_shutdown_recipes OpsworksCustomLayer#custom_shutdown_recipes}.
         * <p>
         * @return {@code this}
         * @param customShutdownRecipes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_shutdown_recipes OpsworksCustomLayer#custom_shutdown_recipes}. This parameter is required.
         */
        public Builder customShutdownRecipes(final java.util.List<java.lang.String> customShutdownRecipes) {
            this.config.customShutdownRecipes(customShutdownRecipes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_undeploy_recipes OpsworksCustomLayer#custom_undeploy_recipes}.
         * <p>
         * @return {@code this}
         * @param customUndeployRecipes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#custom_undeploy_recipes OpsworksCustomLayer#custom_undeploy_recipes}. This parameter is required.
         */
        public Builder customUndeployRecipes(final java.util.List<java.lang.String> customUndeployRecipes) {
            this.config.customUndeployRecipes(customUndeployRecipes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#drain_elb_on_shutdown OpsworksCustomLayer#drain_elb_on_shutdown}.
         * <p>
         * @return {@code this}
         * @param drainElbOnShutdown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#drain_elb_on_shutdown OpsworksCustomLayer#drain_elb_on_shutdown}. This parameter is required.
         */
        public Builder drainElbOnShutdown(final java.lang.Boolean drainElbOnShutdown) {
            this.config.drainElbOnShutdown(drainElbOnShutdown);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#drain_elb_on_shutdown OpsworksCustomLayer#drain_elb_on_shutdown}.
         * <p>
         * @return {@code this}
         * @param drainElbOnShutdown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#drain_elb_on_shutdown OpsworksCustomLayer#drain_elb_on_shutdown}. This parameter is required.
         */
        public Builder drainElbOnShutdown(final com.hashicorp.cdktf.IResolvable drainElbOnShutdown) {
            this.config.drainElbOnShutdown(drainElbOnShutdown);
            return this;
        }

        /**
         * ebs_volume block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#ebs_volume OpsworksCustomLayer#ebs_volume}
         * <p>
         * @return {@code this}
         * @param ebsVolume ebs_volume block. This parameter is required.
         */
        public Builder ebsVolume(final com.hashicorp.cdktf.IResolvable ebsVolume) {
            this.config.ebsVolume(ebsVolume);
            return this;
        }
        /**
         * ebs_volume block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#ebs_volume OpsworksCustomLayer#ebs_volume}
         * <p>
         * @return {@code this}
         * @param ebsVolume ebs_volume block. This parameter is required.
         */
        public Builder ebsVolume(final java.util.List<? extends imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolume> ebsVolume) {
            this.config.ebsVolume(ebsVolume);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#elastic_load_balancer OpsworksCustomLayer#elastic_load_balancer}.
         * <p>
         * @return {@code this}
         * @param elasticLoadBalancer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#elastic_load_balancer OpsworksCustomLayer#elastic_load_balancer}. This parameter is required.
         */
        public Builder elasticLoadBalancer(final java.lang.String elasticLoadBalancer) {
            this.config.elasticLoadBalancer(elasticLoadBalancer);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#id OpsworksCustomLayer#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#id OpsworksCustomLayer#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#install_updates_on_boot OpsworksCustomLayer#install_updates_on_boot}.
         * <p>
         * @return {@code this}
         * @param installUpdatesOnBoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#install_updates_on_boot OpsworksCustomLayer#install_updates_on_boot}. This parameter is required.
         */
        public Builder installUpdatesOnBoot(final java.lang.Boolean installUpdatesOnBoot) {
            this.config.installUpdatesOnBoot(installUpdatesOnBoot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#install_updates_on_boot OpsworksCustomLayer#install_updates_on_boot}.
         * <p>
         * @return {@code this}
         * @param installUpdatesOnBoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#install_updates_on_boot OpsworksCustomLayer#install_updates_on_boot}. This parameter is required.
         */
        public Builder installUpdatesOnBoot(final com.hashicorp.cdktf.IResolvable installUpdatesOnBoot) {
            this.config.installUpdatesOnBoot(installUpdatesOnBoot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#instance_shutdown_timeout OpsworksCustomLayer#instance_shutdown_timeout}.
         * <p>
         * @return {@code this}
         * @param instanceShutdownTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#instance_shutdown_timeout OpsworksCustomLayer#instance_shutdown_timeout}. This parameter is required.
         */
        public Builder instanceShutdownTimeout(final java.lang.Number instanceShutdownTimeout) {
            this.config.instanceShutdownTimeout(instanceShutdownTimeout);
            return this;
        }

        /**
         * load_based_auto_scaling block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#load_based_auto_scaling OpsworksCustomLayer#load_based_auto_scaling}
         * <p>
         * @return {@code this}
         * @param loadBasedAutoScaling load_based_auto_scaling block. This parameter is required.
         */
        public Builder loadBasedAutoScaling(final imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling loadBasedAutoScaling) {
            this.config.loadBasedAutoScaling(loadBasedAutoScaling);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#system_packages OpsworksCustomLayer#system_packages}.
         * <p>
         * @return {@code this}
         * @param systemPackages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#system_packages OpsworksCustomLayer#system_packages}. This parameter is required.
         */
        public Builder systemPackages(final java.util.List<java.lang.String> systemPackages) {
            this.config.systemPackages(systemPackages);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#tags OpsworksCustomLayer#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#tags OpsworksCustomLayer#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#tags_all OpsworksCustomLayer#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#tags_all OpsworksCustomLayer#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#use_ebs_optimized_instances OpsworksCustomLayer#use_ebs_optimized_instances}.
         * <p>
         * @return {@code this}
         * @param useEbsOptimizedInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#use_ebs_optimized_instances OpsworksCustomLayer#use_ebs_optimized_instances}. This parameter is required.
         */
        public Builder useEbsOptimizedInstances(final java.lang.Boolean useEbsOptimizedInstances) {
            this.config.useEbsOptimizedInstances(useEbsOptimizedInstances);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#use_ebs_optimized_instances OpsworksCustomLayer#use_ebs_optimized_instances}.
         * <p>
         * @return {@code this}
         * @param useEbsOptimizedInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_custom_layer#use_ebs_optimized_instances OpsworksCustomLayer#use_ebs_optimized_instances}. This parameter is required.
         */
        public Builder useEbsOptimizedInstances(final com.hashicorp.cdktf.IResolvable useEbsOptimizedInstances) {
            this.config.useEbsOptimizedInstances(useEbsOptimizedInstances);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.opsworks_custom_layer.OpsworksCustomLayer}.
         */
        @Override
        public imports.aws.opsworks_custom_layer.OpsworksCustomLayer build() {
            return new imports.aws.opsworks_custom_layer.OpsworksCustomLayer(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
