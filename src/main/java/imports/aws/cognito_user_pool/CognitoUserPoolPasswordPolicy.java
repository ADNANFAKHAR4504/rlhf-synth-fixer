package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolPasswordPolicy")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolPasswordPolicy.Jsii$Proxy.class)
public interface CognitoUserPoolPasswordPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#minimum_length CognitoUserPool#minimum_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#password_history_size CognitoUserPool#password_history_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPasswordHistorySize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_lowercase CognitoUserPool#require_lowercase}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireLowercase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_numbers CognitoUserPool#require_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_symbols CognitoUserPool#require_symbols}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireSymbols() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_uppercase CognitoUserPool#require_uppercase}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireUppercase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#temporary_password_validity_days CognitoUserPool#temporary_password_validity_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTemporaryPasswordValidityDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolPasswordPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolPasswordPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolPasswordPolicy> {
        java.lang.Number minimumLength;
        java.lang.Number passwordHistorySize;
        java.lang.Object requireLowercase;
        java.lang.Object requireNumbers;
        java.lang.Object requireSymbols;
        java.lang.Object requireUppercase;
        java.lang.Number temporaryPasswordValidityDays;

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getMinimumLength}
         * @param minimumLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#minimum_length CognitoUserPool#minimum_length}.
         * @return {@code this}
         */
        public Builder minimumLength(java.lang.Number minimumLength) {
            this.minimumLength = minimumLength;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getPasswordHistorySize}
         * @param passwordHistorySize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#password_history_size CognitoUserPool#password_history_size}.
         * @return {@code this}
         */
        public Builder passwordHistorySize(java.lang.Number passwordHistorySize) {
            this.passwordHistorySize = passwordHistorySize;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireLowercase}
         * @param requireLowercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_lowercase CognitoUserPool#require_lowercase}.
         * @return {@code this}
         */
        public Builder requireLowercase(java.lang.Boolean requireLowercase) {
            this.requireLowercase = requireLowercase;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireLowercase}
         * @param requireLowercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_lowercase CognitoUserPool#require_lowercase}.
         * @return {@code this}
         */
        public Builder requireLowercase(com.hashicorp.cdktf.IResolvable requireLowercase) {
            this.requireLowercase = requireLowercase;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireNumbers}
         * @param requireNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_numbers CognitoUserPool#require_numbers}.
         * @return {@code this}
         */
        public Builder requireNumbers(java.lang.Boolean requireNumbers) {
            this.requireNumbers = requireNumbers;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireNumbers}
         * @param requireNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_numbers CognitoUserPool#require_numbers}.
         * @return {@code this}
         */
        public Builder requireNumbers(com.hashicorp.cdktf.IResolvable requireNumbers) {
            this.requireNumbers = requireNumbers;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireSymbols}
         * @param requireSymbols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_symbols CognitoUserPool#require_symbols}.
         * @return {@code this}
         */
        public Builder requireSymbols(java.lang.Boolean requireSymbols) {
            this.requireSymbols = requireSymbols;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireSymbols}
         * @param requireSymbols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_symbols CognitoUserPool#require_symbols}.
         * @return {@code this}
         */
        public Builder requireSymbols(com.hashicorp.cdktf.IResolvable requireSymbols) {
            this.requireSymbols = requireSymbols;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireUppercase}
         * @param requireUppercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_uppercase CognitoUserPool#require_uppercase}.
         * @return {@code this}
         */
        public Builder requireUppercase(java.lang.Boolean requireUppercase) {
            this.requireUppercase = requireUppercase;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getRequireUppercase}
         * @param requireUppercase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#require_uppercase CognitoUserPool#require_uppercase}.
         * @return {@code this}
         */
        public Builder requireUppercase(com.hashicorp.cdktf.IResolvable requireUppercase) {
            this.requireUppercase = requireUppercase;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolPasswordPolicy#getTemporaryPasswordValidityDays}
         * @param temporaryPasswordValidityDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#temporary_password_validity_days CognitoUserPool#temporary_password_validity_days}.
         * @return {@code this}
         */
        public Builder temporaryPasswordValidityDays(java.lang.Number temporaryPasswordValidityDays) {
            this.temporaryPasswordValidityDays = temporaryPasswordValidityDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolPasswordPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolPasswordPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolPasswordPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolPasswordPolicy {
        private final java.lang.Number minimumLength;
        private final java.lang.Number passwordHistorySize;
        private final java.lang.Object requireLowercase;
        private final java.lang.Object requireNumbers;
        private final java.lang.Object requireSymbols;
        private final java.lang.Object requireUppercase;
        private final java.lang.Number temporaryPasswordValidityDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.minimumLength = software.amazon.jsii.Kernel.get(this, "minimumLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.passwordHistorySize = software.amazon.jsii.Kernel.get(this, "passwordHistorySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.requireLowercase = software.amazon.jsii.Kernel.get(this, "requireLowercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireNumbers = software.amazon.jsii.Kernel.get(this, "requireNumbers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireSymbols = software.amazon.jsii.Kernel.get(this, "requireSymbols", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireUppercase = software.amazon.jsii.Kernel.get(this, "requireUppercase", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.temporaryPasswordValidityDays = software.amazon.jsii.Kernel.get(this, "temporaryPasswordValidityDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.minimumLength = builder.minimumLength;
            this.passwordHistorySize = builder.passwordHistorySize;
            this.requireLowercase = builder.requireLowercase;
            this.requireNumbers = builder.requireNumbers;
            this.requireSymbols = builder.requireSymbols;
            this.requireUppercase = builder.requireUppercase;
            this.temporaryPasswordValidityDays = builder.temporaryPasswordValidityDays;
        }

        @Override
        public final java.lang.Number getMinimumLength() {
            return this.minimumLength;
        }

        @Override
        public final java.lang.Number getPasswordHistorySize() {
            return this.passwordHistorySize;
        }

        @Override
        public final java.lang.Object getRequireLowercase() {
            return this.requireLowercase;
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
        public final java.lang.Object getRequireUppercase() {
            return this.requireUppercase;
        }

        @Override
        public final java.lang.Number getTemporaryPasswordValidityDays() {
            return this.temporaryPasswordValidityDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMinimumLength() != null) {
                data.set("minimumLength", om.valueToTree(this.getMinimumLength()));
            }
            if (this.getPasswordHistorySize() != null) {
                data.set("passwordHistorySize", om.valueToTree(this.getPasswordHistorySize()));
            }
            if (this.getRequireLowercase() != null) {
                data.set("requireLowercase", om.valueToTree(this.getRequireLowercase()));
            }
            if (this.getRequireNumbers() != null) {
                data.set("requireNumbers", om.valueToTree(this.getRequireNumbers()));
            }
            if (this.getRequireSymbols() != null) {
                data.set("requireSymbols", om.valueToTree(this.getRequireSymbols()));
            }
            if (this.getRequireUppercase() != null) {
                data.set("requireUppercase", om.valueToTree(this.getRequireUppercase()));
            }
            if (this.getTemporaryPasswordValidityDays() != null) {
                data.set("temporaryPasswordValidityDays", om.valueToTree(this.getTemporaryPasswordValidityDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolPasswordPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolPasswordPolicy.Jsii$Proxy that = (CognitoUserPoolPasswordPolicy.Jsii$Proxy) o;

            if (this.minimumLength != null ? !this.minimumLength.equals(that.minimumLength) : that.minimumLength != null) return false;
            if (this.passwordHistorySize != null ? !this.passwordHistorySize.equals(that.passwordHistorySize) : that.passwordHistorySize != null) return false;
            if (this.requireLowercase != null ? !this.requireLowercase.equals(that.requireLowercase) : that.requireLowercase != null) return false;
            if (this.requireNumbers != null ? !this.requireNumbers.equals(that.requireNumbers) : that.requireNumbers != null) return false;
            if (this.requireSymbols != null ? !this.requireSymbols.equals(that.requireSymbols) : that.requireSymbols != null) return false;
            if (this.requireUppercase != null ? !this.requireUppercase.equals(that.requireUppercase) : that.requireUppercase != null) return false;
            return this.temporaryPasswordValidityDays != null ? this.temporaryPasswordValidityDays.equals(that.temporaryPasswordValidityDays) : that.temporaryPasswordValidityDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.minimumLength != null ? this.minimumLength.hashCode() : 0;
            result = 31 * result + (this.passwordHistorySize != null ? this.passwordHistorySize.hashCode() : 0);
            result = 31 * result + (this.requireLowercase != null ? this.requireLowercase.hashCode() : 0);
            result = 31 * result + (this.requireNumbers != null ? this.requireNumbers.hashCode() : 0);
            result = 31 * result + (this.requireSymbols != null ? this.requireSymbols.hashCode() : 0);
            result = 31 * result + (this.requireUppercase != null ? this.requireUppercase.hashCode() : 0);
            result = 31 * result + (this.temporaryPasswordValidityDays != null ? this.temporaryPasswordValidityDays.hashCode() : 0);
            return result;
        }
    }
}
