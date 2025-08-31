package imports.aws.shield_proactive_engagement;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.467Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.shieldProactiveEngagement.ShieldProactiveEngagementEmergencyContact")
@software.amazon.jsii.Jsii.Proxy(ShieldProactiveEngagementEmergencyContact.Jsii$Proxy.class)
public interface ShieldProactiveEngagementEmergencyContact extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/shield_proactive_engagement#email_address ShieldProactiveEngagement#email_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEmailAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/shield_proactive_engagement#contact_notes ShieldProactiveEngagement#contact_notes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContactNotes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/shield_proactive_engagement#phone_number ShieldProactiveEngagement#phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumber() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ShieldProactiveEngagementEmergencyContact}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ShieldProactiveEngagementEmergencyContact}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ShieldProactiveEngagementEmergencyContact> {
        java.lang.String emailAddress;
        java.lang.String contactNotes;
        java.lang.String phoneNumber;

        /**
         * Sets the value of {@link ShieldProactiveEngagementEmergencyContact#getEmailAddress}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/shield_proactive_engagement#email_address ShieldProactiveEngagement#email_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder emailAddress(java.lang.String emailAddress) {
            this.emailAddress = emailAddress;
            return this;
        }

        /**
         * Sets the value of {@link ShieldProactiveEngagementEmergencyContact#getContactNotes}
         * @param contactNotes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/shield_proactive_engagement#contact_notes ShieldProactiveEngagement#contact_notes}.
         * @return {@code this}
         */
        public Builder contactNotes(java.lang.String contactNotes) {
            this.contactNotes = contactNotes;
            return this;
        }

        /**
         * Sets the value of {@link ShieldProactiveEngagementEmergencyContact#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/shield_proactive_engagement#phone_number ShieldProactiveEngagement#phone_number}.
         * @return {@code this}
         */
        public Builder phoneNumber(java.lang.String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ShieldProactiveEngagementEmergencyContact}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ShieldProactiveEngagementEmergencyContact build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ShieldProactiveEngagementEmergencyContact}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ShieldProactiveEngagementEmergencyContact {
        private final java.lang.String emailAddress;
        private final java.lang.String contactNotes;
        private final java.lang.String phoneNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.emailAddress = software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contactNotes = software.amazon.jsii.Kernel.get(this, "contactNotes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.emailAddress = java.util.Objects.requireNonNull(builder.emailAddress, "emailAddress is required");
            this.contactNotes = builder.contactNotes;
            this.phoneNumber = builder.phoneNumber;
        }

        @Override
        public final java.lang.String getEmailAddress() {
            return this.emailAddress;
        }

        @Override
        public final java.lang.String getContactNotes() {
            return this.contactNotes;
        }

        @Override
        public final java.lang.String getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("emailAddress", om.valueToTree(this.getEmailAddress()));
            if (this.getContactNotes() != null) {
                data.set("contactNotes", om.valueToTree(this.getContactNotes()));
            }
            if (this.getPhoneNumber() != null) {
                data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.shieldProactiveEngagement.ShieldProactiveEngagementEmergencyContact"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ShieldProactiveEngagementEmergencyContact.Jsii$Proxy that = (ShieldProactiveEngagementEmergencyContact.Jsii$Proxy) o;

            if (!emailAddress.equals(that.emailAddress)) return false;
            if (this.contactNotes != null ? !this.contactNotes.equals(that.contactNotes) : that.contactNotes != null) return false;
            return this.phoneNumber != null ? this.phoneNumber.equals(that.phoneNumber) : that.phoneNumber == null;
        }

        @Override
        public final int hashCode() {
            int result = this.emailAddress.hashCode();
            result = 31 * result + (this.contactNotes != null ? this.contactNotes.hashCode() : 0);
            result = 31 * result + (this.phoneNumber != null ? this.phoneNumber.hashCode() : 0);
            return result;
        }
    }
}
