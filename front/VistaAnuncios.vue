<template>
  <div class="anuncios-container d-flex flex-column h-100 pa-4">

    <!-- Encabezado -->
    <div class="d-flex align-center mb-4">
      <v-icon icon="mdi-bullhorn" color="blue" size="2rem" class="mr-3" />
      <h2 class="text-h5 text-white font-weight-bold">Anuncios</h2>
      <v-spacer />
      <v-btn
        color="blue"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="showModal = true"
      >
        Nuevo Anuncio
      </v-btn>
    </div>

    <v-divider class="mb-4" />

    <!-- Lista de anuncios -->
    <div class="anuncios-lista flex-grow-1" style="overflow-y: auto;">
      <div v-if="anuncios.length === 0" class="d-flex flex-column align-center justify-center h-100 text-medium-emphasis">
        <v-icon size="64" class="mb-4 opacity-40">mdi-bullhorn-outline</v-icon>
        <p class="text-h6">Sin anuncios recientes</p>
        <p class="text-body-2">Los anuncios enviados aparecerán aquí</p>
      </div>

      <v-slide-y-transition group>
        <v-card
          v-for="(msg, idx) in anuncios"
          :key="idx"
          class="anuncio-card mb-3 pa-4"
          variant="tonal"
          color="blue-darken-4"
        >
          <div class="d-flex align-start ga-4">
            <v-avatar color="blue" variant="tonal" size="44">
              <span class="text-h6 font-weight-bold">
                {{ msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : 'S' }}
              </span>
            </v-avatar>
            <div class="flex-grow-1 min-width-0">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-subtitle-2 font-weight-bold text-blue-lighten-2">
                  {{ msg.sender_name || 'Sistema' }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  {{ formatFecha(msg.timestamp) }}
                </span>
              </div>
              <p class="text-body-1 text-white mb-0" style="white-space: pre-wrap; word-break: break-word;">
                {{ msg.content }}
              </p>
            </div>
          </div>
        </v-card>
      </v-slide-y-transition>
    </div>

    <!-- Modal: Nuevo Anuncio -->
    <v-dialog v-model="showModal" max-width="520px">
      <v-card class="fondoOscuro">
        <v-card-title class="d-flex align-center pa-5">
          <v-icon icon="mdi-bullhorn" color="blue" class="mr-3" />
          <span class="text-h6 text-white font-weight-bold">Nuevo Anuncio</span>
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5">
          <v-label class="text-caption text-blue-lighten-2 font-weight-medium mb-2 d-block text-uppercase">
            Destinatarios
          </v-label>
          <v-radio-group v-model="broadcastType" inline class="mb-4" hide-details>
            <v-radio label="Todos los usuarios" value="all" color="blue"></v-radio>
            <v-radio label="Por rol" value="role" color="blue"></v-radio>
          </v-radio-group>

          <v-slide-y-transition>
            <v-select
              v-if="broadcastType === 'role'"
              v-model="selectedBroadcastRoles"
              :items="roles"
              item-title="nombre"
              item-value="idroles"
              label="Seleccionar roles"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              hide-details
              multiple
              chips
              closable-chips
            >
              <template v-slot:prepend-inner>
                <v-icon color="blue">mdi-account-group</v-icon>
              </template>
            </v-select>
          </v-slide-y-transition>

          <v-label class="text-caption text-blue-lighten-2 font-weight-medium mb-2 d-block text-uppercase">
            Mensaje
          </v-label>
          <v-textarea
            v-model="broadcastMessage"
            placeholder="Escriba el mensaje del anuncio..."
            variant="outlined"
            rows="5"
            hide-details
            auto-grow
          ></v-textarea>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="cerrarModal">Cancelar</v-btn>
          <v-btn
            color="blue"
            variant="flat"
            prepend-icon="mdi-send"
            @click="enviarAnuncio"
            :disabled="!broadcastMessage.trim() || (broadcastType === 'role' && selectedBroadcastRoles.length === 0)"
            :loading="isSending"
          >
            Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import socket from '../plugins/io/socket.io.handler.js';

export default {
  name: 'VistaAnuncios',
  data() {
    return {
      socket: null,
      currentUser: null,
      roles: [],
      anuncios: [],
      showModal: false,
      broadcastType: 'all',
      selectedBroadcastRoles: [],
      broadcastMessage: '',
      isSending: false,
    };
  },
  methods: {
    async fetchRoles() {
      try {
        const { status, data } = await this.$fetching_func('POST', '/manager/analyzer/getRoles');
        if (status === 200) {
          this.roles = data.data;
        }
      } catch (error) {
        console.error('Error al obtener roles:', error);
      }
    },
    initSocket() {
      this.socket = socket.connect(this.$ipBackend);
      if (this.socket) {
        this.socket.on('broadcast_message', (message) => {
          this.anuncios.unshift({ ...message, timestamp: message.timestamp || new Date().toISOString() });
        });
      }
    },
    async fetchAnuncios() {
      const { status, data } = await this.$fetching_func('POST', '/chat/announcements');
      if (status === 200) {
        this.anuncios = data
      }
    },
    enviarAnuncio() {
      if (!this.broadcastMessage.trim()) return;
      this.isSending = true;
      // console.log('Enviando', this.broadcastMessage, this.broadcastType)

      const sender = this.currentUser
      const sender_name = sender.grado + sender.nombre + sender.apellido 

      const payload = {
        content: this.broadcastMessage,
        sender_id: sender._id,
        sender_name: sender_name,
        target_roles: null,
        timestamp: new Date().toISOString()
      };

      if (this.socket) {
        if (this.broadcastType === 'role') {
          payload.target_roles = this.selectedBroadcastRoles
          // back soporta que enviemos una lista de roles
          this.socket.emit('broadcast_message', payload);
            // console.log('Enviado a', roleId)
        } else {
          payload.target_roles = ['all']
          this.socket.emit('broadcast_message', payload);
          // console.log('Enviado a todos')
        }
      } else {
        console.log('no socket', this.socket)
      }

      this.isSending = false;
      this.cerrarModal();
    },
    cerrarModal() {
      this.showModal = false;
      this.broadcastMessage = '';
      this.broadcastType = 'all';
      this.selectedBroadcastRoles = [];
    },
    formatFecha(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    },
  },
  created() {
    const session = sessionStorage.getItem('session');
    if (session) {
      this.currentUser = JSON.parse(session);
    }
    this.fetchRoles();
    this.initSocket();
    this.fetchAnuncios();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.off("broadcast_message");
    }
  },
};
</script>

<style scoped>
.anuncios-container {
  background-color: var(--secondaryColor);
}

.anuncio-card {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.6);
  border-radius: 8px !important;
}

.anuncios-lista::-webkit-scrollbar {
  width: 4px;
}
.anuncios-lista::-webkit-scrollbar-track {
  background: transparent;
}
.anuncios-lista::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
}
</style>
