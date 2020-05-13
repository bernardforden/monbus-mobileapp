import React, { Component } from 'react';
import * as WebBrowser from 'expo-web-browser'
import { AppState, ScrollView, StyleSheet, TouchableOpacity, View, Text, TextInput } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import geohash from 'ngeohash'
import Dialog, { DialogTitle, DialogFooter, DialogButton, DialogContent, SlideAnimation } from "react-native-popup-dialog"
import RNLocation from 'react-native-location'
import GeoInfo from '../lib/geo-info'
import RNFS from 'react-native-fs';

RNLocation.configure({
  distanceFilter: 0.1,
  desiredAccuracy: {
    ios: "best",
    android: "balancedPowerAccuracy"
  },
  // Android only
  androidProvider: "auto",
  interval: 5000, // Milliseconds
  fastestInterval: 10000, // Milliseconds
  maxWaitTime: 5000, // Milliseconds
  // iOS Only
  activityType: "other",
  allowsBackgroundLocationUpdates: true,
  headingFilter: 1, // Degrees
  headingOrientation: "portrait",
  pausesLocationUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
})

export default class LinksScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appState: AppState.currentState,
      location: null,
      selectedItem: {},
      selectedFile: new Date().toLocaleDateString(),
      dialogSaveFile: false,
      dialogVisible: false,
      errorMessage: null,
      stops: [],
      last: null
    };
  }

  minDistance = 5

  static navigationOptions = ({navigation}) => {
    return {
      title: 'GPS Tracking...',
      headerRight: <TouchableOpacity onPress={navigation.getParam('saveJSONFile')} style={{ marginRight: 10 }}>
        <Text>Save</Text>
      </TouchableOpacity>
    }
  } 

  _showSaveDialog = () => {
    this.setState( { dialogSaveFile: true })
  }

  saveToFile() {
    var date = this.state.selectedFile || new Date().toLocaleDateString()
    var path = RNFS.ExternalStorageDirectoryPath + "/" + date.replace(/\//g,'-') + ".json";
    console.log("saveToFile:", path)
    AsyncStorage.getItem(date).then((value) => {
      if (value !== null) {
        RNFS.writeFile(path, value, 'utf8').then((_) => {
          console.log('FILE WRITTEN!');
        }).catch((err) => {
          console.log(err.message);
        })
      } else {
        console.log("No data to save!");
      }
    }).catch((err) => {
      console.log(err.message);
    })
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    this._getLocationAsync();
    this._retrieveData().then(_ => { }, _ => { });
    this.props.navigation.setParams({'saveJSONFile': this._showSaveDialog})
  };

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this._getLocationAsync();
    }
    this.setState({ appState: nextAppState });
  };

  componentWillUnmount() {
    this._unsubscribeLocation();
    AppState.removeEventListener('change', this._handleAppStateChange);
  };

  _getLocationAsync = () => {
    RNLocation.requestPermission({
      ios: "whenInUse",
      android: {
        detail: "fine"
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

  _updateLocation = (location) => {
    console.log(location)
    var hashid = geohash.encode_int(location.latitude, location.longitude, 52)
    var stops = this.state.stops
    var last = this.state.last
    if (!last || last == undefined) {
      stops.push({
        id: hashid,
        data: "",
        distance: 0,
        brng: -1,
        timestamp: new Date().getTime()
      })
      this.setState({ last: location })
      this.setState({ stops: stops })
    } else {
      var calc = new GeoInfo().from(location.latitude, location.longitude, last.latitude, last.longitude)
      if (calc.d > this.minDistance) {
        stops.push({
          id: hashid,
          data: "",
          distance: calc.d,
          brng: calc.brng,
          timestamp: new Date().getTime()
        })
        this.setState({ last: location })
        this.setState({ stops: stops })
      }
    }
  }

  handleOnClickPress(item) {
    this.setState({ selectedItem: item })
    this.setState({ dialogVisible: true })
  }

  handleTextInput(text) {
    const selectedItem = this.state.selectedItem
    selectedItem.data = text
    this.setState({ selectedItem: selectedItem })
  }

  handleSaveInput(text) {
    this.setState({ selectedFile: text })
  }

  handleCancel = () => {
    this.setState({ dialogVisible: false })
  }

  handleUpdate = () => {
    this.setState({ dialogVisible: false })
    var stops = this.state.stops.map(stop => {
      return {
        id: stop.id,
        data: (stop.id == this.state.selectedItem.id ? this.state.selectedItem.data : stop.data),
        distance: stop.distance,
        brng: stop.brng,
        timestamp: stop.timestamp
      }
    });
    this.setState({ stops: stops })
    this._storeData().then(() => { }, error => console.log(error))
  }

  _storeData = async () => {
    try {
      var storeJSON = JSON.stringify(this.state.stops)
      console.log(storeJSON)
      await AsyncStorage.setItem(new Date().toLocaleDateString(), storeJSON);
    } catch (error) {
      console.log(error)
    }
  };

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem(new Date().toLocaleDateString());
      if (value !== null) {
        this.setState({ stops: JSON.parse(value) })
      }
    } catch (error) {
      console.log(error)
    }
  };

  render() {
    return (
      <ScrollView style={styles.container}>
        <Dialog
          visible={this.state.dialogVisible}
          dialogAnimation={new SlideAnimation({
            slideFrom: 'bottom',
          })}
          onTouchOutside={this.handleCancel}
          dialogTitle={
            <DialogTitle
              title="Update Location"
              hasTitleBar={false}
            />}
          footer={
            <DialogFooter>
              <DialogButton
                text="CANCEL"
                textStyle={{ color: '#333', fontSize: 14 }}
                onPress={this.handleCancel}
              />
              <DialogButton
                text="UPDATE"
                textStyle={{ color: '#333', fontSize: 14 }}
                onPress={this.handleUpdate}
              />
            </DialogFooter>
          }
        >
          <DialogContent>
            <Text>This is the content of {this.state.selectedItem.id}</Text>
            <TextInput style={{ backgroundColor: '#ccc', width: 260, paddingHorizontal: 5, height: 150 }} onChangeText={(text) => this.handleTextInput(text)}></TextInput>
          </DialogContent>
        </Dialog>
        <View
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View style={styles.helpContainer}>
            {
              this.state.stops && this.state.stops.length ? this.state.stops.map((item, index) => {
                return <TouchableOpacity key={index} onPress={() => this.handleOnClickPress(item)} style={styles.helpLink}>
                  <Text>{new Date(item.timestamp).toLocaleTimeString()}: {item.distance.toFixed(1)}m {item.data}</Text>
                </TouchableOpacity>
              }) : null
            }
          </View>
        </View>
        <Dialog
          visible={this.state.dialogSaveFile}
          dialogAnimation={new SlideAnimation({
            slideFrom: 'bottom',
          })}
          onTouchOutside={() => this.setState({ dialogSaveFile: false })}
          dialogTitle={
            <DialogTitle
              title="Save To File"
              hasTitleBar={false}
            />}
          footer={
            <DialogFooter>
              <DialogButton
                text="CANCEL"
                textStyle={{ color: '#333', fontSize: 14 }}
                onPress={() => this.setState({ dialogSaveFile: false })}
              />
              <DialogButton
                text="SAVE"
                textStyle={{ color: '#333', fontSize: 14 }}
                onPress={() => { this.saveToFile() }}
              />
            </DialogFooter>
          }
        >
          <DialogContent>
            <Text>Enter data record to save:</Text>
            <TextInput style={{ backgroundColor: '#ccc', width: 260, paddingHorizontal: 5, height: 50 }} onChangeText={(text) => this.handleSaveInput(text)}>{new Date().toLocaleDateString()}</TextInput>
          </DialogContent>
        </Dialog>
      </ScrollView>
    );
  };
}

function handleLearnMorePress() {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/versions/latest/workflow/development-mode/'
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/versions/latest/workflow/up-and-running/#cant-see-your-changes'
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#fff',
  },
  helpLink: {
    height: 50,
    paddingLeft: 5,
    textAlign: 'center',
    textAlignVertical: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc'
  }
});
