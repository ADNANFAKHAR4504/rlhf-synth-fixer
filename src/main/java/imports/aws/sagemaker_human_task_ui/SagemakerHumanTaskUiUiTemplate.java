package imports.aws.sagemaker_human_task_ui;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.329Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerHumanTaskUi.SagemakerHumanTaskUiUiTemplate")
@software.amazon.jsii.Jsii.Proxy(SagemakerHumanTaskUiUiTemplate.Jsii$Proxy.class)
public interface SagemakerHumanTaskUiUiTemplate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_human_task_ui#content SagemakerHumanTaskUi#content}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerHumanTaskUiUiTemplate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerHumanTaskUiUiTemplate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerHumanTaskUiUiTemplate> {
        java.lang.String content;

        /**
         * Sets the value of {@link SagemakerHumanTaskUiUiTemplate#getContent}
         * @param content Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_human_task_ui#content SagemakerHumanTaskUi#content}.
         * @return {@code this}
         */
        public Builder content(java.lang.String content) {
            this.content = content;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerHumanTaskUiUiTemplate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerHumanTaskUiUiTemplate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerHumanTaskUiUiTemplate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerHumanTaskUiUiTemplate {
        private final java.lang.String content;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.content = software.amazon.jsii.Kernel.get(this, "content", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.content = builder.content;
        }

        @Override
        public final java.lang.String getContent() {
            return this.content;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContent() != null) {
                data.set("content", om.valueToTree(this.getContent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerHumanTaskUi.SagemakerHumanTaskUiUiTemplate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerHumanTaskUiUiTemplate.Jsii$Proxy that = (SagemakerHumanTaskUiUiTemplate.Jsii$Proxy) o;

            return this.content != null ? this.content.equals(that.content) : that.content == null;
        }

        @Override
        public final int hashCode() {
            int result = this.content != null ? this.content.hashCode() : 0;
            return result;
        }
    }
}
