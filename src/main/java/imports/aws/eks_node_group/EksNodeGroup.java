package imports.aws.eks_node_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group aws_eks_node_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksNodeGroup.EksNodeGroup")
public class EksNodeGroup extends com.hashicorp.cdktf.TerraformResource {

    protected EksNodeGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksNodeGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.eks_node_group.EksNodeGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group aws_eks_node_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EksNodeGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EksNodeGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EksNodeGroup to import. This parameter is required.
     * @param importFromId The id of the existing EksNodeGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EksNodeGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.eks_node_group.EksNodeGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EksNodeGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EksNodeGroup to import. This parameter is required.
     * @param importFromId The id of the existing EksNodeGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.eks_node_group.EksNodeGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNodeRepairConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig value) {
        software.amazon.jsii.Kernel.call(this, "putNodeRepairConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRemoteAccess(final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupRemoteAccess value) {
        software.amazon.jsii.Kernel.call(this, "putRemoteAccess", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScalingConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupScalingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putScalingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTaint(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.eks_node_group.EksNodeGroupTaint>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.eks_node_group.EksNodeGroupTaint> __cast_cd4240 = (java.util.List<imports.aws.eks_node_group.EksNodeGroupTaint>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.eks_node_group.EksNodeGroupTaint __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTaint", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpdateConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupUpdateConfig value) {
        software.amazon.jsii.Kernel.call(this, "putUpdateConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmiType() {
        software.amazon.jsii.Kernel.call(this, "resetAmiType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityType() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDiskSize() {
        software.amazon.jsii.Kernel.call(this, "resetDiskSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceUpdateVersion() {
        software.amazon.jsii.Kernel.call(this, "resetForceUpdateVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLabels() {
        software.amazon.jsii.Kernel.call(this, "resetLabels", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetNodeGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeGroupNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNodeGroupNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeRepairConfig() {
        software.amazon.jsii.Kernel.call(this, "resetNodeRepairConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReleaseVersion() {
        software.amazon.jsii.Kernel.call(this, "resetReleaseVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRemoteAccess() {
        software.amazon.jsii.Kernel.call(this, "resetRemoteAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaint() {
        software.amazon.jsii.Kernel.call(this, "resetTaint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdateConfig() {
        software.amazon.jsii.Kernel.call(this, "resetUpdateConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupNodeRepairConfigOutputReference getNodeRepairConfig() {
        return software.amazon.jsii.Kernel.get(this, "nodeRepairConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupNodeRepairConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupRemoteAccessOutputReference getRemoteAccess() {
        return software.amazon.jsii.Kernel.get(this, "remoteAccess", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupRemoteAccessOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupResourcesList getResources() {
        return software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupResourcesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupScalingConfigOutputReference getScalingConfig() {
        return software.amazon.jsii.Kernel.get(this, "scalingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupScalingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupTaintList getTaint() {
        return software.amazon.jsii.Kernel.get(this, "taint", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupTaintList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupUpdateConfigOutputReference getUpdateConfig() {
        return software.amazon.jsii.Kernel.get(this, "updateConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupUpdateConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmiTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "amiTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCapacityTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterNameInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDiskSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "diskSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceUpdateVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "forceUpdateVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "instanceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getLabelsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "labelsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNodeGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNodeGroupNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeGroupNamePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig getNodeRepairConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeRepairConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNodeRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupRemoteAccess getRemoteAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteAccessInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupRemoteAccess.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupScalingConfig getScalingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupScalingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTaintInput() {
        return software.amazon.jsii.Kernel.get(this, "taintInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupUpdateConfig getUpdateConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "updateConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupUpdateConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmiType() {
        return software.amazon.jsii.Kernel.get(this, "amiType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmiType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amiType", java.util.Objects.requireNonNull(value, "amiType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCapacityType() {
        return software.amazon.jsii.Kernel.get(this, "capacityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCapacityType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "capacityType", java.util.Objects.requireNonNull(value, "capacityType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterName() {
        return software.amazon.jsii.Kernel.get(this, "clusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterName", java.util.Objects.requireNonNull(value, "clusterName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDiskSize() {
        return software.amazon.jsii.Kernel.get(this, "diskSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDiskSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "diskSize", java.util.Objects.requireNonNull(value, "diskSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceUpdateVersion() {
        return software.amazon.jsii.Kernel.get(this, "forceUpdateVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceUpdateVersion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceUpdateVersion", java.util.Objects.requireNonNull(value, "forceUpdateVersion is required"));
    }

    public void setForceUpdateVersion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceUpdateVersion", java.util.Objects.requireNonNull(value, "forceUpdateVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstanceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "instanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInstanceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "instanceTypes", java.util.Objects.requireNonNull(value, "instanceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getLabels() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "labels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLabels(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "labels", java.util.Objects.requireNonNull(value, "labels is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNodeGroupName() {
        return software.amazon.jsii.Kernel.get(this, "nodeGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNodeGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nodeGroupName", java.util.Objects.requireNonNull(value, "nodeGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNodeGroupNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "nodeGroupNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNodeGroupNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nodeGroupNamePrefix", java.util.Objects.requireNonNull(value, "nodeGroupNamePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNodeRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "nodeRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNodeRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nodeRoleArn", java.util.Objects.requireNonNull(value, "nodeRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseVersion() {
        return software.amazon.jsii.Kernel.get(this, "releaseVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseVersion", java.util.Objects.requireNonNull(value, "releaseVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.eks_node_group.EksNodeGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.eks_node_group.EksNodeGroup> {
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
        private final imports.aws.eks_node_group.EksNodeGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.eks_node_group.EksNodeGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#cluster_name EksNodeGroup#cluster_name}.
         * <p>
         * @return {@code this}
         * @param clusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#cluster_name EksNodeGroup#cluster_name}. This parameter is required.
         */
        public Builder clusterName(final java.lang.String clusterName) {
            this.config.clusterName(clusterName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_role_arn EksNodeGroup#node_role_arn}.
         * <p>
         * @return {@code this}
         * @param nodeRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_role_arn EksNodeGroup#node_role_arn}. This parameter is required.
         */
        public Builder nodeRoleArn(final java.lang.String nodeRoleArn) {
            this.config.nodeRoleArn(nodeRoleArn);
            return this;
        }

        /**
         * scaling_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#scaling_config EksNodeGroup#scaling_config}
         * <p>
         * @return {@code this}
         * @param scalingConfig scaling_config block. This parameter is required.
         */
        public Builder scalingConfig(final imports.aws.eks_node_group.EksNodeGroupScalingConfig scalingConfig) {
            this.config.scalingConfig(scalingConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#subnet_ids EksNodeGroup#subnet_ids}.
         * <p>
         * @return {@code this}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#subnet_ids EksNodeGroup#subnet_ids}. This parameter is required.
         */
        public Builder subnetIds(final java.util.List<java.lang.String> subnetIds) {
            this.config.subnetIds(subnetIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#ami_type EksNodeGroup#ami_type}.
         * <p>
         * @return {@code this}
         * @param amiType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#ami_type EksNodeGroup#ami_type}. This parameter is required.
         */
        public Builder amiType(final java.lang.String amiType) {
            this.config.amiType(amiType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#capacity_type EksNodeGroup#capacity_type}.
         * <p>
         * @return {@code this}
         * @param capacityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#capacity_type EksNodeGroup#capacity_type}. This parameter is required.
         */
        public Builder capacityType(final java.lang.String capacityType) {
            this.config.capacityType(capacityType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#disk_size EksNodeGroup#disk_size}.
         * <p>
         * @return {@code this}
         * @param diskSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#disk_size EksNodeGroup#disk_size}. This parameter is required.
         */
        public Builder diskSize(final java.lang.Number diskSize) {
            this.config.diskSize(diskSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}.
         * <p>
         * @return {@code this}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}. This parameter is required.
         */
        public Builder forceUpdateVersion(final java.lang.Boolean forceUpdateVersion) {
            this.config.forceUpdateVersion(forceUpdateVersion);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}.
         * <p>
         * @return {@code this}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}. This parameter is required.
         */
        public Builder forceUpdateVersion(final com.hashicorp.cdktf.IResolvable forceUpdateVersion) {
            this.config.forceUpdateVersion(forceUpdateVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#id EksNodeGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#id EksNodeGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#instance_types EksNodeGroup#instance_types}.
         * <p>
         * @return {@code this}
         * @param instanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#instance_types EksNodeGroup#instance_types}. This parameter is required.
         */
        public Builder instanceTypes(final java.util.List<java.lang.String> instanceTypes) {
            this.config.instanceTypes(instanceTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#labels EksNodeGroup#labels}.
         * <p>
         * @return {@code this}
         * @param labels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#labels EksNodeGroup#labels}. This parameter is required.
         */
        public Builder labels(final java.util.Map<java.lang.String, java.lang.String> labels) {
            this.config.labels(labels);
            return this;
        }

        /**
         * launch_template block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#launch_template EksNodeGroup#launch_template}
         * <p>
         * @return {@code this}
         * @param launchTemplate launch_template block. This parameter is required.
         */
        public Builder launchTemplate(final imports.aws.eks_node_group.EksNodeGroupLaunchTemplate launchTemplate) {
            this.config.launchTemplate(launchTemplate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name EksNodeGroup#node_group_name}.
         * <p>
         * @return {@code this}
         * @param nodeGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name EksNodeGroup#node_group_name}. This parameter is required.
         */
        public Builder nodeGroupName(final java.lang.String nodeGroupName) {
            this.config.nodeGroupName(nodeGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name_prefix EksNodeGroup#node_group_name_prefix}.
         * <p>
         * @return {@code this}
         * @param nodeGroupNamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name_prefix EksNodeGroup#node_group_name_prefix}. This parameter is required.
         */
        public Builder nodeGroupNamePrefix(final java.lang.String nodeGroupNamePrefix) {
            this.config.nodeGroupNamePrefix(nodeGroupNamePrefix);
            return this;
        }

        /**
         * node_repair_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_repair_config EksNodeGroup#node_repair_config}
         * <p>
         * @return {@code this}
         * @param nodeRepairConfig node_repair_config block. This parameter is required.
         */
        public Builder nodeRepairConfig(final imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig nodeRepairConfig) {
            this.config.nodeRepairConfig(nodeRepairConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#release_version EksNodeGroup#release_version}.
         * <p>
         * @return {@code this}
         * @param releaseVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#release_version EksNodeGroup#release_version}. This parameter is required.
         */
        public Builder releaseVersion(final java.lang.String releaseVersion) {
            this.config.releaseVersion(releaseVersion);
            return this;
        }

        /**
         * remote_access block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#remote_access EksNodeGroup#remote_access}
         * <p>
         * @return {@code this}
         * @param remoteAccess remote_access block. This parameter is required.
         */
        public Builder remoteAccess(final imports.aws.eks_node_group.EksNodeGroupRemoteAccess remoteAccess) {
            this.config.remoteAccess(remoteAccess);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags EksNodeGroup#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags EksNodeGroup#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags_all EksNodeGroup#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags_all EksNodeGroup#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * taint block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#taint EksNodeGroup#taint}
         * <p>
         * @return {@code this}
         * @param taint taint block. This parameter is required.
         */
        public Builder taint(final com.hashicorp.cdktf.IResolvable taint) {
            this.config.taint(taint);
            return this;
        }
        /**
         * taint block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#taint EksNodeGroup#taint}
         * <p>
         * @return {@code this}
         * @param taint taint block. This parameter is required.
         */
        public Builder taint(final java.util.List<? extends imports.aws.eks_node_group.EksNodeGroupTaint> taint) {
            this.config.taint(taint);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#timeouts EksNodeGroup#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.eks_node_group.EksNodeGroupTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * update_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#update_config EksNodeGroup#update_config}
         * <p>
         * @return {@code this}
         * @param updateConfig update_config block. This parameter is required.
         */
        public Builder updateConfig(final imports.aws.eks_node_group.EksNodeGroupUpdateConfig updateConfig) {
            this.config.updateConfig(updateConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#version EksNodeGroup#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#version EksNodeGroup#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config.version(version);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.eks_node_group.EksNodeGroup}.
         */
        @Override
        public imports.aws.eks_node_group.EksNodeGroup build() {
            return new imports.aws.eks_node_group.EksNodeGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
