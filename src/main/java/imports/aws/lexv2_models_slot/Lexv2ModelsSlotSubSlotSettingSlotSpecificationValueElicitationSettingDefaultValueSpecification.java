package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.779Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_value_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#default_value_list Lexv2ModelsSlot#default_value_list}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultValueList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification> {
        java.lang.Object defaultValueList;

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification#getDefaultValueList}
         * @param defaultValueList default_value_list block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#default_value_list Lexv2ModelsSlot#default_value_list}
         * @return {@code this}
         */
        public Builder defaultValueList(com.hashicorp.cdktf.IResolvable defaultValueList) {
            this.defaultValueList = defaultValueList;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification#getDefaultValueList}
         * @param defaultValueList default_value_list block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#default_value_list Lexv2ModelsSlot#default_value_list}
         * @return {@code this}
         */
        public Builder defaultValueList(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecificationDefaultValueListStruct> defaultValueList) {
            this.defaultValueList = defaultValueList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification {
        private final java.lang.Object defaultValueList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultValueList = software.amazon.jsii.Kernel.get(this, "defaultValueList", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultValueList = builder.defaultValueList;
        }

        @Override
        public final java.lang.Object getDefaultValueList() {
            return this.defaultValueList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultValueList() != null) {
                data.set("defaultValueList", om.valueToTree(this.getDefaultValueList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification.Jsii$Proxy that = (Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingDefaultValueSpecification.Jsii$Proxy) o;

            return this.defaultValueList != null ? this.defaultValueList.equals(that.defaultValueList) : that.defaultValueList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultValueList != null ? this.defaultValueList.hashCode() : 0;
            return result;
        }
    }
}
