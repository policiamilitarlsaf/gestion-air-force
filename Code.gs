// Configuración
var SPREADSHEET_ID = '1dUD8EmC46YXjFlE_zLIHOIK3qvCptdflMIVh2GXvm-s';

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Inicializar base de datos
function initializeDatabase() {
  var ss = getSpreadsheet();
  
  // Crear hojas si no existen
  var sheets = ['Usuarios', 'Pilotos', 'Aeronaves', 'LibrosVuelo', 'Solicitudes', 'Rangos', 'Ascensos', 'FichasPilotos', 'Resumen'];
  
  sheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Configurar columnas según la hoja
      switch(sheetName) {
        case 'Usuarios':
          sheet.getRange('A1:D1').setValues([['Usuario', 'Contraseña', 'Rol', 'Estado']]);
          // Crear usuario demo
          sheet.getRange('A2:D2').setValues([['admin', 'admin123', 'ADMIN', 'ACTIVO']]);
          break;
        case 'Pilotos':
          sheet.getRange('A1:H1').setValues([['Piloto', 'Email', 'NUIM', 'FechaIngreso', 'Rol', 'Estado', 'Rango', 'Imagen']]);
          break;
        case 'Aeronaves':
          sheet.getRange('A1:C1').setValues([['Callsign', 'Modelo', 'Imagen']]);
          break;
        case 'LibrosVuelo':
          sheet.getRange('A1:I1').setValues([['LibroVuelo', 'Piloto', 'Aeronave', 'HoraDespegue', 'HoraAterrizaje', 'TiempoTotal', 'Ruta', 'Motivo', 'Observaciones']]);
          break;
        case 'Solicitudes':
          sheet.getRange('A1:H1').setValues([['Solicitud', 'Piloto', 'NUIM', 'Rango', 'Fecha', 'Aeronave', 'Disponibilidad', 'Estado']]);
          break;
        case 'Rangos':
          sheet.getRange('A1:C1').setValues([['Imagen', 'Nombre', 'Escalafon']]);
          break;
        case 'Ascensos':
          sheet.getRange('A1:C1').setValues([['Piloto', 'Fecha', 'Rango']]);
          break;
        case 'FichasPilotos':
          sheet.getRange('A1:F1').setValues([['Piloto', 'Imagen', 'FechaNacimiento', 'TipoSangre', 'Nacionalidad', 'Email']]);
          break;
        case 'Resumen':
          sheet.getRange('A1:E1').setValues([['Lider', 'FechaAsuncion', 'Foto', 'Mision', 'Vision']]);
          break;
      }
    }
  });
  
  return 'Base de datos inicializada correctamente';
}

// Autenticación
function login(username, password) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Usuarios');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === password && data[i][3] === 'ACTIVO') {
      return {
        success: true,
        user: {
          username: data[i][0],
          rol: data[i][2]
        }
      };
    }
  }
  
  return { success: false, message: 'Usuario o contraseña incorrectos' };
}

// Funciones para Pilotos
function getPilots() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Pilotos');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var pilots = [];
  
  for (var i = 1; i < data.length; i++) {
    var pilot = {};
    for (var j = 0; j < headers.length; j++) {
      pilot[headers[j]] = data[i][j];
    }
    pilots.push(pilot);
  }
  
  return pilots;
}

function addPilot(pilotData) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Pilotos');
  var userSheet = ss.getSheetByName('Usuarios');
  
  // Agregar a pilotos
  sheet.appendRow([
    pilotData.Piloto,
    pilotData.Email,
    pilotData.NUIM,
    pilotData.FechaIngreso,
    pilotData.Rol,
    pilotData.Estado,
    pilotData.Rango,
    pilotData.Imagen || ''
  ]);
  
  // Agregar usuario
  userSheet.appendRow([
    pilotData.Email.split('@')[0], // usuario
    'temp123', // contraseña temporal
    pilotData.Rol,
    pilotData.Estado
  ]);
  
  return { success: true, message: 'Piloto agregado correctamente' };
}

function updatePilot(pilotData) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Pilotos');
  var userSheet = ss.getSheetByName('Usuarios');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === pilotData.Piloto) {
      sheet.getRange(i+1, 2, 1, 7).setValues([[
        pilotData.Email,
        pilotData.NUIM,
        pilotData.FechaIngreso,
        pilotData.Rol,
        pilotData.Estado,
        pilotData.Rango,
        pilotData.Imagen || ''
      ]]);
      
      // Actualizar estado en usuarios si se archivó
      if (pilotData.Estado === 'ARCHIVADO') {
        var userData = userSheet.getDataRange().getValues();
        for (var j = 1; j < userData.length; j++) {
          if (userData[j][0] === pilotData.Email.split('@')[0]) {
            userSheet.getRange(j+1, 4).setValue('ARCHIVADO');
            userSheet.getRange(j+1, 2).setValue(''); // Borrar contraseña
            break;
          }
        }
      }
      
      return { success: true, message: 'Piloto actualizado correctamente' };
    }
  }
  
  return { success: false, message: 'Piloto no encontrado' };
}

