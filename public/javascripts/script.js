window.onload = () => {
    getVendas();
  };

  function getVendas() {
    axios.get("/api")
    .then(response => {
      placeVendas(response.data.vendas);
    })
    .catch(error => {
      console.log(error);
    })
  }

  //TODO pegar geolocalização

  function placeVendas(vendas){
    const markers = []

    const ironhackBCN = {
      lat: 41.386230, 
      lng: 2.174980
    };

    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: ironhackBCN
    });

    vendas.forEach((venda) => {
      const center = {
        lat: venda.location.coordinates[1],
        lng: venda.location.coordinates[0]
      };
      const pin = new google.maps.Marker({
        position: center,
        map: map,
        title: venda.name
      });

      markers.push(pin);
    });
  }