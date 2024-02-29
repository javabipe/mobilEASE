import axios from "axios";

export const identifyLocation = async () => {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const apiKey = "AIzaSyCrFDczBiXvDRY5pOTNYHl_6gDN83SOUcE";

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${apiKey}`
    );

    if (response.data.results.length > 0) {
      const addressComponents = response.data.results[0].address_components;

      // Mapear os tipos de componentes para montar o nome
      const addressDetails = {
        street: getAddressComponent(addressComponents, "route"),
        neighborhood: getAddressComponent(addressComponents, "sublocality"),
        city: getAddressComponent(addressComponents, "administrative_area_level_2"),
      };

      return {
        name: formatAddressDetails(addressDetails),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } else {
      throw new Error("Não foi possível obter informações de localização.");
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

const getAddressComponent = (addressComponents, type) => {
  const component = addressComponents.find(component => component.types.includes(type));
  return component ? component.long_name : "";
};

const formatAddressDetails = (addressDetails) => {
  return `${addressDetails.street}, ${addressDetails.neighborhood}, ${addressDetails.city}`;
};
