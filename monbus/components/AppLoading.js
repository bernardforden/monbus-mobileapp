import SplashScreen from 'react-native-splash-screen'
import React, { Component } from 'react'
import { View, Text } from 'react-native'

export default class AppLoading extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        this.props.startAsync().then(()=> {
            SplashScreen.hide();
            this.props.onFinish();
        }, (err) => {
            this.props.onError(err)
        });
    }
    render() {
        return (
            <View><Text>Loading...</Text></View>
        );
    }
}