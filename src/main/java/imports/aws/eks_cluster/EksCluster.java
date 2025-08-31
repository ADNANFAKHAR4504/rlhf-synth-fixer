package imports.aws.eks_cluster;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster aws_eks_cluster}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.152Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksCluster")
public class EksCluster extends com.hashicorp.cdktf.TerraformResource {

    protected EksCluster(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksCluster(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.eks_cluster.EksCluster.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster aws_eks_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EksCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EksCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EksCluster to import. This parameter is required.
     * @param importFromId The id of the existing EksCluster that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EksCluster to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.eks_cluster.EksCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EksCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EksCluster to import. This parameter is required.
     * @param importFromId The id of the existing EksCluster that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.eks_cluster.EksCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAccessConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterAccessConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAccessConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putComputeConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterComputeConfig value) {
        software.amazon.jsii.Kernel.call(this, "putComputeConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEncryptionConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterEncryptionConfig value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKubernetesNetworkConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig value) {
        software.amazon.jsii.Kernel.call(this, "putKubernetesNetworkConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutpostConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterOutpostConfig value) {
        software.amazon.jsii.Kernel.call(this, "putOutpostConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRemoteNetworkConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfig value) {
        software.amazon.jsii.Kernel.call(this, "putRemoteNetworkConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStorageConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterStorageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putStorageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpgradePolicy(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterUpgradePolicy value) {
        software.amazon.jsii.Kernel.call(this, "putUpgradePolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putZonalShiftConfig(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterZonalShiftConfig value) {
        software.amazon.jsii.Kernel.call(this, "putZonalShiftConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAccessConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBootstrapSelfManagedAddons() {
        software.amazon.jsii.Kernel.call(this, "resetBootstrapSelfManagedAddons", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComputeConfig() {
        software.amazon.jsii.Kernel.call(this, "resetComputeConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabledClusterLogTypes() {
        software.amazon.jsii.Kernel.call(this, "resetEnabledClusterLogTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionConfig() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceUpdateVersion() {
        software.amazon.jsii.Kernel.call(this, "resetForceUpdateVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKubernetesNetworkConfig() {
        software.amazon.jsii.Kernel.call(this, "resetKubernetesNetworkConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutpostConfig() {
        software.amazon.jsii.Kernel.call(this, "resetOutpostConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRemoteNetworkConfig() {
        software.amazon.jsii.Kernel.call(this, "resetRemoteNetworkConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageConfig() {
        software.amazon.jsii.Kernel.call(this, "resetStorageConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpgradePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetUpgradePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetZonalShiftConfig() {
        software.amazon.jsii.Kernel.call(this, "resetZonalShiftConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterAccessConfigOutputReference getAccessConfig() {
        return software.amazon.jsii.Kernel.get(this, "accessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterAccessConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterCertificateAuthorityList getCertificateAuthority() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthority", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterCertificateAuthorityList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterId() {
        return software.amazon.jsii.Kernel.get(this, "clusterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterComputeConfigOutputReference getComputeConfig() {
        return software.amazon.jsii.Kernel.get(this, "computeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterComputeConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterEncryptionConfigOutputReference getEncryptionConfig() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterIdentityList getIdentity() {
        return software.amazon.jsii.Kernel.get(this, "identity", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterIdentityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigOutputReference getKubernetesNetworkConfig() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesNetworkConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterOutpostConfigOutputReference getOutpostConfig() {
        return software.amazon.jsii.Kernel.get(this, "outpostConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformVersion() {
        return software.amazon.jsii.Kernel.get(this, "platformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfigOutputReference getRemoteNetworkConfig() {
        return software.amazon.jsii.Kernel.get(this, "remoteNetworkConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterStorageConfigOutputReference getStorageConfig() {
        return software.amazon.jsii.Kernel.get(this, "storageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterUpgradePolicyOutputReference getUpgradePolicy() {
        return software.amazon.jsii.Kernel.get(this, "upgradePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterUpgradePolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterZonalShiftConfigOutputReference getZonalShiftConfig() {
        return software.amazon.jsii.Kernel.get(this, "zonalShiftConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterZonalShiftConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterAccessConfig getAccessConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "accessConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterAccessConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBootstrapSelfManagedAddonsInput() {
        return software.amazon.jsii.Kernel.get(this, "bootstrapSelfManagedAddonsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterComputeConfig getComputeConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "computeConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterComputeConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledClusterLogTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enabledClusterLogTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfig getEncryptionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceUpdateVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "forceUpdateVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig getKubernetesNetworkConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesNetworkConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterOutpostConfig getOutpostConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "outpostConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfig getRemoteNetworkConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteNetworkConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterStorageConfig getStorageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "storageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterUpgradePolicy getUpgradePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "upgradePolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterUpgradePolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterVpcConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterZonalShiftConfig getZonalShiftConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "zonalShiftConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterZonalShiftConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBootstrapSelfManagedAddons() {
        return software.amazon.jsii.Kernel.get(this, "bootstrapSelfManagedAddons", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBootstrapSelfManagedAddons(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bootstrapSelfManagedAddons", java.util.Objects.requireNonNull(value, "bootstrapSelfManagedAddons is required"));
    }

    public void setBootstrapSelfManagedAddons(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bootstrapSelfManagedAddons", java.util.Objects.requireNonNull(value, "bootstrapSelfManagedAddons is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledClusterLogTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enabledClusterLogTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnabledClusterLogTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enabledClusterLogTypes", java.util.Objects.requireNonNull(value, "enabledClusterLogTypes is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
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
     * A fluent builder for {@link imports.aws.eks_cluster.EksCluster}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.eks_cluster.EksCluster> {
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
        private final imports.aws.eks_cluster.EksClusterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.eks_cluster.EksClusterConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#vpc_config EksCluster#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final imports.aws.eks_cluster.EksClusterVpcConfig vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * access_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#access_config EksCluster#access_config}
         * <p>
         * @return {@code this}
         * @param accessConfig access_config block. This parameter is required.
         */
        public Builder accessConfig(final imports.aws.eks_cluster.EksClusterAccessConfig accessConfig) {
            this.config.accessConfig(accessConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
         * <p>
         * @return {@code this}
         * @param bootstrapSelfManagedAddons Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}. This parameter is required.
         */
        public Builder bootstrapSelfManagedAddons(final java.lang.Boolean bootstrapSelfManagedAddons) {
            this.config.bootstrapSelfManagedAddons(bootstrapSelfManagedAddons);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
         * <p>
         * @return {@code this}
         * @param bootstrapSelfManagedAddons Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}. This parameter is required.
         */
        public Builder bootstrapSelfManagedAddons(final com.hashicorp.cdktf.IResolvable bootstrapSelfManagedAddons) {
            this.config.bootstrapSelfManagedAddons(bootstrapSelfManagedAddons);
            return this;
        }

        /**
         * compute_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#compute_config EksCluster#compute_config}
         * <p>
         * @return {@code this}
         * @param computeConfig compute_config block. This parameter is required.
         */
        public Builder computeConfig(final imports.aws.eks_cluster.EksClusterComputeConfig computeConfig) {
            this.config.computeConfig(computeConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}.
         * <p>
         * @return {@code this}
         * @param enabledClusterLogTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}. This parameter is required.
         */
        public Builder enabledClusterLogTypes(final java.util.List<java.lang.String> enabledClusterLogTypes) {
            this.config.enabledClusterLogTypes(enabledClusterLogTypes);
            return this;
        }

        /**
         * encryption_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#encryption_config EksCluster#encryption_config}
         * <p>
         * @return {@code this}
         * @param encryptionConfig encryption_config block. This parameter is required.
         */
        public Builder encryptionConfig(final imports.aws.eks_cluster.EksClusterEncryptionConfig encryptionConfig) {
            this.config.encryptionConfig(encryptionConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
         * <p>
         * @return {@code this}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}. This parameter is required.
         */
        public Builder forceUpdateVersion(final java.lang.Boolean forceUpdateVersion) {
            this.config.forceUpdateVersion(forceUpdateVersion);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
         * <p>
         * @return {@code this}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}. This parameter is required.
         */
        public Builder forceUpdateVersion(final com.hashicorp.cdktf.IResolvable forceUpdateVersion) {
            this.config.forceUpdateVersion(forceUpdateVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * kubernetes_network_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#kubernetes_network_config EksCluster#kubernetes_network_config}
         * <p>
         * @return {@code this}
         * @param kubernetesNetworkConfig kubernetes_network_config block. This parameter is required.
         */
        public Builder kubernetesNetworkConfig(final imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig kubernetesNetworkConfig) {
            this.config.kubernetesNetworkConfig(kubernetesNetworkConfig);
            return this;
        }

        /**
         * outpost_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_config EksCluster#outpost_config}
         * <p>
         * @return {@code this}
         * @param outpostConfig outpost_config block. This parameter is required.
         */
        public Builder outpostConfig(final imports.aws.eks_cluster.EksClusterOutpostConfig outpostConfig) {
            this.config.outpostConfig(outpostConfig);
            return this;
        }

        /**
         * remote_network_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_network_config EksCluster#remote_network_config}
         * <p>
         * @return {@code this}
         * @param remoteNetworkConfig remote_network_config block. This parameter is required.
         */
        public Builder remoteNetworkConfig(final imports.aws.eks_cluster.EksClusterRemoteNetworkConfig remoteNetworkConfig) {
            this.config.remoteNetworkConfig(remoteNetworkConfig);
            return this;
        }

        /**
         * storage_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#storage_config EksCluster#storage_config}
         * <p>
         * @return {@code this}
         * @param storageConfig storage_config block. This parameter is required.
         */
        public Builder storageConfig(final imports.aws.eks_cluster.EksClusterStorageConfig storageConfig) {
            this.config.storageConfig(storageConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#timeouts EksCluster#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.eks_cluster.EksClusterTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * upgrade_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#upgrade_policy EksCluster#upgrade_policy}
         * <p>
         * @return {@code this}
         * @param upgradePolicy upgrade_policy block. This parameter is required.
         */
        public Builder upgradePolicy(final imports.aws.eks_cluster.EksClusterUpgradePolicy upgradePolicy) {
            this.config.upgradePolicy(upgradePolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config.version(version);
            return this;
        }

        /**
         * zonal_shift_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#zonal_shift_config EksCluster#zonal_shift_config}
         * <p>
         * @return {@code this}
         * @param zonalShiftConfig zonal_shift_config block. This parameter is required.
         */
        public Builder zonalShiftConfig(final imports.aws.eks_cluster.EksClusterZonalShiftConfig zonalShiftConfig) {
            this.config.zonalShiftConfig(zonalShiftConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.eks_cluster.EksCluster}.
         */
        @Override
        public imports.aws.eks_cluster.EksCluster build() {
            return new imports.aws.eks_cluster.EksCluster(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
