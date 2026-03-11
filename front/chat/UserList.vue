<template>
  <v-card height="100%" class="d-flex flex-column user-list-card" elevation="2">
    <v-toolbar flat color="transparent" class="px-3 pt-2">
      <v-toolbar-title class="text-h6 font-weight-bold">Chats</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon color="primary" variant="tonal" size="small" @click="$emit('open-create-group')">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-toolbar>

    <div class="px-4 py-3">
      <v-text-field
        v-model="search"
        placeholder="Search users..."
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        density="compact"
        hide-details
        flat
        rounded="xl"
        bg-color="surface-variant"
      ></v-text-field>
    </div>

    <v-divider class="mb-2"></v-divider>

    <v-list class="flex-grow-1 py-0 bg-transparent" style="overflow-y: auto;">
      <!-- Groups Section -->
      <div v-if="groups.length > 0">
        <v-list-subheader class="px-2 text-uppercase text-caption">Groups</v-list-subheader>
        <v-list-item
          v-for="group in filteredGroups"
          :key="group._id"
          @click="$emit('group-selected', group)"
          :active="isGroupSelected(group)"
          class="user-item mx-2 mb-1 rounded-lg"
          min-height="64"
        >
          <template v-slot:prepend>
            <div class="position-relative mr-3">
              <v-avatar color="info" variant="tonal" size="40">
                <v-icon>mdi-account-multiple</v-icon>
              </v-avatar>
            </div>
          </template>

          <v-list-item-title class="font-weight-medium text-body-1 mb-1">
            {{ group.group_name }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption text-medium-emphasis">
            {{ group.members ? group.members.length : 0 }} members
          </v-list-item-subtitle>
        </v-list-item>

        <v-divider class="my-2"></v-divider>
      </div>

      <!-- Users Section -->
      <div v-if="users.length > 0">
        <v-list-subheader class="px-2 text-uppercase text-caption">Online Users</v-list-subheader>
        <v-list-item
          v-for="user in processedUsers"
          :key="user._id"
          @click="selectUser(user)"
          :active="isSelected(user)"
          class="user-item mx-2 mb-1 rounded-lg"
          min-height="64"
        >
          <template v-slot:prepend>
            <div class="position-relative mr-3">
              <v-avatar color="primary" variant="tonal" size="40">
                <span class="text-subtitle-1 font-weight-medium">{{ user.title ? user.title.charAt(0).toUpperCase() : 'U' }}</span>
              </v-avatar>
              <div class="online-indicator"></div>
            </div>
          </template>

          <v-list-item-title class="font-weight-medium text-body-1 mb-1">
            {{ user.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption text-medium-emphasis">
            Click to start chatting...
          </v-list-item-subtitle>

          
          <template v-slot:append>
            <div class="d-flex flex-column align-end">
              <!-- Time or indicators could go here in the future -->
            </div>
          </template>
        </v-list-item>
      </div>
      
      <div v-if="users.length === 0 && groups.length === 0" class="pa-8 text-center text-medium-emphasis">
        <v-icon size="48" class="mb-2 opacity-50">mdi-account-search-outline</v-icon>
        <p>No users or groups found</p>
      </div>
    </v-list>
  </v-card>
</template>

<script>
export default {
  name: 'UserList',
  props: {
    users: {
      type: Array,
      required: true,
    },
    groups: {
      type: Array,
      default: () => [],
    },
    selectedUser: {
      type: Object,
      default: null,
    },
    selectedGroup: {
      type: Object,
      default: null,
    }
  },
  data() {
    return {
      search: '',
    };
  },
  computed: {
    processedUsers() {
      if (!this.search) {
        return this.users;
      }
      return this.users.filter(user =>
        user.title && user.title.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    filteredGroups() {
      if (!this.search) {
        return this.groups;
      }
      return this.groups.filter(group =>
        group.group_name && group.group_name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
  },
  methods: {
    selectUser(user) {
      this.$emit('user-selected', user);
    },
    isSelected(user) {
      if (!this.selectedUser) return false;
      const selectedId = this.selectedUser._id;
      const userId = user._id;
      return String(selectedId) === String(userId);
    },
    isGroupSelected(group) {
      if (!this.selectedGroup) return false;
      return this.selectedGroup._id === group._id;
    }
  },
};
</script>

<style scoped>
.user-list-card {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px 0 0 12px;
}

.user-item {
  /* transition: background-color 0.2s; */
  cursor: pointer;
}

.user-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.user-item.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4caf50;
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
}

/* Custom scrollbar */
.v-list::-webkit-scrollbar {
  width: 4px;
}

.v-list::-webkit-scrollbar-track {
  background: transparent;
}

.v-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 10px;
}
</style>
