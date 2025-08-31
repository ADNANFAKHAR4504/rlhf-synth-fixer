package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.468Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#code_content_type Kinesisanalyticsv2Application#code_content_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCodeContentType();

    /**
     * code_content block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#code_content Kinesisanalyticsv2Application#code_content}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfigurationCodeContent getCodeContent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration> {
        java.lang.String codeContentType;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfigurationCodeContent codeContent;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration#getCodeContentType}
         * @param codeContentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#code_content_type Kinesisanalyticsv2Application#code_content_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder codeContentType(java.lang.String codeContentType) {
            this.codeContentType = codeContentType;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration#getCodeContent}
         * @param codeContent code_content block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#code_content Kinesisanalyticsv2Application#code_content}
         * @return {@code this}
         */
        public Builder codeContent(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfigurationCodeContent codeContent) {
            this.codeContent = codeContent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration {
        private final java.lang.String codeContentType;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfigurationCodeContent codeContent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.codeContentType = software.amazon.jsii.Kernel.get(this, "codeContentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codeContent = software.amazon.jsii.Kernel.get(this, "codeContent", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfigurationCodeContent.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.codeContentType = java.util.Objects.requireNonNull(builder.codeContentType, "codeContentType is required");
            this.codeContent = builder.codeContent;
        }

        @Override
        public final java.lang.String getCodeContentType() {
            return this.codeContentType;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfigurationCodeContent getCodeContent() {
            return this.codeContent;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("codeContentType", om.valueToTree(this.getCodeContentType()));
            if (this.getCodeContent() != null) {
                data.set("codeContent", om.valueToTree(this.getCodeContent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationCodeConfiguration.Jsii$Proxy) o;

            if (!codeContentType.equals(that.codeContentType)) return false;
            return this.codeContent != null ? this.codeContent.equals(that.codeContent) : that.codeContent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.codeContentType.hashCode();
            result = 31 * result + (this.codeContent != null ? this.codeContent.hashCode() : 0);
            return result;
        }
    }
}
