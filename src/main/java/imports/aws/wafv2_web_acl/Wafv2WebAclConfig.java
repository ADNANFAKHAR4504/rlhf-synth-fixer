package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.671Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclConfig")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclConfig.Jsii$Proxy.class)
public interface Wafv2WebAclConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * default_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_action Wafv2WebAcl#default_action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction getDefaultAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScope();

    /**
     * visibility_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig getVisibilityConfig();

    /**
     * association_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#association_config Wafv2WebAcl#association_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig getAssociationConfig() {
        return null;
    }

    /**
     * captcha_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig getCaptchaConfig() {
        return null;
    }

    /**
     * challenge_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig getChallengeConfig() {
        return null;
    }

    /**
     * custom_response_body block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomResponseBody() {
        return null;
    }

    /**
     * data_protection_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection_config Wafv2WebAcl#data_protection_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig getDataProtectionConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleJson() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTokenDomains() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclConfig> {
        imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction defaultAction;
        java.lang.String scope;
        imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig visibilityConfig;
        imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig associationConfig;
        imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig captchaConfig;
        imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig challengeConfig;
        java.lang.Object customResponseBody;
        imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig dataProtectionConfig;
        java.lang.String description;
        java.lang.String id;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.Object rule;
        java.lang.String ruleJson;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.util.List<java.lang.String> tokenDomains;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getDefaultAction}
         * @param defaultAction default_action block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_action Wafv2WebAcl#default_action}
         * @return {@code this}
         */
        public Builder defaultAction(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction defaultAction) {
            this.defaultAction = defaultAction;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getScope}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}. This parameter is required.
         * @return {@code this}
         */
        public Builder scope(java.lang.String scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getVisibilityConfig}
         * @param visibilityConfig visibility_config block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
         * @return {@code this}
         */
        public Builder visibilityConfig(imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig visibilityConfig) {
            this.visibilityConfig = visibilityConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getAssociationConfig}
         * @param associationConfig association_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#association_config Wafv2WebAcl#association_config}
         * @return {@code this}
         */
        public Builder associationConfig(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig associationConfig) {
            this.associationConfig = associationConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getCaptchaConfig}
         * @param captchaConfig captcha_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
         * @return {@code this}
         */
        public Builder captchaConfig(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig captchaConfig) {
            this.captchaConfig = captchaConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getChallengeConfig}
         * @param challengeConfig challenge_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
         * @return {@code this}
         */
        public Builder challengeConfig(imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig challengeConfig) {
            this.challengeConfig = challengeConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getCustomResponseBody}
         * @param customResponseBody custom_response_body block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
         * @return {@code this}
         */
        public Builder customResponseBody(com.hashicorp.cdktf.IResolvable customResponseBody) {
            this.customResponseBody = customResponseBody;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getCustomResponseBody}
         * @param customResponseBody custom_response_body block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
         * @return {@code this}
         */
        public Builder customResponseBody(java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBody> customResponseBody) {
            this.customResponseBody = customResponseBody;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getDataProtectionConfig}
         * @param dataProtectionConfig data_protection_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection_config Wafv2WebAcl#data_protection_config}
         * @return {@code this}
         */
        public Builder dataProtectionConfig(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig dataProtectionConfig) {
            this.dataProtectionConfig = dataProtectionConfig;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getRule}
         * @param rule rule block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
         * @return {@code this}
         */
        public Builder rule(com.hashicorp.cdktf.IResolvable rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getRule}
         * @param rule rule block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
         * @return {@code this}
         */
        public Builder rule(java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclRule> rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getRuleJson}
         * @param ruleJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}.
         * @return {@code this}
         */
        public Builder ruleJson(java.lang.String ruleJson) {
            this.ruleJson = ruleJson;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getTokenDomains}
         * @param tokenDomains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}.
         * @return {@code this}
         */
        public Builder tokenDomains(java.util.List<java.lang.String> tokenDomains) {
            this.tokenDomains = tokenDomains;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getDependsOn}
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
         * Sets the value of {@link Wafv2WebAclConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclConfig#getProvisioners}
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
         * @return a new instance of {@link Wafv2WebAclConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclConfig {
        private final imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction defaultAction;
        private final java.lang.String scope;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig visibilityConfig;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig associationConfig;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig captchaConfig;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig challengeConfig;
        private final java.lang.Object customResponseBody;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig dataProtectionConfig;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.Object rule;
        private final java.lang.String ruleJson;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.util.List<java.lang.String> tokenDomains;
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
            this.defaultAction = software.amazon.jsii.Kernel.get(this, "defaultAction", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.visibilityConfig = software.amazon.jsii.Kernel.get(this, "visibilityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig.class));
            this.associationConfig = software.amazon.jsii.Kernel.get(this, "associationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig.class));
            this.captchaConfig = software.amazon.jsii.Kernel.get(this, "captchaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig.class));
            this.challengeConfig = software.amazon.jsii.Kernel.get(this, "challengeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig.class));
            this.customResponseBody = software.amazon.jsii.Kernel.get(this, "customResponseBody", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataProtectionConfig = software.amazon.jsii.Kernel.get(this, "dataProtectionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ruleJson = software.amazon.jsii.Kernel.get(this, "ruleJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tokenDomains = software.amazon.jsii.Kernel.get(this, "tokenDomains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.defaultAction = java.util.Objects.requireNonNull(builder.defaultAction, "defaultAction is required");
            this.scope = java.util.Objects.requireNonNull(builder.scope, "scope is required");
            this.visibilityConfig = java.util.Objects.requireNonNull(builder.visibilityConfig, "visibilityConfig is required");
            this.associationConfig = builder.associationConfig;
            this.captchaConfig = builder.captchaConfig;
            this.challengeConfig = builder.challengeConfig;
            this.customResponseBody = builder.customResponseBody;
            this.dataProtectionConfig = builder.dataProtectionConfig;
            this.description = builder.description;
            this.id = builder.id;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.rule = builder.rule;
            this.ruleJson = builder.ruleJson;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tokenDomains = builder.tokenDomains;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction getDefaultAction() {
            return this.defaultAction;
        }

        @Override
        public final java.lang.String getScope() {
            return this.scope;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig getVisibilityConfig() {
            return this.visibilityConfig;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig getAssociationConfig() {
            return this.associationConfig;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig getCaptchaConfig() {
            return this.captchaConfig;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig getChallengeConfig() {
            return this.challengeConfig;
        }

        @Override
        public final java.lang.Object getCustomResponseBody() {
            return this.customResponseBody;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig getDataProtectionConfig() {
            return this.dataProtectionConfig;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.Object getRule() {
            return this.rule;
        }

        @Override
        public final java.lang.String getRuleJson() {
            return this.ruleJson;
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
        public final java.util.List<java.lang.String> getTokenDomains() {
            return this.tokenDomains;
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

            data.set("defaultAction", om.valueToTree(this.getDefaultAction()));
            data.set("scope", om.valueToTree(this.getScope()));
            data.set("visibilityConfig", om.valueToTree(this.getVisibilityConfig()));
            if (this.getAssociationConfig() != null) {
                data.set("associationConfig", om.valueToTree(this.getAssociationConfig()));
            }
            if (this.getCaptchaConfig() != null) {
                data.set("captchaConfig", om.valueToTree(this.getCaptchaConfig()));
            }
            if (this.getChallengeConfig() != null) {
                data.set("challengeConfig", om.valueToTree(this.getChallengeConfig()));
            }
            if (this.getCustomResponseBody() != null) {
                data.set("customResponseBody", om.valueToTree(this.getCustomResponseBody()));
            }
            if (this.getDataProtectionConfig() != null) {
                data.set("dataProtectionConfig", om.valueToTree(this.getDataProtectionConfig()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getRule() != null) {
                data.set("rule", om.valueToTree(this.getRule()));
            }
            if (this.getRuleJson() != null) {
                data.set("ruleJson", om.valueToTree(this.getRuleJson()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTokenDomains() != null) {
                data.set("tokenDomains", om.valueToTree(this.getTokenDomains()));
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
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclConfig.Jsii$Proxy that = (Wafv2WebAclConfig.Jsii$Proxy) o;

            if (!defaultAction.equals(that.defaultAction)) return false;
            if (!scope.equals(that.scope)) return false;
            if (!visibilityConfig.equals(that.visibilityConfig)) return false;
            if (this.associationConfig != null ? !this.associationConfig.equals(that.associationConfig) : that.associationConfig != null) return false;
            if (this.captchaConfig != null ? !this.captchaConfig.equals(that.captchaConfig) : that.captchaConfig != null) return false;
            if (this.challengeConfig != null ? !this.challengeConfig.equals(that.challengeConfig) : that.challengeConfig != null) return false;
            if (this.customResponseBody != null ? !this.customResponseBody.equals(that.customResponseBody) : that.customResponseBody != null) return false;
            if (this.dataProtectionConfig != null ? !this.dataProtectionConfig.equals(that.dataProtectionConfig) : that.dataProtectionConfig != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.rule != null ? !this.rule.equals(that.rule) : that.rule != null) return false;
            if (this.ruleJson != null ? !this.ruleJson.equals(that.ruleJson) : that.ruleJson != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tokenDomains != null ? !this.tokenDomains.equals(that.tokenDomains) : that.tokenDomains != null) return false;
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
            int result = this.defaultAction.hashCode();
            result = 31 * result + (this.scope.hashCode());
            result = 31 * result + (this.visibilityConfig.hashCode());
            result = 31 * result + (this.associationConfig != null ? this.associationConfig.hashCode() : 0);
            result = 31 * result + (this.captchaConfig != null ? this.captchaConfig.hashCode() : 0);
            result = 31 * result + (this.challengeConfig != null ? this.challengeConfig.hashCode() : 0);
            result = 31 * result + (this.customResponseBody != null ? this.customResponseBody.hashCode() : 0);
            result = 31 * result + (this.dataProtectionConfig != null ? this.dataProtectionConfig.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.rule != null ? this.rule.hashCode() : 0);
            result = 31 * result + (this.ruleJson != null ? this.ruleJson.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tokenDomains != null ? this.tokenDomains.hashCode() : 0);
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
