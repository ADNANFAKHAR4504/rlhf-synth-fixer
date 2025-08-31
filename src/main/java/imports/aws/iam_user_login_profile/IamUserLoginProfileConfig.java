package imports.aws.iam_user_login_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.344Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iamUserLoginProfile.IamUserLoginProfileConfig")
@software.amazon.jsii.Jsii.Proxy(IamUserLoginProfileConfig.Jsii$Proxy.class)
public interface IamUserLoginProfileConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#user IamUserLoginProfile#user}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUser();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#id IamUserLoginProfile#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#password_length IamUserLoginProfile#password_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPasswordLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#password_reset_required IamUserLoginProfile#password_reset_required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPasswordResetRequired() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#pgp_key IamUserLoginProfile#pgp_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPgpKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IamUserLoginProfileConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IamUserLoginProfileConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IamUserLoginProfileConfig> {
        java.lang.String user;
        java.lang.String id;
        java.lang.Number passwordLength;
        java.lang.Object passwordResetRequired;
        java.lang.String pgpKey;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getUser}
         * @param user Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#user IamUserLoginProfile#user}. This parameter is required.
         * @return {@code this}
         */
        public Builder user(java.lang.String user) {
            this.user = user;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#id IamUserLoginProfile#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getPasswordLength}
         * @param passwordLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#password_length IamUserLoginProfile#password_length}.
         * @return {@code this}
         */
        public Builder passwordLength(java.lang.Number passwordLength) {
            this.passwordLength = passwordLength;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getPasswordResetRequired}
         * @param passwordResetRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#password_reset_required IamUserLoginProfile#password_reset_required}.
         * @return {@code this}
         */
        public Builder passwordResetRequired(java.lang.Boolean passwordResetRequired) {
            this.passwordResetRequired = passwordResetRequired;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getPasswordResetRequired}
         * @param passwordResetRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#password_reset_required IamUserLoginProfile#password_reset_required}.
         * @return {@code this}
         */
        public Builder passwordResetRequired(com.hashicorp.cdktf.IResolvable passwordResetRequired) {
            this.passwordResetRequired = passwordResetRequired;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getPgpKey}
         * @param pgpKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_user_login_profile#pgp_key IamUserLoginProfile#pgp_key}.
         * @return {@code this}
         */
        public Builder pgpKey(java.lang.String pgpKey) {
            this.pgpKey = pgpKey;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getDependsOn}
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
         * Sets the value of {@link IamUserLoginProfileConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IamUserLoginProfileConfig#getProvisioners}
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
         * @return a new instance of {@link IamUserLoginProfileConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IamUserLoginProfileConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IamUserLoginProfileConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IamUserLoginProfileConfig {
        private final java.lang.String user;
        private final java.lang.String id;
        private final java.lang.Number passwordLength;
        private final java.lang.Object passwordResetRequired;
        private final java.lang.String pgpKey;
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
            this.user = software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passwordLength = software.amazon.jsii.Kernel.get(this, "passwordLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.passwordResetRequired = software.amazon.jsii.Kernel.get(this, "passwordResetRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.pgpKey = software.amazon.jsii.Kernel.get(this, "pgpKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.user = java.util.Objects.requireNonNull(builder.user, "user is required");
            this.id = builder.id;
            this.passwordLength = builder.passwordLength;
            this.passwordResetRequired = builder.passwordResetRequired;
            this.pgpKey = builder.pgpKey;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getUser() {
            return this.user;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getPasswordLength() {
            return this.passwordLength;
        }

        @Override
        public final java.lang.Object getPasswordResetRequired() {
            return this.passwordResetRequired;
        }

        @Override
        public final java.lang.String getPgpKey() {
            return this.pgpKey;
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

            data.set("user", om.valueToTree(this.getUser()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPasswordLength() != null) {
                data.set("passwordLength", om.valueToTree(this.getPasswordLength()));
            }
            if (this.getPasswordResetRequired() != null) {
                data.set("passwordResetRequired", om.valueToTree(this.getPasswordResetRequired()));
            }
            if (this.getPgpKey() != null) {
                data.set("pgpKey", om.valueToTree(this.getPgpKey()));
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
            struct.set("fqn", om.valueToTree("aws.iamUserLoginProfile.IamUserLoginProfileConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IamUserLoginProfileConfig.Jsii$Proxy that = (IamUserLoginProfileConfig.Jsii$Proxy) o;

            if (!user.equals(that.user)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.passwordLength != null ? !this.passwordLength.equals(that.passwordLength) : that.passwordLength != null) return false;
            if (this.passwordResetRequired != null ? !this.passwordResetRequired.equals(that.passwordResetRequired) : that.passwordResetRequired != null) return false;
            if (this.pgpKey != null ? !this.pgpKey.equals(that.pgpKey) : that.pgpKey != null) return false;
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
            int result = this.user.hashCode();
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.passwordLength != null ? this.passwordLength.hashCode() : 0);
            result = 31 * result + (this.passwordResetRequired != null ? this.passwordResetRequired.hashCode() : 0);
            result = 31 * result + (this.pgpKey != null ? this.pgpKey.hashCode() : 0);
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
