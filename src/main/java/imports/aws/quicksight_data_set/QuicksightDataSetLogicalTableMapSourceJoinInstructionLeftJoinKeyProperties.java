package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUniqueKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties> {
        java.lang.Object uniqueKey;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties#getUniqueKey}
         * @param uniqueKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
         * @return {@code this}
         */
        public Builder uniqueKey(java.lang.Boolean uniqueKey) {
            this.uniqueKey = uniqueKey;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties#getUniqueKey}
         * @param uniqueKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#unique_key QuicksightDataSet#unique_key}.
         * @return {@code this}
         */
        public Builder uniqueKey(com.hashicorp.cdktf.IResolvable uniqueKey) {
            this.uniqueKey = uniqueKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties {
        private final java.lang.Object uniqueKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.uniqueKey = software.amazon.jsii.Kernel.get(this, "uniqueKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.uniqueKey = builder.uniqueKey;
        }

        @Override
        public final java.lang.Object getUniqueKey() {
            return this.uniqueKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getUniqueKey() != null) {
                data.set("uniqueKey", om.valueToTree(this.getUniqueKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapSourceJoinInstructionLeftJoinKeyProperties.Jsii$Proxy) o;

            return this.uniqueKey != null ? this.uniqueKey.equals(that.uniqueKey) : that.uniqueKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.uniqueKey != null ? this.uniqueKey.hashCode() : 0;
            return result;
        }
    }
}
