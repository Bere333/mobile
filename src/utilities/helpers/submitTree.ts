import {getHttpDownloadUrl} from 'utilities/helpers/IPFS';
import {currentTimestamp} from 'utilities/helpers/date';
import {TreeDetailQueryQueryData} from 'screens/GreenBlock/screens/TreeDetails/graphql/TreeDetailQuery.graphql';
import {TreeJourney} from 'screens/TreeSubmission/types';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SubmitTreeData {
  export interface Options {
    photoUploadHash: string;
    tree: TreeDetailQueryQueryData.Tree;
    journey: TreeJourney;
  }

  export interface NewTreeOptions {
    photoUploadHash: string;
    journey: TreeJourney;
  }

  export interface JSONDataUpdate {
    image: string;
    image_hash: string;
    created_at: string;
  }

  export interface Location {
    latitude: string;
    longitude: string;
  }

  export interface ExtraLocation {
    latitude?: string;
    longitude?: string;
  }

  export interface JSONData extends ExtraJSONData {
    location: Location;
    updates: JSONDataUpdate[];
  }

  export interface ExtraJSONData {
    name?: string;
    description?: string;
    external_url?: string;
    image_ipfs_hash?: string;
    symbol?: string;
    symbol_ipfs_hash?: string;
    animation_url?: string;
    diameter?: string;
    attributes?: string;
    image?: string;
    location?: ExtraLocation;
    nursery?: string;
    locations?: Location[];
    updates?: JSONDataUpdate[];
  }
}

export function updateTreeJSON(url: string, options: SubmitTreeData.Options) {
  const {photoUploadHash, tree, journey} = options;

  console.log(tree, 'updateTreeJSON tree');

  const birthDay = currentTimestamp();

  const updateSpec: SubmitTreeData.JSONDataUpdate = {
    image: getHttpDownloadUrl(url, photoUploadHash),
    image_hash: photoUploadHash,
    created_at: birthDay?.toString(),
  };

  const treeSpecJson = tree?.treeSpecsEntity;
  let updates: SubmitTreeData.JSONDataUpdate[];

  if (typeof treeSpecJson?.updates != 'undefined' && treeSpecJson?.updates != '') {
    updates = JSON.parse(treeSpecJson?.updates);
    updates.push(updateSpec);
  } else {
    updates = [updateSpec];
  }

  let jsonData: SubmitTreeData.JSONData = {
    location: {
      latitude: tree?.treeSpecsEntity?.latitude?.toString(),
      longitude: tree?.treeSpecsEntity?.longitude?.toString(),
    },
    updates,
  };

  jsonData = {
    ...fillExtraJsonData(tree),
    ...jsonData,
  };

  if (
    treeSpecJson.nursery === 'true' &&
    journey.location?.longitude &&
    journey.location?.latitude &&
    !journey.nurseryContinuedUpdatingLocation
  ) {
    jsonData.location = {
      latitude: Math.trunc(journey.location.latitude * Math.pow(10, 6))?.toString(),
      longitude: Math.trunc(journey.location.longitude * Math.pow(10, 6))?.toString(),
    };
    const prevLocation = {
      latitude: tree?.treeSpecsEntity?.latitude?.toString(),
      longitude: tree?.treeSpecsEntity?.longitude?.toString(),
    };
    jsonData.locations = treeSpecJson.locations?.length
      ? [...(JSON.parse(treeSpecJson.locations) || []), prevLocation]
      : [prevLocation];
  }

  console.log(jsonData, 'updateTreeJSON jsonData');

  return jsonData;
}

export function assignedTreeJSON(url: string, options: SubmitTreeData.Options) {
  const {photoUploadHash, tree, journey} = options;

  console.log(tree, 'assignedTreeJSON tree');

  const birthDay = currentTimestamp();

  const updateSpec: SubmitTreeData.JSONDataUpdate = {
    image: getHttpDownloadUrl(url, photoUploadHash),
    image_hash: photoUploadHash,
    created_at: birthDay?.toString(),
  };

  const treeSpecJson = tree?.treeSpecsEntity;
  let updates: SubmitTreeData.JSONDataUpdate[];

  if (typeof treeSpecJson?.updates != 'undefined' && treeSpecJson?.updates != '') {
    updates = JSON.parse(treeSpecJson?.updates);
    updates.push(updateSpec);
  } else {
    updates = [updateSpec];
  }

  let jsonData: SubmitTreeData.JSONData = {
    location: {
      latitude: Math.trunc(journey.location.latitude * Math.pow(10, 6))?.toString(),
      longitude: Math.trunc(journey.location.longitude * Math.pow(10, 6))?.toString(),
    },
    updates,
  };

  jsonData = {
    ...fillExtraJsonData(tree),
    ...jsonData,
  };

  console.log(jsonData, 'assignedTreeJSON jsonData');

  return jsonData;
}

