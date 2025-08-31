package imports.aws.cloudtrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.263Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.CloudtrailInsightSelector")
@software.amazon.jsii.Jsii.Proxy(CloudtrailInsightSelector.Jsii$Proxy.class)
public interface CloudtrailInsightSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_type Cloudtrail#insight_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInsightType();

    /**
     * @return a {@link Builder} of {@link CloudtrailInsightSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudtrailInsightSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudtrailInsightSelector> {
        java.lang.String insightType;

        /**
         * Sets the value of {@link CloudtrailInsightSelector#getInsightType}
         * @param insightType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_type Cloudtrail#insight_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder insightType(java.lang.String insightType) {
            this.insightType = insightType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudtrailInsightSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudtrailInsightSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudtrailInsightSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudtrailInsightSelector {
        private final java.lang.String insightType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.insightType = software.amazon.jsii.Kernel.get(this, "insightType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.insightType = java.util.Objects.requireNonNull(builder.insightType, "insightType is required");
        }

        @Override
        public final java.lang.String getInsightType() {
            return this.insightType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("insightType", om.valueToTree(this.getInsightType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudtrail.CloudtrailInsightSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudtrailInsightSelector.Jsii$Proxy that = (CloudtrailInsightSelector.Jsii$Proxy) o;

            return this.insightType.equals(that.insightType);
        }

        @Override
        public final int hashCode() {
            int result = this.insightType.hashCode();
            return result;
        }
    }
}
