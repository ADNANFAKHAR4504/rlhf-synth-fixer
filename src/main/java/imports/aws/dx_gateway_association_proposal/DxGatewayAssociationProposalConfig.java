package imports.aws.dx_gateway_association_proposal;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.040Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dxGatewayAssociationProposal.DxGatewayAssociationProposalConfig")
@software.amazon.jsii.Jsii.Proxy(DxGatewayAssociationProposalConfig.Jsii$Proxy.class)
public interface DxGatewayAssociationProposalConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#associated_gateway_id DxGatewayAssociationProposal#associated_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAssociatedGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_id DxGatewayAssociationProposal#dx_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDxGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_owner_account_id DxGatewayAssociationProposal#dx_gateway_owner_account_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDxGatewayOwnerAccountId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#allowed_prefixes DxGatewayAssociationProposal#allowed_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedPrefixes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#id DxGatewayAssociationProposal#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DxGatewayAssociationProposalConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DxGatewayAssociationProposalConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DxGatewayAssociationProposalConfig> {
        java.lang.String associatedGatewayId;
        java.lang.String dxGatewayId;
        java.lang.String dxGatewayOwnerAccountId;
        java.util.List<java.lang.String> allowedPrefixes;
        java.lang.String id;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getAssociatedGatewayId}
         * @param associatedGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#associated_gateway_id DxGatewayAssociationProposal#associated_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder associatedGatewayId(java.lang.String associatedGatewayId) {
            this.associatedGatewayId = associatedGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getDxGatewayId}
         * @param dxGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_id DxGatewayAssociationProposal#dx_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dxGatewayId(java.lang.String dxGatewayId) {
            this.dxGatewayId = dxGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getDxGatewayOwnerAccountId}
         * @param dxGatewayOwnerAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#dx_gateway_owner_account_id DxGatewayAssociationProposal#dx_gateway_owner_account_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dxGatewayOwnerAccountId(java.lang.String dxGatewayOwnerAccountId) {
            this.dxGatewayOwnerAccountId = dxGatewayOwnerAccountId;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getAllowedPrefixes}
         * @param allowedPrefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#allowed_prefixes DxGatewayAssociationProposal#allowed_prefixes}.
         * @return {@code this}
         */
        public Builder allowedPrefixes(java.util.List<java.lang.String> allowedPrefixes) {
            this.allowedPrefixes = allowedPrefixes;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_gateway_association_proposal#id DxGatewayAssociationProposal#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DxGatewayAssociationProposalConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DxGatewayAssociationProposalConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DxGatewayAssociationProposalConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DxGatewayAssociationProposalConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DxGatewayAssociationProposalConfig {
        private final java.lang.String associatedGatewayId;
        private final java.lang.String dxGatewayId;
        private final java.lang.String dxGatewayOwnerAccountId;
        private final java.util.List<java.lang.String> allowedPrefixes;
        private final java.lang.String id;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.associatedGatewayId = software.amazon.jsii.Kernel.get(this, "associatedGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dxGatewayId = software.amazon.jsii.Kernel.get(this, "dxGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dxGatewayOwnerAccountId = software.amazon.jsii.Kernel.get(this, "dxGatewayOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowedPrefixes = software.amazon.jsii.Kernel.get(this, "allowedPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.associatedGatewayId = java.util.Objects.requireNonNull(builder.associatedGatewayId, "associatedGatewayId is required");
            this.dxGatewayId = java.util.Objects.requireNonNull(builder.dxGatewayId, "dxGatewayId is required");
            this.dxGatewayOwnerAccountId = java.util.Objects.requireNonNull(builder.dxGatewayOwnerAccountId, "dxGatewayOwnerAccountId is required");
            this.allowedPrefixes = builder.allowedPrefixes;
            this.id = builder.id;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAssociatedGatewayId() {
            return this.associatedGatewayId;
        }

        @Override
        public final java.lang.String getDxGatewayId() {
            return this.dxGatewayId;
        }

        @Override
        public final java.lang.String getDxGatewayOwnerAccountId() {
            return this.dxGatewayOwnerAccountId;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedPrefixes() {
            return this.allowedPrefixes;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("associatedGatewayId", om.valueToTree(this.getAssociatedGatewayId()));
            data.set("dxGatewayId", om.valueToTree(this.getDxGatewayId()));
            data.set("dxGatewayOwnerAccountId", om.valueToTree(this.getDxGatewayOwnerAccountId()));
            if (this.getAllowedPrefixes() != null) {
                data.set("allowedPrefixes", om.valueToTree(this.getAllowedPrefixes()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dxGatewayAssociationProposal.DxGatewayAssociationProposalConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DxGatewayAssociationProposalConfig.Jsii$Proxy that = (DxGatewayAssociationProposalConfig.Jsii$Proxy) o;

            if (!associatedGatewayId.equals(that.associatedGatewayId)) return false;
            if (!dxGatewayId.equals(that.dxGatewayId)) return false;
            if (!dxGatewayOwnerAccountId.equals(that.dxGatewayOwnerAccountId)) return false;
            if (this.allowedPrefixes != null ? !this.allowedPrefixes.equals(that.allowedPrefixes) : that.allowedPrefixes != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.associatedGatewayId.hashCode();
            result = 31 * result + (this.dxGatewayId.hashCode());
            result = 31 * result + (this.dxGatewayOwnerAccountId.hashCode());
            result = 31 * result + (this.allowedPrefixes != null ? this.allowedPrefixes.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
