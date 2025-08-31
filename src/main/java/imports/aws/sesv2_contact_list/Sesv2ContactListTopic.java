package imports.aws.sesv2_contact_list;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.458Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ContactList.Sesv2ContactListTopic")
@software.amazon.jsii.Jsii.Proxy(Sesv2ContactListTopic.Jsii$Proxy.class)
public interface Sesv2ContactListTopic extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#default_subscription_status Sesv2ContactList#default_subscription_status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultSubscriptionStatus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#display_name Sesv2ContactList#display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#topic_name Sesv2ContactList#topic_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#description Sesv2ContactList#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ContactListTopic}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ContactListTopic}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ContactListTopic> {
        java.lang.String defaultSubscriptionStatus;
        java.lang.String displayName;
        java.lang.String topicName;
        java.lang.String description;

        /**
         * Sets the value of {@link Sesv2ContactListTopic#getDefaultSubscriptionStatus}
         * @param defaultSubscriptionStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#default_subscription_status Sesv2ContactList#default_subscription_status}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultSubscriptionStatus(java.lang.String defaultSubscriptionStatus) {
            this.defaultSubscriptionStatus = defaultSubscriptionStatus;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ContactListTopic#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#display_name Sesv2ContactList#display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ContactListTopic#getTopicName}
         * @param topicName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#topic_name Sesv2ContactList#topic_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicName(java.lang.String topicName) {
            this.topicName = topicName;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ContactListTopic#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_contact_list#description Sesv2ContactList#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ContactListTopic}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ContactListTopic build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ContactListTopic}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ContactListTopic {
        private final java.lang.String defaultSubscriptionStatus;
        private final java.lang.String displayName;
        private final java.lang.String topicName;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultSubscriptionStatus = software.amazon.jsii.Kernel.get(this, "defaultSubscriptionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicName = software.amazon.jsii.Kernel.get(this, "topicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultSubscriptionStatus = java.util.Objects.requireNonNull(builder.defaultSubscriptionStatus, "defaultSubscriptionStatus is required");
            this.displayName = java.util.Objects.requireNonNull(builder.displayName, "displayName is required");
            this.topicName = java.util.Objects.requireNonNull(builder.topicName, "topicName is required");
            this.description = builder.description;
        }

        @Override
        public final java.lang.String getDefaultSubscriptionStatus() {
            return this.defaultSubscriptionStatus;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.lang.String getTopicName() {
            return this.topicName;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultSubscriptionStatus", om.valueToTree(this.getDefaultSubscriptionStatus()));
            data.set("displayName", om.valueToTree(this.getDisplayName()));
            data.set("topicName", om.valueToTree(this.getTopicName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ContactList.Sesv2ContactListTopic"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ContactListTopic.Jsii$Proxy that = (Sesv2ContactListTopic.Jsii$Proxy) o;

            if (!defaultSubscriptionStatus.equals(that.defaultSubscriptionStatus)) return false;
            if (!displayName.equals(that.displayName)) return false;
            if (!topicName.equals(that.topicName)) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultSubscriptionStatus.hashCode();
            result = 31 * result + (this.displayName.hashCode());
            result = 31 * result + (this.topicName.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
