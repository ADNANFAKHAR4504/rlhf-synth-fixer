package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfiguration")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRowLevelPermissionTagConfiguration.Jsii$Proxy.class)
public interface QuicksightDataSetRowLevelPermissionTagConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * tag_rules block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_rules QuicksightDataSet#tag_rules}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTagRules();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRowLevelPermissionTagConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRowLevelPermissionTagConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRowLevelPermissionTagConfiguration> {
        java.lang.Object tagRules;
        java.lang.String status;

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfiguration#getTagRules}
         * @param tagRules tag_rules block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_rules QuicksightDataSet#tag_rules}
         * @return {@code this}
         */
        public Builder tagRules(com.hashicorp.cdktf.IResolvable tagRules) {
            this.tagRules = tagRules;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfiguration#getTagRules}
         * @param tagRules tag_rules block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_rules QuicksightDataSet#tag_rules}
         * @return {@code this}
         */
        public Builder tagRules(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfigurationTagRules> tagRules) {
            this.tagRules = tagRules;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfiguration#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#status QuicksightDataSet#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRowLevelPermissionTagConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRowLevelPermissionTagConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRowLevelPermissionTagConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRowLevelPermissionTagConfiguration {
        private final java.lang.Object tagRules;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tagRules = software.amazon.jsii.Kernel.get(this, "tagRules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tagRules = java.util.Objects.requireNonNull(builder.tagRules, "tagRules is required");
            this.status = builder.status;
        }

        @Override
        public final java.lang.Object getTagRules() {
            return this.tagRules;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("tagRules", om.valueToTree(this.getTagRules()));
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRowLevelPermissionTagConfiguration.Jsii$Proxy that = (QuicksightDataSetRowLevelPermissionTagConfiguration.Jsii$Proxy) o;

            if (!tagRules.equals(that.tagRules)) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tagRules.hashCode();
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
