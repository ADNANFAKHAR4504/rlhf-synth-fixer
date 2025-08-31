package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.554Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMeasureValueType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name TimestreamqueryScheduledQuery#measure_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMeasureName() {
        return null;
    }

    /**
     * multi_measure_attribute_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiMeasureAttributeMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceColumn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_measure_name TimestreamqueryScheduledQuery#target_measure_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetMeasureName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping> {
        java.lang.String measureValueType;
        java.lang.String measureName;
        java.lang.Object multiMeasureAttributeMapping;
        java.lang.String sourceColumn;
        java.lang.String targetMeasureName;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping#getMeasureValueType}
         * @param measureValueType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_value_type TimestreamqueryScheduledQuery#measure_value_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder measureValueType(java.lang.String measureValueType) {
            this.measureValueType = measureValueType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping#getMeasureName}
         * @param measureName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name TimestreamqueryScheduledQuery#measure_name}.
         * @return {@code this}
         */
        public Builder measureName(java.lang.String measureName) {
            this.measureName = measureName;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping#getMultiMeasureAttributeMapping}
         * @param multiMeasureAttributeMapping multi_measure_attribute_mapping block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
         * @return {@code this}
         */
        public Builder multiMeasureAttributeMapping(com.hashicorp.cdktf.IResolvable multiMeasureAttributeMapping) {
            this.multiMeasureAttributeMapping = multiMeasureAttributeMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping#getMultiMeasureAttributeMapping}
         * @param multiMeasureAttributeMapping multi_measure_attribute_mapping block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_attribute_mapping TimestreamqueryScheduledQuery#multi_measure_attribute_mapping}
         * @return {@code this}
         */
        public Builder multiMeasureAttributeMapping(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMappingMultiMeasureAttributeMapping> multiMeasureAttributeMapping) {
            this.multiMeasureAttributeMapping = multiMeasureAttributeMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping#getSourceColumn}
         * @param sourceColumn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#source_column TimestreamqueryScheduledQuery#source_column}.
         * @return {@code this}
         */
        public Builder sourceColumn(java.lang.String sourceColumn) {
            this.sourceColumn = sourceColumn;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping#getTargetMeasureName}
         * @param targetMeasureName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_measure_name TimestreamqueryScheduledQuery#target_measure_name}.
         * @return {@code this}
         */
        public Builder targetMeasureName(java.lang.String targetMeasureName) {
            this.targetMeasureName = targetMeasureName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping {
        private final java.lang.String measureValueType;
        private final java.lang.String measureName;
        private final java.lang.Object multiMeasureAttributeMapping;
        private final java.lang.String sourceColumn;
        private final java.lang.String targetMeasureName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.measureValueType = software.amazon.jsii.Kernel.get(this, "measureValueType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.measureName = software.amazon.jsii.Kernel.get(this, "measureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiMeasureAttributeMapping = software.amazon.jsii.Kernel.get(this, "multiMeasureAttributeMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceColumn = software.amazon.jsii.Kernel.get(this, "sourceColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetMeasureName = software.amazon.jsii.Kernel.get(this, "targetMeasureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.measureValueType = java.util.Objects.requireNonNull(builder.measureValueType, "measureValueType is required");
            this.measureName = builder.measureName;
            this.multiMeasureAttributeMapping = builder.multiMeasureAttributeMapping;
            this.sourceColumn = builder.sourceColumn;
            this.targetMeasureName = builder.targetMeasureName;
        }

        @Override
        public final java.lang.String getMeasureValueType() {
            return this.measureValueType;
        }

        @Override
        public final java.lang.String getMeasureName() {
            return this.measureName;
        }

        @Override
        public final java.lang.Object getMultiMeasureAttributeMapping() {
            return this.multiMeasureAttributeMapping;
        }

        @Override
        public final java.lang.String getSourceColumn() {
            return this.sourceColumn;
        }

        @Override
        public final java.lang.String getTargetMeasureName() {
            return this.targetMeasureName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("measureValueType", om.valueToTree(this.getMeasureValueType()));
            if (this.getMeasureName() != null) {
                data.set("measureName", om.valueToTree(this.getMeasureName()));
            }
            if (this.getMultiMeasureAttributeMapping() != null) {
                data.set("multiMeasureAttributeMapping", om.valueToTree(this.getMultiMeasureAttributeMapping()));
            }
            if (this.getSourceColumn() != null) {
                data.set("sourceColumn", om.valueToTree(this.getSourceColumn()));
            }
            if (this.getTargetMeasureName() != null) {
                data.set("targetMeasureName", om.valueToTree(this.getTargetMeasureName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping.Jsii$Proxy that = (TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping.Jsii$Proxy) o;

            if (!measureValueType.equals(that.measureValueType)) return false;
            if (this.measureName != null ? !this.measureName.equals(that.measureName) : that.measureName != null) return false;
            if (this.multiMeasureAttributeMapping != null ? !this.multiMeasureAttributeMapping.equals(that.multiMeasureAttributeMapping) : that.multiMeasureAttributeMapping != null) return false;
            if (this.sourceColumn != null ? !this.sourceColumn.equals(that.sourceColumn) : that.sourceColumn != null) return false;
            return this.targetMeasureName != null ? this.targetMeasureName.equals(that.targetMeasureName) : that.targetMeasureName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.measureValueType.hashCode();
            result = 31 * result + (this.measureName != null ? this.measureName.hashCode() : 0);
            result = 31 * result + (this.multiMeasureAttributeMapping != null ? this.multiMeasureAttributeMapping.hashCode() : 0);
            result = 31 * result + (this.sourceColumn != null ? this.sourceColumn.hashCode() : 0);
            result = 31 * result + (this.targetMeasureName != null ? this.targetMeasureName.hashCode() : 0);
            return result;
        }
    }
}
