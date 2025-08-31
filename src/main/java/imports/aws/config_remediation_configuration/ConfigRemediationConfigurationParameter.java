package imports.aws.config_remediation_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.380Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configRemediationConfiguration.ConfigRemediationConfigurationParameter")
@software.amazon.jsii.Jsii.Proxy(ConfigRemediationConfigurationParameter.Jsii$Proxy.class)
public interface ConfigRemediationConfigurationParameter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#name ConfigRemediationConfiguration#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#resource_value ConfigRemediationConfiguration#resource_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#static_value ConfigRemediationConfiguration#static_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStaticValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#static_values ConfigRemediationConfiguration#static_values}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStaticValues() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigRemediationConfigurationParameter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigRemediationConfigurationParameter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigRemediationConfigurationParameter> {
        java.lang.String name;
        java.lang.String resourceValue;
        java.lang.String staticValue;
        java.util.List<java.lang.String> staticValues;

        /**
         * Sets the value of {@link ConfigRemediationConfigurationParameter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#name ConfigRemediationConfiguration#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationParameter#getResourceValue}
         * @param resourceValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#resource_value ConfigRemediationConfiguration#resource_value}.
         * @return {@code this}
         */
        public Builder resourceValue(java.lang.String resourceValue) {
            this.resourceValue = resourceValue;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationParameter#getStaticValue}
         * @param staticValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#static_value ConfigRemediationConfiguration#static_value}.
         * @return {@code this}
         */
        public Builder staticValue(java.lang.String staticValue) {
            this.staticValue = staticValue;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationParameter#getStaticValues}
         * @param staticValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#static_values ConfigRemediationConfiguration#static_values}.
         * @return {@code this}
         */
        public Builder staticValues(java.util.List<java.lang.String> staticValues) {
            this.staticValues = staticValues;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigRemediationConfigurationParameter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigRemediationConfigurationParameter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigRemediationConfigurationParameter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigRemediationConfigurationParameter {
        private final java.lang.String name;
        private final java.lang.String resourceValue;
        private final java.lang.String staticValue;
        private final java.util.List<java.lang.String> staticValues;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceValue = software.amazon.jsii.Kernel.get(this, "resourceValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.staticValue = software.amazon.jsii.Kernel.get(this, "staticValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.staticValues = software.amazon.jsii.Kernel.get(this, "staticValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.resourceValue = builder.resourceValue;
            this.staticValue = builder.staticValue;
            this.staticValues = builder.staticValues;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getResourceValue() {
            return this.resourceValue;
        }

        @Override
        public final java.lang.String getStaticValue() {
            return this.staticValue;
        }

        @Override
        public final java.util.List<java.lang.String> getStaticValues() {
            return this.staticValues;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getResourceValue() != null) {
                data.set("resourceValue", om.valueToTree(this.getResourceValue()));
            }
            if (this.getStaticValue() != null) {
                data.set("staticValue", om.valueToTree(this.getStaticValue()));
            }
            if (this.getStaticValues() != null) {
                data.set("staticValues", om.valueToTree(this.getStaticValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configRemediationConfiguration.ConfigRemediationConfigurationParameter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigRemediationConfigurationParameter.Jsii$Proxy that = (ConfigRemediationConfigurationParameter.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.resourceValue != null ? !this.resourceValue.equals(that.resourceValue) : that.resourceValue != null) return false;
            if (this.staticValue != null ? !this.staticValue.equals(that.staticValue) : that.staticValue != null) return false;
            return this.staticValues != null ? this.staticValues.equals(that.staticValues) : that.staticValues == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.resourceValue != null ? this.resourceValue.hashCode() : 0);
            result = 31 * result + (this.staticValue != null ? this.staticValue.hashCode() : 0);
            result = 31 * result + (this.staticValues != null ? this.staticValues.hashCode() : 0);
            return result;
        }
    }
}
