package imports.aws.directory_service_trust;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.004Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceTrust.DirectoryServiceTrustConfig")
@software.amazon.jsii.Jsii.Proxy(DirectoryServiceTrustConfig.Jsii$Proxy.class)
public interface DirectoryServiceTrustConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#directory_id DirectoryServiceTrust#directory_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#remote_domain_name DirectoryServiceTrust#remote_domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRemoteDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_direction DirectoryServiceTrust#trust_direction}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrustDirection();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_password DirectoryServiceTrust#trust_password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrustPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#conditional_forwarder_ip_addrs DirectoryServiceTrust#conditional_forwarder_ip_addrs}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConditionalForwarderIpAddrs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteAssociatedConditionalForwarder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#selective_auth DirectoryServiceTrust#selective_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSelectiveAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_type DirectoryServiceTrust#trust_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrustType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DirectoryServiceTrustConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DirectoryServiceTrustConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DirectoryServiceTrustConfig> {
        java.lang.String directoryId;
        java.lang.String remoteDomainName;
        java.lang.String trustDirection;
        java.lang.String trustPassword;
        java.util.List<java.lang.String> conditionalForwarderIpAddrs;
        java.lang.Object deleteAssociatedConditionalForwarder;
        java.lang.String selectiveAuth;
        java.lang.String trustType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#directory_id DirectoryServiceTrust#directory_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getRemoteDomainName}
         * @param remoteDomainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#remote_domain_name DirectoryServiceTrust#remote_domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder remoteDomainName(java.lang.String remoteDomainName) {
            this.remoteDomainName = remoteDomainName;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getTrustDirection}
         * @param trustDirection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_direction DirectoryServiceTrust#trust_direction}. This parameter is required.
         * @return {@code this}
         */
        public Builder trustDirection(java.lang.String trustDirection) {
            this.trustDirection = trustDirection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getTrustPassword}
         * @param trustPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_password DirectoryServiceTrust#trust_password}. This parameter is required.
         * @return {@code this}
         */
        public Builder trustPassword(java.lang.String trustPassword) {
            this.trustPassword = trustPassword;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getConditionalForwarderIpAddrs}
         * @param conditionalForwarderIpAddrs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#conditional_forwarder_ip_addrs DirectoryServiceTrust#conditional_forwarder_ip_addrs}.
         * @return {@code this}
         */
        public Builder conditionalForwarderIpAddrs(java.util.List<java.lang.String> conditionalForwarderIpAddrs) {
            this.conditionalForwarderIpAddrs = conditionalForwarderIpAddrs;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getDeleteAssociatedConditionalForwarder}
         * @param deleteAssociatedConditionalForwarder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}.
         * @return {@code this}
         */
        public Builder deleteAssociatedConditionalForwarder(java.lang.Boolean deleteAssociatedConditionalForwarder) {
            this.deleteAssociatedConditionalForwarder = deleteAssociatedConditionalForwarder;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getDeleteAssociatedConditionalForwarder}
         * @param deleteAssociatedConditionalForwarder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#delete_associated_conditional_forwarder DirectoryServiceTrust#delete_associated_conditional_forwarder}.
         * @return {@code this}
         */
        public Builder deleteAssociatedConditionalForwarder(com.hashicorp.cdktf.IResolvable deleteAssociatedConditionalForwarder) {
            this.deleteAssociatedConditionalForwarder = deleteAssociatedConditionalForwarder;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getSelectiveAuth}
         * @param selectiveAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#selective_auth DirectoryServiceTrust#selective_auth}.
         * @return {@code this}
         */
        public Builder selectiveAuth(java.lang.String selectiveAuth) {
            this.selectiveAuth = selectiveAuth;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getTrustType}
         * @param trustType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_trust#trust_type DirectoryServiceTrust#trust_type}.
         * @return {@code this}
         */
        public Builder trustType(java.lang.String trustType) {
            this.trustType = trustType;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getDependsOn}
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
         * Sets the value of {@link DirectoryServiceTrustConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceTrustConfig#getProvisioners}
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
         * @return a new instance of {@link DirectoryServiceTrustConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DirectoryServiceTrustConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DirectoryServiceTrustConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DirectoryServiceTrustConfig {
        private final java.lang.String directoryId;
        private final java.lang.String remoteDomainName;
        private final java.lang.String trustDirection;
        private final java.lang.String trustPassword;
        private final java.util.List<java.lang.String> conditionalForwarderIpAddrs;
        private final java.lang.Object deleteAssociatedConditionalForwarder;
        private final java.lang.String selectiveAuth;
        private final java.lang.String trustType;
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
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.remoteDomainName = software.amazon.jsii.Kernel.get(this, "remoteDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trustDirection = software.amazon.jsii.Kernel.get(this, "trustDirection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trustPassword = software.amazon.jsii.Kernel.get(this, "trustPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.conditionalForwarderIpAddrs = software.amazon.jsii.Kernel.get(this, "conditionalForwarderIpAddrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.deleteAssociatedConditionalForwarder = software.amazon.jsii.Kernel.get(this, "deleteAssociatedConditionalForwarder", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.selectiveAuth = software.amazon.jsii.Kernel.get(this, "selectiveAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trustType = software.amazon.jsii.Kernel.get(this, "trustType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.directoryId = java.util.Objects.requireNonNull(builder.directoryId, "directoryId is required");
            this.remoteDomainName = java.util.Objects.requireNonNull(builder.remoteDomainName, "remoteDomainName is required");
            this.trustDirection = java.util.Objects.requireNonNull(builder.trustDirection, "trustDirection is required");
            this.trustPassword = java.util.Objects.requireNonNull(builder.trustPassword, "trustPassword is required");
            this.conditionalForwarderIpAddrs = builder.conditionalForwarderIpAddrs;
            this.deleteAssociatedConditionalForwarder = builder.deleteAssociatedConditionalForwarder;
            this.selectiveAuth = builder.selectiveAuth;
            this.trustType = builder.trustType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.String getRemoteDomainName() {
            return this.remoteDomainName;
        }

        @Override
        public final java.lang.String getTrustDirection() {
            return this.trustDirection;
        }

        @Override
        public final java.lang.String getTrustPassword() {
            return this.trustPassword;
        }

        @Override
        public final java.util.List<java.lang.String> getConditionalForwarderIpAddrs() {
            return this.conditionalForwarderIpAddrs;
        }

        @Override
        public final java.lang.Object getDeleteAssociatedConditionalForwarder() {
            return this.deleteAssociatedConditionalForwarder;
        }

        @Override
        public final java.lang.String getSelectiveAuth() {
            return this.selectiveAuth;
        }

        @Override
        public final java.lang.String getTrustType() {
            return this.trustType;
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

            data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            data.set("remoteDomainName", om.valueToTree(this.getRemoteDomainName()));
            data.set("trustDirection", om.valueToTree(this.getTrustDirection()));
            data.set("trustPassword", om.valueToTree(this.getTrustPassword()));
            if (this.getConditionalForwarderIpAddrs() != null) {
                data.set("conditionalForwarderIpAddrs", om.valueToTree(this.getConditionalForwarderIpAddrs()));
            }
            if (this.getDeleteAssociatedConditionalForwarder() != null) {
                data.set("deleteAssociatedConditionalForwarder", om.valueToTree(this.getDeleteAssociatedConditionalForwarder()));
            }
            if (this.getSelectiveAuth() != null) {
                data.set("selectiveAuth", om.valueToTree(this.getSelectiveAuth()));
            }
            if (this.getTrustType() != null) {
                data.set("trustType", om.valueToTree(this.getTrustType()));
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
            struct.set("fqn", om.valueToTree("aws.directoryServiceTrust.DirectoryServiceTrustConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DirectoryServiceTrustConfig.Jsii$Proxy that = (DirectoryServiceTrustConfig.Jsii$Proxy) o;

            if (!directoryId.equals(that.directoryId)) return false;
            if (!remoteDomainName.equals(that.remoteDomainName)) return false;
            if (!trustDirection.equals(that.trustDirection)) return false;
            if (!trustPassword.equals(that.trustPassword)) return false;
            if (this.conditionalForwarderIpAddrs != null ? !this.conditionalForwarderIpAddrs.equals(that.conditionalForwarderIpAddrs) : that.conditionalForwarderIpAddrs != null) return false;
            if (this.deleteAssociatedConditionalForwarder != null ? !this.deleteAssociatedConditionalForwarder.equals(that.deleteAssociatedConditionalForwarder) : that.deleteAssociatedConditionalForwarder != null) return false;
            if (this.selectiveAuth != null ? !this.selectiveAuth.equals(that.selectiveAuth) : that.selectiveAuth != null) return false;
            if (this.trustType != null ? !this.trustType.equals(that.trustType) : that.trustType != null) return false;
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
            int result = this.directoryId.hashCode();
            result = 31 * result + (this.remoteDomainName.hashCode());
            result = 31 * result + (this.trustDirection.hashCode());
            result = 31 * result + (this.trustPassword.hashCode());
            result = 31 * result + (this.conditionalForwarderIpAddrs != null ? this.conditionalForwarderIpAddrs.hashCode() : 0);
            result = 31 * result + (this.deleteAssociatedConditionalForwarder != null ? this.deleteAssociatedConditionalForwarder.hashCode() : 0);
            result = 31 * result + (this.selectiveAuth != null ? this.selectiveAuth.hashCode() : 0);
            result = 31 * result + (this.trustType != null ? this.trustType.hashCode() : 0);
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
