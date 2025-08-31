package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * property_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#property_group Kinesisanalyticsv2Application#property_group}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPropertyGroup();

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties> {
        java.lang.Object propertyGroup;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties#getPropertyGroup}
         * @param propertyGroup property_group block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#property_group Kinesisanalyticsv2Application#property_group}
         * @return {@code this}
         */
        public Builder propertyGroup(com.hashicorp.cdktf.IResolvable propertyGroup) {
            this.propertyGroup = propertyGroup;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties#getPropertyGroup}
         * @param propertyGroup property_group block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#property_group Kinesisanalyticsv2Application#property_group}
         * @return {@code this}
         */
        public Builder propertyGroup(java.util.List<? extends imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentPropertiesPropertyGroup> propertyGroup) {
            this.propertyGroup = propertyGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties {
        private final java.lang.Object propertyGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.propertyGroup = software.amazon.jsii.Kernel.get(this, "propertyGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.propertyGroup = java.util.Objects.requireNonNull(builder.propertyGroup, "propertyGroup is required");
        }

        @Override
        public final java.lang.Object getPropertyGroup() {
            return this.propertyGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("propertyGroup", om.valueToTree(this.getPropertyGroup()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationEnvironmentProperties.Jsii$Proxy) o;

            return this.propertyGroup.equals(that.propertyGroup);
        }

        @Override
        public final int hashCode() {
            int result = this.propertyGroup.hashCode();
            return result;
        }
    }
}
