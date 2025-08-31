package imports.aws.db_proxy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.974Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbProxy.DbProxyAuth")
@software.amazon.jsii.Jsii.Proxy(DbProxyAuth.Jsii$Proxy.class)
public interface DbProxyAuth extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#auth_scheme DbProxy#auth_scheme}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthScheme() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#client_password_auth_type DbProxy#client_password_auth_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientPasswordAuthType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#description DbProxy#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#iam_auth DbProxy#iam_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#secret_arn DbProxy#secret_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#username DbProxy#username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsername() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DbProxyAuth}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DbProxyAuth}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DbProxyAuth> {
        java.lang.String authScheme;
        java.lang.String clientPasswordAuthType;
        java.lang.String description;
        java.lang.String iamAuth;
        java.lang.String secretArn;
        java.lang.String username;

        /**
         * Sets the value of {@link DbProxyAuth#getAuthScheme}
         * @param authScheme Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#auth_scheme DbProxy#auth_scheme}.
         * @return {@code this}
         */
        public Builder authScheme(java.lang.String authScheme) {
            this.authScheme = authScheme;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyAuth#getClientPasswordAuthType}
         * @param clientPasswordAuthType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#client_password_auth_type DbProxy#client_password_auth_type}.
         * @return {@code this}
         */
        public Builder clientPasswordAuthType(java.lang.String clientPasswordAuthType) {
            this.clientPasswordAuthType = clientPasswordAuthType;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyAuth#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#description DbProxy#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyAuth#getIamAuth}
         * @param iamAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#iam_auth DbProxy#iam_auth}.
         * @return {@code this}
         */
        public Builder iamAuth(java.lang.String iamAuth) {
            this.iamAuth = iamAuth;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyAuth#getSecretArn}
         * @param secretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#secret_arn DbProxy#secret_arn}.
         * @return {@code this}
         */
        public Builder secretArn(java.lang.String secretArn) {
            this.secretArn = secretArn;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyAuth#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy#username DbProxy#username}.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DbProxyAuth}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DbProxyAuth build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DbProxyAuth}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DbProxyAuth {
        private final java.lang.String authScheme;
        private final java.lang.String clientPasswordAuthType;
        private final java.lang.String description;
        private final java.lang.String iamAuth;
        private final java.lang.String secretArn;
        private final java.lang.String username;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authScheme = software.amazon.jsii.Kernel.get(this, "authScheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientPasswordAuthType = software.amazon.jsii.Kernel.get(this, "clientPasswordAuthType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamAuth = software.amazon.jsii.Kernel.get(this, "iamAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretArn = software.amazon.jsii.Kernel.get(this, "secretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authScheme = builder.authScheme;
            this.clientPasswordAuthType = builder.clientPasswordAuthType;
            this.description = builder.description;
            this.iamAuth = builder.iamAuth;
            this.secretArn = builder.secretArn;
            this.username = builder.username;
        }

        @Override
        public final java.lang.String getAuthScheme() {
            return this.authScheme;
        }

        @Override
        public final java.lang.String getClientPasswordAuthType() {
            return this.clientPasswordAuthType;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getIamAuth() {
            return this.iamAuth;
        }

        @Override
        public final java.lang.String getSecretArn() {
            return this.secretArn;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthScheme() != null) {
                data.set("authScheme", om.valueToTree(this.getAuthScheme()));
            }
            if (this.getClientPasswordAuthType() != null) {
                data.set("clientPasswordAuthType", om.valueToTree(this.getClientPasswordAuthType()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getIamAuth() != null) {
                data.set("iamAuth", om.valueToTree(this.getIamAuth()));
            }
            if (this.getSecretArn() != null) {
                data.set("secretArn", om.valueToTree(this.getSecretArn()));
            }
            if (this.getUsername() != null) {
                data.set("username", om.valueToTree(this.getUsername()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dbProxy.DbProxyAuth"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DbProxyAuth.Jsii$Proxy that = (DbProxyAuth.Jsii$Proxy) o;

            if (this.authScheme != null ? !this.authScheme.equals(that.authScheme) : that.authScheme != null) return false;
            if (this.clientPasswordAuthType != null ? !this.clientPasswordAuthType.equals(that.clientPasswordAuthType) : that.clientPasswordAuthType != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.iamAuth != null ? !this.iamAuth.equals(that.iamAuth) : that.iamAuth != null) return false;
            if (this.secretArn != null ? !this.secretArn.equals(that.secretArn) : that.secretArn != null) return false;
            return this.username != null ? this.username.equals(that.username) : that.username == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authScheme != null ? this.authScheme.hashCode() : 0;
            result = 31 * result + (this.clientPasswordAuthType != null ? this.clientPasswordAuthType.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.iamAuth != null ? this.iamAuth.hashCode() : 0);
            result = 31 * result + (this.secretArn != null ? this.secretArn.hashCode() : 0);
            result = 31 * result + (this.username != null ? this.username.hashCode() : 0);
            return result;
        }
    }
}
