package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.554Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_value_type TimestreamqueryScheduledQuery#dimension_value_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDimensionValueType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping> {
        java.lang.String dimensionValueType;
        java.lang.String name;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping#getDimensionValueType}
         * @param dimensionValueType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_value_type TimestreamqueryScheduledQuery#dimension_value_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder dimensionValueType(java.lang.String dimensionValueType) {
            this.dimensionValueType = dimensionValueType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping {
        private final java.lang.String dimensionValueType;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dimensionValueType = software.amazon.jsii.Kernel.get(this, "dimensionValueType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dimensionValueType = java.util.Objects.requireNonNull(builder.dimensionValueType, "dimensionValueType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final java.lang.String getDimensionValueType() {
            return this.dimensionValueType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dimensionValueType", om.valueToTree(this.getDimensionValueType()));
            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping.Jsii$Proxy that = (TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping.Jsii$Proxy) o;

            if (!dimensionValueType.equals(that.dimensionValueType)) return false;
            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.dimensionValueType.hashCode();
            result = 31 * result + (this.name.hashCode());
            return result;
        }
    }
}
