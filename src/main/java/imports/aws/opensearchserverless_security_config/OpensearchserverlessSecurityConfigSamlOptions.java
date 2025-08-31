package imports.aws.opensearchserverless_security_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.999Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchserverlessSecurityConfig.OpensearchserverlessSecurityConfigSamlOptions")
@software.amazon.jsii.Jsii.Proxy(OpensearchserverlessSecurityConfigSamlOptions.Jsii$Proxy.class)
public interface OpensearchserverlessSecurityConfigSamlOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * The XML IdP metadata file generated from your identity provider.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#metadata OpensearchserverlessSecurityConfig#metadata}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetadata();

    /**
     * Group attribute for this SAML integration.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#group_attribute OpensearchserverlessSecurityConfig#group_attribute}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupAttribute() {
        return null;
    }

    /**
     * Session timeout, in minutes. Minimum is 5 minutes and maximum is 720 minutes (12 hours). Default is 60 minutes.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#session_timeout OpensearchserverlessSecurityConfig#session_timeout}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeout() {
        return null;
    }

    /**
     * User attribute for this SAML integration.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#user_attribute OpensearchserverlessSecurityConfig#user_attribute}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserAttribute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchserverlessSecurityConfigSamlOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchserverlessSecurityConfigSamlOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchserverlessSecurityConfigSamlOptions> {
        java.lang.String metadata;
        java.lang.String groupAttribute;
        java.lang.Number sessionTimeout;
        java.lang.String userAttribute;

        /**
         * Sets the value of {@link OpensearchserverlessSecurityConfigSamlOptions#getMetadata}
         * @param metadata The XML IdP metadata file generated from your identity provider. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#metadata OpensearchserverlessSecurityConfig#metadata}
         * @return {@code this}
         */
        public Builder metadata(java.lang.String metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchserverlessSecurityConfigSamlOptions#getGroupAttribute}
         * @param groupAttribute Group attribute for this SAML integration.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#group_attribute OpensearchserverlessSecurityConfig#group_attribute}
         * @return {@code this}
         */
        public Builder groupAttribute(java.lang.String groupAttribute) {
            this.groupAttribute = groupAttribute;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchserverlessSecurityConfigSamlOptions#getSessionTimeout}
         * @param sessionTimeout Session timeout, in minutes. Minimum is 5 minutes and maximum is 720 minutes (12 hours). Default is 60 minutes.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#session_timeout OpensearchserverlessSecurityConfig#session_timeout}
         * @return {@code this}
         */
        public Builder sessionTimeout(java.lang.Number sessionTimeout) {
            this.sessionTimeout = sessionTimeout;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchserverlessSecurityConfigSamlOptions#getUserAttribute}
         * @param userAttribute User attribute for this SAML integration.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearchserverless_security_config#user_attribute OpensearchserverlessSecurityConfig#user_attribute}
         * @return {@code this}
         */
        public Builder userAttribute(java.lang.String userAttribute) {
            this.userAttribute = userAttribute;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchserverlessSecurityConfigSamlOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchserverlessSecurityConfigSamlOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchserverlessSecurityConfigSamlOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchserverlessSecurityConfigSamlOptions {
        private final java.lang.String metadata;
        private final java.lang.String groupAttribute;
        private final java.lang.Number sessionTimeout;
        private final java.lang.String userAttribute;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metadata = software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupAttribute = software.amazon.jsii.Kernel.get(this, "groupAttribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionTimeout = software.amazon.jsii.Kernel.get(this, "sessionTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.userAttribute = software.amazon.jsii.Kernel.get(this, "userAttribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metadata = java.util.Objects.requireNonNull(builder.metadata, "metadata is required");
            this.groupAttribute = builder.groupAttribute;
            this.sessionTimeout = builder.sessionTimeout;
            this.userAttribute = builder.userAttribute;
        }

        @Override
        public final java.lang.String getMetadata() {
            return this.metadata;
        }

        @Override
        public final java.lang.String getGroupAttribute() {
            return this.groupAttribute;
        }

        @Override
        public final java.lang.Number getSessionTimeout() {
            return this.sessionTimeout;
        }

        @Override
        public final java.lang.String getUserAttribute() {
            return this.userAttribute;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metadata", om.valueToTree(this.getMetadata()));
            if (this.getGroupAttribute() != null) {
                data.set("groupAttribute", om.valueToTree(this.getGroupAttribute()));
            }
            if (this.getSessionTimeout() != null) {
                data.set("sessionTimeout", om.valueToTree(this.getSessionTimeout()));
            }
            if (this.getUserAttribute() != null) {
                data.set("userAttribute", om.valueToTree(this.getUserAttribute()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchserverlessSecurityConfig.OpensearchserverlessSecurityConfigSamlOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchserverlessSecurityConfigSamlOptions.Jsii$Proxy that = (OpensearchserverlessSecurityConfigSamlOptions.Jsii$Proxy) o;

            if (!metadata.equals(that.metadata)) return false;
            if (this.groupAttribute != null ? !this.groupAttribute.equals(that.groupAttribute) : that.groupAttribute != null) return false;
            if (this.sessionTimeout != null ? !this.sessionTimeout.equals(that.sessionTimeout) : that.sessionTimeout != null) return false;
            return this.userAttribute != null ? this.userAttribute.equals(that.userAttribute) : that.userAttribute == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metadata.hashCode();
            result = 31 * result + (this.groupAttribute != null ? this.groupAttribute.hashCode() : 0);
            result = 31 * result + (this.sessionTimeout != null ? this.sessionTimeout.hashCode() : 0);
            result = 31 * result + (this.userAttribute != null ? this.userAttribute.hashCode() : 0);
            return result;
        }
    }
}
