package imports.aws.sagemaker_workforce;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.353Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkforce.SagemakerWorkforceCognitoConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkforceCognitoConfig.Jsii$Proxy.class)
public interface SagemakerWorkforceCognitoConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#client_id SagemakerWorkforce#client_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#user_pool SagemakerWorkforce#user_pool}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPool();

    /**
     * @return a {@link Builder} of {@link SagemakerWorkforceCognitoConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkforceCognitoConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkforceCognitoConfig> {
        java.lang.String clientId;
        java.lang.String userPool;

        /**
         * Sets the value of {@link SagemakerWorkforceCognitoConfig#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#client_id SagemakerWorkforce#client_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceCognitoConfig#getUserPool}
         * @param userPool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#user_pool SagemakerWorkforce#user_pool}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPool(java.lang.String userPool) {
            this.userPool = userPool;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerWorkforceCognitoConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkforceCognitoConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkforceCognitoConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkforceCognitoConfig {
        private final java.lang.String clientId;
        private final java.lang.String userPool;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientId = software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userPool = software.amazon.jsii.Kernel.get(this, "userPool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientId = java.util.Objects.requireNonNull(builder.clientId, "clientId is required");
            this.userPool = java.util.Objects.requireNonNull(builder.userPool, "userPool is required");
        }

        @Override
        public final java.lang.String getClientId() {
            return this.clientId;
        }

        @Override
        public final java.lang.String getUserPool() {
            return this.userPool;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clientId", om.valueToTree(this.getClientId()));
            data.set("userPool", om.valueToTree(this.getUserPool()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkforce.SagemakerWorkforceCognitoConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkforceCognitoConfig.Jsii$Proxy that = (SagemakerWorkforceCognitoConfig.Jsii$Proxy) o;

            if (!clientId.equals(that.clientId)) return false;
            return this.userPool.equals(that.userPool);
        }

        @Override
        public final int hashCode() {
            int result = this.clientId.hashCode();
            result = 31 * result + (this.userPool.hashCode());
            return result;
        }
    }
}
