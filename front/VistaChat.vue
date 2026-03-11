<template>
  <v-container fluid class="pa-0 fill-height chat-main-container">
    <v-card class="mx-auto my-0 d-flex flex-row overflow-hidden chat-layout" width="100%" height="100%">
      <v-row no-gutters class="fill-height flex-nowrap">
        <!-- User List Column -->
        <v-col cols="12" sm="4" md="3" lg="3" class="fill-height border-e">
          <user-list
            :users="onlineUsersList"
            :groups="groups"
            :selected-user="activeUser"
            :selected-group="activeGroup"
            @user-selected="handleUserSelected"
            @group-selected="handleGroupSelected"
            @open-create-group="showGroupModal = true"
          ></user-list>
        </v-col>
        
        <!-- Chat Window Column -->
        <v-col cols="12" sm="8" md="9" lg="9" class="fill-height">
          <chat-window
            :user="activeUser"
            :group="activeGroup"
            :messages="activeChatMessages"
            :current-user="currentUser"
            @send-message="handleSendMessage"
            @open-group-info="openGroupInfo"
          ></chat-window>
        </v-col>
      </v-row>
    </v-card>

    <!-- Create Group Modal -->
    <v-dialog v-model="showGroupModal" max-width="500px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">Create New Group</v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-6">
          <v-text-field
            v-model="newGroupName"
            label="Group Name"
            placeholder="Enter group name..."
            variant="outlined"
            density="comfortable"
            hide-details
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="groupSearch"
            label="Search Users"
            placeholder="Type to filter users..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            clearable
            class="mb-4"
          ></v-text-field>

          <v-label class="text-subtitle-2 font-weight-medium mb-2 d-block">Select Members</v-label>
          <v-list class="border rounded" max-height="300" style="overflow-y: auto;">
            <v-list-item
              v-for="user in filteredUsersForGroup"
              :key="user._id"
              @click="toggleUserSelection(user)"
              class="user-select-item"
            >
              <template v-slot:prepend>
                <v-checkbox
                  :modelValue="selectedUsersForGroup.includes(user._id)"
                  @click.stop="toggleUserSelection(user)"
                ></v-checkbox>
              </template>
              <v-list-item-title>{{ user.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showGroupModal = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="createGroup"
            :disabled="!newGroupName.trim() || selectedUsersForGroup.length === 0"
          >
            Create Group
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Group Info Modal -->
    <v-dialog v-model="showGroupInfoModal" max-width="500px">
      <v-card v-if="activeGroup">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center">
          Group Info
          <v-spacer></v-spacer>
          <v-btn icon variant="text" size="small" @click="showGroupInfoModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-6">
          <div class="text-center mb-6">
            <v-avatar color="info" variant="tonal" size="64" class="mb-3">
              <v-icon size="32">mdi-account-multiple</v-icon>
            </v-avatar>
            <h3 class="text-h5 font-weight-bold">{{ activeGroup.group_name }}</h3>
            <p class="text-medium-emphasis">{{ activeGroup.members ? activeGroup.members.length : 0 }} members</p>
          </div>

          <v-tabs v-model="groupInfoTab" color="primary" align-tabs="center">
            <v-tab value="members">Members</v-tab>
            <v-tab value="add" v-if="canManageGroup(activeGroup)">Add</v-tab>
          </v-tabs>

          <v-window v-model="groupInfoTab" class="mt-4">
            <v-window-item value="members">
              <v-list class="border rounded" max-height="250" style="overflow-y: auto;">
                <v-list-item v-for="member in activeGroup.members" :key="member._id">
                  <template v-slot:prepend>
                    <v-avatar color="primary" variant="tonal" size="32" class="mr-3">
                      <span class="text-caption">{{ member.title ? member.title.charAt(0).toUpperCase() : 'U' }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ member.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ member.usuario }}
                    <span v-if="String(member._id) === String(activeGroup.created_by)" class="text-primary font-weight-bold ml-2">(Owner)</span>
                  </v-list-item-subtitle>
                  <template v-slot:append v-if="canManageGroup(activeGroup) && String(member._id) !== String(currentUser._id)">
                    <v-btn icon="mdi-account-remove" variant="text" color="error" size="small" @click="removeMember(member._id)" title="Remove member"></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>

            <v-window-item value="add">
              <v-text-field
                v-model="groupMembersSearch"
                label="Search Users"
                placeholder="Type to filter..."
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                clearable
                class="mb-4"
              ></v-text-field>

              <v-list class="border rounded" max-height="250" style="overflow-y: auto;">
                <v-list-item
                  v-for="user in usersToAddFiltered"
                  :key="user._id"
                  @click="toggleUserToAdd(user)"
                >
                  <template v-slot:prepend>
                    <v-checkbox
                      :modelValue="usersToAdd.includes(user._id)"
                      @click.stop="toggleUserToAdd(user)"
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title class="ml-2">{{ user.title }}</v-list-item-title>
                </v-list-item>
                <div v-if="usersToAddFiltered.length === 0" class="pa-4 text-center text-medium-emphasis">
                  No new users to add.
                </div>
              </v-list>

              <div class="d-flex justify-end mt-4">
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="confirmAddMembers"
                  :disabled="usersToAdd.length === 0"
                  :loading="isAddingMembers"
                >
                  Add Selected
                </v-btn>
              </div>
            </v-window-item>
          </v-window>

        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-surface-variant d-flex justify-space-between">
          <template v-if="!canManageGroup(activeGroup)">
            <v-btn color="error" variant="text" prepend-icon="mdi-exit-run" @click="handleLeaveGroup">
              Leave Group
            </v-btn>
          </template>
          <template v-else>
            <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click="handleDeleteGroup">
              Delete Group
            </v-btn>
          </template>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showGroupInfoModal = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import UserList from '@/components/chat/UserList.vue';
import ChatWindow from '@/components/chat/ChatWindow.vue';
import socket from '../plugins/io/socket.io.handler.js'

export default {
  name: 'VistaChat',
  components: {
    UserList,
    ChatWindow,
  },
  data() {
    return {
      socket: null,
      users: [],         
      onlineUserIds: [],
      roles: [],
      groups: [],
      messages: {},
      activeChatId: null,
      activeUser: null,
      activeGroup: null,
      currentUser: null,
      showGroupModal: false,
      newGroupName: '',
      groupSearch: '',
      selectedUsersForGroup: [],
      showGroupInfoModal: false,
      groupInfoTab: 'members',
      groupMembersSearch: '',
      usersToAdd: [],
      isAddingMembers: false,
    };
  },
  computed: {
    usersToAddFiltered() {
      if (!this.activeGroup) return [];
      const memberIds = this.activeGroup.members ? this.activeGroup.members.map(m => String(m._id)) : [];
      let available = this.users.filter(u => !memberIds.includes(String(u._id)));
      if (this.groupMembersSearch) {
        available = available.filter(u => 
          (u.title || '').toLowerCase().includes(this.groupMembersSearch.toLowerCase()) || 
          (u.usuario || '').toLowerCase().includes(this.groupMembersSearch.toLowerCase())
        );
      }
      return available;
    },
    activeChatMessages() {
      return this.activeChatId ? this.messages[this.activeChatId] || [] : [];
    },
    filteredUsersForGroup() {
      if (!this.groupSearch) return this.users;
      return this.users.filter(u => 
        u.title.toLowerCase().includes(this.groupSearch.toLowerCase())
      );
    },
    onlineUsersList() {
      if (!this.users.length) return [];
      // Keep selected user visible even if they go offline (optional UX choice)
      // Filter out users based on whether they're in the onlineUserIds array or if they are the currently selected chat user.
      return this.users.filter(u => 
        this.onlineUserIds.includes(String(u._id)) || 
        (this.activeUser && String(this.activeUser._id) === String(u._id))
      );
    },
    userGroupsCount() {
      return this.groups.length;
    },
    userGroupsList() {
      // Return groups sorted by most recent activity
      return [...this.groups].sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0);
        const bDate = new Date(b.updated_at || b.created_at || 0);
        return bDate - aDate;
      });
    },
    ownedGroups() {
      return this.groups.filter(g => g.created_by && String(g.created_by) === String(this.currentUser._id));
    },
    memberGroups() {
      return this.groups.filter(g => !this.isGroupOwner(g) && this.isGroupMember(g));
    },
  },
  methods: {
    async fetchUsers() {
      try {
        const sessionStr = sessionStorage.getItem('session');
        if (!sessionStr) return;
        const session = JSON.parse(sessionStr);
        const { status, data } = await this.$fetching_func('POST', '/manager/analyzer/getUsersWithRol');
        if (status === 200) {
          const users = data.filter((u) => u._id !== session._id)
          this.users = users;
        }
        const { status: statusRoles, data: dataRoles } = await this.$fetching_func('POST', '/manager/analyzer/getRoles')
        if (statusRoles === 200) {
          this.roles = dataRoles;
        }
      } catch (error) {
        console.error('Error fetching users/roles:', error);
      }
    },
    async initSocket() {
      this.socket = socket.connect(this.$ipBackend)

      if (!this.socket) return

      this.socket.on('user_online', ({ user_id }) => {
        if (!this.onlineUserIds.includes(String(user_id))) {
          this.onlineUserIds.push(String(user_id));
        }
      });

      this.socket.on('user_offline', ({ user_id }) => {
        this.onlineUserIds = this.onlineUserIds.filter(id => id !== String(user_id));
      });

      this.socket.on('chat_message', (message) => {
        console.log(message)
        this.receiveMessage(message);
      });

      this.socket.on('group_message', (message) => {
        console.log('Group message:', message);
        this.receiveGroupMessage(message);
      });

      this.socket.on('added_to_group', async (data) => {
        const groupId = typeof data === 'string' ? data : data.group_id;
        if (this.socket) {
          this.socket.join(groupId);
        }
        // Fetch the group details when added to a new group
        await this.fetchGroupDetails(groupId);
      });

      this.socket.on('group_created', async (data) => {
        // When another user creates a group and we're added, fetch our groups
        if (data.group && data.members && data.members.includes(this.currentUser._id)) {
          await this.fetchGroups();
        }
      });

      this.socket.on('group_updated', async (data) => {
        // When a group is updated (e.g., new members added), refresh the group
        const groupIndex = this.groups.findIndex(g => g._id === data.group_id);
        if (groupIndex !== -1) {
          await this.fetchGroupDetails(data.group_id);
        }
      });

      this.socket.on('member_added_to_group', async (data) => {
        // When new members are added to an existing group
        if (this.activeGroup && this.activeGroup._id === data.group_id) {
          await this.fetchGroupDetails(data.group_id);
        }
      });

      this.socket.on('group_deleted', (data) => {
        // When a group is deleted
        const groupId = data.group_id;
        this.groups = this.groups.filter(g => g._id !== groupId);
        
        if (this.activeGroup && this.activeGroup._id === groupId) {
          this.activeGroup = null;
          this.activeChatId = null;
          this.messages = {};
        }
      });

      this.socket.on('user_left_group', async (data) => {
        // When another user leaves a group
        if (this.activeGroup && this.activeGroup._id === data.group_id) {
          await this.fetchGroupDetails(data.group_id);
        }
      });

      this.socket.on('user_left_group_notification', (data) => {
        // When we are the ones who were removed from the group
        if (String(data.user_id) === String(this.currentUser._id)) {
          // Remove group from local list
          this.groups = this.groups.filter(g => g._id !== data.group_id);
          // If viewing the group, close it
          if (this.activeGroup && this.activeGroup._id === data.group_id) {
            this.activeGroup = null;
            this.activeChatId = null;
            this.showGroupInfoModal = false;
            alert('You have been removed from the group.');
          }
        }
      });
    },

    async handleUserSelected(user) {
      if (user === this.activeUser) return

      this.activeUser = user;
      this.activeGroup = null;
      if (this.currentUser && this.activeUser) {
        // Use 'user' property (username) as the identifier
        const currentUserId = String(this.currentUser._id);
        const targetUserId = String(this.activeUser._id);
        
        if (currentUserId && targetUserId) {
          const chatId = [currentUserId, targetUserId].sort().join('');
          this.activeChatId = chatId;
          if (this.socket) {
            this.socket.emit('join_room', {
              producer: currentUserId,
              consumer: targetUserId,
            });
            try {
              const { status, data } = await this.$fetching_func('POST', '/chat/getChatHistory', { chat_id: chatId });
              if (status === 200 && Array.isArray(data)) {
                const history = data.map(m => ({
                  ...m,
                  timestamp: m.created_at, // Map SQL created_at to timestamp
                  // content and sender_id come directly from the SQL alias
                }));
                this.messages = { ...this.messages, [chatId]: history };
              }
            } catch (error) {
              console.error('Error loading chat history:', error);
            }
          }
        }
      }
    },
    async handleGroupSelected(group) {
      this.activeGroup = group;
      this.activeUser = null;
      const groupId = group._id;
      this.activeChatId = `group_${groupId}`;
      
      if (this.socket) {
        // Join the group socket room
        this.socket.emit('join_group_room', {
          group_id: groupId,
          user_id: this.currentUser._id,
        });

        // Verify the user is still a member of the group
        try {
          await this.fetchGroupDetails(groupId);
        } catch (error) {
          console.error('Error fetching group details:', error);
        }

        // Load chat history
        try {
          const { status, data } = await this.$fetching_func('POST', '/chat/getGroupChatHistory', { group_id: groupId });
          if (status === 200 && Array.isArray(data)) {
            const history = data.map(m => ({
              ...m,
              timestamp: m.created_at,
            }));
            this.messages = { ...this.messages, [this.activeChatId]: history };
          }
        } catch (error) {
          console.error('Error loading group chat history:', error);
        }
      }
    },
    handleSendMessage(messageText) {
      if (!messageText || !messageText.trim()) {
        return;
      }

      const sender = this.currentUser
      const sender_name = sender.grado + sender.nombre + sender.apellido 

      if (this.activeGroup) {
        // Send group message with validation
        if (!this.socket || !this.activeGroup._id || !sender) {
          console.error(this.socket, this.activeGroup._id, sender)
          console.error('Missing required data for group message');
          return;
        }

        this.socket.emit('group_message', {
          content: messageText.trim(),
          group_id: this.activeGroup._id,
          sender_id: sender._id,
          sender_name: sender_name,
          created_at: new Date().toISOString()
        });
      }
      
      if (this.activeUser) {
        // Send direct message with validation
        if (!this.socket || !sender || !this.activeUser._id || !this.activeChatId) {
          console.error('Missing required data for direct message');
          return;
        }

        this.socket.emit('chat_message', {
          content: messageText.trim(),
          chat_id: this.activeChatId,
          sender_id: sender._id,
          sender_name: sender_name,
          created_at: new Date().toISOString()
        });
      }
    },
    receiveMessage(message) {
      if (!message || !message.sender_id || !message.chat_id) {
        console.error('Invalid message data. Missing sender_id or chat_id.');
        return;
      }

      const chatId = message.chat_id;
      const updated = { ...this.messages };
      if (!updated[chatId]) {
        updated[chatId] = [];
      }
      
      // Map message content and ensure timestamp
      const normMsg = {
        ...message,
        content: message.content || message.msg,
        timestamp: message.created_at || message.timestamp || new Date().toISOString(),
        sender_id: message.sender_id,
        sender_name: message.sender_name,
      };

      // Avoid duplicate messages
      const messageExists = updated[chatId].some(m => 
        m.content === normMsg.content && 
        String(m.sender_id) === String(normMsg.sender_id) &&
        Math.abs(new Date(m.timestamp) - new Date(normMsg.timestamp)) < 1000
      );

      if (!messageExists) {
        updated[chatId] = [...updated[chatId], normMsg];
        this.messages = updated;
      }
    },
    receiveGroupMessage(message) {
      if (!message || !message.group_id) {
        console.error('Invalid group message data');
        return;
      }

      const groupId = message.group_id;
      const chatId = `group_${groupId}`;
      const updated = { ...this.messages };
      
      if (!updated[chatId]) {
        updated[chatId] = [];
      }

      const groupMsg = {
        ...message,
        content: message.content || message.msg,
        is_group: true,
        timestamp: message.created_at || message.timestamp || new Date().toISOString(),
      };

      // Avoid duplicate messages
      const messageExists = updated[chatId].some(m => 
        m.content === groupMsg.content && 
        String(m.sender_id) === String(groupMsg.sender_id) &&
        Math.abs(new Date(m.timestamp) - new Date(groupMsg.timestamp)) < 1000
      );

      if (!messageExists) {
        updated[chatId] = [...updated[chatId], groupMsg];
        this.messages = updated;
      }
    },
    async createGroup() {
      if (!this.newGroupName.trim() || this.selectedUsersForGroup.length === 0) {
        alert('Please enter a group name and select at least one user');
        return;
      }

      try {
        const memberIds = [this.currentUser._id, ...this.selectedUsersForGroup];
        const { status, data } = await this.$fetching_func('POST', '/chat/createGroup', {
          group_name: this.newGroupName,
          members: memberIds,
          created_by: this.currentUser._id,
        });

        if (status === 201 || status === 200) {
          // Add the newly created group to the local list
          this.groups.push(data);
          this.newGroupName = '';
          this.selectedUsersForGroup = [];
          this.showGroupModal = false;
          
          // Notify all members through socket
          if (this.socket) {
            // Join all group members to the group room
            this.socket.emit('group_created', {
              group: data,
              group_id: data._id,
              members: memberIds,
              created_by: this.currentUser._id,
            });

            // Join the group room for the creator
            this.socket.emit('join_group_room', {
              group_id: data._id,
              user_id: this.currentUser._id,
            });
          }
        }
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
      }
    },
    async fetchGroups() {
      try {
        const { status, data } = await this.$fetching_func('POST', '/chat/getUserGroups', { user_id: this.currentUser._id });
        if (status === 200) {
          this.groups = data;
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    },
    async fetchGroupDetails(groupId) {
      try {
        const { status, data } = await this.$fetching_func('POST', '/chat/getGroupDetails', { group_id: groupId });
        if (status === 200) {
          // Update the group in the local list if it exists
          const groupIndex = this.groups.findIndex(g => g._id === groupId);
          if (groupIndex !== -1) {
            this.groups[groupIndex] = data;
            // Update active group if it's the one being viewed
            if (this.activeGroup && this.activeGroup._id === groupId) {
              this.activeGroup = data;
            }
          } else {
            // Add the group if it's not in the list (e.g., user was just added)
            this.groups.push(data);
          }
          return data;
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
      }
    },
    async leaveGroup(groupId) {
      try {
        const { status } = await this.$fetching_func('POST', '/chat/leaveGroup', {
          group_id: groupId,
          user_id: this.currentUser._id,
        });
        if (status === 200) {
          // Remove group from local list
          this.groups = this.groups.filter(g => g._id !== groupId);
          // Reset active group if it was the one we left
          if (this.activeGroup && this.activeGroup._id === groupId) {
            this.activeGroup = null;
            this.activeChatId = null;
          }
          // Notify through socket
          if (this.socket) {
            this.socket.emit('user_left_group', {
              group_id: groupId,
              user_id: this.currentUser._id,
            });
            this.socket.leave(groupId);
          }
        }
      } catch (error) {
        console.error('Error leaving group:', error);
        alert('Failed to leave group');
      }
    },
    async addMembersToGroup(groupId, userIds) {
      try {
        const { status, data } = await this.$fetching_func('POST', '/chat/addMembersToGroup', {
          group_id: groupId,
          user_ids: userIds,
        });
        if (status === 200 || status === 201) {
          // Update group in local list
          const groupIndex = this.groups.findIndex(g => g._id === groupId);
          if (groupIndex !== -1) {
            this.groups[groupIndex] = data;
            if (this.activeGroup && this.activeGroup._id === groupId) {
              this.activeGroup = data;
            }
          }
          // Notify through socket
          if (this.socket) {
            this.socket.emit('member_added_to_group', {
              group_id: groupId,
              new_members: userIds,
            });
          }
          return data;
        }
      } catch (error) {
        console.error('Error adding members to group:', error);
        alert('Failed to add members to group');
      }
    },
    async deleteGroup(groupId) {
      try {
        const { status } = await this.$fetching_func('POST', '/chat/deleteGroup', {
          group_id: groupId,
        });
        if (status === 200) {
          // Remove group from local list
          this.groups = this.groups.filter(g => g._id !== groupId);
          // Reset active group if it was the one deleted
          if (this.activeGroup && this.activeGroup._id === groupId) {
            this.activeGroup = null;
            this.activeChatId = null;
          }
          // Notify through socket
          if (this.socket) {
            this.socket.emit('group_deleted', {
              group_id: groupId,
            });
          }
        }
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
      }
    },
    async fetchOnlineUsers() {
      try {
        const { status, data } = await this.$fetching_func('POST', '/chat/getOnlineUsers');
        if (status === 200) {
          // Data is an array of strings like ["12", "143"] from Redis SMEMBERS
          this.onlineUserIds = data || [];
        }
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    },
    toggleUserSelection(user) {
      const index = this.selectedUsersForGroup.indexOf(user._id);
      if (index > -1) {
        this.selectedUsersForGroup.splice(index, 1);
      } else {
        this.selectedUsersForGroup.push(user._id);
      }
    },
    openGroupInfo() {
      if (!this.activeGroup) return;
      this.groupInfoTab = 'members';
      this.groupMembersSearch = '';
      this.usersToAdd = [];
      this.showGroupInfoModal = true;
    },
    toggleUserToAdd(user) {
      const index = this.usersToAdd.indexOf(user._id);
      if (index > -1) {
        this.usersToAdd.splice(index, 1);
      } else {
        this.usersToAdd.push(user._id);
      }
    },
    async confirmAddMembers() {
      if (!this.activeGroup || this.usersToAdd.length === 0) return;
      this.isAddingMembers = true;
      try {
        await this.addMembersToGroup(this.activeGroup._id, this.usersToAdd);
        this.usersToAdd = [];
        this.groupInfoTab = 'members';
      } finally {
        this.isAddingMembers = false;
      }
    },
    async handleLeaveGroup() {
      if (!this.activeGroup) return;
      if (confirm(`Are you sure you want to leave ${this.activeGroup.group_name}?`)) {
        await this.leaveGroup(this.activeGroup._id);
        this.showGroupInfoModal = false;
      }
    },
    async handleDeleteGroup() {
      if (!this.activeGroup) return;
      if (confirm(`Are you sure you want to delete ${this.activeGroup.group_name}? This action cannot be undone.`)) {
        await this.deleteGroup(this.activeGroup._id);
        this.showGroupInfoModal = false;
      }
    },
    async removeMember(userId) {
      if (!this.activeGroup) return;
      if (confirm('Are you sure you want to remove this member?')) {
        try {
          const { status } = await this.$fetching_func('POST', '/chat/leaveGroup', {
            group_id: this.activeGroup._id,
            user_id: userId,
          });
          if (status === 200) {
            // Re-fetch group details to get the new members list
            await this.fetchGroupDetails(this.activeGroup._id);
            // Notify through socket
            if (this.socket) {
              this.socket.emit('user_left_group', {
                group_id: this.activeGroup._id,
                user_id: userId,
              });
            }
          }
        } catch (error) {
          console.error('Error removing member:', error);
          alert('Failed to remove member');
        }
      }
    },
    isGroupOwner(group) {
      return group && group.created_by && String(group.created_by) === String(this.currentUser._id);
    },
    isGroupMember(group) {
      return group && group.members && group.members.some(member => 
        String(member._id || member) === String(this.currentUser._id)
      );
    },
    canManageGroup(group) {
      // Owner can always manage, future: implement role-based management
      return this.isGroupOwner(group);
    },
    getGroupMemberNames(group) {
      if (!group || !group.members) return '';
      return group.members
        .map(member => member.title || member.name || member.usuario || 'Unknown')
        .join(', ');
    },
    validateGroupData() {
      return this.currentUser && 
             this.currentUser._id && 
             (this.newGroupName.trim().length > 0) && 
             this.selectedUsersForGroup.length > 0;
    },
  },
  created() {
    const session = sessionStorage.getItem('session');
    if (session) {
      this.currentUser = JSON.parse(session);
    }
    
    // Initialize all data
    Promise.all([
      this.fetchUsers(),
      this.fetchGroups(),
      this.fetchOnlineUsers()
    ]).then(() => {
      // Initialize socket after fetching initial data
      this.initSocket();
    }).catch(error => {
      console.error('Error during initialization:', error);
      // Still initialize socket even if fetching fails
      this.initSocket();
    });
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.off('chat_message');
      this.socket.off('group_message');
      this.socket.off('added_to_group');
      this.socket.off('group_created');
      this.socket.off('group_updated');
      this.socket.off('member_added_to_group');
      this.socket.off('group_deleted');
      this.socket.off('user_left_group');
      this.socket.off('user_left_group_notification');
    }
  },
};
</script>

<style scoped>
.chat-main-container {
  height: 100%;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  padding: 16px !important;
}

.chat-layout {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important;
  background-color: rgb(var(--v-theme-surface));
}

.border-e {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

@media (max-width: 600px) {
  .chat-main-container {
    height: calc(100vh - 56px);
    padding: 0 !important;
  }
  .chat-layout {
    border-radius: 0;
  }
}
</style>
