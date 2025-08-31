package imports.aws.iam_account_password_policy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy aws_iam_account_password_policy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.327Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iamAccountPasswordPolicy.IamAccountPasswordPolicy")
public class IamAccountPasswordPolicy extends com.hashicorp.cdktf.TerraformResource {

    protected IamAccountPasswordPolicy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IamAccountPasswordPolicy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.iam_account_password_policy.IamAccountPasswordPolicy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy aws_iam_account_password_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public IamAccountPasswordPolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.iam_account_password_policy.IamAccountPasswordPolicyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy aws_iam_account_password_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public IamAccountPasswordPolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a IamAccountPasswordPolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IamAccountPasswordPolicy to import. This parameter is required.
     * @param importFromId The id of the existing IamAccountPasswordPolicy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the IamAccountPasswordPolicy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.iam_account_password_policy.IamAccountPasswordPolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a IamAccountPasswordPolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IamAccountPasswordPolicy to import. This parameter is required.
     * @param importFromId The id of the existing IamAccountPasswordPolicy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.iam_account_password_policy.IamAccountPasswordPolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAllowUsersToChangePassword() {
        software.amazon.jsii.Kernel.call(this, "resetAllowUsersToChangePassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHardExpiry() {
        software.amazon.jsii.Kernel.call(this, "resetHardExpiry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxPasswordAge() {
        software.amazon.jsii.Kernel.call(this, "resetMaxPasswordAge", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumPasswordLength() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumPasswordLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPasswordReusePrevention() {
        software.amazon.jsii.Kernel.call(this, "resetPasswordReusePrevention", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireLowercaseCharacters() {
        software.amazon.jsii.Kernel.call(this, "resetRequireLowercaseCharacters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetRequireNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireSymbols() {
        software.amazon.jsii.Kernel.call(this, "resetRequireSymbols", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireUppercaseCharacters() {
        software.amazon.jsii.Kernel.call(this, "resetRequireUppercaseCharacters", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getExpirePasswords() {
        return software.amazon.jsii.Kernel.get(this, "expirePasswords", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowUsersToChangePasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "allowUsersToChangePasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHardExpiryInput() {
        return software.amazon.jsii.Kernel.get(this, "hardExpiryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxPasswordAgeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxPasswordAgeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumPasswordLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumPasswordLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPasswordReusePreventionInput() {
        return software.amazon.jsii.Kernel.get(this, "passwordReusePreventionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireLowercaseCharactersInput() {
        return software.amazon.jsii.Kernel.get(this, "requireLowercaseCharactersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireNumbersInput() {
        return software.amazon.jsii.Kernel.get(this, "requireNumbersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireSymbolsInput() {
        return software.amazon.jsii.Kernel.get(this, "requireSymbolsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireUppercaseCharactersInput() {
        return software.amazon.jsii.Kernel.get(this, "requireUppercaseCharactersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowUsersToChangePassword() {
        return software.amazon.jsii.Kernel.get(this, "allowUsersToChangePassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowUsersToChangePassword(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowUsersToChangePassword", java.util.Objects.requireNonNull(value, "allowUsersToChangePassword is required"));
    }

    public void setAllowUsersToChangePassword(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowUsersToChangePassword", java.util.Objects.requireNonNull(value, "allowUsersToChangePassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHardExpiry() {
        return software.amazon.jsii.Kernel.get(this, "hardExpiry", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHardExpiry(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "hardExpiry", java.util.Objects.requireNonNull(value, "hardExpiry is required"));
    }

    public void setHardExpiry(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "hardExpiry", java.util.Objects.requireNonNull(value, "hardExpiry is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxPasswordAge() {
        return software.amazon.jsii.Kernel.get(this, "maxPasswordAge", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxPasswordAge(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxPasswordAge", java.util.Objects.requireNonNull(value, "maxPasswordAge is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumPasswordLength() {
        return software.amazon.jsii.Kernel.get(this, "minimumPasswordLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumPasswordLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumPasswordLength", java.util.Objects.requireNonNull(value, "minimumPasswordLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPasswordReusePrevention() {
        return software.amazon.jsii.Kernel.get(this, "passwordReusePrevention", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPasswordReusePrevention(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "passwordReusePrevention", java.util.Objects.requireNonNull(value, "passwordReusePrevention is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireLowercaseCharacters() {
        return software.amazon.jsii.Kernel.get(this, "requireLowercaseCharacters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireLowercaseCharacters(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireLowercaseCharacters", java.util.Objects.requireNonNull(value, "requireLowercaseCharacters is required"));
    }

    public void setRequireLowercaseCharacters(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireLowercaseCharacters", java.util.Objects.requireNonNull(value, "requireLowercaseCharacters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireNumbers() {
        return software.amazon.jsii.Kernel.get(this, "requireNumbers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireNumbers(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireNumbers", java.util.Objects.requireNonNull(value, "requireNumbers is required"));
    }

    public void setRequireNumbers(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireNumbers", java.util.Objects.requireNonNull(value, "requireNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireSymbols() {
        return software.amazon.jsii.Kernel.get(this, "requireSymbols", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireSymbols(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireSymbols", java.util.Objects.requireNonNull(value, "requireSymbols is required"));
    }

    public void setRequireSymbols(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireSymbols", java.util.Objects.requireNonNull(value, "requireSymbols is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireUppercaseCharacters() {
        return software.amazon.jsii.Kernel.get(this, "requireUppercaseCharacters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireUppercaseCharacters(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireUppercaseCharacters", java.util.Objects.requireNonNull(value, "requireUppercaseCharacters is required"));
    }

    public void setRequireUppercaseCharacters(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireUppercaseCharacters", java.util.Objects.requireNonNull(value, "requireUppercaseCharacters is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.iam_account_password_policy.IamAccountPasswordPolicy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.iam_account_password_policy.IamAccountPasswordPolicy> {
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
        private imports.aws.iam_account_password_policy.IamAccountPasswordPolicyConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}.
         * <p>
         * @return {@code this}
         * @param allowUsersToChangePassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}. This parameter is required.
         */
        public Builder allowUsersToChangePassword(final java.lang.Boolean allowUsersToChangePassword) {
            this.config().allowUsersToChangePassword(allowUsersToChangePassword);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}.
         * <p>
         * @return {@code this}
         * @param allowUsersToChangePassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#allow_users_to_change_password IamAccountPasswordPolicy#allow_users_to_change_password}. This parameter is required.
         */
        public Builder allowUsersToChangePassword(final com.hashicorp.cdktf.IResolvable allowUsersToChangePassword) {
            this.config().allowUsersToChangePassword(allowUsersToChangePassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}.
         * <p>
         * @return {@code this}
         * @param hardExpiry Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}. This parameter is required.
         */
        public Builder hardExpiry(final java.lang.Boolean hardExpiry) {
            this.config().hardExpiry(hardExpiry);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}.
         * <p>
         * @return {@code this}
         * @param hardExpiry Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#hard_expiry IamAccountPasswordPolicy#hard_expiry}. This parameter is required.
         */
        public Builder hardExpiry(final com.hashicorp.cdktf.IResolvable hardExpiry) {
            this.config().hardExpiry(hardExpiry);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#id IamAccountPasswordPolicy#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#id IamAccountPasswordPolicy#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#max_password_age IamAccountPasswordPolicy#max_password_age}.
         * <p>
         * @return {@code this}
         * @param maxPasswordAge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#max_password_age IamAccountPasswordPolicy#max_password_age}. This parameter is required.
         */
        public Builder maxPasswordAge(final java.lang.Number maxPasswordAge) {
            this.config().maxPasswordAge(maxPasswordAge);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#minimum_password_length IamAccountPasswordPolicy#minimum_password_length}.
         * <p>
         * @return {@code this}
         * @param minimumPasswordLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#minimum_password_length IamAccountPasswordPolicy#minimum_password_length}. This parameter is required.
         */
        public Builder minimumPasswordLength(final java.lang.Number minimumPasswordLength) {
            this.config().minimumPasswordLength(minimumPasswordLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#password_reuse_prevention IamAccountPasswordPolicy#password_reuse_prevention}.
         * <p>
         * @return {@code this}
         * @param passwordReusePrevention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#password_reuse_prevention IamAccountPasswordPolicy#password_reuse_prevention}. This parameter is required.
         */
        public Builder passwordReusePrevention(final java.lang.Number passwordReusePrevention) {
            this.config().passwordReusePrevention(passwordReusePrevention);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}.
         * <p>
         * @return {@code this}
         * @param requireLowercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}. This parameter is required.
         */
        public Builder requireLowercaseCharacters(final java.lang.Boolean requireLowercaseCharacters) {
            this.config().requireLowercaseCharacters(requireLowercaseCharacters);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}.
         * <p>
         * @return {@code this}
         * @param requireLowercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_lowercase_characters IamAccountPasswordPolicy#require_lowercase_characters}. This parameter is required.
         */
        public Builder requireLowercaseCharacters(final com.hashicorp.cdktf.IResolvable requireLowercaseCharacters) {
            this.config().requireLowercaseCharacters(requireLowercaseCharacters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}.
         * <p>
         * @return {@code this}
         * @param requireNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}. This parameter is required.
         */
        public Builder requireNumbers(final java.lang.Boolean requireNumbers) {
            this.config().requireNumbers(requireNumbers);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}.
         * <p>
         * @return {@code this}
         * @param requireNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_numbers IamAccountPasswordPolicy#require_numbers}. This parameter is required.
         */
        public Builder requireNumbers(final com.hashicorp.cdktf.IResolvable requireNumbers) {
            this.config().requireNumbers(requireNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}.
         * <p>
         * @return {@code this}
         * @param requireSymbols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}. This parameter is required.
         */
        public Builder requireSymbols(final java.lang.Boolean requireSymbols) {
            this.config().requireSymbols(requireSymbols);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}.
         * <p>
         * @return {@code this}
         * @param requireSymbols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_symbols IamAccountPasswordPolicy#require_symbols}. This parameter is required.
         */
        public Builder requireSymbols(final com.hashicorp.cdktf.IResolvable requireSymbols) {
            this.config().requireSymbols(requireSymbols);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}.
         * <p>
         * @return {@code this}
         * @param requireUppercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}. This parameter is required.
         */
        public Builder requireUppercaseCharacters(final java.lang.Boolean requireUppercaseCharacters) {
            this.config().requireUppercaseCharacters(requireUppercaseCharacters);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}.
         * <p>
         * @return {@code this}
         * @param requireUppercaseCharacters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_account_password_policy#require_uppercase_characters IamAccountPasswordPolicy#require_uppercase_characters}. This parameter is required.
         */
        public Builder requireUppercaseCharacters(final com.hashicorp.cdktf.IResolvable requireUppercaseCharacters) {
            this.config().requireUppercaseCharacters(requireUppercaseCharacters);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.iam_account_password_policy.IamAccountPasswordPolicy}.
         */
        @Override
        public imports.aws.iam_account_password_policy.IamAccountPasswordPolicy build() {
            return new imports.aws.iam_account_password_policy.IamAccountPasswordPolicy(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.iam_account_password_policy.IamAccountPasswordPolicyConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.iam_account_password_policy.IamAccountPasswordPolicyConfig.Builder();
            }
            return this.config;
        }
    }
}
