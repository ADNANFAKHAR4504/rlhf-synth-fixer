package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.913Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplication")
@software.amazon.jsii.Jsii.Proxy(MskReplicatorReplicationInfoListTopicReplication.Jsii$Proxy.class)
public interface MskReplicatorReplicationInfoListTopicReplication extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_replicate MskReplicator#topics_to_replicate}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTopicsToReplicate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_access_control_lists_for_topics MskReplicator#copy_access_control_lists_for_topics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyAccessControlListsForTopics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_topic_configurations MskReplicator#copy_topic_configurations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTopicConfigurations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_topics MskReplicator#detect_and_copy_new_topics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDetectAndCopyNewTopics() {
        return null;
    }

    /**
     * starting_position block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#starting_position MskReplicator#starting_position}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition getStartingPosition() {
        return null;
    }

    /**
     * topic_name_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_name_configuration MskReplicator#topic_name_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration getTopicNameConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_exclude MskReplicator#topics_to_exclude}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTopicsToExclude() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskReplicatorReplicationInfoListTopicReplication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskReplicatorReplicationInfoListTopicReplication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskReplicatorReplicationInfoListTopicReplication> {
        java.util.List<java.lang.String> topicsToReplicate;
        java.lang.Object copyAccessControlListsForTopics;
        java.lang.Object copyTopicConfigurations;
        java.lang.Object detectAndCopyNewTopics;
        imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition startingPosition;
        imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration topicNameConfiguration;
        java.util.List<java.lang.String> topicsToExclude;

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getTopicsToReplicate}
         * @param topicsToReplicate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_replicate MskReplicator#topics_to_replicate}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicsToReplicate(java.util.List<java.lang.String> topicsToReplicate) {
            this.topicsToReplicate = topicsToReplicate;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getCopyAccessControlListsForTopics}
         * @param copyAccessControlListsForTopics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_access_control_lists_for_topics MskReplicator#copy_access_control_lists_for_topics}.
         * @return {@code this}
         */
        public Builder copyAccessControlListsForTopics(java.lang.Boolean copyAccessControlListsForTopics) {
            this.copyAccessControlListsForTopics = copyAccessControlListsForTopics;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getCopyAccessControlListsForTopics}
         * @param copyAccessControlListsForTopics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_access_control_lists_for_topics MskReplicator#copy_access_control_lists_for_topics}.
         * @return {@code this}
         */
        public Builder copyAccessControlListsForTopics(com.hashicorp.cdktf.IResolvable copyAccessControlListsForTopics) {
            this.copyAccessControlListsForTopics = copyAccessControlListsForTopics;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getCopyTopicConfigurations}
         * @param copyTopicConfigurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_topic_configurations MskReplicator#copy_topic_configurations}.
         * @return {@code this}
         */
        public Builder copyTopicConfigurations(java.lang.Boolean copyTopicConfigurations) {
            this.copyTopicConfigurations = copyTopicConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getCopyTopicConfigurations}
         * @param copyTopicConfigurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_topic_configurations MskReplicator#copy_topic_configurations}.
         * @return {@code this}
         */
        public Builder copyTopicConfigurations(com.hashicorp.cdktf.IResolvable copyTopicConfigurations) {
            this.copyTopicConfigurations = copyTopicConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getDetectAndCopyNewTopics}
         * @param detectAndCopyNewTopics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_topics MskReplicator#detect_and_copy_new_topics}.
         * @return {@code this}
         */
        public Builder detectAndCopyNewTopics(java.lang.Boolean detectAndCopyNewTopics) {
            this.detectAndCopyNewTopics = detectAndCopyNewTopics;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getDetectAndCopyNewTopics}
         * @param detectAndCopyNewTopics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_topics MskReplicator#detect_and_copy_new_topics}.
         * @return {@code this}
         */
        public Builder detectAndCopyNewTopics(com.hashicorp.cdktf.IResolvable detectAndCopyNewTopics) {
            this.detectAndCopyNewTopics = detectAndCopyNewTopics;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getStartingPosition}
         * @param startingPosition starting_position block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#starting_position MskReplicator#starting_position}
         * @return {@code this}
         */
        public Builder startingPosition(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition startingPosition) {
            this.startingPosition = startingPosition;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getTopicNameConfiguration}
         * @param topicNameConfiguration topic_name_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_name_configuration MskReplicator#topic_name_configuration}
         * @return {@code this}
         */
        public Builder topicNameConfiguration(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration topicNameConfiguration) {
            this.topicNameConfiguration = topicNameConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListTopicReplication#getTopicsToExclude}
         * @param topicsToExclude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_exclude MskReplicator#topics_to_exclude}.
         * @return {@code this}
         */
        public Builder topicsToExclude(java.util.List<java.lang.String> topicsToExclude) {
            this.topicsToExclude = topicsToExclude;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskReplicatorReplicationInfoListTopicReplication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskReplicatorReplicationInfoListTopicReplication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskReplicatorReplicationInfoListTopicReplication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskReplicatorReplicationInfoListTopicReplication {
        private final java.util.List<java.lang.String> topicsToReplicate;
        private final java.lang.Object copyAccessControlListsForTopics;
        private final java.lang.Object copyTopicConfigurations;
        private final java.lang.Object detectAndCopyNewTopics;
        private final imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition startingPosition;
        private final imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration topicNameConfiguration;
        private final java.util.List<java.lang.String> topicsToExclude;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.topicsToReplicate = software.amazon.jsii.Kernel.get(this, "topicsToReplicate", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.copyAccessControlListsForTopics = software.amazon.jsii.Kernel.get(this, "copyAccessControlListsForTopics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.copyTopicConfigurations = software.amazon.jsii.Kernel.get(this, "copyTopicConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.detectAndCopyNewTopics = software.amazon.jsii.Kernel.get(this, "detectAndCopyNewTopics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.startingPosition = software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition.class));
            this.topicNameConfiguration = software.amazon.jsii.Kernel.get(this, "topicNameConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration.class));
            this.topicsToExclude = software.amazon.jsii.Kernel.get(this, "topicsToExclude", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.topicsToReplicate = java.util.Objects.requireNonNull(builder.topicsToReplicate, "topicsToReplicate is required");
            this.copyAccessControlListsForTopics = builder.copyAccessControlListsForTopics;
            this.copyTopicConfigurations = builder.copyTopicConfigurations;
            this.detectAndCopyNewTopics = builder.detectAndCopyNewTopics;
            this.startingPosition = builder.startingPosition;
            this.topicNameConfiguration = builder.topicNameConfiguration;
            this.topicsToExclude = builder.topicsToExclude;
        }

        @Override
        public final java.util.List<java.lang.String> getTopicsToReplicate() {
            return this.topicsToReplicate;
        }

        @Override
        public final java.lang.Object getCopyAccessControlListsForTopics() {
            return this.copyAccessControlListsForTopics;
        }

        @Override
        public final java.lang.Object getCopyTopicConfigurations() {
            return this.copyTopicConfigurations;
        }

        @Override
        public final java.lang.Object getDetectAndCopyNewTopics() {
            return this.detectAndCopyNewTopics;
        }

        @Override
        public final imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition getStartingPosition() {
            return this.startingPosition;
        }

        @Override
        public final imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration getTopicNameConfiguration() {
            return this.topicNameConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getTopicsToExclude() {
            return this.topicsToExclude;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("topicsToReplicate", om.valueToTree(this.getTopicsToReplicate()));
            if (this.getCopyAccessControlListsForTopics() != null) {
                data.set("copyAccessControlListsForTopics", om.valueToTree(this.getCopyAccessControlListsForTopics()));
            }
            if (this.getCopyTopicConfigurations() != null) {
                data.set("copyTopicConfigurations", om.valueToTree(this.getCopyTopicConfigurations()));
            }
            if (this.getDetectAndCopyNewTopics() != null) {
                data.set("detectAndCopyNewTopics", om.valueToTree(this.getDetectAndCopyNewTopics()));
            }
            if (this.getStartingPosition() != null) {
                data.set("startingPosition", om.valueToTree(this.getStartingPosition()));
            }
            if (this.getTopicNameConfiguration() != null) {
                data.set("topicNameConfiguration", om.valueToTree(this.getTopicNameConfiguration()));
            }
            if (this.getTopicsToExclude() != null) {
                data.set("topicsToExclude", om.valueToTree(this.getTopicsToExclude()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskReplicatorReplicationInfoListTopicReplication.Jsii$Proxy that = (MskReplicatorReplicationInfoListTopicReplication.Jsii$Proxy) o;

            if (!topicsToReplicate.equals(that.topicsToReplicate)) return false;
            if (this.copyAccessControlListsForTopics != null ? !this.copyAccessControlListsForTopics.equals(that.copyAccessControlListsForTopics) : that.copyAccessControlListsForTopics != null) return false;
            if (this.copyTopicConfigurations != null ? !this.copyTopicConfigurations.equals(that.copyTopicConfigurations) : that.copyTopicConfigurations != null) return false;
            if (this.detectAndCopyNewTopics != null ? !this.detectAndCopyNewTopics.equals(that.detectAndCopyNewTopics) : that.detectAndCopyNewTopics != null) return false;
            if (this.startingPosition != null ? !this.startingPosition.equals(that.startingPosition) : that.startingPosition != null) return false;
            if (this.topicNameConfiguration != null ? !this.topicNameConfiguration.equals(that.topicNameConfiguration) : that.topicNameConfiguration != null) return false;
            return this.topicsToExclude != null ? this.topicsToExclude.equals(that.topicsToExclude) : that.topicsToExclude == null;
        }

        @Override
        public final int hashCode() {
            int result = this.topicsToReplicate.hashCode();
            result = 31 * result + (this.copyAccessControlListsForTopics != null ? this.copyAccessControlListsForTopics.hashCode() : 0);
            result = 31 * result + (this.copyTopicConfigurations != null ? this.copyTopicConfigurations.hashCode() : 0);
            result = 31 * result + (this.detectAndCopyNewTopics != null ? this.detectAndCopyNewTopics.hashCode() : 0);
            result = 31 * result + (this.startingPosition != null ? this.startingPosition.hashCode() : 0);
            result = 31 * result + (this.topicNameConfiguration != null ? this.topicNameConfiguration.hashCode() : 0);
            result = 31 * result + (this.topicsToExclude != null ? this.topicsToExclude.hashCode() : 0);
            return result;
        }
    }
}
