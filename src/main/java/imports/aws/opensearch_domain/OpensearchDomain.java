package imports.aws.opensearch_domain;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain aws_opensearch_domain}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.982Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomain")
public class OpensearchDomain extends com.hashicorp.cdktf.TerraformResource {

    protected OpensearchDomain(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchDomain(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.opensearch_domain.OpensearchDomain.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain aws_opensearch_domain} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OpensearchDomain(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OpensearchDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpensearchDomain to import. This parameter is required.
     * @param importFromId The id of the existing OpensearchDomain that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OpensearchDomain to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opensearch_domain.OpensearchDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OpensearchDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpensearchDomain to import. This parameter is required.
     * @param importFromId The id of the existing OpensearchDomain that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opensearch_domain.OpensearchDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAdvancedSecurityOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptions value) {
        software.amazon.jsii.Kernel.call(this, "putAdvancedSecurityOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAutoTuneOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainAutoTuneOptions value) {
        software.amazon.jsii.Kernel.call(this, "putAutoTuneOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putClusterConfig(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfig value) {
        software.amazon.jsii.Kernel.call(this, "putClusterConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCognitoOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainCognitoOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCognitoOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDomainEndpointOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainDomainEndpointOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDomainEndpointOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEbsOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainEbsOptions value) {
        software.amazon.jsii.Kernel.call(this, "putEbsOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEncryptAtRest(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainEncryptAtRest value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptAtRest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogPublishingOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptions> __cast_cd4240 = (java.util.List<imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogPublishingOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNodeToNodeEncryption(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainNodeToNodeEncryption value) {
        software.amazon.jsii.Kernel.call(this, "putNodeToNodeEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOffPeakWindowOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptions value) {
        software.amazon.jsii.Kernel.call(this, "putOffPeakWindowOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnapshotOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainSnapshotOptions value) {
        software.amazon.jsii.Kernel.call(this, "putSnapshotOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSoftwareUpdateOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions value) {
        software.amazon.jsii.Kernel.call(this, "putSoftwareUpdateOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcOptions(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainVpcOptions value) {
        software.amazon.jsii.Kernel.call(this, "putVpcOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessPolicies() {
        software.amazon.jsii.Kernel.call(this, "resetAccessPolicies", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdvancedOptions() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdvancedSecurityOptions() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedSecurityOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoTuneOptions() {
        software.amazon.jsii.Kernel.call(this, "resetAutoTuneOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterConfig() {
        software.amazon.jsii.Kernel.call(this, "resetClusterConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCognitoOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCognitoOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomainEndpointOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDomainEndpointOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsOptions() {
        software.amazon.jsii.Kernel.call(this, "resetEbsOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptAtRest() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptAtRest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogPublishingOptions() {
        software.amazon.jsii.Kernel.call(this, "resetLogPublishingOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeToNodeEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetNodeToNodeEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOffPeakWindowOptions() {
        software.amazon.jsii.Kernel.call(this, "resetOffPeakWindowOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotOptions() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSoftwareUpdateOptions() {
        software.amazon.jsii.Kernel.call(this, "resetSoftwareUpdateOptions", software.amazon.jsii.NativeType.VOID);
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

    public void resetVpcOptions() {
        software.amazon.jsii.Kernel.call(this, "resetVpcOptions", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsOutputReference getAdvancedSecurityOptions() {
        return software.amazon.jsii.Kernel.get(this, "advancedSecurityOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainAutoTuneOptionsOutputReference getAutoTuneOptions() {
        return software.amazon.jsii.Kernel.get(this, "autoTuneOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainAutoTuneOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainClusterConfigOutputReference getClusterConfig() {
        return software.amazon.jsii.Kernel.get(this, "clusterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainCognitoOptionsOutputReference getCognitoOptions() {
        return software.amazon.jsii.Kernel.get(this, "cognitoOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainCognitoOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDashboardEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "dashboardEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDashboardEndpointV2() {
        return software.amazon.jsii.Kernel.get(this, "dashboardEndpointV2", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainDomainEndpointOptionsOutputReference getDomainEndpointOptions() {
        return software.amazon.jsii.Kernel.get(this, "domainEndpointOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainDomainEndpointOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainEndpointV2HostedZoneId() {
        return software.amazon.jsii.Kernel.get(this, "domainEndpointV2HostedZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainId() {
        return software.amazon.jsii.Kernel.get(this, "domainId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainEbsOptionsOutputReference getEbsOptions() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainEbsOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainEncryptAtRestOutputReference getEncryptAtRest() {
        return software.amazon.jsii.Kernel.get(this, "encryptAtRest", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainEncryptAtRestOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointV2() {
        return software.amazon.jsii.Kernel.get(this, "endpointV2", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKibanaEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "kibanaEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptionsList getLogPublishingOptions() {
        return software.amazon.jsii.Kernel.get(this, "logPublishingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainNodeToNodeEncryptionOutputReference getNodeToNodeEncryption() {
        return software.amazon.jsii.Kernel.get(this, "nodeToNodeEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainNodeToNodeEncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOutputReference getOffPeakWindowOptions() {
        return software.amazon.jsii.Kernel.get(this, "offPeakWindowOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainSnapshotOptionsOutputReference getSnapshotOptions() {
        return software.amazon.jsii.Kernel.get(this, "snapshotOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainSnapshotOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptionsOutputReference getSoftwareUpdateOptions() {
        return software.amazon.jsii.Kernel.get(this, "softwareUpdateOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_domain.OpensearchDomainVpcOptionsOutputReference getVpcOptions() {
        return software.amazon.jsii.Kernel.get(this, "vpcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainVpcOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessPoliciesInput() {
        return software.amazon.jsii.Kernel.get(this, "accessPoliciesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAdvancedOptionsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "advancedOptionsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptions getAdvancedSecurityOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedSecurityOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainAutoTuneOptions getAutoTuneOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "autoTuneOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainAutoTuneOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainClusterConfig getClusterConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainCognitoOptions getCognitoOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cognitoOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainCognitoOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainDomainEndpointOptions getDomainEndpointOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "domainEndpointOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainDomainEndpointOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainEbsOptions getEbsOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainEbsOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainEncryptAtRest getEncryptAtRestInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptAtRestInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainEncryptAtRest.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogPublishingOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "logPublishingOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainNodeToNodeEncryption getNodeToNodeEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeToNodeEncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainNodeToNodeEncryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptions getOffPeakWindowOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "offPeakWindowOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainSnapshotOptions getSnapshotOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainSnapshotOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions getSoftwareUpdateOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "softwareUpdateOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainVpcOptions getVpcOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainVpcOptions.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessPolicies() {
        return software.amazon.jsii.Kernel.get(this, "accessPolicies", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessPolicies(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessPolicies", java.util.Objects.requireNonNull(value, "accessPolicies is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAdvancedOptions() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "advancedOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdvancedOptions(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "advancedOptions", java.util.Objects.requireNonNull(value, "advancedOptions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddressType", java.util.Objects.requireNonNull(value, "ipAddressType is required"));
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

    /**
     * A fluent builder for {@link imports.aws.opensearch_domain.OpensearchDomain}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.opensearch_domain.OpensearchDomain> {
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
        private final imports.aws.opensearch_domain.OpensearchDomainConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.opensearch_domain.OpensearchDomainConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#domain_name OpensearchDomain#domain_name}.
         * <p>
         * @return {@code this}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#domain_name OpensearchDomain#domain_name}. This parameter is required.
         */
        public Builder domainName(final java.lang.String domainName) {
            this.config.domainName(domainName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#access_policies OpensearchDomain#access_policies}.
         * <p>
         * @return {@code this}
         * @param accessPolicies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#access_policies OpensearchDomain#access_policies}. This parameter is required.
         */
        public Builder accessPolicies(final java.lang.String accessPolicies) {
            this.config.accessPolicies(accessPolicies);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#advanced_options OpensearchDomain#advanced_options}.
         * <p>
         * @return {@code this}
         * @param advancedOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#advanced_options OpensearchDomain#advanced_options}. This parameter is required.
         */
        public Builder advancedOptions(final java.util.Map<java.lang.String, java.lang.String> advancedOptions) {
            this.config.advancedOptions(advancedOptions);
            return this;
        }

        /**
         * advanced_security_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#advanced_security_options OpensearchDomain#advanced_security_options}
         * <p>
         * @return {@code this}
         * @param advancedSecurityOptions advanced_security_options block. This parameter is required.
         */
        public Builder advancedSecurityOptions(final imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptions advancedSecurityOptions) {
            this.config.advancedSecurityOptions(advancedSecurityOptions);
            return this;
        }

        /**
         * auto_tune_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#auto_tune_options OpensearchDomain#auto_tune_options}
         * <p>
         * @return {@code this}
         * @param autoTuneOptions auto_tune_options block. This parameter is required.
         */
        public Builder autoTuneOptions(final imports.aws.opensearch_domain.OpensearchDomainAutoTuneOptions autoTuneOptions) {
            this.config.autoTuneOptions(autoTuneOptions);
            return this;
        }

        /**
         * cluster_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#cluster_config OpensearchDomain#cluster_config}
         * <p>
         * @return {@code this}
         * @param clusterConfig cluster_config block. This parameter is required.
         */
        public Builder clusterConfig(final imports.aws.opensearch_domain.OpensearchDomainClusterConfig clusterConfig) {
            this.config.clusterConfig(clusterConfig);
            return this;
        }

        /**
         * cognito_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#cognito_options OpensearchDomain#cognito_options}
         * <p>
         * @return {@code this}
         * @param cognitoOptions cognito_options block. This parameter is required.
         */
        public Builder cognitoOptions(final imports.aws.opensearch_domain.OpensearchDomainCognitoOptions cognitoOptions) {
            this.config.cognitoOptions(cognitoOptions);
            return this;
        }

        /**
         * domain_endpoint_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#domain_endpoint_options OpensearchDomain#domain_endpoint_options}
         * <p>
         * @return {@code this}
         * @param domainEndpointOptions domain_endpoint_options block. This parameter is required.
         */
        public Builder domainEndpointOptions(final imports.aws.opensearch_domain.OpensearchDomainDomainEndpointOptions domainEndpointOptions) {
            this.config.domainEndpointOptions(domainEndpointOptions);
            return this;
        }

        /**
         * ebs_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#ebs_options OpensearchDomain#ebs_options}
         * <p>
         * @return {@code this}
         * @param ebsOptions ebs_options block. This parameter is required.
         */
        public Builder ebsOptions(final imports.aws.opensearch_domain.OpensearchDomainEbsOptions ebsOptions) {
            this.config.ebsOptions(ebsOptions);
            return this;
        }

        /**
         * encrypt_at_rest block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#encrypt_at_rest OpensearchDomain#encrypt_at_rest}
         * <p>
         * @return {@code this}
         * @param encryptAtRest encrypt_at_rest block. This parameter is required.
         */
        public Builder encryptAtRest(final imports.aws.opensearch_domain.OpensearchDomainEncryptAtRest encryptAtRest) {
            this.config.encryptAtRest(encryptAtRest);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#engine_version OpensearchDomain#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#engine_version OpensearchDomain#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#id OpensearchDomain#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#id OpensearchDomain#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#ip_address_type OpensearchDomain#ip_address_type}.
         * <p>
         * @return {@code this}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#ip_address_type OpensearchDomain#ip_address_type}. This parameter is required.
         */
        public Builder ipAddressType(final java.lang.String ipAddressType) {
            this.config.ipAddressType(ipAddressType);
            return this;
        }

        /**
         * log_publishing_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#log_publishing_options OpensearchDomain#log_publishing_options}
         * <p>
         * @return {@code this}
         * @param logPublishingOptions log_publishing_options block. This parameter is required.
         */
        public Builder logPublishingOptions(final com.hashicorp.cdktf.IResolvable logPublishingOptions) {
            this.config.logPublishingOptions(logPublishingOptions);
            return this;
        }
        /**
         * log_publishing_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#log_publishing_options OpensearchDomain#log_publishing_options}
         * <p>
         * @return {@code this}
         * @param logPublishingOptions log_publishing_options block. This parameter is required.
         */
        public Builder logPublishingOptions(final java.util.List<? extends imports.aws.opensearch_domain.OpensearchDomainLogPublishingOptions> logPublishingOptions) {
            this.config.logPublishingOptions(logPublishingOptions);
            return this;
        }

        /**
         * node_to_node_encryption block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#node_to_node_encryption OpensearchDomain#node_to_node_encryption}
         * <p>
         * @return {@code this}
         * @param nodeToNodeEncryption node_to_node_encryption block. This parameter is required.
         */
        public Builder nodeToNodeEncryption(final imports.aws.opensearch_domain.OpensearchDomainNodeToNodeEncryption nodeToNodeEncryption) {
            this.config.nodeToNodeEncryption(nodeToNodeEncryption);
            return this;
        }

        /**
         * off_peak_window_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#off_peak_window_options OpensearchDomain#off_peak_window_options}
         * <p>
         * @return {@code this}
         * @param offPeakWindowOptions off_peak_window_options block. This parameter is required.
         */
        public Builder offPeakWindowOptions(final imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptions offPeakWindowOptions) {
            this.config.offPeakWindowOptions(offPeakWindowOptions);
            return this;
        }

        /**
         * snapshot_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#snapshot_options OpensearchDomain#snapshot_options}
         * <p>
         * @return {@code this}
         * @param snapshotOptions snapshot_options block. This parameter is required.
         */
        public Builder snapshotOptions(final imports.aws.opensearch_domain.OpensearchDomainSnapshotOptions snapshotOptions) {
            this.config.snapshotOptions(snapshotOptions);
            return this;
        }

        /**
         * software_update_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#software_update_options OpensearchDomain#software_update_options}
         * <p>
         * @return {@code this}
         * @param softwareUpdateOptions software_update_options block. This parameter is required.
         */
        public Builder softwareUpdateOptions(final imports.aws.opensearch_domain.OpensearchDomainSoftwareUpdateOptions softwareUpdateOptions) {
            this.config.softwareUpdateOptions(softwareUpdateOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#tags OpensearchDomain#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#tags OpensearchDomain#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#tags_all OpensearchDomain#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#tags_all OpensearchDomain#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#timeouts OpensearchDomain#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.opensearch_domain.OpensearchDomainTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * vpc_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#vpc_options OpensearchDomain#vpc_options}
         * <p>
         * @return {@code this}
         * @param vpcOptions vpc_options block. This parameter is required.
         */
        public Builder vpcOptions(final imports.aws.opensearch_domain.OpensearchDomainVpcOptions vpcOptions) {
            this.config.vpcOptions(vpcOptions);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.opensearch_domain.OpensearchDomain}.
         */
        @Override
        public imports.aws.opensearch_domain.OpensearchDomain build() {
            return new imports.aws.opensearch_domain.OpensearchDomain(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
