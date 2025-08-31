package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.555Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings extends software.amazon.jsii.JsiiSerializable {

    /**
     * multi_measure_attribute_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiMeasureAttributeMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_name TimestreamqueryScheduledQuery#target_multi_measure_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetMultiMeasureName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings> {
        java.lang.Object multiMeasureAttributeMapping;
        java.lang.String targetMultiMeasureName;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings#getMultiMeasureAttributeMapping}
         * @param multiMeasureAttributeMapping multi_measure_attribute_mapping block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
         * @return {@code this}
         */
        public Builder multiMeasureAttributeMapping(com.hashicorp.cdktf.IResolvable multiMeasureAttributeMapping) {
            this.multiMeasureAttributeMapping = multiMeasureAttributeMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings#getMultiMeasureAttributeMapping}
         * @param multiMeasureAttributeMapping multi_measure_attribute_mapping block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
         * @return {@code this}
         */
        public Builder multiMeasureAttributeMapping(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappingsMultiMeasureAttributeMapping> multiMeasureAttributeMapping) {
            this.multiMeasureAttributeMapping = multiMeasureAttributeMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings#getTargetMultiMeasureName}
         * @param targetMultiMeasureName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_name TimestreamqueryScheduledQuery#target_multi_measure_name}.
         * @return {@code this}
         */
        public Builder targetMultiMeasureName(java.lang.String targetMultiMeasureName) {
            this.targetMultiMeasureName = targetMultiMeasureName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings {
        private final java.lang.Object multiMeasureAttributeMapping;
        private final java.lang.String targetMultiMeasureName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.multiMeasureAttributeMapping = software.amazon.jsii.Kernel.get(this, "multiMeasureAttributeMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetMultiMeasureName = software.amazon.jsii.Kernel.get(this, "targetMultiMeasureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.multiMeasureAttributeMapping = builder.multiMeasureAttributeMapping;
            this.targetMultiMeasureName = builder.targetMultiMeasureName;
        }

        @Override
        public final java.lang.Object getMultiMeasureAttributeMapping() {
            return this.multiMeasureAttributeMapping;
        }

        @Override
        public final java.lang.String getTargetMultiMeasureName() {
            return this.targetMultiMeasureName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMultiMeasureAttributeMapping() != null) {
                data.set("multiMeasureAttributeMapping", om.valueToTree(this.getMultiMeasureAttributeMapping()));
            }
            if (this.getTargetMultiMeasureName() != null) {
                data.set("targetMultiMeasureName", om.valueToTree(this.getTargetMultiMeasureName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings.Jsii$Proxy that = (TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings.Jsii$Proxy) o;

            if (this.multiMeasureAttributeMapping != null ? !this.multiMeasureAttributeMapping.equals(that.multiMeasureAttributeMapping) : that.multiMeasureAttributeMapping != null) return false;
            return this.targetMultiMeasureName != null ? this.targetMultiMeasureName.equals(that.targetMultiMeasureName) : that.targetMultiMeasureName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.multiMeasureAttributeMapping != null ? this.multiMeasureAttributeMapping.hashCode() : 0;
            result = 31 * result + (this.targetMultiMeasureName != null ? this.targetMultiMeasureName.hashCode() : 0);
            return result;
        }
    }
}
