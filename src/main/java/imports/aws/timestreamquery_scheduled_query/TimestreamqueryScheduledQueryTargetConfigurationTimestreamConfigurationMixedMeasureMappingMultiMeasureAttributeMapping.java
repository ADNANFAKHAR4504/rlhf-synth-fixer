package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.555Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMeasureValueType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceColumn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_attribute_name TimestreamqueryScheduledQuery#target_multi_measure_attribute_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetMultiMeasureAttributeName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping> {
        java.lang.String measureValueType;
        java.lang.String sourceColumn;
        java.lang.String targetMultiMeasureAttributeName;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping#getMeasureValueType}
         * @param measureValueType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder measureValueType(java.lang.String measureValueType) {
            this.measureValueType = measureValueType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping#getSourceColumn}
         * @param sourceColumn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceColumn(java.lang.String sourceColumn) {
            this.sourceColumn = sourceColumn;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping#getTargetMultiMeasureAttributeName}
         * @param targetMultiMeasureAttributeName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_multi_measure_attribute_name TimestreamqueryScheduledQuery#target_multi_measure_attribute_name}.
         * @return {@code this}
         */
        public Builder targetMultiMeasureAttributeName(java.lang.String targetMultiMeasureAttributeName) {
            this.targetMultiMeasureAttributeName = targetMultiMeasureAttributeName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping {
        private final java.lang.String measureValueType;
        private final java.lang.String sourceColumn;
        private final java.lang.String targetMultiMeasureAttributeName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.measureValueType = software.amazon.jsii.Kernel.get(this, "measureValueType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceColumn = software.amazon.jsii.Kernel.get(this, "sourceColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetMultiMeasureAttributeName = software.amazon.jsii.Kernel.get(this, "targetMultiMeasureAttributeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.measureValueType = java.util.Objects.requireNonNull(builder.measureValueType, "measureValueType is required");
            this.sourceColumn = java.util.Objects.requireNonNull(builder.sourceColumn, "sourceColumn is required");
            this.targetMultiMeasureAttributeName = builder.targetMultiMeasureAttributeName;
        }

        @Override
        public final java.lang.String getMeasureValueType() {
            return this.measureValueType;
        }

        @Override
        public final java.lang.String getSourceColumn() {
            return this.sourceColumn;
        }

        @Override
        public final java.lang.String getTargetMultiMeasureAttributeName() {
            return this.targetMultiMeasureAttributeName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("measureValueType", om.valueToTree(this.getMeasureValueType()));
            data.set("sourceColumn", om.valueToTree(this.getSourceColumn()));
            if (this.getTargetMultiMeasureAttributeName() != null) {
                data.set("targetMultiMeasureAttributeName", om.valueToTree(this.getTargetMultiMeasureAttributeName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping.Jsii$Proxy that = (TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping.Jsii$Proxy) o;

            if (!measureValueType.equals(that.measureValueType)) return false;
            if (!sourceColumn.equals(that.sourceColumn)) return false;
            return this.targetMultiMeasureAttributeName != null ? this.targetMultiMeasureAttributeName.equals(that.targetMultiMeasureAttributeName) : that.targetMultiMeasureAttributeName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.measureValueType.hashCode();
            result = 31 * result + (this.sourceColumn.hashCode());
            result = 31 * result + (this.targetMultiMeasureAttributeName != null ? this.targetMultiMeasureAttributeName.hashCode() : 0);
            return result;
        }
    }
}
