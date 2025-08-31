package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorReplicationInfoListConsumerGroupReplication")
@software.amazon.jsii.Jsii.Proxy(MskReplicatorReplicationInfoListConsumerGroupReplication.Jsii$Proxy.class)
public interface MskReplicatorReplicationInfoListConsumerGroupReplication extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_replicate MskReplicator#consumer_groups_to_replicate}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getConsumerGroupsToReplicate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_exclude MskReplicator#consumer_groups_to_exclude}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConsumerGroupsToExclude() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_consumer_groups MskReplicator#detect_and_copy_new_consumer_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDetectAndCopyNewConsumerGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#synchronise_consumer_group_offsets MskReplicator#synchronise_consumer_group_offsets}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSynchroniseConsumerGroupOffsets() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskReplicatorReplicationInfoListConsumerGroupReplication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskReplicatorReplicationInfoListConsumerGroupReplication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskReplicatorReplicationInfoListConsumerGroupReplication> {
        java.util.List<java.lang.String> consumerGroupsToReplicate;
        java.util.List<java.lang.String> consumerGroupsToExclude;
        java.lang.Object detectAndCopyNewConsumerGroups;
        java.lang.Object synchroniseConsumerGroupOffsets;

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListConsumerGroupReplication#getConsumerGroupsToReplicate}
         * @param consumerGroupsToReplicate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_replicate MskReplicator#consumer_groups_to_replicate}. This parameter is required.
         * @return {@code this}
         */
        public Builder consumerGroupsToReplicate(java.util.List<java.lang.String> consumerGroupsToReplicate) {
            this.consumerGroupsToReplicate = consumerGroupsToReplicate;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListConsumerGroupReplication#getConsumerGroupsToExclude}
         * @param consumerGroupsToExclude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_exclude MskReplicator#consumer_groups_to_exclude}.
         * @return {@code this}
         */
        public Builder consumerGroupsToExclude(java.util.List<java.lang.String> consumerGroupsToExclude) {
            this.consumerGroupsToExclude = consumerGroupsToExclude;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListConsumerGroupReplication#getDetectAndCopyNewConsumerGroups}
         * @param detectAndCopyNewConsumerGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_consumer_groups MskReplicator#detect_and_copy_new_consumer_groups}.
         * @return {@code this}
         */
        public Builder detectAndCopyNewConsumerGroups(java.lang.Boolean detectAndCopyNewConsumerGroups) {
            this.detectAndCopyNewConsumerGroups = detectAndCopyNewConsumerGroups;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListConsumerGroupReplication#getDetectAndCopyNewConsumerGroups}
         * @param detectAndCopyNewConsumerGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_consumer_groups MskReplicator#detect_and_copy_new_consumer_groups}.
         * @return {@code this}
         */
        public Builder detectAndCopyNewConsumerGroups(com.hashicorp.cdktf.IResolvable detectAndCopyNewConsumerGroups) {
            this.detectAndCopyNewConsumerGroups = detectAndCopyNewConsumerGroups;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListConsumerGroupReplication#getSynchroniseConsumerGroupOffsets}
         * @param synchroniseConsumerGroupOffsets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#synchronise_consumer_group_offsets MskReplicator#synchronise_consumer_group_offsets}.
         * @return {@code this}
         */
        public Builder synchroniseConsumerGroupOffsets(java.lang.Boolean synchroniseConsumerGroupOffsets) {
            this.synchroniseConsumerGroupOffsets = synchroniseConsumerGroupOffsets;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListConsumerGroupReplication#getSynchroniseConsumerGroupOffsets}
         * @param synchroniseConsumerGroupOffsets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#synchronise_consumer_group_offsets MskReplicator#synchronise_consumer_group_offsets}.
         * @return {@code this}
         */
        public Builder synchroniseConsumerGroupOffsets(com.hashicorp.cdktf.IResolvable synchroniseConsumerGroupOffsets) {
            this.synchroniseConsumerGroupOffsets = synchroniseConsumerGroupOffsets;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskReplicatorReplicationInfoListConsumerGroupReplication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskReplicatorReplicationInfoListConsumerGroupReplication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskReplicatorReplicationInfoListConsumerGroupReplication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskReplicatorReplicationInfoListConsumerGroupReplication {
        private final java.util.List<java.lang.String> consumerGroupsToReplicate;
        private final java.util.List<java.lang.String> consumerGroupsToExclude;
        private final java.lang.Object detectAndCopyNewConsumerGroups;
        private final java.lang.Object synchroniseConsumerGroupOffsets;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.consumerGroupsToReplicate = software.amazon.jsii.Kernel.get(this, "consumerGroupsToReplicate", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.consumerGroupsToExclude = software.amazon.jsii.Kernel.get(this, "consumerGroupsToExclude", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.detectAndCopyNewConsumerGroups = software.amazon.jsii.Kernel.get(this, "detectAndCopyNewConsumerGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.synchroniseConsumerGroupOffsets = software.amazon.jsii.Kernel.get(this, "synchroniseConsumerGroupOffsets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.consumerGroupsToReplicate = java.util.Objects.requireNonNull(builder.consumerGroupsToReplicate, "consumerGroupsToReplicate is required");
            this.consumerGroupsToExclude = builder.consumerGroupsToExclude;
            this.detectAndCopyNewConsumerGroups = builder.detectAndCopyNewConsumerGroups;
            this.synchroniseConsumerGroupOffsets = builder.synchroniseConsumerGroupOffsets;
        }

        @Override
        public final java.util.List<java.lang.String> getConsumerGroupsToReplicate() {
            return this.consumerGroupsToReplicate;
        }

        @Override
        public final java.util.List<java.lang.String> getConsumerGroupsToExclude() {
            return this.consumerGroupsToExclude;
        }

        @Override
        public final java.lang.Object getDetectAndCopyNewConsumerGroups() {
            return this.detectAndCopyNewConsumerGroups;
        }

        @Override
        public final java.lang.Object getSynchroniseConsumerGroupOffsets() {
            return this.synchroniseConsumerGroupOffsets;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("consumerGroupsToReplicate", om.valueToTree(this.getConsumerGroupsToReplicate()));
            if (this.getConsumerGroupsToExclude() != null) {
                data.set("consumerGroupsToExclude", om.valueToTree(this.getConsumerGroupsToExclude()));
            }
            if (this.getDetectAndCopyNewConsumerGroups() != null) {
                data.set("detectAndCopyNewConsumerGroups", om.valueToTree(this.getDetectAndCopyNewConsumerGroups()));
            }
            if (this.getSynchroniseConsumerGroupOffsets() != null) {
                data.set("synchroniseConsumerGroupOffsets", om.valueToTree(this.getSynchroniseConsumerGroupOffsets()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskReplicator.MskReplicatorReplicationInfoListConsumerGroupReplication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskReplicatorReplicationInfoListConsumerGroupReplication.Jsii$Proxy that = (MskReplicatorReplicationInfoListConsumerGroupReplication.Jsii$Proxy) o;

            if (!consumerGroupsToReplicate.equals(that.consumerGroupsToReplicate)) return false;
            if (this.consumerGroupsToExclude != null ? !this.consumerGroupsToExclude.equals(that.consumerGroupsToExclude) : that.consumerGroupsToExclude != null) return false;
            if (this.detectAndCopyNewConsumerGroups != null ? !this.detectAndCopyNewConsumerGroups.equals(that.detectAndCopyNewConsumerGroups) : that.detectAndCopyNewConsumerGroups != null) return false;
            return this.synchroniseConsumerGroupOffsets != null ? this.synchroniseConsumerGroupOffsets.equals(that.synchroniseConsumerGroupOffsets) : that.synchroniseConsumerGroupOffsets == null;
        }

        @Override
        public final int hashCode() {
            int result = this.consumerGroupsToReplicate.hashCode();
            result = 31 * result + (this.consumerGroupsToExclude != null ? this.consumerGroupsToExclude.hashCode() : 0);
            result = 31 * result + (this.detectAndCopyNewConsumerGroups != null ? this.detectAndCopyNewConsumerGroups.hashCode() : 0);
            result = 31 * result + (this.synchroniseConsumerGroupOffsets != null ? this.synchroniseConsumerGroupOffsets.hashCode() : 0);
            return result;
        }
    }
}