// Funciones para Aeronaves
function getAircrafts() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Aeronaves');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var aircrafts = [];
  
  for (var i = 1; i < data.length; i++) {
    var aircraft = {};
    for (var j = 0; j < headers.length; j++) {
      aircraft[headers[j]] = data[i][j];
    }
    aircrafts.push(aircraft);
  }
  
  return aircrafts;
}

function addAircraft(aircraftData) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Aeronaves');
  
  sheet.appendRow([
    aircraftData.Callsign,
    aircraftData.Modelo,
    aircraftData.Imagen || ''
  ]);
  
  return { success: true, message: 'Aeronave agregada correctamente' };
}

// Funciones para Libros de Vuelo
function getFlightLogs() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('LibrosVuelo');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var logs = [];
  
  for (var i = 1; i < data.length; i++) {
    var log = {};
    for (var j = 0; j < headers.length; j++) {
      log[headers[j]] = data[i][j];
    }
    logs.push(log);
  }
  
  return logs;
}

function addFlightLog(logData) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('LibrosVuelo');
  
  // Calcular tiempo total
  var despegue = new Date(logData.HoraDespegue);
  var aterrizaje = new Date(logData.HoraAterrizaje);
  var tiempoTotal = (aterrizaje - despegue) / (1000 * 60 * 60); // en horas
  
  // Validar fechas
  if (tiempoTotal < 0) {
    return { success: false, message: 'Fecha incorrecta: la hora de aterrizaje no puede ser anterior a la de despegue' };
  }
  
  if (tiempoTotal > 12) {
    return { success: false, message: 'Fecha incorrecta: el tiempo de vuelo no puede exceder las 12 horas' };
  }
  
  // Generar número de libro de vuelo
  var lastLog = getLastFlightLogNumber();
  var nextNumber = lastLog + 1;
  var libroVuelo = 'FZ-' + String(nextNumber).padStart(5, '0');
  
  sheet.appendRow([
    libroVuelo,
    logData.Piloto,
    logData.Aeronave,
    logData.HoraDespegue,
    logData.HoraAterrizaje,
    tiempoTotal.toFixed(2),
    logData.Ruta,
    logData.Motivo,
    logData.Observaciones
  ]);
  
  return { success: true, message: 'Libro de vuelo registrado correctamente' };
}

function getLastFlightLogNumber() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('LibrosVuelo');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return 0;
  
  var lastLog = data[data.length - 1][0]; // FZ-00001
  var number = parseInt(lastLog.split('-')[1]);
  return number;
}

// Funciones para Solicitudes
function getRequests() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Solicitudes');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var requests = [];
  
  for (var i = 1; i < data.length; i++) {
    var request = {};
    for (var j = 0; j < headers.length; j++) {
      request[headers[j]] = data[i][j];
    }
    requests.push(request);
  }
  
  return requests;
}

function addRequest(requestData) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Solicitudes');
  
  // Generar número de solicitud
  var lastRequest = getLastRequestNumber();
  var nextNumber = lastRequest + 1;
  var solicitud = 'AETC-' + String(nextNumber).padStart(5, '0');
  
  sheet.appendRow([
    solicitud,
    requestData.Piloto,
    requestData.NUIM,
    requestData.Rango,
    new Date(),
    requestData.Aeronave,
    requestData.Disponibilidad,
    'PENDIENTE'
  ]);
  
  return { success: true, message: 'Solicitud enviada correctamente' };
}

function getLastRequestNumber() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Solicitudes');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return 0;
  
  var lastRequest = data[data.length - 1][0]; // AETC-00001
  var number = parseInt(lastRequest.split('-')[1]);
  return number;
}

// Funciones para Rangos
function getRanks() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Rangos');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var ranks = [];
  
  for (var i = 1; i < data.length; i++) {
    var rank = {};
    for (var j = 0; j < headers.length; j++) {
      rank[headers[j]] = data[i][j];
    }
    ranks.push(rank);
  }
  
  return ranks;
}

// Funciones para manejar archivos (imágenes)
function saveFile(blob, fileName) {
  var folder = DriveApp.getRootFolder(); // Puedes cambiar esto por una carpeta específica
  var file = folder.createFile(blob);
  file.setName(fileName);
  return file.getUrl();
}
