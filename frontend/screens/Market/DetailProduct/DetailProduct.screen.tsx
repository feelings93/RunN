import React, { useState } from 'react';
import { View } from 'react-native';
import styles from './DetailProduct.style';
import { Text, Box, AspectRatio, Image, Progress, Button } from 'native-base';
import Header from '../../../navigation/header';
import { colors } from '../../../constant/themes';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { PropSneaker } from '../../../@core/model/sneaker';
import imagePath from '../../../constant/imagePath';

const DetailProductScreen = (props) => {
  const navigation = useNavigation();
  const [sneaker, setSneaker] = useState<PropSneaker>(props.route.params.sneaker);
  console.log('sneaker', sneaker);
  return (
    <>
      <View style={styles.container}>
        <Header />
        <View style={styles.bodyContainer}>
          <Box
            //   maxW="80"
            rounded="lg"
            overflow="hidden"
            //   borderColor="coolGray.200"
            borderWidth="1"
            _web={{
              shadow: 2,
              borderWidth: 0,
            }}
            backgroundColor="#2C053B"
          >
            <Box style={styles.modalBackground}>
              <AspectRatio w="100%" ratio={16 / 9} marginTop={-5}>
                <Image
                  source={{
                    uri: 'https://i.pinimg.com/originals/74/2c/02/742c02a5aaa6c201bd4c16bd8b915bba.png',
                  }}
                  alt="image"
                />
              </AspectRatio>
              <Image
                source={{
                  uri: sneaker?.imgUrl,
                }}
                alt="Alternate Text"
                width={200}
                height={100}
                resizeMode="contain"
                style={{ marginTop: -90 }}
              />

              <View style={styles.shoesBackground}>
                <Text color="#C7D5F7" bold style={{ fontSize: 14, textAlign: 'center' }}>
                  #{`${sneaker.id}`}
                </Text>
                <View style={styles.barShoes}>
                  <Text
                    color="#2C053B"
                    bold
                    fontSize={14}
                    style={{
                      width: '33.33%',
                      textAlign: 'center',
                      backgroundColor: '#CFDDFF',
                      borderBottomLeftRadius: 20,
                      padding:1.5
                    }}
                  >
                    LV {`${sneaker?.level}`}
                  </Text>
                  <Text
                    color="#C7D5F7"
                    bold
                    style={{ width: '33.33%', textAlign: 'center', borderRightWidth: 1 }}
                  >
                    {'>>'} {sneaker?.type}
                  </Text>

                  <Box w="33.33%">

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: -23, zIndex: 3 }}>

                      <Image size={5} borderRadius={100} source={imagePath.protect} alt="Condition" />
                      <Text
                        color={colors.white}
                        fontWeight="bold"
                        fontSize={14}
                        style={{
                          textAlign: 'center',
                          marginLeft: 5,
                          marginBottom:1
                        }}
                      >
                        {sneaker?.condition} <Text color={"#B2B8BF"} fontWeight="bold" fontSize={14}>/ 100</Text>
                      </Text>
                    </View>
                    <Progress
                      value={sneaker?.condition}
                      bg={colors.background.progress}
                      _filledTrack={{ bg: colors.primary, borderRadius: 0 }}
                      size="2xl"
                      style={{
                        borderRadius: 0, borderTopRightRadius: 25,
                      }}
                    >

                    </Progress>
                  </Box>
                </View>
              </View>
            </Box>
          </Box>
        </View>
        <View style={styles.lifeTime}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text bold color={colors.white}>
              {/* Lifetime */}
            </Text>
            <Text fontSize={'lg'} bold color={colors.white}>
              {/* 1000 */}
              <Text bold color="#CFDDFF">
                {/* /1000 */}
              </Text>
            </Text>
          </View>
          <Box w="100%" marginTop={0}>
            <Progress
              value={100}
              bg={colors.background.progress}
              _filledTrack={{ bg: colors.progress }}
            />
          </Box>
        </View>
        <View style={styles.mint}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text bold color={colors.white}>
              Mint {`${sneaker?.mint}`}
            </Text>
          </View>
          <Box w="100%" marginTop={1}>
            <Progress value={25} bg={colors.background.progress} _filledTrack={{ bg: '#CFDDFF' }} />
          </Box>
        </View>
        <Text fontSize="lg" bold color={colors.white} style={styles.mint}>
          Attribute
        </Text>
        <View style={styles.containAttribute}>
          <View style={styles.attributeItem}>
            <Image
              size={6}
              borderRadius={100}
              backgroundColor="#f99"
              source={imagePath.perform}
              alt="perform"
              marginTop={5}
              borderWidth={3}
              borderColor="#f99"
              resizeMode="contain"
              marginRight={1}
            />

            <View style={{ width: '85%' }}>
              <Text fontSize="sm" bold color={colors.white} style={styles.mint}>
                Performance
              </Text>
              <Box w="100%" marginTop={1}>
                <Progress
                  size="sm"
                  value={sneaker?.performance * 10}
                  bg={colors.background.progress}
                  _filledTrack={{ bg: '#f99' }}
                />
              </Box>
            </View>
            <Text fontSize="sm" bold color={colors.white} style={{ marginTop: 20 }}>
              {Number.isInteger(sneaker?.performance) ? sneaker?.performance+".0" : sneaker?.performance}
            </Text>
          </View>
          <View style={styles.attributeItem}>
            <Image
              size={6}
              borderRadius={100}
              backgroundColor="#36706D"
              source={imagePath.joy}
              alt="Joy"
              marginTop={5}
              borderWidth={3}
              borderColor="#36706D"
              resizeMode="contain"
              marginRight={1}
            />

            <View style={{ width: '85%' }}>
              <Text fontSize="sm" bold color={colors.white} style={styles.mint}>
                Joy
              </Text>
              <Box w="100%" marginTop={1}>
                <Progress
                  size="sm"
                  value={sneaker?.joy * 10}
                  bg={colors.background.progress}
                  _filledTrack={{ bg: '#36706D' }}
                />
              </Box>
            </View>
            <Text fontSize="sm" bold color={colors.white} style={{ marginTop: 20 }}>
            {Number.isInteger(sneaker?.joy) ? sneaker?.joy+".0" : sneaker?.joy}
            </Text>
          </View>
          <View style={styles.attributeItem}>
            <Image
              size={6}
              borderRadius={100}
              backgroundColor="#123783"
              source={imagePath.durability}
              alt="Joy"
              marginTop={5}
              borderWidth={3}
              borderColor="#123783"
              resizeMode="contain"
              marginRight={1}
            />

            <View style={{ width: '85%' }}>
              <Text fontSize="sm" bold color={colors.white} style={styles.mint}>
                Durability
              </Text>
              <Box w="100%" marginTop={1}>
                <Progress
                  size="sm"
                  value={sneaker.durability * 10}
                  bg={colors.background.progress}
                  _filledTrack={{ bg: '#123783' }}
                />
              </Box>
            </View>
            <Text fontSize="sm" bold color={colors.white} style={{ marginTop: 20 }}>
            {Number.isInteger(sneaker?.durability) ? sneaker?.durability+".0" : sneaker?.durability}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.bottom} onTouchStart={()=>navigation.goBack()}>
        <Text fontSize={'xl'} bold color={colors.white} style={{justifyContent:'center',alignItems:'center',textAlign:'center', width:'100%'}}>
                      BACK
        </Text>
        {/* <Button style={styles.button}>
          <Text color={colors.white} bold fontSize="sm" style={{ paddingHorizontal: 15 }}>BUY NOW</Text>
        </Button> */}
      </View>
    </>
  );
};
export default DetailProductScreen;
