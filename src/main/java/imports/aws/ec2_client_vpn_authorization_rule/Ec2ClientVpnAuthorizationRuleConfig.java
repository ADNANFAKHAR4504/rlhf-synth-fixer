package imports.aws.ec2_client_vpn_authorization_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnAuthorizationRule.Ec2ClientVpnAuthorizationRuleConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2ClientVpnAuthorizationRuleConfig.Jsii$Proxy.class)
public interface Ec2ClientVpnAuthorizationRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#client_vpn_endpoint_id Ec2ClientVpnAuthorizationRule#client_vpn_endpoint_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientVpnEndpointId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#target_network_cidr Ec2ClientVpnAuthorizationRule#target_network_cidr}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetNetworkCidr();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#access_group_id Ec2ClientVpnAuthorizationRule#access_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAuthorizeAllGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#description Ec2ClientVpnAuthorizationRule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#id Ec2ClientVpnAuthorizationRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#timeouts Ec2ClientVpnAuthorizationRule#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2ClientVpnAuthorizationRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2ClientVpnAuthorizationRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2ClientVpnAuthorizationRuleConfig> {
        java.lang.String clientVpnEndpointId;
        java.lang.String targetNetworkCidr;
        java.lang.String accessGroupId;
        java.lang.Object authorizeAllGroups;
        java.lang.String description;
        java.lang.String id;
        imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getClientVpnEndpointId}
         * @param clientVpnEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#client_vpn_endpoint_id Ec2ClientVpnAuthorizationRule#client_vpn_endpoint_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientVpnEndpointId(java.lang.String clientVpnEndpointId) {
            this.clientVpnEndpointId = clientVpnEndpointId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getTargetNetworkCidr}
         * @param targetNetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#target_network_cidr Ec2ClientVpnAuthorizationRule#target_network_cidr}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetNetworkCidr(java.lang.String targetNetworkCidr) {
            this.targetNetworkCidr = targetNetworkCidr;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getAccessGroupId}
         * @param accessGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#access_group_id Ec2ClientVpnAuthorizationRule#access_group_id}.
         * @return {@code this}
         */
        public Builder accessGroupId(java.lang.String accessGroupId) {
            this.accessGroupId = accessGroupId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getAuthorizeAllGroups}
         * @param authorizeAllGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}.
         * @return {@code this}
         */
        public Builder authorizeAllGroups(java.lang.Boolean authorizeAllGroups) {
            this.authorizeAllGroups = authorizeAllGroups;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getAuthorizeAllGroups}
         * @param authorizeAllGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}.
         * @return {@code this}
         */
        public Builder authorizeAllGroups(com.hashicorp.cdktf.IResolvable authorizeAllGroups) {
            this.authorizeAllGroups = authorizeAllGroups;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#description Ec2ClientVpnAuthorizationRule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#id Ec2ClientVpnAuthorizationRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#timeouts Ec2ClientVpnAuthorizationRule#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getDependsOn}
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
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnAuthorizationRuleConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2ClientVpnAuthorizationRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2ClientVpnAuthorizationRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2ClientVpnAuthorizationRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2ClientVpnAuthorizationRuleConfig {
        private final java.lang.String clientVpnEndpointId;
        private final java.lang.String targetNetworkCidr;
        private final java.lang.String accessGroupId;
        private final java.lang.Object authorizeAllGroups;
        private final java.lang.String description;
        private final java.lang.String id;
        private final imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts timeouts;
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
            this.clientVpnEndpointId = software.amazon.jsii.Kernel.get(this, "clientVpnEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetNetworkCidr = software.amazon.jsii.Kernel.get(this, "targetNetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessGroupId = software.amazon.jsii.Kernel.get(this, "accessGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizeAllGroups = software.amazon.jsii.Kernel.get(this, "authorizeAllGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts.class));
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
            this.clientVpnEndpointId = java.util.Objects.requireNonNull(builder.clientVpnEndpointId, "clientVpnEndpointId is required");
            this.targetNetworkCidr = java.util.Objects.requireNonNull(builder.targetNetworkCidr, "targetNetworkCidr is required");
            this.accessGroupId = builder.accessGroupId;
            this.authorizeAllGroups = builder.authorizeAllGroups;
            this.description = builder.description;
            this.id = builder.id;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getClientVpnEndpointId() {
            return this.clientVpnEndpointId;
        }

        @Override
        public final java.lang.String getTargetNetworkCidr() {
            return this.targetNetworkCidr;
        }

        @Override
        public final java.lang.String getAccessGroupId() {
            return this.accessGroupId;
        }

        @Override
        public final java.lang.Object getAuthorizeAllGroups() {
            return this.authorizeAllGroups;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("clientVpnEndpointId", om.valueToTree(this.getClientVpnEndpointId()));
            data.set("targetNetworkCidr", om.valueToTree(this.getTargetNetworkCidr()));
            if (this.getAccessGroupId() != null) {
                data.set("accessGroupId", om.valueToTree(this.getAccessGroupId()));
            }
            if (this.getAuthorizeAllGroups() != null) {
                data.set("authorizeAllGroups", om.valueToTree(this.getAuthorizeAllGroups()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.ec2ClientVpnAuthorizationRule.Ec2ClientVpnAuthorizationRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2ClientVpnAuthorizationRuleConfig.Jsii$Proxy that = (Ec2ClientVpnAuthorizationRuleConfig.Jsii$Proxy) o;

            if (!clientVpnEndpointId.equals(that.clientVpnEndpointId)) return false;
            if (!targetNetworkCidr.equals(that.targetNetworkCidr)) return false;
            if (this.accessGroupId != null ? !this.accessGroupId.equals(that.accessGroupId) : that.accessGroupId != null) return false;
            if (this.authorizeAllGroups != null ? !this.authorizeAllGroups.equals(that.authorizeAllGroups) : that.authorizeAllGroups != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.clientVpnEndpointId.hashCode();
            result = 31 * result + (this.targetNetworkCidr.hashCode());
            result = 31 * result + (this.accessGroupId != null ? this.accessGroupId.hashCode() : 0);
            result = 31 * result + (this.authorizeAllGroups != null ? this.authorizeAllGroups.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
