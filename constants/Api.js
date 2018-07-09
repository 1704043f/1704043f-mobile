import axios from "axios";

export default {
    login: function (objUser) {
        return axios.post("http://www.medmonitor.io/api/user/login", objUser)
    },
    findUserByUsername: function () {
        return axios.get('http://www.medmonitor.io/api/user/existingUsername/john');
    },
    findPatientInfoForPatient: function (id) {
        return axios.get("http://www.medmonitor.io/api/patient/forPatient/" + id);
    },
    createNewRecord: function (id, objRecord) {
        return axios.put("http://www.medmonitor.io/api/patient/forPatient/episode/" + id, objRecord);
    },
    createVideo: function (alert) {
        return axios.post("http://www.medmonitor.io/api/video", alert);
    }
}