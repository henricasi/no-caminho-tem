let geocoder;

function geocodeInit() {
  geocoder = new google.maps.Geocoder();
}

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