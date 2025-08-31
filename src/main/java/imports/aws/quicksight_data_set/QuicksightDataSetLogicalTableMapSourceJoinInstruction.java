package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstruction")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapSourceJoinInstruction.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapSourceJoinInstruction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_operand QuicksightDataSet#left_operand}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLeftOperand();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#on_clause QuicksightDataSet#on_clause}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOnClause();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_operand QuicksightDataSet#right_operand}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRightOperand();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * left_join_key_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_join_key_properties QuicksightDataSet#left_join_key_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties getLeftJoinKeyProperties() {
        return null;
    }

    /**
     * right_join_key_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_join_key_properties QuicksightDataSet#right_join_key_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties getRightJoinKeyProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapSourceJoinInstruction> {
        java.lang.String leftOperand;
        java.lang.String onClause;
        java.lang.String rightOperand;
        java.lang.String type;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties leftJoinKeyProperties;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties rightJoinKeyProperties;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction#getLeftOperand}
         * @param leftOperand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_operand QuicksightDataSet#left_operand}. This parameter is required.
         * @return {@code this}
         */
        public Builder leftOperand(java.lang.String leftOperand) {
            this.leftOperand = leftOperand;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction#getOnClause}
         * @param onClause Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#on_clause QuicksightDataSet#on_clause}. This parameter is required.
         * @return {@code this}
         */
        public Builder onClause(java.lang.String onClause) {
            this.onClause = onClause;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction#getRightOperand}
         * @param rightOperand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_operand QuicksightDataSet#right_operand}. This parameter is required.
         * @return {@code this}
         */
        public Builder rightOperand(java.lang.String rightOperand) {
            this.rightOperand = rightOperand;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction#getLeftJoinKeyProperties}
         * @param leftJoinKeyProperties left_join_key_properties block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#left_join_key_properties QuicksightDataSet#left_join_key_properties}
         * @return {@code this}
         */
        public Builder leftJoinKeyProperties(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties leftJoinKeyProperties) {
            this.leftJoinKeyProperties = leftJoinKeyProperties;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction#getRightJoinKeyProperties}
         * @param rightJoinKeyProperties right_join_key_properties block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#right_join_key_properties QuicksightDataSet#right_join_key_properties}
         * @return {@code this}
         */
        public Builder rightJoinKeyProperties(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties rightJoinKeyProperties) {
            this.rightJoinKeyProperties = rightJoinKeyProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapSourceJoinInstruction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapSourceJoinInstruction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapSourceJoinInstruction {
        private final java.lang.String leftOperand;
        private final java.lang.String onClause;
        private final java.lang.String rightOperand;
        private final java.lang.String type;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties leftJoinKeyProperties;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties rightJoinKeyProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.leftOperand = software.amazon.jsii.Kernel.get(this, "leftOperand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onClause = software.amazon.jsii.Kernel.get(this, "onClause", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rightOperand = software.amazon.jsii.Kernel.get(this, "rightOperand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.leftJoinKeyProperties = software.amazon.jsii.Kernel.get(this, "leftJoinKeyProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties.class));
            this.rightJoinKeyProperties = software.amazon.jsii.Kernel.get(this, "rightJoinKeyProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.leftOperand = java.util.Objects.requireNonNull(builder.leftOperand, "leftOperand is required");
            this.onClause = java.util.Objects.requireNonNull(builder.onClause, "onClause is required");
            this.rightOperand = java.util.Objects.requireNonNull(builder.rightOperand, "rightOperand is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.leftJoinKeyProperties = builder.leftJoinKeyProperties;
            this.rightJoinKeyProperties = builder.rightJoinKeyProperties;
        }

        @Override
        public final java.lang.String getLeftOperand() {
            return this.leftOperand;
        }

        @Override
        public final java.lang.String getOnClause() {
            return this.onClause;
        }

        @Override
        public final java.lang.String getRightOperand() {
            return this.rightOperand;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties getLeftJoinKeyProperties() {
            return this.leftJoinKeyProperties;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapSourceJoinInstructionRightJoinKeyProperties getRightJoinKeyProperties() {
            return this.rightJoinKeyProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("leftOperand", om.valueToTree(this.getLeftOperand()));
            data.set("onClause", om.valueToTree(this.getOnClause()));
            data.set("rightOperand", om.valueToTree(this.getRightOperand()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getLeftJoinKeyProperties() != null) {
                data.set("leftJoinKeyProperties", om.valueToTree(this.getLeftJoinKeyProperties()));
            }
            if (this.getRightJoinKeyProperties() != null) {
                data.set("rightJoinKeyProperties", om.valueToTree(this.getRightJoinKeyProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstruction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapSourceJoinInstruction.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapSourceJoinInstruction.Jsii$Proxy) o;

            if (!leftOperand.equals(that.leftOperand)) return false;
            if (!onClause.equals(that.onClause)) return false;
            if (!rightOperand.equals(that.rightOperand)) return false;
            if (!type.equals(that.type)) return false;
            if (this.leftJoinKeyProperties != null ? !this.leftJoinKeyProperties.equals(that.leftJoinKeyProperties) : that.leftJoinKeyProperties != null) return false;
            return this.rightJoinKeyProperties != null ? this.rightJoinKeyProperties.equals(that.rightJoinKeyProperties) : that.rightJoinKeyProperties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.leftOperand.hashCode();
            result = 31 * result + (this.onClause.hashCode());
            result = 31 * result + (this.rightOperand.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.leftJoinKeyProperties != null ? this.leftJoinKeyProperties.hashCode() : 0);
            result = 31 * result + (this.rightJoinKeyProperties != null ? this.rightJoinKeyProperties.hashCode() : 0);
            return result;
        }
    }
}
