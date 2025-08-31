package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationTemplateConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationTemplateConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationTemplateConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#template KendraDataSource#template}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTemplate();

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationTemplateConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationTemplateConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationTemplateConfiguration> {
        java.lang.String template;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationTemplateConfiguration#getTemplate}
         * @param template Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#template KendraDataSource#template}. This parameter is required.
         * @return {@code this}
         */
        public Builder template(java.lang.String template) {
            this.template = template;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationTemplateConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationTemplateConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationTemplateConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationTemplateConfiguration {
        private final java.lang.String template;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.template = software.amazon.jsii.Kernel.get(this, "template", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.template = java.util.Objects.requireNonNull(builder.template, "template is required");
        }

        @Override
        public final java.lang.String getTemplate() {
            return this.template;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("template", om.valueToTree(this.getTemplate()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationTemplateConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationTemplateConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationTemplateConfiguration.Jsii$Proxy) o;

            return this.template.equals(that.template);
        }

        @Override
        public final int hashCode() {
            int result = this.template.hashCode();
            return result;
        }
    }
}
