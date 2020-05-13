import React, { Component } from 'react'
import {
  Image,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Text,
  AppState,
  Dimensions,
  View,
} from 'react-native'
import { Grid, Col, Row } from 'react-native-easy-grid';
import { Magnetometer } from 'expo-sensors';
const { height, width } = Dimensions.get('window');
import { MonoText } from '../components/StyledText';
import Geo from '../lib/geo-nearby'
import * as dataSet from '../database/geohash.json'
import * as stopArea from '../database/stoparea.json'
import GeoInfo from '../lib/geo-info'
import geohash from 'ngeohash'
import RNLocation from 'react-native-location';

export default class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appState: AppState.currentState,
      magnetometer: '0',
      location: null,
      errorMessage: null,
      limit: 100000,
      range: 500,
      stops: []
    };
  }

  componentDidMount() {
    this._toggleCompass();
    this._getLocationAsync();
    AppState.addEventListener('change', this._handleAppStateChange);
  };

  componentWillUnmount() {
    this._unsubscribeCompass();
    this._unsubscribeLocation();
    AppState.removeEventListener('change', this._handleAppStateChange);
  };

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this._getLocationAsync();
    }
    this.setState({ appState: nextAppState });
  };

  _updateLocation = (location) => {
    const geo = new Geo(dataSet, { sorted: true, limit: this.state.limit });
    var nodes = geo.nearBy(location.latitude, location.longitude, this.state.range);
    this.state.stops = []
    nodes.forEach(element => {
      var decoded_data = geohash.decode_int(element.g)
      var calc = new GeoInfo().from(location.latitude, location.longitude, decoded_data.latitude, decoded_data.longitude)
      if (calc.d < this.state.range && this.state.stops.length <= 6) {
        this.state.stops.push({
          id: element.i,
          data: stopArea[element.i],
          d: calc.d.toFixed(0) + "m",
          brng: calc.brng
        })
        console.log(element.i, calc.d, "Added to the list")
      } else {
        console.log(element.i, calc.d, "Too far from distance")
      }
    })
  }
  
  _getLocationAsync = () => {
    RNLocation.requestPermission({
      ios: "whenInUse",
      android: {
        detail: "coarse"
      }
    }).then(granted => {
      if (granted) {
        RNLocation.getLatestLocation({ timeout: 3000 }).then(latestLocation => {
          latestLocation && this._updateLocation(latestLocation)
          this._unsubscribeLocation && this._unsubscribeLocation()
          this._unsubscribeLocation = RNLocation.subscribeToLocationUpdates(locations => {
            locations.map(location => {
              this._updateLocation(location)
            })
          })
        })
      }
    })
  };

  _toggleCompass = () => {
    if (this._subscription) {
      this._unsubscribeCompass();
    } else {
      this._subscribeCompass();
    }
  };

  _subscribeCompass = async () => {
    /*Magnetometer.setUpdateInterval(1000)*/
    this._subscription = Magnetometer.addListener((data) => {
      this.setState({ magnetometer: this._angle(data) });
    });
  };

  _unsubscribeCompass = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  _angle = (magnetometer) => {
    if (magnetometer) {
      let { x, y, z } = magnetometer;

      if (Math.atan2(y, x) >= 0) {
        angle = Math.atan2(y, x) * (180 / Math.PI);
      }
      else {
        angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
      }
    }

    return Math.round(angle);
  };

  _direction = (degree) => {
    if (degree >= 22.5 && degree < 67.5) {
      return 'NE';
    }
    else if (degree >= 67.5 && degree < 112.5) {
      return 'E';
    }
    else if (degree >= 112.5 && degree < 157.5) {
      return 'SE';
    }
    else if (degree >= 157.5 && degree < 202.5) {
      return 'S';
    }
    else if (degree >= 202.5 && degree < 247.5) {
      return 'SW';
    }
    else if (degree >= 247.5 && degree < 292.5) {
      return 'W';
    }
    else if (degree >= 292.5 && degree < 337.5) {
      return 'NW';
    }
    else {
      return 'N';
    }
  };

  _degree = (magnetometer) => {
    return magnetometer - 90 >= 0 ? magnetometer - 90 : magnetometer + 271;
  };

  displayNorthStops() {
    return (<Row style={{ alignItems: 'center' }} size={.7}>
      {this.state.stops.slice(0, 3).map((stop, index) => {
        const angle = this._degree(this.state.magnetometer) - stop.brng
        return (<Col key={index} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#333', fontSize: height / 36, fontWeight: 'bold' }}>{stop.data.name.substring(0, 15)}</Text>
          <Text style={{ color: '#333', fontSize: height / 40, fontWeight: 'bold' }}>{stop.data.lines.slice(0, 3).map(n => n[0]).join('/')}</Text>
          <Text style={{ color: '#333', fontSize: height / 52, fontWeight: 'normal' }}>{stop.d}/{angle.toFixed(2) + " °"}</Text>
        </Col>)
      })}
    </Row>)
  }

  displaySouthStops() {
    return (<Row style={{ alignItems: 'center' }} size={.7}>
      {this.state.stops.length >= 3 && this.state.stops.slice(3, this.state.stops.length >= 6 ? 6 : this.state.stops.length).map((stop, index) => {
        const angle = this._degree(this.state.magnetometer) - stop.brng
        return (<Col key={index} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#333', fontSize: height / 36, fontWeight: 'bold' }}>{stop.data.name.substring(0, 15)}</Text>
          <Text style={{ color: '#333', fontSize: height / 40, fontWeight: 'bold' }}>{stop.data.lines.slice(0, 3).map(n => n[0]).join('/')}</Text>
          <Text style={{ color: '#333', fontSize: height / 52, fontWeight: 'normal' }}>{stop.d}/{angle.toFixed(2) + " °"}</Text>
        </Col>)
      })}
    </Row>)
  }

  render() {
    const { stops } = this.state
    return (
      <View style={styles.container}>
        <Grid style={{ backgroundColor: 'white' }}>
          {this.displayNorthStops()}
          <Row style={{ alignItems: 'center' }} size={.3}>
            <Col style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: '#333',
                  fontSize: height / 26,
                  fontWeight: 'bold'
                }}>{this._direction(this._degree(this.state.magnetometer))}
              </Text>
            </Col>
          </Row>
          <Row style={{ alignItems: 'center' }} size={.1}>
            <Col style={{ alignItems: 'center' }}>
              <View style={{ position: 'absolute', width: width, alignItems: 'center', top: 25 }}>
                <Image source={require('../assets/compass_pointer.png')} style={{
                  height: height / 26,
                  resizeMode: 'contain'
                }} />
              </View>
            </Col>
          </Row>
          <Row style={{ alignItems: 'center' }} size={2.5}>
            <Text style={{
              color: '#fff',
              fontSize: height / 27,
              width: width,
              position: 'absolute',
              textAlign: 'center'
            }}>
              {this._degree(this.state.magnetometer)}°
          </Text>
            <Col style={{ alignItems: 'center' }}>
              <Image source={require("../assets/compass_bg.png")} style={{
                height: width - 100,
                justifyContent: 'center',
                alignItems: 'center',
                resizeMode: 'contain',
                tintColor: '#333',
                transform: [{ rotate: 360 - this.state.magnetometer + 'deg' }]
              }} />
            </Col>
          </Row>
          {this.displaySouthStops()}
        </Grid>
        <View style={styles.tabBarInfoContainer}>
          <Image source={require('../assets/compass_pointer.png')} style={{
            height: height / 34,
            resizeMode: 'contain',
            transform: [{ rotate: '180deg' }]
          }} />
          <View
            style={[styles.codeHighlightContainer, styles.navigationFilename]}>
            <TouchableOpacity style={{ width: width * 0.2, flex: 1 }}><MonoText style={styles.codeHighlightText}>100m</MonoText></TouchableOpacity>
            <TouchableOpacity style={{ width: width * 0.2, flex: 1 }}><MonoText style={styles.codeHighlightText}>300m</MonoText></TouchableOpacity>
            <TouchableOpacity style={{ width: width * 0.2, flex: 1 }}><MonoText style={styles.codeHighlightText}>500m</MonoText></TouchableOpacity>
            <TouchableOpacity style={{ width: width * 0.2, flex: 1 }}><MonoText style={styles.codeHighlightText}>1000m</MonoText></TouchableOpacity>
            <TouchableOpacity style={{ width: width * 0.2, flex: 1 }}><MonoText style={styles.codeHighlightText}>1500m</MonoText></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

HomeScreen.navigationOptions = {
  header: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBarInfoContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 15,
    height: height * 0.1
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  codeHighlightContainer: {
    marginTop: 5,
    flexDirection: 'row',
    textAlign: 'center',
    justifyContent: 'space-between',
    flex: 1
  },
  codeHighlightText: {
    textAlign: 'center',
  }
});
