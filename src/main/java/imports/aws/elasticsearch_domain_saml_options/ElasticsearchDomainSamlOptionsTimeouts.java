package imports.aws.elasticsearch_domain_saml_options;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomainSamlOptions.ElasticsearchDomainSamlOptionsTimeouts")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainSamlOptionsTimeouts.Jsii$Proxy.class)
public interface ElasticsearchDomainSamlOptionsTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#delete ElasticsearchDomainSamlOptions#delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelete() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#update ElasticsearchDomainSamlOptions#update}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpdate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainSamlOptionsTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainSamlOptionsTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainSamlOptionsTimeouts> {
        java.lang.String delete;
        java.lang.String update;

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsTimeouts#getDelete}
         * @param delete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#delete ElasticsearchDomainSamlOptions#delete}.
         * @return {@code this}
         */
        public Builder delete(java.lang.String delete) {
            this.delete = delete;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsTimeouts#getUpdate}
         * @param update Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#update ElasticsearchDomainSamlOptions#update}.
         * @return {@code this}
         */
        public Builder update(java.lang.String update) {
            this.update = update;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainSamlOptionsTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainSamlOptionsTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainSamlOptionsTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainSamlOptionsTimeouts {
        private final java.lang.String delete;
        private final java.lang.String update;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.delete = software.amazon.jsii.Kernel.get(this, "delete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.update = software.amazon.jsii.Kernel.get(this, "update", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.delete = builder.delete;
            this.update = builder.update;
        }

        @Override
        public final java.lang.String getDelete() {
            return this.delete;
        }

        @Override
        public final java.lang.String getUpdate() {
            return this.update;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDelete() != null) {
                data.set("delete", om.valueToTree(this.getDelete()));
            }
            if (this.getUpdate() != null) {
                data.set("update", om.valueToTree(this.getUpdate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomainSamlOptions.ElasticsearchDomainSamlOptionsTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainSamlOptionsTimeouts.Jsii$Proxy that = (ElasticsearchDomainSamlOptionsTimeouts.Jsii$Proxy) o;

            if (this.delete != null ? !this.delete.equals(that.delete) : that.delete != null) return false;
            return this.update != null ? this.update.equals(that.update) : that.update == null;
        }

        @Override
        public final int hashCode() {
            int result = this.delete != null ? this.delete.hashCode() : 0;
            result = 31 * result + (this.update != null ? this.update.hashCode() : 0);
            return result;
        }
    }
}
