import React from 'react';
import {
  AsyncStorage,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import { Input, Button } from 'react-native-elements';
import moment from 'moment'
import { WebBrowser } from 'expo';
import API from '../constants/Api';

import { MonoText } from '../components/StyledText';

export default class HomeScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };
  state = {
    questions: questions,
    completed: [],
    count: questions.length,
    currentQuestion: 0,
    finished: false,
  };
  getSessionStorage = async () => {
    await AsyncStorage.getItem('patientID', async (err, patientID) => {
      console.log("patient id : " + patientID);
      await API.findPatientInfoForPatient(patientID).then(async (res) => {
        await this.setState({
          patientID : patientID,
          episode: res.data.episode,
          lastEpisode: res.data.episode[res.data.episode.length - 1],
          lastEpisodeMedication: res.data.episode[res.data.episode.length - 1].medications,
          lastEpisodeRecord: res.data.episode[res.data.episode.length - 1],
        }, async function () {
          let pastMed = [];
          let futureMed = [];
          let medTimeDate = [];
          let closestPastTime = '';
          let closestPastTimeIndex = '';
          let foundPreviousTime = false;
          let timeNow = moment();
          let timeDiff = '';
          let percentDiff = '';
          let durationDiff = '';

          times = this.getMedTimes()
          console.log("Times : ", times);
          if (times && times.length > 0) {
            times.map(x => medTimeDate.push(moment(x, "HHmm").toISOString()));
            for (let i = 0; i < times.length; i++) {
              if (timeDiff === '' || timeDiff > Math.abs(moment().diff(moment(medTimeDate[i]), "minutes"))) {
                timeDiff = Math.abs(moment().diff(moment(medTimeDate[i]), "minutes"));
                closestPastTime = medTimeDate[i];
                closestPastTimeIndex = i;
              }
              //if pass current time
              if (moment(medTimeDate[i]).isBefore(timeNow)) {
                pastMed.push(moment(times[i], "HHmm").format("HHmm"))
                //still in the future
              } else if (moment(medTimeDate[i]).isAfter(timeNow)) {
                futureMed.push(moment(times[i], "HHmm").format("HHmm"))
              }
            }
          }
          console.log("Closest past time : " + closestPastTime + ", index at : " + closestPastTimeIndex)
          console.log("pastMed : ", pastMed);
          console.log("futureMed : ", closestPastTimeIndex)
          //if closest past time is the first due in the morning, find the 
          if (closestPastTimeIndex === 0 && this.state.lastEpisodeRecord.length >= 1) {
            let yesterdayLastMed = moment(medTimeDate[medTimeDate.length - 1]).add(-1, "day").toISOString()
            console.log("yesterday last med : ", yesterdayLastMed);
            durationDiff = moment(medTimeDate[closestPastTimeIndex]).diff(yesterdayLastMed, 'minutes')
            percentDiff = timeDiff / moment(medTimeDate[closestPastTimeIndex]).diff(yesterdayLastMed, 'minutes') * 100;

          } else if (this.state.lastEpisodeRecord === 0) {
            //if it is first record, don't let 
            foundPreviousTime = true;
          }
          else {
            console.log("med in between last")
            durationDiff = moment(medTimeDate[closestPastTimeIndex]).diff(medTimeDate[closestPastTimeIndex - 1], "minutes")
            percentDiff = timeDiff / Math.abs(moment(medTimeDate[closestPastTimeIndex]).diff(medTimeDate[closestPastTimeIndex - 1], "minutes")) * 100;

          }
          console.log("duration diff : ", durationDiff);
          console.log("percentage diff : ", percentDiff);

          if (percentDiff > (-25)) {
            foundPreviousTime = false;
          }
          for (let i = 0; i < this.state.lastEpisodeRecord.length; i++) {
            if (moment(this.state.lastEpisodeRecord[i].date_time).toISOString() === closestPastTime) {
              foundPreviousTime = true;
            }
          }

          let episodeStartDate = moment(this.state.lastEpisode.start_date);
          let episodeEndDate = moment(this.state.next_appt);
          console.log("start date : ", episodeStartDate);
          console.log("end date : ", episodeEndDate);
          let arrThisEpisode = [];
          let arrThisEpisodeUntilToday = [];

          for (let m = moment(episodeStartDate); moment(m).isBefore(episodeEndDate); m.add(1, 'days')) {
            for (let i = 0; i < times.length; i++) {
              arrThisEpisode.push(moment(m.format("YYYY-MM-DD") + " " + times[i], "YYYY-MM-DD HHmm").toISOString())
              console.log("date : " + moment(m.format("YYYY-MM-DD") + " " + times[i], "YYYY-MM-DD HHmm").toISOString());
            }
          }
          for (let i = 0; i < arrThisEpisode.length; i++) {
            if (moment(arrThisEpisode[i]).isBefore(moment())) {
              arrThisEpisodeUntilToday.push(arrThisEpisode[i])
            }
          }
          let lastEpisodeRecordDates = [];
          for (let j = 0; j < this.state.lastEpisodeRecord.record.length; j++) {
            lastEpisodeRecordDates.push(this.state.lastEpisodeRecord.record[j].date_time)
          }

          console.log("length of episdoe unti ltoday : ", arrThisEpisodeUntilToday.length);
          console.log("this state last episode record : ", lastEpisodeRecordDates);
          for (let i = 0; i < arrThisEpisodeUntilToday.length; i++) {
            let existInRecords = false;

            if (lastEpisodeRecordDates.includes(arrThisEpisodeUntilToday[i])) {
              console.log("exist in record!" + arrThisEpisodeUntilToday[i]);
              existInRecords = true;
            } else {
              console.log("dne in record!" + arrThisEpisodeUntilToday[i]);
            }
            if (!existInRecords) {
              let objAnswers = {
                date_time: moment(arrThisEpisodeUntilToday[i]).toISOString(),
                has_record: false,
              }
              //console.log(objAnswers);
              /*
               API.createNewRecord(this.state.patientID, objAnswers)
                  .then(res => {
                      //console.log("added no record to .. ", objAnswers.date_time);
                      console.log(res) 
                  })
                  .catch(err => console.log(err)); 
                  */
              //console.log("this data doesn't exist : ", arrThisEpisodeUntilToday[i]);
            }
          }
          await this.setState({
            medTimes: times,
            pastMed,
            futureMed,
            closestPastTime,
            foundPreviousTime,
            durationDiff
          }, async () => {
            console.log("State in patient: ", this.state.medTimes);
            console.log("past med : ", this.state.pastMed);
            console.log("future med : ", this.state.futureMed);
            console.log("closestpasttime : ", this.state.closestPastTime);
            console.log("found prev time : ", this.state.foundPreviousTime);
            console.log("duration diff : ", this.state.durationDiff);
            if (this.state.closestPastTime) {
              if (this.state.durationDiff) {

                this.state.lastEpisodeRecord.record.map((x) => {
                  console.log(x.date_time + ", " + this.state.closestPastTime);;
                  let foundSurvey = false;
                  //let record = JSON.parse(x)
                  //console.log(record);
                  if (x.date_time === this.state.closestPastTime) {
                    console.log("record exist in the system at " + x.date_time)
                    foundSurvey = true;
                    //this.props.getBackCompletedSurvey(foundSurvey);
                  } else {
                    //console.log("nope~ at " + x.date_time);

                  }
                })
                console.log(this.state.durationDiff);
                let byFive = this.state.durationDiff / 5;
                let splitFive = [];
                for (let i = 1; i < 6; i++) {
                  let hour = Math.floor(byFive * i / 60);
                  let minutes = Math.floor(byFive * i % 60);
                  let combinedTime;
                  if (hour > 0) {
                    combinedTime = "Within " + hour + " hr " + minutes + " mins"
                  } else {
                    combinedTime = "Within " + minutes + " mins"
                  }
                  splitFive.push(combinedTime);
                  console.log(splitFive)
                }
                this.state.questions.map(x => {
                  if (x.type === 'time-series') {
                    x.answers = splitFive
                  }
                })
                let newQuestions = this.state.questions
                await this.setState({
                  questions: newQuestions,
                }, function () {
                  //console.log("after messing with time series answer : " , this.state.questions);
                })

              } else {
                console.log("no data in next prop durationdiff")
              }
            }

          });
        })
      })
      .catch(err => {
        console.log("error in finding patient info");
      })
    }).catch((err)=>{
      console.log(err);
    })
  }
  componentDidMount(){
    this.getSessionStorage();
  }

  populateTimeSeriesAnswer = (question) => {
    console.log(this.state.durationDiff);
    let byFive = this.state.durationDiff / 5;
    let splitFive = [];
    for (let i = 1; i < 6; i++) {
      let hour = Math.floor(byFive * i / 60);
      let minutes = Math.floor(byFive * i % 60);
      let combinedTime;
      if (hour > 0) {
        combinedTime = "Within " + hour + " hr " + minutes + " mins"
      } else {
        combinedTime = "Within " + minutes + " mins"
      }
      splitFive.push(combinedTime);
    }
    question.map(x => {
      if (x.type === 'time-series') {
        x.answers = splitFive
      }
    })
    let newQuestions = question
    return newQuestions
  }
  pickAnswer(answer, index) {
    console.log("answer clicked : ", answer.ans)
    let answerToQuestion = this.state.questions[this.state.currentQuestion].answered
    console.log("Answer to Questions before adding/splicing : ", answerToQuestion);
    if (answerToQuestion.includes(answer.ans)) {
      console.log("answer exist, proceed to splice")
      answerToQuestion.splice(answer.ans);
    } else {
      if (answer.ans === 'None Of These') {
        console.log("none of these selected, proceed to clear array.")
        answerToQuestion = [];
      } else {
        console.log("answer does not exist, proceed to push")
        answerToQuestion.push(answer.ans)
      }
    }
    setTimeout(() => {
      console.log("After adding/splicing : ", answerToQuestion)
      this.state.questions[this.state.currentQuestion].answered = answerToQuestion
      console.log("answered: ")
      console.log(this.state.questions[this.state.currentQuestion].answered)
    }, 100)

  }

  saveAnswer(answer) {
    console.log("selected answer is : ", answer);
    console.log(answer.ansIndex);
    let nextQuestion = parseInt(this.state.currentQuestion) + 1;
    let currQuestion = parseInt(this.state.currentQuestion);
    if (currQuestion <= this.state.count - 1) {
      if (this.state.questions[currQuestion].selectionType === 'checkbox') {
        console.log("it is a checkbox question")
      } else {
        console.log("it is a radio question")
        this.state.questions[currQuestion].answered = answer.ansIndex
      }
      console.log("currQuestion : " + currQuestion + " out of " + this.state.count);
      if (currQuestion === this.state.count - 1) {
        console.log("here");
        this.setState({
          finished: true
        }, async () => {
          console.log("Closest past time in pat survey : ", moment(this.state.closestPastTime).toISOString());
          let objAnswers = {
            date_time: moment(this.state.closestPastTime).toISOString(),
            has_record: true,
            meds_taken: this.state.questions[0].answered,
            emergencies: {
              falls: this.state.questions[1].answered.includes("Falls") ? 1 : 0,
              freezing: this.state.questions[1].answered.includes("Freezing Of Gait") ? 1 : 0,
              choking: this.state.questions[1].answered.includes("Choking On Food") ? 1 : 0,
              hallucination: this.state.questions[1].answered.includes("Hallucinations") ? 1 : 0,
            },
            symptoms: {
              kickin: this.state.questions[2].answered,
              wearoff: this.state.questions[3].answered,
              movement: this.state.questions[4].answered,
              sleepy: this.state.questions[5].answered,
              offtime: this.state.questions[6].answered,
              tremor: this.state.questions[7].answered,
              walking: this.state.questions[8].answered,
              balance: this.state.questions[9].answered,
            },
            side_effects: {
              sickness: this.state.questions[10].answered,
              dizziness: this.state.questions[11].answered,
              headaches: this.state.questions[12].answered,
              drymouth: this.state.questions[13].answered,
            }
          }
          console.log("After completing the questionaires : ", objAnswers);
          setTimeout(() => {
            console.log("patientID : " , this.state.patientID);
            API.createNewRecord(this.state.patientID, objAnswers)
              .then(res => {
                console.log(res)
                console.log("saved into db ", res);
              })
              .catch(err => {
                console.log("something wrong in this api call.")
                console.log(err)
              });
          }, 100);
          console.log("done saving")
        })
      }
      this.setState({
        currentQuestion: nextQuestion,
      }, function () {
        console.log("answered: ")
        console.log(this.state.questions[currQuestion].answered);
      });


    } else {

    }
  }
  saveAnswersToDb() {

  }
  populateMedDue = () => {
    let medDue = this.getMedTimes();
    console.log("Med due : ", medDue);
    this.setState({
      medTimes: medDue
    }, function () {
      console.log("med times : ", this.state.medTimes);
      //
      this.state.medTimes.map((x) => {
        let date = moment().format("MM/DD/YYYY");
        let newTime = moment(x, "HHmm").format("hh:mm A")
        let currentDateTime = moment(date + ' ' + newTime)
        currentDateTime = moment(currentDateTime, "MM-DD-YYYY hh:mm A").format('YYYY-MM-DDTHH:mm:ssZ');

        console.log("curr date time : ", currentDateTime);
        console.log("now : ", moment())
        if (moment().diff(currentDateTime) < 0) {
          console.log("moment is diff than curr date time : ");
          if (countDown > moment(currentDateTime).diff(moment(), "minutes"))
            countDown = moment(currentDateTime).diff(moment(), "minutes")
        }
        this.setState({
          newTime: newTime
        })

      })
    })

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

  populateTimeSeriesAnswer = (question) => {
    if (this.props.durationDiff) {
      console.log(this.props.durationDiff);
      let byFive = this.props.durationDiff / 5;
      let splitFive = [];
      for (let i = 1; i < 6; i++) {
        let hour = Math.floor(byFive * i / 60);
        let minutes = Math.floor(byFive * i % 60);
        let combinedTime;
        if (hour > 0) {
          combinedTime = "Within " + hour + " hr " + minutes + " mins"
        } else {
          combinedTime = "Within " + minutes + " mins"
        }
        splitFive.push(combinedTime);
        console.log("split five : ", splitFive)
      }
      question.map(x => {
        if (x.type === 'time-series') {
          x.answers = splitFive
        }
      })
      let newQuestions = question
      return newQuestions
    }
  }
  render() {
    const { count } = this.state
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.welcomeContainer}>
            <Image
              source={
                __DEV__
                  ? require('../assets/images/med_monitor.png')
                  : require('../assets/images/med_monitor.png')
              }
              style={styles.welcomeImage}
            />
          </View>
          {/* 
          <View style={styles.getStartedContainer}>
            {this._maybeRenderDevelopmentModeWarning()}

            <Text style={styles.getStartedText}>Get started by opening</Text>

            <View style={[styles.codeHighlightContainer, styles.homeScreenFilename]}>
              <MonoText style={styles.codeHighlightText}>screens/HomeScreen.js</MonoText>
            </View>

            <Text style={styles.getStartedText}>
              Hello World! 
            </Text>
          </View>

          <View style={styles.helpContainer}>
            <TouchableOpacity onPress={this._handleHelpPress} style={styles.helpLink}>
              <Text style={styles.helpLinkText}>Help, it didn’t automatically reload!</Text>
            </TouchableOpacity>
          </View> */}
          <View>
            {
              this.state.questions && parseInt(this.state.currentQuestion) < parseInt(count) ?
                this.state.questions.map((item, index) => {
                  return (
                    item.questionNum === this.state.currentQuestion ?
                      <View key={index} style={styles.questionContainer}>
                        <Text style={styles.questionText}>Question : {index + 1} of {this.state.count}</Text>
                        <View style={styles.questionContainer}>
                          <Text style={styles.questionText}>{item.question}</Text>
                        </View>
                        {
                          item.answers.map((ans, ansIndex) => {
                            return (
                              item.selectionType === 'checkbox' ?

                                <View key={ansIndex}>
                                  <Button 
                                    value={ans} 
                                    title={ans} 
                                    buttonStyle={{
                                      width: 300,
                                      height: 45,
                                      borderColor: 'transparent',
                                      borderWidth: 0,
                                      borderRadius: 5,
                                      marginTop: 12,
                                      marginBottom: 12,
                                    }}
                                    titleStyle={{ fontWeight: '400' }}
                                    onPress={() => this.pickAnswer({ ans, index })}>
                                      {ans}
                                  </Button>
                                </View>
                                :
                                <View key={ansIndex}>
                                  <Button 
                                    value={ans} 
                                    title={ans} 
                                    buttonStyle={{
                                      width: 300,
                                      height: 45,
                                      borderColor: 'transparent',
                                      borderWidth: 0,
                                      borderRadius: 5,
                                      marginTop: 12,
                                      marginBottom: 12,
                                    }}
                                    titleStyle={{ fontWeight: '400' }}
                                    onPress={() => this.saveAnswer({ ansIndex })} 
                                    onLongPress={() => this.saveAnswer({ ansIndex })}>
                                      {ans}
                                  </Button>
                                </View>

                            )
                          })
                        }
                        { item.selectionType ==='checkbox' ?
                          //since the answer has been saved on every selection made in pickAnswer function, we pass in a 
                          // random value in the paramater. 
                          <Button 
                              title='Submit'
                              icon={
                                <Icon
                                name='arrow-right'
                                size={15}
                                color = 'white'
                                />
                              } 
                              buttonStyle={{
                                width: 300,
                                height: 45,
                                borderColor: 'transparent',
                                borderWidth: 0,
                                borderRadius: 5,
                                marginTop: 12,
                                marginBottom: 12,
                              }}
                              titleStyle={{ fontWeight: '400' }}
                              iconRight 
                              onPress={() => this.saveAnswer( "nothing")}
                          />
                          : 
                          null 
                        }
                      </View>
                      :
                      null
                  )
                }) :
                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>You have completed the questionaire</Text>
                </View>
            }
          </View>
        </ScrollView>

        {/* <View style={styles.tabBarInfoContainer}>
          <Text style={styles.tabBarInfoText}>This is a tab bar. You can edit it in:</Text>

          <View style={[styles.codeHighlightContainer, styles.navigationFilename]}>
            <MonoText style={styles.codeHighlightText}>navigation/MainTabNavigator.js</MonoText>
          </View>
        </View> */}
      </View>
    );
  }

  _maybeRenderDevelopmentModeWarning() {
    if (__DEV__) {
      const learnMoreButton = (
        <Text onPress={this._handleLearnMorePress} style={styles.helpLinkText}>
          Learn more
        </Text>
      );

      return (
        <Text style={styles.developmentModeText}>
          Development mode is enabled, your app will be slower but you can use useful development
          tools. {learnMoreButton}
        </Text>
      );
    } else {
      return (
        <Text style={styles.developmentModeText}>
          You are not in development mode, your app will run at full speed.
        </Text>
      );
    }
  }
  
  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/guides/development-mode');
  };

  _handleHelpPress = () => {
    WebBrowser.openBrowserAsync(
      'https://docs.expo.io/versions/latest/guides/up-and-running.html#can-t-see-your-changes'
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  questionText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },

  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  questionContainer : {
    alignItems: 'center',
    marginHorizontal: 25,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});


