package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.400Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainConfig")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainConfig.Jsii$Proxy.class)
public interface CustomerprofilesDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_expiration_days CustomerprofilesDomain#default_expiration_days}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDefaultExpirationDays();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#domain_name CustomerprofilesDomain#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#dead_letter_queue_url CustomerprofilesDomain#dead_letter_queue_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeadLetterQueueUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_encryption_key CustomerprofilesDomain#default_encryption_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultEncryptionKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#id CustomerprofilesDomain#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * matching block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching CustomerprofilesDomain#matching}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching getMatching() {
        return null;
    }

    /**
     * rule_based_matching block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule_based_matching CustomerprofilesDomain#rule_based_matching}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching getRuleBasedMatching() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags CustomerprofilesDomain#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags_all CustomerprofilesDomain#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainConfig> {
        java.lang.Number defaultExpirationDays;
        java.lang.String domainName;
        java.lang.String deadLetterQueueUrl;
        java.lang.String defaultEncryptionKey;
        java.lang.String id;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching matching;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching ruleBasedMatching;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getDefaultExpirationDays}
         * @param defaultExpirationDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_expiration_days CustomerprofilesDomain#default_expiration_days}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultExpirationDays(java.lang.Number defaultExpirationDays) {
            this.defaultExpirationDays = defaultExpirationDays;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#domain_name CustomerprofilesDomain#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getDeadLetterQueueUrl}
         * @param deadLetterQueueUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#dead_letter_queue_url CustomerprofilesDomain#dead_letter_queue_url}.
         * @return {@code this}
         */
        public Builder deadLetterQueueUrl(java.lang.String deadLetterQueueUrl) {
            this.deadLetterQueueUrl = deadLetterQueueUrl;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getDefaultEncryptionKey}
         * @param defaultEncryptionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#default_encryption_key CustomerprofilesDomain#default_encryption_key}.
         * @return {@code this}
         */
        public Builder defaultEncryptionKey(java.lang.String defaultEncryptionKey) {
            this.defaultEncryptionKey = defaultEncryptionKey;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#id CustomerprofilesDomain#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getMatching}
         * @param matching matching block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching CustomerprofilesDomain#matching}
         * @return {@code this}
         */
        public Builder matching(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching matching) {
            this.matching = matching;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getRuleBasedMatching}
         * @param ruleBasedMatching rule_based_matching block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#rule_based_matching CustomerprofilesDomain#rule_based_matching}
         * @return {@code this}
         */
        public Builder ruleBasedMatching(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching ruleBasedMatching) {
            this.ruleBasedMatching = ruleBasedMatching;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags CustomerprofilesDomain#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#tags_all CustomerprofilesDomain#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getDependsOn}
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
         * Sets the value of {@link CustomerprofilesDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainConfig#getProvisioners}
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
         * @return a new instance of {@link CustomerprofilesDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainConfig {
        private final java.lang.Number defaultExpirationDays;
        private final java.lang.String domainName;
        private final java.lang.String deadLetterQueueUrl;
        private final java.lang.String defaultEncryptionKey;
        private final java.lang.String id;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching matching;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching ruleBasedMatching;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.defaultExpirationDays = software.amazon.jsii.Kernel.get(this, "defaultExpirationDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deadLetterQueueUrl = software.amazon.jsii.Kernel.get(this, "deadLetterQueueUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultEncryptionKey = software.amazon.jsii.Kernel.get(this, "defaultEncryptionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.matching = software.amazon.jsii.Kernel.get(this, "matching", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching.class));
            this.ruleBasedMatching = software.amazon.jsii.Kernel.get(this, "ruleBasedMatching", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.defaultExpirationDays = java.util.Objects.requireNonNull(builder.defaultExpirationDays, "defaultExpirationDays is required");
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.deadLetterQueueUrl = builder.deadLetterQueueUrl;
            this.defaultEncryptionKey = builder.defaultEncryptionKey;
            this.id = builder.id;
            this.matching = builder.matching;
            this.ruleBasedMatching = builder.ruleBasedMatching;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getDefaultExpirationDays() {
            return this.defaultExpirationDays;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getDeadLetterQueueUrl() {
            return this.deadLetterQueueUrl;
        }

        @Override
        public final java.lang.String getDefaultEncryptionKey() {
            return this.defaultEncryptionKey;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching getMatching() {
            return this.matching;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching getRuleBasedMatching() {
            return this.ruleBasedMatching;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("defaultExpirationDays", om.valueToTree(this.getDefaultExpirationDays()));
            data.set("domainName", om.valueToTree(this.getDomainName()));
            if (this.getDeadLetterQueueUrl() != null) {
                data.set("deadLetterQueueUrl", om.valueToTree(this.getDeadLetterQueueUrl()));
            }
            if (this.getDefaultEncryptionKey() != null) {
                data.set("defaultEncryptionKey", om.valueToTree(this.getDefaultEncryptionKey()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMatching() != null) {
                data.set("matching", om.valueToTree(this.getMatching()));
            }
            if (this.getRuleBasedMatching() != null) {
                data.set("ruleBasedMatching", om.valueToTree(this.getRuleBasedMatching()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainConfig.Jsii$Proxy that = (CustomerprofilesDomainConfig.Jsii$Proxy) o;

            if (!defaultExpirationDays.equals(that.defaultExpirationDays)) return false;
            if (!domainName.equals(that.domainName)) return false;
            if (this.deadLetterQueueUrl != null ? !this.deadLetterQueueUrl.equals(that.deadLetterQueueUrl) : that.deadLetterQueueUrl != null) return false;
            if (this.defaultEncryptionKey != null ? !this.defaultEncryptionKey.equals(that.defaultEncryptionKey) : that.defaultEncryptionKey != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.matching != null ? !this.matching.equals(that.matching) : that.matching != null) return false;
            if (this.ruleBasedMatching != null ? !this.ruleBasedMatching.equals(that.ruleBasedMatching) : that.ruleBasedMatching != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.defaultExpirationDays.hashCode();
            result = 31 * result + (this.domainName.hashCode());
            result = 31 * result + (this.deadLetterQueueUrl != null ? this.deadLetterQueueUrl.hashCode() : 0);
            result = 31 * result + (this.defaultEncryptionKey != null ? this.defaultEncryptionKey.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.matching != null ? this.matching.hashCode() : 0);
            result = 31 * result + (this.ruleBasedMatching != null ? this.ruleBasedMatching.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
