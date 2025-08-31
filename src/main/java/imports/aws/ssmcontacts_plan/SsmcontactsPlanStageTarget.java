package imports.aws.ssmcontacts_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsPlan.SsmcontactsPlanStageTarget")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsPlanStageTarget.Jsii$Proxy.class)
public interface SsmcontactsPlanStageTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * channel_target_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#channel_target_info SsmcontactsPlan#channel_target_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo getChannelTargetInfo() {
        return null;
    }

    /**
     * contact_target_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_target_info SsmcontactsPlan#contact_target_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo getContactTargetInfo() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsPlanStageTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsPlanStageTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsPlanStageTarget> {
        imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo channelTargetInfo;
        imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo contactTargetInfo;

        /**
         * Sets the value of {@link SsmcontactsPlanStageTarget#getChannelTargetInfo}
         * @param channelTargetInfo channel_target_info block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#channel_target_info SsmcontactsPlan#channel_target_info}
         * @return {@code this}
         */
        public Builder channelTargetInfo(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo channelTargetInfo) {
            this.channelTargetInfo = channelTargetInfo;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsPlanStageTarget#getContactTargetInfo}
         * @param contactTargetInfo contact_target_info block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_target_info SsmcontactsPlan#contact_target_info}
         * @return {@code this}
         */
        public Builder contactTargetInfo(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo contactTargetInfo) {
            this.contactTargetInfo = contactTargetInfo;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsPlanStageTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsPlanStageTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsPlanStageTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsPlanStageTarget {
        private final imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo channelTargetInfo;
        private final imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo contactTargetInfo;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.channelTargetInfo = software.amazon.jsii.Kernel.get(this, "channelTargetInfo", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo.class));
            this.contactTargetInfo = software.amazon.jsii.Kernel.get(this, "contactTargetInfo", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.channelTargetInfo = builder.channelTargetInfo;
            this.contactTargetInfo = builder.contactTargetInfo;
        }

        @Override
        public final imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo getChannelTargetInfo() {
            return this.channelTargetInfo;
        }

        @Override
        public final imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo getContactTargetInfo() {
            return this.contactTargetInfo;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getChannelTargetInfo() != null) {
                data.set("channelTargetInfo", om.valueToTree(this.getChannelTargetInfo()));
            }
            if (this.getContactTargetInfo() != null) {
                data.set("contactTargetInfo", om.valueToTree(this.getContactTargetInfo()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsPlan.SsmcontactsPlanStageTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsPlanStageTarget.Jsii$Proxy that = (SsmcontactsPlanStageTarget.Jsii$Proxy) o;

            if (this.channelTargetInfo != null ? !this.channelTargetInfo.equals(that.channelTargetInfo) : that.channelTargetInfo != null) return false;
            return this.contactTargetInfo != null ? this.contactTargetInfo.equals(that.contactTargetInfo) : that.contactTargetInfo == null;
        }

        @Override
        public final int hashCode() {
            int result = this.channelTargetInfo != null ? this.channelTargetInfo.hashCode() : 0;
            result = 31 * result + (this.contactTargetInfo != null ? this.contactTargetInfo.hashCode() : 0);
            return result;
        }
    }
}
