package imports.aws.iam_account_password_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iamAccountPasswordPolicy.IamAccountPasswordPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(IamAccountPasswordPolicyConfig.Jsii$Proxy.class)
public interface IamAccountPasswordPolicyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowUsersToChangePassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHardExpiry() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#id IamAccountPasswordPolicy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#max_password_age IamAccountPasswordPolicy#max_password_age}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxPasswordAge() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#minimum_password_length IamAccountPasswordPolicy#minimum_password_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumPasswordLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#password_reuse_prevention IamAccountPasswordPolicy#password_reuse_prevention}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPasswordReusePrevention() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireLowercaseCharacters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireSymbols() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireUppercaseCharacters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IamAccountPasswordPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IamAccountPasswordPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IamAccountPasswordPolicyConfig> {
        java.lang.Object allowUsersToChangePassword;
        java.lang.Object hardExpiry;
        java.lang.String id;
        java.lang.Number maxPasswordAge;
        java.lang.Number minimumPasswordLength;
        java.lang.Number passwordReusePrevention;
        java.lang.Object requireLowercaseCharacters;
        java.lang.Object requireNumbers;
        java.lang.Object requireSymbols;
        java.lang.Object requireUppercaseCharacters;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getAllowUsersToChangePassword}
         * @param allowUsersToChangePassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}.
         * @return {@code this}
         */
        public Builder allowUsersToChangePassword(java.lang.Boolean allowUsersToChangePassword) {
            this.allowUsersToChangePassword = allowUsersToChangePassword;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getAllowUsersToChangePassword}
         * @param allowUsersToChangePassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}.
         * @return {@code this}
         */
        public Builder allowUsersToChangePassword(com.hashicorp.cdktf.IResolvable allowUsersToChangePassword) {
            this.allowUsersToChangePassword = allowUsersToChangePassword;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getHardExpiry}
         * @param hardExpiry Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}.
         * @return {@code this}
         */
        public Builder hardExpiry(java.lang.Boolean hardExpiry) {
            this.hardExpiry = hardExpiry;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getHardExpiry}
         * @param hardExpiry Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}.
         * @return {@code this}
         */
        public Builder hardExpiry(com.hashicorp.cdktf.IResolvable hardExpiry) {
            this.hardExpiry = hardExpiry;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#id IamAccountPasswordPolicy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getMaxPasswordAge}
         * @param maxPasswordAge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#max_password_age IamAccountPasswordPolicy#max_password_age}.
         * @return {@code this}
         */
        public Builder maxPasswordAge(java.lang.Number maxPasswordAge) {
            this.maxPasswordAge = maxPasswordAge;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getMinimumPasswordLength}
         * @param minimumPasswordLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#minimum_password_length IamAccountPasswordPolicy#minimum_password_length}.
         * @return {@code this}
         */
        public Builder minimumPasswordLength(java.lang.Number minimumPasswordLength) {
            this.minimumPasswordLength = minimumPasswordLength;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getPasswordReusePrevention}
         * @param passwordReusePrevention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#password_reuse_prevention IamAccountPasswordPolicy#password_reuse_prevention}.
         * @return {@code this}
         */
        public Builder passwordReusePrevention(java.lang.Number passwordReusePrevention) {
            this.passwordReusePrevention = passwordReusePrevention;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireLowercaseCharacters}
         * @param requireLowercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}.
         * @return {@code this}
         */
        public Builder requireLowercaseCharacters(java.lang.Boolean requireLowercaseCharacters) {
            this.requireLowercaseCharacters = requireLowercaseCharacters;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireLowercaseCharacters}
         * @param requireLowercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}.
         * @return {@code this}
         */
        public Builder requireLowercaseCharacters(com.hashicorp.cdktf.IResolvable requireLowercaseCharacters) {
            this.requireLowercaseCharacters = requireLowercaseCharacters;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireNumbers}
         * @param requireNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}.
         * @return {@code this}
         */
        public Builder requireNumbers(java.lang.Boolean requireNumbers) {
            this.requireNumbers = requireNumbers;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireNumbers}
         * @param requireNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}.
         * @return {@code this}
         */
        public Builder requireNumbers(com.hashicorp.cdktf.IResolvable requireNumbers) {
            this.requireNumbers = requireNumbers;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireSymbols}
         * @param requireSymbols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}.
         * @return {@code this}
         */
        public Builder requireSymbols(java.lang.Boolean requireSymbols) {
            this.requireSymbols = requireSymbols;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireSymbols}
         * @param requireSymbols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}.
         * @return {@code this}
         */
        public Builder requireSymbols(com.hashicorp.cdktf.IResolvable requireSymbols) {
            this.requireSymbols = requireSymbols;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireUppercaseCharacters}
         * @param requireUppercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}.
         * @return {@code this}
         */
        public Builder requireUppercaseCharacters(java.lang.Boolean requireUppercaseCharacters) {
            this.requireUppercaseCharacters = requireUppercaseCharacters;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getRequireUppercaseCharacters}
         * @param requireUppercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}.
         * @return {@code this}
         */
        public Builder requireUppercaseCharacters(com.hashicorp.cdktf.IResolvable requireUppercaseCharacters) {
            this.requireUppercaseCharacters = requireUppercaseCharacters;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getDependsOn}
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
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IamAccountPasswordPolicyConfig#getProvisioners}
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
         * @return a new instance of {@link IamAccountPasswordPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IamAccountPasswordPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IamAccountPasswordPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IamAccountPasswordPolicyConfig {
        private final java.lang.Object allowUsersToChangePassword;
        private final java.lang.Object hardExpiry;
        private final java.lang.String id;
        private final java.lang.Number maxPasswordAge;
        private final java.lang.Number minimumPasswordLength;
        private final java.lang.Number passwordReusePrevention;
        private final java.lang.Object requireLowercaseCharacters;
        private final java.lang.Object requireNumbers;
        private final java.lang.Object requireSymbols;
        private final java.lang.Object requireUppercaseCharacters;
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
            this.allowUsersToChangePassword = software.amazon.jsii.Kernel.get(this, "allowUsersToChangePassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hardExpiry = software.amazon.jsii.Kernel.get(this, "hardExpiry", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxPasswordAge = software.amazon.jsii.Kernel.get(this, "maxPasswordAge", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumPasswordLength = software.amazon.jsii.Kernel.get(this, "minimumPasswordLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.passwordReusePrevention = software.amazon.jsii.Kernel.get(this, "passwordReusePrevention", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.requireLowercaseCharacters = software.amazon.jsii.Kernel.get(this, "requireLowercaseCharacters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireNumbers = software.amazon.jsii.Kernel.get(this, "requireNumbers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireSymbols = software.amazon.jsii.Kernel.get(this, "requireSymbols", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireUppercaseCharacters = software.amazon.jsii.Kernel.get(this, "requireUppercaseCharacters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.allowUsersToChangePassword = builder.allowUsersToChangePassword;
            this.hardExpiry = builder.hardExpiry;
            this.id = builder.id;
            this.maxPasswordAge = builder.maxPasswordAge;
            this.minimumPasswordLength = builder.minimumPasswordLength;
            this.passwordReusePrevention = builder.passwordReusePrevention;
            this.requireLowercaseCharacters = builder.requireLowercaseCharacters;
            this.requireNumbers = builder.requireNumbers;
            this.requireSymbols = builder.requireSymbols;
            this.requireUppercaseCharacters = builder.requireUppercaseCharacters;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getAllowUsersToChangePassword() {
            return this.allowUsersToChangePassword;
        }

        @Override
        public final java.lang.Object getHardExpiry() {
            return this.hardExpiry;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaxPasswordAge() {
            return this.maxPasswordAge;
        }

        @Override
        public final java.lang.Number getMinimumPasswordLength() {
            return this.minimumPasswordLength;
        }

        @Override
        public final java.lang.Number getPasswordReusePrevention() {
            return this.passwordReusePrevention;
        }

        @Override
        public final java.lang.Object getRequireLowercaseCharacters() {
            return this.requireLowercaseCharacters;
        }

        @Override
        public final java.lang.Object getRequireNumbers() {
            return this.requireNumbers;
        }

        @Override
        public final java.lang.Object getRequireSymbols() {
            return this.requireSymbols;
        }

        @Override
        public final java.lang.Object getRequireUppercaseCharacters() {
            return this.requireUppercaseCharacters;
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

            if (this.getAllowUsersToChangePassword() != null) {
                data.set("allowUsersToChangePassword", om.valueToTree(this.getAllowUsersToChangePassword()));
            }
            if (this.getHardExpiry() != null) {
                data.set("hardExpiry", om.valueToTree(this.getHardExpiry()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaxPasswordAge() != null) {
                data.set("maxPasswordAge", om.valueToTree(this.getMaxPasswordAge()));
            }
            if (this.getMinimumPasswordLength() != null) {
                data.set("minimumPasswordLength", om.valueToTree(this.getMinimumPasswordLength()));
            }
            if (this.getPasswordReusePrevention() != null) {
                data.set("passwordReusePrevention", om.valueToTree(this.getPasswordReusePrevention()));
            }
            if (this.getRequireLowercaseCharacters() != null) {
                data.set("requireLowercaseCharacters", om.valueToTree(this.getRequireLowercaseCharacters()));
            }
            if (this.getRequireNumbers() != null) {
                data.set("requireNumbers", om.valueToTree(this.getRequireNumbers()));
            }
            if (this.getRequireSymbols() != null) {
                data.set("requireSymbols", om.valueToTree(this.getRequireSymbols()));
            }
            if (this.getRequireUppercaseCharacters() != null) {
                data.set("requireUppercaseCharacters", om.valueToTree(this.getRequireUppercaseCharacters()));
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
            struct.set("fqn", om.valueToTree("aws.iamAccountPasswordPolicy.IamAccountPasswordPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IamAccountPasswordPolicyConfig.Jsii$Proxy that = (IamAccountPasswordPolicyConfig.Jsii$Proxy) o;

            if (this.allowUsersToChangePassword != null ? !this.allowUsersToChangePassword.equals(that.allowUsersToChangePassword) : that.allowUsersToChangePassword != null) return false;
            if (this.hardExpiry != null ? !this.hardExpiry.equals(that.hardExpiry) : that.hardExpiry != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maxPasswordAge != null ? !this.maxPasswordAge.equals(that.maxPasswordAge) : that.maxPasswordAge != null) return false;
            if (this.minimumPasswordLength != null ? !this.minimumPasswordLength.equals(that.minimumPasswordLength) : that.minimumPasswordLength != null) return false;
            if (this.passwordReusePrevention != null ? !this.passwordReusePrevention.equals(that.passwordReusePrevention) : that.passwordReusePrevention != null) return false;
            if (this.requireLowercaseCharacters != null ? !this.requireLowercaseCharacters.equals(that.requireLowercaseCharacters) : that.requireLowercaseCharacters != null) return false;
            if (this.requireNumbers != null ? !this.requireNumbers.equals(that.requireNumbers) : that.requireNumbers != null) return false;
            if (this.requireSymbols != null ? !this.requireSymbols.equals(that.requireSymbols) : that.requireSymbols != null) return false;
            if (this.requireUppercaseCharacters != null ? !this.requireUppercaseCharacters.equals(that.requireUppercaseCharacters) : that.requireUppercaseCharacters != null) return false;
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
            int result = this.allowUsersToChangePassword != null ? this.allowUsersToChangePassword.hashCode() : 0;
            result = 31 * result + (this.hardExpiry != null ? this.hardExpiry.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maxPasswordAge != null ? this.maxPasswordAge.hashCode() : 0);
            result = 31 * result + (this.minimumPasswordLength != null ? this.minimumPasswordLength.hashCode() : 0);
            result = 31 * result + (this.passwordReusePrevention != null ? this.passwordReusePrevention.hashCode() : 0);
            result = 31 * result + (this.requireLowercaseCharacters != null ? this.requireLowercaseCharacters.hashCode() : 0);
            result = 31 * result + (this.requireNumbers != null ? this.requireNumbers.hashCode() : 0);
            result = 31 * result + (this.requireSymbols != null ? this.requireSymbols.hashCode() : 0);
            result = 31 * result + (this.requireUppercaseCharacters != null ? this.requireUppercaseCharacters.hashCode() : 0);
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
