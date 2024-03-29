import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { View, Text, Image, Modal, Button } from 'native-base';
import MapView, { MarkerAnimated, AnimatedRegion, Polyline } from 'react-native-maps';
import { GOOGLE_MAP_KEY } from '../../../constant/googleMapKey';
import MapViewDirections from 'react-native-maps-directions';
import { locationPermission, getCurrentLocation } from '../../../hooks/helperFunction';
import Geolocation from 'react-native-geolocation-service';
import { getDistance } from 'geolib';
import { CurrentLocation } from '../../../@core/model/location';
import imagePath from '../../../constant/imagePath';
import { Avatar } from 'native-base';
import styles from './StartRunning.style';
import { colors } from '../../../constant/themes';
import { useNavigation } from '@react-navigation/native';
import ProgressCircle from 'react-native-progress-circle';
import { useDispatch, useSelector } from 'react-redux';
import { EnergyProps } from '../../../@core/model/move';
import { moveActions, selectEnergy } from '../moveSlice';
import { PropSneaker } from '../../../@core/model/sneaker';
import { Contract, ethers, providers } from 'ethers';
import { RunnMoveTokenABI } from '../../../constant/RunnMoveTokenABI';
import { useWalletConnect } from '@walletconnect/react-native-dapp';
import WalletConnectProvider from '@walletconnect/web3-provider';
import HDWalletProvider from '@truffle/hdwallet-provider';
import Web3 from 'web3';
import {
  DEFAULT_SPEED_COACH,
  DEFAULT_SPEED_HIKER,
  DEFAULT_SPEED_RANGER,
  DEFAULT_SPEED_SPRINTER,
} from '../../../constant/typeSneaker';
import { authActions } from '../../Login/authSlice';
import RNMockLocationDetector from 'react-native-mock-location-detector';

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.0622;
const LONGITUDE_DELTA = 0.0121;

