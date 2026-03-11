<template>
  <v-card height="100%" class="d-flex flex-column chat-card" elevation="2">
    <v-toolbar flat color="surface" class="px-4 border-b">
      <div v-if="group" class="d-flex align-center w-100">
        <div class="position-relative mr-4">
          <v-avatar color="info" variant="tonal" size="44">
            <v-icon>mdi-account-multiple</v-icon>
          </v-avatar>
        </div>
        <div>
          <v-toolbar-title class="font-weight-bold text-subtitle-1 mb-n1">
            {{ group.group_name }}
          </v-toolbar-title>
          <span class="text-caption text-medium-emphasis">{{ group.members ? group.members.length : 0 }} members</span>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon color="medium-emphasis" class="mr-1" @click="$emit('open-group-info')">
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
      </div>
      <div v-else-if="user" class="d-flex align-center w-100">
        <div class="position-relative mr-4">
          <v-avatar color="primary" variant="tonal" size="44">
            <span class="text-h6">{{ user.title ? user.title.charAt(0).toUpperCase() : 'U' }}</span>
          </v-avatar>
          <div class="online-indicator-header"></div>
        </div>
        <div>
          <v-toolbar-title class="font-weight-bold text-subtitle-1 mb-n1">
            {{ user.title }}
          </v-toolbar-title>
          <span class="text-caption text-success">Online</span>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon color="medium-emphasis" class="mr-1">
          <v-icon>mdi-phone-outline</v-icon>
        </v-btn>
        <v-btn icon color="medium-emphasis" class="mr-1">
          <v-icon>mdi-video-outline</v-icon>
        </v-btn>
        <v-btn icon color="medium-emphasis">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </div>
      <v-toolbar-title v-else class="text-medium-emphasis ml-0">Select a chat</v-toolbar-title>
    </v-toolbar>
    
    <v-card-text ref="messageContainer" class="flex-grow-1 message-container" :class="{ 'empty-chat': !user && !group }">
      <div v-if="!user && !group" class="d-flex flex-column align-center justify-center fill-height text-medium-emphasis">
        <v-avatar color="surface-variant" size="100" class="mb-6">
          <v-icon size="50" color="primary">mdi-message-text-outline</v-icon>
        </v-avatar>
        <h3 class="text-h5 font-weight-medium mb-2">Your Messages</h3>
        <p class="text-body-1">Select a user or group to start chatting</p>
      </div>
      <div v-else class="messages-wrapper px-2">
        <div class="text-center mb-6">
          <v-chip size="small" variant="flat" color="surface-variant">
            {{ group ? group.group_name : 'Today' }}
          </v-chip>
        </div>
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-row"
          :class="{ 'sent': isSent(msg), 'received': !isSent(msg) }"
        >
          <div class="message-bubble-wrapper">
            <div v-if="msg.is_group && !isSent(msg)" class="group-sender text-caption text-medium-emphasis mb-1">
              <strong>{{ msg.sender_name }}</strong>
            </div>
            <div class="message-bubble elevation-1">
              <p class="mb-0 content">{{ msg.content }}</p>
              <div class="timestamp-row mt-1">
                <small class="timestamp">{{ formatTime(msg.timestamp) }}</small>
                <v-icon v-if="isSent(msg)" size="14" color="white" class="ml-1 opacity-80">mdi-check-all</v-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
    
    <v-card-actions v-if="user || group" class="px-4 py-4 bg-surface border-t">
      <v-btn icon color="medium-emphasis" class="mr-2" variant="text">
        <v-icon>mdi-paperclip</v-icon>
      </v-btn>
      <v-text-field
        v-model="newMessage"
        @keydown.enter="sendMessage"
        placeholder="Type a message..."
        variant="solo-filled"
        density="comfortable"
        hide-details
        rounded="xl"
        flat
        bg-color="surface-variant"
        class="flex-grow-1 message-input"
      >
        <template v-slot:append-inner>
          <v-btn icon density="comfortable" variant="text" color="medium-emphasis">
            <v-icon>mdi-emoticon-outline</v-icon>
          </v-btn>
        </template>
      </v-text-field>
      <v-btn
        @click="sendMessage"
        color="primary"
        variant="flat"
        icon="mdi-send"
        size="large"
        :disabled="!newMessage.trim()"
        class="send-btn ml-3"
      ></v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'ChatWindow',
  props: {
    user: {
      type: Object,
      default: null,
    },
    group: {
      type: Object,
      default: null,
    },
    messages: {
      type: Array,
      default: () => [],
    },
    currentUser: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      newMessage: '',
    };
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim()) {
        this.$emit('send-message', this.newMessage);
        this.newMessage = '';
        this.$nextTick(() => {
          this.scrollToEnd();
        });
      }
    },
    scrollToEnd() {
      const container = this.$refs.messageContainer;
      if (container) {
        // If it's a vuetify component element we might need $el
        const el = container.$el ? container.$el : container;
        el.scrollTop = el.scrollHeight;
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    isSent(msg) {
      const currentUserId = this.currentUser._id;
      const currentUsername = this.currentUser.user || this.currentUser.usuario || this.currentUser.user_name;
      // Handle the different variations of sender IDs coming from socket backend
      return String(msg.sender_id) === String(currentUserId) || 
             String(msg.from) === String(currentUserId) || 
             msg.from === currentUsername;
    }
  },
  watch: {
    messages: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.scrollToEnd();
        });
      }
    },
    user() {
      this.$nextTick(() => {
        this.scrollToEnd();
      });
    }
  },
};
</script>

<style scoped>
.chat-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 20px rgba(0,0,0,0.05) !important;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.border-t {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.online-indicator-header {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: rgb(var(--v-theme-success, 76, 175, 80));
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
}

.message-container {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
}

.empty-chat {
  background-image: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.03) 0%, transparent 70%);
}

.message-row {
  display: flex;
  margin-bottom: 16px;
  width: 100%;
}

.message-row.sent {
  justify-content: flex-end;
}

.message-row.received {
  justify-content: flex-start;
}

.message-bubble-wrapper {
  max-width: 65%;
}

.message-bubble {
  padding: 12px 16px;
  position: relative;
  transition: all 0.2s ease;
}

.message-row.sent .message-bubble {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.8) 100%);
  color: white;
  border-radius: 20px 20px 4px 20px;
}

.message-row.received .message-bubble {
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 20px 20px 20px 4px;
}

.content {
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
}

.timestamp-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.timestamp {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.7;
}

.message-row.sent .timestamp {
  color: rgba(255, 255, 255, 0.9);
}

.message-input {
  border-radius: 24px;
}

.send-btn {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 50%;
  width: 48px;
  height: 48px;
}

.send-btn:active {
  transform: scale(0.9);
}

.send-btn:not(:disabled):hover {
  transform: scale(1.05);
}

/* Custom scrollbar */
.message-container::-webkit-scrollbar {
  width: 6px;
}

.message-container::-webkit-scrollbar-track {
  background: transparent;
}

.message-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 10px;
}

.message-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.25);
}

.group-sender {
  padding: 0 4px;
  color: rgb(var(--v-theme-primary));
}
</style>
