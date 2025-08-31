package imports.aws.ecr_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRepository.EcrRepositoryImageScanningConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcrRepositoryImageScanningConfiguration.Jsii$Proxy.class)
public interface EcrRepositoryImageScanningConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#scan_on_push EcrRepository#scan_on_push}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getScanOnPush();

    /**
     * @return a {@link Builder} of {@link EcrRepositoryImageScanningConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrRepositoryImageScanningConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrRepositoryImageScanningConfiguration> {
        java.lang.Object scanOnPush;

        /**
         * Sets the value of {@link EcrRepositoryImageScanningConfiguration#getScanOnPush}
         * @param scanOnPush Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#scan_on_push EcrRepository#scan_on_push}. This parameter is required.
         * @return {@code this}
         */
        public Builder scanOnPush(java.lang.Boolean scanOnPush) {
            this.scanOnPush = scanOnPush;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryImageScanningConfiguration#getScanOnPush}
         * @param scanOnPush Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#scan_on_push EcrRepository#scan_on_push}. This parameter is required.
         * @return {@code this}
         */
        public Builder scanOnPush(com.hashicorp.cdktf.IResolvable scanOnPush) {
            this.scanOnPush = scanOnPush;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrRepositoryImageScanningConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrRepositoryImageScanningConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrRepositoryImageScanningConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrRepositoryImageScanningConfiguration {
        private final java.lang.Object scanOnPush;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.scanOnPush = software.amazon.jsii.Kernel.get(this, "scanOnPush", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.scanOnPush = java.util.Objects.requireNonNull(builder.scanOnPush, "scanOnPush is required");
        }

        @Override
        public final java.lang.Object getScanOnPush() {
            return this.scanOnPush;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("scanOnPush", om.valueToTree(this.getScanOnPush()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrRepository.EcrRepositoryImageScanningConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrRepositoryImageScanningConfiguration.Jsii$Proxy that = (EcrRepositoryImageScanningConfiguration.Jsii$Proxy) o;

            return this.scanOnPush.equals(that.scanOnPush);
        }

        @Override
        public final int hashCode() {
            int result = this.scanOnPush.hashCode();
            return result;
        }
    }
}