const StartRunningScreen = (props) => {
  const navigation = useNavigation();
  const energyReducer: EnergyProps = useSelector((state: any) => state.move.energy);
  const timingReducer: boolean = useSelector((state: any) => state.move.timing);
  const coinRewardReducer: number = useSelector((state: any) => state.move.coinReward);
  const RMTokenReducer: number = useSelector((state: any) => state.auth?.currentUser?.RMToken);

  const dispatch = useDispatch();
  const [isShowModal, setIsShowModal] = useState(false);
  const [arrDistances, setArrDistances] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [start, setStart] = useState<boolean>(props.route.params?.start);
  const [seconds, setSeconds] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [limitSpeed, setLimitSpeed] = useState<number>(props.route.params?.limitSpeed);
  const [timeout, setTimeout] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [timeReward, setTimeReward] = useState<number>(180); // seconds
  const [coinReward, setCoinReward] = useState<number>(0);
  const [sneaker, setSneaker] = useState<PropSneaker>(props.route.params?.chooseSneaker);
  const [isLocationNotFine, setIsLocationNotFine] = useState<boolean>(false);
  const [speedText, setSpeedText] = useState<string>('');
  const [speedLimit, setSpeedLimit] = useState<number[]>([]);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const connector = useWalletConnect();

  const [state, setState] = useState({
    curLoc: {
      latitude: 10.78853,
      longitude: 106.77058,
    },
    destinationCords: {},
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 10.78853,
      longitude: 106.77058,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    time: 0,
    distance: 0,
    heading: 0,
  });

  const { curLoc, time, distance, destinationCords, isLoading, coordinate, heading } = state;
  const updateState = (data) => setState((state) => ({ ...state, ...data }));

  useEffect(() => {
    handleSpeedLimitSneakers();
    const interval = setInterval(() => {
      getLiveLocation();
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const getLiveLocation = async () => {
    const locPermissionDenied = await locationPermission();
    if (locPermissionDenied) {
      const result: CurrentLocation = await getCurrentLocation();
      console.log('get live location after 4 second --', result);
      handleCheckMock();
      animate(result?.latitude, result?.longitude);
      updateState({
        heading: heading,
        curLoc: { latitude: result?.latitude, longitude: result?.longitude },
        coordinate: new AnimatedRegion({
          latitude: result?.latitude,
          longitude: result?.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }),
      });
    }
  };

  var timer = 0;
  const handleSendTokenAward = async (toAddress: string, amoutRMT: number) => {
    try {
      const adminAccount = {
        privateKey: '517e2a7e05343c90f22c5384273ae81835aa5c274bd04bdbfc9aa08543ecaad6',
        account: '0x71c738B1d24368DdcE9b1Ec14C8dA57F5E079175',
      };
      const RMTAddress = '0x07B5C829Db4B925dDDA85A14079553443b1857b9';
      const web3 = new Web3('https://goerli.infura.io/v3/6507b4b41a0c450ba0fe748e96881466');
      const contract = new web3.eth.Contract(RunnMoveTokenABI as any, RMTAddress);
      const transaction = contract.methods.transfer(toAddress, amoutRMT);
      const options = {
        to: RMTAddress,
        data: transaction.encodeABI(),
        gas: await transaction.estimateGas({ from: adminAccount.account }),
        gasPrice: await web3.eth.getGasPrice(),
      };
      const signed = await web3.eth.accounts.signTransaction(options, adminAccount.privateKey);
      const result = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      if (result) {
        console.log('Chuyen rmtToken thanh cong');
        dispatch(authActions.isUpdateRMT(true));
      }
    } catch (err) {
      console.log('ErrSend:', err);
    }
  };
  let amtRewards: number = 0;

  useEffect(() => {
    if (energyReducer.currentEnergy < 1) {
      if (timingReducer === false) {
        dispatch(moveActions.updateTiming(true));
      }
      setIsShowModal(true);
      getlocation(false);
      setStart(false);
      setSpeed(0);
      setTimeout(true);
    }
    if (timeout === false) {
      var countUp = setInterval(function () {
        ++timer;
        if (timer % timeReward === 0 && energyReducer.currentEnergy > 0) {
          dispatch(moveActions.updateCurrentEnergy(energyReducer.currentEnergy - 1));
          //AMT = En * P ^ kP1 * kP2 * kP3 * kD
          //En=1
          //P= tong 3 thong so cua giay
          //kp1=performance(Dang de la 1)
          //kp2= Ranger–1 Hiker-1.1 Sprinter–1.15 Coacher–1.05
          //kp3= van toc trungbinh/ van toc that
          //kD = he so durability
          amtRewards = 0;
          switch (sneaker?.type) {
            case 'Ranger':
              if (speedReal >= DEFAULT_SPEED_RANGER[0])
                amtRewards =
                  speedReal <= DEFAULT_SPEED_RANGER[1]
                    ? 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1 *
                      1 *
                      sneaker.durability
                    : 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1 *
                      (DEFAULT_SPEED_RANGER[2] / speedReal) *
                      sneaker.durability;
              break;
            case 'Hiker':
              if (speedReal >= DEFAULT_SPEED_HIKER[0])
                amtRewards =
                  speedReal <= DEFAULT_SPEED_HIKER[1]
                    ? 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1.1 *
                      1 *
                      sneaker.durability
                    : 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1.1 *
                      (DEFAULT_SPEED_HIKER[2] / speedReal) *
                      sneaker.durability;
              break;
            case 'Sprinter':
              if (speedReal >= DEFAULT_SPEED_SPRINTER[0])
                amtRewards =
                  speedReal <= DEFAULT_SPEED_SPRINTER[1]
                    ? 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1.15 *
                      1 *
                      sneaker.durability
                    : 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1.15 *
                      (DEFAULT_SPEED_SPRINTER[2] / speedReal) *
                      sneaker.durability;
              console.log('Sprinter Speed: ', speedReal, speedReal >= DEFAULT_SPEED_SPRINTER[0]);

              break;
            case 'Coacher':
              if (speedReal >= DEFAULT_SPEED_COACH[0])
                amtRewards =
                  speedReal <= DEFAULT_SPEED_COACH[1]
                    ? 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1.05 *
                      1 *
                      sneaker.durability
                    : 1 *
                      Math.pow(sneaker.performance + sneaker.durability + sneaker.joy, 1) *
                      1.05 *
                      (DEFAULT_SPEED_COACH[2] / speedReal) *
                      sneaker.durability;
              break;
            default:
              break;
          }
          console.log('amtRewards: ', amtRewards);
          // dispatch(moveActions.updateCoinReward(coinRewardReducer + 50));
          //200000000000000
          //19570
          if (amtRewards > 0) {
            handleSendTokenAward(connector.accounts[0], Number(amtRewards.toFixed(0)));
            // dispatch(moveActions.updateCoinReward(coinRewardReducer + 50));
            setCoinReward(coinReward + Number(amtRewards.toFixed(0)));
            // dispatch(authActions.updateRMToken(coinRewardReducer+Number(amtRewards.toFixed(0))));
          }
        }
      }, 1000);
      return () => clearInterval(countUp);
    }
  }, [timeout, energyReducer, coinRewardReducer]);

  const handleSpeedLimitSneakers = () => {
    switch (sneaker?.type) {
      case 'Ranger':
        setSpeedText( DEFAULT_SPEED_RANGER[0] + ' - ' + DEFAULT_SPEED_RANGER[1] + ' km/h');
        setSpeedLimit([DEFAULT_SPEED_RANGER[0],DEFAULT_SPEED_RANGER[1]]);
        return;
      case 'Hiker':
        setSpeedText (DEFAULT_SPEED_HIKER[0] + ' - ' + DEFAULT_SPEED_HIKER[1] + ' km/h');
        setSpeedLimit([DEFAULT_SPEED_HIKER[0],DEFAULT_SPEED_HIKER[1]]);
        return;
      case 'Sprinter':
        setSpeedText( DEFAULT_SPEED_SPRINTER[0] + ' - ' + DEFAULT_SPEED_SPRINTER[1] + ' km/h');
        setSpeedLimit([DEFAULT_SPEED_SPRINTER[0],DEFAULT_SPEED_SPRINTER[1]]);
        return;
      case 'Coacher':
        setSpeedText( DEFAULT_SPEED_COACH[0] + ' - ' + DEFAULT_SPEED_COACH[1] + ' km/h');
        setSpeedLimit([DEFAULT_SPEED_COACH[0],DEFAULT_SPEED_COACH[1]]);
        return;
      default:
        break;
    }
  };
  useEffect(() => {
    var tiktak: number = 0;
    console.log("sneaker", sneaker);
    
    var timeUp = setInterval(function () {
      ++tiktak;
      setMinutes(Math.floor(Number(tiktak / 60)));
      setSeconds(Number(tiktak % 60));
    }, 1000);
    return () => clearInterval(timeUp);
  }, []);

  const animate = (latitude, longitude) => {
    const newCoordinate = { latitude, longitude };
    if (Platform.OS == 'android') {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 500);
      }
    } else {
      // coordinate.timing(newCoordinate).start();
    }
  };

  // This function will get your current location
  var idGeo;
  const getlocation = (enable: boolean) => {
    if (enable == true) {
      idGeo = Geolocation.watchPosition(showLoc);
      // console.log('vo chua1', start);
    }
  };
  let speedReal: number = 0;
  // This function will show your current location
  const showLoc = (pos) => {
    setSpeed(pos?.coords?.speed.toFixed(2));
    speedReal = pos?.coords?.speed.toFixed(2);
    if (pos?.coords.speed < limitSpeed) {
      if (start) {
        if (
          parseFloat(arrDistances[arrDistances.length - 1]?.latitude) !=
            parseFloat(pos?.coords?.latitude) &&
          start
        ) {
          arrDistances?.length > 1 &&
            setTotalDistance(
              Number(
                (
                  totalDistance +
                  getDistance(arrDistances[arrDistances?.length - 1], {
                    latitude: pos?.coords?.latitude,
                    longitude: pos?.coords?.longitude,
                  }) /
                    1000
                ).toFixed(2)
              )
            );
          arrDistances?.length > 1 &&
            console.log(
              'Distance: ',
              getDistance(arrDistances[arrDistances?.length - 1], {
                latitude: pos?.coords?.latitude,
                longitude: pos?.coords?.longitude,
              }) / 1000
            );
          arrDistances.push({ latitude: pos?.coords?.latitude, longitude: pos?.coords?.longitude });
        }
      }
    } else {
      console.log('Eo tinh khoang cach nha con');
    }
    Geolocation.clearWatch(idGeo);

    console.log('arrDistances: ', arrDistances.length);

    // }
  };
  const onCenter = () => {
    mapRef.current.animateToRegion({
      latitude: curLoc?.latitude,
      longitude: curLoc?.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };
  const onPressStart = () => {
    setStart((start) => (start = true));
  };

  const checkTimeOut = () => {
    if (start) {
      getlocation(true);
    }
  };

  const handleExit = () => {
    console.log('Dung lai cho bo may, va get out');
    getlocation(false);
    setStart(false);
    setSpeed(0);
    speedReal = 0;
    setTimeout(true);
    dispatch(moveActions.updateCoinReward(0));
    navigation.goBack();
    setIsShowModal(false);
  };

  const handleCheckMock = async () => {
    const isLocationMocked: boolean = await RNMockLocationDetector.checkMockLocationProvider();
    if (isLocationMocked) {
      console.log('Location is fake');
      setIsLocationNotFine(true);
    } else {
      console.log('Location is fine');
      setIsLocationNotFine(false);
    }
  };
  const handleCloseWarningLocation = () => {
    setIsLocationNotFine(false);
    handleExit();
  };
  return (
    <View style={styles.container}>
      {checkTimeOut()}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 12,
        }}
      >
        {/* <Button onPress={handleSendTokenAward}>Test here</Button> */}
        <Image
          size={5}
          borderRadius={100}
          source={imagePath.running_white}
          alt="running man"
          resizeMode="stretch"
        />
        <Text bold fontSize="xl" color={colors.white} marginLeft={2}>
          Walking{' '}
        </Text>
      </View>
      {showMap ? (
        <>
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              // showsUserLocation={true}
              showsMyLocationButton={false}
              zoomEnabled={true}
              style={styles.map}
              initialRegion={{
                ...curLoc,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              }}
            >
              <MarkerAnimated ref={markerRef} coordinate={coordinate}>
                <Image
                  source={imagePath.running}
                  style={{
                    width: 110,
                    height: 30,
                    transform: [{ rotate: `${heading + 60}deg` }],
                    marginTop: 25,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  resizeMode="contain"
                  alt="Running"
                />
              </MarkerAnimated>

              <Polyline
                coordinates={[...arrDistances]}
                strokeColor={colors.primary} // fallback for when `strokeColors` is not supported by the map-provider
                strokeColors={[colors.primary]}
                strokeWidth={4}
              />
            </MapView>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 10,
              }}
              onPress={() => {
                setShowMap(false);
              }}
            >
              <Image
                source={imagePath.close}
                size={8}
                borderRadius={20}
                style={{ padding: 5 }}
                alt="Alternate Text"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
              }}
              onPress={onCenter}
            >
              <Image source={imagePath.greenIndicator} alt="Alternate Text" />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 12, marginTop: 5 }}>
            <View style={styles.bottomCard}>
              <View style={styles.propertyContainer}>
                <View style={styles.properyCricle}>
                  <Image size={5} borderRadius={100} source={imagePath.running} alt="distance" />
                  <Text color={colors.white} bold style={{ marginTop: 5, marginLeft: -2 }}>
                    {totalDistance}km
                  </Text>
                </View>
                <View style={styles.properyCricle}>
                  <Image size={5} borderRadius={100} source={imagePath.speed} alt="Speed" />
                  <Text color={colors.white} bold style={{ marginTop: 5, marginLeft: -2 }}>
                    {speed ? speed : '0.0'}
                  </Text>
                </View>
                <View style={styles.properyCricle}>
                  <Image
                    size={5}
                    borderRadius={100}
                    source={imagePath.alarmClock}
                    alt="Alarm clock"
                  />
                  <Text color={colors.white} bold style={{ marginTop: 5 }}>
                    {minutes < 10 ? '0' + minutes : minutes} :{' '}
                    {seconds < 10 ? '0' + seconds : seconds}{' '}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              paddingHorizontal: 40,
              paddingTop: 10,
            }}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
              <ProgressCircle
                percent={100}
                radius={30}
                borderWidth={8}
                color={colors.coin}
                shadowColor="#999"
                bgColor={colors.background.mainColor}
              >
                <Image size={7} borderRadius={100} source={imagePath.coin} alt="Coin" />
              </ProgressCircle>
              <Text fontSize={'sm'} bold color={colors.white} marginLeft={2}>
                + {coinReward}.0{' '}
              </Text>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
              <ProgressCircle
                percent={(energyReducer.currentEnergy / energyReducer.maxEnergy) * 100}
                radius={30}
                borderWidth={8}
                color={colors.energy}
                shadowColor="#999"
                bgColor={colors.background.mainColor}
              >
                <Image size={5} borderRadius={100} source={imagePath.energy} alt="Energy" />
              </ProgressCircle>
              <Text fontSize={'sm'} bold color={colors.white} marginLeft={2}>
                {energyReducer.currentEnergy}.0{' '}
                <Text bold color={colors.gray}>
                  / {energyReducer.maxEnergy}.0
                </Text>
              </Text>
            </View>
          </View>
          <Text bold color={speed >= speedLimit[0] && speed<= speedLimit[1] ? '#32CD32':'#DC143C'} marginTop={10} textAlign="center" fontSize={17}>
            {speedText}
          </Text>
          <View style={styles.bodyMainContainer}>
            {/* // Card nang luonggggggggggggggggggggggg */}

            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text bold fontSize={70} color={colors.white}>
                {totalDistance === 0 ? '00.00' : totalDistance}
              </Text>
              <Text fontSize="sm" bold color={colors.gray} marginTop={-4}>
                km
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-around',
                marginTop: 15,
                paddingHorizontal: 50,
              }}
            >
              <View style={styles.properyCricle}>
                <Image size={5} borderRadius={100} source={imagePath.speed} alt="Speed" />
                <Text color={colors.white} bold style={{ marginTop: 5, marginLeft: -2 }}>
                  {speed ? speed : '0.0'}
                </Text>
              </View>
              <View style={styles.properyCricle}>
                <Image
                  size={5}
                  borderRadius={100}
                  source={imagePath.alarmClock}
                  alt="Alarm clock"
                />
                {start ? (
                  <Text color={colors.white} bold style={{ marginTop: 5 }}>
                    {minutes < 10 ? '0' + minutes : minutes} :{' '}
                    {seconds < 10 ? '0' + seconds : seconds}{' '}
                  </Text>
                ) : (
                  <Text color={colors.white} bold style={{ marginTop: 5 }}>
                    00 : 00
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
      {!showMap && (
        <View style={{ padding: 12 }}>
          <View style={styles.bottomCard}>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
              <View style={styles.circleButton} onTouchStart={() => setShowMap(true)}>
                <Image size={10} borderRadius={100} source={imagePath.map} alt="Map" />
              </View>
              <View style={styles.circleButton} onTouchStart={handleExit}>
                <Image size={10} borderRadius={100} source={imagePath.closeWhite} alt="Close out" />
              </View>
              <View style={styles.circleButton}>
                <Image size={10} borderRadius={100} source={imagePath.help} alt="Alternate Text" />
              </View>
            </View>
          </View>
        </View>
      )}
      <Modal isOpen={isShowModal} onClose={() => setIsShowModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header
            style={{ justifyContent: 'center', alignItems: 'center' }}
            fontSize={20}
            fontWeight={'bold'}
          >
            <Text fontSize={17} bold color={colors.black} marginLeft={0}>
              Notification
            </Text>
          </Modal.Header>
          <Modal.Body>
            <View>
              <Text fontSize={15} color={colors.gray1} marginLeft={0} textAlign="center">
                You don't have enough energy to run. Please wait or get new shoes.
              </Text>
            </View>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                marginTop: 15,
              }}
            >
              <ProgressCircle
                percent={100}
                radius={25}
                borderWidth={8}
                color={colors.coin}
                shadowColor="#999"
                bgColor={colors.white}
              >
                <Image size={7} borderRadius={100} source={imagePath.coin} alt="Coin" />
              </ProgressCircle>
              <Text fontSize={'xl'} bold color={colors.coin} marginLeft={2}>
                + {coinReward}
                {'.0 '}
              </Text>
            </View>
            <Button style={styles.buttonOK} onPress={handleExit} marginTop={15}>
              <Text color={colors.white} bold fontSize="sm" style={{ paddingHorizontal: 15 }}>
                OK
              </Text>
            </Button>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Modal isOpen={isLocationNotFine} onClose={handleCloseWarningLocation} size="lg">
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header
            style={{ justifyContent: 'center', alignItems: 'center' }}
            fontSize={20}
            fontWeight={'bold'}
          >
            <Text fontSize={15} bold color={colors.black} marginLeft={0}>
              Warning
            </Text>
          </Modal.Header>
          <Modal.Body>
            <View
              style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text fontSize={11} color={colors.gray1} marginBottom={0} textAlign="center">
                We detected you are using GPS cheating. Please check it and run again.
              </Text>
              <Image size={50} source={imagePath.refuse} alt="Refuse" />
            </View>
            <Button style={styles.button} onPress={handleCloseWarningLocation} marginTop={15}>
              <Text color={colors.white} bold fontSize="sm" style={{ paddingHorizontal: 15 }}>
                OK
              </Text>
            </Button>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </View>
  );
};

export default StartRunningScreen;
