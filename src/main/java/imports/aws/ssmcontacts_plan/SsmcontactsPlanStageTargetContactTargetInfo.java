package imports.aws.ssmcontacts_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsPlan.SsmcontactsPlanStageTargetContactTargetInfo")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsPlanStageTargetContactTargetInfo.Jsii$Proxy.class)
public interface SsmcontactsPlanStageTargetContactTargetInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#is_essential SsmcontactsPlan#is_essential}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getIsEssential();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContactId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsPlanStageTargetContactTargetInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsPlanStageTargetContactTargetInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsPlanStageTargetContactTargetInfo> {
        java.lang.Object isEssential;
        java.lang.String contactId;

        /**
         * Sets the value of {@link SsmcontactsPlanStageTargetContactTargetInfo#getIsEssential}
         * @param isEssential Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#is_essential SsmcontactsPlan#is_essential}. This parameter is required.
         * @return {@code this}
         */
        public Builder isEssential(java.lang.Boolean isEssential) {
            this.isEssential = isEssential;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsPlanStageTargetContactTargetInfo#getIsEssential}
         * @param isEssential Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#is_essential SsmcontactsPlan#is_essential}. This parameter is required.
         * @return {@code this}
         */
        public Builder isEssential(com.hashicorp.cdktf.IResolvable isEssential) {
            this.isEssential = isEssential;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsPlanStageTargetContactTargetInfo#getContactId}
         * @param contactId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.
         * @return {@code this}
         */
        public Builder contactId(java.lang.String contactId) {
            this.contactId = contactId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsPlanStageTargetContactTargetInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsPlanStageTargetContactTargetInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsPlanStageTargetContactTargetInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsPlanStageTargetContactTargetInfo {
        private final java.lang.Object isEssential;
        private final java.lang.String contactId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.isEssential = software.amazon.jsii.Kernel.get(this, "isEssential", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.contactId = software.amazon.jsii.Kernel.get(this, "contactId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.isEssential = java.util.Objects.requireNonNull(builder.isEssential, "isEssential is required");
            this.contactId = builder.contactId;
        }

        @Override
        public final java.lang.Object getIsEssential() {
            return this.isEssential;
        }

        @Override
        public final java.lang.String getContactId() {
            return this.contactId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("isEssential", om.valueToTree(this.getIsEssential()));
            if (this.getContactId() != null) {
                data.set("contactId", om.valueToTree(this.getContactId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsPlan.SsmcontactsPlanStageTargetContactTargetInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsPlanStageTargetContactTargetInfo.Jsii$Proxy that = (SsmcontactsPlanStageTargetContactTargetInfo.Jsii$Proxy) o;

            if (!isEssential.equals(that.isEssential)) return false;
            return this.contactId != null ? this.contactId.equals(that.contactId) : that.contactId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.isEssential.hashCode();
            result = 31 * result + (this.contactId != null ? this.contactId.hashCode() : 0);
            return result;
        }
    }
}
