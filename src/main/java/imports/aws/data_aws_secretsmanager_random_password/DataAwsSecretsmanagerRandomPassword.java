package imports.aws.data_aws_secretsmanager_random_password;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password aws_secretsmanager_random_password}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.849Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword")
public class DataAwsSecretsmanagerRandomPassword extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsSecretsmanagerRandomPassword(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsSecretsmanagerRandomPassword(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password aws_secretsmanager_random_password} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsSecretsmanagerRandomPassword(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPasswordConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password aws_secretsmanager_random_password} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsSecretsmanagerRandomPassword(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsSecretsmanagerRandomPassword resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsSecretsmanagerRandomPassword to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsSecretsmanagerRandomPassword that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsSecretsmanagerRandomPassword to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsSecretsmanagerRandomPassword resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsSecretsmanagerRandomPassword to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsSecretsmanagerRandomPassword that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetExcludeCharacters() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeCharacters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludeLowercase() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeLowercase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludeNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludePunctuation() {
        software.amazon.jsii.Kernel.call(this, "resetExcludePunctuation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludeUppercase() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeUppercase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeSpace() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeSpace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPasswordLength() {
        software.amazon.jsii.Kernel.call(this, "resetPasswordLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireEachIncludedType() {
        software.amazon.jsii.Kernel.call(this, "resetRequireEachIncludedType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getRandomPassword() {
        return software.amazon.jsii.Kernel.get(this, "randomPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExcludeCharactersInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeCharactersInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeLowercaseInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeLowercaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeNumbersInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeNumbersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludePunctuationInput() {
        return software.amazon.jsii.Kernel.get(this, "excludePunctuationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeUppercaseInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeUppercaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSpaceInput() {
        return software.amazon.jsii.Kernel.get(this, "includeSpaceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPasswordLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "passwordLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireEachIncludedTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "requireEachIncludedTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExcludeCharacters() {
        return software.amazon.jsii.Kernel.get(this, "excludeCharacters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExcludeCharacters(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "excludeCharacters", java.util.Objects.requireNonNull(value, "excludeCharacters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeLowercase() {
        return software.amazon.jsii.Kernel.get(this, "excludeLowercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeLowercase(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeLowercase", java.util.Objects.requireNonNull(value, "excludeLowercase is required"));
    }

    public void setExcludeLowercase(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeLowercase", java.util.Objects.requireNonNull(value, "excludeLowercase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeNumbers() {
        return software.amazon.jsii.Kernel.get(this, "excludeNumbers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeNumbers(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeNumbers", java.util.Objects.requireNonNull(value, "excludeNumbers is required"));
    }

    public void setExcludeNumbers(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeNumbers", java.util.Objects.requireNonNull(value, "excludeNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludePunctuation() {
        return software.amazon.jsii.Kernel.get(this, "excludePunctuation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludePunctuation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludePunctuation", java.util.Objects.requireNonNull(value, "excludePunctuation is required"));
    }

    public void setExcludePunctuation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludePunctuation", java.util.Objects.requireNonNull(value, "excludePunctuation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeUppercase() {
        return software.amazon.jsii.Kernel.get(this, "excludeUppercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeUppercase(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeUppercase", java.util.Objects.requireNonNull(value, "excludeUppercase is required"));
    }

    public void setExcludeUppercase(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeUppercase", java.util.Objects.requireNonNull(value, "excludeUppercase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeSpace() {
        return software.amazon.jsii.Kernel.get(this, "includeSpace", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeSpace(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeSpace", java.util.Objects.requireNonNull(value, "includeSpace is required"));
    }

    public void setIncludeSpace(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeSpace", java.util.Objects.requireNonNull(value, "includeSpace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPasswordLength() {
        return software.amazon.jsii.Kernel.get(this, "passwordLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPasswordLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "passwordLength", java.util.Objects.requireNonNull(value, "passwordLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireEachIncludedType() {
        return software.amazon.jsii.Kernel.get(this, "requireEachIncludedType", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireEachIncludedType(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireEachIncludedType", java.util.Objects.requireNonNull(value, "requireEachIncludedType is required"));
    }

    public void setRequireEachIncludedType(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireEachIncludedType", java.util.Objects.requireNonNull(value, "requireEachIncludedType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword> {
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
        private imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPasswordConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_characters DataAwsSecretsmanagerRandomPassword#exclude_characters}.
         * <p>
         * @return {@code this}
         * @param excludeCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_characters DataAwsSecretsmanagerRandomPassword#exclude_characters}. This parameter is required.
         */
        public Builder excludeCharacters(final java.lang.String excludeCharacters) {
            this.config().excludeCharacters(excludeCharacters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}.
         * <p>
         * @return {@code this}
         * @param excludeLowercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}. This parameter is required.
         */
        public Builder excludeLowercase(final java.lang.Boolean excludeLowercase) {
            this.config().excludeLowercase(excludeLowercase);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}.
         * <p>
         * @return {@code this}
         * @param excludeLowercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_lowercase DataAwsSecretsmanagerRandomPassword#exclude_lowercase}. This parameter is required.
         */
        public Builder excludeLowercase(final com.hashicorp.cdktf.IResolvable excludeLowercase) {
            this.config().excludeLowercase(excludeLowercase);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}.
         * <p>
         * @return {@code this}
         * @param excludeNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}. This parameter is required.
         */
        public Builder excludeNumbers(final java.lang.Boolean excludeNumbers) {
            this.config().excludeNumbers(excludeNumbers);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}.
         * <p>
         * @return {@code this}
         * @param excludeNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_numbers DataAwsSecretsmanagerRandomPassword#exclude_numbers}. This parameter is required.
         */
        public Builder excludeNumbers(final com.hashicorp.cdktf.IResolvable excludeNumbers) {
            this.config().excludeNumbers(excludeNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}.
         * <p>
         * @return {@code this}
         * @param excludePunctuation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}. This parameter is required.
         */
        public Builder excludePunctuation(final java.lang.Boolean excludePunctuation) {
            this.config().excludePunctuation(excludePunctuation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}.
         * <p>
         * @return {@code this}
         * @param excludePunctuation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_punctuation DataAwsSecretsmanagerRandomPassword#exclude_punctuation}. This parameter is required.
         */
        public Builder excludePunctuation(final com.hashicorp.cdktf.IResolvable excludePunctuation) {
            this.config().excludePunctuation(excludePunctuation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}.
         * <p>
         * @return {@code this}
         * @param excludeUppercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}. This parameter is required.
         */
        public Builder excludeUppercase(final java.lang.Boolean excludeUppercase) {
            this.config().excludeUppercase(excludeUppercase);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}.
         * <p>
         * @return {@code this}
         * @param excludeUppercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#exclude_uppercase DataAwsSecretsmanagerRandomPassword#exclude_uppercase}. This parameter is required.
         */
        public Builder excludeUppercase(final com.hashicorp.cdktf.IResolvable excludeUppercase) {
            this.config().excludeUppercase(excludeUppercase);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#id DataAwsSecretsmanagerRandomPassword#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#id DataAwsSecretsmanagerRandomPassword#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}.
         * <p>
         * @return {@code this}
         * @param includeSpace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}. This parameter is required.
         */
        public Builder includeSpace(final java.lang.Boolean includeSpace) {
            this.config().includeSpace(includeSpace);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}.
         * <p>
         * @return {@code this}
         * @param includeSpace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#include_space DataAwsSecretsmanagerRandomPassword#include_space}. This parameter is required.
         */
        public Builder includeSpace(final com.hashicorp.cdktf.IResolvable includeSpace) {
            this.config().includeSpace(includeSpace);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#password_length DataAwsSecretsmanagerRandomPassword#password_length}.
         * <p>
         * @return {@code this}
         * @param passwordLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#password_length DataAwsSecretsmanagerRandomPassword#password_length}. This parameter is required.
         */
        public Builder passwordLength(final java.lang.Number passwordLength) {
            this.config().passwordLength(passwordLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}.
         * <p>
         * @return {@code this}
         * @param requireEachIncludedType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}. This parameter is required.
         */
        public Builder requireEachIncludedType(final java.lang.Boolean requireEachIncludedType) {
            this.config().requireEachIncludedType(requireEachIncludedType);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}.
         * <p>
         * @return {@code this}
         * @param requireEachIncludedType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/secretsmanager_random_password#require_each_included_type DataAwsSecretsmanagerRandomPassword#require_each_included_type}. This parameter is required.
         */
        public Builder requireEachIncludedType(final com.hashicorp.cdktf.IResolvable requireEachIncludedType) {
            this.config().requireEachIncludedType(requireEachIncludedType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword}.
         */
        @Override
        public imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword build() {
            return new imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPassword(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPasswordConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_secretsmanager_random_password.DataAwsSecretsmanagerRandomPasswordConfig.Builder();
            }
            return this.config;
        }
    }
}
