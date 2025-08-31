package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.435Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration.Jsii$Proxy.class)
public interface KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#group_attribute_field KendraIndex#group_attribute_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGroupAttributeField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_name_attribute_field KendraIndex#user_name_attribute_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserNameAttributeField();

    /**
     * @return a {@link Builder} of {@link KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration> {
        java.lang.String groupAttributeField;
        java.lang.String userNameAttributeField;

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration#getGroupAttributeField}
         * @param groupAttributeField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#group_attribute_field KendraIndex#group_attribute_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder groupAttributeField(java.lang.String groupAttributeField) {
            this.groupAttributeField = groupAttributeField;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration#getUserNameAttributeField}
         * @param userNameAttributeField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_name_attribute_field KendraIndex#user_name_attribute_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder userNameAttributeField(java.lang.String userNameAttributeField) {
            this.userNameAttributeField = userNameAttributeField;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration {
        private final java.lang.String groupAttributeField;
        private final java.lang.String userNameAttributeField;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.groupAttributeField = software.amazon.jsii.Kernel.get(this, "groupAttributeField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userNameAttributeField = software.amazon.jsii.Kernel.get(this, "userNameAttributeField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.groupAttributeField = java.util.Objects.requireNonNull(builder.groupAttributeField, "groupAttributeField is required");
            this.userNameAttributeField = java.util.Objects.requireNonNull(builder.userNameAttributeField, "userNameAttributeField is required");
        }

        @Override
        public final java.lang.String getGroupAttributeField() {
            return this.groupAttributeField;
        }

        @Override
        public final java.lang.String getUserNameAttributeField() {
            return this.userNameAttributeField;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("groupAttributeField", om.valueToTree(this.getGroupAttributeField()));
            data.set("userNameAttributeField", om.valueToTree(this.getUserNameAttributeField()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration.Jsii$Proxy that = (KendraIndexUserTokenConfigurationsJsonTokenTypeConfiguration.Jsii$Proxy) o;

            if (!groupAttributeField.equals(that.groupAttributeField)) return false;
            return this.userNameAttributeField.equals(that.userNameAttributeField);
        }

        @Override
        public final int hashCode() {
            int result = this.groupAttributeField.hashCode();
            result = 31 * result + (this.userNameAttributeField.hashCode());
            return result;
        }
    }
}
