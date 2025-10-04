// Estado de la aplicación
let appState = {
  currentUser: null,
  currentView: 'pilotos',
  data: {
    pilotos: [],
    aeronaves: [],
    librosVuelo: [],
    solicitudes: [],
    rangos: []
  }
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Inicializar base de datos si es necesario
  google.script.run
    .withSuccessHandler(handleDatabaseInitialized)
    .withFailureHandler(showError)
    .initializeDatabase();
}

function handleDatabaseInitialized(result) {
  console.log('Base de datos inicializada:', result);
  setupEventListeners();
}

function setupEventListeners() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Navegación
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', handleNavigation);
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Botones de agregar
  document.getElementById('addPilotBtn').addEventListener('click', showAddPilotModal);
  document.getElementById('addAircraftBtn').addEventListener('click', showAddAircraftModal);
  document.getElementById('addFlightLogBtn').addEventListener('click', showAddFlightLogModal);
  document.getElementById('addRequestBtn').addEventListener('click', showAddRequestModal);
  document.getElementById('addRankBtn').addEventListener('click', showAddRankModal);
  
  // Cerrar modales
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModal);
  });
}

// Manejo de Login
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  google.script.run
    .withSuccessHandler(handleLoginSuccess)
    .withFailureHandler(handleLoginError)
    .login(username, password);
}

function handleLoginSuccess(result) {
  if (result.success) {
    appState.currentUser = result.user;
    showApp();
    loadInitialData();
  } else {
    showMessage('loginMessage', result.message, 'error');
  }
}

function handleLoginError(error) {
  showMessage('loginMessage', 'Error al conectar con el servidor', 'error');
}

function handleLogout() {
  appState.currentUser = null;
  showLogin();
  document.getElementById('loginForm').reset();
}

// Navegación
function handleNavigation(e) {
  e.preventDefault();
  const view = e.target.getAttribute('data-view');
  switchView(view);
}

function switchView(viewName) {
  // Actualizar navegación
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
  
  // Ocultar todas las vistas
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Mostrar vista actual
  document.getElementById(`${viewName}View`).classList.add('active');
  appState.currentView = viewName;
  
  // Cargar datos específicos de la vista
  loadViewData(viewName);
}

// Gestión de Pantallas
function showLogin() {
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('app').classList.remove('active');
}

function showApp() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('app').classList.add('active');
  document.getElementById('userWelcome').textContent = `Bienvenido, ${appState.currentUser.username}`;
}

// Carga de Datos
function loadInitialData() {
  loadPilots();
  loadAircrafts();
  loadFlightLogs();
  loadRequests();
  loadRanks();
}

function loadViewData(viewName) {
  switch(viewName) {
    case 'pilotos':
      loadPilots();
      break;
    case 'aeronaves':
      loadAircrafts();
      break;
    case 'libros-vuelo':
      loadFlightLogs();
      break;
    case 'solicitudes':
      loadRequests();
      break;
    case 'rangos':
      loadRanks();
      break;
    case 'resumen':
      loadSummary();
      break;
  }
}

function loadPilots() {
  google.script.run
    .withSuccessHandler(displayPilots)
    .withFailureHandler(showError)
    .getPilots();
}

function displayPilots(pilots) {
  appState.data.pilotos = pilots;
  const container = document.getElementById('pilotsList');
  
  if (pilots.length === 0) {
    container.innerHTML = '<div class="message info">No hay pilotos registrados</div>';
    return;
  }
  
  container.innerHTML = pilots.map(pilot => `
    <div class="card" data-pilot="${pilot.Piloto}">
      <div class="card-header">
        <img src="${pilot.Imagen || 'https://via.placeholder.com/50x50?text=P'}" 
             alt="${pilot.Piloto}" class="card-avatar">
        <div>
          <div class="card-title">${pilot.Piloto}</div>
          <div class="card-subtitle">NUIM: ${pilot.NUIM}</div>
        </div>
      </div>
      <div class="card-content">
        <div><strong>Rango:</strong> ${pilot.Rango}</div>
        <div><strong>Email:</strong> ${pilot.Email}</div>
        <div><strong>Estado:</strong> 
          <span class="badge ${pilot.Estado === 'ACTIVO' ? 'badge-success' : 'badge-error'}">
            ${pilot.Estado}
          </span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-primary" onclick="viewPilot('${pilot.Piloto}')">
          Ver Perfil
        </button>
        <button class="btn btn-secondary" onclick="editPilot('${pilot.Piloto}')">
          Editar
        </button>
      </div>
    </div>
  `).join('');
}

// Funciones para modales (simplificadas)
function showAddPilotModal() {
  // Implementar modal para agregar piloto
  showModal('addPilotModal');
}

function showAddAircraftModal() {
  // Implementar modal para agregar aeronave
  showModal('addAircraftModal');
}

function showAddFlightLogModal() {
  // Implementar modal para agregar libro de vuelo
  showModal('addFlightLogModal');
}

function showAddRequestModal() {
  // Implementar modal para agregar solicitud
  showModal('addRequestModal');
}

function showAddRankModal() {
  // Implementar modal para agregar rango
  showModal('addRankModal');
}

function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
}

// Utilidades
function showMessage(containerId, message, type = 'info') {
  const container = document.getElementById(containerId);
  container.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function showError(error) {
  console.error('Error:', error);
  alert('Error: ' + error.message);
}

// Las demás funciones de carga (loadAircrafts, loadFlightLogs, etc.) siguen un patrón similar
// Implementar según sea necesario
