package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupApiSchemaS3")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupApiSchemaS3.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupApiSchemaS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3_bucket_name BedrockagentAgentActionGroup#s3_bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3BucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3_object_key BedrockagentAgentActionGroup#s3_object_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupApiSchemaS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupApiSchemaS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupApiSchemaS3> {
        java.lang.String s3BucketName;
        java.lang.String s3ObjectKey;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupApiSchemaS3#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3_bucket_name BedrockagentAgentActionGroup#s3_bucket_name}.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupApiSchemaS3#getS3ObjectKey}
         * @param s3ObjectKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3_object_key BedrockagentAgentActionGroup#s3_object_key}.
         * @return {@code this}
         */
        public Builder s3ObjectKey(java.lang.String s3ObjectKey) {
            this.s3ObjectKey = s3ObjectKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentActionGroupApiSchemaS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupApiSchemaS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupApiSchemaS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupApiSchemaS3 {
        private final java.lang.String s3BucketName;
        private final java.lang.String s3ObjectKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ObjectKey = software.amazon.jsii.Kernel.get(this, "s3ObjectKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3BucketName = builder.s3BucketName;
            this.s3ObjectKey = builder.s3ObjectKey;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3ObjectKey() {
            return this.s3ObjectKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3BucketName() != null) {
                data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            }
            if (this.getS3ObjectKey() != null) {
                data.set("s3ObjectKey", om.valueToTree(this.getS3ObjectKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupApiSchemaS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupApiSchemaS3.Jsii$Proxy that = (BedrockagentAgentActionGroupApiSchemaS3.Jsii$Proxy) o;

            if (this.s3BucketName != null ? !this.s3BucketName.equals(that.s3BucketName) : that.s3BucketName != null) return false;
            return this.s3ObjectKey != null ? this.s3ObjectKey.equals(that.s3ObjectKey) : that.s3ObjectKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3BucketName != null ? this.s3BucketName.hashCode() : 0;
            result = 31 * result + (this.s3ObjectKey != null ? this.s3ObjectKey.hashCode() : 0);
            return result;
        }
    }
}
