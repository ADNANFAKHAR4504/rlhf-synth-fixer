package imports.aws.data_aws_secretsmanager_random_password;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.849Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPasswordConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsSecretsmanagerRandomPasswordConfig.Jsii$Proxy.class)
public interface DataAwsSecretsmanagerRandomPasswordConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_characters DataAwsSecretsmanagerRandomPassword#exclude_characters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExcludeCharacters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeLowercase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludePunctuation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeUppercase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#id DataAwsSecretsmanagerRandomPassword#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSpace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#password_length DataAwsSecretsmanagerRandomPassword#password_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPasswordLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireEachIncludedType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsSecretsmanagerRandomPasswordConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsSecretsmanagerRandomPasswordConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsSecretsmanagerRandomPasswordConfig> {
        java.lang.String excludeCharacters;
        java.lang.Object excludeLowercase;
        java.lang.Object excludeNumbers;
        java.lang.Object excludePunctuation;
        java.lang.Object excludeUppercase;
        java.lang.String id;
        java.lang.Object includeSpace;
        java.lang.Number passwordLength;
        java.lang.Object requireEachIncludedType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeCharacters}
         * @param excludeCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_characters DataAwsSecretsmanagerRandomPassword#exclude_characters}.
         * @return {@code this}
         */
        public Builder excludeCharacters(java.lang.String excludeCharacters) {
            this.excludeCharacters = excludeCharacters;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeLowercase}
         * @param excludeLowercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}.
         * @return {@code this}
         */
        public Builder excludeLowercase(java.lang.Boolean excludeLowercase) {
            this.excludeLowercase = excludeLowercase;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeLowercase}
         * @param excludeLowercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}.
         * @return {@code this}
         */
        public Builder excludeLowercase(com.hashicorp.cdktf.IResolvable excludeLowercase) {
            this.excludeLowercase = excludeLowercase;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeNumbers}
         * @param excludeNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}.
         * @return {@code this}
         */
        public Builder excludeNumbers(java.lang.Boolean excludeNumbers) {
            this.excludeNumbers = excludeNumbers;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeNumbers}
         * @param excludeNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}.
         * @return {@code this}
         */
        public Builder excludeNumbers(com.hashicorp.cdktf.IResolvable excludeNumbers) {
            this.excludeNumbers = excludeNumbers;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludePunctuation}
         * @param excludePunctuation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}.
         * @return {@code this}
         */
        public Builder excludePunctuation(java.lang.Boolean excludePunctuation) {
            this.excludePunctuation = excludePunctuation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludePunctuation}
         * @param excludePunctuation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}.
         * @return {@code this}
         */
        public Builder excludePunctuation(com.hashicorp.cdktf.IResolvable excludePunctuation) {
            this.excludePunctuation = excludePunctuation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeUppercase}
         * @param excludeUppercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}.
         * @return {@code this}
         */
        public Builder excludeUppercase(java.lang.Boolean excludeUppercase) {
            this.excludeUppercase = excludeUppercase;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getExcludeUppercase}
         * @param excludeUppercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}.
         * @return {@code this}
         */
        public Builder excludeUppercase(com.hashicorp.cdktf.IResolvable excludeUppercase) {
            this.excludeUppercase = excludeUppercase;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#id DataAwsSecretsmanagerRandomPassword#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getIncludeSpace}
         * @param includeSpace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}.
         * @return {@code this}
         */
        public Builder includeSpace(java.lang.Boolean includeSpace) {
            this.includeSpace = includeSpace;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getIncludeSpace}
         * @param includeSpace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}.
         * @return {@code this}
         */
        public Builder includeSpace(com.hashicorp.cdktf.IResolvable includeSpace) {
            this.includeSpace = includeSpace;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getPasswordLength}
         * @param passwordLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#password_length DataAwsSecretsmanagerRandomPassword#password_length}.
         * @return {@code this}
         */
        public Builder passwordLength(java.lang.Number passwordLength) {
            this.passwordLength = passwordLength;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getRequireEachIncludedType}
         * @param requireEachIncludedType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}.
         * @return {@code this}
         */
        public Builder requireEachIncludedType(java.lang.Boolean requireEachIncludedType) {
            this.requireEachIncludedType = requireEachIncludedType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getRequireEachIncludedType}
         * @param requireEachIncludedType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}.
         * @return {@code this}
         */
        public Builder requireEachIncludedType(com.hashicorp.cdktf.IResolvable requireEachIncludedType) {
            this.requireEachIncludedType = requireEachIncludedType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSecretsmanagerRandomPasswordConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsSecretsmanagerRandomPasswordConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsSecretsmanagerRandomPasswordConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsSecretsmanagerRandomPasswordConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsSecretsmanagerRandomPasswordConfig {
        private final java.lang.String excludeCharacters;
        private final java.lang.Object excludeLowercase;
        private final java.lang.Object excludeNumbers;
        private final java.lang.Object excludePunctuation;
        private final java.lang.Object excludeUppercase;
        private final java.lang.String id;
        private final java.lang.Object includeSpace;
        private final java.lang.Number passwordLength;
        private final java.lang.Object requireEachIncludedType;
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
            this.excludeCharacters = software.amazon.jsii.Kernel.get(this, "excludeCharacters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludeLowercase = software.amazon.jsii.Kernel.get(this, "excludeLowercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.excludeNumbers = software.amazon.jsii.Kernel.get(this, "excludeNumbers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.excludePunctuation = software.amazon.jsii.Kernel.get(this, "excludePunctuation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.excludeUppercase = software.amazon.jsii.Kernel.get(this, "excludeUppercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeSpace = software.amazon.jsii.Kernel.get(this, "includeSpace", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.passwordLength = software.amazon.jsii.Kernel.get(this, "passwordLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.requireEachIncludedType = software.amazon.jsii.Kernel.get(this, "requireEachIncludedType", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.excludeCharacters = builder.excludeCharacters;
            this.excludeLowercase = builder.excludeLowercase;
            this.excludeNumbers = builder.excludeNumbers;
            this.excludePunctuation = builder.excludePunctuation;
            this.excludeUppercase = builder.excludeUppercase;
            this.id = builder.id;
            this.includeSpace = builder.includeSpace;
            this.passwordLength = builder.passwordLength;
            this.requireEachIncludedType = builder.requireEachIncludedType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getExcludeCharacters() {
            return this.excludeCharacters;
        }

        @Override
        public final java.lang.Object getExcludeLowercase() {
            return this.excludeLowercase;
        }

        @Override
        public final java.lang.Object getExcludeNumbers() {
            return this.excludeNumbers;
        }

        @Override
        public final java.lang.Object getExcludePunctuation() {
            return this.excludePunctuation;
        }

        @Override
        public final java.lang.Object getExcludeUppercase() {
            return this.excludeUppercase;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeSpace() {
            return this.includeSpace;
        }

        @Override
        public final java.lang.Number getPasswordLength() {
            return this.passwordLength;
        }

        @Override
        public final java.lang.Object getRequireEachIncludedType() {
            return this.requireEachIncludedType;
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

            if (this.getExcludeCharacters() != null) {
                data.set("excludeCharacters", om.valueToTree(this.getExcludeCharacters()));
            }
            if (this.getExcludeLowercase() != null) {
                data.set("excludeLowercase", om.valueToTree(this.getExcludeLowercase()));
            }
            if (this.getExcludeNumbers() != null) {
                data.set("excludeNumbers", om.valueToTree(this.getExcludeNumbers()));
            }
            if (this.getExcludePunctuation() != null) {
                data.set("excludePunctuation", om.valueToTree(this.getExcludePunctuation()));
            }
            if (this.getExcludeUppercase() != null) {
                data.set("excludeUppercase", om.valueToTree(this.getExcludeUppercase()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeSpace() != null) {
                data.set("includeSpace", om.valueToTree(this.getIncludeSpace()));
            }
            if (this.getPasswordLength() != null) {
                data.set("passwordLength", om.valueToTree(this.getPasswordLength()));
            }
            if (this.getRequireEachIncludedType() != null) {
                data.set("requireEachIncludedType", om.valueToTree(this.getRequireEachIncludedType()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPasswordConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsSecretsmanagerRandomPasswordConfig.Jsii$Proxy that = (DataAwsSecretsmanagerRandomPasswordConfig.Jsii$Proxy) o;

            if (this.excludeCharacters != null ? !this.excludeCharacters.equals(that.excludeCharacters) : that.excludeCharacters != null) return false;
            if (this.excludeLowercase != null ? !this.excludeLowercase.equals(that.excludeLowercase) : that.excludeLowercase != null) return false;
            if (this.excludeNumbers != null ? !this.excludeNumbers.equals(that.excludeNumbers) : that.excludeNumbers != null) return false;
            if (this.excludePunctuation != null ? !this.excludePunctuation.equals(that.excludePunctuation) : that.excludePunctuation != null) return false;
            if (this.excludeUppercase != null ? !this.excludeUppercase.equals(that.excludeUppercase) : that.excludeUppercase != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeSpace != null ? !this.includeSpace.equals(that.includeSpace) : that.includeSpace != null) return false;
            if (this.passwordLength != null ? !this.passwordLength.equals(that.passwordLength) : that.passwordLength != null) return false;
            if (this.requireEachIncludedType != null ? !this.requireEachIncludedType.equals(that.requireEachIncludedType) : that.requireEachIncludedType != null) return false;
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
            int result = this.excludeCharacters != null ? this.excludeCharacters.hashCode() : 0;
            result = 31 * result + (this.excludeLowercase != null ? this.excludeLowercase.hashCode() : 0);
            result = 31 * result + (this.excludeNumbers != null ? this.excludeNumbers.hashCode() : 0);
            result = 31 * result + (this.excludePunctuation != null ? this.excludePunctuation.hashCode() : 0);
            result = 31 * result + (this.excludeUppercase != null ? this.excludeUppercase.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeSpace != null ? this.includeSpace.hashCode() : 0);
            result = 31 * result + (this.passwordLength != null ? this.passwordLength.hashCode() : 0);
            result = 31 * result + (this.requireEachIncludedType != null ? this.requireEachIncludedType.hashCode() : 0);
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
