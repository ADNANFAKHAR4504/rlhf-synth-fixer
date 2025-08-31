package imports.aws.iot_provisioning_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.404Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotProvisioningTemplate.IotProvisioningTemplatePreProvisioningHook")
@software.amazon.jsii.Jsii.Proxy(IotProvisioningTemplatePreProvisioningHook.Jsii$Proxy.class)
public interface IotProvisioningTemplatePreProvisioningHook extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_provisioning_template#target_arn IotProvisioningTemplate#target_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_provisioning_template#payload_version IotProvisioningTemplate#payload_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPayloadVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotProvisioningTemplatePreProvisioningHook}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotProvisioningTemplatePreProvisioningHook}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotProvisioningTemplatePreProvisioningHook> {
        java.lang.String targetArn;
        java.lang.String payloadVersion;

        /**
         * Sets the value of {@link IotProvisioningTemplatePreProvisioningHook#getTargetArn}
         * @param targetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_provisioning_template#target_arn IotProvisioningTemplate#target_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetArn(java.lang.String targetArn) {
            this.targetArn = targetArn;
            return this;
        }

        /**
         * Sets the value of {@link IotProvisioningTemplatePreProvisioningHook#getPayloadVersion}
         * @param payloadVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_provisioning_template#payload_version IotProvisioningTemplate#payload_version}.
         * @return {@code this}
         */
        public Builder payloadVersion(java.lang.String payloadVersion) {
            this.payloadVersion = payloadVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotProvisioningTemplatePreProvisioningHook}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotProvisioningTemplatePreProvisioningHook build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotProvisioningTemplatePreProvisioningHook}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotProvisioningTemplatePreProvisioningHook {
        private final java.lang.String targetArn;
        private final java.lang.String payloadVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetArn = software.amazon.jsii.Kernel.get(this, "targetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.payloadVersion = software.amazon.jsii.Kernel.get(this, "payloadVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetArn = java.util.Objects.requireNonNull(builder.targetArn, "targetArn is required");
            this.payloadVersion = builder.payloadVersion;
        }

        @Override
        public final java.lang.String getTargetArn() {
            return this.targetArn;
        }

        @Override
        public final java.lang.String getPayloadVersion() {
            return this.payloadVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetArn", om.valueToTree(this.getTargetArn()));
            if (this.getPayloadVersion() != null) {
                data.set("payloadVersion", om.valueToTree(this.getPayloadVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotProvisioningTemplate.IotProvisioningTemplatePreProvisioningHook"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotProvisioningTemplatePreProvisioningHook.Jsii$Proxy that = (IotProvisioningTemplatePreProvisioningHook.Jsii$Proxy) o;

            if (!targetArn.equals(that.targetArn)) return false;
            return this.payloadVersion != null ? this.payloadVersion.equals(that.payloadVersion) : that.payloadVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetArn.hashCode();
            result = 31 * result + (this.payloadVersion != null ? this.payloadVersion.hashCode() : 0);
            return result;
        }
    }
}
