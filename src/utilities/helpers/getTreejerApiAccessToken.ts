import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Web3 from 'web3';
import {getUserNonce} from 'utilities/helpers/userNonce';
import {userSign} from 'utilities/helpers/userSign';
import {hexEncode} from 'utilities/helpers/hex';
import {UserSignRes} from 'services/types';

export async function getTreejerPrivateKeyApiAccessToken(privateKey: string, web3: Web3): Promise<UserSignRes> {
  console.log(privateKey, 'private Key');
  if (!privateKey) {
    return;
  }

  const wallet = web3.eth.accounts.wallet.length ? web3.eth.accounts.wallet[0] : null;
  console.log(wallet, 'wallet<===');

  if (!wallet) {
    console.log('gets inside 1');
    return Promise.reject();
  }

  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, privateKey);
  console.log(hash, 'hash 2');
  const key = `ACCESS_TOKEN_${hash}`;
  console.log(key, 'key 3');

  const cachedToken = await AsyncStorage.getItem(key);

  console.log(cachedToken, 'cachedToken');

  const userId = await AsyncStorage.getItem('USER_ID');

  if (cachedToken) {
    return Promise.resolve({
      userId,
      loginToken: cachedToken,
    });
  }

  const userNonceResult = await getUserNonce(wallet.address);
  console.log(userNonceResult, 'userNonceResult is here<===');

  const signature = web3.eth.accounts.sign(hexEncode(userNonceResult.message), privateKey).signature;
  console.log(signature, 'signature <===');

  try {
    const credentials = await userSign(signature, wallet.address, key);
    console.log(credentials, 'credentials <===');
    return Promise.resolve(credentials);
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function getTreejerApiAccessToken(web3: Web3): Promise<UserSignRes> {
  await web3.eth.getAccounts((e, accounts) => {
    if (e) {
      console.log(e, 'e is here getAccounts eth');
    }
    console.log(accounts, 'accounts is here');
  });
  // @here
  const wallet = web3.eth.accounts.wallet.length ? web3.eth.accounts.wallet[0] : null;
  console.log(wallet, 'wallet<===');

  if (!wallet) {
    console.log('gets inside 1');
    return Promise.reject();
  }

  const key = `ACCESS_TOKEN_${wallet.address}`;
  console.log(key, 'key 3');

  const cachedToken = await AsyncStorage.getItem(key);
  console.log(cachedToken, 'cachedToken');

  const userId = await AsyncStorage.getItem('USER_ID');
  console.log(cachedToken, 'cachedToken <==');

  if (cachedToken) {
    return Promise.resolve({
      userId,
      loginToken: cachedToken,
    });
  }

  const userNonceResult = await getUserNonce(wallet.address);
  console.log(userNonceResult, 'userNonceResult is here<===');

  const signature = await web3.eth.sign(hexEncode(userNonceResult.message), wallet.address);
  console.log(signature, 'signature <===');

  try {
    const credentials = await userSign(signature, wallet.address, key);
    console.log(credentials, 'credentials <===');
    return Promise.resolve(credentials);
  } catch (e) {
    return Promise.reject(e);
  }
}
