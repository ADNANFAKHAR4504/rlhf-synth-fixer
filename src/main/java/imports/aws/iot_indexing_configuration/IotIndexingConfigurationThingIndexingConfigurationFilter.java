package imports.aws.iot_indexing_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfigurationThingIndexingConfigurationFilter")
@software.amazon.jsii.Jsii.Proxy(IotIndexingConfigurationThingIndexingConfigurationFilter.Jsii$Proxy.class)
public interface IotIndexingConfigurationThingIndexingConfigurationFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#named_shadow_names IotIndexingConfiguration#named_shadow_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNamedShadowNames() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotIndexingConfigurationThingIndexingConfigurationFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotIndexingConfigurationThingIndexingConfigurationFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotIndexingConfigurationThingIndexingConfigurationFilter> {
        java.util.List<java.lang.String> namedShadowNames;

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfigurationFilter#getNamedShadowNames}
         * @param namedShadowNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#named_shadow_names IotIndexingConfiguration#named_shadow_names}.
         * @return {@code this}
         */
        public Builder namedShadowNames(java.util.List<java.lang.String> namedShadowNames) {
            this.namedShadowNames = namedShadowNames;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotIndexingConfigurationThingIndexingConfigurationFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotIndexingConfigurationThingIndexingConfigurationFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotIndexingConfigurationThingIndexingConfigurationFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotIndexingConfigurationThingIndexingConfigurationFilter {
        private final java.util.List<java.lang.String> namedShadowNames;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.namedShadowNames = software.amazon.jsii.Kernel.get(this, "namedShadowNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.namedShadowNames = builder.namedShadowNames;
        }

        @Override
        public final java.util.List<java.lang.String> getNamedShadowNames() {
            return this.namedShadowNames;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNamedShadowNames() != null) {
                data.set("namedShadowNames", om.valueToTree(this.getNamedShadowNames()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotIndexingConfiguration.IotIndexingConfigurationThingIndexingConfigurationFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotIndexingConfigurationThingIndexingConfigurationFilter.Jsii$Proxy that = (IotIndexingConfigurationThingIndexingConfigurationFilter.Jsii$Proxy) o;

            return this.namedShadowNames != null ? this.namedShadowNames.equals(that.namedShadowNames) : that.namedShadowNames == null;
        }

        @Override
        public final int hashCode() {
            int result = this.namedShadowNames != null ? this.namedShadowNames.hashCode() : 0;
            return result;
        }
    }
}