export function newTreeJSON(url: string, options: SubmitTreeData.NewTreeOptions) {
  const {journey, photoUploadHash} = options;

  const birthDay = currentTimestamp();

  const jsonData: SubmitTreeData.JSONData = {
    location: {
      latitude: Math.trunc(journey.location.latitude * Math.pow(10, 6))?.toString(),
      longitude: Math.trunc(journey.location.longitude * Math.pow(10, 6))?.toString(),
    },
    updates: [
      {
        image: getHttpDownloadUrl(url, photoUploadHash),
        image_hash: photoUploadHash,
        created_at: birthDay?.toString(),
      },
    ],
  };
  if (journey.isSingle === false) {
    jsonData.nursery = 'true';
  }

  console.log(jsonData, 'newTreeJSON jsonData');

  return jsonData;
}

export function canUpdateTreeLocation(journey: TreeJourney, isNursery: boolean) {
  console.log(journey?.tree?.treeSpecsEntity?.locations, 'ourney?.tree?.treeSpecsEntity?.locations');
  return journey?.tree?.treeSpecsEntity?.locations?.length === 0 && isNursery;
}

export function fillExtraJsonData(tree: TreeDetailQueryQueryData.Tree): SubmitTreeData.ExtraJSONData {
  const extraJson: SubmitTreeData.ExtraJSONData = {};
  if (tree?.treeSpecsEntity?.name) {
    extraJson.name = tree?.treeSpecsEntity?.name;
  }
  if (tree?.treeSpecsEntity?.description) {
    extraJson.description = tree?.treeSpecsEntity?.description;
  }
  if (tree?.treeSpecsEntity?.externalUrl) {
    extraJson.external_url = tree?.treeSpecsEntity?.externalUrl;
  }
  if (tree?.treeSpecsEntity?.imageHash) {
    extraJson.image_ipfs_hash = tree?.treeSpecsEntity?.imageHash;
  }
  if (tree?.treeSpecsEntity?.symbolFs) {
    extraJson.symbol = tree?.treeSpecsEntity?.symbolFs;
  }
  if (tree?.treeSpecsEntity?.symbolHash) {
    extraJson.symbol_ipfs_hash = tree?.treeSpecsEntity?.symbolHash;
  }
  if (tree?.treeSpecsEntity?.animationUrl) {
    extraJson.animation_url = tree?.treeSpecsEntity?.animationUrl;
  }
  if (tree?.treeSpecsEntity?.diameter) {
    extraJson.diameter = tree?.treeSpecsEntity?.diameter?.toString();
  }
  if (tree?.treeSpecsEntity?.attributes) {
    try {
      const attributes = JSON.parse(tree?.treeSpecsEntity?.attributes);
      extraJson.attributes = attributes;
    } catch (e) {}
  }
  if (tree?.treeSpecsEntity?.updates) {
    try {
      const updates = JSON.parse(tree?.treeSpecsEntity?.updates);
      extraJson.updates = updates;
    } catch (e) {}
  }
  if (tree?.treeSpecsEntity?.locations) {
    try {
      const locations = JSON.parse(tree?.treeSpecsEntity?.locations);
      extraJson.locations = locations;
    } catch (e) {}
  }
  if (tree?.treeSpecsEntity?.imageFs) {
    extraJson.image = tree?.treeSpecsEntity?.imageFs?.toString();
  }
  if (tree?.treeSpecsEntity?.image_ipfs_hash) {
    extraJson.image_ipfs_hash = tree?.treeSpecsEntity?.image_ipfs_hash?.toString();
  }
  if (tree?.treeSpecsEntity?.nursery) {
    extraJson.nursery = tree?.treeSpecsEntity?.nursery?.toString();
  }
  if (tree?.treeSpecsEntity?.latitude) {
    extraJson.location = {
      ...(extraJson.location || {}),
      latitude: tree.treeSpecsEntity?.latitude,
    };
  }
  if (tree?.treeSpecsEntity?.longitude) {
    extraJson.location = {
      ...(extraJson.location || {}),
      longitude: tree.treeSpecsEntity?.longitude,
    };
  }
  return extraJson;
}
