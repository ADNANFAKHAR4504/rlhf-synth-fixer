package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSource")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapSource.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_arn QuicksightDataSet#data_set_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataSetArn() {
        return null;
    }

    /**
     * join_instruction block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#join_instruction QuicksightDataSet#join_instruction}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction getJoinInstruction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_id QuicksightDataSet#physical_table_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPhysicalTableId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapSource> {
        java.lang.String dataSetArn;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction joinInstruction;
        java.lang.String physicalTableId;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSource#getDataSetArn}
         * @param dataSetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_arn QuicksightDataSet#data_set_arn}.
         * @return {@code this}
         */
        public Builder dataSetArn(java.lang.String dataSetArn) {
            this.dataSetArn = dataSetArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSource#getJoinInstruction}
         * @param joinInstruction join_instruction block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#join_instruction QuicksightDataSet#join_instruction}
         * @return {@code this}
         */
        public Builder joinInstruction(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction joinInstruction) {
            this.joinInstruction = joinInstruction;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSource#getPhysicalTableId}
         * @param physicalTableId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_id QuicksightDataSet#physical_table_id}.
         * @return {@code this}
         */
        public Builder physicalTableId(java.lang.String physicalTableId) {
            this.physicalTableId = physicalTableId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapSource {
        private final java.lang.String dataSetArn;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction joinInstruction;
        private final java.lang.String physicalTableId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSetArn = software.amazon.jsii.Kernel.get(this, "dataSetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.joinInstruction = software.amazon.jsii.Kernel.get(this, "joinInstruction", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction.class));
            this.physicalTableId = software.amazon.jsii.Kernel.get(this, "physicalTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSetArn = builder.dataSetArn;
            this.joinInstruction = builder.joinInstruction;
            this.physicalTableId = builder.physicalTableId;
        }

        @Override
        public final java.lang.String getDataSetArn() {
            return this.dataSetArn;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstruction getJoinInstruction() {
            return this.joinInstruction;
        }

        @Override
        public final java.lang.String getPhysicalTableId() {
            return this.physicalTableId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataSetArn() != null) {
                data.set("dataSetArn", om.valueToTree(this.getDataSetArn()));
            }
            if (this.getJoinInstruction() != null) {
                data.set("joinInstruction", om.valueToTree(this.getJoinInstruction()));
            }
            if (this.getPhysicalTableId() != null) {
                data.set("physicalTableId", om.valueToTree(this.getPhysicalTableId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapSource.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapSource.Jsii$Proxy) o;

            if (this.dataSetArn != null ? !this.dataSetArn.equals(that.dataSetArn) : that.dataSetArn != null) return false;
            if (this.joinInstruction != null ? !this.joinInstruction.equals(that.joinInstruction) : that.joinInstruction != null) return false;
            return this.physicalTableId != null ? this.physicalTableId.equals(that.physicalTableId) : that.physicalTableId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataSetArn != null ? this.dataSetArn.hashCode() : 0;
            result = 31 * result + (this.joinInstruction != null ? this.joinInstruction.hashCode() : 0);
            result = 31 * result + (this.physicalTableId != null ? this.physicalTableId.hashCode() : 0);
            return result;
        }
    }
}
