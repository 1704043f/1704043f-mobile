import React from 'react';
import moment from 'moment';
import { AsyncStorage, ScrollView, StyleSheet, View, Text, Button } from 'react-native';
import API from '../constants/Api';
import { Calendar, Permissions } from 'expo';
import { ExpoLinksView } from '@expo/samples';

let times = []
let countDown = (24 * 60);

export default class physicianScreen extends React.Component {
    static navigationOptions = {
        title: 'Physician Info',
    };
    state = {
        physicianInfo: [],
    };

    componentDidMount() {
        console.log("physicianInfo");
        let obj = [];

        AsyncStorage.getItem('patientID', async  (err, patientID) => {
            console.log("physician icon clicked")
            console.log(patientID);
            try {
                this.setState({
                    patientID: patientID,
                }, function (){
                    console.log(this.state.patientID)
                    API.findPatientInfoForPatient(patientID).then(async (res) => {
                        console.log("Result from api call : " ,res.data);
                        await this.setState({
                            physicianInfo : res.data.physician,
                            appointment : res.data.appointment.next_appt
                        }, async () => {
                            await console.log("Data : " , this.state.physicianInfo);
                        })
                    })
                        .catch(err => {
                            console.log("error in finding patient info");
                        })
                });
            }
            catch (err) {
                console.log("err")
                console.log(err);
            }
        });
    }
    async remindUser(){
        console.log("pressed");
        this.setState({ status: 'requesting permission' });
        const { status } = await Permissions.askAsync(Permissions.CALENDAR);
        if (status === 'granted') {
            this.setState({ status: 'creating appointment' });
            const eventId = Calendar.createEventAsync(Calendar.DEFAULT, {
                title: 'Doctor Appointment',
                startDate: moment(this.state.appointment).toISOString(),
                endDate: moment(this.state.appointment).add(2, 'hour').toISOString(),
                location: this.state.physicianInfo.office,
            });
            this.setState({ status: 'appointment created', eventId }, ()=>{
                alert("Appointment reminder set!")
            });
            
        }
    }
    render() {
        return (
            <ScrollView style={styles.container}>
                {/* Go ahead and delete ExpoLinksView and replace it with your
           * content, we just wanted to provide you with some helpful links */}
                
                <View style={styles.medicationDueContainer}>
                    <View style={styles.medicationContainer}>
                        <Text style={styles.header}>Physician Info</Text>
                    </View>
                    <View style={{
                        flex: 1,
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View style={styles.medicationContainer}>
                            <Text style={styles.physicianInfoText}>Your Physician</Text>
                        </View>
                        {this.state.physicianInfo ? 
                        <View style={styles.medicationContainer}>
                            {this.state.physicianInfo.name ?
                            <View style={styles.medicationContainer}>
                                <Text style={styles.physicianInfoText}>Dr. {this.state.physicianInfo.name.first} {this.state.physicianInfo.name.last}</Text>
                            </View>
                            : null
                            }
                            
                            <View style={styles.medicationContainer}>
                                <Text style={styles.physicianInfoText}> {this.state.physicianInfo.email}</Text>
                            </View>
                            
                        </View>
                        : null
                        }
                        <View style={styles.lineStyle} />

                        <View style={styles.medicationContainer}>
                            <Text style={styles.physicianInfoText}>Appointment Location</Text>
                        </View>
                        <View style={styles.medicationContainer}>
                            <View style={styles.medicationContainer}>
                                <Text style={styles.physicianInfoText}>Office :</Text>
                                <Text style={styles.physicianInfoText}> {this.state.physicianInfo.office} </Text>
                            </View>
                            <View>
                                <Text style={styles.physicianInfoText}>Office Hours</Text>
                            </View>
                            <View style={styles.medicationContainer}>
                                <Text  style={styles.physicianInfoText}>Day : Monday - Saturday</Text>
                            </View>
                            <View style={styles.medicationContainer}>
                                <Text style={styles.physicianInfoText}>Hour : Weekday 8:00am - 6:00pm, Saturday 9:00am - 2:00pm</Text>
                            </View>
                        </View>
                        <View style={styles.lineStyle} />
                        <Button onPress={() => this.remindUser()} title="Remind me" />
                    </View>
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 15,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 20,
        color: 'rgba(96,100,109, 1)',
        lineHeight: 24,
        textAlign: 'center',
        paddingTop: 20,
        paddingBottom: 20,
    },
    subheader: {
        fontSize: 18,
        color: 'rgba(96,100,109, 1)',
        lineHeight: 24,
        textAlign: 'center'
    },
    medicationDueContainer: {
        alignItems: 'center',
        marginHorizontal: 50,
    },
    medicationContainer: {
        alignItems: 'center',
        marginHorizontal: 5,
    },
    physicianInfoText: {
        marginBottom: 20,
        color: 'rgba(0,0,0,0.4)',
        fontSize: 16,
        lineHeight: 19,
        textAlign: 'center',
    },
    headerText: {
        fontSize: 17,
        color: 'rgba(96,100,109, 1)',
        lineHeight: 24,
        textAlign: 'center',
    },
    lineStyle: {
        borderWidth: 0.5,
        borderColor: 'rgba(96,100,109, 0.4)',
        margin: 10,
        width: 400,
    }
});
