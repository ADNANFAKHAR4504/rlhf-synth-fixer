package imports.aws.elastic_beanstalk_configuration_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.163Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticBeanstalkConfigurationTemplate.ElasticBeanstalkConfigurationTemplateSetting")
@software.amazon.jsii.Jsii.Proxy(ElasticBeanstalkConfigurationTemplateSetting.Jsii$Proxy.class)
public interface ElasticBeanstalkConfigurationTemplateSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#name ElasticBeanstalkConfigurationTemplate#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#namespace ElasticBeanstalkConfigurationTemplate#namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#value ElasticBeanstalkConfigurationTemplate#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#resource ElasticBeanstalkConfigurationTemplate#resource}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticBeanstalkConfigurationTemplateSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticBeanstalkConfigurationTemplateSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticBeanstalkConfigurationTemplateSetting> {
        java.lang.String name;
        java.lang.String namespace;
        java.lang.String value;
        java.lang.String resource;

        /**
         * Sets the value of {@link ElasticBeanstalkConfigurationTemplateSetting#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#name ElasticBeanstalkConfigurationTemplate#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkConfigurationTemplateSetting#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#namespace ElasticBeanstalkConfigurationTemplate#namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkConfigurationTemplateSetting#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#value ElasticBeanstalkConfigurationTemplate#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkConfigurationTemplateSetting#getResource}
         * @param resource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_configuration_template#resource ElasticBeanstalkConfigurationTemplate#resource}.
         * @return {@code this}
         */
        public Builder resource(java.lang.String resource) {
            this.resource = resource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticBeanstalkConfigurationTemplateSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticBeanstalkConfigurationTemplateSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticBeanstalkConfigurationTemplateSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticBeanstalkConfigurationTemplateSetting {
        private final java.lang.String name;
        private final java.lang.String namespace;
        private final java.lang.String value;
        private final java.lang.String resource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resource = software.amazon.jsii.Kernel.get(this, "resource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.namespace = java.util.Objects.requireNonNull(builder.namespace, "namespace is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
            this.resource = builder.resource;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        public final java.lang.String getResource() {
            return this.resource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("namespace", om.valueToTree(this.getNamespace()));
            data.set("value", om.valueToTree(this.getValue()));
            if (this.getResource() != null) {
                data.set("resource", om.valueToTree(this.getResource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticBeanstalkConfigurationTemplate.ElasticBeanstalkConfigurationTemplateSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticBeanstalkConfigurationTemplateSetting.Jsii$Proxy that = (ElasticBeanstalkConfigurationTemplateSetting.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!namespace.equals(that.namespace)) return false;
            if (!value.equals(that.value)) return false;
            return this.resource != null ? this.resource.equals(that.resource) : that.resource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.namespace.hashCode());
            result = 31 * result + (this.value.hashCode());
            result = 31 * result + (this.resource != null ? this.resource.hashCode() : 0);
            return result;
        }
    }
}
