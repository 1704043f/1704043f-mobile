import React from 'react';
import { AsyncStorage, Platform, StatusBar, StyleSheet, View, Text, TextInput, Button } from 'react-native';
import { AppLoading, Asset, Font, Icon } from 'expo';
import AppNavigator from './navigation/AppNavigator';
import API from './constants/Api';

export default class App extends React.Component {
  state = {
    isLoadingComplete: false,
  };

  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    } else {
      return (
        <View style={styles.container}>
          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
          
          <AppNavigator />
        </View>
      );
    }
  }
  
  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/robot-dev.png'),
        require('./assets/images/robot-prod.png'),
        require('./assets/images/med_monitor.png'),
      ]),
      Font.loadAsync({
        // This is the font that we are using for our tab bar
        ...Icon.Ionicons.font,
        // We include SpaceMono because we use it in HomeScreen.js. Feel free
        // to remove this if you are not using it in your app
        'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      }),
      await AsyncStorage.getItem('patientID', async (err, patientID) => {
        console.log("patient id : " + patientID);
        await API.findPatientInfoForPatient(patientID).then(async (res) => {
          await this.setState({
            physicianInfo: res.data.physician,
            episode: res.data.episode,
            appointment: res.data.appointment,
            msgCenter: ''
          }, function () {
            console.log("Found patient ID, proceed to pull patient info");
            console.log("appointment", this.state.appointment);
            console.log("physician ", this.state.physicianInfo);
          })
        })
          .catch(err => {
            console.log("error in finding patient info");
          })
      }).catch((err) => {
        console.log(err);
      })
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
