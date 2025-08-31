package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.644Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#map_block_key Lexv2ModelsIntent#map_block_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#shape Lexv2ModelsIntent#shape}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getShape() {
        return null;
    }

    /**
     * value block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#value Lexv2ModelsIntent#value}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot> {
        java.lang.String mapBlockKey;
        java.lang.String shape;
        java.lang.Object value;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot#getMapBlockKey}
         * @param mapBlockKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#map_block_key Lexv2ModelsIntent#map_block_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder mapBlockKey(java.lang.String mapBlockKey) {
            this.mapBlockKey = mapBlockKey;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot#getShape}
         * @param shape Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#shape Lexv2ModelsIntent#shape}.
         * @return {@code this}
         */
        public Builder shape(java.lang.String shape) {
            this.shape = shape;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot#getValue}
         * @param value value block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#value Lexv2ModelsIntent#value}
         * @return {@code this}
         */
        public Builder value(com.hashicorp.cdktf.IResolvable value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot#getValue}
         * @param value value block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#value Lexv2ModelsIntent#value}
         * @return {@code this}
         */
        public Builder value(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlotValue> value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot {
        private final java.lang.String mapBlockKey;
        private final java.lang.String shape;
        private final java.lang.Object value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mapBlockKey = software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shape = software.amazon.jsii.Kernel.get(this, "shape", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mapBlockKey = java.util.Objects.requireNonNull(builder.mapBlockKey, "mapBlockKey is required");
            this.shape = builder.shape;
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getMapBlockKey() {
            return this.mapBlockKey;
        }

        @Override
        public final java.lang.String getShape() {
            return this.shape;
        }

        @Override
        public final java.lang.Object getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mapBlockKey", om.valueToTree(this.getMapBlockKey()));
            if (this.getShape() != null) {
                data.set("shape", om.valueToTree(this.getShape()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchNextStepIntentSlot.Jsii$Proxy) o;

            if (!mapBlockKey.equals(that.mapBlockKey)) return false;
            if (this.shape != null ? !this.shape.equals(that.shape) : that.shape != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mapBlockKey.hashCode();
            result = 31 * result + (this.shape != null ? this.shape.hashCode() : 0);
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
