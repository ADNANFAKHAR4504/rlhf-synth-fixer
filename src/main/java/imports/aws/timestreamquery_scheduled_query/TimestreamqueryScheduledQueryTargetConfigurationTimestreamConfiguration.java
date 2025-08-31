package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.554Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#database_name TimestreamqueryScheduledQuery#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#table_name TimestreamqueryScheduledQuery#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#time_column TimestreamqueryScheduledQuery#time_column}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTimeColumn();

    /**
     * dimension_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_mapping TimestreamqueryScheduledQuery#dimension_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDimensionMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name_column TimestreamqueryScheduledQuery#measure_name_column}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMeasureNameColumn() {
        return null;
    }

    /**
     * mixed_measure_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#mixed_measure_mapping TimestreamqueryScheduledQuery#mixed_measure_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMixedMeasureMapping() {
        return null;
    }

    /**
     * multi_measure_mappings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_mappings TimestreamqueryScheduledQuery#multi_measure_mappings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiMeasureMappings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration> {
        java.lang.String databaseName;
        java.lang.String tableName;
        java.lang.String timeColumn;
        java.lang.Object dimensionMapping;
        java.lang.String measureNameColumn;
        java.lang.Object mixedMeasureMapping;
        java.lang.Object multiMeasureMappings;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#database_name TimestreamqueryScheduledQuery#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#table_name TimestreamqueryScheduledQuery#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getTimeColumn}
         * @param timeColumn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#time_column TimestreamqueryScheduledQuery#time_column}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeColumn(java.lang.String timeColumn) {
            this.timeColumn = timeColumn;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getDimensionMapping}
         * @param dimensionMapping dimension_mapping block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_mapping TimestreamqueryScheduledQuery#dimension_mapping}
         * @return {@code this}
         */
        public Builder dimensionMapping(com.hashicorp.cdktf.IResolvable dimensionMapping) {
            this.dimensionMapping = dimensionMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getDimensionMapping}
         * @param dimensionMapping dimension_mapping block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#dimension_mapping TimestreamqueryScheduledQuery#dimension_mapping}
         * @return {@code this}
         */
        public Builder dimensionMapping(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationDimensionMapping> dimensionMapping) {
            this.dimensionMapping = dimensionMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getMeasureNameColumn}
         * @param measureNameColumn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#measure_name_column TimestreamqueryScheduledQuery#measure_name_column}.
         * @return {@code this}
         */
        public Builder measureNameColumn(java.lang.String measureNameColumn) {
            this.measureNameColumn = measureNameColumn;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getMixedMeasureMapping}
         * @param mixedMeasureMapping mixed_measure_mapping block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#mixed_measure_mapping TimestreamqueryScheduledQuery#mixed_measure_mapping}
         * @return {@code this}
         */
        public Builder mixedMeasureMapping(com.hashicorp.cdktf.IResolvable mixedMeasureMapping) {
            this.mixedMeasureMapping = mixedMeasureMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getMixedMeasureMapping}
         * @param mixedMeasureMapping mixed_measure_mapping block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#mixed_measure_mapping TimestreamqueryScheduledQuery#mixed_measure_mapping}
         * @return {@code this}
         */
        public Builder mixedMeasureMapping(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMixedMeasureMapping> mixedMeasureMapping) {
            this.mixedMeasureMapping = mixedMeasureMapping;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getMultiMeasureMappings}
         * @param multiMeasureMappings multi_measure_mappings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_mappings TimestreamqueryScheduledQuery#multi_measure_mappings}
         * @return {@code this}
         */
        public Builder multiMeasureMappings(com.hashicorp.cdktf.IResolvable multiMeasureMappings) {
            this.multiMeasureMappings = multiMeasureMappings;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration#getMultiMeasureMappings}
         * @param multiMeasureMappings multi_measure_mappings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#multi_measure_mappings TimestreamqueryScheduledQuery#multi_measure_mappings}
         * @return {@code this}
         */
        public Builder multiMeasureMappings(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfigurationMultiMeasureMappings> multiMeasureMappings) {
            this.multiMeasureMappings = multiMeasureMappings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration {
        private final java.lang.String databaseName;
        private final java.lang.String tableName;
        private final java.lang.String timeColumn;
        private final java.lang.Object dimensionMapping;
        private final java.lang.String measureNameColumn;
        private final java.lang.Object mixedMeasureMapping;
        private final java.lang.Object multiMeasureMappings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeColumn = software.amazon.jsii.Kernel.get(this, "timeColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensionMapping = software.amazon.jsii.Kernel.get(this, "dimensionMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.measureNameColumn = software.amazon.jsii.Kernel.get(this, "measureNameColumn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mixedMeasureMapping = software.amazon.jsii.Kernel.get(this, "mixedMeasureMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.multiMeasureMappings = software.amazon.jsii.Kernel.get(this, "multiMeasureMappings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.timeColumn = java.util.Objects.requireNonNull(builder.timeColumn, "timeColumn is required");
            this.dimensionMapping = builder.dimensionMapping;
            this.measureNameColumn = builder.measureNameColumn;
            this.mixedMeasureMapping = builder.mixedMeasureMapping;
            this.multiMeasureMappings = builder.multiMeasureMappings;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final java.lang.String getTimeColumn() {
            return this.timeColumn;
        }

        @Override
        public final java.lang.Object getDimensionMapping() {
            return this.dimensionMapping;
        }

        @Override
        public final java.lang.String getMeasureNameColumn() {
            return this.measureNameColumn;
        }

        @Override
        public final java.lang.Object getMixedMeasureMapping() {
            return this.mixedMeasureMapping;
        }

        @Override
        public final java.lang.Object getMultiMeasureMappings() {
            return this.multiMeasureMappings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            data.set("timeColumn", om.valueToTree(this.getTimeColumn()));
            if (this.getDimensionMapping() != null) {
                data.set("dimensionMapping", om.valueToTree(this.getDimensionMapping()));
            }
            if (this.getMeasureNameColumn() != null) {
                data.set("measureNameColumn", om.valueToTree(this.getMeasureNameColumn()));
            }
            if (this.getMixedMeasureMapping() != null) {
                data.set("mixedMeasureMapping", om.valueToTree(this.getMixedMeasureMapping()));
            }
            if (this.getMultiMeasureMappings() != null) {
                data.set("multiMeasureMappings", om.valueToTree(this.getMultiMeasureMappings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration.Jsii$Proxy that = (TimestreamqueryScheduledQueryTargetConfigurationTimestreamConfiguration.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!tableName.equals(that.tableName)) return false;
            if (!timeColumn.equals(that.timeColumn)) return false;
            if (this.dimensionMapping != null ? !this.dimensionMapping.equals(that.dimensionMapping) : that.dimensionMapping != null) return false;
            if (this.measureNameColumn != null ? !this.measureNameColumn.equals(that.measureNameColumn) : that.measureNameColumn != null) return false;
            if (this.mixedMeasureMapping != null ? !this.mixedMeasureMapping.equals(that.mixedMeasureMapping) : that.mixedMeasureMapping != null) return false;
            return this.multiMeasureMappings != null ? this.multiMeasureMappings.equals(that.multiMeasureMappings) : that.multiMeasureMappings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.timeColumn.hashCode());
            result = 31 * result + (this.dimensionMapping != null ? this.dimensionMapping.hashCode() : 0);
            result = 31 * result + (this.measureNameColumn != null ? this.measureNameColumn.hashCode() : 0);
            result = 31 * result + (this.mixedMeasureMapping != null ? this.mixedMeasureMapping.hashCode() : 0);
            result = 31 * result + (this.multiMeasureMappings != null ? this.multiMeasureMappings.hashCode() : 0);
            return result;
        }
    }
}
