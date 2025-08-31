package imports.aws.ecr_pull_through_cache_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.118Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrPullThroughCacheRule.EcrPullThroughCacheRuleConfig")
@software.amazon.jsii.Jsii.Proxy(EcrPullThroughCacheRuleConfig.Jsii$Proxy.class)
public interface EcrPullThroughCacheRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#ecr_repository_prefix EcrPullThroughCacheRule#ecr_repository_prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEcrRepositoryPrefix();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#upstream_registry_url EcrPullThroughCacheRule#upstream_registry_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUpstreamRegistryUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#credential_arn EcrPullThroughCacheRule#credential_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCredentialArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#custom_role_arn EcrPullThroughCacheRule#custom_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#id EcrPullThroughCacheRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#upstream_repository_prefix EcrPullThroughCacheRule#upstream_repository_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpstreamRepositoryPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcrPullThroughCacheRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrPullThroughCacheRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrPullThroughCacheRuleConfig> {
        java.lang.String ecrRepositoryPrefix;
        java.lang.String upstreamRegistryUrl;
        java.lang.String credentialArn;
        java.lang.String customRoleArn;
        java.lang.String id;
        java.lang.String upstreamRepositoryPrefix;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getEcrRepositoryPrefix}
         * @param ecrRepositoryPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#ecr_repository_prefix EcrPullThroughCacheRule#ecr_repository_prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder ecrRepositoryPrefix(java.lang.String ecrRepositoryPrefix) {
            this.ecrRepositoryPrefix = ecrRepositoryPrefix;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getUpstreamRegistryUrl}
         * @param upstreamRegistryUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#upstream_registry_url EcrPullThroughCacheRule#upstream_registry_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder upstreamRegistryUrl(java.lang.String upstreamRegistryUrl) {
            this.upstreamRegistryUrl = upstreamRegistryUrl;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getCredentialArn}
         * @param credentialArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#credential_arn EcrPullThroughCacheRule#credential_arn}.
         * @return {@code this}
         */
        public Builder credentialArn(java.lang.String credentialArn) {
            this.credentialArn = credentialArn;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getCustomRoleArn}
         * @param customRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#custom_role_arn EcrPullThroughCacheRule#custom_role_arn}.
         * @return {@code this}
         */
        public Builder customRoleArn(java.lang.String customRoleArn) {
            this.customRoleArn = customRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#id EcrPullThroughCacheRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getUpstreamRepositoryPrefix}
         * @param upstreamRepositoryPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_pull_through_cache_rule#upstream_repository_prefix EcrPullThroughCacheRule#upstream_repository_prefix}.
         * @return {@code this}
         */
        public Builder upstreamRepositoryPrefix(java.lang.String upstreamRepositoryPrefix) {
            this.upstreamRepositoryPrefix = upstreamRepositoryPrefix;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getDependsOn}
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
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EcrPullThroughCacheRuleConfig#getProvisioners}
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
         * @return a new instance of {@link EcrPullThroughCacheRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrPullThroughCacheRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrPullThroughCacheRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrPullThroughCacheRuleConfig {
        private final java.lang.String ecrRepositoryPrefix;
        private final java.lang.String upstreamRegistryUrl;
        private final java.lang.String credentialArn;
        private final java.lang.String customRoleArn;
        private final java.lang.String id;
        private final java.lang.String upstreamRepositoryPrefix;
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
            this.ecrRepositoryPrefix = software.amazon.jsii.Kernel.get(this, "ecrRepositoryPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.upstreamRegistryUrl = software.amazon.jsii.Kernel.get(this, "upstreamRegistryUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentialArn = software.amazon.jsii.Kernel.get(this, "credentialArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customRoleArn = software.amazon.jsii.Kernel.get(this, "customRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.upstreamRepositoryPrefix = software.amazon.jsii.Kernel.get(this, "upstreamRepositoryPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.ecrRepositoryPrefix = java.util.Objects.requireNonNull(builder.ecrRepositoryPrefix, "ecrRepositoryPrefix is required");
            this.upstreamRegistryUrl = java.util.Objects.requireNonNull(builder.upstreamRegistryUrl, "upstreamRegistryUrl is required");
            this.credentialArn = builder.credentialArn;
            this.customRoleArn = builder.customRoleArn;
            this.id = builder.id;
            this.upstreamRepositoryPrefix = builder.upstreamRepositoryPrefix;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEcrRepositoryPrefix() {
            return this.ecrRepositoryPrefix;
        }

        @Override
        public final java.lang.String getUpstreamRegistryUrl() {
            return this.upstreamRegistryUrl;
        }

        @Override
        public final java.lang.String getCredentialArn() {
            return this.credentialArn;
        }

        @Override
        public final java.lang.String getCustomRoleArn() {
            return this.customRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getUpstreamRepositoryPrefix() {
            return this.upstreamRepositoryPrefix;
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

            data.set("ecrRepositoryPrefix", om.valueToTree(this.getEcrRepositoryPrefix()));
            data.set("upstreamRegistryUrl", om.valueToTree(this.getUpstreamRegistryUrl()));
            if (this.getCredentialArn() != null) {
                data.set("credentialArn", om.valueToTree(this.getCredentialArn()));
            }
            if (this.getCustomRoleArn() != null) {
                data.set("customRoleArn", om.valueToTree(this.getCustomRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getUpstreamRepositoryPrefix() != null) {
                data.set("upstreamRepositoryPrefix", om.valueToTree(this.getUpstreamRepositoryPrefix()));
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
            struct.set("fqn", om.valueToTree("aws.ecrPullThroughCacheRule.EcrPullThroughCacheRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrPullThroughCacheRuleConfig.Jsii$Proxy that = (EcrPullThroughCacheRuleConfig.Jsii$Proxy) o;

            if (!ecrRepositoryPrefix.equals(that.ecrRepositoryPrefix)) return false;
            if (!upstreamRegistryUrl.equals(that.upstreamRegistryUrl)) return false;
            if (this.credentialArn != null ? !this.credentialArn.equals(that.credentialArn) : that.credentialArn != null) return false;
            if (this.customRoleArn != null ? !this.customRoleArn.equals(that.customRoleArn) : that.customRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.upstreamRepositoryPrefix != null ? !this.upstreamRepositoryPrefix.equals(that.upstreamRepositoryPrefix) : that.upstreamRepositoryPrefix != null) return false;
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
            int result = this.ecrRepositoryPrefix.hashCode();
            result = 31 * result + (this.upstreamRegistryUrl.hashCode());
            result = 31 * result + (this.credentialArn != null ? this.credentialArn.hashCode() : 0);
            result = 31 * result + (this.customRoleArn != null ? this.customRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.upstreamRepositoryPrefix != null ? this.upstreamRepositoryPrefix.hashCode() : 0);
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
