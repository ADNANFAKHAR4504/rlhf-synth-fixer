package imports.aws.data_aws_route53_resolver_rules;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.836Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53ResolverRules.DataAwsRoute53ResolverRulesConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsRoute53ResolverRulesConfig.Jsii$Proxy.class)
public interface DataAwsRoute53ResolverRulesConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#id DataAwsRoute53ResolverRules#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#name_regex DataAwsRoute53ResolverRules#name_regex}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNameRegex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#owner_id DataAwsRoute53ResolverRules#owner_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwnerId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#resolver_endpoint_id DataAwsRoute53ResolverRules#resolver_endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResolverEndpointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#rule_type DataAwsRoute53ResolverRules#rule_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#share_status DataAwsRoute53ResolverRules#share_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getShareStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRoute53ResolverRulesConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRoute53ResolverRulesConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRoute53ResolverRulesConfig> {
        java.lang.String id;
        java.lang.String nameRegex;
        java.lang.String ownerId;
        java.lang.String resolverEndpointId;
        java.lang.String ruleType;
        java.lang.String shareStatus;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#id DataAwsRoute53ResolverRules#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getNameRegex}
         * @param nameRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#name_regex DataAwsRoute53ResolverRules#name_regex}.
         * @return {@code this}
         */
        public Builder nameRegex(java.lang.String nameRegex) {
            this.nameRegex = nameRegex;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getOwnerId}
         * @param ownerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#owner_id DataAwsRoute53ResolverRules#owner_id}.
         * @return {@code this}
         */
        public Builder ownerId(java.lang.String ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getResolverEndpointId}
         * @param resolverEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#resolver_endpoint_id DataAwsRoute53ResolverRules#resolver_endpoint_id}.
         * @return {@code this}
         */
        public Builder resolverEndpointId(java.lang.String resolverEndpointId) {
            this.resolverEndpointId = resolverEndpointId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getRuleType}
         * @param ruleType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#rule_type DataAwsRoute53ResolverRules#rule_type}.
         * @return {@code this}
         */
        public Builder ruleType(java.lang.String ruleType) {
            this.ruleType = ruleType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getShareStatus}
         * @param shareStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_resolver_rules#share_status DataAwsRoute53ResolverRules#share_status}.
         * @return {@code this}
         */
        public Builder shareStatus(java.lang.String shareStatus) {
            this.shareStatus = shareStatus;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53ResolverRulesConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsRoute53ResolverRulesConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRoute53ResolverRulesConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRoute53ResolverRulesConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRoute53ResolverRulesConfig {
        private final java.lang.String id;
        private final java.lang.String nameRegex;
        private final java.lang.String ownerId;
        private final java.lang.String resolverEndpointId;
        private final java.lang.String ruleType;
        private final java.lang.String shareStatus;
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
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nameRegex = software.amazon.jsii.Kernel.get(this, "nameRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ownerId = software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resolverEndpointId = software.amazon.jsii.Kernel.get(this, "resolverEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleType = software.amazon.jsii.Kernel.get(this, "ruleType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shareStatus = software.amazon.jsii.Kernel.get(this, "shareStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.id = builder.id;
            this.nameRegex = builder.nameRegex;
            this.ownerId = builder.ownerId;
            this.resolverEndpointId = builder.resolverEndpointId;
            this.ruleType = builder.ruleType;
            this.shareStatus = builder.shareStatus;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getNameRegex() {
            return this.nameRegex;
        }

        @Override
        public final java.lang.String getOwnerId() {
            return this.ownerId;
        }

        @Override
        public final java.lang.String getResolverEndpointId() {
            return this.resolverEndpointId;
        }

        @Override
        public final java.lang.String getRuleType() {
            return this.ruleType;
        }

        @Override
        public final java.lang.String getShareStatus() {
            return this.shareStatus;
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

            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNameRegex() != null) {
                data.set("nameRegex", om.valueToTree(this.getNameRegex()));
            }
            if (this.getOwnerId() != null) {
                data.set("ownerId", om.valueToTree(this.getOwnerId()));
            }
            if (this.getResolverEndpointId() != null) {
                data.set("resolverEndpointId", om.valueToTree(this.getResolverEndpointId()));
            }
            if (this.getRuleType() != null) {
                data.set("ruleType", om.valueToTree(this.getRuleType()));
            }
            if (this.getShareStatus() != null) {
                data.set("shareStatus", om.valueToTree(this.getShareStatus()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute53ResolverRules.DataAwsRoute53ResolverRulesConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRoute53ResolverRulesConfig.Jsii$Proxy that = (DataAwsRoute53ResolverRulesConfig.Jsii$Proxy) o;

            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.nameRegex != null ? !this.nameRegex.equals(that.nameRegex) : that.nameRegex != null) return false;
            if (this.ownerId != null ? !this.ownerId.equals(that.ownerId) : that.ownerId != null) return false;
            if (this.resolverEndpointId != null ? !this.resolverEndpointId.equals(that.resolverEndpointId) : that.resolverEndpointId != null) return false;
            if (this.ruleType != null ? !this.ruleType.equals(that.ruleType) : that.ruleType != null) return false;
            if (this.shareStatus != null ? !this.shareStatus.equals(that.shareStatus) : that.shareStatus != null) return false;
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
            int result = this.id != null ? this.id.hashCode() : 0;
            result = 31 * result + (this.nameRegex != null ? this.nameRegex.hashCode() : 0);
            result = 31 * result + (this.ownerId != null ? this.ownerId.hashCode() : 0);
            result = 31 * result + (this.resolverEndpointId != null ? this.resolverEndpointId.hashCode() : 0);
            result = 31 * result + (this.ruleType != null ? this.ruleType.hashCode() : 0);
            result = 31 * result + (this.shareStatus != null ? this.shareStatus.hashCode() : 0);
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
