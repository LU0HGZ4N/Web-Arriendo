// Función genérica para obtener datos de Google Sheets
async function fetchSheetData() {
  try {
    const sheetsUrl = 'https://docs.google.com/spreadsheets/d/1vxRNCh-Sko3n4EuW_Ftqrikzxp7mUIKhuw8ahLkbwqA/gviz/tq?tqx=out:json&sheet=Datos';
    const response = await fetch(sheetsUrl);
    const data = await response.text();
    return JSON.parse(data.substr(47).slice(0, -2)).table.rows;
  } catch (error) {
    console.error('Error cargando datos de Google Sheets:', error);
    return [];
  }
}

// Función para actualizar precios/estados en index.html
async function updateIndexProperties() {
  const rows = await fetchSheetData();
  
  rows.forEach(row => {
    const propertyId = row.c[0]?.v;
    if (!propertyId) return;

    // Actualizar precio
    const priceElement = document.getElementById(`price-${propertyId}`);
    if (priceElement && row.c[1]?.v) {
      priceElement.textContent = `$${row.c[1].v} / mes`;
    }

    // Actualizar estado
    const statusElement = document.getElementById(`status-${propertyId}`);
    if (statusElement && row.c[2]?.v) {
      const status = row.c[2].v;
      statusElement.textContent = status;
      statusElement.className = 'status ' + 
        (status.toLowerCase().includes('disponible') ? 'available' : 'unavailable');
    }
  });
}

// Función para cargar datos de una propiedad específica (propiedad.html)
async function loadPropertyData(propertyId) {
  try {
    // Cargar datos estáticos
    const response = await fetch('propiedades.json');
    const staticData = await response.json();
    const property = staticData[propertyId];

    if (!property) throw new Error('Propiedad no encontrada');

    // Actualizar datos básicos
    document.title = `${property.nombre} - Propiedades Mi Padre`;
    document.getElementById('property-title').textContent = property.nombre;
    document.getElementById('property-location').textContent = property.ubicacion;
    document.getElementById('description').textContent = property.descripcion;

    // Info adicional
    const additionalInfoContainer = document.getElementById('additional-info');
    additionalInfoContainer.innerHTML = '';

    if (property.infoadicional) {
      for (const [key, value] of Object.entries(property.infoadicional)) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${key}:</strong> <span>${value}</span>`;
        additionalInfoContainer.appendChild(li);
      }
    }

    // Galería de imágenes
    const mainPhoto = document.getElementById('mainPhoto');
    const gallery = document.getElementById('gallery');

    if (property.imagenes?.length > 0) {
      mainPhoto.src = property.imagenes[0];
      gallery.innerHTML = '';

      property.imagenes.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.alt = `Imagen ${index + 1}`;
        if (index === 0) imgElement.classList.add('active');

        imgElement.addEventListener('click', () => {
          mainPhoto.src = img;
          document.querySelectorAll('#gallery img').forEach(i => i.classList.remove('active'));
          imgElement.classList.add('active');
        });

        gallery.appendChild(imgElement);
      });
    }

    // Multimedia
    document.getElementById('video-tour').src = property.video || '';
    document.getElementById('map').src = property.mapa || '';

    // Cargar datos dinámicos (precio/estado)
    await updatePropertyDynamicData(propertyId);

  } catch (error) {
    console.error('Error cargando datos de propiedad:', error);
    document.getElementById('property-title').textContent = 'Error cargando datos';
  }
}

// Función para actualizar datos dinámicos en propiedad.html
async function updatePropertyDynamicData(propertyId) {
  const rows = await fetchSheetData();
  const row = rows.find(row => row.c[0]?.v == propertyId);

  if (row) {
    const additionalInfoContainer = document.getElementById('additional-info');
    
    // Actualizar o crear precio
    const priceValue = `$${row.c[1]?.v || '---'} / mes`;
    updateOrCreateInfoItem('Precio', priceValue, additionalInfoContainer);
    
    // Actualizar o crear estado
    const statusValue = row.c[2]?.v || '---';
    const statusElement = updateOrCreateInfoItem('Estado', statusValue, additionalInfoContainer);
    
    if (statusElement) {
      statusElement.className = 'status ' + 
        (statusValue.toLowerCase().includes('disponible') ? 'available' : 'unavailable');
    }
  }
}

// Función auxiliar para actualizar/crear items de información
function updateOrCreateInfoItem(key, value, container) {
  let found = false;
  let targetSpan = null;
  
  // Buscar si ya existe
  const items = container.querySelectorAll('li');
  items.forEach(item => {
    if (item.textContent.includes(`${key}:`)) {
      item.innerHTML = `<strong>${key}:</strong> <span>${value}</span>`;
      found = true;
      targetSpan = item.querySelector('span');
    }
  });
  
  // Crear si no existe
  if (!found) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${key}:</strong> <span>${value}</span>`;
    container.appendChild(li);
    targetSpan = li.querySelector('span');
  }
  
  return targetSpan;
}

// Inicialización según la página
document.addEventListener('DOMContentLoaded', () => {
  // Página de detalle (propiedad.html)
  if (document.getElementById('property-title')) {
    const propertyId = new URLSearchParams(window.location.search).get('id') || 'A11B';
    loadPropertyData(propertyId);
  }
  // Página principal (index.html)
  else if (document.querySelector('.property-list')) {
    updateIndexProperties();
  }

  
});

// Modo oscuro
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Verificar preferencia del sistema o guardada en localStorage
if (localStorage.getItem('darkMode')) {
  body.classList.add('dark-mode');
  darkModeToggle.textContent = '☀️ Modo Claro';
}

// Alternar modo oscuro
darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
    darkModeToggle.textContent = '☀️ Modo Claro';
  } else {
    localStorage.removeItem('darkMode');
    darkModeToggle.textContent = '🌙 Modo Oscuro';
  }
});