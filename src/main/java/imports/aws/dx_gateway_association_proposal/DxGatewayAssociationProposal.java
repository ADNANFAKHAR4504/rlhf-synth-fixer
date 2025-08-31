package imports.aws.dx_gateway_association_proposal;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal aws_dx_gateway_association_proposal}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.040Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dxGatewayAssociationProposal.DxGatewayAssociationProposal")
public class DxGatewayAssociationProposal extends com.hashicorp.cdktf.TerraformResource {

    protected DxGatewayAssociationProposal(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DxGatewayAssociationProposal(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal aws_dx_gateway_association_proposal} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DxGatewayAssociationProposal(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposalConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DxGatewayAssociationProposal resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DxGatewayAssociationProposal to import. This parameter is required.
     * @param importFromId The id of the existing DxGatewayAssociationProposal that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DxGatewayAssociationProposal to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DxGatewayAssociationProposal resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DxGatewayAssociationProposal to import. This parameter is required.
     * @param importFromId The id of the existing DxGatewayAssociationProposal that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAllowedPrefixes() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedPrefixes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociatedGatewayOwnerAccountId() {
        return software.amazon.jsii.Kernel.get(this, "associatedGatewayOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociatedGatewayType() {
        return software.amazon.jsii.Kernel.get(this, "associatedGatewayType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedPrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedPrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssociatedGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "associatedGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDxGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dxGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDxGatewayOwnerAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dxGatewayOwnerAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedPrefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedPrefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedPrefixes", java.util.Objects.requireNonNull(value, "allowedPrefixes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociatedGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "associatedGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssociatedGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "associatedGatewayId", java.util.Objects.requireNonNull(value, "associatedGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDxGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "dxGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDxGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dxGatewayId", java.util.Objects.requireNonNull(value, "dxGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDxGatewayOwnerAccountId() {
        return software.amazon.jsii.Kernel.get(this, "dxGatewayOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDxGatewayOwnerAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dxGatewayOwnerAccountId", java.util.Objects.requireNonNull(value, "dxGatewayOwnerAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal> {
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
        private final imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposalConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposalConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#associated_gateway_id DxGatewayAssociationProposal#associated_gateway_id}.
         * <p>
         * @return {@code this}
         * @param associatedGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#associated_gateway_id DxGatewayAssociationProposal#associated_gateway_id}. This parameter is required.
         */
        public Builder associatedGatewayId(final java.lang.String associatedGatewayId) {
            this.config.associatedGatewayId(associatedGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_id DxGatewayAssociationProposal#dx_gateway_id}.
         * <p>
         * @return {@code this}
         * @param dxGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_id DxGatewayAssociationProposal#dx_gateway_id}. This parameter is required.
         */
        public Builder dxGatewayId(final java.lang.String dxGatewayId) {
            this.config.dxGatewayId(dxGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_owner_account_id DxGatewayAssociationProposal#dx_gateway_owner_account_id}.
         * <p>
         * @return {@code this}
         * @param dxGatewayOwnerAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_owner_account_id DxGatewayAssociationProposal#dx_gateway_owner_account_id}. This parameter is required.
         */
        public Builder dxGatewayOwnerAccountId(final java.lang.String dxGatewayOwnerAccountId) {
            this.config.dxGatewayOwnerAccountId(dxGatewayOwnerAccountId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#allowed_prefixes DxGatewayAssociationProposal#allowed_prefixes}.
         * <p>
         * @return {@code this}
         * @param allowedPrefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#allowed_prefixes DxGatewayAssociationProposal#allowed_prefixes}. This parameter is required.
         */
        public Builder allowedPrefixes(final java.util.List<java.lang.String> allowedPrefixes) {
            this.config.allowedPrefixes(allowedPrefixes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#id DxGatewayAssociationProposal#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#id DxGatewayAssociationProposal#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal}.
         */
        @Override
        public imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal build() {
            return new imports.aws.dx_gateway_association_proposal.DxGatewayAssociationProposal(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
