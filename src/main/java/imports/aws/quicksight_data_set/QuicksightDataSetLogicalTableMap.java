package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMap")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMap.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMap extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#alias QuicksightDataSet#alias}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlias();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map_id QuicksightDataSet#logical_table_map_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogicalTableMapId();

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#source QuicksightDataSet#source}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource getSource();

    /**
     * data_transforms block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_transforms QuicksightDataSet#data_transforms}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataTransforms() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMap}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMap}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMap> {
        java.lang.String alias;
        java.lang.String logicalTableMapId;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource source;
        java.lang.Object dataTransforms;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMap#getAlias}
         * @param alias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#alias QuicksightDataSet#alias}. This parameter is required.
         * @return {@code this}
         */
        public Builder alias(java.lang.String alias) {
            this.alias = alias;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMap#getLogicalTableMapId}
         * @param logicalTableMapId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map_id QuicksightDataSet#logical_table_map_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder logicalTableMapId(java.lang.String logicalTableMapId) {
            this.logicalTableMapId = logicalTableMapId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMap#getSource}
         * @param source source block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#source QuicksightDataSet#source}
         * @return {@code this}
         */
        public Builder source(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMap#getDataTransforms}
         * @param dataTransforms data_transforms block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_transforms QuicksightDataSet#data_transforms}
         * @return {@code this}
         */
        public Builder dataTransforms(com.hashicorp.cdktf.IResolvable dataTransforms) {
            this.dataTransforms = dataTransforms;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMap#getDataTransforms}
         * @param dataTransforms data_transforms block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_transforms QuicksightDataSet#data_transforms}
         * @return {@code this}
         */
        public Builder dataTransforms(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransforms> dataTransforms) {
            this.dataTransforms = dataTransforms;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMap}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMap build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMap}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMap {
        private final java.lang.String alias;
        private final java.lang.String logicalTableMapId;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource source;
        private final java.lang.Object dataTransforms;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alias = software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logicalTableMapId = software.amazon.jsii.Kernel.get(this, "logicalTableMapId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource.class));
            this.dataTransforms = software.amazon.jsii.Kernel.get(this, "dataTransforms", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alias = java.util.Objects.requireNonNull(builder.alias, "alias is required");
            this.logicalTableMapId = java.util.Objects.requireNonNull(builder.logicalTableMapId, "logicalTableMapId is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.dataTransforms = builder.dataTransforms;
        }

        @Override
        public final java.lang.String getAlias() {
            return this.alias;
        }

        @Override
        public final java.lang.String getLogicalTableMapId() {
            return this.logicalTableMapId;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSource getSource() {
            return this.source;
        }

        @Override
        public final java.lang.Object getDataTransforms() {
            return this.dataTransforms;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alias", om.valueToTree(this.getAlias()));
            data.set("logicalTableMapId", om.valueToTree(this.getLogicalTableMapId()));
            data.set("source", om.valueToTree(this.getSource()));
            if (this.getDataTransforms() != null) {
                data.set("dataTransforms", om.valueToTree(this.getDataTransforms()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMap"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMap.Jsii$Proxy that = (QuicksightDataSetLogicalTableMap.Jsii$Proxy) o;

            if (!alias.equals(that.alias)) return false;
            if (!logicalTableMapId.equals(that.logicalTableMapId)) return false;
            if (!source.equals(that.source)) return false;
            return this.dataTransforms != null ? this.dataTransforms.equals(that.dataTransforms) : that.dataTransforms == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alias.hashCode();
            result = 31 * result + (this.logicalTableMapId.hashCode());
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.dataTransforms != null ? this.dataTransforms.hashCode() : 0);
            return result;
        }
    }
}
