package imports.aws.codebuild_webhook;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildWebhook.CodebuildWebhookScopeConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodebuildWebhookScopeConfiguration.Jsii$Proxy.class)
public interface CodebuildWebhookScopeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#name CodebuildWebhook#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#scope CodebuildWebhook#scope}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScope();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#domain CodebuildWebhook#domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomain() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildWebhookScopeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildWebhookScopeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildWebhookScopeConfiguration> {
        java.lang.String name;
        java.lang.String scope;
        java.lang.String domain;

        /**
         * Sets the value of {@link CodebuildWebhookScopeConfiguration#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#name CodebuildWebhook#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookScopeConfiguration#getScope}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#scope CodebuildWebhook#scope}. This parameter is required.
         * @return {@code this}
         */
        public Builder scope(java.lang.String scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookScopeConfiguration#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#domain CodebuildWebhook#domain}.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildWebhookScopeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildWebhookScopeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildWebhookScopeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildWebhookScopeConfiguration {
        private final java.lang.String name;
        private final java.lang.String scope;
        private final java.lang.String domain;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.scope = java.util.Objects.requireNonNull(builder.scope, "scope is required");
            this.domain = builder.domain;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getScope() {
            return this.scope;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("scope", om.valueToTree(this.getScope()));
            if (this.getDomain() != null) {
                data.set("domain", om.valueToTree(this.getDomain()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildWebhook.CodebuildWebhookScopeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildWebhookScopeConfiguration.Jsii$Proxy that = (CodebuildWebhookScopeConfiguration.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!scope.equals(that.scope)) return false;
            return this.domain != null ? this.domain.equals(that.domain) : that.domain == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.scope.hashCode());
            result = 31 * result + (this.domain != null ? this.domain.hashCode() : 0);
            return result;
        }
    }
}
