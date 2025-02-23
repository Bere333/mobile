import axios from 'axios';
import Realm from 'realm';
import {getSchema} from './default';

export const getAreaName = ({coords}, mapboxToken) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'GET',
      url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?types=place&access_token=${mapboxToken}`,
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        res = res.data;
        if (res && res.features && res.features[0]) {
          resolve(res.features[0].place_name);
          // logging the error in to the db
          console.log({
            logType: 'Maps',
            message: `Fetched area name for coordinates: ${JSON.stringify(coords)}`,
          });
        } else {
          console.log({
            logType: 'Maps',
            message: `Got response for coordinates: ${JSON.stringify(coords)} but area name not present`,
            logStack: `Response ${JSON.stringify(res)}`,
          });
          reject(new Error(`Got response for coordinates: ${JSON.stringify(coords)} but area name not present`));
        }
      })
      .catch(err => {
        // logging the error in to the db
        console.log({
          logType: 'Maps',
          message: `Error while fetching area name for coordinates: ${JSON.stringify(coords)}`,
          logStack: JSON.stringify(err),
        });
      });
  });
};

export const getAllOfflineMaps = () => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        const offlineMaps = realm.objects('OfflineMaps');
        // logging the error in to the db
        console.log({
          logType: 'Maps',
          message: 'Fetched offline maps',
        });
        resolve(offlineMaps);
      })
      .catch(err => {
        // logging the error in to the db
        console.log({
          logType: 'Maps',
          message: 'Error while fetching the offline maps',
          logStack: JSON.stringify(err),
        });
        resolve(false);
      });
  });
};

export const deleteOfflineMap = ({name}) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          const offlineMaps = realm.objectForPrimaryKey('OfflineMaps', `${name}`);
          realm.delete(offlineMaps);
          // logging the error in to the db
          console.log({
            logType: 'Maps',
            message: 'Deleted offline maps',
          });
          resolve();
        });
      })
      .catch(err => {
        // logging the error in to the db
        console.log({
          logType: 'Maps',
          message: 'Error while deleting offline maps',
          logStack: JSON.stringify(err),
        });
        resolve(false);
      });
  });
};

export const createOfflineMap = ({name, size, areaName}) => {
  return new Promise((resolve, reject) => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          realm.create('OfflineMaps', {
            name: name.toString(),
            size: size.toString(),
            areaName: areaName.toString(),
          });
          // logging the error in to the db
          console.log({
            logType: 'Maps',
            message: `Created offline map for area: ${areaName}`,
            logStack: JSON.stringify({
              name,
              size,
            }),
          });
          resolve(name);
        });
      })
      .catch(err => {
        // logging the error in to the db
        console.log({
          logType: 'Maps',
          message: `Error while creating offline map for area: ${areaName}`,
          logStack: JSON.stringify(err),
        });
        reject(err);
      });
  });
};
