package imports.aws.guardduty_detector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.316Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyDetector.GuarddutyDetectorDatasourcesS3Logs")
@software.amazon.jsii.Jsii.Proxy(GuarddutyDetectorDatasourcesS3Logs.Jsii$Proxy.class)
public interface GuarddutyDetectorDatasourcesS3Logs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector#enable GuarddutyDetector#enable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnable();

    /**
     * @return a {@link Builder} of {@link GuarddutyDetectorDatasourcesS3Logs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyDetectorDatasourcesS3Logs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyDetectorDatasourcesS3Logs> {
        java.lang.Object enable;

        /**
         * Sets the value of {@link GuarddutyDetectorDatasourcesS3Logs#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector#enable GuarddutyDetector#enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder enable(java.lang.Boolean enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyDetectorDatasourcesS3Logs#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_detector#enable GuarddutyDetector#enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder enable(com.hashicorp.cdktf.IResolvable enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyDetectorDatasourcesS3Logs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyDetectorDatasourcesS3Logs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyDetectorDatasourcesS3Logs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyDetectorDatasourcesS3Logs {
        private final java.lang.Object enable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enable = software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enable = java.util.Objects.requireNonNull(builder.enable, "enable is required");
        }

        @Override
        public final java.lang.Object getEnable() {
            return this.enable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enable", om.valueToTree(this.getEnable()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyDetector.GuarddutyDetectorDatasourcesS3Logs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyDetectorDatasourcesS3Logs.Jsii$Proxy that = (GuarddutyDetectorDatasourcesS3Logs.Jsii$Proxy) o;

            return this.enable.equals(that.enable);
        }

        @Override
        public final int hashCode() {
            int result = this.enable.hashCode();
            return result;
        }
    }
}
