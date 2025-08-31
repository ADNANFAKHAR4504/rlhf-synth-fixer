package imports.aws.ivschat_room;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.426Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivschatRoom.IvschatRoomMessageReviewHandler")
@software.amazon.jsii.Jsii.Proxy(IvschatRoomMessageReviewHandler.Jsii$Proxy.class)
public interface IvschatRoomMessageReviewHandler extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#fallback_result IvschatRoom#fallback_result}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFallbackResult() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#uri IvschatRoom#uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IvschatRoomMessageReviewHandler}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IvschatRoomMessageReviewHandler}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IvschatRoomMessageReviewHandler> {
        java.lang.String fallbackResult;
        java.lang.String uri;

        /**
         * Sets the value of {@link IvschatRoomMessageReviewHandler#getFallbackResult}
         * @param fallbackResult Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#fallback_result IvschatRoom#fallback_result}.
         * @return {@code this}
         */
        public Builder fallbackResult(java.lang.String fallbackResult) {
            this.fallbackResult = fallbackResult;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomMessageReviewHandler#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#uri IvschatRoom#uri}.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IvschatRoomMessageReviewHandler}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IvschatRoomMessageReviewHandler build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IvschatRoomMessageReviewHandler}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IvschatRoomMessageReviewHandler {
        private final java.lang.String fallbackResult;
        private final java.lang.String uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fallbackResult = software.amazon.jsii.Kernel.get(this, "fallbackResult", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fallbackResult = builder.fallbackResult;
            this.uri = builder.uri;
        }

        @Override
        public final java.lang.String getFallbackResult() {
            return this.fallbackResult;
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFallbackResult() != null) {
                data.set("fallbackResult", om.valueToTree(this.getFallbackResult()));
            }
            if (this.getUri() != null) {
                data.set("uri", om.valueToTree(this.getUri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ivschatRoom.IvschatRoomMessageReviewHandler"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IvschatRoomMessageReviewHandler.Jsii$Proxy that = (IvschatRoomMessageReviewHandler.Jsii$Proxy) o;

            if (this.fallbackResult != null ? !this.fallbackResult.equals(that.fallbackResult) : that.fallbackResult != null) return false;
            return this.uri != null ? this.uri.equals(that.uri) : that.uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fallbackResult != null ? this.fallbackResult.hashCode() : 0;
            result = 31 * result + (this.uri != null ? this.uri.hashCode() : 0);
            return result;
        }
    }
}
