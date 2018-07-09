import React from 'react';
import { ExpoConfigView } from '@expo/samples';
import { StatusBar, AsyncStorage, ScrollView, StyleSheet, View, Text, Button } from 'react-native';
import API from '../constants/Api';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'app.json',
  };

  render() {
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */
    return (
      
      <View style={styles.container}>
        <ExpoConfigView />
        <Button color='rgba(255,0,0,0.4) ' title="I'm done, sign me out" onPress={this._signOutAsync} />
        <StatusBar barStyle="default" />
      </View>
    );
  }
  _signOutAsync = async () => {
    await AsyncStorage.clear();
    console.log("Logged out");
    this.props.navigation.navigate('Auth');
  };
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText : {
    color: 'rgba(255, 0, 0, 0.4)'
  }

});