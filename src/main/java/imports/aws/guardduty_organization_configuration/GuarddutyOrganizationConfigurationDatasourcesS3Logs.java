package imports.aws.guardduty_organization_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.325Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyOrganizationConfiguration.GuarddutyOrganizationConfigurationDatasourcesS3Logs")
@software.amazon.jsii.Jsii.Proxy(GuarddutyOrganizationConfigurationDatasourcesS3Logs.Jsii$Proxy.class)
public interface GuarddutyOrganizationConfigurationDatasourcesS3Logs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#auto_enable GuarddutyOrganizationConfiguration#auto_enable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAutoEnable();

    /**
     * @return a {@link Builder} of {@link GuarddutyOrganizationConfigurationDatasourcesS3Logs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyOrganizationConfigurationDatasourcesS3Logs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyOrganizationConfigurationDatasourcesS3Logs> {
        java.lang.Object autoEnable;

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationDatasourcesS3Logs#getAutoEnable}
         * @param autoEnable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#auto_enable GuarddutyOrganizationConfiguration#auto_enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoEnable(java.lang.Boolean autoEnable) {
            this.autoEnable = autoEnable;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationDatasourcesS3Logs#getAutoEnable}
         * @param autoEnable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration#auto_enable GuarddutyOrganizationConfiguration#auto_enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoEnable(com.hashicorp.cdktf.IResolvable autoEnable) {
            this.autoEnable = autoEnable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyOrganizationConfigurationDatasourcesS3Logs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyOrganizationConfigurationDatasourcesS3Logs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyOrganizationConfigurationDatasourcesS3Logs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyOrganizationConfigurationDatasourcesS3Logs {
        private final java.lang.Object autoEnable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoEnable = software.amazon.jsii.Kernel.get(this, "autoEnable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoEnable = java.util.Objects.requireNonNull(builder.autoEnable, "autoEnable is required");
        }

        @Override
        public final java.lang.Object getAutoEnable() {
            return this.autoEnable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("autoEnable", om.valueToTree(this.getAutoEnable()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyOrganizationConfiguration.GuarddutyOrganizationConfigurationDatasourcesS3Logs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyOrganizationConfigurationDatasourcesS3Logs.Jsii$Proxy that = (GuarddutyOrganizationConfigurationDatasourcesS3Logs.Jsii$Proxy) o;

            return this.autoEnable.equals(that.autoEnable);
        }

        @Override
        public final int hashCode() {
            int result = this.autoEnable.hashCode();
            return result;
        }
    }
}
