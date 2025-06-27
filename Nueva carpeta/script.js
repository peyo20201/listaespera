// Variables globales
let deferredPrompt;

// Funciones de utilidad
function convertirHora12(hora24) {
  const [hora, minutos] = hora24.split(':');
  let h = parseInt(hora);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutos} ${ampm}`;
}

function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function validarTelefono(telefono) {
  const regex = /^[0-9]{10,15}$/;
  return regex.test(telefono.replace(/\D/g, ''));
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const contenedor = document.getElementById('notificaciones-container');
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.textContent = mensaje;
  contenedor.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.classList.add('mostrar');
  }, 100);
  
  setTimeout(() => {
    notificacion.classList.remove('mostrar');
    setTimeout(() => contenedor.removeChild(notificacion), 300);
  }, 3000);
}

function mostrarCarga() {
  document.getElementById('loader').style.display = 'flex';
}

function ocultarCarga() {
  document.getElementById('loader').style.display = 'none';
}

// Reloj en tiempo real
function actualizarReloj() {
  const opcionesFecha = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const opcionesHora = { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true
  };
  
  const ahora = new Date();
  document.getElementById('fecha').textContent = ahora.toLocaleDateString('es-ES', opcionesFecha);
  document.getElementById('hora').textContent = ahora.toLocaleTimeString('es-ES', opcionesHora);
}

// WhatsApp mejorado
function abrirWhatsApp(numero, mensaje) {
  const enlaceWeb = `https://wa.me/${numero}?text=${mensaje}`;
  
  if (/Android/.test(navigator.userAgent)) {
    window.location.href = `whatsapp://send?phone=${numero}&text=${mensaje}`;
    
    setTimeout(() => {
      if (!document.hidden) {
        window.location.href = enlaceWeb;
      }
    }, 200);
  } else {
    window.open(enlaceWeb, '_blank');
  }
}

// Detectar conexión
function actualizarEstadoConexion() {
  const estadoElemento = document.getElementById('connection-status');
  if (navigator.onLine) {
    estadoElemento.textContent = 'En línea';
    estadoElemento.className = 'online';
    mostrarNotificacion('Conexión restablecida', 'success');
  } else {
    estadoElemento.textContent = 'Sin conexión';
    estadoElemento.className = 'offline';
    mostrarNotificacion('Modo offline activado. Los cambios se guardarán localmente', 'warning');
  }
}

// Formulario para agregar reservas
document.getElementById('formAgregar').addEventListener('submit', function(e) {
  e.preventDefault();
  mostrarCarga();
  
  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const dia = document.getElementById('dia').value;
  const horario = document.getElementById('horario').value;
  const cancha = document.getElementById('cancha').value;

  if (!validarTelefono(telefono)) {
    mostrarNotificacion('Teléfono debe tener 10-15 dígitos', 'error');
    ocultarCarga();
    return;
  }

  if (nombre && telefono && dia && horario && cancha) {
    setTimeout(() => {
      let listaEspera = JSON.parse(localStorage.getItem('listaEspera')) || [];
      
      // Verificar duplicados
      const existe = listaEspera.some(item => 
        item.nombre === nombre && item.dia === dia && item.horario === horario && item.cancha === cancha
      );
      
      if (existe) {
        mostrarNotificacion('Este registro ya existe', 'warning');
        ocultarCarga();
        return;
      }
      
      listaEspera.push({ nombre, telefono, dia, horario, cancha });
      localStorage.setItem('listaEspera', JSON.stringify(listaEspera));
      mostrarNotificacion('Agregado a la lista de espera');
      this.reset();
      ocultarCarga();
    }, 800);
  } else {
    mostrarNotificacion('Complete todos los campos', 'error');
    ocultarCarga();
  }
});

