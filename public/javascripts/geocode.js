let geocoder;
let map;
let infoWindowActive = [];

const now = new Date();
const horasAgora = now.getHours();
const minutosAgora = now.getMinutes();

//FILTROS
document.addEventListener("click", function(e){
  if (e.target.name === "horario" && e.target.value === "on") {
    getVendas(true);
  } else if (e.target.name === "horario" && e.target.value === "off") {
    getVendas(false);
  }
});


function mapsInit() {
  geocoder = new google.maps.Geocoder();
  if (document.getElementById('map')) {
    startMap();
  }
}

// START Geocoder (transformar endereço em coordenadas)
if (document.getElementById('streetAddress')) {
  document.getElementById('streetAddress').addEventListener('focusout', function () {
    geocodeAddress(geocoder);
  });
} 

function geocodeAddress(geocoder) {
  let myAddress = document.getElementById('streetAddress').value;

  geocoder.geocode({ 'address': myAddress }, function (results, status) {

    if (status === 'OK') {
      console.log(results)
      document.getElementById('latitude').value = results[0].geometry.location.lat();
      document.getElementById('longitude').value = results[0].geometry.location.lng();
    } else {
      // alert('Geocode was not successful for the following reason: ' + status);
      alert('Digite um endereço válido');
    }
  });
}
// END Geocoder

function startMap() {
  // Store Ironhack's coordinates
  const ironhackSAO = { lat: -23.5617714,  lng: -46.6601914 };

  // Initialize the map
  map = new google.maps.Map(document.getElementById('map'), 
    {
      zoom: 15,
      center: ironhackSAO
    }
  );

  // GEOLOCALIZAÇÃO (muda o centro do mapa)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const user_location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Center map with user location
      map.setCenter(user_location);

    }, function () {
      console.log('Error in the geolocation service.');
    });
  } else {
    console.log('Browser does not support geolocation.');
  }
  // END GEOLOCALIZAÇÃO

  // POSICIONAR pins das vendinhas no mapa, criar info windows
  getVendas(true);

}

function getVendas(status) {
  // aqui dentro o filtro de categorias (será?)
  axios.get("/api")
  .then(response => {
    placeVendas(response.data.vendas, status);
  })
  .catch(error => {
    console.log(error);
  })
}

let markers = [];

// funções para DOM node
function displayPicture(venda) {
  let string = "";
  if (venda.pictures.length > 0) {
    string += `<figure><img class="windowpic" src="${venda.pictures[0].path}" alt="${venda.pictures[0].description}"></figure>`
  }
  return string;
}

function categoriesHTML(categories) {
  let string = "";
  for (let i = 0; i < categories.length; i += 1) {
    if (i === categories.length - 1) {
      string += `<span>${categories[i]}</span>`;  
    } else {
      string += `<span>${categories[i]}, </span>`;
    }
  }
  return string;
}
// end funções para DOM node

function placeVendas(vendas, status){
  //reseta markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  vendas.forEach((venda) => {
    if (status) {
      if (filtroHorário(venda)) {
        createPin(venda);
      }
    } else {
      createPin(venda);
    }
  });
}

function createPin(venda) {
  const center = {
    lat: venda.location.coordinates[1],
    lng: venda.location.coordinates[0]
  };
  const pin = new google.maps.Marker({
    position: center,
    map: map,
    title: venda.name
  });
  
  const infoWindowContent = `<div class="infoWindow">${displayPicture(venda)}<h4>${venda.name}</h4><p>${categoriesHTML(venda.categories)}</p><p>Endereço: <strong>${venda.streetAddress}</strong></p><p>Horário: <strong>${venda.startTime} - ${venda.endTime}</strong></p><a href="/venda/${venda._id}">Mais detalhes</a></div`;
  
  const infowindow = new google.maps.InfoWindow({
    content: infoWindowContent,
    maxWidth: 300
  });
  
  pin.addListener('click', function () {
    closeOtherInfo();
    infowindow.open(pin.get('map'), pin);
    infoWindowActive[0] = infowindow;
  });
  
  markers.push(pin);
}

function closeOtherInfo() {
  if (infoWindowActive.length > 0) {
      /* detach the info-window from the marker ... undocumented in the API docs */
      infoWindowActive[0].set("marker", null);
      /* and close it */
      infoWindowActive[0].close();
      /* blank the array */
      infoWindowActive.length = 0;
  }
}

function filtroHorário (venda) {
  const horasVendaAbre = venda.startTime.substring(0,2)
  const minutosVendaAbre = venda.startTime.substring(3)
  const horasVendaFecha = venda.endTime.substring(0,2)
  const minutosVendaFecha = venda.endTime.substring(3)
  
  if (horasAgora >= horasVendaAbre && horasAgora <= horasVendaFecha) {
    if (horasAgora === horasVendaAbre) {
      if (minutosAgora >= minutosVendaAbre) {
        return true;
      } else {
        return false;
      }
    } else if (horasAgora === horasVendaFecha) {
      if (minutosAgora < minutosVendaFecha) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}


