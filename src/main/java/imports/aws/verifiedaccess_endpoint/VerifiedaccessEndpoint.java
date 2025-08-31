package imports.aws.verifiedaccess_endpoint;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint aws_verifiedaccess_endpoint}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.572Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessEndpoint.VerifiedaccessEndpoint")
public class VerifiedaccessEndpoint extends com.hashicorp.cdktf.TerraformResource {

    protected VerifiedaccessEndpoint(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessEndpoint(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint aws_verifiedaccess_endpoint} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VerifiedaccessEndpoint(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VerifiedaccessEndpoint resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VerifiedaccessEndpoint to import. This parameter is required.
     * @param importFromId The id of the existing VerifiedaccessEndpoint that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VerifiedaccessEndpoint to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VerifiedaccessEndpoint resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VerifiedaccessEndpoint to import. This parameter is required.
     * @param importFromId The id of the existing VerifiedaccessEndpoint that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCidrOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCidrOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLoadBalancerOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions value) {
        software.amazon.jsii.Kernel.call(this, "putLoadBalancerOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkInterfaceOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkInterfaceOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRdsOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions value) {
        software.amazon.jsii.Kernel.call(this, "putRdsOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSseSpecification(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putSseSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplicationDomain() {
        software.amazon.jsii.Kernel.call(this, "resetApplicationDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCidrOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCidrOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomainCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetDomainCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointDomainPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointDomainPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoadBalancerOptions() {
        software.amazon.jsii.Kernel.call(this, "resetLoadBalancerOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterfaceOptions() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterfaceOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicyDocument() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyDocument", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRdsOptions() {
        software.amazon.jsii.Kernel.call(this, "resetRdsOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSseSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetSseSpecification", software.amazon.jsii.NativeType.VOID);
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

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptionsOutputReference getCidrOptions() {
        return software.amazon.jsii.Kernel.get(this, "cidrOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceValidationDomain() {
        return software.amazon.jsii.Kernel.get(this, "deviceValidationDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointDomain() {
        return software.amazon.jsii.Kernel.get(this, "endpointDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptionsOutputReference getLoadBalancerOptions() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptionsOutputReference getNetworkInterfaceOptions() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptionsOutputReference getRdsOptions() {
        return software.amazon.jsii.Kernel.get(this, "rdsOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecificationOutputReference getSseSpecification() {
        return software.amazon.jsii.Kernel.get(this, "sseSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerifiedAccessInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "verifiedAccessInstanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttachmentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "attachmentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions getCidrOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cidrOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "domainCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointDomainPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointDomainPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions getLoadBalancerOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "loadBalancerOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions getNetworkInterfaceOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyDocumentInput() {
        return software.amazon.jsii.Kernel.get(this, "policyDocumentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions getRdsOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "rdsOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification getSseSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "sseSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getVerifiedAccessGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "verifiedAccessGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationDomain() {
        return software.amazon.jsii.Kernel.get(this, "applicationDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationDomain", java.util.Objects.requireNonNull(value, "applicationDomain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttachmentType() {
        return software.amazon.jsii.Kernel.get(this, "attachmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttachmentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attachmentType", java.util.Objects.requireNonNull(value, "attachmentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "domainCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainCertificateArn", java.util.Objects.requireNonNull(value, "domainCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointDomainPrefix() {
        return software.amazon.jsii.Kernel.get(this, "endpointDomainPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointDomainPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointDomainPrefix", java.util.Objects.requireNonNull(value, "endpointDomainPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointType() {
        return software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointType", java.util.Objects.requireNonNull(value, "endpointType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyDocument() {
        return software.amazon.jsii.Kernel.get(this, "policyDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyDocument(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyDocument", java.util.Objects.requireNonNull(value, "policyDocument is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVerifiedAccessGroupId() {
        return software.amazon.jsii.Kernel.get(this, "verifiedAccessGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerifiedAccessGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verifiedAccessGroupId", java.util.Objects.requireNonNull(value, "verifiedAccessGroupId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint> {
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
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#attachment_type VerifiedaccessEndpoint#attachment_type}.
         * <p>
         * @return {@code this}
         * @param attachmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#attachment_type VerifiedaccessEndpoint#attachment_type}. This parameter is required.
         */
        public Builder attachmentType(final java.lang.String attachmentType) {
            this.config.attachmentType(attachmentType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_type VerifiedaccessEndpoint#endpoint_type}.
         * <p>
         * @return {@code this}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_type VerifiedaccessEndpoint#endpoint_type}. This parameter is required.
         */
        public Builder endpointType(final java.lang.String endpointType) {
            this.config.endpointType(endpointType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#verified_access_group_id VerifiedaccessEndpoint#verified_access_group_id}.
         * <p>
         * @return {@code this}
         * @param verifiedAccessGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#verified_access_group_id VerifiedaccessEndpoint#verified_access_group_id}. This parameter is required.
         */
        public Builder verifiedAccessGroupId(final java.lang.String verifiedAccessGroupId) {
            this.config.verifiedAccessGroupId(verifiedAccessGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#application_domain VerifiedaccessEndpoint#application_domain}.
         * <p>
         * @return {@code this}
         * @param applicationDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#application_domain VerifiedaccessEndpoint#application_domain}. This parameter is required.
         */
        public Builder applicationDomain(final java.lang.String applicationDomain) {
            this.config.applicationDomain(applicationDomain);
            return this;
        }

        /**
         * cidr_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#cidr_options VerifiedaccessEndpoint#cidr_options}
         * <p>
         * @return {@code this}
         * @param cidrOptions cidr_options block. This parameter is required.
         */
        public Builder cidrOptions(final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions cidrOptions) {
            this.config.cidrOptions(cidrOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#description VerifiedaccessEndpoint#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#description VerifiedaccessEndpoint#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#domain_certificate_arn VerifiedaccessEndpoint#domain_certificate_arn}.
         * <p>
         * @return {@code this}
         * @param domainCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#domain_certificate_arn VerifiedaccessEndpoint#domain_certificate_arn}. This parameter is required.
         */
        public Builder domainCertificateArn(final java.lang.String domainCertificateArn) {
            this.config.domainCertificateArn(domainCertificateArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_domain_prefix VerifiedaccessEndpoint#endpoint_domain_prefix}.
         * <p>
         * @return {@code this}
         * @param endpointDomainPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_domain_prefix VerifiedaccessEndpoint#endpoint_domain_prefix}. This parameter is required.
         */
        public Builder endpointDomainPrefix(final java.lang.String endpointDomainPrefix) {
            this.config.endpointDomainPrefix(endpointDomainPrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#id VerifiedaccessEndpoint#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#id VerifiedaccessEndpoint#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * load_balancer_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#load_balancer_options VerifiedaccessEndpoint#load_balancer_options}
         * <p>
         * @return {@code this}
         * @param loadBalancerOptions load_balancer_options block. This parameter is required.
         */
        public Builder loadBalancerOptions(final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions loadBalancerOptions) {
            this.config.loadBalancerOptions(loadBalancerOptions);
            return this;
        }

        /**
         * network_interface_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#network_interface_options VerifiedaccessEndpoint#network_interface_options}
         * <p>
         * @return {@code this}
         * @param networkInterfaceOptions network_interface_options block. This parameter is required.
         */
        public Builder networkInterfaceOptions(final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions networkInterfaceOptions) {
            this.config.networkInterfaceOptions(networkInterfaceOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#policy_document VerifiedaccessEndpoint#policy_document}.
         * <p>
         * @return {@code this}
         * @param policyDocument Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#policy_document VerifiedaccessEndpoint#policy_document}. This parameter is required.
         */
        public Builder policyDocument(final java.lang.String policyDocument) {
            this.config.policyDocument(policyDocument);
            return this;
        }

        /**
         * rds_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_options VerifiedaccessEndpoint#rds_options}
         * <p>
         * @return {@code this}
         * @param rdsOptions rds_options block. This parameter is required.
         */
        public Builder rdsOptions(final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions rdsOptions) {
            this.config.rdsOptions(rdsOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#security_group_ids VerifiedaccessEndpoint#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#security_group_ids VerifiedaccessEndpoint#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * sse_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#sse_specification VerifiedaccessEndpoint#sse_specification}
         * <p>
         * @return {@code this}
         * @param sseSpecification sse_specification block. This parameter is required.
         */
        public Builder sseSpecification(final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification sseSpecification) {
            this.config.sseSpecification(sseSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags VerifiedaccessEndpoint#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags VerifiedaccessEndpoint#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags_all VerifiedaccessEndpoint#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags_all VerifiedaccessEndpoint#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#timeouts VerifiedaccessEndpoint#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint}.
         */
        @Override
        public imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint build() {
            return new imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpoint(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