// Formulario para buscar reservas
document.getElementById('formBuscar').addEventListener('submit', function(e) {
  e.preventDefault();
  mostrarCarga();
  
  const diaBuscar = document.getElementById('diaBuscar').value;
  const horarioBuscar = document.getElementById('horarioBuscar').value;
  const canchaBuscar = document.getElementById('canchaBuscar').value;
  const lista = document.getElementById('listaResultados');
  lista.innerHTML = "";

  if (!diaBuscar || !horarioBuscar || !canchaBuscar) {
    mostrarNotificacion('Complete todos los campos', 'error');
    ocultarCarga();
    return;
  }

  setTimeout(() => {
    let listaEspera = JSON.parse(localStorage.getItem('listaEspera')) || [];
    const resultados = listaEspera.filter(item =>
      item.dia === diaBuscar && item.horario === horarioBuscar && item.cancha === canchaBuscar
    );

    if (resultados.length === 0) {
      lista.innerHTML = "<li class='sin-resultados'>No hay registros para esta búsqueda</li>";
    } else {
      resultados.forEach((item, index) => {
        const numeroLimpio = item.telefono.replace(/\D/g, '');
        const numeroWhatsApp = `57${numeroLimpio}`;
        const hora12 = convertirHora12(item.horario);
        const saludo = obtenerSaludo();

        const mensaje = encodeURIComponent(
          `${saludo} Sr(a). ${item.nombre}, es un gusto volver a contactarte.\n\n` +
          `Queríamos informarte que se ha liberado un horario para el ${item.dia} ` +
          `a las ${hora12} en la cancha ${item.cancha}.\n\n` +
          `Si te interesa aprovechar esta oportunidad, no dudes en escribirnos.\n` +
          `Estamos para ayudarte con cualquier consulta.`
        );

        const li = document.createElement('li');
        li.className = 'reserva-item';
        li.style.animationDelay = `${index * 0.1}s`;
        
        li.innerHTML = `
          <span class="nombre-reserva">${item.nombre}</span>
          <div class="info-reserva">
            <span><i class="fas fa-phone"></i> ${item.telefono}</span>
            <span><i class="fas fa-calendar-day"></i> ${item.dia}</span>
            <span><i class="fas fa-clock"></i> ${hora12}</span>
            <span><i class="fas fa-map-marked-alt"></i> Cancha ${item.cancha}</span>
          </div>
          <a href="#" class="whatsapp-link" onclick="abrirWhatsApp('${numeroWhatsApp}', '${mensaje}'); return false;">
            <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
          </a>
        `;
        lista.appendChild(li);
      });
    }
    ocultarCarga();
  }, 800);
});

// Botones de acciones
document.getElementById('btnReset').addEventListener('click', () => {
  if (confirm("¿Borrar toda la lista de espera? Esta acción no se puede deshacer.")) {
    mostrarCarga();
    setTimeout(() => {
      localStorage.removeItem('listaEspera');
      mostrarNotificacion('Lista de espera limpiada', 'success');
      document.getElementById('listaResultados').innerHTML = "";
      ocultarCarga();
    }, 800);
  }
});

document.getElementById('btnBackup').addEventListener('click', () => {
  if (!navigator.onLine) {
    mostrarNotificacion('Se requiere conexión para exportar', 'error');
    return;
  }
  
  mostrarCarga();
  setTimeout(() => {
    const data = localStorage.getItem('listaEspera') || '[]';
    const blob = new Blob([data], { type: "application/json" });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `respaldo_lista_espera_${new Date().toISOString().split('T')[0]}.json`;
    enlace.click();
    mostrarNotificacion('Respaldo descargado exitosamente');
    ocultarCarga();
  }, 800);
});

document.getElementById('btnImport').addEventListener('click', () => {
  document.getElementById('fileImport').click();
});

document.getElementById('fileImport').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  if (!confirm("¿Importar este respaldo? Se sobreescribirán los datos actuales.")) return;

  mostrarCarga();
  const lector = new FileReader();
  lector.onload = function(e) {
    setTimeout(() => {
      try {
        const datos = JSON.parse(e.target.result);
        if (!Array.isArray(datos)) throw new Error("Formato inválido");
        
        localStorage.setItem('listaEspera', JSON.stringify(datos));
        mostrarNotificacion("Respaldo importado exitosamente", 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        mostrarNotificacion("Error al importar. Verifique el archivo.", 'error');
        console.error(err);
        ocultarCarga();
      }
    }, 800);
  };
  lector.readAsText(archivo);
});

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('btnInstall').style.display = 'block';
});

document.getElementById('btnInstall').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      document.getElementById('btnInstall').style.display = 'none';
    }
    deferredPrompt = null;
  }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Reloj
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
  
  // Año actual
  document.getElementById('añoActual').textContent = new Date().getFullYear();
  
  // Estado de conexión
  window.addEventListener('online', actualizarEstadoConexion);
  window.addEventListener('offline', actualizarEstadoConexion);
  actualizarEstadoConexion();
  
  // Ocultar botón de instalación inicialmente
  document.getElementById('btnInstall').style.display = 'none';
});

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.log('Error al registrar ServiceWorker:', error);
      });
  });
}