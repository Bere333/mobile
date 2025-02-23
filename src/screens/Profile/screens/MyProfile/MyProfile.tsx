import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import globalStyles from 'constants/styles';
import {colors} from 'constants/values';
import ShimmerPlaceholder from 'components/ShimmerPlaceholder';
import Button from 'components/Button';
import Spacer from 'components/Spacer';
import Avatar from 'components/Avatar';
import {useConfig, usePlanterFund, useWalletAccount, useWalletWeb3} from 'services/web3';
import {useCurrentUser, UserStatus} from 'services/currentUser';
import usePlanterStatusQuery from 'utilities/hooks/usePlanterStatusQuery';
import {useTranslation} from 'react-i18next';
import Invite from 'screens/Profile/screens/MyProfile/Invite';
import SimpleToast from 'react-native-simple-toast';
import {useAnalytics} from 'utilities/hooks/useAnalytics';
import Clipboard from '@react-native-clipboard/clipboard';
import AppVersion from 'components/AppVersion';
import useNetInfoConnected from 'utilities/hooks/useNetInfo';
import {useSettings} from 'services/settings';
import {ProfileRouteParamList} from 'types';
import {sendTransactionWithGSN} from 'utilities/helpers/sendTransaction';
import {ContractType} from 'services/config';

interface Props {
  navigation: any;
  route?: RouteProp<ProfileRouteParamList, 'MyProfile'>;
}

