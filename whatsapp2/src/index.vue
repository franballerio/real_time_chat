<template>
  <div class="container">
    <!-- Show welcome message if user is authenticated -->
    <div v-if="userData" class="form-container">
      <h2>Hola {{ userData.user_name }}!</h2>
      <p>Estas en el panel de administracion</p>
      <button @click="logout" id="close-session">Cerrar sesion</button>
    </div>

    <!-- Show login/register forms if user is not authenticated -->
    <template v-else>
      <!-- Login Form -->
      <div class="form-container">
        <form @submit.prevent="handleLogin" id="login-form">
          <h2>Login</h2>
          <label for="login-email">email or user name</label>
          <input
            type="text"
            id="login-email"
            v-model="loginForm.userORemail"
            required
          />

          <label for="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            v-model="loginForm.password"
            required
          />

          <button type="submit" :disabled="loginLoading">Login</button>
          <span class="message" :class="{ 'error': loginError, 'success': !loginError }">
            {{ loginMessage }}
          </span>
        </form>
      </div>

      <!-- Register Form -->
      <div class="form-container">
        <form @submit.prevent="handleRegister" id="register-form">
          <h2>Register</h2>
          <label for="register-email">email</label>
          <input
            type="text"
            id="register-email"
            v-model="registerForm.email"
            required
          />

          <label for="register-username">user name</label>
          <input
            type="text"
            id="register-username"
            v-model="registerForm.user_name"
            required
          />

          <label for="register-password">Password</label>
          <input
            type="password"
            id="register-password"
            v-model="registerForm.password"
            required
          />

          <label for="register-confirm-password">Confirm Password</label>
          <input
            type="password"
            id="register-confirm-password"
            v-model="registerForm.confirmPassword"
            required
          />

          <button type="submit" :disabled="registerLoading">Register</button>
          <span class="message" :class="{ 'error': registerError, 'success': !registerError }">
            {{ registerMessage }}
          </span>
        </form>
      </div>
    </template>
  </div>
</template>
<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginRegister',
  setup() {
    const router = useRouter()
    
    // Reactive data
    const userData = ref(null)
    
    const loginForm = reactive({
      userORemail: '',
      password: ''
    })
    
    const registerForm = reactive({
      email: '',
      user_name: '',
      password: '',
      confirmPassword: ''
    })
    
    const loginMessage = ref('')
    const loginError = ref(false)
    const loginLoading = ref(false)
    
    const registerMessage = ref('')
    const registerError = ref(false)
    const registerLoading = ref(false)
    
    // Methods
    const handleLogin = async () => {
      loginLoading.value = true
      loginMessage.value = ''
      
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userORemail: loginForm.userORemail,
            password: loginForm.password
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          loginMessage.value = 'Sesion Iniciada... Entrando...'
          loginError.value = false
          
          setTimeout(() => {
            // Navigate to chat route or redirect
            router.push('/chat')
            // Or use window.location.href = '/chat' if not using Vue Router
          }, 1200)
        } else {
          loginMessage.value = 'Error al iniciar sesion'
          loginError.value = true
        }
      } catch (error) {
        loginMessage.value = 'Error de conexión'
        loginError.value = true
      } finally {
        loginLoading.value = false
      }
    }
    
    const handleRegister = async () => {
      // Validate passwords match
      if (registerForm.password !== registerForm.confirmPassword) {
        registerMessage.value = 'Las contraseñas no coinciden'
        registerError.value = true
        return
      }
      
      registerLoading.value = true
      registerMessage.value = ''
      
      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: registerForm.email,
            user_name: registerForm.user_name,
            password: registerForm.password
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          registerMessage.value = 'Usuario Registrado. Entrando...'
          registerError.value = false
          
          setTimeout(() => {
            // Navigate to chat route or redirect
            router.push('/chat')
            // Or use window.location.href = '/chat' if not using Vue Router
          }, 1200)
        } else {
          registerMessage.value = 'Error al registrar usuario'
          registerError.value = true
        }
      } catch (error) {
        registerMessage.value = 'Error de conexión'
        registerError.value = true
      } finally {
        registerLoading.value = false
      }
    }
    
    const logout = async () => {
      try {
        const response = await fetch('/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          userData.value = null
          // Redirect to home or reload
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    // Check if user is already authenticated on component mount
    const checkAuthStatus = async () => {
      try {
        // You might want to create an endpoint to check current auth status
        // For now, we'll assume user is not authenticated initially
        userData.value = null
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
    
    onMounted(() => {
      checkAuthStatus()
    })
    
    return {
      userData,
      loginForm,
      registerForm,
      loginMessage,
      loginError,
      loginLoading,
      registerMessage,
      registerError,
      registerLoading,
      handleLogin,
      handleRegister,
      logout
    }
  }
}
</script>
<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: "Roboto", sans-serif;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
}

.form-container {
  background-color: #fff;
  padding: 20px;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

form h2 {
  margin-bottom: 20px;
  font-size: 24px;
  text-align: center;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #218838;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.message {
  display: block;
  margin-top: 10px;
  font-weight: bold;
}

.message.success {
  color: green;
}

.message.error {
  color: red;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  text-align: center;
}

p {
  text-align: center;
  margin-bottom: 20px;
}
</style>