var questions = [{

  survHeader: 'MEDICATION',
  question: 'Are You Current With Your Parkinson\'s Medication?',
  type: 'regular',
  answers: ['Yes, I Am', 'No, I Am Not'],
  color: ['green', 'red'],
  value: [1, 0],
  className: ['survRadBtnGreen', 'survRadBtnRed'],
  label: "meds_taken",
  selectionType: "radio",
  answered: '',
  firstQuestion: 1,
  questionNum: 0
},

// ---------- emergncy symptoms questions ---------

{
  survHeader: 'WORRYING SYMPTOMS',
  question: 'Since taking your LAST Parkinson\'s medication: have you had any:',
  answers: ['Falls', 'Freezing Of Gait', 'Choking On Food', 'Hallucinations', 'None Of These'],
  type: 'regular',
  color: ['red', 'red', 'red', 'red', 'green'],
  value: [0, 0, 0, 0, 0],
  className: ['survChkBtnRed', 'survChkBtnRed', 'survChkBtnRed', 'survChkBtnRed', 'survChkBtnGreen'],
  selectionType: "checkbox",
  answered: [],
  label: "emergencies",
  firstQuestion: 0,
  questionNum: 1
},

// ---------- general parkinson's questions ---------

{
  survHeader: 'KICK IN',
  question: 'Since taking your LAST Parkinson\'s medication: how long did it take to kick in?',
  answers: ['Immediately', 'After 15 Minutes', 'After 30 Minutes', 'After 1 Hour', 'After More Than 1 Hour'],
  type: 'time-series',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  answered: '',
  label: "kickin",
  firstQuestion: 0,
  questionNum: 2
},
{
  survHeader: 'WEARING OFF',
  question: 'Since taking your LAST Parkinson\'s medication: if wearing off, how long ago.?',
  answers: ['Did Not Wear Off', '15 Minutes Ago', '30 Minutes Ago', '1 Hours Ago', 'More Than 1 hour Ago'],
  type: 'time-series',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  answered: '',
  label: "wearoff",
  firstQuestion: 0,
  questionNum: 3
},

{
  survHeader: 'MOVEMENT',
  question: 'Since taking your LAST Parkinson\'s medications: have you been able to move comfortable?',
  answers: ['All Of The Time', 'Most Of The Time', 'About Half The Time', 'Less Than Half The Time', 'None Of The Time'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "movement",
  answered: '',
  firstQuestion: 0,
  questionNum: 4
},

{
  survHeader: 'SLEEPY',
  question: 'Since taking your LAST Parkinson\'s medication: how tired have you been?',
  answers: ['Not Tired At All', 'Some Tiredness', 'Sleepy', 'Very Sleepy', 'Exhausted All The Time'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "sleepy",
  answered: '',
  firstQuestion: 0,
  questionNum: 5

},

{
  survHeader: 'OFF TIME',
  question: 'Right Now: do you feel off (slow, stiff, difficulty walking)?',
  answers: ['Normal', 'A Little Slow', 'Slow', 'Very Slow', 'Can\'t Move At All'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "offtime",
  answered: '',
  firstQuestion: 0,
  questionNum: 6
},

{
  survHeader: 'TREMORS',
  question: 'Right Now: if you suffer from tremor, how is it now?',
  answers: ['No Tremor', 'Bothering Me A Little', 'Worse Than Normal', 'Quite Bad', 'Very Bad'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "tremor",
  answered: '',
  firstQuestion: 0,
  questionNum: 7
},

{
  survHeader: 'WALKING',
  question: 'Right Now: how is your walking?',
  answers: ['Good', 'A Little Slow', 'Slower Than Normal', 'Very Slow, Shuffling', 'Can\'t Walk At All'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "walking",
  answered: '',
  firstQuestion: 0,
  questionNum: 8
},

{
  survHeader: 'BALANCE',
  question: 'Right Now: how is your balance when you stand or walk?',
  answers: ['Good', 'A Little Unsteady', 'Unsteady', 'Very Unsteady', 'Too Unsteady To Stand'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "balance",
  answered: '',
  firstQuestion: 0,
  questionNum: 9
},

// ---------- side effects questions ---------

{
  survHeader: 'NAUSEA AND VOMITING',
  question: 'Since taking your last Parkinson\'s medication: Have you had any nausea or sickness?',
  answers: ['None', 'A Little Nausea', 'Frequent Nausea', 'Continual Nausea', 'Vomiting'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "sickness",
  answered: '',
  firstQuestion: 0,
  questionNum: 10
},

{
  survHeader: 'DIZZINESS/LIGHTHEADEDNESS',
  question: 'Since taking your last Parkinson\'s medication: Have you felt dizzy or lightheaded?',
  answers: ['None', 'Very Occasionally', 'Yes, When I Stand Up', 'All The Time', 'To Dizzy To Stand Up'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "dizziness",
  answered: '',
  firstQuestion: 0,
  questionNum: 11
},

{
  survHeader: 'HEADACHES',
  question: 'Since taking your last Parkinson\'s medication: Have you had any headache?',
  answers: ['None', 'A Little/Occasionally', 'Mild/Continual', 'Quite Severe/On & Off', 'Severe/All The Time'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  label: "headaches",
  answered: '',
  firstQuestion: 0,
  questionNum: 12
},

{
  survHeader: 'DRY MOUTH/BLURRED VISION',
  question: 'Since taking your last Parkinson\'s medication: Have you had any feelings of dry mouth and/or blurred vision?',
  answers: ['None', 'Occasionally', 'On And Off', 'Most Of The Time', 'All The Time'],
  type: 'regular',
  color: ['green', 'blue', 'yellow', 'orange', 'red'],
  value: [0, 1, 2, 3, 4],
  className: ['survRadBtnGreen', 'survRadBtnBlue', 'survRadBtnYellow', 'survRadBtnOrange', 'survRadBtnRed'],
  selectionType: "radio",
  answered: '',
  label: "drymouth",
  firstQuestion: 0,
  questionNum: 13
},
];

let times = [];