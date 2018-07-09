import React from 'react';
import moment from 'moment';
import { AsyncStorage, ScrollView, StyleSheet, View, Text, Button} from 'react-native';
import API from '../constants/Api';
import {Calendar, Permissions} from 'expo';
import { ExpoLinksView } from '@expo/samples';


let times = []
let countDown = (24 * 60);
let arrThisEpisode = [];

export default class LinksScreen extends React.Component {
  static navigationOptions = {
    title: 'Dues',
  };
  state = {
    medTimes: [],
    status: 'not requested'
  };

  componentDidMount() {
    console.log("physicianInfo");
    let obj = [];

    AsyncStorage.getItem('patientID', (err, patientID) => {
      console.log("physician icon clicked")
      console.log(patientID);
      try {
        this.setState({
          patientID: patientID,
        }, function () {
          console.log(this.state.patientID)
          API.findPatientInfoForPatient(this.state.patientID).then(async (res) => {
            await this.setState({
              episode: res.data.episode,
              lastEpisode: res.data.episode[res.data.episode.length - 1],
              lastEpisodeMedication: res.data.episode[res.data.episode.length - 1].medications,
              lastEpisodeRecord: res.data.episode[res.data.episode.length - 1],
              appointment : res.data.appointment
            }, async function () {
              await this.populateMedDue()
              
              let todayDate = moment();
              console.log("Today date : " , todayDate);
              console.log(" Appointment date : ", this.state.appointment.next_appt)
              
              for (let m = todayDate; m.isBefore(moment(this.state.appointment.next_appt)); m.add(1, 'days')) {
                for (let i = 0; i < times.length; i++) {
                  arrThisEpisode.push(moment(m.format("YYYY-MM-DD") + " " + times[i], "YYYY-MM-DD HHmm").toISOString())
                  console.log("med due date : " + moment(m.format("YYYY-MM-DD") + " " + times[i], "YYYY-MM-DD HHmm").toISOString());
                }
              }


            })
          })
            .catch(err => {
              console.log("error in finding patient info");
            })
        });
      }
      catch (err) {
        console.log(err);
      }
    });
  }
    

  getMedTimes = () => {

    this.state.lastEpisodeMedication.map((x) => {
      x.times.map((time) => {
        if (times.includes(time)) {
        } else {
          times.push(time);
        }
      })
    })
    times.sort(function (a, b) {
      return a - b;
    })
    /* this.populateDateObj() */

    return times;
  }

  populateMedDue = async () => {
    let medDue = this.getMedTimes();
    console.log("Med due : ", medDue);
    await this.setState({
      medTimes: medDue
    }, async function () {
      await this.state.medTimes.map((x) => {
        let date = moment().format("MM/DD/YYYY");
        let newTime = moment(x, "HHmm").format("hh:mm A")
        let currentDateTime = moment(date + ' ' + newTime)
        currentDateTime = moment(currentDateTime, "MM-DD-YYYY hh:mm A").format('YYYY-MM-DDTHH:mm:ssZ');
        if (moment().diff(currentDateTime) < 0) {
          if (countDown > moment(currentDateTime).diff(moment(), "minutes"))
            countDown = moment(currentDateTime).diff(moment(), "minutes")
        }
        this.setState({
          newTime: newTime
        })
      })
    })

  }
  beautifyCountDown = (duration) => {

    let newDurationHour = parseInt(0)
    newDurationHour = Math.floor(parseInt(duration) / parseInt(60));
    let newDurationMinutes = duration % 60;
    console.log(newDurationMinutes);


    let newDuration = `${newDurationHour} hour${newDurationHour > 1 ? `s` : ``} ${newDurationMinutes} minutes`
    console.log("New duration : ", newDuration);
    return (
      <Text style={styles.subMedicationText}>{newDuration !== "24 hours 0 minutes" ? newDuration : "You do not have any medication due today!"}</Text>
    )

  }
  async addEvent() {
    console.log("pressed");
    this.setState({ status: 'requesting permission' });
    const { status } = await Permissions.askAsync(Permissions.CALENDAR);
    if (status === 'granted') {
      this.setState({ status: 'creating event' });
      arrThisEpisode.map( (dateItem,index) =>{
        const eventId = Calendar.createEventAsync(Calendar.DEFAULT, {
          title: 'Test' + index ,
          startDate: moment(dateItem).toISOString(),
          endDate: moment(dateItem).add(5, 'minute').toISOString(),
        });
        this.setState({ status: 'event created', eventId }, () =>{
          if (index === arrThisEpisode.length) {
            alert("Medication reminder set!")
          };
        });
      })

      /* const eventId = await Calendar.createEventAsync(Calendar.DEFAULT, {
        title: 'A brand new event',
        startDate: moment(dateItem).toISOString(),
        endDate: moment(dateItem).add(5, 'minute').toISOString(),
        timeZone: 'America/Phoenix',
      });
      this.setState({ status: 'event created', eventId }, function(){
        alert("Medication reminder set!")
      }); */
    }
  }
  
  populateDateObj = () => {
    const arrReminder = []
    times.map((x) => {
      let today = moment().format("MM-DD-YYYY");
      let time = moment(x, "HHmm").format("h:mm a");
      let dateTime = moment(today + " " + time).format();
      let remindUntil = `RRULE:FREQ=DAILY;UNTIL=${moment(this.state.next_appt).format()}`
      arrReminder.push(
        {
          'summary': `Medication Reminder`,
          'location': `Medication Location`,
          'description': `MedMonitor Reminder`,
          'start': {
            'dateTime': `${dateTime}`,
            'timeZone': 'America/New_York'
          },
          'end': {
            'dateTime': `${moment(dateTime).add(5, 'minute').format()}`,
            'timeZone': 'America/New_York'
          },
          'reminders': {
            'useDefault': false,
            'overrides': [
              { 'method': 'email', 'minutes': 24 * 60 },
              { 'method': 'popup', 'minutes': 10 }
            ]
          },
          'recurrence': [
            remindUntil
          ]
        }
      )
    })
  }
  render() {
    return (
      <ScrollView style={styles.container}>
        {/* Go ahead and delete ExpoLinksView and replace it with your
           * content, we just wanted to provide you with some helpful links */}
        {/* <ExpoLinksView /> */}
        <View style={styles.medicationDueContainer}>
          <View style={styles.medicationContainer}>
            <Text style={styles.header}>Meds Due Times</Text>
          </View>
          <View style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={styles.medicationContainer}>
              <Text style={styles.medicationText}>Next Medication(s) Due In</Text>
            </View>
            <View style={styles.medicationContainer}>
              {this.beautifyCountDown(countDown)}
            </View>
            <View style={styles.lineStyle} />

            <View style={styles.medicationContainer}>
              <Text style={styles.medicationText}>Today medication due time:</Text>
            </View>
            <View style={styles.medicationContainer}>
              {this.state.medTimes !==null ?
                this.state.medTimes.map((x) => {
                  return (
                    moment(x, "hhmm").isAfter(moment())
                      ?
                      <Text style={styles.subMedicationText} key={x}>{moment(x, "hhmm").format("hh:mm A")}</Text>
                      :
                      null
                  )
                })
                :
                null
              } 
            </View>
            <View style={styles.lineStyle} />
            <Button onPress={() => this.addEvent()} title="Remind me" />
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
  subheader : {
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
    marginHorizontal: 25,
  },
  medicationText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
  },
  subMedicationText: {
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