function MyProfile(_: Props) {
  const {t} = useTranslation();

  const requiredBalance = useMemo(() => 500000000000000000, []);
  const [minBalance, setMinBalance] = useState<number>(requiredBalance);
  const planterFundContract = usePlanterFund();
  const config = useConfig();
  // @here This useEffect should be a hook or fix minBalanceQuery method
  useEffect(() => {
    getMinBalance();
  }, []);

  const getMinBalance = () => {
    planterFundContract.methods
      .minWithdrawable()
      .call()
      .then(balance => {
        setMinBalance(balance);
      })
      .catch(e => {
        console.log(e, 'e inside get minWithdrawable');
        setMinBalance(requiredBalance);
      });
  };

  const navigation = useNavigation();
  const web3 = useWalletWeb3();
  const wallet = useWalletAccount();
  const {useGSN} = useSettings();

  const {sendEvent} = useAnalytics();

  const {data, loading, status, refetchUser, handleLogout} = useCurrentUser({didMount: true});
  const isVerified = data?.user?.isVerified;

  const isConnected = useNetInfoConnected();

  // const minBalanceQuery = useQuery<PlanterMinWithdrawableBalanceQueryQueryData>(planterMinWithdrawQuery, {
  //   variables: {},
  //   fetchPolicy: 'cache-first',
  // });

  const skipStats = !wallet || !isVerified;

  const {
    data: planterData,
    refetchPlanterStatus: planterRefetch,
    refetching,
  } = usePlanterStatusQuery(wallet, skipStats);

  // const planterTreesCountResult = useQuery<PlanterTreesCountQueryData>(planterTreesCountQuery, {
  //   variables: {
  //     address,
  //   },
  //   skip: skipStats,
  // });

  // const planterWithdrawableBalanceResult = useQuery(planterWithdrawableBalanceQuery, {
  //   variables: {
  //     address,
  //   },
  //   fetchPolicy: 'cache-first',
  //   skip: skipStats,
  // });

  const getPlanter = useCallback(async () => {
    if (!isConnected) {
      return;
    }
    try {
      await planterRefetch();
      await getMinBalance();
    } catch (e) {
      console.log(e, 'e is hereeeeee getPlanter');
    }
  }, [getMinBalance, isConnected, planterRefetch]);

  const parseBalance = useCallback(
    (balance: string, fixed = 5) => parseFloat(web3?.utils?.fromWei(balance))?.toFixed(fixed),
    [web3?.utils],
  );

  useEffect(() => {
    if (wallet && isConnected) {
      getPlanter().then(() => {});
    }
  }, [wallet, getPlanter, isConnected]);

  const [submiting, setSubmitting] = useState(false);
  const handleWithdrawPlanterBalance = useCallback(async () => {
    if (!isConnected) {
      Alert.alert(t('netInfo.error'), t('netInfo.details'));
      return;
    }
    setSubmitting(true);
    sendEvent('withdraw');
    try {
      // balance
      const balance = parseBalance(planterData?.balance);
      const bnMinBalance = parseBalance((minBalance || requiredBalance).toString());
      if (balance > bnMinBalance) {
        try {
          const transaction = await sendTransactionWithGSN(
            config,
            ContractType.PlanterFund,
            web3,
            wallet,
            'withdrawBalance',
            [planterData?.balance.toString()],
            useGSN,
          );

          console.log('transaction', transaction);
          Alert.alert(t('success'), t('myProfile.withdraw.success'));
        } catch (e) {
          Alert.alert(t('failure'), e.message || t('sthWrong'));
        }
      } else {
        Alert.alert(
          t('myProfile.attention'),
          t('myProfile.lessBalance', {amount: parseBalance(minBalance?.toString())}),
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      console.warn('Error', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    isConnected,
    sendEvent,
    t,
    planterData?.balance,
    minBalance,
    requiredBalance,
    web3,
    wallet,
    useGSN,
    parseBalance,
  ]);

  const onRefetch = async () => {
    await getPlanter();
    await refetchUser();
  };

  const planterWithdrawableBalance = planterData?.balance > 0 ? parseBalance(planterData?.balance.toString()) : 0;

  const avatarStatus = isVerified ? 'active' : 'inactive';
  const profileLoading = loading || !data?.user;
  const avatarMarkup = profileLoading ? (
    <ShimmerPlaceholder
      style={{
        width: 74,
        height: 74,
        borderRadius: 37,
      }}
    />
  ) : (
    <>
      <Avatar type={avatarStatus} size={74} />
      <Text style={{color: avatarStatus === 'active' ? colors.green : colors.red}}>
        {t(avatarStatus === 'active' ? 'verified' : 'notVerified')}
      </Text>
    </>
  );

  const handleOpenHelp = () => {
    sendEvent('help');
    Linking.openURL('https://discuss.treejer.com/group/planters');
  };

  const handleNavigateOfflineMap = () => {
    sendEvent('offlinemap');
    navigation.navigate('OfflineMap');
  };

  const handleNavigateSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <ScrollView
      style={[globalStyles.screenView, globalStyles.fill]}
      refreshControl={<RefreshControl refreshing={profileLoading || refetching} onRefresh={onRefetch} />}
    >
      <View style={[globalStyles.screenView, globalStyles.fill, globalStyles.alignItemsCenter, globalStyles.safeArea]}>
        <Spacer times={8} />
        {avatarMarkup}
        <Spacer times={4} />

        {profileLoading && (
          <View style={globalStyles.horizontalStack}>
            <ShimmerPlaceholder style={{width: 90, height: 30, borderRadius: 20}} />
            <Spacer times={4} />
            <ShimmerPlaceholder style={{width: 70, height: 30, borderRadius: 20}} />
          </View>
        )}
        {!profileLoading && (
          <>
            {Boolean(data?.user?.firstName) && <Text style={globalStyles.h4}>{data.user.firstName}</Text>}

            {Boolean(data?.user?.firstName) && <Spacer times={4} />}

            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(wallet);
                SimpleToast.show(t('myProfile.copied'), SimpleToast.LONG);
              }}
            >
              {wallet && (
                <Text numberOfLines={1} style={styles.addressBox}>
                  {wallet.slice(0, 15)}...
                </Text>
              )}
            </TouchableOpacity>
            <Spacer times={8} />

            {planterData && (
              <View style={[globalStyles.horizontalStack, styles.statsContainer]}>
                <View style={styles.statContainer}>
                  <Text style={styles.statValue}>{planterWithdrawableBalance}</Text>
                  <Text style={styles.statLabel}>{t('balance')}</Text>
                </View>

                <Spacer times={6} />

                <View style={styles.statContainer}>
                  <Text style={styles.statValue}>{planterData?.plantedCount}</Text>
                  <Text style={styles.statLabel}>{t('plantedTrees')}</Text>
                </View>

                {/*<Spacer times={6} />*/}

                {/*<View style={styles.statContainer}>*/}
                {/*  <Text style={styles.statValue}>{planterWithdrawableBalance.toFixed(5)}</Text>*/}
                {/*  <Text style={styles.statLabel}>ETH Earning</Text>*/}
                {/*</View>*/}
              </View>
            )}

            <View style={globalStyles.p3}>
              {planterWithdrawableBalance > 0 && Boolean(minBalance) && Boolean(planterData?.balance) && (
                <>
                  <Button
                    style={styles.button}
                    caption={t('withdraw')}
                    variant="tertiary"
                    loading={submiting}
                    onPress={handleWithdrawPlanterBalance}
                  />
                  <Spacer times={4} />
                </>
              )}
              {(status === UserStatus.Pending || Boolean(_.route.params?.hideVerification)) && (
                <>
                  <Text style={globalStyles.textCenter}>{t('pendingVerification')}</Text>
                  <Spacer times={6} />
                </>
              )}

              {!_.route.params?.hideVerification && status === UserStatus.Unverified && (
                <>
                  <Button
                    style={styles.button}
                    caption={t('getVerified')}
                    variant="tertiary"
                    onPress={() => {
                      sendEvent('get_verified');
                      if (data?.user) {
                        _.navigation.navigate('VerifyProfile', {user: data.user});
                      }
                    }}
                  />
                  <Spacer times={4} />
                </>
              )}

              <Button
                style={styles.button}
                caption={t('offlineMap.title')}
                variant="tertiary"
                onPress={handleNavigateOfflineMap}
              />
              <Spacer times={4} />

              {planterData?.planterType && <Invite address={wallet} planterType={Number(planterData?.planterType)} />}

              {/* {!wallet && (
                <>
                  <Button
                    style={styles.button}
                    caption={t('createWallet.title')}
                    variant="tertiary"
                    onPress={() => {
                      _.navigation.navigate('CreateWallet');
                    }}
                    disabled
                  />
                  <Spacer times={4} />
                </>
              )} */}

              <Button
                style={styles.button}
                caption={t('settings.title')}
                variant="tertiary"
                onPress={handleNavigateSettings}
              />
              <Spacer times={4} />
              <Button style={styles.button} caption={t('help')} variant="tertiary" onPress={handleOpenHelp} />
              <Spacer times={4} />
              <Button
                style={styles.button}
                caption={t('logout')}
                variant="tertiary"
                onPress={() => {
                  sendEvent('logout');
                  handleLogout(true);
                }}
              />
              <Spacer times={4} />
              <AppVersion />
            </View>
          </>
        )}
      </View>
      <Spacer times={4} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addressBox: {
    backgroundColor: colors.khakiDark,
    textAlign: 'center',
    borderColor: 'white',
    overflow: 'hidden',
    width: 180,
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 10,
  },
  button: {
    width: 180,
  },
  helpWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    fontSize: 20,
    color: colors.grayDarker,
    marginBottom: 5,
  },
  statLabel: {
    color: colors.grayLight,
  },
  statsContainer: {
    paddingBottom: 20,
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLighter,
  },
});

export default MyProfile;
