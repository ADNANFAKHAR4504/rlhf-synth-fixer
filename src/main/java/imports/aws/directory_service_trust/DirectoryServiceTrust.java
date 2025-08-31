package imports.aws.directory_service_trust;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust aws_directory_service_trust}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.004Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceTrust.DirectoryServiceTrust")
public class DirectoryServiceTrust extends com.hashicorp.cdktf.TerraformResource {

    protected DirectoryServiceTrust(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DirectoryServiceTrust(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.directory_service_trust.DirectoryServiceTrust.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust aws_directory_service_trust} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DirectoryServiceTrust(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.directory_service_trust.DirectoryServiceTrustConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DirectoryServiceTrust resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DirectoryServiceTrust to import. This parameter is required.
     * @param importFromId The id of the existing DirectoryServiceTrust that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DirectoryServiceTrust to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.directory_service_trust.DirectoryServiceTrust.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DirectoryServiceTrust resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DirectoryServiceTrust to import. This parameter is required.
     * @param importFromId The id of the existing DirectoryServiceTrust that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.directory_service_trust.DirectoryServiceTrust.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetConditionalForwarderIpAddrs() {
        software.amazon.jsii.Kernel.call(this, "resetConditionalForwarderIpAddrs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteAssociatedConditionalForwarder() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteAssociatedConditionalForwarder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelectiveAuth() {
        software.amazon.jsii.Kernel.call(this, "resetSelectiveAuth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrustType() {
        software.amazon.jsii.Kernel.call(this, "resetTrustType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedDateTime() {
        return software.amazon.jsii.Kernel.get(this, "createdDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedDateTime() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStateLastUpdatedDateTime() {
        return software.amazon.jsii.Kernel.get(this, "stateLastUpdatedDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustState() {
        return software.amazon.jsii.Kernel.get(this, "trustState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustStateReason() {
        return software.amazon.jsii.Kernel.get(this, "trustStateReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConditionalForwarderIpAddrsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "conditionalForwarderIpAddrsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteAssociatedConditionalForwarderInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteAssociatedConditionalForwarderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRemoteDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteDomainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSelectiveAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "selectiveAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustDirectionInput() {
        return software.amazon.jsii.Kernel.get(this, "trustDirectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "trustPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "trustTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getConditionalForwarderIpAddrs() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "conditionalForwarderIpAddrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setConditionalForwarderIpAddrs(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "conditionalForwarderIpAddrs", java.util.Objects.requireNonNull(value, "conditionalForwarderIpAddrs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteAssociatedConditionalForwarder() {
        return software.amazon.jsii.Kernel.get(this, "deleteAssociatedConditionalForwarder", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteAssociatedConditionalForwarder(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteAssociatedConditionalForwarder", java.util.Objects.requireNonNull(value, "deleteAssociatedConditionalForwarder is required"));
    }

    public void setDeleteAssociatedConditionalForwarder(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteAssociatedConditionalForwarder", java.util.Objects.requireNonNull(value, "deleteAssociatedConditionalForwarder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryId", java.util.Objects.requireNonNull(value, "directoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRemoteDomainName() {
        return software.amazon.jsii.Kernel.get(this, "remoteDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRemoteDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "remoteDomainName", java.util.Objects.requireNonNull(value, "remoteDomainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSelectiveAuth() {
        return software.amazon.jsii.Kernel.get(this, "selectiveAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSelectiveAuth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "selectiveAuth", java.util.Objects.requireNonNull(value, "selectiveAuth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustDirection() {
        return software.amazon.jsii.Kernel.get(this, "trustDirection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustDirection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustDirection", java.util.Objects.requireNonNull(value, "trustDirection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustPassword() {
        return software.amazon.jsii.Kernel.get(this, "trustPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustPassword", java.util.Objects.requireNonNull(value, "trustPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustType() {
        return software.amazon.jsii.Kernel.get(this, "trustType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustType", java.util.Objects.requireNonNull(value, "trustType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.directory_service_trust.DirectoryServiceTrust}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.directory_service_trust.DirectoryServiceTrust> {
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
        private final imports.aws.directory_service_trust.DirectoryServiceTrustConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.directory_service_trust.DirectoryServiceTrustConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#directory_id DirectoryServiceTrust#directory_id}.
         * <p>
         * @return {@code this}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#directory_id DirectoryServiceTrust#directory_id}. This parameter is required.
         */
        public Builder directoryId(final java.lang.String directoryId) {
            this.config.directoryId(directoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#remote_domain_name DirectoryServiceTrust#remote_domain_name}.
         * <p>
         * @return {@code this}
         * @param remoteDomainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#remote_domain_name DirectoryServiceTrust#remote_domain_name}. This parameter is required.
         */
        public Builder remoteDomainName(final java.lang.String remoteDomainName) {
            this.config.remoteDomainName(remoteDomainName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_direction DirectoryServiceTrust#trust_direction}.
         * <p>
         * @return {@code this}
         * @param trustDirection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_direction DirectoryServiceTrust#trust_direction}. This parameter is required.
         */
        public Builder trustDirection(final java.lang.String trustDirection) {
            this.config.trustDirection(trustDirection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_password DirectoryServiceTrust#trust_password}.
         * <p>
         * @return {@code this}
         * @param trustPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_password DirectoryServiceTrust#trust_password}. This parameter is required.
         */
        public Builder trustPassword(final java.lang.String trustPassword) {
            this.config.trustPassword(trustPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#conditional_forwarder_ip_addrs DirectoryServiceTrust#conditional_forwarder_ip_addrs}.
         * <p>
         * @return {@code this}
         * @param conditionalForwarderIpAddrs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#conditional_forwarder_ip_addrs DirectoryServiceTrust#conditional_forwarder_ip_addrs}. This parameter is required.
         */
        public Builder conditionalForwarderIpAddrs(final java.util.List<java.lang.String> conditionalForwarderIpAddrs) {
            this.config.conditionalForwarderIpAddrs(conditionalForwarderIpAddrs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}.
         * <p>
         * @return {@code this}
         * @param deleteAssociatedConditionalForwarder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}. This parameter is required.
         */
        public Builder deleteAssociatedConditionalForwarder(final java.lang.Boolean deleteAssociatedConditionalForwarder) {
            this.config.deleteAssociatedConditionalForwarder(deleteAssociatedConditionalForwarder);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}.
         * <p>
         * @return {@code this}
         * @param deleteAssociatedConditionalForwarder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}. This parameter is required.
         */
        public Builder deleteAssociatedConditionalForwarder(final com.hashicorp.cdktf.IResolvable deleteAssociatedConditionalForwarder) {
            this.config.deleteAssociatedConditionalForwarder(deleteAssociatedConditionalForwarder);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#selective_auth DirectoryServiceTrust#selective_auth}.
         * <p>
         * @return {@code this}
         * @param selectiveAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#selective_auth DirectoryServiceTrust#selective_auth}. This parameter is required.
         */
        public Builder selectiveAuth(final java.lang.String selectiveAuth) {
            this.config.selectiveAuth(selectiveAuth);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_type DirectoryServiceTrust#trust_type}.
         * <p>
         * @return {@code this}
         * @param trustType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_type DirectoryServiceTrust#trust_type}. This parameter is required.
         */
        public Builder trustType(final java.lang.String trustType) {
            this.config.trustType(trustType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.directory_service_trust.DirectoryServiceTrust}.
         */
        @Override
        public imports.aws.directory_service_trust.DirectoryServiceTrust build() {
            return new imports.aws.directory_service_trust.DirectoryServiceTrust(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
