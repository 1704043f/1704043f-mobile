import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  StatusBar,
  StyleSheet,
  View,
  Image,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import { Input, Button } from 'react-native-elements';
import { WebBrowser } from 'expo';
import { createStackNavigator, createSwitchNavigator } from 'react-navigation';
import API from '../constants/Api';
import MainTabNavigator from './MainTabNavigator';



class SignInScreen extends React.Component {
  static navigationOptions = {
    title: 'Welcome to Med Monitor',
  };
  state = {
    msgCenter : ''
  }
  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('http://www.medmonitor.io');
  };


  render() {
    return (
      <View style={styles.container}>
      <Image
              source={
                __DEV__
                  ? require('../assets/images/med_monitor.png')
                  : require('../assets/images/med_monitor.png')
              }
              style={styles.welcomeImage}
            />
        {this.state.msgCenter ?
          <Text>{this.state.msgCenter}</Text>
          :
          null
        }
        <Input 
          placeholder='Username' 
          leftIcon={{ type: 'font-awesome', name: 'user', color: 'rgba(0,0,0,0.4)'}} 
          containerStyle={{
            borderRadius: 5,
            borderColor: 'transparent',
            borderWidth: 0,
            width: 300,
            height: 45,
          }}
          autoCapitalize='none'
          onChangeText={(user) => this.setState({ user })} 
        />
        
        <Input
          placeholder='Password'
          secureTextEntry={true}
          leftIcon={{ type: 'font-awesome', name: 'unlock', color: 'rgba(0,0,0,0.4)'}} 
          containerStyle= {{
            borderRadius: 5,
            borderColor : 'transparent',
            borderWidth : 0,
            width: 300,
            height: 45,
          }}
          onChangeText={(password) => this.setState({ password })}
        />
        <Button icon = {
          <Icon
            name='arrow-right' 
            size={15} 
            color='white' 
          />
          }
          iconRight
          title='Sign In' 
          buttonStyle={{
            width:300,
            height: 45,
            borderColor : 'transparent',
            borderWidth: 0,
            borderRadius : 5,
            marginTop : 25, 
          }}
          titleStyle={{ fontWeight: '700' }}
          onPress={this._signInAsync}
        />

        <Text style={styles.learnMoreText} onPress={this._handleLearnMorePress}>Learn more about this application</Text>
        
      </View>
    );
  }

  _signInAsync = async () => {
    objLogin =
      {
        username: this.state.user,
        password: this.state.password,
      }
    await API.login(objLogin).then(async res => {
      console.log("wee");
      console.log(res.data)
      objUserInfo = {
        userID: res.data._id,
        email: res.data.email,
        patientID: res.data.patient_id,
        role: res.data.role,
        username: res.data.username
      }
      await AsyncStorage.setItem('userInfo', JSON.stringify(objUserInfo), async () => {
        await AsyncStorage.getItem('userInfo',  async (err, result) => {
          console.log("Login button clicked")
          console.log(result);
          console.log(objUserInfo.username);
          if (objUserInfo && objUserInfo.patientID) {
            //this.props.getBackValidatedUser(true)
            console.log("set validated user to true and also adding patient ID into asyncstorage ", objUserInfo.patientID);
            await AsyncStorage.setItem('patientID', objUserInfo.patientID, async(err, result) =>{
              console.log("proceed to main page");
              await this.props.navigation.navigate('Main');
            });
            
          }
        });
      })
    }).catch(err => {
      console.log("error signing in")
      this.setState({ msgCenter: 'Invalid username or password.' })
    })
    
  };
}

class AuthLoadingScreen extends React.Component {
  constructor() {
    super();
    this._bootstrapAsync();
  }

  // Fetch the token from storage then navigate to our appropriate place
  _bootstrapAsync = async () => {
    const userToken = await AsyncStorage.getItem('patientID');

    // This will switch to the App screen or Auth screen and this loading
    // screen will be unmounted and thrown away.
    this.props.navigation.navigate(userToken ? 'Main' : 'Auth');
  };


  // Render any loading content that you like here
  render() {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeImage: {
    width: 360,
    height: 150,
    resizeMode: 'contain',
    marginTop: 3,
    marginBottom: 10,
    marginLeft: -10,
  },
  learnMoreText: {
    fontSize: 14,
    color: '#2e78b7',
    marginTop: 30,
  },
});

export default createSwitchNavigator(
  {
  // You could add another route here for authentication.
  // Read more at https://reactnavigation.org/docs/en/auth-flow.html
  AuthLoading : AuthLoadingScreen,
  Auth : SignInScreen,
  Main: MainTabNavigator,
  },
  {
    initialRouteName: 'AuthLoading',
  });