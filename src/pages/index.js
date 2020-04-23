import React, { useRef } from 'react';
import Helmet from 'react-helmet';
import L from 'leaflet';

import Layout from 'components/Layout';
import Container from 'components/Container';
import Map from 'components/Map';

import axios from 'axios';


class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total: 0
    }
  }

  async componentDidMount() {
    let response;
    let totalCases;
    try {
      response = await axios.get('https://corona.lmao.ninja/v2/countries');

    } catch (e) {
      console.log(`failed: ${e.message}`, e);
      return;
    }
    const { data = [] } = response;
    totalCases = data.reduce((acc, country) => {
      return acc + country.cases
    }, 0);
    console.log(totalCases);

    this.setState({
      total: totalCases
    });
  }

  render() {
    const LOCATION = {
      lat: 0,
      lng: 0
    };
    const CENTER = [LOCATION.lat, LOCATION.lng];
    const DEFAULT_ZOOM = 2;

    async function mapEffect({ leafletElement: map } = {}) {
      let response;
      try {
        response = await axios.get('https://corona.lmao.ninja/v2/countries');

      } catch (e) {
        console.log(`failed: ${e.message}`, e);
        return;
      }
      const { data = [] } = response;

      const hasData = Array.isArray(data) && data.length > 0;

      if (!hasData) return;

      const geoJson = {
        type: 'FeatureCollection',
        features: data.map((country = {}) => {
          const { countryInfo = {} } = country;
          const { lat, long: lng } = countryInfo;
          return {
            type: 'Feature',
            properties: {
              ...country,
            },
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          }
        })
      }

      const geoJsonLayers = new L.GeoJSON(geoJson, {
        pointToLayer: (feature = {}, latlng) => {
          const { properties = {} } = feature;
          let updatedFormatted;
          let casesString;

          const {
            country, updated, cases, deaths, recovered
          } = properties;

          casesString = `${cases}`;

          if (cases > 1000) {
            casesString = `${casesString.slice(0, -3)}k+`;
          }

          if (updated) {
            updatedFormatted = new Date(updated).toLocaleString();
          }

          const html = `
          <span class="icon-marker">
            <span class="icon-marker-tooltip">
              <h2>${country}</h2>
              <ul>
                <li><strong>Confirmed:</strong> ${cases}</li>
                <li><strong>Deaths:</strong> ${deaths}</li>
                <li><strong>Recovered:</strong> ${recovered}</li>
                <li><strong>Last Update:</strong> ${updatedFormatted}</li>
              </ul>
            </span>
            ${ casesString}
          </span>
        `;
          return L.marker(latlng, {
            icon: L.divIcon({
              className: 'icon',
              html
            }),
            riseOnHover: true
          });
        }
      });
      geoJsonLayers.addTo(map);
    }

    const mapSettings = {
      center: CENTER,
      defaultBaseMap: 'OpenStreetMap',
      zoom: DEFAULT_ZOOM,
      mapEffect
    };

    return (
      <Layout pageName="home">
        <Helmet>
          <title>Home Page</title>
        </Helmet>

        <Map {...mapSettings}>
        </Map>

        <h3>Total cases: {this.state.total}</h3>
      </Layout>
    );
  }
};

export default IndexPage;
